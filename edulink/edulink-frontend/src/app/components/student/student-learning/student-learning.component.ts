import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-student-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-learning.component.html'
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
