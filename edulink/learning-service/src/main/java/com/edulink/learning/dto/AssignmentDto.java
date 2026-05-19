package com.edulink.learning.dto;

import com.edulink.learning.entity.Assignment;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

public class AssignmentDto {

    @Data
    public static class Request {
        private Long courseId;
        private Long studentId;
        private String title;
        private LocalDate submissionDate;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long assignmentId;
        private Long courseId;
        private Long studentId;
        private String title;
        private LocalDate submissionDate;
        private String status;

        public static Response from(Assignment a) {
            return Response.builder()
                    .assignmentId(a.getAssignmentId())
                    .courseId(a.getCourseId())
                    .studentId(a.getStudentId())
                    .title(a.getTitle())
                    .submissionDate(a.getSubmissionDate())
                    .status(a.getStatus().name())
                    .build();
        }
    }
}
