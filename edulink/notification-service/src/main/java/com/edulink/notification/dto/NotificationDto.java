package com.edulink.notification.dto;

import com.edulink.notification.entity.Notification;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

public class NotificationDto {

    @Data
    public static class Request {
        private Long userId;
        private Long entityId;
        private String message;
        private String category;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long notificationId;
        private Long userId;
        private Long entityId;
        private String message;
        private String category;
        private String status;
        private LocalDateTime createdDate;
        private boolean isRead;

        public static Response from(Notification n) {
            return Response.builder()
                    .notificationId(n.getNotificationId())
                    .userId(n.getUserId())
                    .entityId(n.getEntityId())
                    .message(n.getMessage())
                    .category(n.getCategory())
                    .status(n.getStatus())
                    .createdDate(n.getCreatedDate())
                    .isRead(n.isRead())
                    .build();
        }
    }
}
