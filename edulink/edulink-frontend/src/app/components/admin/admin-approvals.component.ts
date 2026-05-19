import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="section-title mb-0">Student Registrations</h2>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm" [ngClass]="filter==='ALL'?'btn-accent':'btn-outline-secondary'" (click)="setFilter('ALL')">All</button>
          <button class="btn btn-sm" [ngClass]="filter==='PENDING'?'btn-accent':'btn-outline-secondary'" (click)="setFilter('PENDING')">
            Pending <span class="badge bg-warning text-dark ms-1">{{ pendingCount }}</span>
          </button>
          <button class="btn btn-sm" [ngClass]="filter==='ACTIVE'?'btn-accent':'btn-outline-secondary'" (click)="setFilter('ACTIVE')">Approved</button>
          <button class="btn btn-sm" [ngClass]="filter==='REJECTED'?'btn-accent':'btn-outline-secondary'" (click)="setFilter('REJECTED')">Rejected</button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>DOB</th><th>Gender</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filtered">
              <td class="fw-semibold">{{ s.name }}</td>
              <td>{{ s.email }}</td>
              <td>{{ s.phone }}</td>
              <td>{{ s.dob }}</td>
              <td>{{ s.gender }}</td>
              <td><span class="badge" [ngClass]="statusBadge(s.status)">{{ statusLabel(s.status) }}</span></td>
              <td>
                <div class="d-flex gap-1 flex-wrap">
                  <button class="btn btn-sm btn-outline-info" (click)="viewDetails(s.userId)">View</button>
                  <button class="btn btn-sm btn-success" *ngIf="s.status==='PENDING' || s.status==='REJECTED'" (click)="approve(s.userId)">Approve</button>
                  <button class="btn btn-sm btn-danger" *ngIf="s.status==='PENDING'" (click)="reject(s.userId)">Reject</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filtered.length===0">
              <td colspan="7" class="text-center text-muted py-4">No registrations found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal d-block" *ngIf="selected" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">Student Details</h5>
              <button class="btn-close" (click)="selected=null"></button>
            </div>
            <div class="modal-body" *ngIf="!loadingDetails">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-1">Full Name</div>
                    <div class="fw-semibold" style="color:var(--text-primary)">{{ selected.name }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-1">Email</div>
                    <div class="fw-semibold" style="color:var(--text-primary)">{{ selected.email }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-1">Phone</div>
                    <div class="fw-semibold" style="color:var(--text-primary)">{{ selected.phone }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-1">Date of Birth</div>
                    <div class="fw-semibold" style="color:var(--text-primary)">{{ selected.dob }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-1">Gender</div>
                    <div class="fw-semibold" style="color:var(--text-primary)">{{ selected.gender }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-1">Status</div>
                    <span class="badge" [ngClass]="statusBadge(selected.status)">{{ statusLabel(selected.status) }}</span>
                  </div>
                </div>
                <div class="col-12">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-1">Address</div>
                    <div style="color:var(--text-primary)">{{ selected.address }}</div>
                  </div>
                </div>

                <div class="col-md-6" *ngIf="selected.idProofData">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-2">🪪 ID Proof</div>
                    <div class="fw-semibold small mb-2" style="color:var(--text-primary)">{{ selected.idProofFileName }}</div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-primary" (click)="openFile(selected.idProofData, selected.idProofFileType)">Preview</button>
                      <button class="btn btn-sm btn-outline-secondary" (click)="downloadFile(selected.idProofData, selected.idProofFileType, selected.idProofFileName)">Download</button>
                    </div>
                    <div *ngIf="previewType==='id'" class="mt-2">
                      <img *ngIf="isImage(selected.idProofFileType)" [src]="'data:'+selected.idProofFileType+';base64,'+selected.idProofData"
                        class="img-fluid rounded" style="max-height:200px">
                    </div>
                  </div>
                </div>

                <div class="col-md-6" *ngIf="selected.admissionLetterData">
                  <div class="p-3 rounded" style="background:var(--bg-secondary)">
                    <div class="text-muted small mb-2">📄 Admission Letter</div>
                    <div class="fw-semibold small mb-2" style="color:var(--text-primary)">{{ selected.admissionLetterFileName }}</div>
                    <div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-primary" (click)="openFile(selected.admissionLetterData, selected.admissionLetterFileType)">Preview</button>
                      <button class="btn btn-sm btn-outline-secondary" (click)="downloadFile(selected.admissionLetterData, selected.admissionLetterFileType, selected.admissionLetterFileName)">Download</button>
                    </div>
                    <div *ngIf="previewType==='adm'" class="mt-2">
                      <img *ngIf="isImage(selected.admissionLetterFileType)" [src]="'data:'+selected.admissionLetterFileType+';base64,'+selected.admissionLetterData"
                        class="img-fluid rounded" style="max-height:200px">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-body text-center py-5" *ngIf="loadingDetails">
              <div class="spinner-border" style="color:var(--accent)"></div>
              <div class="text-muted mt-2">Loading details...</div>
            </div>
            <div class="modal-footer border-0" *ngIf="selected && (selected.status==='PENDING' || selected.status==='REJECTED') && !loadingDetails">
              <button class="btn btn-secondary" (click)="selected=null;previewType=''">Close</button>
              <button class="btn btn-danger" *ngIf="selected.status==='PENDING'" (click)="reject(selected.userId);selected=null">Reject</button>
              <button class="btn btn-success" (click)="approve(selected.userId);selected=null">Approve</button>
            </div>
            <div class="modal-footer border-0" *ngIf="selected && selected.status==='ACTIVE' && !loadingDetails">
              <button class="btn btn-secondary" (click)="selected=null;previewType=''">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminApprovalsComponent implements OnInit {
  students: any[] = [];
  filtered: any[] = [];
  filter = 'ALL';
  selected: any = null;
  loadingDetails = false;
  pendingCount = 0;
  previewType = '';

  constructor(private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.auth.getAllStudentRegistrations().subscribe(s => {
      this.students = s;
      this.pendingCount = s.filter((x: any) => x.status === 'PENDING').length;
      this.applyFilter();
      this.cdr.detectChanges();
    });
  }

  setFilter(f: string): void { this.filter = f; this.applyFilter(); }

  applyFilter(): void {
    this.filtered = this.filter === 'ALL' ? this.students : this.students.filter(s => s.status === this.filter);
  }

  viewDetails(id: number): void {
    this.selected = {};
    this.loadingDetails = true;
    this.previewType = '';
    this.auth.getStudentWithFiles(id).subscribe(s => {
      this.selected = s;
      this.loadingDetails = false;
      this.cdr.detectChanges();
    });
  }

  approve(id: number): void {
    this.auth.approveStudent(id, 'ACTIVE').subscribe({
      next: () => { this.toast.show('Student approved successfully', 'success'); this.load(); },
      error: () => this.toast.show('Failed to approve', 'error')
    });
  }

  reject(id: number): void {
    this.auth.approveStudent(id, 'REJECTED').subscribe({
      next: () => { this.toast.show('Student registration rejected', 'info'); this.load(); },
      error: () => this.toast.show('Failed to reject', 'error')
    });
  }

  openFile(data: string, type: string): void {
    const blob = this.b64toBlob(data, type);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private b64toBlob(b64: string, type: string): Blob {
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type });
  }

  downloadFile(data: string, type: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = `data:${type};base64,${data}`;
    link.download = fileName;
    link.click();
  }

  isImage(type: string): boolean { return type?.startsWith('image/'); }

  statusBadge(status: string): string {
    const map: any = { PENDING: 'bg-warning text-dark', ACTIVE: 'bg-success', REJECTED: 'bg-danger', INACTIVE: 'bg-secondary' };
    return map[status] || 'bg-secondary';
  }

  statusLabel(status: string): string {
    const map: any = { PENDING: 'Pending Approval', ACTIVE: 'Approved', REJECTED: 'Rejected', INACTIVE: 'Inactive' };
    return map[status] || status;
  }
}
