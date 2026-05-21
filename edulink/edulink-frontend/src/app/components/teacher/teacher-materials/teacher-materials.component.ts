import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-teacher-materials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-materials.component.html'
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
