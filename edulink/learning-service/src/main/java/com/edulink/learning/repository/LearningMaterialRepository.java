package com.edulink.learning.repository;

import com.edulink.learning.entity.LearningMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LearningMaterialRepository extends JpaRepository<LearningMaterial, Long> {
    List<LearningMaterial> findByCourseId(Long courseId);
}
