import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Assignments & Enrollments</h2>
          <p class="text-muted small mb-0">Assign students and teachers to courses and exams</p>
        </div>
      </div>

      <ul class="nav nav-tabs mb-4">
        <li class="nav-item"><a class="nav-link" [class.active]="tab==='course'" href="javascript:void(0)" (click)="tab='course'">📚 Course Assignments</a></li>
        <li class="nav-item"><a class="nav-link" [class.active]="tab==='exam'" href="javascript:void(0)" (click)="tab='exam'">📝 Exam Assignments</a></li>
        <li class="nav-item"><a class="nav-link" [class.active]="tab==='view'" href="javascript:void(0)" (click)="tab='view';loadEnrollments()">📋 All Enrollments</a></li>
      </ul>

      <div *ngIf="tab==='course'">
        <div class="row g-4">
          <div class="col-lg-5">
            <div class="card p-4">
              <h6 class="fw-bold mb-3" style="color:var(--text-primary)">Assign Student to Course</h6>
              <div class="mb-3">
                <label>Select Course</label>
                <select class="form-select mt-1" [(ngModel)]="courseForm.courseId" (change)="onCourseSelect()">
                  <option value="">Choose a course</option>
                  <option *ngFor="let c of courses" [value]="c.courseId">{{ c.title }} ({{ c.subject }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label>Select Class</label>
                <select class="form-select mt-1" [(ngModel)]="courseForm.classId">
                  <option value="">Choose a class</option>
                  <option *ngFor="let cl of filteredClasses" [value]="cl.classId">Class #{{ cl.classId }} — {{ cl.schedule }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label>Select Teacher</label>
                <select class="form-select mt-1" [(ngModel)]="courseForm.teacherId">
                  <option value="">Choose a teacher</option>
                  <option *ngFor="let t of teachers" [value]="t.userId">{{ t.name }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label>Select Student</label>
                <select class="form-select mt-1" [(ngModel)]="courseForm.studentId">
                  <option value="">Choose a student</option>
                  <option *ngFor="let s of students" [value]="s.studentId">{{ s.name }} ({{ s.contactInfo }})</option>
                </select>
              </div>
              <button class="btn-accent w-100" (click)="assignStudentToCourse()" [disabled]="!courseForm.courseId || !courseForm.studentId">
                Assign Student to Course
              </button>
            </div>
          </div>

          <div class="col-lg-7">
            <div class="card p-4">
              <h6 class="fw-bold mb-3" style="color:var(--text-primary)">Current Course Enrollments</h6>
              <div class="mb-3">
                <select class="form-select" [(ngModel)]="viewCourseId" (change)="loadCourseEnrollments()">
                  <option value="">Select course to view enrollments</option>
                  <option *ngFor="let c of courses" [value]="c.courseId">{{ c.title }}</option>
                </select>
              </div>
              <div class="table-wrapper" *ngIf="courseEnrollments.length>0">
                <table class="table table-hover mb-0">
                  <thead><tr><th>Student ID</th><th>Class</th><th>Teacher</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let e of courseEnrollments">
                      <td>{{ studentName(e.studentId) }}</td>
                      <td>Class #{{ e.classId || '—' }}</td>
                      <td>{{ teacherName(e.teacherId) }}</td>
                      <td><span class="badge bg-success">{{ e.status }}</span></td>
                      <td><button class="btn btn-sm btn-outline-danger" (click)="removeEnrollment(e.enrollmentId)">Remove</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div *ngIf="courseEnrollments.length===0 && viewCourseId" class="text-center text-muted py-3">No students enrolled in this course</div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab==='exam'">
        <div class="row g-4">
          <div class="col-lg-5">
            <div class="card p-4">
              <h6 class="fw-bold mb-3" style="color:var(--text-primary)">Assign Student to Exam</h6>
              <div class="mb-3">
                <label>Select Exam</label>
                <select class="form-select mt-1" [(ngModel)]="examForm.examId">
                  <option value="">Choose an exam</option>
                  <option *ngFor="let e of exams" [value]="e.examId">
                    Exam #{{ e.examId }} — {{ e.type }} ({{ e.date }})
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label>Select Student</label>
                <select class="form-select mt-1" [(ngModel)]="examForm.studentId">
                  <option value="">Choose a student</option>
                  <option *ngFor="let s of students" [value]="s.studentId">{{ s.name }}</option>
                </select>
              </div>
              <button class="btn-accent w-100" (click)="assignStudentToExam()" [disabled]="!examForm.examId || !examForm.studentId">
                Assign Student to Exam
              </button>
            </div>
          </div>

          <div class="col-lg-7">
            <div class="card p-4">
              <h6 class="fw-bold mb-3" style="color:var(--text-primary)">Students Assigned to Exam</h6>
              <div class="mb-3">
                <select class="form-select" [(ngModel)]="viewExamId" (change)="loadExamStudents()">
                  <option value="">Select exam to view students</option>
                  <option *ngFor="let e of exams" [value]="e.examId">Exam #{{ e.examId }} — {{ e.type }} ({{ e.date }})</option>
                </select>
              </div>
              <div class="table-wrapper" *ngIf="examStudents.length>0">
                <table class="table table-hover mb-0">
                  <thead><tr><th>Student</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let s of examStudents">
                      <td>{{ studentName(s.studentId) }}</td>
                      <td><span class="badge bg-primary">{{ s.status }}</span></td>
                      <td><button class="btn btn-sm btn-outline-danger" (click)="removeExamEnrollment(s.studentId)">Remove</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div *ngIf="examStudents.length===0 && viewExamId" class="text-center text-muted py-3">No students assigned to this exam</div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab==='view'">
        <div class="card p-3 mb-3">
          <div class="row g-2">
            <div class="col-md-5"><input class="form-control" [(ngModel)]="enrollSearch" placeholder="🔍 Search by student name..." (input)="filterEnrollments()"></div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="enrollCourseFilter" (change)="filterEnrollments()">
                <option value="">All Courses</option>
                <option *ngFor="let c of courses" [value]="c.courseId">{{ c.title }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead><tr><th>Student</th><th>Course</th><th>Class</th><th>Teacher</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr *ngFor="let e of filteredEnrollments">
                <td class="fw-semibold">{{ studentName(e.studentId) }}</td>
                <td>{{ courseName(e.courseId) }}</td>
                <td>{{ e.classId ? 'Class #'+e.classId : '—' }}</td>
                <td>{{ teacherName(e.teacherId) }}</td>
                <td><span class="badge bg-success">{{ e.status }}</span></td>
                <td><button class="btn btn-sm btn-outline-danger" (click)="removeEnrollment(e.enrollmentId)">Remove</button></td>
              </tr>
              <tr *ngIf="filteredEnrollments.length===0"><td colspan="6" class="text-center text-muted py-4">No enrollments found</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
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
