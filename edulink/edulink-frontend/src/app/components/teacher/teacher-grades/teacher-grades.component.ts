import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-teacher-grades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-grades.component.html'
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
