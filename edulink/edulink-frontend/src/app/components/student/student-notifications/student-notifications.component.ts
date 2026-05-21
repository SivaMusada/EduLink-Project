import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-student-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-notifications.component.html'
})
export class StudentNotificationsComponent implements OnInit {
  notifications: any[] = [];
  filtered: any[] = [];
  search = '';
  filterCat = '';
  filterRead = '';
  unreadCount = 0;
  private userId = 0;

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe((user: any) => {
      if (!user) return;
      this.userId = user.userId;
      this.api.getNotificationsByUser(this.userId)
        .pipe(catchError(() => of([])))
        .subscribe((data: any[]) => {
          this.notifications = data;
          this.unreadCount = data.filter((x: any) => !x.isRead).length;
          this.applyFilter();
          this.cdr.detectChanges();
        });
    });
  }

  applyFilter(): void {
    this.filtered = this.notifications.filter((n: any) => {
      const ms = !this.search || n.message?.toLowerCase().includes(this.search.toLowerCase());
      const mc = !this.filterCat || n.category === this.filterCat;
      const mr = !this.filterRead
        || (this.filterRead === 'unread' && !n.isRead)
        || (this.filterRead === 'read' && n.isRead);
      return ms && mc && mr;
    });
  }

  markRead(n: any): void {
    this.api.markNotificationRead(n.notificationId)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        n.isRead = true;
        this.unreadCount = this.notifications.filter((x: any) => !x.isRead).length;
        this.applyFilter();
        this.cdr.detectChanges();
      });
  }

  markAllRead(): void {
    const unread = this.notifications.filter((n: any) => !n.isRead);
    let done = 0;
    if (unread.length === 0) return;
    unread.forEach((n: any) => {
      this.api.markNotificationRead(n.notificationId)
        .pipe(catchError(() => of(null)))
        .subscribe(() => {
          n.isRead = true;
          done++;
          if (done === unread.length) {
            this.unreadCount = 0;
            this.applyFilter();
            this.cdr.detectChanges();
          }
        });
    });
  }

  catIcon(cat: string): string {
    const map: Record<string, string> = { ENROLLMENT: '📋', EXAM: '📝', COURSE: '📚', COMPLIANCE: '📊' };
    return map[cat] || '🔔';
  }

  catColor(cat: string): string {
    const map: Record<string, string> = { ENROLLMENT: '#4f46e5', EXAM: '#f59e0b', COURSE: '#10b981', COMPLIANCE: '#0ea5e9' };
    return map[cat] || '#adb5bd';
  }
}
