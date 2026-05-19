import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastComponent } from '../shared/toast.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center" style="background:var(--bg-primary)">
      <div class="card p-4 p-md-5" style="width:100%;max-width:440px">

        <!-- Step indicator -->
        <div class="d-flex align-items-center justify-content-center gap-2 mb-4">
          <div class="d-flex align-items-center justify-content-center rounded-circle fw-bold"
            style="width:32px;height:32px;font-size:0.85rem"
            [style.background]="step >= 1 ? 'var(--accent)' : 'var(--bg-secondary)'"
            [style.color]="step >= 1 ? '#fff' : 'var(--text-muted)'">1</div>
          <div style="height:2px;width:40px"
            [style.background]="step >= 2 ? 'var(--accent)' : 'var(--border-color)'"></div>
          <div class="d-flex align-items-center justify-content-center rounded-circle fw-bold"
            style="width:32px;height:32px;font-size:0.85rem"
            [style.background]="step >= 2 ? 'var(--accent)' : 'var(--bg-secondary)'"
            [style.color]="step >= 2 ? '#fff' : 'var(--text-muted)'">2</div>
          <div style="height:2px;width:40px"
            [style.background]="step >= 3 ? 'var(--accent)' : 'var(--border-color)'"></div>
          <div class="d-flex align-items-center justify-content-center rounded-circle fw-bold"
            style="width:32px;height:32px;font-size:0.85rem"
            [style.background]="step >= 3 ? 'var(--accent)' : 'var(--bg-secondary)'"
            [style.color]="step >= 3 ? '#fff' : 'var(--text-muted)'">3</div>
        </div>

        <!-- Step 1: Enter Email -->
        <div *ngIf="step === 1">
          <div class="text-center mb-4">
            <div style="font-size:2.5rem">📧</div>
            <h4 class="fw-bold mt-2" style="color:var(--text-primary)">Forgot Password</h4>
            <p class="text-muted small">Enter your registered email to reset your password.</p>
          </div>

          <form (ngSubmit)="verifyEmail()">
            <div class="mb-4">
              <label>Email Address <span class="text-danger">*</span></label>
              <input type="email" class="form-control mt-1" [(ngModel)]="email" name="email"
                placeholder="you@example.com" required
                [class.is-invalid]="emailError">
              <div class="text-danger small mt-1" *ngIf="emailError">{{ emailError }}</div>
            </div>

            <button type="submit" class="btn-accent w-100 py-2" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'Verifying...' : 'Verify Email' }}
            </button>
          </form>
        </div>

        <!-- Step 2: Set New Password -->
        <div *ngIf="step === 2">
          <div class="text-center mb-4">
            <div style="font-size:2.5rem">🔑</div>
            <h4 class="fw-bold mt-2" style="color:var(--text-primary)">Set New Password</h4>
            <p class="text-muted small">
              Resetting password for <strong style="color:var(--accent)">{{ email }}</strong>
            </p>
          </div>

          <form (ngSubmit)="doReset()">
            <div class="mb-3">
              <label>New Password <span class="text-danger">*</span></label>
              <input type="password" class="form-control mt-1" [(ngModel)]="newPassword" name="newPassword"
                placeholder="Min 6 characters" required
                [class.is-invalid]="passwordError">
              <div class="text-danger small mt-1" *ngIf="passwordError">{{ passwordError }}</div>

              <!-- Strength bar -->
              <div class="mt-2" *ngIf="newPassword">
                <div class="d-flex gap-1 mb-1">
                  <div class="flex-grow-1 rounded" style="height:4px;transition:background 0.3s"
                    [style.background]="strength >= 1 ? strengthColor : 'var(--border-color)'"></div>
                  <div class="flex-grow-1 rounded" style="height:4px;transition:background 0.3s"
                    [style.background]="strength >= 2 ? strengthColor : 'var(--border-color)'"></div>
                  <div class="flex-grow-1 rounded" style="height:4px;transition:background 0.3s"
                    [style.background]="strength >= 3 ? strengthColor : 'var(--border-color)'"></div>
                </div>
                <span class="small fw-semibold" [style.color]="strengthColor">{{ strengthLabel }}</span>
              </div>
            </div>

            <div class="mb-4">
              <label>Confirm New Password <span class="text-danger">*</span></label>
              <input type="password" class="form-control mt-1" [(ngModel)]="confirmPassword" name="confirmPassword"
                placeholder="Re-enter new password" required
                [class.is-invalid]="confirmError">
              <div class="text-danger small mt-1" *ngIf="confirmError">{{ confirmError }}</div>
            </div>

            <div class="text-danger small mb-3 p-2 rounded" *ngIf="globalError"
              style="background:rgba(239,68,68,0.1)">{{ globalError }}</div>

            <button type="submit" class="btn-accent w-100 py-2" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>

            <button type="button" class="btn btn-sm w-100 mt-2"
              style="background:var(--bg-secondary);color:var(--text-secondary)"
              (click)="step = 1">
              ← Change Email
            </button>
          </form>
        </div>

        <!-- Step 3: Success -->
        <div *ngIf="step === 3" class="text-center">
          <div style="font-size:3.5rem">✅</div>
          <h4 class="fw-bold mt-3" style="color:var(--text-primary)">Password Reset!</h4>
          <p class="text-muted small mt-2">
            Your password has been updated successfully.<br>
            You can now sign in with your new password.
          </p>
          <a routerLink="/login" class="btn-accent d-block mt-4 py-2" style="text-decoration:none;border-radius:8px">
            Go to Login →
          </a>
        </div>

        <!-- Back to login -->
        <div class="text-center mt-4 pt-3" style="border-top:1px solid var(--border-color)" *ngIf="step < 3">
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
export class ForgotPasswordComponent {
  step = 1;
  email = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  isDark = false;

  emailError = '';
  passwordError = '';
  confirmError = '';
  globalError = '';

  constructor(
    private auth: AuthService,
    private theme: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    this.isDark = this.theme.isDark();
  }

  verifyEmail(): void {
    this.emailError = '';
    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError = 'Please enter a valid email address';
      return;
    }
    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.step = 2;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.emailError = err?.error?.message || 'No account found with this email address';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  doReset(): void {
    this.passwordError = '';
    this.confirmError = '';
    this.globalError = '';

    if (!this.newPassword || this.newPassword.length < 6) {
      this.passwordError = 'Password must be at least 6 characters';
      return;
    }
    if (!this.confirmPassword) {
      this.confirmError = 'Please confirm your password';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.confirmError = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.auth.resetPassword(this.email, this.newPassword).subscribe({
      next: () => {
        this.step = 3;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.globalError = err?.error?.message || 'Reset failed. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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
    return ['', 'Weak', 'Medium', 'Strong'][this.strength] || '';
  }

  toggleTheme(): void { this.theme.toggle(); this.isDark = this.theme.isDark(); }
}
