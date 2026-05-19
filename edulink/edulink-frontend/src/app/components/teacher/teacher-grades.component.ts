import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-teacher-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Grades Management</h2>
          <p class="text-muted small mb-0">Enter and manage grades for your students</p>
        </div>
        <button class="btn-accent" (click)="showModal=true;resetForm()">+ Add Grade</button>
      </div>

      <!-- Filter -->
      <div class="card p-3 mb-4">
        <div class="row g-2">
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="filterExam" (change)="applyFilter()">
              <option value="">All Exams</option>
              <option *ngFor="let e of exams" [value]="e.examId">{{ e.type }} — {{ courseName(e.courseId) }} ({{ e.date }})</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="filterStatus" (change)="applyFilter()">
              <option value="">All Status</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
            </select>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Exam</th><th>Course</th><th>Student ID</th><th>Score</th><th>Grade</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let g of filtered">
              <td>Exam #{{ g.examId }}</td>
              <td>{{ examCourse(g.examId) }}</td>
              <td>{{ g.studentId }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1" style="height:6px;max-width:60px">
                    <div class="progress-bar" [style.width]="g.score+'%'" [ngClass]="g.score>=60?'bg-success':'bg-danger'"></div>
                  </div>
                  <span>{{ g.score }}</span>
                </div>
              </td>
              <td><span class="badge" [ngClass]="gradeBadge(g.grade)">{{ g.grade }}</span></td>
              <td><span class="badge" [ngClass]="g.status==='PASS'?'bg-success':'bg-danger'">{{ g.status }}</span></td>
              <td><button class="btn btn-sm btn-outline-primary" (click)="editGrade(g)">Edit</button></td>
            </tr>
            <tr *ngIf="filtered.length===0"><td colspan="7" class="text-center text-muted py-4">No grades found</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      <div class="modal d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">{{ editId ? 'Edit Grade' : 'Add Grade' }}</h5>
              <button class="btn-close" (click)="showModal=false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>Exam</label>
                <select class="form-select mt-1" [(ngModel)]="form.examId" (change)="onExamSelect()">
                  <option value="">Select exam</option>
                  <option *ngFor="let e of exams" [value]="e.examId">{{ e.type }} — {{ courseName(e.courseId) }} ({{ e.date }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label>Student</label>
                <select class="form-select mt-1" [(ngModel)]="form.studentId" [disabled]="!form.examId">
                  <option value="">Select student</option>
                  <option *ngFor="let s of examStudents" [value]="s.studentId">{{ s.name || 'Student ' + s.studentId }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label>Score (%) — {{ form.score }}</label>
                <input type="range" class="form-range mt-1" [(ngModel)]="form.score" min="0" max="100" step="1" (input)="autoGrade()">
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label>Grade</label>
                  <input class="form-control mt-1" [(ngModel)]="form.grade" placeholder="A, B, C...">
                </div>
                <div class="col-6">
                  <label>Status</label>
                  <select class="form-select mt-1" [(ngModel)]="form.status">
                    <option value="PASS">PASS</option><option value="FAIL">FAIL</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="showModal=false">Cancel</button>
              <button class="btn-accent" (click)="save()">{{ editId ? 'Update' : 'Save' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TeacherGradesComponent implements OnInit {
  grades: any[] = [];
  filtered: any[] = [];
  exams: any[] = [];
  courses: any[] = [];
  enrollments: any[] = [];
  allStudents: any[] = [];
  examStudents: any[] = [];
  filterExam = '';
  filterStatus = '';
  showModal = false;
  editId: number | null = null;
  form: any = {};

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getClasses().pipe(catchError(() => of([]))).subscribe(allClasses => {
        const myCourseIds = [...new Set((allClasses as any[]).filter(cl => cl.teacherId == user.userId).map((cl: any) => cl.courseId))];
        forkJoin({
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
          exams: this.api.getExams().pipe(catchError(() => of([]))),
          grades: this.api.getGrades().pipe(catchError(() => of([]))),
          enrollments: this.api.getAllEnrollments().pipe(catchError(() => of([]))),
          students: this.api.getStudents().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          this.courses = (d.courses as any[]).filter(c => myCourseIds.includes(c.courseId));
          this.exams = (d.exams as any[]).filter(e => myCourseIds.includes(e.courseId));
          this.grades = d.grades as any[];
          this.enrollments = (d.enrollments as any[]).filter(e => myCourseIds.includes(e.courseId));
          this.allStudents = d.students as any[];
          this.applyFilter();
          this.cdr.detectChanges();
        });
      });
    });
  }

  applyFilter(): void {
    this.filtered = this.grades.filter(g => {
      const me = !this.filterExam || g.examId === +this.filterExam;
      const ms = !this.filterStatus || g.status === this.filterStatus;
      return me && ms;
    });
  }

  onExamSelect(): void {
    const exam = this.exams.find(e => e.examId === +this.form.examId);
    if (!exam) { this.examStudents = []; return; }
    const enrolled = this.enrollments.filter(e => e.courseId === exam.courseId);
    this.examStudents = enrolled.map(e => ({ studentId: e.studentId, name: this.allStudents.find(s => s.studentId === e.studentId)?.name || null }));
    this.form.studentId = '';
  }

  autoGrade(): void {
    const s = +this.form.score;
    this.form.grade = s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F';
    this.form.status = s >= 60 ? 'PASS' : 'FAIL';
  }

  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
  examCourse(examId: number): string { const e = this.exams.find(x => x.examId === examId); return e ? this.courseName(e.courseId) : '—'; }
  gradeBadge(g: string): string { const m: any = { A: 'bg-success', B: 'bg-primary', C: 'bg-warning text-dark', D: 'bg-orange', F: 'bg-danger' }; return m[g] || 'bg-secondary'; }

  resetForm(): void { this.editId = null; this.form = { examId: '', studentId: '', score: 70, grade: 'C', status: 'PASS' }; this.examStudents = []; }

  editGrade(g: any): void { this.editId = g.gradeId; this.form = { examId: g.examId, studentId: g.studentId, score: g.score, grade: g.grade, status: g.status }; this.onExamSelect(); this.showModal = true; }

  save(): void {
    if (!this.form.examId || !this.form.studentId) { this.toast.show('Please select exam and student', 'error'); return; }
    const obs = this.editId ? this.api.updateGrade(this.editId, this.form) : this.api.createGrade({ ...this.form, examId: +this.form.examId, studentId: +this.form.studentId });
    obs.subscribe({
      next: () => { this.toast.show('Grade saved', 'success'); this.showModal = false; this.ngOnInit(); },
      error: () => this.toast.show('Failed', 'error')
    });
  }
}
