package com.edulink.course.dto;

import com.edulink.course.entity.ClassEntity;
import lombok.Builder;
import lombok.Data;

public class ClassDto {

    @Data
    public static class Request {
        private Long courseId;
        private Long teacherId;
        private String schedule;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long classId;
        private Long courseId;
        private Long teacherId;
        private String schedule;
        private String status;

        public static Response from(ClassEntity c) {
            return Response.builder()
                    .classId(c.getClassId())
                    .courseId(c.getCourseId())
                    .teacherId(c.getTeacherId())
                    .schedule(c.getSchedule())
                    .status(c.getStatus().name())
                    .build();
        }
    }
}
