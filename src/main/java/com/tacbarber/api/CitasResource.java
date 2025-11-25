package com.tacbarber.api;

import com.tacbarber.domain.Cita;
import com.tacbarber.domain.Cliente;
import com.tacbarber.domain.Servicio;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Path("/citas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CitasResource {

    // ==========================
    // LISTAR CITAS (con filtro de fecha opcional)
    // ==========================
    @GET
    public List<Cita> listar(@QueryParam("fecha") String fecha) {
        if (fecha != null && !fecha.isBlank()) {
            LocalDate day = LocalDate.parse(fecha);
            LocalDateTime inicio = day.atStartOfDay();
            LocalDateTime fin = day.atTime(LocalTime.MAX);

            return Cita.list(
                    "fechaHoraInicio BETWEEN ?1 AND ?2 ORDER BY fechaHoraInicio",
                    inicio, fin
            );
        }

        return Cita.list("ORDER BY fechaHoraInicio");
    }

    // ==========================
    // OBTENER CITA POR ID
    // ==========================
    @GET
    @Path("/{id}")
    public Cita obtener(@PathParam("id") Long id) {
        Cita cita = Cita.findById(id);
        if (cita == null) {
            throw new NotFoundException("Cita no encontrada");
        }
        return cita;
    }

    // ==========================
    // CREAR CITA
    // ==========================
    /**
     * JSON esperado (lo manda tu frontend):
     *
     * {
     *   "cliente": { "id": 1 },
     *   "servicio": { "id": 2 },
     *   "fechaHoraInicio": "2025-11-17T10:00",
     *   "notas": "degradado alto"
     * }
     */
    @POST
    @Transactional
    public Response crear(Cita dto) {
        if (dto == null
                || dto.cliente == null || dto.cliente.id == null
                || dto.servicio == null || dto.servicio.id == null
                || dto.fechaHoraInicio == null) {

            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("cliente.id, servicio.id y fechaHoraInicio son obligatorios")
                    .build();
        }

        Cliente cliente = Cliente.findById(dto.cliente.id);
        Servicio servicio = Servicio.findById(dto.servicio.id);

        if (cliente == null || servicio == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Cliente o servicio no existe")
                    .build();
        }

        Cita cita = new Cita();
        cita.cliente = cliente;
        cita.servicio = servicio;
        cita.fechaHoraInicio = dto.fechaHoraInicio;
        cita.estado = "PENDIENTE";
        cita.notas = dto.notas;

        // Calculamos fechaHoraFin a partir de la duración del servicio (si existe)
        if (servicio.duracionMin != null && dto.fechaHoraInicio != null) {
            cita.fechaHoraFin = dto.fechaHoraInicio.plusMinutes(servicio.duracionMin);
        }

        cita.persist();

        return Response.status(Response.Status.CREATED)
                .entity(cita)
                .build();
    }

    // ==========================
    // CAMBIAR ESTADO: CANCELAR
    // ==========================
    @PUT
    @Path("/{id}/cancelar")
    @Transactional
    public Response cancelar(@PathParam("id") Long id) {
        Cita cita = Cita.findById(id);
        if (cita == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        cita.estado = "CANCELADA";
        return Response.noContent().build();
    }

    // ==========================
    // CAMBIAR ESTADO: CONFIRMAR
    // ==========================
    @PUT
    @Path("/{id}/confirmar")
    @Transactional
    public Response confirmar(@PathParam("id") Long id) {
        Cita cita = Cita.findById(id);
        if (cita == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        cita.estado = "CONFIRMADA";
        return Response.noContent().build();
    }

    // ==========================
    // CAMBIAR ESTADO: COMPLETAR
    // ==========================
    @PUT
    @Path("/{id}/completar")
    @Transactional
    public Response completar(@PathParam("id") Long id) {
        Cita cita = Cita.findById(id);
        if (cita == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        cita.estado = "COMPLETADA";
        return Response.noContent().build();
    }

    // ==========================
    // ELIMINAR CITA
    // ==========================
    @DELETE
    @Path("/{id}")
    @Transactional
    public Response eliminar(@PathParam("id") Long id) {
        boolean deleted = Cita.deleteById(id);
        if (!deleted) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.noContent().build();
    }
}