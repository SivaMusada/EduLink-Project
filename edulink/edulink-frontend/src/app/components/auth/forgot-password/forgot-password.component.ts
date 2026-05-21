import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './forgot-password.component.html'
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
