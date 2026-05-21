import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { ApiService } from '../../../services/api.service';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, ToastComponent],
  templateUrl: './layout.component.html'
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
    this.displayName = this.auth.getName() || this.email;

    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      const name = (user as any)?.name?.trim() || this.email;
      this.displayName = name;
      this.initials = name.split(' ')
        .filter((w: string) => w.length > 0)
        .map((w: string) => w[0].toUpperCase())
        .join('')
        .substring(0, 2);
      sessionStorage.setItem('name', name);
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
