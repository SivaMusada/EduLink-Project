import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="section-title mb-1">Welcome, {{ name }} 👋</h1>
          <p class="text-muted small mb-0">{{ today }}</p>
        </div>
        <span class="badge bg-success px-3 py-2">Student</span>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3" *ngFor="let k of kpis">
          <div class="stat-card h-100" style="cursor:pointer" [routerLink]="k.path">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="text-muted" style="font-size:0.78rem">{{ k.label }}</span>
              <div class="stat-icon" [style.background]="k.color+'22'" style="width:36px;height:36px;font-size:1rem">{{ k.icon }}</div>
            </div>
            <div class="fw-bold" style="font-size:1.7rem;color:var(--text-primary)">{{ k.value }}</div>
            <div class="small mt-1" [style.color]="k.color">{{ k.sub }}</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-lg-8">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📚 My Courses</h6>
            <div *ngIf="courses.length===0" class="text-center text-muted py-3">No courses enrolled yet</div>
            <div *ngFor="let c of courses.slice(0,5)" class="d-flex align-items-center gap-3 mb-3 p-2 rounded" style="background:var(--bg-secondary)">
              <div class="rounded d-flex align-items-center justify-content-center fw-bold text-white"
                style="width:40px;height:40px;min-width:40px;background:var(--accent);font-size:0.8rem">
                {{ c.subject?.substring(0,2).toUpperCase() || 'CO' }}
              </div>
              <div class="flex-grow-1">
                <div class="fw-semibold small" style="color:var(--text-primary)">{{ c.title }}</div>
                <div class="text-muted" style="font-size:0.72rem">{{ c.subject }} • {{ c.gradeLevel }} • {{ c.credits }} credits</div>
              </div>
              <span class="badge" [ngClass]="c.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ c.status }}</span>
            </div>
            <a routerLink="/student/courses" class="btn btn-sm w-100 mt-2" style="background:var(--bg-secondary);color:var(--accent)" *ngIf="courses.length>5">
              View all {{ courses.length }} courses
            </a>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📅 Upcoming Exams</h6>
            <div *ngIf="upcomingExams.length===0" class="text-center text-muted py-3">No upcoming exams</div>
            <div *ngFor="let e of upcomingExams.slice(0,4)" class="d-flex align-items-center gap-3 mb-3">
              <div class="text-center rounded p-2" style="background:var(--accent);min-width:42px">
                <div class="text-white fw-bold small">{{ e.date | date:'dd' }}</div>
                <div class="text-white" style="font-size:0.65rem">{{ e.date | date:'MMM' }}</div>
              </div>
              <div>
                <div class="small fw-semibold" style="color:var(--text-primary)">{{ e.title || e.type }} — {{ e.gradeLevel }}</div>
                <div class="text-muted" style="font-size:0.72rem">Deadline: {{ e.deadline ? (e.deadline | date:'dd MMM, hh:mm a') : (e.date | date:'mediumDate') }}</div>
              </div>
            </div>
            <a routerLink="/student/exams" class="btn btn-sm w-100 mt-2" style="background:var(--bg-secondary);color:var(--accent)">View all exams</a>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-lg-6">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📊 Performance Summary</h6>
            <div class="text-center mb-3">
              <div class="fw-bold" style="font-size:2.5rem;color:var(--accent)">{{ avgScore }}%</div>
              <div class="text-muted small">Average Score</div>
            </div>
            <div class="d-flex justify-content-around text-center mb-3">
              <div><div class="fw-bold" style="color:#10b981">{{ passed }}</div><div class="text-muted small">Passed</div></div>
              <div><div class="fw-bold" style="color:#ef4444">{{ failed }}</div><div class="text-muted small">Failed</div></div>
              <div><div class="fw-bold" style="color:var(--text-primary)">{{ grades.length }}</div><div class="text-muted small">Total</div></div>
            </div>
            <div *ngFor="let g of gradeBreakdown" class="mb-2">
              <div class="d-flex justify-content-between mb-1">
                <span class="small" style="color:var(--text-primary)">Grade {{ g.grade }}</span>
                <span class="small text-muted">{{ g.count }}</span>
              </div>
              <div class="progress" style="height:6px">
                <div class="progress-bar" [style.width]="g.pct+'%'" [style.background]="g.color"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📋 Attendance</h6>
            <div class="text-center mb-3">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle"
                style="width:90px;height:90px;background:conic-gradient(var(--accent) {{ attendancePct*3.6 }}deg, var(--bg-secondary) 0deg)">
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                  style="width:70px;height:70px;background:var(--bg-card)">
                  <span class="fw-bold" style="color:var(--text-primary)">{{ attendancePct }}%</span>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-around text-center mb-3">
              <div><div class="fw-bold" style="color:#10b981">{{ present }}</div><div class="text-muted small">Present</div></div>
              <div><div class="fw-bold" style="color:#ef4444">{{ absent }}</div><div class="text-muted small">Absent</div></div>
            </div>
            <div class="p-2 rounded small" *ngIf="attendancePct < 75 && attendance.length > 0"
              style="background:rgba(239,68,68,0.1);color:#ef4444">
              ⚠️ Your attendance is below 75%. Please attend regularly.
            </div>
            <div class="p-2 rounded small" *ngIf="attendancePct >= 75 && attendance.length > 0"
              style="background:rgba(16,185,129,0.1);color:#10b981">
              ✓ Good attendance! Keep it up.
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-12">
          <div class="card p-4">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">⚡ Quick Links</h6>
            <div class="row g-3">
              <div class="col-6 col-md-3" *ngFor="let q of quickLinks">
                <div class="p-3 rounded text-center h-100" style="background:var(--bg-secondary);cursor:pointer;border:1px solid var(--border-color)" [routerLink]="q.path">
                  <div style="font-size:1.8rem">{{ q.icon }}</div>
                  <div class="fw-semibold small mt-2" style="color:var(--text-primary)">{{ q.label }}</div>
                  <div class="text-muted" style="font-size:0.72rem">{{ q.desc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  name = '';
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  kpis: any[] = [];
  courses: any[] = [];
  upcomingExams: any[] = [];
  grades: any[] = [];
  gradeBreakdown: any[] = [];
  notifications: any[] = [];
  attendance: any[] = [];
  avgScore = 0;
  passed = 0;
  failed = 0;
  present = 0;
  absent = 0;
  attendancePct = 0;

  quickLinks = [
    { path: '/student/courses', label: 'My Courses', desc: 'View enrolled courses', icon: '📚' },
    { path: '/student/learning', label: 'Learning', desc: 'Materials & assignments', icon: '📖' },
    { path: '/student/exams', label: 'Exams', desc: 'Schedule & results', icon: '📝' },
    { path: '/student/grades', label: 'Grades', desc: 'View your grades', icon: '🏆' },
    { path: '/student/attendance', label: 'Attendance', desc: 'Track attendance', icon: '📋' },
    { path: '/student/reports', label: 'Reports', desc: 'Download reports', icon: '📊' },
    { path: '/student/calendar', label: 'Calendar', desc: 'Exams & deadlines', icon: '📅' },
    { path: '/student/profile', label: 'My Profile', desc: 'View your details', icon: '👤' },
  ];

  constructor(private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.name = this.auth.getName() || this.auth.getEmail() || '';
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(u => {
      if (u?.name) { this.name = u.name; this.cdr.detectChanges(); }
    });
    this.load();
    this.markAttendanceToday();
  }

  markAttendanceToday(): void {
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem(`attendance_marked_${today}`)) return;

    this.api.getMyEnrollments().pipe(catchError(() => of([]))).subscribe((enrollments: any[]) => {
      if (!enrollments.length) return;
      const studentId = enrollments[0].studentId;
      const classId = enrollments[0].classId;
      this.api.getAttendanceByStudent(studentId).pipe(catchError(() => of([]))).subscribe((records: any[]) => {
        const exists = records.find(a => a.date?.toString().substring(0, 10) === today);
        if (exists) { localStorage.setItem(`attendance_marked_${today}`, '1'); return; }
        this.api.createAttendance({ studentId, classId, date: today, status: 'PRESENT' })
          .pipe(catchError(() => of(null))).subscribe(result => {
            if (result) localStorage.setItem(`attendance_marked_${today}`, '1');
          });
      });
    });
  }

  load(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      // get real studentId from student-service (same as exams component)
      this.api.getMyStudent().pipe(catchError(() => of(null))).subscribe((student: any) => {
        const gradeLevel = (user as any).gradeLevel || '';
        const studentId = student?.studentId
          ? student.studentId
          : null; // will be resolved from enrollments below

        forkJoin({
          enrollments: this.api.getMyEnrollments().pipe(catchError(() => of([]))),
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
          exams: this.api.getExams().pipe(catchError(() => of([]))),

        }).subscribe(d => {
          const enrollments = d.enrollments as any[];
          const resolvedStudentId = studentId || enrollments[0]?.studentId;

          const grades$ = resolvedStudentId
            ? this.api.getGradesByStudent(resolvedStudentId).pipe(catchError(() => of([])))
            : of([]);

          grades$.subscribe((gradesData: any[]) => {
          const enrolledIds = new Set(enrollments.filter(e => e.status?.toUpperCase() === 'ACTIVE').map((e: any) => e.courseId));
          this.courses = (d.courses as any[]).filter(c => enrolledIds.has(c.courseId));
          this.grades = gradesData;
          this.passed = this.grades.filter(g => g.grade && g.grade !== 'F').length;
          this.failed = this.grades.filter(g => g.grade === 'F').length;
          // Compute avgScore as percentage - same as exams component
          const examMap: Record<number, number> = {};
          (d.exams as any[]).forEach((e: any) => {
            if (e.questions) { try { const p = JSON.parse(e.questions); examMap[e.examId] = (p.items?.length || 0) * 10; } catch {} }
          });
          const pctScores = this.grades.map((g: any) => {
            const max = examMap[g.examId];
            return max ? Math.round((g.score / max) * 100) : g.score;
          });
          this.avgScore = pctScores.length ? Math.round(pctScores.reduce((a: number, v: number) => a + v, 0) / pctScores.length) : 0;
          const gc: Record<string, number> = {};
          this.grades.forEach(g => { gc[g.grade] = (gc[g.grade] || 0) + 1; });
          const colors: Record<string, string> = { A: '#10b981', B: '#4f46e5', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
          this.gradeBreakdown = Object.entries(gc).map(([grade, count]) => ({
            grade, count, pct: this.grades.length ? Math.round((count / this.grades.length) * 100) : 0, color: colors[grade] || '#adb5bd'
          }));

          const unattempted$ = resolvedStudentId && gradeLevel
            ? this.api.getUnattemptedExams(resolvedStudentId, gradeLevel).pipe(catchError(() => of([])))
            : of([]);

          unattempted$.subscribe((exams: any[]) => {
            this.upcomingExams = exams.map(e => {
              try { const p = JSON.parse(e.questions); return { ...e, title: p.title || e.type }; } catch { return e; }
            });

            if (resolvedStudentId) {
              this.api.getAttendanceByStudent(resolvedStudentId).pipe(catchError(() => of([]))).subscribe((att: any[]) => {
                this.attendance = att;
                this.present = att.filter(a => a.status === 'PRESENT').length;
                this.absent = att.filter(a => a.status === 'ABSENT').length;
                this.attendancePct = att.length ? Math.round((this.present / att.length) * 100) : 0;
                this.buildKpis();
                this.cdr.detectChanges();
              });
            } else {
              this.buildKpis();
              this.cdr.detectChanges();
            }
          });
          });
        });
      });
    });
  }

  buildKpis(): void {
    this.kpis = [
      { label: 'Enrolled Courses', value: this.courses.length, icon: '📚', color: '#4f46e5', sub: `${this.courses.length} active`, path: '/student/courses' },
      { label: 'Upcoming Exams', value: this.upcomingExams.length, icon: '📝', color: '#f59e0b', sub: 'Not attempted', path: '/student/exams' },
      { label: 'Attendance', value: this.attendancePct + '%', icon: '📋', color: this.attendancePct >= 75 ? '#10b981' : '#ef4444', sub: this.attendancePct < 75 ? 'Below threshold' : 'Good standing', path: '/student/attendance' },
      { label: 'Avg Score', value: this.avgScore + '%', icon: '🏆', color: '#10b981', sub: `${this.passed} passed`, path: '/student/grades' },
    ];
  }

  catIcon(cat: string): string {
    const map: any = { ENROLLMENT: '📋', EXAM: '📝', GENERAL: '📢' };
    return map[cat] || '🔔';
  }
}
