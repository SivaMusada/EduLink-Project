package com.edulink.exam.dto;

import com.edulink.exam.entity.QuizSubmission;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

public class SubmissionDto {

    @Data
    public static class Request {
        private Long examId;
        private Long studentId;
        private String answers;
    }

    @Data
    @Builder
    public static class Response {
        private Long submissionId;
        private Long examId;
        private Long studentId;
        private String answers;
        private String status;
        private LocalDateTime submittedAt;

        public static Response from(QuizSubmission s) {
            return Response.builder()
                    .submissionId(s.getSubmissionId())
                    .examId(s.getExamId())
                    .studentId(s.getStudentId())
                    .answers(s.getAnswers())
                    .status(s.getStatus().name())
                    .submittedAt(s.getSubmittedAt())
                    .build();
        }
    }
}
