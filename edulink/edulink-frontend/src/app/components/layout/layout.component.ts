import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ApiService } from '../../services/api.service';
import { ToastComponent } from '../shared/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, ToastComponent],
  template: `
    <div class="d-flex">
      <nav class="sidebar" [class.open]="sidebarOpen">
        <div class="brand">🎓 EduLink</div>
        <div class="p-3 text-center" style="flex-shrink:0">
          <div class="rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
            style="width:52px;height:52px;background:var(--accent)">
            <span class="text-white fw-bold fs-5">{{ initials }}</span>
          </div>
          <div class="text-white fw-semibold mt-1">{{ displayName }}</div>
          <div style="color:rgba(255,255,255,0.5);font-size:0.72rem">{{ email }}</div>
          <span class="badge mt-1" [ngClass]="roleBadge">{{ role }}</span>
        </div>
        <div class="nav-scroll">
          <ul class="nav flex-column px-2 py-1">
            <li *ngFor="let item of navItems" class="nav-item">
              <a class="nav-link" [routerLink]="item.path" routerLinkActive="active">
                <span>{{ item.icon }}</span> {{ item.label }}
              </a>
            </li>
          </ul>
        </div>
        <div class="logout-section">
          <button class="btn btn-sm w-100" style="background:rgba(255,255,255,0.1);color:#fff" (click)="logout()">
            🚪 Logout
          </button>
        </div>
      </nav>

      <div class="main-content flex-grow-1">
        <div class="topbar">
          <button class="btn btn-sm d-md-none" style="background:var(--bg-secondary);color:var(--text-primary)" (click)="sidebarOpen=!sidebarOpen">☰</button>
          <div class="d-flex align-items-center gap-2 ms-auto">

            <!-- Notification Bell -->
            <div class="position-relative">
              <button class="btn btn-sm position-relative"
                style="background:var(--bg-secondary);color:var(--text-primary);width:36px;height:36px;padding:0;font-size:1rem"
                (click)="toggleNotifications($event)">
                🔔
                <span *ngIf="unreadCount > 0"
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style="font-size:0.6rem;min-width:16px;height:16px;padding:2px 4px;line-height:1">
                  {{ unreadCount > 9 ? '9+' : unreadCount }}
                </span>
              </button>

              <!-- Dropdown Panel -->
              <div *ngIf="showNotifications"
                class="position-absolute end-0 rounded shadow"
                style="width:320px;background:var(--bg-card);border:1px solid var(--border-color);z-index:1050;top:calc(100% + 6px)">
                <div class="d-flex justify-content-between align-items-center px-3 py-2"
                  style="border-bottom:1px solid var(--border-color)">
                  <span class="fw-semibold small" style="color:var(--text-primary)">Notifications</span>
                  <button *ngIf="unreadCount > 0" class="btn btn-sm p-0"
                    style="color:var(--accent);font-size:0.72rem" (click)="markAllRead()">
                    Mark all read
                  </button>
                </div>
                <div style="max-height:320px;overflow-y:auto">
                  <div *ngIf="notifications.length === 0" class="text-center text-muted py-4 small">
                    No notifications
                  </div>
                  <div *ngFor="let n of notifications.slice(0,10)"
                    class="d-flex gap-2 px-3 py-2"
                    style="border-bottom:1px solid var(--border-color);cursor:pointer"
                    [style.background]="!n.isRead ? 'rgba(79,70,229,0.06)' : 'transparent'"
                    (click)="markRead(n)">
                    <span style="font-size:1.1rem;flex-shrink:0">{{ catIcon(n.category) }}</span>
                    <div class="flex-grow-1">
                      <div class="small" style="color:var(--text-primary);line-height:1.3">{{ n.message }}</div>
                      <div class="text-muted" style="font-size:0.68rem">{{ n.category }}</div>
                    </div>
                    <span *ngIf="!n.isRead"
                      class="rounded-circle bg-primary flex-shrink-0"
                      style="width:8px;height:8px;margin-top:4px"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dark mode toggle -->
            <button class="btn btn-sm"
              style="background:var(--bg-secondary);color:var(--text-primary);width:36px;height:36px;padding:0;font-size:1rem"
              (click)="toggleTheme()">
              {{ isDark ? '☀️' : '🌙' }}
            </button>

            <div class="d-flex align-items-center gap-2">
              <div class="rounded-circle d-inline-flex align-items-center justify-content-center"
                style="width:34px;height:34px;background:var(--accent);font-size:0.8rem">
                <span class="text-white fw-bold">{{ initials }}</span>
              </div>
              <div>
                <div class="fw-semibold" style="font-size:0.875rem;color:var(--text-primary)">{{ displayName }}</div>
                <div class="text-muted" style="font-size:0.72rem">{{ role }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="page-content" (click)="closeNotifications()">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
    <app-toast></app-toast>
  `
})
export class LayoutComponent implements OnInit {
  sidebarOpen = false;
  displayName = '';
  email = '';
  role = '';
  initials = '';
  isDark = false;
  showNotifications = false;
  notifications: any[] = [];
  unreadCount = 0;
  navItems: { path: string; label: string; icon: string }[] = [];

  private navMap: Record<string, { path: string; label: string; icon: string }[]> = {
    ADMIN: [
      { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/admin/approvals', label: 'Approvals', icon: '✅' },
      { path: '/admin/students', label: 'Students', icon: '🎒' },
      { path: '/admin/staff', label: 'Staff', icon: '💼' },
      { path: '/admin/users', label: 'All Users', icon: '👥' },
      { path: '/admin/courses', label: 'Courses & Classes', icon: '📚' },
      { path: '/admin/attendance', label: 'Attendance', icon: '📋' },
      { path: '/admin/exams', label: 'Exams & Grades', icon: '📝' },
      { path: '/admin/reports', label: 'Reports', icon: '📊' },
      { path: '/admin/notifications', label: 'Notifications', icon: '🔔' },
    ],
    STUDENT: [
      { path: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/student/profile', label: 'My Profile', icon: '👤' },
      { path: '/student/courses', label: 'My Courses', icon: '📚' },
      { path: '/student/learning', label: 'Learning', icon: '📖' },
      { path: '/student/exams', label: 'Exams', icon: '📝' },
      { path: '/student/attendance', label: 'Attendance', icon: '📋' },
      { path: '/student/notifications', label: 'Notifications', icon: '🔔' },
      { path: '/student/reports', label: 'Reports', icon: '📊' },
    ],
    TEACHER: [
      { path: '/teacher/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/teacher/courses', label: 'My Courses', icon: '📚' },
      { path: '/teacher/students', label: 'My Students', icon: '🎒' },
      { path: '/teacher/schedule', label: 'Schedule', icon: '🗓' },
      { path: '/teacher/materials', label: 'Materials', icon: '📄' },
      { path: '/teacher/exams', label: 'Exams & Grades', icon: '📝' },
      { path: '/teacher/attendance', label: 'Attendance', icon: '📋' },
      { path: '/teacher/performance', label: 'Performance', icon: '📈' },
    ],
    BOARD: [
      { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
      { path: '/admin/students', label: 'Students', icon: '🎒' },
      { path: '/admin/staff', label: 'Teachers', icon: '💼' },
      { path: '/admin/courses', label: 'Courses', icon: '📚' },
      { path: '/admin/reports', label: 'Reports', icon: '📊' },
    ]
  };

  constructor(
    private auth: AuthService,
    private theme: ThemeService,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.email = this.auth.getEmail() || '';
    this.role = this.auth.getRole() || '';
    this.isDark = this.theme.isDark();
    this.navItems = this.navMap[this.role] || [];

    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      const name = (user as any)?.name?.trim() || this.email;
      this.displayName = name;
      this.initials = name.split(' ')
        .filter((w: string) => w.length > 0)
        .map((w: string) => w[0].toUpperCase())
        .join('')
        .substring(0, 2);
      localStorage.setItem('name', name);
      if ((user as any)?.userId) this.loadNotifications((user as any).userId);
      this.cdr.detectChanges();
    });
  }

  loadNotifications(userId: number): void {
    this.api.getNotificationsByUser(userId).pipe(catchError(() => of([]))).subscribe((n: any[]) => {
      this.notifications = n;
      this.unreadCount = n.filter((x: any) => !x.isRead).length;
      this.cdr.detectChanges();
    });
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  markRead(n: any): void {
    if (!n.isRead) {
      this.api.markNotificationRead(n.notificationId).pipe(catchError(() => of(null))).subscribe(() => {
        n.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.cdr.detectChanges();
      });
    }
  }

  markAllRead(): void {
    const unread = this.notifications.filter((n: any) => !n.isRead);
    unread.forEach((n: any) => {
      this.api.markNotificationRead(n.notificationId).pipe(catchError(() => of(null))).subscribe(() => {
        n.isRead = true;
      });
    });
    this.unreadCount = 0;
    this.cdr.detectChanges();
  }

  catIcon(cat: string): string {
    const map: any = { ENROLLMENT: '📋', EXAM: '📝', GENERAL: '📢' };
    return map[cat] || '🔔';
  }

  toggleTheme(): void { this.theme.toggle(); this.isDark = this.theme.isDark(); }
  logout(): void { this.auth.logout(); }

  get roleBadge(): string {
    const map: any = { ADMIN: 'bg-danger', STUDENT: 'bg-success', TEACHER: 'bg-primary', BOARD: 'bg-info text-dark' };
    return map[this.role] || 'bg-secondary';
  }
}
