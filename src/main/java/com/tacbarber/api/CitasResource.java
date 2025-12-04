package com.tacbarber.api;

import com.tacbarber.domain.Cita;
import com.tacbarber.domain.Cliente;
import com.tacbarber.domain.Servicio;
import com.tacbarber.domain.Usuario;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

// Recurso REST que gestiona todo lo relacionado con las citas (CRUD + cambios de estado)
@Path("/citas")
@Produces(MediaType.APPLICATION_JSON) // Todas las respuestas se devuelven en JSON
@Consumes(MediaType.APPLICATION_JSON) // Todas las peticiones esperan JSON en el cuerpo
public class CitasResource {

    // ==========================
    // LISTAR CITAS (con filtro de fecha y barbero opcionales)
    // ==========================
    @GET
    public List<Cita> listar(
            @QueryParam("fecha") String fecha,       // Parámetro opcional de fecha (ej: 2025-11-17)
            @QueryParam("barberoId") Long barberoId) { // Parámetro opcional para filtrar por barbero

        // Filtro por fecha Y barbero: citas de un día concreto para un barbero concreto
        if (fecha != null && !fecha.isBlank() && barberoId != null) {
            LocalDate day = LocalDate.parse(fecha);
            LocalDateTime inicio = day.atStartOfDay();       // 00:00 del día
            LocalDateTime fin = day.atTime(LocalTime.MAX);   // 23:59:59.999999999 del día

            // Consulta Panache: filtra por rango de fecha/hora y por barbero
            return Cita.list(
                    "fechaHoraInicio BETWEEN ?1 AND ?2 AND barbero.id = ?3 ORDER BY fechaHoraInicio",
                    inicio, fin, barberoId
            );
        }

        // Solo filtro por fecha: todas las citas de un día, sin importar el barbero
        if (fecha != null && !fecha.isBlank()) {
            LocalDate day = LocalDate.parse(fecha);
            LocalDateTime inicio = day.atStartOfDay();
            LocalDateTime fin = day.atTime(LocalTime.MAX);

            return Cita.list(
                    "fechaHoraInicio BETWEEN ?1 AND ?2 ORDER BY fechaHoraInicio",
                    inicio, fin
            );
        }

        // Solo filtro por barbero: todas las citas de ese barbero, cualquier día
        if (barberoId != null) {
            return Cita.list(
                    "barbero.id = ?1 ORDER BY fechaHoraInicio",
                    barberoId
            );
        }

        // Sin filtros: devuelve todas las citas ordenadas por fecha/hora de inicio
        return Cita.list("ORDER BY fechaHoraInicio");
    }


    // ==========================
    // OBTENER CITA POR ID
    // ==========================
    @GET
    @Path("/{id}") // Endpoint GET /citas/{id}
    public Cita obtener(@PathParam("id") Long id) {
        // Busca la cita por ID; si no existe, lanza 404
        Cita cita = Cita.findById(id);
        if (cita == null) {
            throw new NotFoundException("Cita no encontrada");
        }
        // Devuelve la entidad Cita directamente en JSON
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
     *   "barbero": { "id": 3 },  ← NUEVO (opcional)
     *   "fechaHoraInicio": "2025-11-17T10:00",
     *   "notas": "degradado alto"
     * }
     */
    @POST
    @Transactional // Se ejecuta dentro de una transacción (creación y persistencia de la cita)
    public Response crear(Cita dto) {
        // Validación de campos mínimos obligatorios en el DTO
        if (dto == null
                || dto.cliente == null || dto.cliente.id == null
                || dto.servicio == null || dto.servicio.id == null
                || dto.fechaHoraInicio == null) {

            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("cliente.id, servicio.id y fechaHoraInicio son obligatorios")
                    .build();
        }

        // Cargar entidades reales desde la BD a partir de los IDs del DTO
        Cliente cliente = Cliente.findById(dto.cliente.id);
        Servicio servicio = Servicio.findById(dto.servicio.id);

        // Si cliente o servicio no existen, se devuelve error
        if (cliente == null || servicio == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Cliente o servicio no existe")
                    .build();
        }

        // Crear nueva instancia de Cita y mapear campos desde el DTO
        Cita cita = new Cita();
        cita.cliente = cliente;
        cita.servicio = servicio;
        cita.fechaHoraInicio = dto.fechaHoraInicio;
        cita.estado = "PENDIENTE"; // Estado inicial por defecto
        cita.notas = dto.notas;

        // NUEVO: Asignar barbero si viene en el DTO (relación con Usuario)
        if (dto.barbero != null && dto.barbero.id != null) {
            Usuario barbero = Usuario.findById(dto.barbero.id);
            if (barbero != null) {
                cita.barbero = barbero;
            }
        }

        // Calcular fechaHoraFin automáticamente según la duración del servicio
        if (servicio.duracionMin != null && dto.fechaHoraInicio != null) {
            cita.fechaHoraFin = dto.fechaHoraInicio.plusMinutes(servicio.duracionMin);
        }

        // Persistir la cita en la base de datos
        cita.persist();

        // Devolver 201 CREATED con la cita creada en el cuerpo
        return Response.status(Response.Status.CREATED)
                .entity(cita)
                .build();
    }


    // ==========================
    // CAMBIAR ESTADO: CANCELAR
    // ==========================
    @PUT
    @Path("/{id}/cancelar") // Endpoint PUT /citas/{id}/cancelar
    @Transactional
    public Response cancelar(@PathParam("id") Long id) {
        // Buscar la cita a cancelar
        Cita cita = Cita.findById(id);
        if (cita == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        // Cambiar el estado a CANCELADA
        cita.estado = "CANCELADA";
        // No se devuelve contenido, solo código 204
        return Response.noContent().build();
    }

    // ==========================
    // CAMBIAR ESTADO: CONFIRMAR
    // ==========================
    @PUT
    @Path("/{id}/confirmar") // Endpoint PUT /citas/{id}/confirmar
    @Transactional
    public Response confirmar(@PathParam("id") Long id) {
        Cita cita = Cita.findById(id);
        if (cita == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        // Cambiar el estado a CONFIRMADA
        cita.estado = "CONFIRMADA";
        return Response.noContent().build();
    }

    // ==========================
    // CAMBIAR ESTADO: COMPLETAR
    // ==========================
    @PUT
    @Path("/{id}/completar") // Endpoint PUT /citas/{id}/completar
    @Transactional
    public Response completar(@PathParam("id") Long id) {
        Cita cita = Cita.findById(id);
        if (cita == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        // Cambiar el estado a COMPLETADA (servicio realizado)
        cita.estado = "COMPLETADA";
        return Response.noContent().build();
    }

    // ==========================
    // ELIMINAR CITA
    // ==========================
    @DELETE
    @Path("/{id}") // Endpoint DELETE /citas/{id}
    @Transactional
    public Response eliminar(@PathParam("id") Long id) {
        // deleteById devuelve true si se ha eliminado una fila, false si no existía
        boolean deleted = Cita.deleteById(id);
        if (!deleted) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        // 204 No Content cuando la eliminación ha sido correcta
        return Response.noContent().build();
    }
}
