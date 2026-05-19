package com.edulink.exam.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_submissions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizSubmission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long submissionId;

    private Long examId;
    private Long studentId;

    @Column(columnDefinition = "LONGTEXT")
    private String answers;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime submittedAt;

    public enum Status { SUBMITTED, GRADED }
}
