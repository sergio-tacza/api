package com.tacbarber.api;

import com.tacbarber.domain.Cliente;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.List;

@Path("/clientes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClientesResource {

    // GET /clientes?q=texto&soloActivos=true
    @GET
    public List<Cliente> list(@QueryParam("q") String q,
                              @QueryParam("soloActivos") @DefaultValue("true") boolean soloActivos) {

        if (q == null || q.isBlank()) {
            if (soloActivos) {
                return Cliente.list("activo = ?1", true);
            } else {
                return Cliente.listAll();
            }
        }

        String filtro = "%" + q.toLowerCase() + "%";

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

    // GET /clientes/{id}
    @GET
    @Path("/{id}")
    public Cliente get(@PathParam("id") Long id) {
        Cliente c = Cliente.findById(id);
        if (c == null) {
            throw new NotFoundException("Cliente no encontrado");
        }
        return c;
    }

    // POST /clientes
    @POST
    @Transactional
    public Response create(Cliente dto) {
        if (dto.nombre == null || dto.nombre.isBlank()) {
            throw new BadRequestException("El nombre es obligatorio");
        }
        if (dto.telefono == null || dto.telefono.isBlank()) {
            throw new BadRequestException("El teléfono es obligatorio");
        }

        Cliente c = new Cliente();
        c.nombre = dto.nombre;
        c.apellidos = dto.apellidos;
        c.telefono = dto.telefono;
        c.email = dto.email;
        c.notas = dto.notas;
        c.fechaAlta = LocalDateTime.now();
        c.activo = true;

        c.persist();
        return Response.status(Response.Status.CREATED).entity(c).build();
    }

    // PUT /clientes/{id}
    @PUT
    @Path("/{id}")
    @Transactional
    public Cliente update(@PathParam("id") Long id, Cliente dto) {
        Cliente c = Cliente.findById(id);
        if (c == null) {
            throw new NotFoundException("Cliente no encontrado");
        }

        if (dto.nombre != null && !dto.nombre.isBlank()) {
            c.nombre = dto.nombre;
        }
        c.apellidos = dto.apellidos;
        if (dto.telefono != null && !dto.telefono.isBlank()) {
            c.telefono = dto.telefono;
        }
        c.email = dto.email;
        c.notas = dto.notas;

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
        c.activo = false;
        return c;
    }

    // DELETE /clientes/{id} → borrado real (por si lo quieres mantener)
    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") Long id) {
        boolean deleted = Cliente.deleteById(id);
        if (!deleted) {
            throw new NotFoundException("Cliente no encontrado");
        }
    }
}
