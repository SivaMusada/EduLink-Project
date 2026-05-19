import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Attendance Tracking</h2>
          <p class="text-muted small mb-0">Daily and monthly attendance records</p>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Total Days</div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ attendance.length }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Present</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ present }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Absent</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#ef4444">{{ absent }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Attendance %</div>
            <div class="fw-bold" style="font-size:1.8rem" [style.color]="pct>=75?'#10b981':'#ef4444'">{{ pct }}%</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-5">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📊 Attendance Overview</h6>
            <div class="text-center mb-3">
              <div class="d-inline-flex align-items-center justify-content-center rounded-circle"
                style="width:110px;height:110px;background:conic-gradient(var(--accent) {{ pct*3.6 }}deg, var(--bg-secondary) 0deg)">
                <div class="rounded-circle d-flex align-items-center justify-content-center flex-column"
                  style="width:86px;height:86px;background:var(--bg-card)">
                  <span class="fw-bold" style="font-size:1.3rem;color:var(--text-primary)">{{ pct }}%</span>
                  <span class="text-muted" style="font-size:0.65rem">Overall</span>
                </div>
              </div>
            </div>
            <div *ngFor="let s of statusBreakdown" class="mb-2">
              <div class="d-flex justify-content-between mb-1">
                <span class="small" style="color:var(--text-primary)">{{ s.label }}</span>
                <span class="small text-muted">{{ s.count }} ({{ s.pct }}%)</span>
              </div>
              <div class="progress" style="height:8px;border-radius:4px">
                <div class="progress-bar" [style.width]="s.pct+'%'" [style.background]="s.color" style="border-radius:4px"></div>
              </div>
            </div>
            <div class="mt-3 p-2 rounded small" *ngIf="pct < 75 && attendance.length > 0"
              style="background:rgba(239,68,68,0.1);color:#ef4444">
              ⚠️ Your attendance is below 75%. You need {{ requiredPresent }} more present days to reach 75%.
            </div>
            <div class="mt-3 p-2 rounded small" *ngIf="pct >= 75 && attendance.length > 0"
              style="background:rgba(16,185,129,0.1);color:#10b981">
              ✓ Good attendance! You are above the 75% threshold.
            </div>
          </div>
        </div>

        <div class="col-md-7">
          <div class="card p-4 h-100">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📅 Monthly Breakdown</h6>
            <div *ngIf="monthlyBreakdown.length===0" class="text-center text-muted py-3">No data available</div>
            <div *ngFor="let m of monthlyBreakdown" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold" style="color:var(--text-primary)">{{ m.month }}</span>
                <span class="small" [style.color]="m.rate>=75?'#10b981':'#ef4444'">{{ m.rate }}% ({{ m.present }}/{{ m.total }})</span>
              </div>
              <div class="progress" style="height:10px;border-radius:5px">
                <div class="progress-bar" [style.width]="m.rate+'%'" [ngClass]="m.rate>=75?'bg-success':m.rate>=50?'bg-warning':'bg-danger'" style="border-radius:5px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-3 mb-3">
        <div class="row g-2">
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="filterStatus" (change)="applyFilter()">
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
            </select>
          </div>
          <div class="col-md-4">
            <input type="date" class="form-control" [(ngModel)]="filterDate" (change)="applyFilter()">
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table table-hover mb-0">
          <thead><tr><th>Date</th><th>Class ID</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let a of filtered" [style.background]="a.status==='ABSENT'?'rgba(239,68,68,0.04)':''">
              <td>{{ a.date }}</td>
              <td>{{ a.classId }}</td>
              <td>
                <span class="badge" [ngClass]="a.status==='PRESENT'?'bg-success':a.status==='ABSENT'?'bg-danger':'bg-warning text-dark'">
                  {{ a.status }}
                </span>
              </td>
            </tr>
            <tr *ngIf="filtered.length===0"><td colspan="3" class="text-center text-muted py-4">No records found</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
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
