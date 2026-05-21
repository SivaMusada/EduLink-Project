import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-schedule.component.html'
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
