package com.edulink.student.repository;

import com.edulink.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByNameAndContactInfo(String name, String contactInfo);
    Optional<Student> findByContactInfo(String contactInfo);
    Optional<Student> findByUserId(Long userId);
}
