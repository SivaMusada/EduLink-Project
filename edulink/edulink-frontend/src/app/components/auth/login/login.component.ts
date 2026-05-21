import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './login.component.html'
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
