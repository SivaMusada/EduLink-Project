package com.edulink.learning.repository;

import com.edulink.learning.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByStudentId(Long studentId);
    List<Assignment> findByCourseId(Long courseId);
}
