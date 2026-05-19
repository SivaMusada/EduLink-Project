package com.edulink.exam.dto;

import com.edulink.exam.entity.Exam;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExamDto {

    @Data
    public static class Request {
        private Long courseId;
        private Long teacherId;
        private String gradeLevel;
        private String type;
        private String date;
        private String deadline;
        private String status;
        private String questions;
    }

    @Data
    @Builder
    public static class Response {
        private Long examId;
        private Long courseId;
        private Long teacherId;
        private String gradeLevel;
        private String type;
        private LocalDate date;
        private LocalDateTime deadline;
        private String status;
        private String questions;

        public static Response from(Exam e) {
            return Response.builder()
                    .examId(e.getExamId())
                    .courseId(e.getCourseId())
                    .teacherId(e.getTeacherId())
                    .gradeLevel(e.getGradeLevel())
                    .type(e.getType().name())
                    .date(e.getDate())
                    .deadline(e.getDeadline())
                    .status(e.getStatus().name())
                    .questions(e.getQuestions())
                    .build();
        }
    }
}
