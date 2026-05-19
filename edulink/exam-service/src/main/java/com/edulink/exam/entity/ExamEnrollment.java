package com.edulink.exam.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_enrollments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamEnrollment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long examId;
    private Long studentId;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status { ENROLLED, COMPLETED, ABSENT }
}
