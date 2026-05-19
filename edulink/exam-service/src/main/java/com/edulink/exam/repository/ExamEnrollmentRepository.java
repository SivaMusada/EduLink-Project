package com.edulink.exam.repository;

import com.edulink.exam.entity.ExamEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamEnrollmentRepository extends JpaRepository<ExamEnrollment, Long> {
    List<ExamEnrollment> findByStudentId(Long studentId);
    List<ExamEnrollment> findByExamId(Long examId);
    Optional<ExamEnrollment> findByExamIdAndStudentId(Long examId, Long studentId);
}
