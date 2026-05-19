import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Reports & Analytics</h2>
          <p class="text-muted small mb-0">School performance overview and grade-level reports</p>
        </div>
        <button class="btn btn-outline-secondary btn-sm" (click)="exportCSV()">⬇️ Export CSV</button>
      </div>

      <!-- Overall Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Total Students</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#4f46e5">{{ analytics.totalStudents }}</div>
            <div class="small text-muted">{{ analytics.activeStudents }} active</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Attendance Rate</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ analytics.attendanceRate }}%</div>
            <div class="small text-muted">Overall</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Exam Pass Rate</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#f59e0b">{{ analytics.passRate }}%</div>
            <div class="small text-muted">Avg score {{ analytics.avgScore }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Active Courses</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#0ea5e9">{{ analytics.activeCourses }}</div>
            <div class="small text-muted">of {{ analytics.totalCourses }} total</div>
          </div>
        </div>
      </div>

      <!-- Grade-Level Attendance Report -->
      <div class="card p-4 mb-4">
        <h6 class="fw-bold mb-3" style="color:var(--text-primary)">🎓 Attendance by Grade Level</h6>
        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>Grade Level</th>
                <th>Total Students</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of gradeAttendance">
                <td><span class="badge bg-info text-dark">{{ g.grade }}</span></td>
                <td class="fw-semibold">{{ g.totalStudents }}</td>
                <td><span class="text-success fw-semibold">{{ g.present }}</span></td>
                <td><span class="text-danger fw-semibold">{{ g.absent }}</span></td>
                <td><span class="text-warning fw-semibold">{{ g.late }}</span></td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height:8px;max-width:100px">
                      <div class="progress-bar" [style.width]="g.rate+'%'"
                        [ngClass]="g.rate>=75?'bg-success':g.rate>=50?'bg-warning':'bg-danger'"></div>
                    </div>
                    <span class="fw-semibold small" [ngClass]="g.rate>=75?'text-success':g.rate>=50?'text-warning':'text-danger'">{{ g.rate }}%</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="gradeAttendance.length===0">
                <td colspan="6" class="text-center text-muted py-4">No grade-level data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card p-4">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📊 Student Enrollment by Status</h6>
            <div *ngFor="let s of enrollmentChart" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold" style="color:var(--text-primary)">{{ s.label }}</span>
                <span class="small text-muted">{{ s.count }} ({{ s.pct }}%)</span>
              </div>
              <div class="progress" style="height:16px;border-radius:8px">
                <div class="progress-bar" [style.width]="s.pct+'%'" [style.background]="s.color" style="border-radius:8px"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card p-4">
            <h6 class="fw-bold mb-3" style="color:var(--text-primary)">📈 Students per Grade</h6>
            <div *ngFor="let g of gradeAttendance" class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="small fw-semibold" style="color:var(--text-primary)">{{ g.grade }}</span>
                <span class="small text-muted">{{ g.totalStudents }} students</span>
              </div>
              <div class="progress" style="height:16px;border-radius:8px">
                <div class="progress-bar" [style.width]="gradeStudentPct(g.totalStudents)+'%'" style="background:#4f46e5;border-radius:8px"></div>
              </div>
            </div>
            <div *ngIf="gradeAttendance.length===0" class="text-muted small text-center py-3">No data available</div>
          </div>
        </div>
      </div>

      <!-- Generated Reports -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-bold mb-0" style="color:var(--text-primary)">Generated Reports</h6>
        <select class="form-select form-select-sm" style="width:150px" [(ngModel)]="filterScope" (change)="applyFilter()">
          <option value="">All Scopes</option>
          <option value="STUDENT">Student</option>
          <option value="PERFORMANCE">Performance</option>
        </select>
      </div>

      <div class="table-wrapper">
        <table class="table table-hover mb-0">
          <thead><tr><th>Report ID</th><th>Scope</th><th>Metrics</th><th>Generated Date</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of filteredReports">
              <td>#{{ r.reportId }}</td>
              <td><span class="badge bg-primary">{{ r.scope }}</span></td>
              <td class="text-truncate" style="max-width:200px">{{ r.metrics }}</td>
              <td>{{ r.generatedDate }}</td>
              <td><button class="btn btn-sm btn-outline-secondary" (click)="exportReport(r)">⬇️ Export</button></td>
            </tr>
            <tr *ngIf="filteredReports.length===0"><td colspan="5" class="text-center text-muted py-4">No reports found</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminReportsComponent implements OnInit {
  role = '';
  reports: any[] = [];
  filteredReports: any[] = [];
  filterScope = '';
  analytics = { totalStudents: 0, activeStudents: 0, attendanceRate: 0, passRate: 0, avgScore: 0, activeCourses: 0, totalCourses: 0 };
  enrollmentChart: any[] = [];
  gradeAttendance: any[] = [];

  constructor(private api: ApiService, private toast: ToastService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.role = this.auth.getRole() || '';
    this.load();
  }

  load(): void {
    forkJoin({
      reports: this.api.getReports().pipe(catchError(() => of([]))),
      students: this.api.getStudents().pipe(catchError(() => of([]))),
      courses: this.api.getCourses().pipe(catchError(() => of([]))),
      attendance: this.api.getAttendance().pipe(catchError(() => of([]))),
      grades: this.api.getGrades().pipe(catchError(() => of([]))),
      registrations: this.auth.getAllStudentRegistrations().pipe(catchError(() => of([]))),
    }).subscribe(d => {
      this.reports = this.role === 'BOARD'
        ? (d.reports as any[]).filter((r: any) => r.scope !== 'COURSE')
        : (d.reports as any[]).filter((r: any) => r.scope !== 'COURSE');
      this.filteredReports = this.reports;

      const students = d.students as any[];
      const attendance = d.attendance as any[];
      const grades = d.grades as any[];
      const courses = d.courses as any[];
      const registrations = d.registrations as any[];

      const active = students.filter((s: any) => s.status === 'ACTIVE').length;
      const inactive = students.filter((s: any) => s.status === 'INACTIVE').length;
      const present = attendance.filter((a: any) => a.status === 'PRESENT').length;
      const passed = grades.filter((g: any) => g.grade && g.grade !== 'F').length;
      const activeCourses = courses.filter(c => c.status === 'ACTIVE').length;

      this.analytics = {
        totalStudents: students.length,
        activeStudents: active,
        attendanceRate: attendance.length ? Math.round((present / attendance.length) * 100) : 0,
        passRate: grades.length ? Math.round((passed / grades.length) * 100) : 0,
        avgScore: grades.length ? Math.round(grades.reduce((a: number, g: any) => a + (g.score || 0), 0) / grades.length) : 0,
        activeCourses,
        totalCourses: courses.length
      };

      this.enrollmentChart = [
        { label: 'Active', count: active, pct: students.length ? Math.round((active / students.length) * 100) : 0, color: '#10b981' },
        { label: 'Inactive', count: inactive, pct: students.length ? Math.round((inactive / students.length) * 100) : 0, color: '#adb5bd' },
        { label: 'Pending', count: students.length - active - inactive, pct: students.length ? Math.round(((students.length - active - inactive) / students.length) * 100) : 0, color: '#f59e0b' },
      ];

      // Build grade-level attendance report
      // Map studentId -> gradeLevel: use student-service gradeLevel as base, enrich with registrations
      const studentGradeMap: Record<number, string> = {};
      students.forEach((s: any) => {
        if (s.studentId && s.gradeLevel) studentGradeMap[s.studentId] = s.gradeLevel;
      });
      registrations.forEach((r: any) => {
        const match = students.find((s: any) => s.name?.toLowerCase() === r.name?.toLowerCase() || s.contactInfo === r.phone);
        if (match && r.gradeLevel) studentGradeMap[match.studentId] = r.gradeLevel;
      });

      // Group attendance records by grade
      const gradeMap: Record<string, { studentIds: Set<number>; present: number; absent: number; late: number }> = {};
      attendance.forEach((a: any) => {
        const grade = studentGradeMap[a.studentId];
        if (!grade) return;
        if (!gradeMap[grade]) gradeMap[grade] = { studentIds: new Set(), present: 0, absent: 0, late: 0 };
        gradeMap[grade].studentIds.add(a.studentId);
        if (a.status === 'PRESENT') gradeMap[grade].present++;
        else if (a.status === 'ABSENT') gradeMap[grade].absent++;
        else if (a.status === 'LATE') gradeMap[grade].late++;
      });

      // Count total students per grade from registrations if available, else from student-service
      const gradeTotalMap: Record<string, Set<number>> = {};
      if (registrations.length > 0) {
        registrations.filter((r: any) => r.status === 'ACTIVE' && r.gradeLevel).forEach((r: any) => {
          if (!gradeTotalMap[r.gradeLevel]) gradeTotalMap[r.gradeLevel] = new Set();
          const match = students.find((s: any) => s.name?.toLowerCase() === r.name?.toLowerCase() || s.contactInfo === r.phone);
          if (match) gradeTotalMap[r.gradeLevel].add(match.studentId);
        });
      } else {
        students.filter((s: any) => s.status === 'ACTIVE' && s.gradeLevel).forEach((s: any) => {
          if (!gradeTotalMap[s.gradeLevel]) gradeTotalMap[s.gradeLevel] = new Set();
          gradeTotalMap[s.gradeLevel].add(s.studentId);
        });
      }

      const allGrades = new Set([...Object.keys(gradeMap), ...Object.keys(gradeTotalMap)]);
      this.gradeAttendance = [...allGrades].sort().map(grade => {
        const g = gradeMap[grade];
        const totalStudents = gradeTotalMap[grade]?.size || g?.studentIds.size || 0;
        const present = g?.present || 0;
        const absent = g?.absent || 0;
        const late = g?.late || 0;
        const total = present + absent + late;
        return { grade, totalStudents, present, absent, late, rate: total ? Math.round((present / total) * 100) : 0 };
      });

      this.cdr.detectChanges();
    });
  }

  gradeStudentPct(count: number): number {
    const max = Math.max(...this.gradeAttendance.map(g => g.totalStudents), 1);
    return Math.round((count / max) * 100);
  }

  applyFilter(): void {
    this.filteredReports = this.filterScope ? this.reports.filter(r => r.scope === this.filterScope) : this.reports;
  }

  exportReport(r: any): void {
    const csv = `Report ID,Scope,Metrics,Generated Date\n${r.reportId},${r.scope},"${r.metrics}",${r.generatedDate}`;
    this.downloadCSV(csv, `report_${r.reportId}.csv`);
    this.toast.show('Report exported', 'success');
  }

  exportCSV(): void {
    let csv = 'Metric,Value\n';
    csv += `Total Students,${this.analytics.totalStudents}\n`;
    csv += `Active Students,${this.analytics.activeStudents}\n`;
    csv += `Attendance Rate,${this.analytics.attendanceRate}%\n`;
    csv += `Exam Pass Rate,${this.analytics.passRate}%\n`;
    csv += `Average Score,${this.analytics.avgScore}\n`;
    csv += `Active Courses,${this.analytics.activeCourses}\n`;
    csv += `Total Courses,${this.analytics.totalCourses}\n\n`;
    csv += 'Grade Level,Total Students,Present,Absent,Late,Attendance Rate\n';
    this.gradeAttendance.forEach(g => {
      csv += `${g.grade},${g.totalStudents},${g.present},${g.absent},${g.late},${g.rate}%\n`;
    });
    this.downloadCSV(csv, `edulink_report_${new Date().toISOString().split('T')[0]}.csv`);
    this.toast.show('Report exported as CSV', 'success');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
