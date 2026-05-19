import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Notifications & Communication</h2>
          <p class="text-muted small mb-0">Send announcements to students and staff</p>
        </div>
        <button class="btn-accent" (click)="showComposer=true;resetForm()">✉️ Compose</button>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3" *ngFor="let s of categorySummary">
          <div class="stat-card text-center">
            <div style="font-size:1.5rem">{{ s.icon }}</div>
            <div class="fw-bold mt-1" style="font-size:1.5rem;color:var(--text-primary)">{{ s.count }}</div>
            <div class="text-muted small">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="card p-4 mb-4" *ngIf="showComposer">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="fw-bold mb-0" style="color:var(--text-primary)">✉️ Compose Notification</h6>
          <button class="btn-close" (click)="showComposer=false"></button>
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <label>Category</label>
            <select class="form-select mt-1" [(ngModel)]="form.category">
              <option value="">-- Select category --</option>
              <option value="GENERAL">📢 General Announcement</option>
              <option value="EXAM">📝 Exam Schedule</option>
              <option value="ENROLLMENT">📋 Enrollment</option>
            </select>
            <div class="small mt-1" style="color:#ef4444" *ngIf="errors.category">{{ errors.category }}</div>
          </div>
          <div class="col-md-6">
            <label>Send To (User ID)</label>
            <div class="d-flex gap-2 mt-1">
              <input type="number" class="form-control" [(ngModel)]="form.userId" placeholder="User ID">
              <select class="form-select" [(ngModel)]="selectedUser" (change)="setUser()" style="max-width:180px">
                <option value="">Quick select</option>
                <option *ngFor="let u of users" [value]="u.userId">{{ u.name }} ({{ u.role }})</option>
              </select>
            </div>
            <div class="small mt-1" style="color:#ef4444" *ngIf="errors.userId">{{ errors.userId }}</div>
          </div>
          <div class="col-12">
            <label>Message</label>
            <textarea class="form-control mt-1" [(ngModel)]="form.message" rows="3" placeholder="Type your announcement or message here..."></textarea>
            <div class="d-flex justify-content-between mt-1">
              <div class="small" style="color:#ef4444" *ngIf="errors.message">{{ errors.message }}</div>
              <div class="small text-muted ms-auto">{{ form.message?.length || 0 }} / 500</div>
            </div>
          </div>
          <div class="col-12">
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-secondary" (click)="setTemplate('exam')">📝 Exam Reminder</button>
              <button class="btn btn-sm btn-outline-secondary" (click)="setTemplate('holiday')">🎉 Holiday Notice</button>
              <button class="btn btn-sm btn-outline-secondary" (click)="setTemplate('deadline')">⏰ Deadline Alert</button>
              <button class="btn btn-sm btn-outline-secondary" (click)="setTemplate('enrollment')">📋 Enrollment Open</button>
            </div>
          </div>
          <div class="col-12 d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" (click)="showComposer=false">Cancel</button>
            <button class="btn-accent" (click)="send()">Send Notification</button>
          </div>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <div class="row g-2">
          <div class="col-md-5"><input class="form-control" [(ngModel)]="search" placeholder="🔍 Search notifications..." (input)="applyFilter()"></div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="filterCategory" (change)="applyFilter()">
              <option value="">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="EXAM">Exam</option>
              <option value="ENROLLMENT">Enrollment</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="filterStatus" (change)="applyFilter()">
              <option value="">All</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6 col-lg-4" *ngFor="let n of filtered">
          <div class="card p-3 h-100">
            <div class="d-flex align-items-start gap-2 mb-2">
              <span style="font-size:1.4rem">{{ categoryIcon(n.category) }}</span>
              <div class="flex-grow-1">
                <div class="fw-semibold small" style="color:var(--text-primary)">{{ n.message }}</div>
                <div class="text-muted" style="font-size:0.72rem">{{ n.category }} • User {{ n.userId }}</div>
                <div class="text-muted" style="font-size:0.72rem">{{ n.createdDate | date:'medium' }}</div>
              </div>
              <span class="badge" [ngClass]="!n.isRead ? 'bg-primary' : 'bg-secondary'">{{ !n.isRead ? 'UNREAD' : 'READ' }}</span>
            </div>
          </div>
        </div>
        <div *ngIf="filtered.length===0" class="col-12 text-center text-muted py-5">No notifications found</div>
      </div>
    </div>
  `
})
export class AdminNotificationsComponent implements OnInit {
  notifications: any[] = [];
  filtered: any[] = [];
  users: any[] = [];
  search = '';
  filterCategory = '';
  filterStatus = '';
  showComposer = false;
  selectedUser = '';
  form: any = {};
  categorySummary: any[] = [];
  errors: { category?: string; userId?: string; message?: string } = {};

  constructor(private api: ApiService, private toast: ToastService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.getNotifications().pipe(catchError(() => of([]))).subscribe((n: any[]) => {
      this.notifications = n;
      this.buildSummary();
      this.applyFilter();
      this.cdr.detectChanges();
    });
    this.auth.getUsers().pipe(catchError(() => of([]))).subscribe((u: any[]) => { this.users = u; this.cdr.detectChanges(); });
  }

  buildSummary(): void {
    const cats = [
      { label: 'General', icon: '📢', cat: 'GENERAL' },
      { label: 'Exam', icon: '📝', cat: 'EXAM' },
      { label: 'Enrollment', icon: '📋', cat: 'ENROLLMENT' }
    ];
    this.categorySummary = cats.map(c => ({ ...c, count: this.notifications.filter(n => n.category === c.cat).length }));
  }

  applyFilter(): void {
    this.filtered = this.notifications.filter((n: any) => {
      const ms = !this.search || n.message?.toLowerCase().includes(this.search.toLowerCase());
      const mc = !this.filterCategory || n.category === this.filterCategory;
      const mst = !this.filterStatus
        || (this.filterStatus === 'UNREAD' && !n.isRead)
        || (this.filterStatus === 'READ' && n.isRead);
      return ms && mc && mst;
    });
  }

  resetForm(): void {
    this.form = { userId: '', entityId: 1, message: '', category: '', status: 'SENT' };
    this.selectedUser = '';
    this.errors = {};
  }

  setUser(): void { if (this.selectedUser) this.form.userId = this.selectedUser; }

  setTemplate(type: string): void {
    const templates: Record<string, { message: string; category: string }> = {
      exam: { message: 'Reminder: Upcoming exam scheduled. Please review your study materials and be prepared.', category: 'EXAM' },
      holiday: { message: 'Notice: School will be closed for the upcoming holiday. Classes resume on the next working day.', category: 'GENERAL' },
      deadline: { message: 'Alert: Assignment submission deadline is approaching. Please submit your work on time.', category: 'GENERAL' },
      enrollment: { message: 'Enrollment for the new semester is now open. Please complete your course registration.', category: 'ENROLLMENT' },
    };
    const t = templates[type];
    if (t) { this.form.message = t.message; this.form.category = t.category; }
  }

  send(): void {
    this.errors = {};
    if (!this.form.category) this.errors.category = 'Please select a category';
    if (!this.form.userId) this.errors.userId = 'Please select a recipient';
    if (!this.form.message?.trim()) {
      this.errors.message = 'Message is required';
    } else if (this.form.message.trim().length < 10) {
      this.errors.message = 'Message must be at least 10 characters';
    } else if (this.form.message.length > 500) {
      this.errors.message = 'Message must not exceed 500 characters';
    }
    if (this.errors.category || this.errors.userId || this.errors.message) return;
    this.api.createNotification({ ...this.form, status: 'SENT' }).subscribe({
      next: () => { this.toast.show('Notification sent successfully', 'success'); this.showComposer = false; this.load(); },
      error: () => this.toast.show('Failed to send', 'error')
    });
  }

  categoryIcon(cat: string): string {
    const map: any = { ENROLLMENT: '📋', EXAM: '📝', GENERAL: '📢' };
    return map[cat] || '🔔';
  }
}
