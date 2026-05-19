import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from '../../services/theme.service';
import { ToastComponent } from '../shared/toast.component';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center py-5" style="background:var(--bg-primary)">
      <div style="width:100%;max-width:660px;padding:0 16px">

        <div *ngIf="!submitted">
          <div class="card p-4 p-md-5">
            <div class="text-center mb-4">
              <div style="font-size:2.5rem">🎓</div>
              <h2 class="fw-bold mt-2" style="color:var(--text-primary)">EduLink</h2>
              <p class="text-muted small">Student Registration</p>
            </div>

            <form (ngSubmit)="onSubmit()" novalidate>
              <div class="row g-3">

                <div class="col-12">
                  <label>Full Name <span class="text-danger">*</span></label>
                  <input class="form-control mt-1" [(ngModel)]="form.name" name="name" placeholder="Enter your full name" required>
                  <div class="text-danger small mt-1" *ngIf="errors.name">{{ errors.name }}</div>
                </div>

                <div class="col-md-6">
                  <label>Email Address <span class="text-danger">*</span></label>
                  <input type="email" class="form-control mt-1" [(ngModel)]="form.email" name="email" placeholder="you@example.com" required>
                  <div class="text-danger small mt-1" *ngIf="errors.email">{{ errors.email }}</div>
                </div>

                <div class="col-md-6">
                  <label>Phone Number <span class="text-danger">*</span></label>
                  <div class="input-group mt-1">
                    <span class="input-group-text" style="background:var(--bg-secondary);border-color:var(--border-color);color:var(--text-secondary)">+91</span>
                    <input class="form-control" [(ngModel)]="form.phone" name="phone"
                      placeholder="10-digit mobile number"
                      maxlength="10"
                      inputmode="numeric"
                      (input)="onPhoneInput($event)"
                      (blur)="validatePhone()"
                      [class.is-invalid]="errors.phone"
                      [class.is-valid]="form.phone.length===10 && !errors.phone"
                      required>
                  </div>
                  <div class="d-flex justify-content-between mt-1">
                    <div class="text-danger small" *ngIf="errors.phone">{{ errors.phone }}</div>
                    <div class="text-success small" *ngIf="form.phone.length===10 && !errors.phone">✓ Valid phone number</div>
                    <div class="text-muted small ms-auto">{{ form.phone.length }}/10</div>
                  </div>
                </div>

                <div class="col-md-6">
                  <label>Password <span class="text-danger">*</span></label>
                  <input type="password" class="form-control mt-1" [(ngModel)]="form.password" name="password" placeholder="Min 6 characters" required>
                  <div class="text-danger small mt-1" *ngIf="errors.password">{{ errors.password }}</div>
                </div>

                <div class="col-md-6">
                  <label>Confirm Password <span class="text-danger">*</span></label>
                  <input type="password" class="form-control mt-1" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Re-enter password" required>
                  <div class="text-danger small mt-1" *ngIf="errors.confirmPassword">{{ errors.confirmPassword }}</div>
                </div>

                <div class="col-md-6">
                  <label>Date of Birth <span class="text-danger">*</span></label>
                  <input type="date" class="form-control mt-1" [(ngModel)]="form.dob" name="dob" required>
                  <div class="text-danger small mt-1" *ngIf="errors.dob">{{ errors.dob }}</div>
                </div>

                <div class="col-md-6">
                  <label>Gender <span class="text-danger">*</span></label>
                  <select class="form-select mt-1" [(ngModel)]="form.gender" name="gender" required>
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <div class="text-danger small mt-1" *ngIf="errors.gender">{{ errors.gender }}</div>
                </div>

                <div class="col-12">
                  <label>Address <span class="text-danger">*</span></label>
                  <textarea class="form-control mt-1" [(ngModel)]="form.address" name="address" rows="3" placeholder="Enter your full address" required></textarea>
                  <div class="text-danger small mt-1" *ngIf="errors.address">{{ errors.address }}</div>
                </div>

                <div class="col-md-6">
                  <label>Grade Level <span class="text-danger">*</span></label>
                  <select class="form-select mt-1" [(ngModel)]="form.gradeLevel" name="gradeLevel">
                    <option value="">Select grade</option>
                    <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
                  </select>
                  <div class="text-danger small mt-1" *ngIf="errors.gradeLevel">{{ errors.gradeLevel }}</div>
                </div>

                <div class="col-12">
                  <label>ID Proof Document <span class="text-danger">*</span></label>
                  <div class="mt-1 p-3 rounded" style="border:2px dashed var(--border-color);background:var(--bg-secondary);cursor:pointer"
                    (click)="idInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event,'id')">
                    <input #idInput type="file" class="d-none" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event,'id')">
                    <div *ngIf="!idProofFile" class="text-center text-muted">
                      <div style="font-size:2rem">📎</div>
                      <div class="small mt-1">Click or drag to upload National ID / Passport</div>
                      <div class="small">PDF, JPG, PNG (max 5MB)</div>
                    </div>
                    <div *ngIf="idProofFile" class="d-flex align-items-center gap-2">
                      <span style="font-size:1.5rem">{{ fileIcon(idProofFile.type) }}</span>
                      <div>
                        <div class="fw-semibold small" style="color:var(--text-primary)">{{ idProofFile.name }}</div>
                        <div class="text-muted small">{{ fileSize(idProofFile.size) }}</div>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-danger ms-auto" (click)="clearFile('id');$event.stopPropagation()">✕</button>
                    </div>
                  </div>
                  <div class="text-danger small mt-1" *ngIf="errors.idProof">{{ errors.idProof }}</div>
                </div>

                <div class="col-12">
                  <label>Admission Letter <span class="text-danger">*</span></label>
                  <div class="mt-1 p-3 rounded" style="border:2px dashed var(--border-color);background:var(--bg-secondary);cursor:pointer"
                    (click)="admInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event,'adm')">
                    <input #admInput type="file" class="d-none" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event,'adm')">
                    <div *ngIf="!admissionFile" class="text-center text-muted">
                      <div style="font-size:2rem">📄</div>
                      <div class="small mt-1">Click or drag to upload Admission Letter</div>
                      <div class="small">PDF, JPG, PNG (max 5MB)</div>
                    </div>
                    <div *ngIf="admissionFile" class="d-flex align-items-center gap-2">
                      <span style="font-size:1.5rem">{{ fileIcon(admissionFile.type) }}</span>
                      <div>
                        <div class="fw-semibold small" style="color:var(--text-primary)">{{ admissionFile.name }}</div>
                        <div class="text-muted small">{{ fileSize(admissionFile.size) }}</div>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-danger ms-auto" (click)="clearFile('adm');$event.stopPropagation()">✕</button>
                    </div>
                  </div>
                  <div class="text-danger small mt-1" *ngIf="errors.admissionLetter">{{ errors.admissionLetter }}</div>
                </div>

              </div>

              <div class="text-danger small mt-3 p-2 rounded" *ngIf="globalError" style="background:rgba(239,68,68,0.1)">{{ globalError }}</div>

              <button type="submit" class="btn-accent w-100 py-2 mt-4" [disabled]="loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Submitting...' : 'Submit Registration' }}
              </button>

              <p class="text-center text-muted small mt-3">
                Already have an account?
                <a routerLink="/login" style="color:var(--accent)">Sign in</a>
              </p>
            </form>
          </div>
        </div>

        <div *ngIf="submitted" class="card p-5 text-center">
          <div style="font-size:4rem">✅</div>
          <h3 class="fw-bold mt-3" style="color:var(--text-primary)">Registration Submitted!</h3>
          <p class="mt-3" style="color:var(--text-secondary);line-height:1.7">
            Your registration is submitted successfully and is <strong>pending admin approval</strong>.<br>
            You will be able to log in once an administrator reviews and approves your account.
          </p>
          <div class="p-3 rounded mt-3" style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2)">
            <div class="small text-muted">Registered as</div>
            <div class="fw-semibold" style="color:var(--text-primary)">{{ form.name }}</div>
            <div class="text-muted small">{{ form.email }}</div>
          </div>
          <a routerLink="/login" class="btn-accent d-inline-block mt-4 px-4 py-2" style="text-decoration:none;border-radius:8px">
            Back to Login
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
export class StudentRegisterComponent {
  form = { name: '', email: '', phone: '', password: '', dob: '', gender: '', address: '', gradeLevel: '' };
  readonly grades = ['Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
  confirmPassword = '';
  loading = false;
  submitted = false;
  globalError = '';
  isDark = false;
  errors: any = {};

  idProofFile: File | null = null;
  admissionFile: File | null = null;

  private idProofBase64 = '';
  private admissionBase64 = '';

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private theme: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    this.isDark = this.theme.isDark();
  }

  onFileChange(event: Event, type: 'id' | 'adm'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0], type);
    }
  }

  onDrop(event: DragEvent, type: 'id' | 'adm'): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file, type);
  }

  private processFile(file: File, type: 'id' | 'adm'): void {
    const maxSize = 5 * 1024 * 1024;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

    if (!allowed.includes(file.type)) {
      if (type === 'id') this.errors.idProof = 'Only PDF, JPG, PNG files are allowed';
      else this.errors.admissionLetter = 'Only PDF, JPG, PNG files are allowed';
      this.cdr.detectChanges();
      return;
    }

    if (file.size > maxSize) {
      if (type === 'id') this.errors.idProof = 'File size must be under 5MB';
      else this.errors.admissionLetter = 'File size must be under 5MB';
      this.cdr.detectChanges();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (type === 'id') {
        this.idProofFile = file;
        this.idProofBase64 = base64;
        this.errors.idProof = '';
      } else {
        this.admissionFile = file;
        this.admissionBase64 = base64;
        this.errors.admissionLetter = '';
      }
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  clearFile(type: 'id' | 'adm'): void {
    if (type === 'id') { this.idProofFile = null; this.idProofBase64 = ''; }
    else { this.admissionFile = null; this.admissionBase64 = ''; }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // strip anything that is not a digit
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    this.form.phone = digits;
    input.value = digits;
    this.validatePhone();
  }

  validatePhone(): void {
    const p = this.form.phone;
    if (!p) {
      this.errors.phone = 'Phone number is required';
    } else if (p.length !== 10) {
      this.errors.phone = `Enter remaining ${10 - p.length} digit(s)`;
    } else if (/^[0-5]/.test(p)) {
      this.errors.phone = 'Mobile number must start with 6, 7, 8, or 9';
    } else {
      this.errors.phone = '';
    }
    this.cdr.detectChanges();
  }

  validate(): boolean {
    this.errors = {};
    if (!this.form.name || this.form.name.trim().length < 2) this.errors.name = 'Full name is required (min 2 characters)';
    if (!this.form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) this.errors.email = 'Valid email is required';
    if (!this.form.phone) this.errors.phone = 'Phone number is required';
    else if (this.form.phone.length !== 10) this.errors.phone = `Enter remaining ${10 - this.form.phone.length} digit(s)`;
    else if (/^[0-5]/.test(this.form.phone)) this.errors.phone = 'Mobile number must start with 6, 7, 8, or 9';
    if (!this.form.password || this.form.password.length < 6) this.errors.password = 'Password must be at least 6 characters';
    if (this.form.password !== this.confirmPassword) this.errors.confirmPassword = 'Passwords do not match';
    if (!this.form.dob) this.errors.dob = 'Date of birth is required';
    if (!this.form.gender) this.errors.gender = 'Gender is required';
    if (!this.form.address || !this.form.address.trim()) this.errors.address = 'Address is required';
    if (!this.form.gradeLevel || !this.form.gradeLevel.trim()) this.errors.gradeLevel = 'Grade level is required';
    if (!this.idProofFile) this.errors.idProof = 'ID Proof document is required';
    if (!this.admissionFile) this.errors.admissionLetter = 'Admission Letter is required';
    return Object.values(this.errors).every(v => !v);
  }

  onSubmit(): void {
    this.globalError = '';
    if (!this.validate()) return;

    this.loading = true;
    const payload = {
      ...this.form,
      idProofFileName: this.idProofFile!.name,
      idProofFileType: this.idProofFile!.type,
      idProofData: this.idProofBase64,
      admissionLetterFileName: this.admissionFile!.name,
      admissionLetterFileType: this.admissionFile!.type,
      admissionLetterData: this.admissionBase64
    };

    this.auth.registerStudent(payload).subscribe({
      next: () => {
        this.submitted = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        const status = err?.status;
        const msg = err?.error?.message || err?.message || '';
        if (status === 400 && msg.toLowerCase().includes('email')) {
          this.globalError = 'This email is already registered. Please use a different email or sign in.';
        } else if (status === 413) {
          this.globalError = 'Files are too large. Please upload files smaller than 5MB each.';
        } else if (status === 0) {
          this.globalError = 'Cannot connect to server. Please ensure the backend is running.';
        } else {
          this.globalError = msg || 'Registration failed. Please try again.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fileIcon(type: string): string {
    if (type === 'application/pdf') return '📕';
    if (type.startsWith('image/')) return '🖼️';
    return '📎';
  }

  fileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  toggleTheme(): void {
    this.theme.toggle();
    this.isDark = this.theme.isDark();
  }
}
