package com.tacbarber.api;

import com.tacbarber.domain.Usuario;
import com.tacbarber.domain.Rol;
import com.tacbarber.domain.TokenRecuperacion;
import com.tacbarber.util.PasswordUtil;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    Mailer mailer;

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class LoginResponse {
        public Long userId;
        public String email;
        public String rol;
        public String mensaje;
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest req) {

        System.out.println("🔵 === INICIO LOGIN ===");
        System.out.println("📧 Email recibido: [" + req.email + "]");
        System.out.println("🔑 Password recibida: [" + req.password + "]");

        // Validar entrada
        if (req == null ||
                req.email == null || req.email.isBlank() ||
                req.password == null || req.password.isBlank()) {
            System.out.println("❌ Validación falló");
            throw new BadRequestException("Email y contraseña son obligatorios");
        }

        // Buscar usuario
        Usuario u = Usuario.find("email", req.email).firstResult();
        if (u == null) {
            System.out.println("❌ Usuario no encontrado: " + req.email);
            System.out.println("📋 Usuarios en BD:");
            for (Usuario usr : Usuario.<Usuario>listAll()) {
                System.out.println("  - " + usr.email);
            }
            throw new NotAuthorizedException("Credenciales incorrectas");
        }

        System.out.println("✅ Usuario encontrado: " + u.email);
        System.out.println("🔑 Hash en BD: " + u.passwordHash);

        // Comprobar password con BCrypt
        boolean esCorrecta = req.password.equals(u.passwordHash);
        System.out.println("🔐 ¿Password correcta? " + esCorrecta);

        if (!esCorrecta) {
            System.out.println("❌ Password incorrecta");
            throw new NotAuthorizedException("Credenciales incorrectas");
        }

        System.out.println("✅ LOGIN EXITOSO");

        // OK → devolvemos usuario
        LoginResponse resp = new LoginResponse();
        resp.userId = u.id;
        resp.email = u.email;
        resp.rol = (u.rol != null) ? u.rol.name() : Rol.EMPLEADO.name();
        resp.mensaje = "Login correcto";

        return Response.ok(resp).build();
    }

    // POST /auth/solicitar-recuperacion
    @POST
    @Path("/solicitar-recuperacion")
    @Transactional
    public Response solicitarRecuperacion(Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        // Buscar usuario por email
        System.out.println("🔍 Buscando email: [" + email + "]");
        Usuario usuario = Usuario.find("email", email).firstResult();

        if (usuario == null) {
            System.out.println("No se encontró usuario con ese email");
            System.out.println("Usuarios en BD:");
            for (Usuario u : Usuario.<Usuario>listAll()) {
                System.out.println("  - " + u.email);
            }
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        System.out.println("✅ Usuario encontrado: " + usuario.nombre);

        // Generar token único
        String token = UUID.randomUUID().toString();

        // Crear registro de recuperación
        TokenRecuperacion tokenRecup = new TokenRecuperacion();
        tokenRecup.usuario = usuario;
        tokenRecup.token = token;
        tokenRecup.fechaExpiracion = LocalDateTime.now().plusHours(1);
        tokenRecup.usado = false;
        tokenRecup.persist();

        // Enviar email
        String linkRecuperacion = "https://tacbarber.onrender.com/resetear-password.html?token=" + token;

        mailer.send(
                Mail.withText(
                        email,
                        "Recuperación de contraseña - TacBarber",
                        "Hola " + usuario.nombre + ",\n\n" +
                                "Has solicitado recuperar tu contraseña.\n\n" +
                                "Haz clic en el siguiente enlace para crear una nueva contraseña:\n" +
                                linkRecuperacion + "\n\n" +
                                "Este enlace expirará en 1 hora.\n\n" +
                                "Si no solicitaste este cambio, ignora este email.\n\n" +
                                "Saludos,\nEquipo TacBarber"
                )
        );

        return Response.ok().build();
    }

    // POST /auth/resetear-password
    @POST
    @Path("/resetear-password")
    @Transactional
    public Response resetearPassword(Map<String, String> request) {
        String token = request.get("token");
        String nuevaPassword = request.get("password");

        if (token == null || nuevaPassword == null || nuevaPassword.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Token o contraseña inválidos").build();
        }

        // Buscar token válido
        TokenRecuperacion tokenRecup = TokenRecuperacion.findByTokenValido(token);

        if (tokenRecup == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Token inválido o expirado").build();
        }

        // Cambiar contraseña
        Usuario usuario = tokenRecup.usuario;
        usuario.passwordHash = PasswordUtil.cifrarPassword(nuevaPassword);

        // Marcar token como usado
        tokenRecup.usado = true;

        return Response.ok().build();
    }

    // GET /auth/validar-token?token=xxx
    @GET
    @Path("/validar-token")
    public Response validarToken(@QueryParam("token") String token) {
        if (token == null || token.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        TokenRecuperacion tokenRecup = TokenRecuperacion.findByTokenValido(token);

        if (tokenRecup == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        return Response.ok().build();
    }
}
