import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.component.html'
})
export class StudentProfileComponent implements OnInit {
  profile: any = null;
  editing = false;
  editForm: any = {};
  initials = '';
  previewType = '';
  phoneError = '';

  constructor(private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(u => {
      if (u) {
        this.profile = u;
        this.initials = u.name?.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || 'ST';
        this.editForm = { phone: u.phone || '', address: u.address || '' };
      }
      this.cdr.detectChanges();
    });
  }

  cancelEdit(): void {
    this.editing = false;
    this.phoneError = '';
    this.editForm = { phone: this.profile?.phone || '', address: this.profile?.address || '' };
  }

  save(): void {
    this.phoneError = '';
    const phoneRegex = /^[0-9]{10}$/;
    const phone = (this.editForm.phone || '').replace(/\s/g, '');
    if (!phone) {
      this.phoneError = 'Phone number is required';
      return;
    }
    if (!phoneRegex.test(phone)) {
      this.phoneError = 'Enter a valid 10-digit phone number';
      return;
    }
    this.auth.updateMe({ name: this.profile.name, phone, status: this.profile.status }).subscribe({
      next: () => {
        this.profile.phone = phone;
        this.profile.address = this.editForm.address;
        this.editing = false;
        this.phoneError = '';
        this.toast.show('Profile updated successfully', 'success');
        this.cdr.detectChanges();
      },
      error: () => this.toast.show('Failed to update profile', 'error')
    });
  }

  previewDoc(type: string): void { this.previewType = this.previewType === type ? '' : type; }

  downloadDoc(type: string): void {
    const data = type === 'id' ? this.profile.idProofData : this.profile.admissionLetterData;
    const mime = type === 'id' ? this.profile.idProofFileType : this.profile.admissionLetterFileType;
    const name = type === 'id' ? this.profile.idProofFileName : this.profile.admissionLetterFileName;
    const a = document.createElement('a');
    a.href = `data:${mime};base64,${data}`;
    a.download = name;
    a.click();
  }

  isImage(type: string): boolean { return type?.startsWith('image/'); }

  statusBadge(status: string): string {
    const map: any = { ACTIVE: 'bg-success', PENDING: 'bg-warning text-dark', REJECTED: 'bg-danger', INACTIVE: 'bg-secondary' };
    return map[status] || 'bg-secondary';
  }

  statusLabel(status: string): string {
    const map: any = { ACTIVE: 'Active', PENDING: 'Pending Approval', REJECTED: 'Rejected', INACTIVE: 'Inactive' };
    return map[status] || status;
  }
}
