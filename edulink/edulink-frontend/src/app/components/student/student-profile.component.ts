import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="section-title mb-0">My Profile</h2>
        <button class="btn-accent" *ngIf="!editing" (click)="editing=true">✏️ Edit</button>
        <div class="d-flex gap-2" *ngIf="editing">
          <button class="btn btn-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
          <button class="btn-accent" (click)="save()">Save Changes</button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-4">
          <div class="card p-4 text-center">
            <div class="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3"
              style="width:80px;height:80px;background:var(--accent);font-size:1.8rem">
              <span class="text-white fw-bold">{{ initials }}</span>
            </div>
            <h5 class="fw-bold mb-1" style="color:var(--text-primary)">{{ profile?.name }}</h5>
            <div class="text-muted small mb-2">{{ profile?.email }}</div>
            <span class="badge px-3 py-2" [ngClass]="statusBadge(profile?.status)">{{ statusLabel(profile?.status) }}</span>
            <div class="mt-3 p-3 rounded" style="background:var(--bg-secondary)">
              <div class="text-muted small mb-1">Role</div>
              <div class="fw-semibold" style="color:var(--text-primary)">Student</div>
            </div>
          </div>
        </div>

        <div class="col-md-8">
          <div class="card p-4 mb-3">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">Personal Information</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label>Full Name</label>
                <div class="form-control mt-1" style="background:var(--bg-secondary);opacity:0.7">{{ profile?.name }}</div>
                <div class="text-muted" style="font-size:0.72rem">Cannot be changed</div>
              </div>
              <div class="col-md-6">
                <label>Email Address</label>
                <div class="form-control mt-1" style="background:var(--bg-secondary);opacity:0.7">{{ profile?.email }}</div>
                <div class="text-muted" style="font-size:0.72rem">Cannot be changed</div>
              </div>
              <div class="col-md-6">
                <label>Phone Number <span class="text-success small" *ngIf="editing">✏️ Editable</span></label>
                <input class="form-control mt-1" [(ngModel)]="editForm.phone" [disabled]="!editing" [class.border-success]="editing" [class.is-invalid]="phoneError">
                <div class="invalid-feedback" *ngIf="phoneError">{{ phoneError }}</div>
              </div>
              <div class="col-md-6">
                <label>Date of Birth</label>
                <div class="form-control mt-1" style="background:var(--bg-secondary);opacity:0.7">{{ profile?.dob || '—' }}</div>
              </div>
              <div class="col-md-6">
                <label>Gender</label>
                <div class="form-control mt-1" style="background:var(--bg-secondary);opacity:0.7">{{ profile?.gender || '—' }}</div>
              </div>
              <div class="col-12">
                <label>Address <span class="text-success small" *ngIf="editing">✏️ Editable</span></label>
                <textarea class="form-control mt-1" [(ngModel)]="editForm.address" [disabled]="!editing" rows="2" [class.border-success]="editing"></textarea>
              </div>
            </div>
          </div>

          <div class="card p-4">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📎 Uploaded Documents</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <div class="p-3 rounded" style="background:var(--bg-secondary)">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span style="font-size:1.3rem">🪪</span>
                    <div>
                      <div class="fw-semibold small" style="color:var(--text-primary)">ID Proof</div>
                      <div class="text-muted" style="font-size:0.72rem">{{ profile?.idProofFileName || 'Not uploaded' }}</div>
                    </div>
                  </div>
                  <div class="d-flex gap-2" *ngIf="profile?.idProofData">
                    <button class="btn btn-sm btn-outline-primary" (click)="previewDoc('id')">Preview</button>
                    <button class="btn btn-sm btn-outline-secondary" (click)="downloadDoc('id')">Download</button>
                  </div>
                  <div *ngIf="previewType==='id' && profile?.idProofData" class="mt-2">
                    <img *ngIf="isImage(profile?.idProofFileType)" [src]="'data:'+profile.idProofFileType+';base64,'+profile.idProofData" class="img-fluid rounded" style="max-height:150px">
                    <div *ngIf="!isImage(profile?.idProofFileType)" class="text-muted small">PDF — click Download to view</div>
                  </div>
                  <div class="text-muted small" *ngIf="!profile?.idProofData">No document uploaded</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-3 rounded" style="background:var(--bg-secondary)">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span style="font-size:1.3rem">📄</span>
                    <div>
                      <div class="fw-semibold small" style="color:var(--text-primary)">Admission Letter</div>
                      <div class="text-muted" style="font-size:0.72rem">{{ profile?.admissionLetterFileName || 'Not uploaded' }}</div>
                    </div>
                  </div>
                  <div class="d-flex gap-2" *ngIf="profile?.admissionLetterData">
                    <button class="btn btn-sm btn-outline-primary" (click)="previewDoc('adm')">Preview</button>
                    <button class="btn btn-sm btn-outline-secondary" (click)="downloadDoc('adm')">Download</button>
                  </div>
                  <div *ngIf="previewType==='adm' && profile?.admissionLetterData" class="mt-2">
                    <img *ngIf="isImage(profile?.admissionLetterFileType)" [src]="'data:'+profile.admissionLetterFileType+';base64,'+profile.admissionLetterData" class="img-fluid rounded" style="max-height:150px">
                    <div *ngIf="!isImage(profile?.admissionLetterFileType)" class="text-muted small">PDF — click Download to view</div>
                  </div>
                  <div class="text-muted small" *ngIf="!profile?.admissionLetterData">No document uploaded</div>
                </div>
              </div>
            </div>
            <div class="mt-3 p-2 rounded small" style="background:rgba(79,70,229,0.08);color:var(--accent)">
              🔒 Documents are verified and cannot be changed after submission.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
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
