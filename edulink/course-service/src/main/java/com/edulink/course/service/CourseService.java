package com.edulink.course.service;

import com.edulink.course.client.NotificationClient;
import com.edulink.course.dto.ClassDto;
import com.edulink.course.dto.CourseDto;
import com.edulink.course.entity.ClassEntity;
import com.edulink.course.entity.Course;
import com.edulink.course.exception.ResourceNotFoundException;
import com.edulink.course.repository.ClassRepository;
import com.edulink.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final ClassRepository classRepository;
    private final NotificationClient notificationClient;

    public List<CourseDto.Response> getAllCourses() {
        return courseRepository.findAll().stream().map(CourseDto.Response::from).toList();
    }

    public CourseDto.Response getCourse(Long id) {
        return CourseDto.Response.from(courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id)));
    }

    public CourseDto.Response saveCourse(CourseDto.Request request) {
        Course course = Course.builder()
                .title(request.getTitle())
                .subject(request.getSubject())
                .gradeLevel(request.getGradeLevel())
                .credits(request.getCredits())
                .status(Course.Status.valueOf(request.getStatus()))
                .build();
        return CourseDto.Response.from(courseRepository.save(course));
    }

    public CourseDto.Response updateCourse(Long id, CourseDto.Request request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        course.setTitle(request.getTitle());
        course.setSubject(request.getSubject());
        course.setGradeLevel(request.getGradeLevel());
        course.setCredits(request.getCredits());
        course.setStatus(Course.Status.valueOf(request.getStatus()));
        return CourseDto.Response.from(courseRepository.save(course));
    }

    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id))
            throw new ResourceNotFoundException("Course not found with id: " + id);
        courseRepository.deleteById(id);
    }

    public List<ClassDto.Response> getAllClasses() {
        return classRepository.findAll().stream().map(ClassDto.Response::from).toList();
    }

    public ClassDto.Response getClass(Long id) {
        return ClassDto.Response.from(classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id)));
    }

    public ClassDto.Response saveClass(ClassDto.Request request) {
        ClassEntity c = ClassEntity.builder()
                .courseId(request.getCourseId())
                .teacherId(request.getTeacherId())
                .schedule(request.getSchedule())
                .status(ClassEntity.Status.valueOf(request.getStatus()))
                .build();
        ClassDto.Response saved = ClassDto.Response.from(classRepository.save(c));
        if (request.getTeacherId() != null) {
            notificationClient.send(request.getTeacherId(), saved.getClassId(),
                "You have been assigned to a new class (ID: " + saved.getClassId() + ").", "COURSE");
        }
        return saved;
    }

    public ClassDto.Response updateClass(Long id, ClassDto.Request request) {
        ClassEntity c = classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        c.setCourseId(request.getCourseId());
        c.setTeacherId(request.getTeacherId());
        c.setSchedule(request.getSchedule());
        c.setStatus(ClassEntity.Status.valueOf(request.getStatus()));
        return ClassDto.Response.from(classRepository.save(c));
    }

    public void deleteClass(Long id) {
        if (!classRepository.existsById(id))
            throw new ResourceNotFoundException("Class not found with id: " + id);
        classRepository.deleteById(id);
    }
}
