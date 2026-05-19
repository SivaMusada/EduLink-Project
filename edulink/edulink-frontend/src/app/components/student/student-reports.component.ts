import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">My Reports</h2>
          <p class="text-muted small mb-0">Download your academic reports and summaries</p>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Enrolled Courses</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#4f46e5">{{ enrolledCourses }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Avg Score</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ avgScore }}%</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Attendance</div>
            <div class="fw-bold" style="font-size:1.8rem;" [ngStyle]="{'color': attendancePct>=75?'#10b981':'#ef4444'}">{{ attendancePct }}%</div>
          </div>
        </div>
      </div>

      <!-- Report Cards -->
      <div class="row g-4">
        <div class="col-md-4">
          <div class="card p-4 h-100">
            <div class="text-center mb-3">
              <div style="font-size:3rem">📊</div>
              <h6 class="fw-bold mt-2" style="color:var(--text-primary)">Report Card</h6>
              <p class="text-muted small">Complete academic performance with grades for all exams</p>
            </div>
            <div class="p-3 rounded mb-3" style="background:var(--bg-secondary)">
              <div class="d-flex justify-content-between mb-1"><span class="small text-muted">Total Exams</span><span class="small fw-semibold" style="color:var(--text-primary)">{{ grades.length }}</span></div>
              <div class="d-flex justify-content-between mb-1"><span class="small text-muted">Passed</span><span class="small fw-semibold" style="color:#10b981">{{ passed }}</span></div>
              <div class="d-flex justify-content-between mb-1"><span class="small text-muted">Failed</span><span class="small fw-semibold" style="color:#ef4444">{{ failed }}</span></div>
              <div class="d-flex justify-content-between"><span class="small text-muted">Average Score</span><span class="small fw-semibold" style="color:var(--accent)">{{ avgScore }}%</span></div>
            </div>
            <button class="btn-accent w-100" (click)="downloadReportCard()">⬇️ Download Report Card</button>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card p-4 h-100">
            <div class="text-center mb-3">
              <div style="font-size:3rem">📈</div>
              <h6 class="fw-bold mt-2" style="color:var(--text-primary)">Performance Summary</h6>
              <p class="text-muted small">Subject-wise performance and competency levels</p>
            </div>
            <div class="p-3 rounded mb-3" style="background:var(--bg-secondary)">
              <div *ngFor="let s of subjectPerformance.slice(0,3)" class="mb-2">
                <div class="d-flex justify-content-between mb-1">
                  <span class="small text-muted">{{ s.subject }}</span>
                  <span class="small fw-semibold" [ngStyle]="{'color': s.avg>=60?'#10b981':'#ef4444'}">{{ s.avg }}%</span>
                </div>
                <div class="progress" style="height:4px">
                  <div class="progress-bar" [style.width]="s.avg+'%'" [ngClass]="s.avg>=60?'bg-success':'bg-danger'"></div>
                </div>
              </div>
              <div *ngIf="subjectPerformance.length===0" class="text-muted small text-center">No data yet</div>
            </div>
            <button class="btn-accent w-100" (click)="downloadPerformance()">⬇️ Download Performance</button>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card p-4 h-100">
            <div class="text-center mb-3">
              <div style="font-size:3rem">📋</div>
              <h6 class="fw-bold mt-2" style="color:var(--text-primary)">Attendance Report</h6>
              <p class="text-muted small">Daily attendance records and monthly summary</p>
            </div>
            <div class="p-3 rounded mb-3" style="background:var(--bg-secondary)">
              <div class="d-flex justify-content-between mb-1"><span class="small text-muted">Total Days</span><span class="small fw-semibold" style="color:var(--text-primary)">{{ attendance.length }}</span></div>
              <div class="d-flex justify-content-between mb-1"><span class="small text-muted">Present</span><span class="small fw-semibold" style="color:#10b981">{{ present }}</span></div>
              <div class="d-flex justify-content-between mb-1"><span class="small text-muted">Absent</span><span class="small fw-semibold" style="color:#ef4444">{{ absent }}</span></div>
              <div class="d-flex justify-content-between"><span class="small text-muted">Rate</span>
                <span class="small fw-semibold" [ngStyle]="{'color': attendancePct>=75?'#10b981':'#ef4444'}">{{ attendancePct }}%</span>
              </div>
            </div>
            <button class="btn-accent w-100" (click)="downloadAttendance()">⬇️ Download Attendance</button>
          </div>
        </div>
      </div>

      <!-- Warning -->
      <div class="mt-4 p-3 rounded" *ngIf="attendancePct < 75 && attendance.length > 0"
        style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3)">
        <div class="d-flex align-items-center gap-2">
          <span style="font-size:1.3rem">⚠️</span>
          <div>
            <div class="fw-semibold" style="color:#ef4444">Low Attendance Warning</div>
            <div class="small text-muted">Your attendance is {{ attendancePct }}%, below the required 75%. Please attend regularly.</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentReportsComponent implements OnInit {
  grades: any[] = [];
  exams: any[] = [];
  courses: any[] = [];
  attendance: any[] = [];
  subjectPerformance: any[] = [];
  enrolledCourses = 0;
  avgScore = 0;
  passed = 0;
  failed = 0;
  present = 0;
  absent = 0;
  attendancePct = 0;
  passRate = 0;

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getMyStudent().pipe(catchError(() => of(null))).subscribe((student: any) => {
        const studentId = student?.studentId || null;
        forkJoin({
          enrollments: this.api.getMyEnrollments().pipe(catchError(() => of([]))),
          grades: studentId ? this.api.getGradesByStudent(studentId).pipe(catchError(() => of([]))) : of([]),
          exams: this.api.getExams().pipe(catchError(() => of([]))),
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          const enrollments = d.enrollments as any[];
          const resolvedStudentId = studentId || enrollments[0]?.studentId;
          this.courses = d.courses as any[];
          this.exams = d.exams as any[];
          this.grades = d.grades as any[];
          this.enrolledCourses = new Set(enrollments.map((e: any) => e.courseId)).size;
          this.passed = this.grades.filter(g => g.grade && g.grade !== 'F').length;
          this.failed = this.grades.filter(g => g.grade === 'F').length;

          // avgScore as percentage — same as exams component
          const examMap: Record<number, number> = {};
          this.exams.forEach((e: any) => {
            if (e.questions) { try { const p = JSON.parse(e.questions); examMap[e.examId] = (p.items?.length || 0) * 10; } catch {} }
          });
          const pctScores = this.grades.map((g: any) => {
            const max = examMap[g.examId];
            return max ? Math.round((g.score / max) * 100) : g.score;
          });
          this.avgScore = pctScores.length ? Math.round(pctScores.reduce((a, v) => a + v, 0) / pctScores.length) : 0;
          this.passRate = this.grades.length ? Math.round((this.passed / this.grades.length) * 100) : 0;

          const subMap: Record<string, number[]> = {};
          this.grades.forEach(g => {
            const exam = this.exams.find(e => e.examId === g.examId);
            const course = exam ? this.courses.find(c => c.courseId === exam.courseId) : null;
            const subj = course?.subject || `Course ${exam?.courseId || '?'}`;
            if (!subMap[subj]) subMap[subj] = [];
            const max = examMap[g.examId];
            subMap[subj].push(max ? Math.round((g.score / max) * 100) : g.score);
          });
          this.subjectPerformance = Object.entries(subMap).map(([subject, scores]) => ({
            subject, avg: Math.round(scores.reduce((a, s) => a + s, 0) / scores.length)
          })).sort((a, b) => b.avg - a.avg);

          if (resolvedStudentId) {
            this.api.getAttendanceByStudent(resolvedStudentId).pipe(catchError(() => of([]))).subscribe(a => {
              this.attendance = a as any[];
              this.present = this.attendance.filter(x => x.status === 'PRESENT').length;
              this.absent = this.attendance.filter(x => x.status === 'ABSENT').length;
              this.attendancePct = this.attendance.length ? Math.round((this.present / this.attendance.length) * 100) : 0;
              this.cdr.detectChanges();
            });
          }
          this.cdr.detectChanges();
        });
      });
    });
  }

  downloadReportCard(): void {
    let csv = 'EduLink - Report Card\n\n';
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Average Score: ${this.avgScore}%  |  Passed: ${this.passed}  |  Failed: ${this.failed}\n\n`;
    csv += 'Exam ID,Course,Score,Grade,Status\n';
    this.grades.forEach(g => {
      const exam = this.exams.find(e => e.examId === g.examId);
      const course = exam ? this.courses.find(c => c.courseId === exam.courseId)?.title || `Course ${exam.courseId}` : '—';
      csv += `${g.examId},${course},${g.score},${g.grade},${g.status}\n`;
    });
    this.download(csv, 'report_card.csv');
    this.toast.show('Report card downloaded', 'success');
  }

  downloadPerformance(): void {
    let csv = 'EduLink - Performance Summary\n\n';
    csv += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    csv += 'Subject,Average Score,Level\n';
    this.subjectPerformance.forEach(s => {
      const level = s.avg >= 85 ? 'Expert' : s.avg >= 70 ? 'Proficient' : s.avg >= 50 ? 'Developing' : 'Beginner';
      csv += `${s.subject},${s.avg}%,${level}\n`;
    });
    this.download(csv, 'performance_summary.csv');
    this.toast.show('Performance summary downloaded', 'success');
  }

  downloadAttendance(): void {
    let csv = 'EduLink - Attendance Report\n\n';
    csv += `Generated: ${new Date().toLocaleDateString()}\n`;
    csv += `Total: ${this.attendance.length}  |  Present: ${this.present}  |  Absent: ${this.absent}  |  Rate: ${this.attendancePct}%\n\n`;
    csv += 'Date,Class ID,Status\n';
    this.attendance.forEach(a => { csv += `${a.date},${a.classId},${a.status}\n`; });
    this.download(csv, 'attendance_report.csv');
    this.toast.show('Attendance report downloaded', 'success');
  }

  private download(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
