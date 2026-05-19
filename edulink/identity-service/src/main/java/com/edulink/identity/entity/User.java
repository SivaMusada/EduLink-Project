package com.edulink.identity.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20)")
    private Role role;

    @Column(unique = true)
    private String email;

    private String phone;
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20)")
    private Status status;

    private String dob;
    private String gender;

    @Column(length = 500)
    private String address;

    private String idProofFileName;
    private String idProofFileType;

    @Column(columnDefinition = "LONGTEXT")
    private String idProofData;

    private String admissionLetterFileName;
    private String admissionLetterFileType;

    @Column(columnDefinition = "LONGTEXT")
    private String admissionLetterData;

    private String gradeLevel;

    private String resetToken;

    public enum Role { STUDENT, TEACHER, ADMIN, BOARD, COMPLIANCE, REGULATOR }
    public enum Status { ACTIVE, INACTIVE, PENDING, REJECTED }
}
