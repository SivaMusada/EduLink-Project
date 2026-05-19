package com.edulink.student.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service.url:http://localhost:8089}")
    private String notificationServiceUrl;

    public void send(Long userId, Long entityId, String message, String category) {
        try {
            restTemplate.postForObject(
                notificationServiceUrl + "/api/notifications",
                Map.of("userId", userId, "entityId", entityId, "message", message,
                       "category", category, "status", "SENT"),
                Object.class
            );
        } catch (Exception ignored) {}
    }
}
