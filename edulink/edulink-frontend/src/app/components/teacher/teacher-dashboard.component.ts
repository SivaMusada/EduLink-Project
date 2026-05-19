import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="section-title mb-1">Welcome, {{ name }} 👋</h1>
          <p class="text-muted small mb-0">{{ today }}</p>
        </div>
        <span class="badge bg-primary px-3 py-2">Teacher</span>
      </div>

      <!-- KPI Cards -->
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
        <!-- My Courses -->
        <div class="col-lg-8">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📚 My Assigned Courses</h6>
            <div *ngIf="courses.length===0" class="text-center text-muted py-3">No courses assigned yet</div>
            <div *ngFor="let c of courses.slice(0,5)" class="d-flex align-items-center gap-3 mb-3 p-2 rounded" style="background:var(--bg-secondary)">
              <div class="rounded d-flex align-items-center justify-content-center fw-bold text-white"
                style="width:40px;height:40px;min-width:40px;background:var(--accent);font-size:0.8rem">
                {{ c.subject?.substring(0,2).toUpperCase() || 'CO' }}
              </div>
              <div class="flex-grow-1">
                <div class="fw-semibold small" style="color:var(--text-primary)">{{ c.title }}</div>
                <div class="text-muted" style="font-size:0.72rem">{{ c.subject }} • {{ c.gradeLevel }} • {{ c.credits }} credits</div>
              </div>
              <div class="text-end">
                <div class="small text-muted">Students</div>
                <div class="fw-bold small" style="color:var(--accent)">{{ studentCount(c.courseId) }}</div>
              </div>
              <span class="badge" [ngClass]="c.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ c.status }}</span>
            </div>
            <a routerLink="/teacher/courses" class="btn btn-sm w-100 mt-2" style="background:var(--bg-secondary);color:var(--accent)">View all courses →</a>
          </div>
        </div>

        <!-- Today's Schedule -->
        <div class="col-lg-4">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">🗓️ My Classes</h6>
            <div *ngIf="classes.length===0" class="text-center text-muted py-3">No classes assigned</div>
            <div *ngFor="let cl of classes.slice(0,4)" class="mb-3 p-2 rounded" style="background:var(--bg-secondary)">
              <div class="fw-semibold small" style="color:var(--text-primary)">{{ courseName(cl.courseId) }}</div>
              <div class="text-muted" style="font-size:0.72rem">{{ cl.schedule || 'No schedule set' }}</div>
              <span class="badge mt-1" [ngClass]="cl.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ cl.status }}</span>
            </div>
            <a routerLink="/teacher/schedule" class="btn btn-sm w-100 mt-2" style="background:var(--bg-secondary);color:var(--accent)">Manage schedule →</a>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <!-- Attendance Summary -->
        <div class="col-lg-4">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📋 Attendance Overview</h6>
            <div class="text-center mb-3">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle"
                style="width:90px;height:90px;background:conic-gradient(#10b981 {{ attendancePct*3.6 }}deg, var(--bg-secondary) 0deg)">
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                  style="width:70px;height:70px;background:var(--bg-card)">
                  <span class="fw-bold" style="color:var(--text-primary)">{{ attendancePct }}%</span>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-around text-center mb-2">
              <div><div class="fw-bold" style="color:#10b981">{{ presentCount }}</div><div class="text-muted small">Present</div></div>
              <div><div class="fw-bold" style="color:#ef4444">{{ absentCount }}</div><div class="text-muted small">Absent</div></div>
              <div><div class="fw-bold" style="color:var(--text-primary)">{{ totalAttendance }}</div><div class="text-muted small">Total</div></div>
            </div>
            <a routerLink="/teacher/attendance" class="btn btn-sm w-100 mt-2" style="background:var(--bg-secondary);color:var(--accent)">Mark attendance →</a>
          </div>
        </div>

        <!-- Student Performance -->
        <div class="col-lg-4">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📈 Student Performance</h6>
            <div class="text-center mb-2">
              <div class="fw-bold" style="font-size:2.2rem;color:var(--accent)">{{ avgScore }}%</div>
              <div class="text-muted small">Class Average</div>
            </div>
            <div class="d-flex justify-content-around text-center mb-3">
              <div><div class="fw-bold" style="color:#10b981">{{ passCount }}</div><div class="text-muted small">Passed</div></div>
              <div><div class="fw-bold" style="color:#ef4444">{{ failCount }}</div><div class="text-muted small">Failed</div></div>
            </div>
            <div *ngIf="lowPerformers.length > 0" class="p-2 rounded small" style="background:rgba(239,68,68,0.1);color:#ef4444">
              ⚠️ {{ lowPerformers.length }} student(s) need attention
            </div>
            <a routerLink="/teacher/performance" class="btn btn-sm w-100 mt-2" style="background:var(--bg-secondary);color:var(--accent)">View performance →</a>
          </div>
        </div>

        <!-- Upcoming Exams -->
        <div class="col-lg-4">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📝 Upcoming Exams</h6>
            <div *ngIf="upcomingExams.length===0" class="text-center text-muted py-3">No upcoming exams</div>
            <div *ngFor="let e of upcomingExams.slice(0,4)" class="d-flex align-items-center gap-2 mb-3">
              <div class="text-center rounded p-2" style="background:var(--accent);min-width:40px">
                <div class="text-white fw-bold small">{{ e.date | date:'dd' }}</div>
                <div class="text-white" style="font-size:0.6rem">{{ e.date | date:'MMM' }}</div>
              </div>
              <div>
                <div class="small fw-semibold" style="color:var(--text-primary)">{{ e.type }} — {{ courseName(e.courseId) }}</div>
                <div class="text-muted" style="font-size:0.7rem">{{ e.date }}</div>
              </div>
            </div>
            <a routerLink="/teacher/exams" class="btn btn-sm w-100 mt-2" style="background:var(--bg-secondary);color:var(--accent)">Manage exams →</a>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="card p-4">
        <h6 class="fw-bold mb-3" style="color:var(--text-primary)">⚡ Quick Actions</h6>
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
  `
})
export class TeacherDashboardComponent implements OnInit {
  name = '';
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  kpis: any[] = [];
  courses: any[] = [];
  classes: any[] = [];
  gradeStudentMap: Record<string, number> = {};
  upcomingExams: any[] = [];
  presentCount = 0; absentCount = 0; totalAttendance = 0; attendancePct = 0;
  avgScore = 0; passCount = 0; failCount = 0; lowPerformers: any[] = [];

  quickLinks = [
    { path: '/teacher/courses', label: 'My Courses', desc: 'View assigned courses', icon: '📚' },
    { path: '/teacher/materials', label: 'Materials', desc: 'Upload learning content', icon: '📄' },
    { path: '/teacher/exams', label: 'Exams', desc: 'Create & manage exams', icon: '📝' },
    { path: '/teacher/attendance', label: 'Attendance', desc: 'Mark student attendance', icon: '📋' },
    { path: '/teacher/students', label: 'My Students', desc: 'View enrolled students', icon: '🎒' },
    { path: '/teacher/performance', label: 'Performance', desc: 'Track student progress', icon: '📈' },
    { path: '/teacher/schedule', label: 'Schedule', desc: 'Manage class schedules', icon: '🗓️' },
  ];

  constructor(private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.name = this.auth.getName() || this.auth.getEmail() || '';
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      if (user.name) this.name = user.name;

      forkJoin({
        enrollments: this.api.getEnrollmentsByTeacher(user.userId).pipe(catchError(() => of([]))),
        courses: this.api.getCourses().pipe(catchError(() => of([]))),
        classes: this.api.getClasses().pipe(catchError(() => of([]))),
        exams: this.api.getExams().pipe(catchError(() => of([]))),
        grades: this.api.getGrades().pipe(catchError(() => of([]))),
        attendance: this.api.getAttendance().pipe(catchError(() => of([]))),
      }).subscribe(d => {
        const enrollments = d.enrollments as any[];
        const enrolledCourseIds = [...new Set(enrollments.map((e: any) => e.courseId))];
        const enrolledClassIds = [...new Set(enrollments.map((e: any) => e.classId))];

        this.courses = (d.courses as any[]).filter(c => enrolledCourseIds.includes(c.courseId));
        this.classes = (d.classes as any[]).filter(cl => enrolledClassIds.includes(cl.classId));

        const enrolledStudentIds = [...new Set(enrollments.map((e: any) => e.studentId))];
        const uniqueStudentCount = enrolledStudentIds.length;

        this.upcomingExams = (d.exams as any[])
          .filter(e => e.status === 'SCHEDULED' && enrolledCourseIds.includes(e.courseId))
          .sort((a, b) => a.date > b.date ? 1 : -1);

        const att = (d.attendance as any[]).filter(a => enrolledClassIds.includes(a.classId));
        this.presentCount = att.filter(a => a.status === 'PRESENT').length;
        this.absentCount = att.filter(a => a.status === 'ABSENT').length;
        this.totalAttendance = att.length;
        this.attendancePct = att.length ? Math.round((this.presentCount / att.length) * 100) : 0;

        const myExamIds = new Set(
          (d.exams as any[])
            .filter(e => enrolledCourseIds.includes(e.courseId))
            .map((e: any) => e.examId)
        );
        const grades = (d.grades as any[]).filter(g => myExamIds.has(g.examId));
        this.passCount = grades.filter(g => g.status === 'PASS').length;
        this.failCount = grades.filter(g => g.status === 'FAIL').length;
        this.avgScore = grades.length ? Math.round(grades.reduce((a, g) => a + g.score, 0) / grades.length) : 0;
        this.lowPerformers = grades.filter(g => g.score < 50);

        // student count per course from enrollments
        this.gradeStudentMap = {};
        enrolledCourseIds.forEach(cid => {
          this.gradeStudentMap[cid] = enrollments.filter((e: any) => e.courseId === cid).length;
        });

        this.kpis = [
          { label: 'My Courses', value: this.courses.length, icon: '📚', color: '#4f46e5', sub: `${this.courses.filter(c => c.status === 'ACTIVE').length} active`, path: '/teacher/courses' },
          { label: 'My Students', value: uniqueStudentCount, icon: '🎒', color: '#10b981', sub: `across ${this.courses.length} course(s)`, path: '/teacher/students' },
          { label: 'Attendance Rate', value: this.attendancePct + '%', icon: '📋', color: this.attendancePct >= 75 ? '#10b981' : '#ef4444', sub: `${this.presentCount} present`, path: '/teacher/attendance' },
          { label: 'Class Avg Score', value: this.avgScore + '%', icon: '📈', color: '#f59e0b', sub: `${this.passCount} passed`, path: '/teacher/performance' },
        ];
        this.cdr.detectChanges();
      });
    });
  }

  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
  studentCount(courseId: number): number { return this.gradeStudentMap[courseId] || 0; }
}
