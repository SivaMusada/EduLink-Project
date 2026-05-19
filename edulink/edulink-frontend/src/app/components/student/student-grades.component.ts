import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Grades & Performance</h2>
          <p class="text-muted small mb-0">Track your academic performance</p>
        </div>
        <button class="btn btn-sm btn-outline-secondary" (click)="downloadReportCard()">⬇️ Report Card</button>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Total Exams</div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ grades.length }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Passed</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ passed }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Average Score</div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--accent)">{{ avgScore }}%</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Best Grade</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ bestGrade }}</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card p-4">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📊 Score Trend</h6>
            <div *ngIf="grades.length===0" class="text-center text-muted py-3">No data yet</div>
            <div *ngFor="let g of grades; let i = index" class="mb-2">
              <div class="d-flex justify-content-between mb-1">
                <span class="small" style="color:var(--text-primary)">Exam #{{ g.examId }}</span>
                <span class="small fw-semibold" [style.color]="g.score>=60?'#10b981':'#ef4444'">{{ g.score }}</span>
              </div>
              <div class="progress" style="height:8px;border-radius:4px">
                <div class="progress-bar" [style.width]="g.score+'%'" [ngClass]="g.score>=60?'bg-success':'bg-danger'" style="border-radius:4px"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card p-4">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📈 Grade Distribution</h6>
            <div *ngIf="gradeBreakdown.length===0" class="text-center text-muted py-3">No data yet</div>
            <div *ngFor="let g of gradeBreakdown" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold" style="color:var(--text-primary)">Grade {{ g.grade }}</span>
                <span class="small text-muted">{{ g.count }} exam(s) — {{ g.pct }}%</span>
              </div>
              <div class="progress" style="height:14px;border-radius:7px">
                <div class="progress-bar" [style.width]="g.pct+'%'" [style.background]="g.color" style="border-radius:7px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card p-4">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📚 Subject-wise Performance</h6>
            <div *ngIf="subjectPerformance.length===0" class="text-center text-muted py-3">No data yet</div>
            <div *ngFor="let s of subjectPerformance" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold" style="color:var(--text-primary)">{{ s.subject }}</span>
                <span class="small" [style.color]="s.avg>=60?'#10b981':'#ef4444'">{{ s.avg }}%</span>
              </div>
              <div class="progress" style="height:10px;border-radius:5px">
                <div class="progress-bar" [style.width]="s.avg+'%'" [ngClass]="s.avg>=70?'bg-success':s.avg>=50?'bg-warning':'bg-danger'" style="border-radius:5px"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card p-4">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📋 Performance Metrics</h6>
            <div *ngFor="let m of metrics" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold" style="color:var(--text-primary)">Course {{ m.courseId }}</span>
                <span class="badge" [ngClass]="competencyBadge(m.score)">{{ competencyLabel(m.score) }}</span>
              </div>
              <div class="progress" style="height:10px;border-radius:5px">
                <div class="progress-bar" [style.width]="m.score+'%'" [ngClass]="m.score>=70?'bg-success':m.score>=50?'bg-warning':'bg-danger'" style="border-radius:5px"></div>
              </div>
              <div class="small text-muted mt-1" *ngIf="m.score<60">⚠️ Skill gap — needs improvement</div>
            </div>
            <div *ngIf="metrics.length===0" class="text-center text-muted py-3">No performance data</div>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table table-hover mb-0">
          <thead><tr><th>Exam ID</th><th>Course</th><th>Score</th><th>Grade</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let g of grades">
              <td>#{{ g.examId }}</td>
              <td>{{ examCourse(g.examId) }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1" style="height:6px;max-width:80px">
                    <div class="progress-bar" [style.width]="g.score+'%'" [ngClass]="g.score>=60?'bg-success':'bg-danger'"></div>
                  </div>
                  <span>{{ g.score }}</span>
                </div>
              </td>
              <td><span class="badge" [ngClass]="gradeBadge(g.grade)">{{ g.grade }}</span></td>
              <td><span class="badge" [ngClass]="g.status==='PASS'?'bg-success':'bg-danger'">{{ g.status }}</span></td>
            </tr>
            <tr *ngIf="grades.length===0"><td colspan="5" class="text-center text-muted py-4">No grades found</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class StudentGradesComponent implements OnInit {
  grades: any[] = [];
  exams: any[] = [];
  courses: any[] = [];
  metrics: any[] = [];
  gradeBreakdown: any[] = [];
  subjectPerformance: any[] = [];
  passed = 0;
  avgScore = 0;
  bestGrade = '—';

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getMyStudent().pipe(catchError(() => of(null))).subscribe((student: any) => {
        const studentId = student?.studentId;
        const grades$ = studentId
          ? this.api.getGradesByStudent(studentId).pipe(catchError(() => of([])))
          : this.api.getGrades().pipe(catchError(() => of([])));
        forkJoin({
          grades: grades$,
          exams: this.api.getExams().pipe(catchError(() => of([]))),
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
          metrics: this.api.getPerformance().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          this.grades = d.grades;
          this.exams = d.exams;
          this.courses = d.courses;
          this.metrics = d.metrics;
          this.compute();
          this.cdr.detectChanges();
        });
      });
    });
  }

  compute(): void {
    this.passed = this.grades.filter(g => g.grade && g.grade !== 'F').length;
    this.avgScore = this.grades.length ? Math.round(this.grades.reduce((a, g) => a + g.score, 0) / this.grades.length) : 0;
    const sorted = [...this.grades].sort((a, b) => b.score - a.score);
    this.bestGrade = sorted[0]?.grade || '—';

    const gc: Record<string, number> = {};
    this.grades.forEach(g => { gc[g.grade] = (gc[g.grade] || 0) + 1; });
    const colors: Record<string, string> = { A: '#10b981', B: '#4f46e5', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
    this.gradeBreakdown = Object.entries(gc).map(([grade, count]) => ({
      grade, count, pct: this.grades.length ? Math.round((count / this.grades.length) * 100) : 0, color: colors[grade] || '#adb5bd'
    })).sort((a, b) => a.grade.localeCompare(b.grade));

    const subMap: Record<string, number[]> = {};
    this.grades.forEach(g => {
      const exam = this.exams.find(e => e.examId === g.examId);
      if (exam) {
        const course = this.courses.find(c => c.courseId === exam.courseId);
        const subj = course?.subject || `Course ${exam.courseId}`;
        if (!subMap[subj]) subMap[subj] = [];
        subMap[subj].push(g.score);
      }
    });
    this.subjectPerformance = Object.entries(subMap).map(([subject, scores]) => ({
      subject, avg: Math.round(scores.reduce((a, s) => a + s, 0) / scores.length)
    })).sort((a, b) => b.avg - a.avg);
  }

  examCourse(examId: number): string {
    const exam = this.exams.find(e => e.examId === examId);
    if (!exam) return '—';
    return this.courses.find(c => c.courseId === exam.courseId)?.title || `Course ${exam.courseId}`;
  }

  gradeBadge(g: string): string {
    const map: any = { A: 'bg-success', B: 'bg-primary', C: 'bg-warning text-dark', D: 'bg-orange', F: 'bg-danger' };
    return map[g] || 'bg-secondary';
  }

  competencyLabel(s: number): string { if (s >= 85) return 'Expert'; if (s >= 70) return 'Proficient'; if (s >= 50) return 'Developing'; return 'Beginner'; }
  competencyBadge(s: number): string { if (s >= 85) return 'bg-success'; if (s >= 70) return 'bg-primary'; if (s >= 50) return 'bg-warning text-dark'; return 'bg-danger'; }

  downloadReportCard(): void {
    const rows = this.grades.map(g => `${g.examId},${this.examCourse(g.examId)},${g.score},${g.grade},${g.status}`).join('\n');
    const csv = `Exam ID,Course,Score,Grade,Status\n${rows}\n\nAverage Score,${this.avgScore}%\nPassed,${this.passed}\nTotal,${this.grades.length}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report_card_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }
}
