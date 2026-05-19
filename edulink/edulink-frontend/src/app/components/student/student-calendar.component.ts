import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Calendar</h2>
          <p class="text-muted small mb-0">Exams, assignments and deadlines</p>
        </div>
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-secondary" (click)="prevMonth()">‹</button>
          <span class="fw-semibold" style="color:var(--text-primary);min-width:140px;text-align:center">{{ monthLabel }}</span>
          <button class="btn btn-sm btn-outline-secondary" (click)="nextMonth()">›</button>
        </div>
      </div>

      <!-- Legend -->
      <div class="d-flex gap-3 mb-3 flex-wrap">
        <div class="d-flex align-items-center gap-1"><div style="width:12px;height:12px;border-radius:3px;background:#ef4444"></div><span class="small text-muted">Exam</span></div>
        <div class="d-flex align-items-center gap-1"><div style="width:12px;height:12px;border-radius:3px;background:#f59e0b"></div><span class="small text-muted">Assignment Due</span></div>
        <div class="d-flex align-items-center gap-1"><div style="width:12px;height:12px;border-radius:3px;background:#4f46e5"></div><span class="small text-muted">Today</span></div>
      </div>

      <!-- Calendar Grid -->
      <div class="card p-3">
        <div class="row g-0 mb-2">
          <div class="col text-center" *ngFor="let d of dayNames">
            <span class="small fw-semibold text-muted">{{ d }}</span>
          </div>
        </div>
        <div class="row g-1" *ngFor="let week of calendarWeeks">
          <div class="col p-1" *ngFor="let day of week">
            <div class="rounded p-1 h-100" style="min-height:70px;cursor:default"
              [ngStyle]="{
                'background': day.isToday ? 'rgba(79,70,229,0.12)' : day.isCurrentMonth ? 'var(--bg-secondary)' : 'transparent',
                'border': day.isToday ? '2px solid var(--accent)' : '1px solid transparent'
              }">
              <div class="small fw-semibold mb-1" [ngStyle]="{'color': day.isToday ? 'var(--accent)' : day.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'}">
                {{ day.date ? day.date.getDate() : '' }}
              </div>
              <div *ngFor="let ev of day.events" class="rounded px-1 mb-1" style="font-size:0.65rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                [ngStyle]="{'background': ev.color+'22', 'color': ev.color}">
                {{ ev.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Events List -->
      <div class="card p-4 mt-4">
        <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📅 Upcoming Events</h6>
        <div *ngFor="let ev of upcomingEvents" class="d-flex align-items-center gap-3 mb-3 p-2 rounded" style="background:var(--bg-secondary)">
          <div class="rounded d-flex align-items-center justify-content-center text-white fw-bold"
            style="width:44px;height:44px;min-width:44px;font-size:0.75rem"
            [ngStyle]="{'background': ev.color}">
            {{ ev.dateLabel }}
          </div>
          <div class="flex-grow-1">
            <div class="fw-semibold small" style="color:var(--text-primary)">{{ ev.title }}</div>
            <div class="text-muted" style="font-size:0.72rem">{{ ev.subtitle }}</div>
          </div>
          <span class="badge" [ngStyle]="{'background': ev.color}">{{ ev.type }}</span>
        </div>
        <div *ngIf="upcomingEvents.length===0" class="text-center text-muted py-3">No upcoming events</div>
      </div>
    </div>
  `
})
export class StudentCalendarComponent implements OnInit {
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarWeeks: any[][] = [];
  upcomingEvents: any[] = [];
  monthLabel = '';
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  allEvents: any[] = [];
  courses: any[] = [];

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      forkJoin({
        exams: this.api.getExamsByStudent(user.userId).pipe(catchError(() => of([]))),
        assignments: this.api.getAssignments().pipe(catchError(() => of([]))),
        courses: this.api.getCourses().pipe(catchError(() => of([]))),
      }).subscribe(d => {
        this.courses = d.courses as any[];
        this.allEvents = [];

        (d.exams as any[]).filter(e => e.status === 'SCHEDULED' && e.date).forEach(e => {
          this.allEvents.push({ date: e.date, label: `📝 ${e.type}`, title: `${e.type} Exam`, subtitle: this.courseName(e.courseId), color: '#ef4444', type: 'Exam', dateLabel: this.shortDate(e.date) });
        });

        (d.assignments as any[]).filter(a => a.submissionDate).forEach(a => {
          this.allEvents.push({ date: a.submissionDate, label: `📋 ${a.title}`, title: a.title, subtitle: `Due: ${a.submissionDate}`, color: '#f59e0b', type: 'Assignment', dateLabel: this.shortDate(a.submissionDate) });
        });

        this.buildCalendar();
        this.buildUpcoming();
        this.cdr.detectChanges();
      });
    });
  }

  buildCalendar(): void {
    const today = new Date();
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    this.monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const weeks: any[][] = [];
    let week: any[] = [];

    // pad start
    for (let i = 0; i < firstDay.getDay(); i++) week.push({ date: null, events: [], isCurrentMonth: false, isToday: false });

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const dateStr = date.toISOString().split('T')[0];
      const events = this.allEvents.filter(e => e.date === dateStr);
      const isToday = date.toDateString() === today.toDateString();
      week.push({ date, events, isCurrentMonth: true, isToday });
      if (week.length === 7) { weeks.push(week); week = []; }
    }

    // pad end
    while (week.length > 0 && week.length < 7) week.push({ date: null, events: [], isCurrentMonth: false, isToday: false });
    if (week.length) weeks.push(week);

    this.calendarWeeks = weeks;
  }

  buildUpcoming(): void {
    const today = new Date().toISOString().split('T')[0];
    this.upcomingEvents = this.allEvents
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
    this.buildCalendar();
    this.cdr.detectChanges();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
    this.buildCalendar();
    this.cdr.detectChanges();
  }

  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
  shortDate(d: string): string { const dt = new Date(d); return `${dt.getDate()} ${dt.toLocaleDateString('en-US', { month: 'short' })}`; }
}
