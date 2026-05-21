import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeService } from '../../../services/theme.service';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastComponent],
  templateUrl: './student-register.component.html'
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
