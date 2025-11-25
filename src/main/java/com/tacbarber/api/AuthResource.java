package com.tacbarber.api;

import com.tacbarber.domain.Usuario;
import com.tacbarber.domain.Rol;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class LoginResponse {
        public Long userId;
        public String email;
        public String rol;   // string pa frontend
        public String mensaje;
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest req) {

        // Validar entrada
        if (req == null ||
                req.email == null || req.email.isBlank() ||
                req.password == null || req.password.isBlank()) {
            throw new BadRequestException("Email y contraseña son obligatorios");
        }

        // Buscar usuario
        Usuario u = Usuario.find("email", req.email).firstResult();
        if (u == null) {
            throw new NotAuthorizedException("Credenciales incorrectas");
        }

        // Comprobar password (tú aun usas texto plano)
        if (!u.passwordHash.equals(req.password)) {
            throw new NotAuthorizedException("Credenciales incorrectas");
        }

        // OK → devolvemos usuario
        LoginResponse resp = new LoginResponse();
        resp.userId = u.id;
        resp.email = u.email;
        resp.rol = (u.rol != null) ? u.rol.name() : Rol.EMPLEADO.name();
        resp.mensaje = "Login correcto";

        return Response.ok(resp).build();
    }
}