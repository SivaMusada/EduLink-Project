import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-attendance.component.html'
})
export class StudentAttendanceComponent implements OnInit {
  attendance: any[] = [];
  filtered: any[] = [];
  filterStatus = '';
  filterDate = '';
  present = 0;
  absent = 0;
  late = 0;
  pct = 0;
  requiredPresent = 0;
  statusBreakdown: any[] = [];
  monthlyBreakdown: any[] = [];

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getMyEnrollments().pipe(catchError(() => of([]))).subscribe((enrollments: any[]) => {
        if (!enrollments.length) { this.cdr.detectChanges(); return; }
        const studentId = enrollments[0].studentId;
        this.api.getAttendanceByStudent(studentId).pipe(catchError(() => of([]))).subscribe(a => {
          this.attendance = a;
          this.compute();
          this.applyFilter();
          this.cdr.detectChanges();
        });
      });
    });
  }

  compute(): void {
    this.present = this.attendance.filter(a => a.status === 'PRESENT').length;
    this.absent = this.attendance.filter(a => a.status === 'ABSENT').length;
    this.late = this.attendance.filter(a => a.status === 'LATE').length;
    this.pct = this.attendance.length ? Math.round((this.present / this.attendance.length) * 100) : 0;
    this.requiredPresent = Math.max(0, Math.ceil(0.75 * this.attendance.length) - this.present);

    this.statusBreakdown = [
      { label: 'Present', count: this.present, pct: this.attendance.length ? Math.round((this.present / this.attendance.length) * 100) : 0, color: '#10b981' },
      { label: 'Absent', count: this.absent, pct: this.attendance.length ? Math.round((this.absent / this.attendance.length) * 100) : 0, color: '#ef4444' },
      { label: 'Late', count: this.late, pct: this.attendance.length ? Math.round((this.late / this.attendance.length) * 100) : 0, color: '#f59e0b' },
    ];

    const monthMap: Record<string, { present: number; total: number }> = {};
    this.attendance.forEach(a => {
      if (!a.date) return;
      const month = a.date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { present: 0, total: 0 };
      monthMap[month].total++;
      if (a.status === 'PRESENT') monthMap[month].present++;
    });
    this.monthlyBreakdown = Object.entries(monthMap).map(([month, v]) => ({
      month, present: v.present, total: v.total, rate: Math.round((v.present / v.total) * 100)
    })).sort((a, b) => b.month.localeCompare(a.month));
  }

  applyFilter(): void {
    this.filtered = this.attendance.filter(a => {
      const ms = !this.filterStatus || a.status === this.filterStatus;
      const md = !this.filterDate || a.date === this.filterDate;
      return ms && md;
    });
  }
}
