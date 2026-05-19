package com.edulink.course.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "classes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ClassEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long classId;
    private Long courseId;
    private Long teacherId;
    private String schedule;
    @Enumerated(EnumType.STRING)
    private Status status;
    public enum Status { ACTIVE, INACTIVE, COMPLETED }
}
