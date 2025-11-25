package com.tacbarber.api;

import com.tacbarber.domain.Cita;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class RecordatoriosScheduler {

    @Inject
    WhatsappService whatsappService;

    /**
     * Job programado.
     *
     * Para pruebas:
     *   - every = "60s" -> se ejecuta cada 60 segundos.
     * En producción podrías poner:
     *   - every = "1h"
     */
    @Scheduled(every = "60s")
    @Transactional
    void enviarRecordatoriosPendientes() {
        LocalDateTime ahora = LocalDateTime.now();

        // Buscamos citas cuya fechaHoraInicio esté aproximadamente a 24h desde ahora
        LocalDateTime desde = ahora.plusHours(24).minusMinutes(30);
        LocalDateTime hasta = ahora.plusHours(24).plusMinutes(30);

        System.out.println("--------------------------------------------------");
        System.out.println("[Scheduler] Buscando citas entre: " + desde + " y " + hasta);

        List<Cita> citas = Cita.list(
                "fechaHoraInicio BETWEEN ?1 AND ?2 " +
                        "AND recordatorioEnviado = false",
                desde, hasta
        );

        if (citas.isEmpty()) {
            System.out.println("[Scheduler] No hay citas que necesiten recordatorio ahora mismo.");
            return;
        }

        int okCount = 0;
        int failCount = 0;

        for (Cita cita : citas) {
            boolean enviadoOk = whatsappService.enviarRecordatorio(cita);
            if (enviadoOk) {
                cita.recordatorioEnviado = true;
                okCount++;
            } else {
                failCount++;
            }
        }

        System.out.println("[Scheduler] Recordatorios OK: " + okCount + ", fallidos: " + failCount);
        System.out.println("--------------------------------------------------");
    }
}