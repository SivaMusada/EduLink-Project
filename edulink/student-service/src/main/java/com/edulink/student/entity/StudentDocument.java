package com.edulink.student.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "student_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long documentId;

    private Long studentId;

    @Enumerated(EnumType.STRING)
    private DocType docType;

    private String fileUri;
    private LocalDate uploadedDate;

    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus;

    public enum DocType { ID_PROOF, REPORT_CARD }
    public enum VerificationStatus { PENDING, VERIFIED, REJECTED }
}
