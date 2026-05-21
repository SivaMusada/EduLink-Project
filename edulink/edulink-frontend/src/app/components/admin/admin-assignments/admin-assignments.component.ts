import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-assignments.component.html'
})
export class AdminAssignmentsComponent implements OnInit {
  tab = 'course';
  courses: any[] = [];
  classes: any[] = [];
  filteredClasses: any[] = [];
  students: any[] = [];
  teachers: any[] = [];
  exams: any[] = [];
  courseEnrollments: any[] = [];
  examStudents: any[] = [];
  allEnrollments: any[] = [];
  filteredEnrollments: any[] = [];
  enrollSearch = '';
  enrollCourseFilter = '';
  viewCourseId = '';
  viewExamId = '';

  courseForm: any = { courseId: '', classId: '', teacherId: '', studentId: '' };
  examForm: any = { examId: '', studentId: '' };

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    forkJoin({
      courses: this.api.getCourses().pipe(catchError(() => of([]))),
      classes: this.api.getClasses().pipe(catchError(() => of([]))),
      students: this.api.getStudents().pipe(catchError(() => of([]))),
      users: this.auth.getUsers().pipe(catchError(() => of([]))),
      exams: this.api.getExams().pipe(catchError(() => of([]))),
    }).subscribe(d => {
      this.courses = d.courses;
      this.classes = d.classes;
      this.students = d.students;
      this.teachers = (d.users as any[]).filter(u => u.role === 'TEACHER');
      this.exams = d.exams;
      this.cdr.detectChanges();
    });
  }

  onCourseSelect(): void {
    this.filteredClasses = this.classes.filter(c => c.courseId === +this.courseForm.courseId);
    const cls = this.filteredClasses[0];
    if (cls) { this.courseForm.classId = cls.classId; this.courseForm.teacherId = cls.teacherId; }
  }

  assignStudentToCourse(): void {
    this.api.enrollStudent(this.courseForm).subscribe({
      next: () => {
        this.toast.show('Student assigned to course successfully', 'success');
        this.courseForm = { courseId: '', classId: '', teacherId: '', studentId: '' };
        if (this.viewCourseId) this.loadCourseEnrollments();
      },
      error: (err) => this.toast.show(err?.error?.message || 'Assignment failed', 'error')
    });
  }

  assignStudentToExam(): void {
    this.api.enrollStudentInExam(+this.examForm.examId, +this.examForm.studentId).subscribe({
      next: () => {
        this.toast.show('Student assigned to exam successfully', 'success');
        this.examForm = { examId: '', studentId: '' };
        if (this.viewExamId) this.loadExamStudents();
      },
      error: (err) => this.toast.show(err?.error?.message || 'Assignment failed', 'error')
    });
  }

  loadCourseEnrollments(): void {
    if (!this.viewCourseId) return;
    this.api.getEnrollmentsByCourse(+this.viewCourseId).subscribe(e => { this.courseEnrollments = e; this.cdr.detectChanges(); });
  }

  loadExamStudents(): void {
    if (!this.viewExamId) return;
    this.api.getStudentsForExam(+this.viewExamId).subscribe(s => { this.examStudents = s; this.cdr.detectChanges(); });
  }

  loadEnrollments(): void {
    this.api.getAllEnrollments().subscribe(e => { this.allEnrollments = e; this.filteredEnrollments = e; this.cdr.detectChanges(); });
  }

  filterEnrollments(): void {
    this.filteredEnrollments = this.allEnrollments.filter(e => {
      const ms = !this.enrollSearch || this.studentName(e.studentId).toLowerCase().includes(this.enrollSearch.toLowerCase());
      const mc = !this.enrollCourseFilter || e.courseId === +this.enrollCourseFilter;
      return ms && mc;
    });
  }

  removeEnrollment(id: number): void {
    this.api.unenrollStudent(id).subscribe({
      next: () => { this.toast.show('Enrollment removed', 'success'); this.loadCourseEnrollments(); this.loadEnrollments(); },
      error: () => this.toast.show('Failed to remove', 'error')
    });
  }

  removeExamEnrollment(studentId: number): void {
    this.api.unenrollStudentFromExam(+this.viewExamId, studentId).subscribe({
      next: () => { this.toast.show('Exam assignment removed', 'success'); this.loadExamStudents(); },
      error: () => this.toast.show('Failed to remove', 'error')
    });
  }

  studentName(id: number): string { return this.students.find(s => s.studentId === id)?.name || `Student ${id}`; }
  teacherName(id: number): string { return this.teachers.find(t => t.userId === id)?.name || (id ? `Teacher ${id}` : '—'); }
  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
}
