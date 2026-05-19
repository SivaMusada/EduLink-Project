package com.edulink.exam.repository;

import com.edulink.exam.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByGradeLevel(String gradeLevel);
}
