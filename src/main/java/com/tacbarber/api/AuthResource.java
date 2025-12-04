package com.tacbarber.api;

import com.tacbarber.domain.Usuario;
import com.tacbarber.domain.Rol;
import com.tacbarber.domain.TokenRecuperacion;
import com.tacbarber.util.PasswordUtil;
import com.tacbarber.util.EmailService;
import io.quarkus.hibernate.orm.panache.Panache;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Path("/auth") // Recurso REST que expone endpoints bajo la ruta /auth (login, recuperación, etc.)
@Produces(MediaType.APPLICATION_JSON) // Todas las respuestas serán JSON
@Consumes(MediaType.APPLICATION_JSON) // Todos los cuerpos de petición se esperan en JSON
public class AuthResource {

    @Inject
    EmailService emailService; // Servicio para enviar emails (por ejemplo, para recuperación de contraseña)

    // DTO de entrada para el login: lo que recibe el backend desde el frontend
    public static class LoginRequest {
        public String email;
        public String password;
    }

    // DTO de salida para el login: lo que se devuelve al frontend tras autenticar
    public static class LoginResponse {
        public Long userId;
        public String email;
        public String rol;
        public String mensaje;
    }

    @POST
    @Path("/login") // Endpoint POST /auth/login
    public Response login(LoginRequest req) {

        // Logs de depuración para ver qué datos llegan al endpoint
        System.out.println(" === INICIO LOGIN ===");
        System.out.println(" Email recibido: [" + req.email + "]");
        System.out.println(" Password recibida: [" + req.password + "]");

        // Validar que la petición tiene email y password no vacíos
        if (req == null ||
                req.email == null || req.email.isBlank() ||
                req.password == null || req.password.isBlank()) {
            System.out.println(" Validación falló");
            throw new BadRequestException("Email y contraseña son obligatorios");
        }

        // Buscar usuario en base de datos por email
        Usuario u = Usuario.find("email", req.email).firstResult();
        if (u == null) {
            // Si no se encuentra, se listan usuarios para depuración y se lanza error de credenciales
            System.out.println(" Usuario no encontrado: " + req.email);
            System.out.println(" Usuarios en BD:");
            for (Usuario usr : Usuario.<Usuario>listAll()) {
                System.out.println("  - " + usr.email);
            }
            throw new NotAuthorizedException("Credenciales incorrectas");
        }

        System.out.println(" Usuario encontrado: " + u.email);
        System.out.println(" Hash en BD: " + u.passwordHash);

        // Verificar contraseña usando BCrypt a través de PasswordUtil
        boolean esCorrecta = PasswordUtil.verificarPassword(req.password, u.passwordHash);
        System.out.println(" ¿Password correcta? " + esCorrecta);

        if (!esCorrecta) {
            // Si la contraseña no coincide, se devuelve error de credenciales
            System.out.println(" Password incorrecta");
            throw new NotAuthorizedException("Credenciales incorrectas");
        }

        System.out.println(" LOGIN EXITOSO");

        // Construir respuesta de login con datos básicos del usuario
        LoginResponse resp = new LoginResponse();
        resp.userId = u.id;
        resp.email = u.email;
        // Si el usuario tiene rol, se usa; si no, por defecto EMPLEADO
        resp.rol = (u.rol != null) ? u.rol.name() : Rol.EMPLEADO.name();
        resp.mensaje = "Login correcto";

        return Response.ok(resp).build(); // Devolver 200 OK con el JSON del usuario
    }

    // Endpoint para iniciar proceso de recuperación de contraseña
    // POST /auth/solicitar-recuperacion
    @POST
    @Path("/solicitar-recuperacion")
    public Response solicitarRecuperacion(Map<String, String> request) {
        // Se espera un JSON con una clave "email"
        String email = request.get("email");

        // Validación de email
        if (email == null || email.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        // Buscar usuario ignorando mayúsculas/minúsculas en el email
        Usuario usuario = Usuario.find("LOWER(email) = LOWER(?1)", email.trim()).firstResult();

        if (usuario == null) {
            // Si no existe usuario con ese email, se devuelve 404
            System.out.println(" No se encontró usuario con email: " + email);
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        System.out.println(" Usuario encontrado: " + usuario.nombre);

        // Generar token único de recuperación (UUID)
        String token = UUID.randomUUID().toString();

        // Guardar token de recuperación en la BD en una transacción aparte
        guardarTokenRecuperacion(usuario, token);

        // Construir enlace de recuperación que se enviará por email
        String linkRecuperacion = "https://tacbarber.onrender.com/resetear-password.html?token=" + token;

        try {
            // Enviar email de recuperación al usuario
            emailService.enviarEmail(
                    email,
                    "Recuperación de contraseña - TacBarber",
                    "Hola " + usuario.nombre + ",\n\n" +
                            "Has solicitado recuperar tu contraseña.\n\n" +
                            "Haz clic en el siguiente enlace para crear una nueva contraseña:\n" +
                            linkRecuperacion + "\n\n" +
                            "Este enlace expirará en 1 hora.\n\n" +
                            "Si no solicitaste este cambio, ignora este email.\n\n" +
                            "Saludos,\nEquipo TacBarber"
            );
            System.out.println(" Email enviado correctamente");
        } catch (Exception e) {
            // Si falla el envío de email, solo se registra el error; el token ya está guardado
            System.err.println(" Error enviando email: " + e.getMessage());
            // Continuamos aunque falle el email, el token ya está guardado
        }

        // Respuesta 200 OK sin cuerpo: el proceso de solicitud se ha aceptado
        return Response.ok().build();
    }

    @Transactional // Indica que este método se ejecuta dentro de una transacción de BD
    public void guardarTokenRecuperacion(Usuario usuario, String token) {
        // Crear entidad TokenRecuperacion asociada al usuario
        TokenRecuperacion tokenRecup = new TokenRecuperacion();
        tokenRecup.usuario = usuario;
        tokenRecup.token = token;
        // El token expira en 1 hora desde el momento actual
        tokenRecup.fechaExpiracion = LocalDateTime.now().plusHours(1);
        tokenRecup.usado = false; // Marcado como no usado inicialmente
        tokenRecup.persist(); // Persistir en la base de datos
    }

    // Endpoint para cambiar la contraseña usando el token de recuperación
    // POST /auth/resetear-password
    @POST
    @Path("/resetear-password")
    @Transactional // Se actualiza la contraseña y el token dentro de una misma transacción
    public Response resetearPassword(Map<String, String> request) {
        // Se espera un JSON con "token" y "password"
        String token = request.get("token");
        String nuevaPassword = request.get("password");

        // Validación básica de datos
        if (token == null || nuevaPassword == null || nuevaPassword.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Token o contraseña inválidos").build();
        }

        // Buscar token válido (no expirado y no usado) mediante método estático de la entidad
        TokenRecuperacion tokenRecup = TokenRecuperacion.findByTokenValido(token);

        if (tokenRecup == null) {
            // Si no se encuentra, se indica que el token es inválido o ha expirado
            return Response.status(Response.Status.BAD_REQUEST).entity("Token inválido o expirado").build();
        }

        // Obtener usuario asociado al token y actualizar su contraseña cifrada
        Usuario usuario = tokenRecup.usuario;
        usuario.passwordHash = PasswordUtil.cifrarPassword(nuevaPassword);

        // Marcar el token como usado para que no pueda reutilizarse
        tokenRecup.usado = true;

        // Responder OK indicando que la contraseña se ha actualizado correctamente
        return Response.ok().build();
    }

    // Endpoint para validar desde el frontend si un token de recuperación es válido
    // GET /auth/validar-token?token=xxx
    @GET
    @Path("/validar-token")
    public Response validarToken(@QueryParam("token") String token) {
        // Validación del parámetro token
        if (token == null || token.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        // Comprobar si existe un token válido en la BD
        TokenRecuperacion tokenRecup = TokenRecuperacion.findByTokenValido(token);

        if (tokenRecup == null) {
            // Si no existe o no es válido, devolver 404
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Si es válido, devolver 200 OK (sin cuerpo); esto le vale al frontend para permitir el formulario
        return Response.ok().build();
    }
}
