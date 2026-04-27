package com.springmind.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;
import org.springframework.boot.autoconfigure.mail.MailSenderValidatorAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SpringMind AI Support Platform
 *
 * Mail autoconfiguration is EXCLUDED because:
 * - Email sending is disabled in local dev (app.email.enabled=false)
 * - The JavaMailSender bean attempts SMTP connections that block HTTP threads
 *   when smtp.gmail.com is unreachable on dev machines
 */
@SpringBootApplication(exclude = {
    MailSenderAutoConfiguration.class,
    MailSenderValidatorAutoConfiguration.class
})
@EnableAsync
@EnableScheduling
public class SpringMindApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringMindApplication.class, args);
    }
}
