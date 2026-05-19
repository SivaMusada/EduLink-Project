import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastComponent } from '../shared/toast.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center" style="background:var(--bg-primary)">
      <div class="card p-4 p-md-5" style="width:100%;max-width:420px">

        <div class="text-center mb-4">
          <div style="font-size:3rem">🔑</div>
          <h2 class="fw-bold mt-2" style="color:var(--text-primary)">Reset Password</h2>
          <p class="text-muted small">Enter your new password below.</p>
        </div>

        <!-- Invalid token state -->
        <div *ngIf="!token" class="text-center">
          <div style="font-size:3rem">❌</div>
          <p class="text-danger mt-3">Invalid or missing reset token.</p>
          <a routerLink="/forgot-password" class="btn-accent d-inline-block mt-3 px-4 py-2" style="text-decoration:none;border-radius:8px">
            Request New Link
          </a>
        </div>

        <!-- Reset form -->
        <div *ngIf="token && !done">
          <form (ngSubmit)="onSubmit()">

            <div class="mb-3">
              <label>New Password <span class="text-danger">*</span></label>
              <input type="password" class="form-control mt-1" [(ngModel)]="newPassword" name="newPassword"
                placeholder="Min 6 characters" required
                [class.is-invalid]="errors.newPassword">
              <div class="text-danger small mt-1" *ngIf="errors.newPassword">{{ errors.newPassword }}</div>
            </div>

            <div class="mb-4">
              <label>Confirm New Password <span class="text-danger">*</span></label>
              <input type="password" class="form-control mt-1" [(ngModel)]="confirmPassword" name="confirmPassword"
                placeholder="Re-enter new password" required
                [class.is-invalid]="errors.confirmPassword">
              <div class="text-danger small mt-1" *ngIf="errors.confirmPassword">{{ errors.confirmPassword }}</div>

              <!-- Password strength indicator -->
              <div class="mt-2" *ngIf="newPassword">
                <div class="d-flex gap-1 mb-1">
                  <div class="flex-grow-1 rounded" style="height:4px"
                    [style.background]="strength >= 1 ? strengthColor : 'var(--border-color)'"></div>
                  <div class="flex-grow-1 rounded" style="height:4px"
                    [style.background]="strength >= 2 ? strengthColor : 'var(--border-color)'"></div>
                  <div class="flex-grow-1 rounded" style="height:4px"
                    [style.background]="strength >= 3 ? strengthColor : 'var(--border-color)'"></div>
                </div>
                <div class="small" [style.color]="strengthColor">{{ strengthLabel }}</div>
              </div>
            </div>

            <div class="text-danger small mb-3 p-2 rounded" *ngIf="globalError"
              style="background:rgba(239,68,68,0.1)">{{ globalError }}</div>

            <button type="submit" class="btn-accent w-100 py-2" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        </div>

        <!-- Success state -->
        <div *ngIf="done" class="text-center">
          <div style="font-size:3rem">✅</div>
          <h5 class="fw-bold mt-3" style="color:var(--text-primary)">Password Reset Successful!</h5>
          <p class="text-muted small mt-2">Your password has been updated. You can now sign in with your new password.</p>
          <a routerLink="/login" class="btn-accent d-inline-block mt-3 px-4 py-2" style="text-decoration:none;border-radius:8px">
            Go to Login →
          </a>
        </div>

        <div class="text-center mt-4 pt-3" style="border-top:1px solid var(--border-color)" *ngIf="!done">
          <a routerLink="/login" style="color:var(--accent);font-size:0.875rem">← Back to Login</a>
        </div>

        <div class="text-center mt-3">
          <button class="btn btn-sm" style="background:var(--bg-secondary);color:var(--text-secondary)" (click)="toggleTheme()">
            {{ isDark ? '☀️ Light Mode' : '🌙 Dark Mode' }}
          </button>
        </div>
      </div>
    </div>
    <app-toast></app-toast>
  `
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  done = false;
  isDark = false;
  errors: any = {};
  globalError = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private theme: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    this.isDark = this.theme.isDark();
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  get strength(): number {
    const p = this.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    return s;
  }

  get strengthColor(): string {
    return ['', '#ef4444', '#f59e0b', '#10b981'][this.strength] || '#ef4444';
  }

  get strengthLabel(): string {
    return ['', 'Weak', 'Medium', 'Strong'][this.strength] || 'Weak';
  }

  validate(): boolean {
    this.errors = {};
    if (!this.newPassword || this.newPassword.length < 6)
      this.errors.newPassword = 'Password must be at least 6 characters';
    if (!this.confirmPassword)
      this.errors.confirmPassword = 'Please confirm your password';
    else if (this.newPassword !== this.confirmPassword)
      this.errors.confirmPassword = 'Passwords do not match';
    return Object.values(this.errors).every(v => !v);
  }

  onSubmit(): void {
    this.globalError = '';
    if (!this.validate()) return;
    this.loading = true;
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.done = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.globalError = err?.error?.message || 'Reset failed. The link may have expired.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleTheme(): void { this.theme.toggle(); this.isDark = this.theme.isDark(); }
}
