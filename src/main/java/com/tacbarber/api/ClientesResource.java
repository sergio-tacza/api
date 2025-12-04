package com.tacbarber.api;

import com.tacbarber.domain.Cliente;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.List;

// Recurso REST que expone la API para gestionar clientes (listar, crear, actualizar, activar/desactivar)
@Path("/clientes")
@Produces(MediaType.APPLICATION_JSON) // Todas las respuestas se devuelven como JSON
@Consumes(MediaType.APPLICATION_JSON) // Se espera JSON en los cuerpos de las peticiones
public class ClientesResource {

    // GET /clientes?q=texto&soloActivos=true
    @GET
    public List<Cliente> list(@QueryParam("q") String q,
                              @QueryParam("soloActivos") @DefaultValue("true") boolean soloActivos) {

        // Si no hay texto de búsqueda, devolvemos todos o solo los activos según el flag
        if (q == null || q.isBlank()) {
            if (soloActivos) {
                return Cliente.list("activo = ?1", true);
            } else {
                return Cliente.listAll();
            }
        }

        // Filtro general para nombre, apellidos y email en minúsculas con LIKE
        String filtro = "%" + q.toLowerCase() + "%";

        // Búsqueda en múltiples campos, con opción de limitar a clientes activos
        if (soloActivos) {
            return Cliente.list(
                    "activo = true AND (" +
                            "lower(nombre) LIKE ?1 OR " +
                            "lower(apellidos) LIKE ?1 OR " +
                            "lower(email) LIKE ?1 OR " +
                            "telefono LIKE ?2" +
                            ")",
                    filtro, "%" + q + "%"
            );
        } else {
            return Cliente.list(
                    "lower(nombre) LIKE ?1 OR " +
                            "lower(apellidos) LIKE ?1 OR " +
                            "lower(email) LIKE ?1 OR " +
                            "telefono LIKE ?2",
                    filtro, "%" + q + "%"
            );
        }
    }

    // GET /clientes/{id} → obtener un cliente concreto por su ID
    @GET
    @Path("/{id}")
    public Cliente get(@PathParam("id") Long id) {
        Cliente c = Cliente.findById(id);
        if (c == null) {
            // Si no existe, devolvemos 404
            throw new NotFoundException("Cliente no encontrado");
        }
        return c;
    }

    // POST /clientes → crear un nuevo cliente
    @POST
    @Transactional // Inserción en BD dentro de una transacción
    public Response create(Cliente dto) {
        // Validaciones básicas de campos obligatorios
        if (dto.nombre == null || dto.nombre.isBlank()) {
            throw new BadRequestException("El nombre es obligatorio");
        }
        if (dto.telefono == null || dto.telefono.isBlank()) {
            throw new BadRequestException("El teléfono es obligatorio");
        }

        // Mapear DTO a nueva entidad Cliente
        Cliente c = new Cliente();
        c.nombre = dto.nombre;
        c.apellidos = dto.apellidos;
        c.telefono = dto.telefono;
        c.email = dto.email;
        c.notas = dto.notas;
        c.fechaAlta = LocalDateTime.now(); // Fecha de alta automática en el momento de creación
        c.activo = true; // Nuevo cliente se marca como activo por defecto

        c.persist(); // Guardar en BD
        return Response.status(Response.Status.CREATED).entity(c).build(); // 201 Created con el cliente en el body
    }

    // PUT /clientes/{id} → actualizar datos de un cliente
    @PUT
    @Path("/{id}")
    @Transactional
    public Cliente update(@PathParam("id") Long id, Cliente dto) {
        // Buscar el cliente existente
        Cliente c = Cliente.findById(id);
        if (c == null) {
            throw new NotFoundException("Cliente no encontrado");
        }

        // Solo se actualizan campos presentes y válidos en el DTO
        if (dto.nombre != null && !dto.nombre.isBlank()) {
            c.nombre = dto.nombre;
        }
        c.apellidos = dto.apellidos;
        if (dto.telefono != null && !dto.telefono.isBlank()) {
            c.telefono = dto.telefono;
        }
        c.email = dto.email;
        c.notas = dto.notas;

        // Se devuelve el cliente ya actualizado
        return c;
    }

    // PUT /clientes/{id}/desactivar → marca el cliente como inactivo
    @PUT
    @Path("/{id}/desactivar")
    @Transactional
    public Cliente desactivar(@PathParam("id") Long id) {
        Cliente c = Cliente.findById(id);
        if (c == null) {
            throw new NotFoundException("Cliente no encontrado");
        }
        c.activo = false; // Marcado como inactivo (no se borra físicamente)
        return c;
    }

    // PUT /clientes/{id}/activar → marca el cliente como activo
    @PUT
    @Path("/{id}/activar")
    @Transactional
    public Cliente activar(@PathParam("id") Long id) {
        Cliente c = Cliente.findById(id);
        if (c == null) {
            throw new NotFoundException("Cliente no encontrado");
        }
        c.activo = true; // Reactivar cliente previamente desactivado
        return c;
    }

    // DELETE /clientes/{id} → desactivar cliente (borrado lógico)
    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Cliente c = Cliente.findById(id);
        if (c == null) {
            throw new NotFoundException("Cliente no encontrado");
        }

        // Borrado lógico: no se elimina de la BD, solo se marca como inactivo
        c.activo = false;

        // Se devuelve el cliente en la respuesta para que el frontend vea el nuevo estado
        return Response.ok(c).build();
    }
}
