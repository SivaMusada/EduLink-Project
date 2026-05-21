import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './reset-password.component.html'
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
