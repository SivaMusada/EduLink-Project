import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">My Schedule</h2>
          <p class="text-muted small mb-0">{{ classes.length }} class(es) assigned to you</p>
        </div>
      </div>

      <div *ngIf="classes.length===0" class="text-center py-5">
        <div style="font-size:3rem">🗓️</div>
        <h5 class="mt-3" style="color:var(--text-primary)">No classes assigned yet</h5>
        <p class="text-muted">Admin will assign classes to you.</p>
      </div>

      <div class="row g-3">
        <div class="col-md-6 col-lg-4" *ngFor="let cl of classes">
          <div class="card p-4 h-100" style="border-left:4px solid var(--accent)">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div class="fw-bold" style="color:var(--text-primary)">{{ courseName(cl.courseId) }}</div>
              </div>
              <span class="badge" [ngClass]="cl.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ cl.status }}</span>
            </div>

            <div class="p-3 rounded mb-3" style="background:var(--bg-secondary)">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span>🕐</span>
                <div>
                  <div class="small text-muted">Schedule</div>
                  <div class="fw-semibold small" style="color:var(--text-primary)">{{ cl.schedule || 'Not set' }}</div>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span>🎓</span>
                <div>
                  <div class="small text-muted">Grade Level</div>
                  <div class="fw-semibold small" style="color:var(--text-primary)">{{ courseGrade(cl.courseId) }}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Edit Schedule Modal -->
      <div class="modal d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">Edit Schedule — {{ courseName(editClass?.courseId) }}</h5>
              <button class="btn-close" (click)="showModal=false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <label>Days</label>
                <div class="d-flex flex-wrap gap-2 mt-1">
                  <div *ngFor="let d of weekDays" class="form-check form-check-inline m-0">
                    <input class="form-check-input" type="checkbox" [id]="'d-'+d" [checked]="picker.days.includes(d)" (change)="toggleDay(d)">
                    <label class="form-check-label small" [for]="'d-'+d">{{ d }}</label>
                  </div>
                </div>
              </div>
              <div class="row g-2 mb-3 mt-2">
                <div class="col-6"><label>Start Time</label><input type="time" class="form-control mt-1" [(ngModel)]="picker.startTime"></div>
                <div class="col-6"><label>End Time</label><input type="time" class="form-control mt-1" [(ngModel)]="picker.endTime"></div>
              </div>
              <div class="p-2 rounded small" style="background:var(--bg-secondary);color:var(--text-primary)">
                Preview: <strong>{{ buildSchedule() }}</strong>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="showModal=false">Cancel</button>
              <button class="btn-accent" (click)="saveSchedule()">Save Schedule</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TeacherScheduleComponent implements OnInit {
  classes: any[] = [];
  courses: any[] = [];
  enrollments: any[] = [];
  showModal = false;
  editClass: any = null;
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  picker = { days: [] as string[], startTime: '', endTime: '' };

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getClasses().pipe(catchError(() => of([]))).subscribe(all => {
        this.classes = (all as any[]).filter(cl => cl.teacherId == user.userId);
        this.api.getCourses().pipe(catchError(() => of([]))).subscribe(c => { this.courses = c; this.cdr.detectChanges(); });
        this.api.getAllEnrollments().pipe(catchError(() => of([]))).subscribe(e => { this.enrollments = e; this.cdr.detectChanges(); });
      });
    });
  }

  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
  courseGrade(id: number): string { return this.courses.find(c => c.courseId === id)?.gradeLevel || '—'; }
  enrollmentCount(classId: number): number { return this.enrollments.filter(e => e.classId === classId).length; }

  openEdit(cl: any): void {
    this.editClass = cl;
    this.picker = { days: [], startTime: '', endTime: '' };
    this.showModal = true;
  }

  toggleDay(day: string): void {
    const i = this.picker.days.indexOf(day);
    i === -1 ? this.picker.days.push(day) : this.picker.days.splice(i, 1);
  }

  buildSchedule(): string {
    const days = this.picker.days.join('/');
    const fmt = (t: string) => { if (!t) return ''; const [h, m] = t.split(':'); const hr = +h; return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`; };
    const time = this.picker.startTime && this.picker.endTime ? ` ${fmt(this.picker.startTime)}-${fmt(this.picker.endTime)}` : '';
    return `${days}${time}`.trim() || 'Not set';
  }

  saveSchedule(): void {
    const schedule = this.buildSchedule();
    this.api.updateClass(this.editClass.classId, { ...this.editClass, schedule }).subscribe({
      next: () => {
        this.editClass.schedule = schedule;
        this.toast.show('Schedule updated', 'success');
        this.showModal = false;
        this.cdr.detectChanges();
      },
      error: () => this.toast.show('Failed to update schedule', 'error')
    });
  }
}
