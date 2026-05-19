import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="section-title mb-0">User Management</h2>
      </div>

      <div class="table-wrapper">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td class="fw-semibold">{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.phone }}</td>
              <td><span class="badge" [ngClass]="roleBadge(u.role)">{{ u.role }}</span></td>
              <td>
                <span class="badge" [ngClass]="statusBadge(u.status)">{{ u.status }}</span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(u)">Edit</button>
                <button class="btn btn-sm btn-outline-warning me-1" (click)="openPasswordModal(u)">Reset Password</button>
                <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(u)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="users.length===0">
              <td colspan="6" class="text-center text-muted py-4">No users found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">{{ editId ? 'Edit User' : 'Register User' }}</h5>
              <button class="btn-close" (click)="showModal=false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3" *ngIf="!editId"><label>Full Name</label><input class="form-control mt-1" [(ngModel)]="form.name" placeholder="Full name"></div>
              <div class="mb-3" *ngIf="!editId"><label>Email</label><input type="email" class="form-control mt-1" [(ngModel)]="form.email" placeholder="Email"></div>
              <div class="mb-3" *ngIf="!editId"><label>Phone</label><input class="form-control mt-1" [(ngModel)]="form.phone" placeholder="Phone"></div>
              <div class="mb-3" *ngIf="!editId"><label>Password</label><input type="password" class="form-control mt-1" [(ngModel)]="form.password" placeholder="Password"></div>
              <div class="mb-3" *ngIf="!editId">
                <label>Role</label>
                <select class="form-select mt-1" [(ngModel)]="form.role">
                  <option value="">Select role</option>
                  <option *ngFor="let r of roles" [value]="r">{{ r }}</option>
                </select>
              </div>
              <div class="mb-3" *ngIf="editId">
                <label>Name</label>
                <input class="form-control mt-1" [(ngModel)]="form.name" placeholder="Full name">
              </div>
              <div class="mb-3" *ngIf="editId">
                <label>Phone</label>
                <input class="form-control mt-1" [(ngModel)]="form.phone" placeholder="Phone number">
              </div>
              <div class="mb-3" *ngIf="editId">
                <label>Status</label>
                <select class="form-select mt-1" [(ngModel)]="form.status">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="showModal=false">Cancel</button>
              <button class="btn-accent" (click)="save()">{{ editId ? 'Update' : 'Register' }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal d-block" *ngIf="passwordTarget" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">Reset Password — {{ passwordTarget?.name }}</h5>
              <button class="btn-close" (click)="closePasswordModal()"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>New Password</label>
                <input type="password" class="form-control mt-1" [(ngModel)]="pwForm.newPassword" placeholder="Enter new password">
              </div>
              <div class="mb-3">
                <label>Confirm Password</label>
                <input type="password" class="form-control mt-1" [(ngModel)]="pwForm.confirmPassword" placeholder="Confirm new password">
              </div>
              <div class="text-danger small" *ngIf="pwMismatch">Passwords do not match</div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="closePasswordModal()">Cancel</button>
              <button class="btn btn-warning" (click)="savePassword()">Update Password</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal d-block" *ngIf="deleteTarget" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">Confirm Delete</h5>
              <button class="btn-close" (click)="deleteTarget=null"></button>
            </div>
            <div class="modal-body">
              <p style="color:var(--text-primary)">
                Are you sure you want to delete user <strong>{{ deleteTarget.name }}</strong>
                (<span class="text-muted">{{ deleteTarget.email }}</span>)?
              </p>
              <div class="p-3 rounded" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)">
                <div class="small" style="color:#ef4444">
                  ⚠️ This will permanently remove the user from the database.
                  <span *ngIf="deleteTarget.role==='STUDENT'"> The student record will also be removed.</span>
                </div>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="deleteTarget=null">Cancel</button>
              <button class="btn btn-danger" (click)="deleteUser()" [disabled]="deleting">
                <span *ngIf="deleting" class="spinner-border spinner-border-sm me-1"></span>
                {{ deleting ? 'Deleting...' : 'Delete User' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
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
