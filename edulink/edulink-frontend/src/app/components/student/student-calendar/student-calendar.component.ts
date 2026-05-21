import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-student-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-calendar.component.html'
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

    for (let i = 0; i < firstDay.getDay(); i++) week.push({ date: null, events: [], isCurrentMonth: false, isToday: false });

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const dateStr = date.toISOString().split('T')[0];
      const events = this.allEvents.filter(e => e.date === dateStr);
      const isToday = date.toDateString() === today.toDateString();
      week.push({ date, events, isCurrentMonth: true, isToday });
      if (week.length === 7) { weeks.push(week); week = []; }
    }

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
