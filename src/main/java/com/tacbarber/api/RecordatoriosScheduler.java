package com.tacbarber.api;

import com.tacbarber.domain.Cita;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Bean de aplicación que se encarga de lanzar tareas programadas (scheduler) para recordatorios
@ApplicationScoped
public class RecordatoriosScheduler {

    @Inject
    WhatsappService whatsappService; // Servicio encargado de enviar mensajes de WhatsApp con el recordatorio

    /**
     * Job programado para enviar recordatorios de citas.
     *
     * Para pruebas:
     *   - every = "60s" -> se ejecuta cada 60 segundos.
     * En producción podrías poner:
     *   - every = "1h" u otro intervalo según necesidad.
     */
    @Scheduled(every = "60s") // Programa el método para que se ejecute automáticamente cada 60 segundos
    @Transactional // Necesario para actualizar las citas en la base de datos dentro de una transacción
    void enviarRecordatoriosPendientes() {
        LocalDateTime ahora = LocalDateTime.now();

        // Calculamos una ventana de tiempo alrededor de las próximas 24 horas (entre -30 y +30 min)
        LocalDateTime desde = ahora.plusHours(24).minusMinutes(30);
        LocalDateTime hasta = ahora.plusHours(24).plusMinutes(30);

        System.out.println("--------------------------------------------------");
        System.out.println("[Scheduler] Buscando citas entre: " + desde + " y " + hasta);

        // Buscamos citas cuya fechaHoraInicio esté en esa ventana y que aún no tengan recordatorio enviado
        List<Cita> citas = Cita.list(
                "fechaHoraInicio BETWEEN ?1 AND ?2 " +
                        "AND recordatorioEnviado = false",
                desde, hasta
        );

        if (citas.isEmpty()) {
            // Si no hay citas en esa franja, simplemente se registra y se termina el job
            System.out.println("[Scheduler] No hay citas que necesiten recordatorio ahora mismo.");
            return;
        }

        int okCount = 0;   // Contador de recordatorios enviados correctamente
        int failCount = 0; // Contador de fallos al enviar

        // Recorremos cada cita pendiente de recordatorio
        for (Cita cita : citas) {
            boolean enviadoOk = whatsappService.enviarRecordatorio(cita); // Envía el mensaje por WhatsApp
            if (enviadoOk) {
                // Si se envía bien, marcamos la cita como recordatorio enviado para no repetir
                cita.recordatorioEnviado = true;
                okCount++;
            } else {
                // Si falla el envío, solo sumamos al contador de fallos (se puede reintentar en otra pasada)
                failCount++;
            }
        }

        // Log resumen del proceso
        System.out.println("[Scheduler] Recordatorios OK: " + okCount + ", fallidos: " + failCount);
        System.out.println("--------------------------------------------------");
    }
}
