import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Digital Learning</h2>
          <p class="text-muted small mb-0">Access materials and submit assignments</p>
        </div>
      </div>

      <div>
        <div class="card p-3 mb-3">
          <div class="row g-2">
            <div class="col-md-6"><input class="form-control" [(ngModel)]="matSearch" placeholder="🔍 Search materials..." (input)="filterMaterials()"></div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="matCourseFilter" (change)="filterMaterials()">
                <option value="">All Courses</option>
                <option *ngFor="let c of courses" [value]="c.courseId">{{ c.title }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="row g-3">
          <div class="col-md-6 col-lg-4" *ngFor="let m of filteredMaterials">
            <div class="card p-3 h-100">
              <div class="d-flex align-items-start gap-3">
                <div class="rounded d-flex align-items-center justify-content-center"
                  style="width:44px;height:44px;min-width:44px;font-size:1.5rem;background:var(--bg-secondary)">
                  {{ fileIcon(m.fileUri) }}
                </div>
                <div class="flex-grow-1">
                  <div class="fw-semibold" style="color:var(--text-primary)">{{ m.title }}</div>
                  <div class="text-muted small">{{ courseName(m.courseId) }}</div>
                  <div class="text-muted small">{{ m.uploadedDate }}</div>
                </div>
                <span class="badge" [ngClass]="m.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ m.status }}</span>
              </div>
              <div class="d-flex gap-2 mt-3">
                <a *ngIf="m.fileUri && !isBase64(m.fileUri)" [href]="m.fileUri" target="_blank" class="btn btn-sm btn-outline-primary flex-grow-1">🔗 Open</a>
                <button *ngIf="m.fileUri && isBase64(m.fileUri)" class="btn btn-sm btn-outline-primary flex-grow-1" (click)="downloadFile(m)">⬇️ Download</button>
                <button class="btn btn-sm flex-grow-1"
                  [ngClass]="completed[m.materialId]?'btn-success':'btn-outline-success'"
                  (click)="markComplete(m.materialId)">
                  {{ completed[m.materialId] ? '✓ Completed' : 'Mark Done' }}
                </button>
              </div>
            </div>
          </div>
        <div *ngIf="filteredMaterials.length===0" class="col-12 text-center text-muted py-5">No materials found</div>
        </div>

        <div class="mt-3 p-3 rounded" *ngIf="materials.length>0" style="background:var(--bg-secondary)">
          <div class="d-flex align-items-center gap-2">
            <div class="progress flex-grow-1" style="height:8px">
              <div class="progress-bar bg-success" [style.width]="completionPct+'%'"></div>
            </div>
            <span class="small fw-semibold" style="color:var(--text-primary)">{{ completionPct }}% completed</span>
          </div>
          <div class="text-muted small mt-1">{{ completedCount }} of {{ materials.length }} materials completed</div>
        </div>
      </div>
    </div>
  `
})
export class StudentLearningComponent implements OnInit {
  tab = 'materials';
  materials: any[] = [];
  filteredMaterials: any[] = [];
  courses: any[] = [];
  matSearch = '';
  matCourseFilter = '';
  completed: Record<number, boolean> = {};
  completedCount = 0;
  completionPct = 0;

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('completed_materials');
    if (saved) this.completed = JSON.parse(saved);

    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      const myGrade = (user as any)?.gradeLevel || null;

      forkJoin({
        materials: this.api.getMaterials().pipe(catchError(() => of([]))),
        courses: this.api.getCourses().pipe(catchError(() => of([]))),
      }).subscribe(d => {
        const allCourses = d.courses as any[];
        this.courses = myGrade
          ? allCourses.filter(c => c.gradeLevel === myGrade && c.status === 'ACTIVE')
          : [];
        const myCourseIds = new Set(this.courses.map(c => c.courseId));
        this.materials = (d.materials as any[]).filter(m => myCourseIds.has(m.courseId) && m.status === 'ACTIVE');
        this.filteredMaterials = [...this.materials];
        this.updateCompletion();
        this.cdr.detectChanges();
      });
    });
  }

  filterMaterials(): void {
    this.filteredMaterials = this.materials.filter(m => {
      const ms = !this.matSearch || m.title?.toLowerCase().includes(this.matSearch.toLowerCase());
      const mc = !this.matCourseFilter || m.courseId === +this.matCourseFilter;
      return ms && mc;
    });
  }

  markComplete(id: number): void {
    this.completed[id] = true;
    localStorage.setItem('completed_materials', JSON.stringify(this.completed));
    this.updateCompletion();
    this.toast.show('Material marked as completed!', 'success');
    this.cdr.detectChanges();
  }

  updateCompletion(): void {
    this.completedCount = this.materials.filter(m => this.completed[m.materialId]).length;
    this.completionPct = this.materials.length ? Math.round((this.completedCount / this.materials.length) * 100) : 0;
  }

  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }

  isBase64(uri: string): boolean { return uri?.startsWith('data:'); }

  fileIcon(uri: string): string {
    if (!uri) return '📄';
    const l = uri.toLowerCase();
    if (l.includes('pdf')) return '📕';
    if (l.includes('video') || l.includes('mp4')) return '🎬';
    if (l.includes('audio') || l.includes('mp3')) return '🎵';
    if (l.includes('image') || l.includes('png') || l.includes('jpg')) return '🖼️';
    if (l.includes('word') || l.includes('doc')) return '📝';
    if (l.includes('presentation') || l.includes('ppt')) return '📊';
    return '📄';
  }

  downloadFile(m: any): void {
    const a = document.createElement('a');
    a.href = m.fileUri;
    const ext = m.fileUri.split(';')[0].split('/')[1] || 'file';
    a.download = `${m.title}.${ext}`;
    a.click();
  }

}
