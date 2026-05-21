import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-dashboard.component.html'
})
export class TeacherDashboardComponent implements OnInit {
  name = '';
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  kpis: any[] = [];
  courses: any[] = [];
  classes: any[] = [];
  gradeStudentMap: Record<string, number> = {};
  upcomingExams: any[] = [];
  presentCount = 0; absentCount = 0; totalAttendance = 0; attendancePct = 0;
  avgScore = 0; passCount = 0; failCount = 0; lowPerformers: any[] = [];

  quickLinks = [
    { path: '/teacher/courses', label: 'My Courses', desc: 'View assigned courses', icon: '📚' },
    { path: '/teacher/materials', label: 'Materials', desc: 'Upload learning content', icon: '📄' },
    { path: '/teacher/exams', label: 'Exams', desc: 'Create & manage exams', icon: '📝' },
    { path: '/teacher/attendance', label: 'Attendance', desc: 'Mark student attendance', icon: '📋' },
    { path: '/teacher/students', label: 'My Students', desc: 'View enrolled students', icon: '🎒' },
    { path: '/teacher/performance', label: 'Performance', desc: 'Track student progress', icon: '📈' },
    { path: '/teacher/schedule', label: 'Schedule', desc: 'Manage class schedules', icon: '🗓️' },
  ];

  constructor(private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.name = this.auth.getName() || this.auth.getEmail() || '';
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      if (user.name) this.name = user.name;

      forkJoin({
        enrollments: this.api.getEnrollmentsByTeacher(user.userId).pipe(catchError(() => of([]))),
        courses: this.api.getCourses().pipe(catchError(() => of([]))),
        classes: this.api.getClasses().pipe(catchError(() => of([]))),
        exams: this.api.getExams().pipe(catchError(() => of([]))),
        grades: this.api.getGrades().pipe(catchError(() => of([]))),
        attendance: this.api.getAttendance().pipe(catchError(() => of([]))),
      }).subscribe(d => {
        const enrollments = d.enrollments as any[];
        const enrolledCourseIds = [...new Set(enrollments.map((e: any) => e.courseId))];
        const enrolledClassIds = [...new Set(enrollments.map((e: any) => e.classId))];

        this.courses = (d.courses as any[]).filter(c => enrolledCourseIds.includes(c.courseId));
        this.classes = (d.classes as any[]).filter(cl => enrolledClassIds.includes(cl.classId));

        const enrolledStudentIds = [...new Set(enrollments.map((e: any) => e.studentId))];
        const uniqueStudentCount = enrolledStudentIds.length;

        this.upcomingExams = (d.exams as any[])
          .filter(e => e.status === 'SCHEDULED' && enrolledCourseIds.includes(e.courseId))
          .sort((a, b) => a.date > b.date ? 1 : -1);

        const att = (d.attendance as any[]).filter(a => enrolledClassIds.includes(a.classId));
        this.presentCount = att.filter(a => a.status === 'PRESENT').length;
        this.absentCount = att.filter(a => a.status === 'ABSENT').length;
        this.totalAttendance = att.length;
        this.attendancePct = att.length ? Math.round((this.presentCount / att.length) * 100) : 0;

        const myExamIds = new Set(
          (d.exams as any[])
            .filter(e => enrolledCourseIds.includes(e.courseId))
            .map((e: any) => e.examId)
        );
        const grades = (d.grades as any[]).filter(g => myExamIds.has(g.examId));
        this.passCount = grades.filter(g => g.status === 'PASS').length;
        this.failCount = grades.filter(g => g.status === 'FAIL').length;
        this.avgScore = grades.length ? Math.round(grades.reduce((a, g) => a + g.score, 0) / grades.length) : 0;
        this.lowPerformers = grades.filter(g => g.score < 50);

        this.gradeStudentMap = {};
        enrolledCourseIds.forEach(cid => {
          this.gradeStudentMap[cid] = enrollments.filter((e: any) => e.courseId === cid).length;
        });

        this.kpis = [
          { label: 'My Courses', value: this.courses.length, icon: '📚', color: '#4f46e5', sub: `${this.courses.filter(c => c.status === 'ACTIVE').length} active`, path: '/teacher/courses' },
          { label: 'My Students', value: uniqueStudentCount, icon: '🎒', color: '#10b981', sub: `across ${this.courses.length} course(s)`, path: '/teacher/students' },
          { label: 'Attendance Rate', value: this.attendancePct + '%', icon: '📋', color: this.attendancePct >= 75 ? '#10b981' : '#ef4444', sub: `${this.presentCount} present`, path: '/teacher/attendance' },
          { label: 'Class Avg Score', value: this.avgScore + '%', icon: '📈', color: '#f59e0b', sub: `${this.passCount} passed`, path: '/teacher/performance' },
        ];
        this.cdr.detectChanges();
      });
    });
  }

  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
  studentCount(courseId: number): number { return this.gradeStudentMap[courseId] || 0; }
}
