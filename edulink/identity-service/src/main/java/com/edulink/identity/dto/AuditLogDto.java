package com.edulink.identity.dto;

import com.edulink.identity.entity.AuditLog;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

public class AuditLogDto {

    @Data
    public static class Request {
        private Long userId;
        private String action;
        private String resource;
    }

    @Data
    @Builder
    public static class Response {
        private Long auditId;
        private Long userId;
        private String action;
        private String resource;
        private LocalDateTime timestamp;

        public static Response from(AuditLog log) {
            return Response.builder()
                    .auditId(log.getAuditId())
                    .userId(log.getUserId())
                    .action(log.getAction())
                    .resource(log.getResource())
                    .timestamp(log.getTimestamp())
                    .build();
        }
    }
}
