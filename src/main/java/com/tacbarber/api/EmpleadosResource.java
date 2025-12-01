package com.tacbarber.api;

import com.tacbarber.domain.Usuario;
import com.tacbarber.domain.Rol;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import com.tacbarber.domain.Rol;
import com.tacbarber.util.PasswordUtil;
import java.time.LocalDateTime;
import java.util.List;

@Path("/empleados")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmpleadosResource {

    // GET /empleados - Listar todos los empleados activos
    @GET
    public List<Usuario> listar(@QueryParam("soloActivos") @DefaultValue("true") boolean soloActivos) {
        if (soloActivos) {
            return Usuario.list("activo = true AND rol != ?1 ORDER BY id DESC", Rol.ADMIN);
        } else {
            return Usuario.list("rol != ?1 ORDER BY id DESC", Rol.ADMIN);
        }
    }


    // GET /empleados/{id}
    @GET
    @Path("/{id}")
    public Usuario obtener(@PathParam("id") Long id) {
        Usuario empleado = Usuario.findById(id);
        if (empleado == null) {
            throw new NotFoundException("Empleado no encontrado");
        }
        return empleado;
    }

    // POST /empleados - Crear nuevo empleado
    @POST
    @Transactional
    public Response crear(Usuario dto) {
        if (dto.nombre == null || dto.nombre.isBlank()) {
            throw new BadRequestException("El nombre es obligatorio");
        }
        if (dto.email == null || dto.email.isBlank()) {
            throw new BadRequestException("El email es obligatorio");
        }
        if (dto.passwordHash == null || dto.passwordHash.isBlank()) {
            throw new BadRequestException("La contraseña es obligatoria");
        }

        Usuario empleado = new Usuario();
        empleado.nombre = dto.nombre;
        empleado.apellidos = dto.apellidos;
        empleado.email = dto.email;
        empleado.passwordHash = PasswordUtil.cifrarPassword(dto.passwordHash);
        empleado.rol = (dto.rol != null) ? dto.rol : Rol.EMPLEADO;
        empleado.telefono = dto.telefono;
        empleado.fechaAlta = LocalDateTime.now();
        empleado.activo = true;

        empleado.persist();
        return Response.status(Response.Status.CREATED).entity(empleado).build();
    }

    // PUT /empleados/{id} - Actualizar empleado
    @PUT
    @Path("/{id}")
    @Transactional
    public Usuario actualizar(@PathParam("id") Long id, Usuario dto) {
        Usuario empleado = Usuario.findById(id);
        if (empleado == null) {
            throw new NotFoundException("Empleado no encontrado");
        }

        if (dto.nombre != null && !dto.nombre.isBlank()) {
            empleado.nombre = dto.nombre;
        }
        empleado.apellidos = dto.apellidos;
        empleado.telefono = dto.telefono;

        if (dto.email != null && !dto.email.isBlank()) {
            empleado.email = dto.email;
        }

        if (dto.rol != null) {
            empleado.rol = dto.rol;
        }

        return empleado;
    }

    // PUT /empleados/{id}/desactivar
    @PUT
    @Path("/{id}/desactivar")
    @Transactional
    public Usuario desactivar(@PathParam("id") Long id) {
        Usuario empleado = Usuario.findById(id);
        if (empleado == null) {
            throw new NotFoundException("Empleado no encontrado");
        }
        empleado.activo = false;
        return empleado;
    }

    // PUT /empleados/{id}/activar
    @PUT
    @Path("/{id}/activar")
    @Transactional
    public Usuario activar(@PathParam("id") Long id) {
        Usuario empleado = Usuario.findById(id);
        if (empleado == null) {
            throw new NotFoundException("Empleado no encontrado");
        }
        empleado.activo = true;
        return empleado;
    }

    // DELETE /empleados/{id} - Borrado físico (opcional)
    @DELETE
    @Path("/{id}")
    @Transactional
    public Response eliminar(@PathParam("id") Long id) {
        boolean deleted = Usuario.deleteById(id);
        if (!deleted) {
            throw new NotFoundException("Empleado no encontrado");
        }
        return Response.noContent().build();
    }
}
