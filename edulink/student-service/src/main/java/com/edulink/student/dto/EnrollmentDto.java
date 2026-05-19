package com.edulink.student.dto;

import com.edulink.student.entity.Enrollment;
import lombok.Builder;
import lombok.Data;

public class EnrollmentDto {

    @Data
    public static class Request {
        private Long studentId;
        private Long courseId;
        private Long classId;
        private Long teacherId;
        private String status;
    }

    @Data @Builder
    public static class Response {
        private Long enrollmentId;
        private Long studentId;
        private Long courseId;
        private Long classId;
        private Long teacherId;
        private String status;

        public static Response from(Enrollment e) {
            return Response.builder()
                    .enrollmentId(e.getEnrollmentId())
                    .studentId(e.getStudentId())
                    .courseId(e.getCourseId())
                    .classId(e.getClassId())
                    .teacherId(e.getTeacherId())
                    .status(e.getStatus().name())
                    .build();
        }
    }
}
