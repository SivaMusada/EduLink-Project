package com.edulink.learning.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "assignments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Assignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assignmentId;
    private Long courseId;
    private Long studentId;
    private String title;
    private LocalDate submissionDate;
    @Enumerated(EnumType.STRING)
    private Status status;
    public enum Status { PENDING, SUBMITTED, GRADED }
}
