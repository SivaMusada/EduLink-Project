package com.edulink.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;
    private Long userId;
    private Long entityId;
    private String message;
    private String category;
    private String status;
    private LocalDateTime createdDate;
    @Builder.Default
    private boolean isRead = false;
}
