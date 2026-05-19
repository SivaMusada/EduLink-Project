import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="section-title">My Grades & Results</h2>
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3"><div class="stat-card text-center"><div class="text-muted small mb-1">Total Exams</div><div class="fw-bold" style="font-size:2rem;color:var(--text-primary)">{{ grades.length }}</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card text-center"><div class="text-muted small mb-1">Passed</div><div class="fw-bold" style="font-size:2rem;color:#10b981">{{ passed }}</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card text-center"><div class="text-muted small mb-1">Average Score</div><div class="fw-bold" style="font-size:2rem;color:var(--accent)">{{ avgScore }}%</div></div></div>
      </div>
      <div class="table-wrapper">
        <table class="table table-hover mb-0">
          <thead><tr><th>Exam ID</th><th>Score</th><th>Grade</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let g of grades">
              <td>{{ g.examId }}</td>
              <td><div class="d-flex align-items-center gap-2"><div class="progress flex-grow-1" style="height:6px;max-width:80px"><div class="progress-bar" [style.width]="g.score+'%'" [ngClass]="g.score>=60?'bg-success':'bg-danger'"></div></div>{{ g.score }}</div></td>
              <td><span class="badge bg-primary">{{ g.grade }}</span></td>
              <td><span class="badge" [ngClass]="g.status==='PASS'?'bg-success':'bg-danger'">{{ g.status }}</span></td>
            </tr>
            <tr *ngIf="grades.length===0"><td colspan="4" class="text-center text-muted py-4">No grades found</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class StudentGradesComponent implements OnInit {
  grades: any[] = [];
  passed = 0;
  avgScore = 0;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getGrades().subscribe(g => {
      this.grades = g;
      this.passed = g.filter((x: any) => x.status === 'PASS').length;
      this.avgScore = g.length ? Math.round(g.reduce((a: number, x: any) => a + x.score, 0) / g.length) : 0;
      this.cdr.detectChanges();
    });
  }
}

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="section-title">My Attendance</h2>
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3"><div class="stat-card text-center"><div class="text-muted small mb-1">Total</div><div class="fw-bold" style="font-size:2rem;color:var(--text-primary)">{{ attendance.length }}</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card text-center"><div class="text-muted small mb-1">Present</div><div class="fw-bold" style="font-size:2rem;color:#10b981">{{ present }}</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card text-center"><div class="text-muted small mb-1">Absent</div><div class="fw-bold" style="font-size:2rem;color:#ef4444">{{ absent }}</div></div></div>
        <div class="col-6 col-md-3"><div class="stat-card text-center"><div class="text-muted small mb-1">Attendance %</div><div class="fw-bold" style="font-size:2rem;color:var(--accent)">{{ pct }}%</div></div></div>
      </div>
      <div class="table-wrapper">
        <table class="table table-hover mb-0">
          <thead><tr><th>Date</th><th>Class ID</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let a of attendance">
              <td>{{ a.date }}</td><td>{{ a.classId }}</td>
              <td><span class="badge" [ngClass]="a.status==='PRESENT'?'bg-success':a.status==='ABSENT'?'bg-danger':'bg-warning text-dark'">{{ a.status }}</span></td>
            </tr>
            <tr *ngIf="attendance.length===0"><td colspan="3" class="text-center text-muted py-4">No attendance records</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class StudentAttendanceComponent implements OnInit {
  attendance: any[] = [];
  present = 0; absent = 0; pct = 0;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getAttendance().subscribe(a => {
      this.attendance = a;
      this.present = a.filter((x: any) => x.status === 'PRESENT').length;
      this.absent = a.filter((x: any) => x.status === 'ABSENT').length;
      this.pct = a.length ? Math.round((this.present / a.length) * 100) : 0;
      this.cdr.detectChanges();
    });
  }
}

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="section-title">My Exams</h2>
      <div class="row g-3">
        <div class="col-md-4" *ngFor="let e of exams">
          <div class="card p-3">
            <div class="d-flex justify-content-between mb-2">
              <span class="badge bg-info text-dark">{{ e.type }}</span>
              <span class="badge" [ngClass]="e.status==='SCHEDULED'?'bg-primary':e.status==='COMPLETED'?'bg-success':'bg-secondary'">{{ e.status }}</span>
            </div>
            <div class="fw-semibold mb-1" style="color:var(--text-primary)">Course {{ e.courseId }}</div>
            <div class="text-muted small">📅 {{ e.date }}</div>
          </div>
        </div>
        <div *ngIf="exams.length===0" class="col-12 text-center text-muted py-5">No exams scheduled</div>
      </div>
    </div>
  `
})
export class StudentExamsComponent implements OnInit {
  exams: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.api.getExams().subscribe(e => { this.exams = e; this.cdr.detectChanges(); }); }
}

@Component({
  selector: 'app-student-performance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="section-title">My Performance & Competency</h2>
      <div class="row g-3">
        <div class="col-md-6" *ngFor="let m of metrics">
          <div class="card p-3">
            <div class="d-flex justify-content-between mb-2">
              <div><div class="fw-semibold" style="color:var(--text-primary)">Course {{ m.courseId }}</div><div class="text-muted small">{{ m.date }}</div></div>
              <span class="badge" [ngClass]="badge(m.score)">{{ label(m.score) }}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-grow-1" style="height:10px"><div class="progress-bar" [style.width]="m.score+'%'" [ngClass]="color(m.score)"></div></div>
              <span class="fw-bold" style="color:var(--text-primary)">{{ m.score }}%</span>
            </div>
            <div class="mt-2 p-2 rounded small" *ngIf="m.score < 60" style="background:rgba(239,68,68,0.1);color:#ef4444">⚠️ Skill gap identified — consider additional practice</div>
          </div>
        </div>
        <div *ngIf="metrics.length===0" class="col-12 text-center text-muted py-5">No performance data available yet</div>
      </div>
    </div>
  `
})
export class StudentPerformanceComponent implements OnInit {
  metrics: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.api.getPerformance().subscribe(m => { this.metrics = m; this.cdr.detectChanges(); }); }

  label(s: number): string { if (s >= 85) return 'Expert'; if (s >= 70) return 'Proficient'; if (s >= 50) return 'Developing'; return 'Beginner'; }
  badge(s: number): string { if (s >= 85) return 'bg-success'; if (s >= 70) return 'bg-primary'; if (s >= 50) return 'bg-warning text-dark'; return 'bg-danger'; }
  color(s: number): string { if (s >= 70) return 'bg-success'; if (s >= 50) return 'bg-warning'; return 'bg-danger'; }
}
