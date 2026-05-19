import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Student Performance</h2>
          <p class="text-muted small mb-0">Track and record student progress across your courses</p>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Total Records</div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ metrics.length }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Class Average</div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--accent)">{{ classAvg }}%</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Top Performers</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ topPerformers }}</div>
          </div>
        </div>
      </div>

      <!-- Filter -->
      <div class="card p-3 mb-4">
        <div class="row g-2">
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="filterCourse" (change)="applyFilter()">
              <option value="">All Courses</option>
              <option *ngFor="let c of courses" [value]="c.courseId">{{ c.title }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="filterLevel" (change)="applyFilter()">
              <option value="">All Levels</option>
              <option value="expert">Expert (≥85%)</option>
              <option value="proficient">Proficient (70-84%)</option>
              <option value="developing">Developing (50-69%)</option>
              <option value="beginner">Beginner (&lt;50%)</option>
            </select>
          </div>
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="filterMetric" (change)="applyFilter()">
              <option value="">All Metrics</option>
              <option value="above_avg">Above Class Average</option>
              <option value="below_avg">Below Class Average</option>
              <option value="improving">Top Performers</option>
              <option value="at_risk">At Risk (&lt;50%)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Performance Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-6 col-lg-4" *ngFor="let m of filtered">
          <div class="card p-3" [style.border-left]="'4px solid ' + levelColor(m.score)">
            <div class="d-flex justify-content-between mb-2">
              <div>
                <div class="fw-semibold small" style="color:var(--text-primary)">Student #{{ m.studentId }}</div>
                <div class="text-muted small">{{ courseName(m.courseId) }} • {{ m.date }}</div>
              </div>
              <span class="badge" [ngClass]="competencyBadge(m.score)">{{ competencyLabel(m.score) }}</span>
            </div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <div class="progress flex-grow-1" style="height:10px;border-radius:5px">
                <div class="progress-bar" [style.width]="m.score+'%'" [style.background]="levelColor(m.score)" style="border-radius:5px"></div>
              </div>
              <span class="fw-bold small" style="color:var(--text-primary)">{{ m.score }}%</span>
            </div>
          </div>
        </div>
        <div *ngIf="filtered.length===0" class="col-12 text-center text-muted py-5">No performance data found</div>
      </div>

      <!-- Course-wise Summary Table -->
      <div class="card p-4">
        <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📊 Course-wise Summary</h6>
        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead><tr><th>Course</th><th>Students Tracked</th><th>Avg Score</th><th>Top Score</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of courseSummary">
                <td class="fw-semibold" style="color:var(--text-primary)">{{ c.title }}</td>
                <td>{{ c.count }}</td>
                <td><span [ngStyle]="{'color': c.avg>=60?'#10b981':'#ef4444'}">{{ c.avg }}%</span></td>
                <td><span class="badge bg-success">{{ c.top }}%</span></td>
              </tr>
              <tr *ngIf="courseSummary.length===0"><td colspan="4" class="text-center text-muted py-3">No data</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class TeacherPerformanceComponent implements OnInit {
  metrics: any[] = [];
  filtered: any[] = [];
  courses: any[] = [];
  allStudents: any[] = [];
  courseSummary: any[] = [];
  filterCourse = '';
  filterLevel = '';
  filterMetric = '';
  classAvg = 0; topPerformers = 0;

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getClasses().pipe(catchError(() => of([]))).subscribe(allClasses => {
        const myCourseIds = [...new Set((allClasses as any[]).filter(cl => cl.teacherId == user.userId).map((cl: any) => cl.courseId))];
        forkJoin({
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
          exams: this.api.getExams().pipe(catchError(() => of([]))),
          grades: this.api.getGrades().pipe(catchError(() => of([]))),
          students: this.api.getStudents().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          this.courses = (d.courses as any[]).filter(c => myCourseIds.includes(c.courseId));
          this.allStudents = d.students as any[];

          // Build metrics from grades — map each grade to a performance record
          // using the exam's courseId to link back to the teacher's courses
          const myExams = (d.exams as any[]).filter(e => myCourseIds.includes(e.courseId));
          const myExamIds = new Set(myExams.map((e: any) => e.examId));
          const examCourseMap: Record<number, number> = {};
          myExams.forEach((e: any) => { examCourseMap[e.examId] = e.courseId; });

          this.metrics = (d.grades as any[])
            .filter(g => myExamIds.has(g.examId))
            .map(g => ({
              studentId: g.studentId,
              courseId: examCourseMap[g.examId],
              score: g.score,
              date: g.gradeId ? new Date().toISOString().split('T')[0] : '',
              grade: g.grade,
              status: g.status
            }));

          this.computeStats();
          this.applyFilter();
          this.cdr.detectChanges();
        });
      });
    });
  }

  computeStats(): void {
    this.classAvg = this.metrics.length ? Math.round(this.metrics.reduce((a, m) => a + m.score, 0) / this.metrics.length) : 0;
    this.topPerformers = this.metrics.filter(m => m.score >= 85).length;

    this.courseSummary = this.courses.map(c => {
      const cm = this.metrics.filter(m => m.courseId === c.courseId);
      return {
        title: c.title,
        count: cm.length,
        avg: cm.length ? Math.round(cm.reduce((a, m) => a + m.score, 0) / cm.length) : 0,
        top: cm.length ? Math.max(...cm.map(m => m.score)) : 0
      };
    });
  }

  applyFilter(): void {
    this.filtered = this.metrics.filter(m => {
      const mc = !this.filterCourse || m.courseId === +this.filterCourse;
      const ml = !this.filterLevel ||
        (this.filterLevel === 'expert' && m.score >= 85) ||
        (this.filterLevel === 'proficient' && m.score >= 70 && m.score < 85) ||
        (this.filterLevel === 'developing' && m.score >= 50 && m.score < 70) ||
        (this.filterLevel === 'beginner' && m.score < 50);
      const mm = !this.filterMetric ||
        (this.filterMetric === 'above_avg' && m.score >= this.classAvg) ||
        (this.filterMetric === 'below_avg' && m.score < this.classAvg) ||
        (this.filterMetric === 'improving' && m.score >= 85) ||
        (this.filterMetric === 'at_risk' && m.score < 50);
      return mc && ml && mm;
    });
  }


  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
  levelColor(s: number): string { if (s >= 85) return '#10b981'; if (s >= 70) return '#4f46e5'; if (s >= 50) return '#f59e0b'; return '#ef4444'; }
  competencyLabel(s: number): string { if (s >= 85) return 'Expert'; if (s >= 70) return 'Proficient'; if (s >= 50) return 'Developing'; return 'Beginner'; }
  competencyBadge(s: number): string { if (s >= 85) return 'bg-success'; if (s >= 70) return 'bg-primary'; if (s >= 50) return 'bg-warning text-dark'; return 'bg-danger'; }

}
