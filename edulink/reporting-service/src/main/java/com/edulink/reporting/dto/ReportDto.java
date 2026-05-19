package com.edulink.reporting.dto;

import com.edulink.reporting.entity.Report;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

public class ReportDto {

    @Data
    public static class Request {
        private String scope;
        private String metrics;
        private LocalDate generatedDate;
    }

    @Data
    @Builder
    public static class Response {
        private Long reportId;
        private String scope;
        private String metrics;
        private LocalDate generatedDate;

        public static Response from(Report r) {
            return Response.builder()
                    .reportId(r.getReportId())
                    .scope(r.getScope().name())
                    .metrics(r.getMetrics())
                    .generatedDate(r.getGeneratedDate())
                    .build();
        }
    }
}
