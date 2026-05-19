package com.edulink.attendance.dto;

import com.edulink.attendance.entity.PerformanceMetric;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

public class PerformanceMetricDto {

    @Data
    public static class Request {
        private Long studentId;
        private Long courseId;
        private Double score;
        private LocalDate date;
        private String status;
    }

    @Data
    @Builder
    public static class Response {
        private Long metricId;
        private Long studentId;
        private Long courseId;
        private Double score;
        private LocalDate date;
        private String status;

        public static Response from(PerformanceMetric m) {
            return Response.builder()
                    .metricId(m.getMetricId())
                    .studentId(m.getStudentId())
                    .courseId(m.getCourseId())
                    .score(m.getScore())
                    .date(m.getDate())
                    .status(m.getStatus().name())
                    .build();
        }
    }
}
