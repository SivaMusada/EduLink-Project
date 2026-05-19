import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div>
      <h1 class="section-title">Welcome, {{ displayName }} 👋</h1>
      <p class="text-muted mb-4">{{ roleLabel }} Dashboard</p>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3" *ngFor="let s of stats">
          <div class="stat-card">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-muted small">{{ s.label }}</span>
              <div class="stat-icon" [style.background]="s.color + '22'">{{ s.icon }}</div>
            </div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6" *ngFor="let item of quickLinks">
          <div class="card p-3 d-flex flex-row align-items-center gap-3" style="cursor:pointer" [routerLink]="item.path">
            <div class="stat-icon" [style.background]="item.color + '22'" style="width:44px;height:44px;font-size:1.2rem">{{ item.icon }}</div>
            <div>
              <div class="fw-semibold" style="color:var(--text-primary)">{{ item.label }}</div>
              <div class="text-muted small">{{ item.desc }}</div>
            </div>
            <span class="ms-auto text-muted">›</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  displayName = '';
  role = '';
  roleLabel = '';
  stats: { label: string; value: number | string; icon: string; color: string }[] = [];
  quickLinks: { path: string; label: string; icon: string; desc: string; color: string }[] = [];

  private roleLabels: Record<string, string> = {
    ADMIN: 'School Administrator', STUDENT: 'Student', TEACHER: 'Teacher',
    BOARD: 'Education Board Officer'
  };

  constructor(private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.role = this.auth.getRole() || '';
    this.roleLabel = this.roleLabels[this.role] || this.role;

    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      this.displayName = user?.name?.trim() || this.auth.getEmail() || '';
      this.cdr.detectChanges();
    });

    this.loadStats();
  }

  loadStats(): void {
    if (this.role === 'STUDENT') {
      this.api.getCourses().pipe(catchError(() => of([]))).subscribe(c => {
        this.stats = [
          { label: 'Enrolled Courses', value: c.length, icon: '📚', color: '#4f46e5' },
          { label: 'Active', value: (c as any[]).filter(x => x.status === 'ACTIVE').length, icon: '✅', color: '#10b981' },
        ];
        this.cdr.detectChanges();
      });
      this.quickLinks = [
        { path: '/student/courses', label: 'My Courses', desc: 'View enrolled courses', icon: '📚', color: '#4f46e5' },
        { path: '/student/exams', label: 'Exams', desc: 'Upcoming assessments', icon: '📝', color: '#f59e0b' },
        { path: '/student/grades', label: 'Grades', desc: 'View results', icon: '🏆', color: '#10b981' },
        { path: '/student/performance', label: 'Performance', desc: 'Competency & skill gaps', icon: '📈', color: '#0ea5e9' },
      ];
    } else if (this.role === 'TEACHER') {
      this.api.getCourses().pipe(catchError(() => of([]))).subscribe(c => {
        this.stats = [
          { label: 'Courses', value: c.length, icon: '📚', color: '#4f46e5' },
          { label: 'Active', value: (c as any[]).filter(x => x.status === 'ACTIVE').length, icon: '✅', color: '#10b981' },
        ];
        this.cdr.detectChanges();
      });
      this.quickLinks = [
        { path: '/teacher/courses', label: 'Manage Courses', desc: 'Add and edit courses', icon: '📚', color: '#4f46e5' },
        { path: '/teacher/materials', label: 'Materials', desc: 'Upload learning content', icon: '📄', color: '#0ea5e9' },
        { path: '/teacher/exams', label: 'Exams', desc: 'Create assessments', icon: '📝', color: '#f59e0b' },
        { path: '/teacher/attendance', label: 'Attendance', desc: 'Mark student attendance', icon: '📋', color: '#10b981' },
      ];
    } else if (this.role === 'BOARD') {
      this.api.getCourses().pipe(catchError(() => of([]))).subscribe(c => {
        this.api.getReports().pipe(catchError(() => of([]))).subscribe(r => {
          this.stats = [
            { label: 'Courses', value: c.length, icon: '📚', color: '#4f46e5' },
            { label: 'Reports', value: r.length, icon: '📊', color: '#0ea5e9' },
          ];
          this.cdr.detectChanges();
        });
      });
      this.quickLinks = [
        { path: '/admin/courses', label: 'Courses', desc: 'View all courses', icon: '📚', color: '#4f46e5' },
        { path: '/admin/reports', label: 'Reports', desc: 'View reports', icon: '📊', color: '#0ea5e9' }
      ];
    }
    this.cdr.detectChanges();
  }
}
