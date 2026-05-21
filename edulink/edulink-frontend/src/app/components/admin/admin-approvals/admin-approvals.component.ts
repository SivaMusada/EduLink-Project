import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-approvals.component.html'
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
