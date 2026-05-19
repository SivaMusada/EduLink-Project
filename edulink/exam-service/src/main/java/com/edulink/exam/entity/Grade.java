package com.edulink.exam.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "grades")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Grade {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long gradeId;
    private Long examId;
    private Long studentId;
    private Double score;
    private String grade;
    @Enumerated(EnumType.STRING)
    private Status status;
    public enum Status { PENDING, PUBLISHED }
}
