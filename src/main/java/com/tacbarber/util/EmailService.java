package com.tacbarber.util;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;

@ApplicationScoped
public class EmailService {

    @ConfigProperty(name = "quarkus.sendgrid.api.key")
    String sendGridApiKey;

    @ConfigProperty(name = "quarkus.sendgrid.from.email")
    String fromEmail;

    @ConfigProperty(name = "quarkus.sendgrid.from.name")
    String fromName;
    public void enviarEmail(String destinatario, String asunto, String contenido) throws IOException {
        Email from = new Email(fromEmail, fromName);
        Email to = new Email(destinatario);
        Content content = new Content("text/plain", contenido);
        Mail mail = new Mail(from, asunto, to, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();

        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            System.out.println("📧 Email enviado. Status: " + response.getStatusCode());
        } catch (IOException ex) {
            System.err.println("❌ Error enviando email: " + ex.getMessage());
            throw ex;
        }
    }
}
