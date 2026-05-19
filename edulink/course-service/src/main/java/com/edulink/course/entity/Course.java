package com.edulink.course.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "courses")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long courseId;
    private String title;
    private String subject;
    private String gradeLevel;
    private Integer credits;
    @Enumerated(EnumType.STRING)
    private Status status;
    public enum Status { ACTIVE, INACTIVE, ARCHIVED }
}
