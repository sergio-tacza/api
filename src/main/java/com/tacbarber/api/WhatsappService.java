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

// Servicio de aplicación encargado de construir y enviar mensajes de WhatsApp (o simularlos)
@ApplicationScoped
public class WhatsappService {

    // Flag de configuración para activar/desactivar el envío real de WhatsApp
    @ConfigProperty(name = "tacbarber.whatsapp.enabled", defaultValue = "false")
    boolean enabled;

    // ID del número de teléfono de WhatsApp Cloud API (configurado por properties/env)
    @ConfigProperty(name = "tacbarber.whatsapp.phone-number-id")
    Optional<String> phoneNumberId;

    // Token de acceso a la API de Meta/WhatsApp (configurado por properties/env)
    @ConfigProperty(name = "tacbarber.whatsapp.access-token")
    Optional<String> accessToken;

    // Versión de la API de Graph a utilizar
    @ConfigProperty(name = "tacbarber.whatsapp.api-version", defaultValue = "v20.0")
    String apiVersion;

    // Formatos reutilizados para mostrar fecha y hora en los mensajes
    private static final DateTimeFormatter FECHA_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORA_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm");

    // Cliente HTTP reutilizable para hacer peticiones a la API de WhatsApp
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

        // Si el envío de WhatsApp está desactivado por configuración, solo se simula
        if (!enabled) {
            System.out.println("[WhatsApp] Desactivado por configuración. Simulando envío.");
            simularEnvio(cita);
            return false;
        }

        // Si faltan credenciales necesarias, también se entra en modo simulación
        if (phoneNumberId.isEmpty() || accessToken.isEmpty()) {
            System.out.println("[WhatsApp] Faltan credenciales (phoneNumberId o accessToken). Simulando envío.");
            simularEnvio(cita);
            return false;
        }

        Cliente cliente = cita.cliente;
        Servicio servicio = cita.servicio;

        // Si no hay teléfono del cliente, no se puede enviar el mensaje
        if (cliente == null || cliente.telefono == null || cliente.telefono.isBlank()) {
            System.out.println("[WhatsApp] La cita no tiene teléfono de cliente. No se puede enviar.");
            return false;
        }

        // Normalizamos el teléfono: quitamos todo lo que no sean dígitos
        String rawTel = cliente.telefono.replaceAll("\\D", "");
        // Si no empieza por el prefijo de país (ej: 34 para España), se añade
        if (!rawTel.startsWith("34")) {
            rawTel = "34" + rawTel;
        }

        // Construimos el nombre del cliente a partir de nombre y apellidos
        String nombreCliente = (cliente.nombre != null ? cliente.nombre : "cliente");
        if (cliente.apellidos != null && !cliente.apellidos.isBlank()) {
            nombreCliente += " " + cliente.apellidos;
        }

        // Nombre del servicio o texto genérico si falta
        String nombreServicio = (servicio != null && servicio.nombre != null)
                ? servicio.nombre
                : "tu cita";

        // Formateo de fecha y hora a partir de la cita
        String fecha = cita.fechaHoraInicio != null
                ? cita.fechaHoraInicio.format(FECHA_FORMAT)
                : "(sin fecha)";

        String hora = cita.fechaHoraInicio != null
                ? cita.fechaHoraInicio.format(HORA_FORMAT)
                : "(sin hora)";

        // Texto del mensaje que se enviará por WhatsApp
        String body = String.format(
                "Hola %s, te recordamos tu cita en TacBarber para %s el %s a las %s. " +
                        "Si no puedes asistir, avísanos respondiendo a este mensaje.",
                nombreCliente, nombreServicio, fecha, hora
        );

        try {
            // URL de la API de WhatsApp Graph con versión y phoneNumberId
            String url = String.format(
                    "https://graph.facebook.com/%s/%s/messages",
                    apiVersion,
                    phoneNumberId.get()
            );

            // Evitamos comillas dobles en el cuerpo para no romper el JSON generado
            String safeBody = body.replace("\"", "'");

            // JSON que se manda al endpoint de WhatsApp Cloud API
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

            // Construcción de la petición HTTP con headers y body JSON
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + accessToken.get())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            // Envío de la petición y obtención de la respuesta como String
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            int status = response.statusCode();
            System.out.println("[WhatsApp] Respuesta HTTP: " + status);
            System.out.println("[WhatsApp] Body: " + response.body());

            // Consideramos éxito cualquier código 2xx
            return status >= 200 && status < 300;

        } catch (Exception e) {
            // Si hay cualquier error de red o de la API, se loguea y se devuelve false
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

        // Datos básicos para construir el mensaje simulado
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

        // En modo simulación solo mostramos por consola el destinatario y el mensaje
        System.out.println("[SIMULADO] Enviar WhatsApp a: " + telefono);
        System.out.println("[SIMULADO] Mensaje: " + mensaje);
    }
}
