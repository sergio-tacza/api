package com.tacbarber.api;

import com.tacbarber.domain.Cita;
import com.tacbarber.domain.Cliente;
import com.tacbarber.domain.Servicio;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

    public static class DashboardDTO {
        public long totalClientes;
        public long totalServicios;
        public long totalCitas;
        public long citasConfirmadas;
        public long citasHoy;
    }

    @GET
    public DashboardDTO get() {
        DashboardDTO dto = new DashboardDTO();

        dto.totalClientes = Cliente.count();
        dto.totalServicios = Servicio.count();
        dto.totalCitas = Cita.count();
        dto.citasConfirmadas = Cita.count("estado = ?1", "CONFIRMADA");

        LocalDate hoy = LocalDate.now();
        LocalDateTime inicioDia = hoy.atStartOfDay();
        LocalDateTime finDia = hoy.plusDays(1).atStartOfDay();

        dto.citasHoy = Cita.count("fechaHoraInicio >= ?1 AND fechaHoraInicio < ?2",
                inicioDia, finDia);

        return dto;
    }
}
