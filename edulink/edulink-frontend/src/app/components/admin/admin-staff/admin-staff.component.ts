import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-staff.component.html'
})
export class AdminStaffComponent implements OnInit {
  role = '';
  staff: any[] = [];
  filtered: any[] = [];
  search = '';
  filterRole = '';
  filterStatus = '';
  showModal = false;
  editId: number | null = null;
  deleteTarget: any = null;
  form: any = {};
  roleSummary: any[] = [];
  errors: { email?: string; phone?: string } = {};

  constructor(private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.role = this.auth.getRole() || '';
    this.load();
  }

  load(): void {
    this.auth.getUsers().pipe(catchError(() => of([]))).subscribe(users => {
      const all = (users as any[]).filter(u => u.role !== 'ADMIN' && u.role !== 'STUDENT');
      this.staff = this.role === 'BOARD' ? all.filter(u => u.role === 'TEACHER') : all;
      this.buildSummary();
      this.applyFilter();
      this.cdr.detectChanges();
    });
  }

  buildSummary(): void {
    const roles = [
      { label: 'Teachers', role: 'TEACHER', icon: '👨🏫', color: '#0ea5e9' },
      { label: 'Board Officers', role: 'BOARD', icon: '🏛️', color: '#10b981' }
    ];
    this.roleSummary = roles.map(r => ({ ...r, count: this.staff.filter(s => s.role === r.role).length }));
  }

  applyFilter(): void {
    this.filtered = this.staff.filter(u => {
      const matchSearch = !this.search || u.name?.toLowerCase().includes(this.search.toLowerCase()) || u.email?.toLowerCase().includes(this.search.toLowerCase());
      const matchRole = !this.filterRole || u.role === this.filterRole;
      const matchStatus = !this.filterStatus || u.status === this.filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }

  resetForm(): void {
    this.editId = null;
    this.form = { name: '', email: '', phone: '', password: '', role: '', status: 'ACTIVE' };
    this.errors = {};
  }

  validateEmail(): void {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!this.form.email) {
      this.errors.email = 'Email is required';
    } else if (!emailRegex.test(this.form.email)) {
      this.errors.email = 'Enter a valid email address';
    } else {
      this.errors.email = undefined;
    }
  }

  validatePhone(): void {
    const phoneRegex = /^[0-9]{10}$/;
    if (!this.form.phone) {
      this.errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(this.form.phone.replace(/\s/g, ''))) {
      this.errors.phone = 'Enter a valid 10-digit phone number';
    } else {
      this.errors.phone = undefined;
    }
  }

  edit(u: any): void {
    this.editId = u.userId;
    this.form = { name: u.name, phone: u.phone, status: u.status };
    this.showModal = true;
  }

  generatePassword(): void {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    this.form.password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  toggleStatus(u: any): void {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.auth.updateUser(u.userId, { name: u.name, phone: u.phone, status: newStatus }).subscribe({
      next: () => { this.toast.show(`${u.name} ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`, 'success'); this.load(); },
      error: () => this.toast.show('Failed to update status', 'error')
    });
  }

  confirmDelete(u: any): void { this.deleteTarget = u; }

  deleteUser(): void {
    this.auth.deleteUser(this.deleteTarget.userId).subscribe({
      next: () => { this.toast.show('Staff member deleted', 'success'); this.deleteTarget = null; this.load(); },
      error: () => this.toast.show('Failed to delete', 'error')
    });
  }

  save(): void {
    if (this.editId) {
      this.validatePhone();
      if (this.errors.phone) return;
      this.auth.updateUser(this.editId, this.form).subscribe({
        next: () => { this.toast.show('Staff updated', 'success'); this.showModal = false; this.load(); },
        error: () => this.toast.show('Failed to update', 'error')
      });
    } else {
      this.validateEmail();
      this.validatePhone();
      if (this.errors.email || this.errors.phone) return;
      if (!this.form.role) { this.toast.show('Please select a role', 'warning'); return; }
      this.auth.register(this.form).subscribe({
        next: () => { this.toast.show(`${this.form.role} account created`, 'success'); this.showModal = false; this.load(); },
        error: (err) => this.toast.show(err?.error?.message || 'Failed to create', 'error')
      });
    }
  }

  roleBadge(role: string): string {
    const map: any = { TEACHER: 'bg-primary', BOARD: 'bg-info text-dark'};
    return map[role] || 'bg-secondary';
  }

  roleColor(role: string): string {
    const map: any = { TEACHER: '#0ea5e9', BOARD: '#10b981'};
    return map[role] || '#adb5bd';
  }
}
