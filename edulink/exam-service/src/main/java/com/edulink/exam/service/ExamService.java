package com.edulink.exam.service;

import com.edulink.exam.client.NotificationClient;
import com.edulink.exam.dto.ExamDto;
import com.edulink.exam.dto.GradeDto;
import com.edulink.exam.dto.SubmissionDto;
import com.edulink.exam.entity.Exam;
import com.edulink.exam.entity.ExamEnrollment;
import com.edulink.exam.entity.Grade;
import com.edulink.exam.entity.QuizSubmission;
import com.edulink.exam.exception.ResourceNotFoundException;
import com.edulink.exam.repository.ExamEnrollmentRepository;
import com.edulink.exam.repository.ExamRepository;
import com.edulink.exam.repository.GradeRepository;
import com.edulink.exam.repository.QuizSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final GradeRepository gradeRepository;
    private final ExamEnrollmentRepository examEnrollmentRepository;
    private final QuizSubmissionRepository submissionRepository;
    private final NotificationClient notificationClient;

    @Value("${admin.userId:1}")
    private Long adminUserId;

    // ── Exam CRUD ────────────────────────────────────────────────────────────

    public List<ExamDto.Response> getAllExams() {
        return examRepository.findAll().stream().map(ExamDto.Response::from).toList();
    }

    public List<ExamDto.Response> getExamsByStudent(Long studentId) {
        List<Long> examIds = examEnrollmentRepository.findByStudentId(studentId)
                .stream().map(ExamEnrollment::getExamId).toList();
        return examRepository.findAll().stream()
                .filter(e -> examIds.contains(e.getExamId()))
                .map(ExamDto.Response::from).toList();
    }

    public ExamDto.Response getExam(Long id) {
        return ExamDto.Response.from(examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id)));
    }

    public ExamDto.Response saveExam(ExamDto.Request request) {
        Exam exam = Exam.builder()
                .courseId(request.getCourseId())
                .teacherId(request.getTeacherId())
                .gradeLevel(request.getGradeLevel())
                .type(Exam.ExamType.valueOf(request.getType() != null ? request.getType() : "QUIZ"))
                .date(parseDate(request.getDate()))
                .deadline(parseDeadline(request.getDeadline()))
                .status(Exam.Status.valueOf(request.getStatus() != null ? request.getStatus() : "SCHEDULED"))
                .questions(request.getQuestions())
                .build();
        ExamDto.Response saved = ExamDto.Response.from(examRepository.save(exam));
        examEnrollmentRepository.findByExamId(saved.getExamId()).forEach(enrollment ->
            notificationClient.send(enrollment.getStudentId(), saved.getExamId(),
                "A new " + saved.getType() + " has been scheduled on " + saved.getDate() + ".", "EXAM")
        );
        return saved;
    }

    public ExamDto.Response updateExam(Long id, ExamDto.Request request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found with id: " + id));
        if (request.getCourseId() != null) exam.setCourseId(request.getCourseId());
        if (request.getTeacherId() != null) exam.setTeacherId(request.getTeacherId());
        if (request.getGradeLevel() != null) exam.setGradeLevel(request.getGradeLevel());
        if (request.getType() != null) exam.setType(Exam.ExamType.valueOf(request.getType()));
        if (request.getDate() != null) exam.setDate(parseDate(request.getDate()));
        if (request.getDeadline() != null) exam.setDeadline(parseDeadline(request.getDeadline()));
        if (request.getStatus() != null) exam.setStatus(Exam.Status.valueOf(request.getStatus()));
        if (request.getQuestions() != null) exam.setQuestions(request.getQuestions());
        return ExamDto.Response.from(examRepository.save(exam));
    }

    public List<ExamDto.Response> getExamsByGrade(String gradeLevel) {
        return examRepository.findByGradeLevel(gradeLevel).stream().map(ExamDto.Response::from).toList();
    }

    public void deleteExam(Long id) {
        if (!examRepository.existsById(id))
            throw new ResourceNotFoundException("Exam not found with id: " + id);
        examEnrollmentRepository.deleteAll(examEnrollmentRepository.findByExamId(id));
        submissionRepository.deleteAll(submissionRepository.findByExamId(id));
        gradeRepository.deleteAll(gradeRepository.findByExamId(id));
        examRepository.deleteById(id);
    }

    // ── Exam Enrollment ──────────────────────────────────────────────────────

    public Map<String, Object> enrollStudentInExam(Long examId, Long studentId) {
        examEnrollmentRepository.findByExamIdAndStudentId(examId, studentId)
                .ifPresent(e -> { throw new IllegalArgumentException("Student already enrolled in this exam"); });
        ExamEnrollment e = ExamEnrollment.builder()
                .examId(examId).studentId(studentId).status(ExamEnrollment.Status.ENROLLED).build();
        examEnrollmentRepository.save(e);
        Exam exam = examRepository.findById(examId).orElse(null);
        String examInfo = exam != null ? exam.getType().name() + " on " + exam.getDate() : "Exam ID: " + examId;
        notificationClient.send(studentId, examId, "You have been enrolled in a " + examInfo + ".", "EXAM");
        return Map.of("message", "Student enrolled in exam successfully", "examId", examId, "studentId", studentId);
    }

    public void unenrollStudentFromExam(Long examId, Long studentId) {
        examEnrollmentRepository.findByExamIdAndStudentId(examId, studentId)
                .ifPresent(examEnrollmentRepository::delete);
    }

    public List<Map<String, Object>> getStudentsForExam(Long examId) {
        return examEnrollmentRepository.findByExamId(examId).stream()
                .map(e -> Map.<String, Object>of("studentId", e.getStudentId(), "status", e.getStatus().name()))
                .toList();
    }

    // ── Quiz Submissions ─────────────────────────────────────────────────────

    public SubmissionDto.Response submitQuiz(SubmissionDto.Request request) {
        submissionRepository.findByExamIdAndStudentId(request.getExamId(), request.getStudentId())
                .ifPresent(s -> { throw new IllegalArgumentException("Student has already submitted this quiz"); });

        QuizSubmission submission = QuizSubmission.builder()
                .examId(request.getExamId())
                .studentId(request.getStudentId())
                .answers(request.getAnswers())
                .status(QuizSubmission.Status.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();
        SubmissionDto.Response saved = SubmissionDto.Response.from(submissionRepository.save(submission));

        Exam exam = examRepository.findById(request.getExamId()).orElse(null);
        String msg = "Student (ID: " + request.getStudentId() + ") has submitted the "
                + (exam != null ? exam.getType().name() : "quiz") + " (Exam ID: " + request.getExamId() + ").";
        if (exam != null && exam.getTeacherId() != null) {
            notificationClient.send(exam.getTeacherId(), request.getExamId(), msg, "EXAM");
        }
        notificationClient.send(adminUserId, request.getExamId(), msg, "EXAM");
        return saved;
    }

    public List<SubmissionDto.Response> getSubmissionsByExam(Long examId) {
        return submissionRepository.findByExamId(examId).stream().map(SubmissionDto.Response::from).toList();
    }

    public List<SubmissionDto.Response> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudentId(studentId).stream().map(SubmissionDto.Response::from).toList();
    }

    // ── Grades ───────────────────────────────────────────────────────────────

    public List<GradeDto.Response> getAllGrades() {
        return gradeRepository.findAll().stream().map(GradeDto.Response::from).toList();
    }

    public GradeDto.Response getGrade(Long id) {
        return GradeDto.Response.from(gradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grade not found with id: " + id)));
    }

    public GradeDto.Response saveGrade(GradeDto.Request request) {
        Grade grade = Grade.builder()
                .examId(request.getExamId()).studentId(request.getStudentId())
                .score(request.getScore()).grade(request.getGrade())
                .status(Grade.Status.valueOf(request.getStatus())).build();
        GradeDto.Response saved = GradeDto.Response.from(gradeRepository.save(grade));
        submissionRepository.findByExamIdAndStudentId(request.getExamId(), request.getStudentId())
                .ifPresent(s -> { s.setStatus(QuizSubmission.Status.GRADED); submissionRepository.save(s); });
        sendGradeNotifications(request.getExamId(), request.getStudentId(), request.getScore(), "published");
        return saved;
    }

    public GradeDto.Response updateGrade(Long id, GradeDto.Request request) {
        Grade grade = gradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Grade not found with id: " + id));
        grade.setExamId(request.getExamId()); grade.setStudentId(request.getStudentId());
        grade.setScore(request.getScore()); grade.setGrade(request.getGrade());
        grade.setStatus(Grade.Status.valueOf(request.getStatus()));
        GradeDto.Response saved = GradeDto.Response.from(gradeRepository.save(grade));
        sendGradeNotifications(request.getExamId(), request.getStudentId(), request.getScore(), "updated");
        return saved;
    }

    public void deleteGrade(Long id) {
        if (!gradeRepository.existsById(id))
            throw new ResourceNotFoundException("Grade not found with id: " + id);
        gradeRepository.deleteById(id);
    }

    public List<GradeDto.Response> getGradesByStudent(Long studentId) {
        return gradeRepository.findByStudentId(studentId).stream().map(GradeDto.Response::from).toList();
    }

    public List<GradeDto.Response> getGradesByExam(Long examId) {
        return gradeRepository.findByExamId(examId).stream().map(GradeDto.Response::from).toList();
    }

    // ── Dashboard Queries ────────────────────────────────────────────────────

    public List<ExamDto.Response> getUnattemptedExamsByStudent(Long studentId, String gradeLevel) {
        List<Long> attemptedExamIds = submissionRepository.findByStudentId(studentId)
                .stream().map(QuizSubmission::getExamId).toList();
        return examRepository.findByGradeLevel(gradeLevel).stream()
                .filter(e -> e.getType() == Exam.ExamType.QUIZ
                        && !attemptedExamIds.contains(e.getExamId())
                        && (e.getDeadline() == null || LocalDateTime.now().isBefore(e.getDeadline())))
                .map(ExamDto.Response::from).toList();
    }

    public List<ExamDto.Response> getUpcomingExamsForStudent(Long studentId) {
        List<Long> examIds = examEnrollmentRepository.findByStudentId(studentId)
                .stream().map(ExamEnrollment::getExamId).toList();
        return examRepository.findAll().stream()
                .filter(e -> examIds.contains(e.getExamId())
                        && (e.getStatus() == Exam.Status.SCHEDULED || e.getStatus() == Exam.Status.ONGOING))
                .map(ExamDto.Response::from).toList();
    }

    public List<ExamDto.Response> getExamsByTeacher(Long teacherId) {
        return examRepository.findAll().stream()
                .filter(e -> teacherId.equals(e.getTeacherId()))
                .map(ExamDto.Response::from).toList();
    }

    public List<SubmissionDto.Response> getSubmissionsByTeacher(Long teacherId) {
        List<Long> examIds = examRepository.findAll().stream()
                .filter(e -> teacherId.equals(e.getTeacherId()))
                .map(Exam::getExamId).toList();
        return submissionRepository.findAll().stream()
                .filter(s -> examIds.contains(s.getExamId()))
                .map(SubmissionDto.Response::from).toList();
    }

    public List<GradeDto.Response> getGradesByTeacher(Long teacherId) {
        List<Long> examIds = examRepository.findAll().stream()
                .filter(e -> teacherId.equals(e.getTeacherId()))
                .map(Exam::getExamId).toList();
        return gradeRepository.findAll().stream()
                .filter(g -> examIds.contains(g.getExamId()))
                .map(GradeDto.Response::from).toList();
    }

    // ── Deadline Scheduler ───────────────────────────────────────────────────

    /** Runs every minute — marks any SCHEDULED/ONGOING quiz past its deadline as COMPLETED */
    @Scheduled(cron = "0 * * * * *")
    public void markExpiredQuizzesCompleted() {
        LocalDateTime now = LocalDateTime.now();
        examRepository.findAll().stream()
                .filter(e -> e.getType() == Exam.ExamType.QUIZ
                        && e.getDeadline() != null
                        && now.isAfter(e.getDeadline())
                        && (e.getStatus() == Exam.Status.SCHEDULED || e.getStatus() == Exam.Status.ONGOING))
                .forEach(e -> { e.setStatus(Exam.Status.COMPLETED); examRepository.save(e); });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void sendGradeNotifications(Long examId, Long studentId, Double score, String action) {
        String studentMsg = "Your grade has been " + action + " for Exam ID: " + examId + ". Score: " + score;
        notificationClient.send(studentId, examId, studentMsg, "EXAM");
        Exam exam = examRepository.findById(examId).orElse(null);
        String staffMsg = "Grade " + action + " for Student ID: " + studentId + " on Exam ID: " + examId + ". Score: " + score;
        if (exam != null && exam.getTeacherId() != null) {
            notificationClient.send(exam.getTeacherId(), examId, staffMsg, "EXAM");
        }
        notificationClient.send(adminUserId, examId, staffMsg, "EXAM");
    }

    private LocalDateTime parseDeadline(String deadline) {
        if (deadline == null || deadline.isBlank()) return null;
        try { return LocalDateTime.parse(deadline); } catch (Exception e) {
            try { return LocalDate.parse(deadline).atTime(23, 59, 59); } catch (Exception ex) { return null; }
        }
    }

    private LocalDate parseDate(String date) {
        if (date == null || date.isBlank()) return null;
        try { return LocalDate.parse(date); } catch (Exception e) { return null; }
    }
}
