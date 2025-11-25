package com.tacbarber.api;

import com.tacbarber.domain.Cita;
import com.tacbarber.domain.Cliente;
import com.tacbarber.domain.Servicio;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@ApplicationScoped
public class WhatsappService {

    @ConfigProperty(name = "tacbarber.whatsapp.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "tacbarber.whatsapp.phone-number-id")
    Optional<String> phoneNumberId;

    @ConfigProperty(name = "tacbarber.whatsapp.access-token")
    Optional<String> accessToken;

    @ConfigProperty(name = "tacbarber.whatsapp.api-version", defaultValue = "v20.0")
    String apiVersion;

    private static final DateTimeFormatter FECHA_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORA_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm");

    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Envía un mensaje de recordatorio usando WhatsApp Cloud API.
     * - Si enabled = false, solo simula (imprime por consola).
     * - Si enabled = true y hay credenciales, llama a la API real.
     *
     * @return true si la llamada real devuelve 2xx. En modo simulado devuelve false.
     */
    public boolean enviarRecordatorio(Cita cita) {
        if (cita == null) {
            System.out.println("[WhatsApp] Cita nula, no se puede enviar nada.");
            return false;
        }

        // Si está desactivado en properties -> simulamos
        if (!enabled) {
            System.out.println("[WhatsApp] Desactivado por configuración. Simulando envío.");
            simularEnvio(cita);
            return false;
        }

        // Si faltan credenciales -> simulamos
        if (phoneNumberId.isEmpty() || accessToken.isEmpty()) {
            System.out.println("[WhatsApp] Faltan credenciales (phoneNumberId o accessToken). Simulando envío.");
            simularEnvio(cita);
            return false;
        }

        Cliente cliente = cita.cliente;
        Servicio servicio = cita.servicio;

        if (cliente == null || cliente.telefono == null || cliente.telefono.isBlank()) {
            System.out.println("[WhatsApp] La cita no tiene teléfono de cliente. No se puede enviar.");
            return false;
        }

        // Normalizamos el teléfono: solo dígitos
        String rawTel = cliente.telefono.replaceAll("\\D", "");
        if (!rawTel.startsWith("34")) {
            rawTel = "34" + rawTel;
        }

        String nombreCliente = (cliente.nombre != null ? cliente.nombre : "cliente");
        if (cliente.apellidos != null && !cliente.apellidos.isBlank()) {
            nombreCliente += " " + cliente.apellidos;
        }

        String nombreServicio = (servicio != null && servicio.nombre != null)
                ? servicio.nombre
                : "tu cita";

        String fecha = cita.fechaHoraInicio != null
                ? cita.fechaHoraInicio.format(FECHA_FORMAT)
                : "(sin fecha)";

        String hora = cita.fechaHoraInicio != null
                ? cita.fechaHoraInicio.format(HORA_FORMAT)
                : "(sin hora)";

        String body = String.format(
                "Hola %s, te recordamos tu cita en TacBarber para %s el %s a las %s. " +
                        "Si no puedes asistir, avísanos respondiendo a este mensaje.",
                nombreCliente, nombreServicio, fecha, hora
        );

        try {
            String url = String.format(
                    "https://graph.facebook.com/%s/%s/messages",
                    apiVersion,
                    phoneNumberId.get()
            );

            // Evitamos comillas dobles en el texto para no romper el JSON
            String safeBody = body.replace("\"", "'");

            String json = """
                    {
                      "messaging_product": "whatsapp",
                      "to": "%s",
                      "type": "text",
                      "text": {
                        "body": "%s"
                      }
                    }
                    """.formatted(rawTel, safeBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + accessToken.get())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            int status = response.statusCode();
            System.out.println("[WhatsApp] Respuesta HTTP: " + status);
            System.out.println("[WhatsApp] Body: " + response.body());

            // Éxito si es 2xx
            return status >= 200 && status < 300;

        } catch (Exception e) {
            System.out.println("[WhatsApp] Error al llamar a la API:");
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Modo simulación: imprime por consola qué mensaje se enviaría.
     */
    private void simularEnvio(Cita cita) {
        Cliente cliente = cita.cliente;
        Servicio servicio = cita.servicio;

        String telefono = (cliente != null ? cliente.telefono : "(sin teléfono)");
        String nombreCliente = (cliente != null && cliente.nombre != null)
                ? cliente.nombre
                : "cliente";

        String nombreServicio = (servicio != null && servicio.nombre != null)
                ? servicio.nombre
                : "servicio";

        String fecha = cita.fechaHoraInicio != null
                ? cita.fechaHoraInicio.format(FECHA_FORMAT)
                : "(sin fecha)";

        String hora = cita.fechaHoraInicio != null
                ? cita.fechaHoraInicio.format(HORA_FORMAT)
                : "(sin hora)";

        String mensaje = String.format(
                "Hola %s, te recordamos tu cita en TacBarber para %s el %s a las %s.",
                nombreCliente, nombreServicio, fecha, hora
        );

        System.out.println("[SIMULADO] Enviar WhatsApp a: " + telefono);
        System.out.println("[SIMULADO] Mensaje: " + mensaje);
    }
}