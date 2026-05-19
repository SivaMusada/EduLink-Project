package com.edulink.student.dto;

import com.edulink.student.entity.StudentDocument;
import lombok.Builder;
import lombok.Data;

public class StudentDocumentDto {

    @Data
    public static class Request {
        private String docType;
        private String fileUri;
        private String uploadedDate;
        private String verificationStatus;
    }

    @Data
    @Builder
    public static class Response {
        private Long documentId;
        private Long studentId;
        private String docType;
        private String fileUri;
        private String uploadedDate;
        private String verificationStatus;

        public static Response from(StudentDocument d) {
            return Response.builder()
                    .documentId(d.getDocumentId())
                    .studentId(d.getStudentId())
                    .docType(d.getDocType().name())
                    .fileUri(d.getFileUri())
                    .uploadedDate(d.getUploadedDate() != null ? d.getUploadedDate().toString() : null)
                    .verificationStatus(d.getVerificationStatus().name())
                    .build();
        }
    }
}
