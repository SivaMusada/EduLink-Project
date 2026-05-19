package com.edulink.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "performance_metrics")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PerformanceMetric {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long metricId;
    private Long studentId;
    private Long courseId;
    private Double score;
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    private Status status;
    public enum Status { ACTIVE, ARCHIVED }
}
