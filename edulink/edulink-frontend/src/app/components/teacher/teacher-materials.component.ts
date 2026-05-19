import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-teacher-materials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Learning Materials</h2>
          <p class="text-muted small mb-0">{{ filtered.length }} material(s) across your courses</p>
        </div>
        <button class="btn-accent" (click)="openUpload()">+ Upload Material</button>
      </div>

      <!-- Filter -->
      <div class="card p-3 mb-4">
        <div class="row g-2">
          <div class="col-md-5">
            <input class="form-control" [(ngModel)]="search" placeholder="🔍 Search materials..." (input)="applyFilter()">
          </div>
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="filterCourse" (change)="applyFilter()">
              <option value="">All My Courses</option>
              <option *ngFor="let c of courses" [value]="c.courseId">{{ c.title }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Course Progress -->
      <div class="row g-3 mb-4">
        <div class="col-md-4" *ngFor="let c of courses">
          <div class="card p-3">
            <div class="d-flex justify-content-between mb-2">
              <span class="fw-semibold small" style="color:var(--text-primary)">{{ c.title }}</span>
              <span class="badge bg-info text-dark">{{ c.gradeLevel }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="small text-muted">Materials uploaded</span>
              <span class="small fw-semibold" style="color:var(--text-primary)">{{ materialCount(c.courseId) }}</span>
            </div>
            <div class="progress" style="height:6px">
              <div class="progress-bar" style="background:var(--accent)" [style.width]="materialPct(c.courseId)+'%'"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Materials Grid -->
      <div class="row g-3">
        <div class="col-md-6 col-lg-4" *ngFor="let m of filtered">
          <div class="card p-3 h-100">
            <div class="d-flex align-items-start gap-3">
              <div class="rounded d-flex align-items-center justify-content-center"
                style="width:48px;height:48px;min-width:48px;font-size:1.6rem;background:var(--bg-secondary)">
                {{ fileIcon(m) }}
              </div>
              <div class="flex-grow-1 overflow-hidden">
                <div class="fw-semibold text-truncate" style="color:var(--text-primary)">{{ m.title }}</div>
                <div class="text-muted small">{{ courseName(m.courseId) }}</div>
                <div class="text-muted small">{{ m.uploadedDate }}</div>
                <div class="text-muted small" *ngIf="m.fileUri">{{ fileType(m) }}</div>
              </div>
              <span class="badge" [ngClass]="m.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ m.status }}</span>
            </div>
            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-sm btn-outline-primary flex-grow-1" (click)="openFile(m)" *ngIf="m.fileUri">
                {{ isBase64(m.fileUri) ? '⬇️ Download' : '🔗 Open' }}
              </button>
              <button class="btn btn-sm btn-outline-secondary" (click)="edit(m)">Edit</button>
              <button class="btn btn-sm btn-outline-danger" (click)="delete(m.materialId)">Delete</button>
            </div>
          </div>
        </div>
        <div *ngIf="filtered.length===0" class="col-12 text-center text-muted py-5">
          <div style="font-size:3rem">📂</div>
          <p class="mt-2">No materials uploaded yet</p>
        </div>
      </div>

      <!-- Upload / Edit Modal -->
      <div class="modal d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">{{ editId ? 'Edit Material' : 'Upload Material' }}</h5>
              <button class="btn-close" (click)="showModal=false"></button>
            </div>
            <div class="modal-body">

              <div class="mb-3">
                <label>Course <span class="text-danger">*</span></label>
                <select class="form-select mt-1" [(ngModel)]="form.courseId">
                  <option value="">Select course</option>
                  <option *ngFor="let c of courses" [value]="c.courseId">{{ c.title }}</option>
                </select>
              </div>

              <div class="mb-3">
                <label>Title <span class="text-danger">*</span></label>
                <input class="form-control mt-1" [(ngModel)]="form.title" placeholder="e.g. Chapter 1 - Introduction">
              </div>

              <!-- File Upload Area -->
              <div class="mb-3" *ngIf="!editId">
                <label>File <span class="text-danger">*</span></label>
                <div class="mt-1 p-4 rounded text-center"
                  style="border:2px dashed var(--border-color);background:var(--bg-secondary);cursor:pointer"
                  (click)="fileInput.click()"
                  (dragover)="$event.preventDefault()"
                  (drop)="onDrop($event)">
                  <input #fileInput type="file" class="d-none"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.png,.jpg,.jpeg,.txt"
                    (change)="onFileChange($event)">

                  <div *ngIf="!selectedFile">
                    <div style="font-size:2.5rem">📁</div>
                    <div class="fw-semibold mt-2" style="color:var(--text-primary)">Click or drag file here</div>
                    <div class="text-muted small mt-1">PDF, DOC, PPT, MP4, MP3, Images (max 50MB)</div>
                  </div>

                  <div *ngIf="selectedFile" class="d-flex align-items-center gap-3 justify-content-center">
                    <span style="font-size:2rem">{{ fileIcon({mimeType: selectedFile.type}) }}</span>
                    <div class="text-start">
                      <div class="fw-semibold" style="color:var(--text-primary)">{{ selectedFile.name }}</div>
                      <div class="text-muted small">{{ formatSize(selectedFile.size) }}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-2" type="button" (click)="clearFile($event)">✕</button>
                  </div>
                </div>
                <div class="text-danger small mt-1" *ngIf="fileError">{{ fileError }}</div>

                <!-- Upload progress -->
                <div class="mt-2" *ngIf="uploading">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="small text-muted">Uploading...</span>
                    <span class="small text-muted">{{ uploadProgress }}%</span>
                  </div>
                  <div class="progress" style="height:6px">
                    <div class="progress-bar" style="background:var(--accent)" [style.width]="uploadProgress+'%'"></div>
                  </div>
                </div>
              </div>

              <!-- Edit mode: show current file info -->
              <div class="mb-3 p-3 rounded" style="background:var(--bg-secondary)" *ngIf="editId && form.fileUri">
                <div class="d-flex align-items-center gap-2">
                  <span style="font-size:1.5rem">{{ fileIcon(form) }}</span>
                  <div>
                    <div class="small fw-semibold" style="color:var(--text-primary)">Current file attached</div>
                    <div class="text-muted small">{{ fileType(form) }}</div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label>Status</label>
                <select class="form-select mt-1" [(ngModel)]="form.status">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="showModal=false">Cancel</button>
              <button class="btn-accent" (click)="save()" [disabled]="uploading">
                <span *ngIf="uploading" class="spinner-border spinner-border-sm me-1"></span>
                {{ editId ? 'Update' : 'Upload' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TeacherMaterialsComponent implements OnInit {
  materials: any[] = [];
  filtered: any[] = [];
  courses: any[] = [];
  search = '';
  filterCourse = '';
  showModal = false;
  editId: number | null = null;
  form: any = {};
  selectedFile: File | null = null;
  fileError = '';
  uploading = false;
  uploadProgress = 0;

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getClasses().pipe(catchError(() => of([]))).subscribe(allClasses => {
        const myCourseIds = [...new Set((allClasses as any[]).filter(cl => cl.teacherId == user.userId).map((cl: any) => cl.courseId))];
        forkJoin({
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
          materials: this.api.getMaterials().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          this.courses = (d.courses as any[]).filter(c => myCourseIds.includes(c.courseId));
          this.materials = (d.materials as any[]).filter(m => myCourseIds.includes(m.courseId));
          this.applyFilter();
          this.cdr.detectChanges();
        });
      });
    });
  }

  openUpload(): void { this.editId = null; this.resetForm(); this.showModal = true; }

  applyFilter(): void {
    this.filtered = this.materials.filter(m => {
      const ms = !this.search || m.title?.toLowerCase().includes(this.search.toLowerCase());
      const mc = !this.filterCourse || m.courseId === +this.filterCourse;
      return ms && mc;
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.processFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  processFile(file: File): void {
    this.fileError = '';
    if (file.size > 50 * 1024 * 1024) { this.fileError = 'File size must be under 50MB'; return; }
    this.selectedFile = file;
    // auto-fill title from filename if empty
    if (!this.form.title) this.form.title = file.name.replace(/\.[^/.]+$/, '');
    this.cdr.detectChanges();
  }

  clearFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = '';
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.form.courseId || !this.form.title) { this.toast.show('Please fill required fields', 'error'); return; }

    if (this.editId) {
      this.api.updateMaterial(this.editId, this.form).subscribe({
        next: () => { this.toast.show('Material updated', 'success'); this.showModal = false; this.ngOnInit(); },
        error: () => this.toast.show('Failed to update', 'error')
      });
      return;
    }

    if (!this.selectedFile) { this.toast.show('Please select a file to upload', 'error'); return; }

    this.uploading = true;
    this.uploadProgress = 0;
    this.cdr.detectChanges();

    // Step 1: upload file as multipart, get back filename
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 80) { this.uploadProgress += 10; this.cdr.detectChanges(); }
    }, 150);

    this.api.uploadMaterialFile(formData).subscribe({
      next: (res: any) => {
        clearInterval(progressInterval);
        this.uploadProgress = 90;
        this.cdr.detectChanges();

        // Step 2: save material metadata with the returned filename as fileUri
        const payload = {
          courseId: +this.form.courseId,
          title: this.form.title,
          fileUri: res.fileUri,
          mimeType: res.mimeType,
          uploadedDate: new Date().toISOString().split('T')[0],
          status: this.form.status || 'ACTIVE'
        };

        this.api.createMaterial(payload).subscribe({
          next: () => {
            this.uploadProgress = 100;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.toast.show('Material uploaded successfully', 'success');
              this.uploading = false;
              this.showModal = false;
              this.ngOnInit();
            }, 300);
          },
          error: () => {
            this.uploading = false;
            this.uploadProgress = 0;
            this.toast.show('Failed to save material', 'error');
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: any) => {
        clearInterval(progressInterval);
        this.uploading = false;
        this.uploadProgress = 0;
        this.toast.show(err?.error?.message || 'File upload failed', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  edit(m: any): void {
    this.editId = m.materialId;
    this.form = { courseId: m.courseId, title: m.title, fileUri: m.fileUri, uploadedDate: m.uploadedDate, status: m.status };
    this.selectedFile = null;
    this.showModal = true;
  }

  delete(id: number): void {
    this.api.deleteMaterial(id).subscribe({
      next: () => { this.toast.show('Material deleted', 'success'); this.materials = this.materials.filter(m => m.materialId !== id); this.applyFilter(); this.cdr.detectChanges(); },
      error: () => this.toast.show('Failed', 'error')
    });
  }

  openFile(m: any): void {
    if (!m.fileUri) return;
    // fileUri is now a filename — serve via backend endpoint
    window.open(`/api/materials/file/${m.fileUri}`, '_blank');
  }

  isBase64(uri: string): boolean { return !!uri && !uri.startsWith('http'); }

  fileIcon(m: any): string {
    const mime = m?.mimeType || m || '';
    if (mime.includes('pdf')) return '📕';
    if (mime.includes('video') || mime.includes('mp4')) return '🎬';
    if (mime.includes('audio') || mime.includes('mp3')) return '🎵';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('word') || mime.includes('doc')) return '📝';
    if (mime.includes('presentation') || mime.includes('ppt')) return '📊';
    return '📄';
  }

  fileType(m: any): string {
    const mime = m?.mimeType || m || '';
    const map: Record<string, string> = {
      'application/pdf': 'PDF Document',
      'video/mp4': 'MP4 Video',
      'audio/mpeg': 'MP3 Audio',
      'image/png': 'PNG Image',
      'image/jpeg': 'JPEG Image',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.ms-powerpoint': 'PowerPoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    };
    return map[mime] || mime || 'File';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  materialCount(courseId: number): number { return this.materials.filter(m => m.courseId === courseId).length; }
  materialPct(courseId: number): number { const max = Math.max(...this.courses.map(c => this.materialCount(c.courseId)), 1); return Math.round((this.materialCount(courseId) / max) * 100); }
  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
  resetForm(): void { this.form = { courseId: '', title: '', status: 'ACTIVE' }; this.selectedFile = null; this.fileError = ''; this.uploading = false; this.uploadProgress = 0; }
}
