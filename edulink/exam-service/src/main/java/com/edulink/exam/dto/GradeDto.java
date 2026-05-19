package com.edulink.exam.dto;

import com.edulink.exam.entity.Grade;
import lombok.Builder;
import lombok.Data;

public class GradeDto {

    @Data
    public static class Request {
        private Long examId;
        private Long studentId;
        private Double score;
        private String grade;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long gradeId;
        private Long examId;
        private Long studentId;
        private Double score;
        private String grade;
        private String status;

        public static Response from(Grade g) {
            return Response.builder()
                    .gradeId(g.getGradeId())
                    .examId(g.getExamId())
                    .studentId(g.getStudentId())
                    .score(g.getScore())
                    .grade(g.getGrade())
                    .status(g.getStatus().name())
                    .build();
        }
    }
}
