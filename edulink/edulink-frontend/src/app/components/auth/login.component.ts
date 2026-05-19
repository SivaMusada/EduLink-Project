import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from '../../services/theme.service';
import { ToastComponent } from '../shared/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center" style="background:var(--bg-primary)">
      <div class="card p-4 p-md-5" style="width:100%;max-width:420px">

        <div class="text-center mb-4">
          <div style="font-size:3rem">🎓</div>
          <h2 class="fw-bold mt-2" style="color:var(--text-primary)">EduLink</h2>
          <p class="text-muted small">Sign in to your account</p>
        </div>

        <form (ngSubmit)="onLogin()">
          <div class="mb-3">
            <label>Email Address</label>
            <input type="email" class="form-control mt-1" [(ngModel)]="email" name="email" placeholder="you@example.com" required>
          </div>
          <div class="mb-4">
            <label>Password</label>
            <div class="position-relative mt-1">
              <input [type]="showPassword ? 'text' : 'password'" class="form-control pe-5" [(ngModel)]="password" name="password" placeholder="••••••••" required>
              <button type="button" class="btn position-absolute top-50 end-0 translate-middle-y me-1 p-1 border-0 bg-transparent" (click)="showPassword = !showPassword" style="color:var(--text-secondary);line-height:1">
                <i [class]="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'" style="font-size:1.1rem"></i>
              </button>
            </div>
          </div>

          <div class="rounded p-3 mb-3" *ngIf="statusMsg"
            [ngClass]="statusMsg.type==='pending' ? 'alert-warning' : 'alert-danger'"
            style="border-radius:8px;font-size:0.875rem">
            <span *ngIf="statusMsg.type==='pending'">⏳ </span>
            <span *ngIf="statusMsg.type==='rejected'">❌ </span>
            {{ statusMsg.text }}
          </div>

          <button type="submit" class="btn-accent w-100 py-2" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="text-center mt-4 pt-3" style="border-top:1px solid var(--border-color)">
          <p class="text-muted small mb-2">New student? Register yourself</p>
          <a routerLink="/register/student" class="btn btn-sm w-100" style="background:var(--bg-secondary);color:var(--accent);border:1px solid var(--accent)">
            🎒 Student Registration
          </a>
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
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  isDark = false;
  showPassword = false;
  statusMsg: { type: string; text: string } | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private theme: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    this.isDark = this.theme.isDark();
  }

  onLogin(): void {
    this.statusMsg = null;
    this.loading = true;

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: res => {
        this.toast.show(`Welcome back, ${res.name || res.email}!`, 'success');
        const route = res.role === 'STUDENT' ? '/student/dashboard' : res.role === 'TEACHER' ? '/teacher/dashboard' : '/dashboard';
        setTimeout(() => this.router.navigate([route]), 500);
      },
      error: (err) => {
        this.loading = false;
        const msg: string = err?.error?.message || '';

        if (msg.toLowerCase().includes('under review') || msg.toLowerCase().includes('pending')) {
          this.statusMsg = { type: 'pending', text: 'Your registration is still under review. Please wait for admin approval.' };
        } else if (msg.toLowerCase().includes('rejected')) {
          this.statusMsg = { type: 'rejected', text: 'Your registration has been rejected. Please contact the administrator.' };
        } else {
          this.toast.show('Invalid credentials. Please try again.', 'error');
        }
        this.cdr.detectChanges();
      }
    });
  }

  toggleTheme(): void {
    this.theme.toggle();
    this.isDark = this.theme.isDark();
  }
}
