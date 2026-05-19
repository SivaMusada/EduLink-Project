package com.edulink.exam.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "exams")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Exam {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long examId;
    private Long courseId;
    private Long teacherId;
    private String gradeLevel;
    @Enumerated(EnumType.STRING)
    private ExamType type;
    private LocalDate date;
    private LocalDateTime deadline;
    @Enumerated(EnumType.STRING)
    private Status status;
    @Column(columnDefinition = "LONGTEXT")
    private String questions;
    public enum ExamType { MIDTERM, FINAL, QUIZ }
    public enum Status { SCHEDULED, ONGOING, COMPLETED, CANCELLED }
}
