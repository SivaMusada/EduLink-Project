package com.edulink.reporting.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "reports")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reportId;
    @Enumerated(EnumType.STRING)
    private ReportScope scope;
    private String metrics;
    private LocalDate generatedDate;
    public enum ReportScope { STUDENT, COURSE, EXAM, ATTENDANCE, COMPLIANCE }
}
