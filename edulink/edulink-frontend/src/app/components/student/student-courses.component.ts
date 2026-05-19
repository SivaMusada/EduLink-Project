import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">My Enrolled Courses</h2>
          <p class="text-muted small mb-0">{{ enrolledCourses.length }} courses assigned by admin</p>
        </div>
      </div>

      <div *ngIf="enrolledCourses.length===0" class="text-center py-5">
        <div style="font-size:3rem">📚</div>
        <h5 class="mt-3" style="color:var(--text-primary)">No courses assigned yet</h5>
        <p class="text-muted">Your admin will assign you to courses. Check back later.</p>
      </div>

      <div class="row g-3">
        <div class="col-md-6 col-lg-4" *ngFor="let item of enrolledCourses">
          <div class="card p-3 h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="rounded d-flex align-items-center justify-content-center fw-bold text-white me-2"
                style="width:44px;height:44px;min-width:44px;background:var(--accent);font-size:0.85rem">
                {{ item.course?.subject?.substring(0,2).toUpperCase() || 'CO' }}
              </div>
              <div class="flex-grow-1">
                <div class="fw-bold" style="color:var(--text-primary)">{{ item.course?.title }}</div>
                <div class="text-muted small">{{ item.course?.subject }} • {{ item.course?.gradeLevel }}</div>
              </div>
              <span class="badge" [ngClass]="item.course?.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ item.course?.status }}</span>
            </div>

            <div class="row g-2 mb-3 mt-1">
              <div class="col-6">
                <div class="p-2 rounded text-center" style="background:var(--bg-secondary)">
                  <div class="small text-muted">Credits</div>
                  <div class="fw-bold" style="color:var(--text-primary)">{{ item.course?.credits }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="p-2 rounded text-center" style="background:var(--bg-secondary)">
                  <div class="small text-muted">Teacher</div>
                  <div class="fw-bold small" style="color:var(--text-primary)">{{ item.teacherName || '—' }}</div>
                </div>
              </div>
            </div>

            <button class="btn btn-sm w-100 mb-2" style="background:var(--bg-secondary);color:var(--text-primary)"
              (click)="toggleMaterials(item.enrollment.courseId)">
              {{ expanded[item.enrollment.courseId] ? '▲ Hide' : '▼ View' }} Learning Materials
            </button>

            <div *ngIf="expanded[item.enrollment.courseId]">
              <div *ngFor="let m of getMaterials(item.enrollment.courseId)"
                class="d-flex align-items-center justify-content-between p-2 mb-1 rounded" style="background:var(--bg-secondary)">
                <div class="d-flex align-items-center gap-2">
                  <span>{{ m.fileUri?.toLowerCase().endsWith('.pdf') ? '📕' : '🎬' }}</span>
                  <div>
                    <div class="small fw-semibold" style="color:var(--text-primary)">{{ m.title }}</div>
                    <a *ngIf="m.fileUri" [href]="m.fileUri" target="_blank" class="text-muted" style="font-size:0.72rem">Open file</a>
                  </div>
                </div>
                <button class="btn btn-sm" [ngClass]="completed[m.materialId]?'btn-success':'btn-outline-success'"
                  (click)="markComplete(m.materialId)">
                  {{ completed[m.materialId] ? '✓' : 'Done' }}
                </button>
              </div>
              <div *ngIf="getMaterials(item.enrollment.courseId).length===0" class="text-muted small text-center py-2">No materials yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentCoursesComponent implements OnInit {
  enrolledCourses: any[] = [];
  materials: any[] = [];
  expanded: Record<number, boolean> = {};
  completed: Record<number, boolean> = {};
  studentId: number | null = null;

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('completed_materials');
    if (saved) this.completed = JSON.parse(saved);

    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      forkJoin({
        enrollments: this.api.getMyEnrollments().pipe(catchError(() => of([]))),
        courses: this.api.getCourses().pipe(catchError(() => of([]))),
        classes: this.api.getClasses().pipe(catchError(() => of([]))),
        materials: this.api.getMaterials().pipe(catchError(() => of([]))),
        users: this.auth.getUsers().pipe(catchError(() => of([]))),
      }).subscribe(d => {
        this.materials = d.materials;
        const allCourses = d.courses as any[];
        const teachers = (d.users as any[]).filter((u: any) => u.role === 'TEACHER');

        console.log('Enrollments:', d.enrollments);
        console.log('Courses:', allCourses);
        console.log('Teachers:', teachers);

        this.enrolledCourses = (d.enrollments as any[])
          .filter(e => e.status?.toUpperCase() === 'ACTIVE')
          .map(enrollment => {
            const course = allCourses.find(c => c.courseId === enrollment.courseId);
            const teacher = teachers.find((t: any) => t.userId == enrollment.teacherId);
            return { enrollment, course, teacherName: teacher?.name || '—' };
          })
          .filter(item => !!item.course);

        this.cdr.detectChanges();
      });
    });
  }

  toggleMaterials(courseId: number): void { this.expanded[courseId] = !this.expanded[courseId]; }
  getMaterials(courseId: number): any[] { return this.materials.filter(m => m.courseId === courseId); }

  markComplete(materialId: number): void {
    this.completed[materialId] = true;
    localStorage.setItem('completed_materials', JSON.stringify(this.completed));
    this.toast.show('Material marked as completed!', 'success');
    this.cdr.detectChanges();
  }
}
