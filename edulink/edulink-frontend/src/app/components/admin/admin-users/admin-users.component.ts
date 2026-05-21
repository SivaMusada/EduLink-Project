import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  showModal = false;
  editId: number | null = null;
  roles = ['TEACHER', 'BOARD'];
  form: any = {};
  deleteTarget: any = null;
  deleting = false;
  passwordTarget: any = null;
  pwForm = { newPassword: '', confirmPassword: '' };
  pwMismatch = false;

  constructor(private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.auth.getUsers().pipe(catchError(() => { this.toast.show('Failed to load users', 'error'); return of([]); }))
      .subscribe(u => { this.users = u; this.cdr.detectChanges(); });
  }

  resetForm(): void {
    this.editId = null;
    this.form = { name: '', email: '', phone: '', password: '', role: '', status: 'ACTIVE' };
  }

  edit(u: any): void {
    this.editId = u.userId;
    this.form = { name: u.name, phone: u.phone, status: u.status };
    this.showModal = true;
  }

  openPasswordModal(u: any): void {
    this.passwordTarget = u;
    this.pwForm = { newPassword: '', confirmPassword: '' };
    this.pwMismatch = false;
  }

  closePasswordModal(): void {
    this.passwordTarget = null;
    this.pwMismatch = false;
  }

  savePassword(): void {
    this.pwMismatch = this.pwForm.newPassword !== this.pwForm.confirmPassword;
    if (this.pwMismatch || !this.pwForm.newPassword.trim()) return;
    this.auth.updatePassword(this.passwordTarget.userId, this.pwForm.newPassword).subscribe({
      next: () => { this.toast.show('Password updated successfully', 'success'); this.closePasswordModal(); },
      error: () => this.toast.show('Failed to update password', 'error')
    });
  }

  confirmDelete(u: any): void {
    this.deleteTarget = u;
  }

  deleteUser(): void {
    if (!this.deleteTarget) return;
    this.deleting = true;
    this.auth.deleteUser(this.deleteTarget.userId).subscribe({
      next: () => {
        this.toast.show(`User "${this.deleteTarget.name}" deleted successfully`, 'success');
        this.deleteTarget = null;
        this.deleting = false;
        this.load();
      },
      error: (err) => {
        this.toast.show(err?.error?.message || 'Failed to delete user', 'error');
        this.deleting = false;
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    if (this.editId) {
      this.auth.updateUser(this.editId, this.form).subscribe({
        next: () => { this.toast.show('User updated successfully', 'success'); this.showModal = false; this.load(); },
        error: () => this.toast.show('Failed to update user', 'error')
      });
    } else {
      this.auth.register(this.form).subscribe({
        next: () => { this.toast.show('User registered successfully', 'success'); this.showModal = false; this.load(); },
        error: (err) => this.toast.show(err?.error?.message || 'Failed to register user', 'error')
      });
    }
  }

  roleBadge(role: string): string {
    const map: any = { ADMIN: 'bg-danger', STUDENT: 'bg-success', TEACHER: 'bg-primary', BOARD: 'bg-info text-dark'};
    return map[role] || 'bg-secondary';
  }

  statusBadge(status: string): string {
    const map: any = { ACTIVE: 'bg-success', INACTIVE: 'bg-secondary', PENDING: 'bg-warning text-dark', REJECTED: 'bg-danger' };
    return map[status] || 'bg-secondary';
  }
}
