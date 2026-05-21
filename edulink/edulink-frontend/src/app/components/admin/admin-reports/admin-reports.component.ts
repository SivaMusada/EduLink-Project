import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reports.component.html'
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

      const studentGradeMap: Record<number, string> = {};
      students.forEach((s: any) => {
        if (s.studentId && s.gradeLevel) studentGradeMap[s.studentId] = s.gradeLevel;
      });
      registrations.forEach((r: any) => {
        const match = students.find((s: any) => s.name?.toLowerCase() === r.name?.toLowerCase() || s.contactInfo === r.phone);
        if (match && r.gradeLevel) studentGradeMap[match.studentId] = r.gradeLevel;
      });

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
