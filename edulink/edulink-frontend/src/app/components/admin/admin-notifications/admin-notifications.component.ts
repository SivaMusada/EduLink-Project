import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-notifications.component.html'
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
