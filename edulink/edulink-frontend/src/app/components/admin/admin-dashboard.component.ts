import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="section-title mb-1">Welcome back, {{ displayName }} 👋</h1>
          <p class="text-muted small mb-0">School Administrator Dashboard — {{ today }}</p>
        </div>

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

      <!-- Course + Pending -->
      <div class="row g-3 mb-4">
        <div [class]="role === 'BOARD' ? 'col-lg-12' : 'col-lg-8'">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3">📊 Course Enrollment Overview</h6>

            <div *ngIf="courses.length===0" class="text-center text-muted py-4">No course data</div>

            <div *ngFor="let c of courses.slice(0,6)" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold">{{ c.title }}</span>
                <span class="small text-muted">{{ c.subject }}</span>
              </div>
              <div class="progress" style="height:8px">
                <div class="progress-bar"
                     [style.width]="courseBar(c)"
                     [style.background]="c.status==='ACTIVE'?'#4f46e5':'#adb5bd'">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Approvals -->
        <div class="col-lg-4" *ngIf="role !== 'BOARD'">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3">⏳ Pending Approvals</h6>

            <div *ngIf="pendingStudents.length===0" class="text-center text-muted py-3">
              No pending approvals
            </div>

            <div *ngFor="let s of pendingStudents.slice(0,5)" class="d-flex align-items-center gap-2 mb-3 p-2 rounded"
              style="background:var(--bg-secondary)">

              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                style="width:34px;height:34px;background:var(--accent)">
                {{ s.name?.substring(0,2).toUpperCase() }}
              </div>

              <div class="flex-grow-1">
                <div class="fw-semibold small">{{ s.name }}</div>
                <div class="text-muted" style="font-size:0.72rem">{{ s.email }}</div>
              </div>

              <div class="d-flex gap-1">
                <button (click)="approve(s.userId)" class="btn btn-sm btn-success">✓</button>
                <button (click)="reject(s.userId)" class="btn btn-sm btn-danger">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Exam + Attendance (✅ Fixed layout) -->
      <div class="row g-3 mb-4">

        <!-- Exam -->
        <div class="col-lg-6">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3">📝 Exam Performance</h6>

            <div class="d-flex justify-content-between mb-3">
              <div>
                <div class="fw-bold text-success">{{ passRate }}%</div>
                <div class="small text-muted">Pass Rate</div>
              </div>

              <div>
                <div class="fw-bold text-primary">{{ avgScore }}</div>
                <div class="small text-muted">Avg Score</div>
              </div>
            </div>

            <div *ngFor="let g of gradeDistribution">
              <div class="d-flex justify-content-between small">
                <span>Grade {{ g.grade }}</span>
                <span>{{ g.count }}</span>
              </div>
              <div class="progress mb-2">
                <div class="progress-bar" [style.width]="g.pct + '%'" [style.background]="g.color"></div>
              </div>
            </div>

          </div>
        </div>

        <!-- Attendance -->
        <div class="col-lg-6">
          <div class="card p-4 h-100 text-center">
            <h6 class="fw-bold mb-3">📋 Attendance Overview</h6>

            <h2>{{ attendancePct }}%</h2>
            <p class="text-muted">Overall Attendance</p>

            <div class="d-flex justify-content-around">
              <div class="text-success">Present: {{ presentCount }}</div>
              <div class="text-danger">Absent: {{ absentCount }}</div>
              <div class="text-warning">Late: {{ lateCount }}</div>
            </div>

            <div *ngIf="lowAttendanceCount>0" class="mt-3 text-danger">
              ⚠️ {{ lowAttendanceCount }} students below 75%
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {

  displayName = '';
  role = '';
  today = new Date().toLocaleDateString();

  kpis: any[] = [];
  courses: any[] = [];
  pendingStudents: any[] = [];
  gradeDistribution: any[] = [];

  passRate = 0;
  avgScore = 0;
  attendancePct = 0;

  presentCount = 0;
  absentCount = 0;
  lateCount = 0;
  lowAttendanceCount = 0;

  constructor(private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.role = this.auth.getRole() || '';
    this.auth.getMe().subscribe(u => {
      this.displayName = u?.name || '';
      this.cdr.detectChanges();
    });

    this.load();
  }

  load(): void {
    forkJoin({
      students: this.auth.getAllStudentRegistrations().pipe(catchError(() => of([]))),
      courses: this.api.getCourses().pipe(catchError(() => of([]))),
      users: this.auth.getUsers().pipe(catchError(() => of([]))),
      attendance: this.api.getAttendance().pipe(catchError(() => of([]))),
      grades: this.api.getGrades().pipe(catchError(() => of([]))),
    }).subscribe(d => {

      const teachers = d.users.filter((u: any) => u.role === 'TEACHER').length;
      const activeCourses = d.courses.filter((c: any) => c.status === 'ACTIVE').length;
      const approvedStudents = d.students.filter((s: any) => s.status === 'ACTIVE').length;

      this.passRate = d.grades.length ?
        Math.round(d.grades.filter((g: any) => g.grade && g.grade !== 'F').length / d.grades.length * 100) : 0;

      this.avgScore = d.grades.length ?
        Math.round(d.grades.reduce((a: number, g: any) => a + g.score, 0) / d.grades.length) : 0;

      this.presentCount = d.attendance.filter((a: any) => a.status === 'PRESENT').length;
      this.absentCount = d.attendance.filter((a: any) => a.status === 'ABSENT').length;
      this.lateCount = d.attendance.filter((a: any) => a.status === 'LATE').length;

      this.attendancePct = d.attendance.length ?
        Math.round(this.presentCount / d.attendance.length * 100) : 0;

      this.pendingStudents = d.students.filter((s: any) => s.status === 'PENDING');

      this.kpis = [
        { label: 'Students', value: approvedStudents, icon: '🎒', color: '#4f46e5', sub: 'Approved students', path: '/admin/students' },
        { label: 'Teachers', value: teachers, icon: '👨‍🏫', color: '#10b981', sub: 'Staff', path: '/admin/users' },
        { label: 'Courses', value: d.courses.length, icon: '📚', color: '#f59e0b', sub: `${activeCourses} active`, path: '/admin/courses' },
        { label: 'Pending Approvals', value: this.pendingStudents.length, icon: '⏳', color: '#ef4444', sub: 'Awaiting review', path: '/admin/approvals' }
      ].filter(k => !(this.role === 'BOARD' && k.label === 'Pending Approvals'));

      this.courses = d.courses;

      this.cdr.detectChanges();
    });
  }

  approve(id: number) {
    this.auth.approveStudent(id, 'ACTIVE').subscribe(() => this.load());
  }

  reject(id: number) {
    this.auth.approveStudent(id, 'REJECTED').subscribe(() => this.load());
  }

  courseBar(c: any): string {
    return c.status === 'ACTIVE' ? '100%' : '40%';
  }

}
