package com.edulink.course.dto;

import com.edulink.course.entity.Course;
import lombok.Builder;
import lombok.Data;

public class CourseDto {

    @Data
    public static class Request {
        private String title;
        private String subject;
        private String gradeLevel;
        private Integer credits;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long courseId;
        private String title;
        private String subject;
        private String gradeLevel;
        private Integer credits;
        private String status;

        public static Response from(Course c) {
            return Response.builder()
                    .courseId(c.getCourseId())
                    .title(c.getTitle())
                    .subject(c.getSubject())
                    .gradeLevel(c.getGradeLevel())
                    .credits(c.getCredits())
                    .status(c.getStatus().name())
                    .build();
        }
    }
}
