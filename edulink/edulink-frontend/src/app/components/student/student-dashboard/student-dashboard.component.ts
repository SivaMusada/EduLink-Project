import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-dashboard.component.html'
})
export class StudentDashboardComponent implements OnInit {
  name = '';
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  kpis: any[] = [];
  courses: any[] = [];
  upcomingExams: any[] = [];
  grades: any[] = [];
  gradeBreakdown: any[] = [];
  notifications: any[] = [];
  attendance: any[] = [];
  avgScore = 0;
  passed = 0;
  failed = 0;
  present = 0;
  absent = 0;
  attendancePct = 0;

  quickLinks = [
    { path: '/student/courses', label: 'My Courses', desc: 'View enrolled courses', icon: '📚' },
    { path: '/student/learning', label: 'Learning', desc: 'Materials & assignments', icon: '📖' },
    { path: '/student/exams', label: 'Exams', desc: 'Schedule & results', icon: '📝' },
    { path: '/student/grades', label: 'Grades', desc: 'View your grades', icon: '🏆' },
    { path: '/student/attendance', label: 'Attendance', desc: 'Track attendance', icon: '📋' },
    { path: '/student/reports', label: 'Reports', desc: 'Download reports', icon: '📊' },
    { path: '/student/calendar', label: 'Calendar', desc: 'Exams & deadlines', icon: '📅' },
    { path: '/student/profile', label: 'My Profile', desc: 'View your details', icon: '👤' },
  ];

  constructor(private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.name = this.auth.getName() || this.auth.getEmail() || '';
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(u => {
      if (u?.name) { this.name = u.name; this.cdr.detectChanges(); }
    });
    this.load();
    this.markAttendanceToday();
  }

  markAttendanceToday(): void {
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem(`attendance_marked_${today}`)) return;

    this.api.getMyEnrollments().pipe(catchError(() => of([]))).subscribe((enrollments: any[]) => {
      if (!enrollments.length) return;
      const studentId = enrollments[0].studentId;
      const classId = enrollments[0].classId;
      this.api.getAttendanceByStudent(studentId).pipe(catchError(() => of([]))).subscribe((records: any[]) => {
        const exists = records.find(a => a.date?.toString().substring(0, 10) === today);
        if (exists) { localStorage.setItem(`attendance_marked_${today}`, '1'); return; }
        this.api.createAttendance({ studentId, classId, date: today, status: 'PRESENT' })
          .pipe(catchError(() => of(null))).subscribe(result => {
            if (result) localStorage.setItem(`attendance_marked_${today}`, '1');
          });
      });
    });
  }

  load(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getMyStudent().pipe(catchError(() => of(null))).subscribe((student: any) => {
        const gradeLevel = (user as any).gradeLevel || '';
        const studentId = student?.studentId ? student.studentId : null;

        forkJoin({
          enrollments: this.api.getMyEnrollments().pipe(catchError(() => of([]))),
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
          exams: this.api.getExams().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          const enrollments = d.enrollments as any[];
          const resolvedStudentId = studentId || enrollments[0]?.studentId;

          const grades$ = resolvedStudentId
            ? this.api.getGradesByStudent(resolvedStudentId).pipe(catchError(() => of([])))
            : of([]);

          grades$.subscribe((gradesData: any[]) => {
          const enrolledIds = new Set(enrollments.filter(e => e.status?.toUpperCase() === 'ACTIVE').map((e: any) => e.courseId));
          this.courses = (d.courses as any[]).filter(c => enrolledIds.has(c.courseId));
          this.grades = gradesData;
          this.passed = this.grades.filter(g => g.grade && g.grade !== 'F').length;
          this.failed = this.grades.filter(g => g.grade === 'F').length;
          const examMap: Record<number, number> = {};
          (d.exams as any[]).forEach((e: any) => {
            if (e.questions) { try { const p = JSON.parse(e.questions); examMap[e.examId] = (p.items?.length || 0) * 10; } catch {} }
          });
          const pctScores = this.grades.map((g: any) => {
            const max = examMap[g.examId];
            return max ? Math.round((g.score / max) * 100) : g.score;
          });
          this.avgScore = pctScores.length ? Math.round(pctScores.reduce((a: number, v: number) => a + v, 0) / pctScores.length) : 0;
          const gc: Record<string, number> = {};
          this.grades.forEach(g => { gc[g.grade] = (gc[g.grade] || 0) + 1; });
          const colors: Record<string, string> = { A: '#10b981', B: '#4f46e5', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
          this.gradeBreakdown = Object.entries(gc).map(([grade, count]) => ({
            grade, count, pct: this.grades.length ? Math.round((count / this.grades.length) * 100) : 0, color: colors[grade] || '#adb5bd'
          }));

          const unattempted$ = resolvedStudentId && gradeLevel
            ? this.api.getUnattemptedExams(resolvedStudentId, gradeLevel).pipe(catchError(() => of([])))
            : of([]);

          unattempted$.subscribe((exams: any[]) => {
            this.upcomingExams = exams.map(e => {
              try { const p = JSON.parse(e.questions); return { ...e, title: p.title || e.type }; } catch { return e; }
            });

            if (resolvedStudentId) {
              this.api.getAttendanceByStudent(resolvedStudentId).pipe(catchError(() => of([]))).subscribe((att: any[]) => {
                this.attendance = att;
                this.present = att.filter(a => a.status === 'PRESENT').length;
                this.absent = att.filter(a => a.status === 'ABSENT').length;
                this.attendancePct = att.length ? Math.round((this.present / att.length) * 100) : 0;
                this.buildKpis();
                this.cdr.detectChanges();
              });
            } else {
              this.buildKpis();
              this.cdr.detectChanges();
            }
          });
          });
        });
      });
    });
  }

  buildKpis(): void {
    this.kpis = [
      { label: 'Enrolled Courses', value: this.courses.length, icon: '📚', color: '#4f46e5', sub: `${this.courses.length} active`, path: '/student/courses' },
      { label: 'Upcoming Exams', value: this.upcomingExams.length, icon: '📝', color: '#f59e0b', sub: 'Not attempted', path: '/student/exams' },
      { label: 'Attendance', value: this.attendancePct + '%', icon: '📋', color: this.attendancePct >= 75 ? '#10b981' : '#ef4444', sub: this.attendancePct < 75 ? 'Below threshold' : 'Good standing', path: '/student/attendance' },
      { label: 'Avg Score', value: this.avgScore + '%', icon: '🏆', color: '#10b981', sub: `${this.passed} passed`, path: '/student/grades' },
    ];
  }

  catIcon(cat: string): string {
    const map: any = { ENROLLMENT: '📋', EXAM: '📝', GENERAL: '📢' };
    return map[cat] || '🔔';
  }
}
