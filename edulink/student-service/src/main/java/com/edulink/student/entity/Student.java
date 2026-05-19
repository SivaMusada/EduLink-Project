package com.edulink.student.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long studentId;

    private Long userId;

    private String name;
    private LocalDate dob;
    private String gender;
    private String address;
    private String contactInfo;
    private LocalDate enrollmentDate;

    private String gradeLevel;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status { ACTIVE, INACTIVE, GRADUATED }
}
