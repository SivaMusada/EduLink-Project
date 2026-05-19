import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="mb-4">
        <h2 class="section-title mb-1">Exams & Grades</h2>
        <p class="text-muted small mb-0">Overview of all exams and student grades</p>
      </div>

      <!-- Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Total Exams</div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ exams.length }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Total Grades</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#4f46e5">{{ grades.length }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Scheduled</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#f59e0b">{{ scheduledCount }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Completed</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ completedCount }}</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <a class="nav-link" [class.active]="tab==='exams'" href="javascript:void(0)" (click)="tab='exams'">📅 Exams</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="tab==='grades'" href="javascript:void(0)" (click)="tab='grades'">🏆 Grades</a>
        </li>
      </ul>

      <!-- Exams Tab -->
      <div *ngIf="tab==='exams'">
        <div class="d-flex gap-2 mb-3 flex-wrap">
          <input class="form-control form-control-sm" style="width:200px" [(ngModel)]="examSearch"
            placeholder="Search by ID or course..." (input)="applyExamFilter()">
          <select class="form-select form-select-sm" style="width:150px" [(ngModel)]="examStatusFilter" (change)="applyExamFilter()">
            <option value="">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th><th>Course ID</th><th>Type</th><th>Date</th><th>Status</th><th>Grades</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of filteredExams">
                <td>#{{ e.examId }}</td>
                <td>{{ e.courseId }}</td>
                <td><span class="badge bg-info text-dark">{{ e.type }}</span></td>
                <td>{{ e.date }}</td>
                <td>
                  <span class="badge"
                    [ngClass]="computeStatus(e)==='SCHEDULED'?'bg-primary':computeStatus(e)==='COMPLETED'?'bg-success':computeStatus(e)==='ONGOING'?'bg-warning text-dark':'bg-secondary'">
                    {{ computeStatus(e) }}
                  </span>
                </td>
                <td>{{ gradeCount(e.examId) }}</td>
              </tr>
              <tr *ngIf="filteredExams.length===0">
                <td colspan="6" class="text-center text-muted py-4">No exams found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Grades Tab -->
      <div *ngIf="tab==='grades'">
        <div class="d-flex gap-2 mb-3 flex-wrap">
          <input class="form-control form-control-sm" style="width:200px" [(ngModel)]="gradeSearch"
            placeholder="Search by student or exam ID..." (input)="applyGradeFilter()">
        </div>

        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th><th>Exam ID</th><th>Student ID</th><th>Score</th><th>Grade</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of filteredGrades">
                <td>#{{ g.gradeId }}</td>
                <td>{{ g.examId }}</td>
                <td>{{ g.studentId }}</td>
                <td>{{ g.score }}</td>
                <td><span class="badge" [ngClass]="gradeBadge(g.grade)">{{ g.grade }}</span></td>
                <td>
                  <span class="badge" [ngClass]="g.status==='PUBLISHED'?'bg-success':'bg-warning text-dark'">
                    {{ g.status }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="filteredGrades.length===0">
                <td colspan="6" class="text-center text-muted py-4">No grades found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
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
