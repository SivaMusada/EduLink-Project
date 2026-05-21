import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-exams.component.html'
})
export class AdminExamsComponent implements OnInit {
  tab = 'exams';
  exams: any[] = [];
  filteredExams: any[] = [];
  grades: any[] = [];
  filteredGrades: any[] = [];
  examSearch = '';
  examStatusFilter = '';
  gradeSearch = '';
  scheduledCount = 0;
  completedCount = 0;

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    forkJoin({
      exams: this.api.getExams().pipe(catchError(() => of([]))),
      grades: this.api.getGrades().pipe(catchError(() => of([])))
    }).subscribe(d => {
      this.exams = d.exams;
      this.grades = d.grades;
      this.filteredExams = d.exams;
      this.filteredGrades = d.grades;
      this.scheduledCount = d.exams.filter((e: any) => this.computeStatus(e) === 'SCHEDULED').length;
      this.completedCount = d.exams.filter((e: any) => this.computeStatus(e) === 'COMPLETED').length;
      this.cdr.detectChanges();
    });
  }

  applyExamFilter(): void {
    this.filteredExams = this.exams.filter((e: any) => {
      const ms = !this.examSearch || String(e.examId).includes(this.examSearch) || String(e.courseId).includes(this.examSearch);
      const mst = !this.examStatusFilter || this.computeStatus(e) === this.examStatusFilter;
      return ms && mst;
    });
  }

  applyGradeFilter(): void {
    this.filteredGrades = this.grades.filter((g: any) =>
      !this.gradeSearch || String(g.studentId).includes(this.gradeSearch) || String(g.examId).includes(this.gradeSearch)
    );
  }

  gradeCount(examId: number): number { return this.grades.filter((g: any) => g.examId === examId).length; }

  computeStatus(e: any): string {
    if (e.deadline) return new Date() > new Date(e.deadline) ? 'COMPLETED' : 'SCHEDULED';
    if (e.date) return new Date() > new Date(e.date) ? 'COMPLETED' : 'SCHEDULED';
    return e.status;
  }

  gradeBadge(grade: string): string {
    const map: Record<string, string> = { A: 'bg-success', B: 'bg-primary', C: 'bg-warning text-dark', D: 'bg-warning text-dark', F: 'bg-danger' };
    return map[grade] || 'bg-secondary';
  }
}
