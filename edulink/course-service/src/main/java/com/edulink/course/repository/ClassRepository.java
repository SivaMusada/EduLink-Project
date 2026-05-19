package com.edulink.course.repository;

import com.edulink.course.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {
    List<ClassEntity> findByCourseId(Long courseId);
    List<ClassEntity> findByTeacherId(Long teacherId);
}
