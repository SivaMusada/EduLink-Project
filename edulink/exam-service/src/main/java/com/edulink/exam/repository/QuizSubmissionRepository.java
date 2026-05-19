package com.edulink.exam.repository;

import com.edulink.exam.entity.QuizSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface QuizSubmissionRepository extends JpaRepository<QuizSubmission, Long> {
    List<QuizSubmission> findByStudentId(Long studentId);
    List<QuizSubmission> findByExamId(Long examId);
    Optional<QuizSubmission> findByExamIdAndStudentId(Long examId, Long studentId);
}
