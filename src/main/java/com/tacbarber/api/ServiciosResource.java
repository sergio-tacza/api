package com.tacbarber.api;

import com.tacbarber.domain.Servicio;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.util.List;

@Path("/servicios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ServiciosResource {

    // GET /servicios?q=texto&soloActivos=true
    @GET
    public List<Servicio> list(@QueryParam("q") String q,
                               @QueryParam("soloActivos") @DefaultValue("true") boolean soloActivos) {

        if (q == null || q.isBlank()) {
            if (soloActivos) {
                return Servicio.list("activo = ?1", true);
            } else {
                return Servicio.listAll();
            }
        }

        String filtro = "%" + q.toLowerCase() + "%";

        if (soloActivos) {
            return Servicio.list(
                    "activo = true AND lower(nombre) LIKE ?1",
                    filtro
            );
        } else {
            return Servicio.list(
                    "lower(nombre) LIKE ?1",
                    filtro
            );
        }
    }

    // GET /servicios/{id}
    @GET
    @Path("/{id}")
    public Servicio get(@PathParam("id") Long id) {
        Servicio s = Servicio.findById(id);
        if (s == null) {
            throw new NotFoundException("Servicio no encontrado");
        }
        return s;
    }

    // POST /servicios
    @POST
    @Transactional
    public Response create(Servicio dto) {
        if (dto.nombre == null || dto.nombre.isBlank()) {
            throw new BadRequestException("El nombre es obligatorio");
        }
        if (dto.duracionMin == null || dto.duracionMin <= 0) {
            throw new BadRequestException("La duración debe ser mayor que 0");
        }
        if (dto.precio == null || dto.precio.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El precio debe ser mayor que 0");
        }

        Servicio s = new Servicio();
        s.nombre = dto.nombre;
        s.duracionMin = dto.duracionMin;
        s.precio = dto.precio;
        s.activo = true;

        s.persist();
        return Response.status(Response.Status.CREATED).entity(s).build();
    }

    // PUT /servicios/{id}
    @PUT
    @Path("/{id}")
    @Transactional
    public Servicio update(@PathParam("id") Long id, Servicio dto) {
        Servicio s = Servicio.findById(id);
        if (s == null) {
            throw new NotFoundException("Servicio no encontrado");
        }

        if (dto.nombre != null && !dto.nombre.isBlank()) {
            s.nombre = dto.nombre;
        }
        if (dto.duracionMin != null && dto.duracionMin > 0) {
            s.duracionMin = dto.duracionMin;
        }
        if (dto.precio != null && dto.precio.compareTo(BigDecimal.ZERO) > 0) {
            s.precio = dto.precio;
        }

        return s;
    }

    // PUT /servicios/{id}/desactivar
    @PUT
    @Path("/{id}/desactivar")
    @Transactional
    public Servicio desactivar(@PathParam("id") Long id) {
        Servicio s = Servicio.findById(id);
        if (s == null) {
            throw new NotFoundException("Servicio no encontrado");
        }
        s.activo = false;
        return s;
    }

    //PUT /servicios/{id}/activar
    @PUT
    @Path("/{id}/activar")
    @Transactional
    public Servicio activar(@PathParam("id") Long id) {
        Servicio s = Servicio.findById(id);
        if (s == null) {
            throw new NotFoundException("Servicio no encontrado");
        }
        s.activo = true;
        return s;
    }

    // DELETE /servicios/{id}
    @DELETE
    @Path("/{id}")
    @Transactional
    public void delete(@PathParam("id") Long id) {
        boolean deleted = Servicio.deleteById(id);
        if (!deleted) {
            throw new NotFoundException("Servicio no encontrado");
        }
    }
}