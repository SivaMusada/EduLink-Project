import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-student-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Notifications & Alerts</h2>
          <p class="text-muted small mb-0">{{ unreadCount }} unread notifications</p>
        </div>
        <button class="btn btn-sm btn-outline-secondary" (click)="markAllRead()" *ngIf="unreadCount>0">Mark all read</button>
      </div>

      <div class="card p-3 mb-3">
        <div class="row g-2">
          <div class="col-md-5"><input class="form-control" [(ngModel)]="search" placeholder="🔍 Search notifications..." (input)="applyFilter()"></div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="filterCat" (change)="applyFilter()">
              <option value="">All Categories</option>
              <option value="EXAM">Exam</option>
              <option value="ENROLLMENT">Enrollment</option>
              <option value="COURSE">Course</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="filterRead" (change)="applyFilter()">
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      <div class="d-flex flex-column gap-3">
        <div *ngFor="let n of filtered" class="card p-3"
          [style.border-left]="!n.isRead ? '3px solid var(--accent)' : '3px solid transparent'">
          <div class="d-flex align-items-start gap-3">
            <div class="rounded-circle d-flex align-items-center justify-content-center"
              style="width:40px;height:40px;min-width:40px;font-size:1.2rem"
              [style.background]="catColor(n.category)+'22'">
              {{ catIcon(n.category) }}
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <div class="fw-semibold" style="color:var(--text-primary)">{{ n.message }}</div>
                <span class="badge ms-2" [ngClass]="!n.isRead ? 'bg-primary' : 'bg-secondary'" style="white-space:nowrap">
                  {{ !n.isRead ? 'UNREAD' : 'READ' }}
                </span>
              </div>
              <div class="d-flex gap-3 mt-1">
                <span class="text-muted small">{{ catIcon(n.category) }} {{ n.category }}</span>
                <span class="text-muted small">{{ n.createdDate | date:'medium' }}</span>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-end mt-2" *ngIf="!n.isRead">
            <button class="btn btn-sm btn-outline-secondary" (click)="markRead(n)">Mark as read</button>
          </div>
        </div>
        <div *ngIf="filtered.length===0" class="text-center text-muted py-5">No notifications found</div>
      </div>
    </div>
  `
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
