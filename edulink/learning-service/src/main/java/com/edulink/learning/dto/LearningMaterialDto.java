package com.edulink.learning.dto;

import com.edulink.learning.entity.LearningMaterial;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

public class LearningMaterialDto {

    @Data
    public static class Request {
        private Long courseId;
        private String title;
        private String fileUri;
        private String mimeType;
        private String uploadedDate;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long materialId;
        private Long courseId;
        private String title;
        private String fileUri;
        private String mimeType;
        private LocalDate uploadedDate;
        private String status;

        public static Response from(LearningMaterial m) {
            return Response.builder()
                    .materialId(m.getMaterialId())
                    .courseId(m.getCourseId())
                    .title(m.getTitle())
                    .fileUri(m.getFileUri())
                    .mimeType(m.getMimeType())
                    .uploadedDate(m.getUploadedDate())
                    .status(m.getStatus().name())
                    .build();
        }
    }
}
