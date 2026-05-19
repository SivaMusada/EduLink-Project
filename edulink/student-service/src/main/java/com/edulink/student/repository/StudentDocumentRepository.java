package com.edulink.student.repository;

import com.edulink.student.entity.StudentDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentDocumentRepository extends JpaRepository<StudentDocument, Long> {
    List<StudentDocument> findByStudentId(Long studentId);
}
