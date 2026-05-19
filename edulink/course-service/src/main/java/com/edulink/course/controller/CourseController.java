package com.edulink.course.controller;

import com.edulink.course.dto.ClassDto;
import com.edulink.course.dto.CourseDto;
import com.edulink.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping("/api/courses")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<List<CourseDto.Response>> getAllCourses() { return ResponseEntity.ok(courseService.getAllCourses()); }

    @GetMapping("/api/courses/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD', 'COMPLIANCE', 'REGULATOR')")
    public ResponseEntity<CourseDto.Response> getCourse(@PathVariable Long id) { return ResponseEntity.ok(courseService.getCourse(id)); }

    @PostMapping("/api/courses")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD')")
    public ResponseEntity<CourseDto.Response> createCourse(@RequestBody CourseDto.Request request) { return ResponseEntity.ok(courseService.saveCourse(request)); }

    @PutMapping("/api/courses/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BOARD')")
    public ResponseEntity<CourseDto.Response> updateCourse(@PathVariable Long id, @RequestBody CourseDto.Request request) {
        return ResponseEntity.ok(courseService.updateCourse(id, request));
    }

    @DeleteMapping("/api/courses/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/classes")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD')")
    public ResponseEntity<List<ClassDto.Response>> getAllClasses() { return ResponseEntity.ok(courseService.getAllClasses()); }

    @GetMapping("/api/classes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'BOARD')")
    public ResponseEntity<ClassDto.Response> getClass(@PathVariable Long id) { return ResponseEntity.ok(courseService.getClass(id)); }

    @PostMapping("/api/classes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassDto.Response> createClass(@RequestBody ClassDto.Request request) { return ResponseEntity.ok(courseService.saveClass(request)); }

    @PutMapping("/api/classes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClassDto.Response> updateClass(@PathVariable Long id, @RequestBody ClassDto.Request request) {
        return ResponseEntity.ok(courseService.updateClass(id, request));
    }

    @DeleteMapping("/api/classes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteClass(@PathVariable Long id) {
        courseService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }
}
