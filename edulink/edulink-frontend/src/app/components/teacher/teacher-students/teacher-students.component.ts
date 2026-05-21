import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-students.component.html'
})
export class TeacherStudentsComponent implements OnInit {
  students: any[] = [];
  filtered: any[] = [];
  courses: any[] = [];
  myGrades: string[] = [];
  gradeBreakdown: any[] = [];
  search = '';
  filterGrade = '';
  avgAttendance = 0;
  avgScore = 0;

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;

      forkJoin({
        enrollments: this.api.getEnrollmentsByTeacher(user.userId).pipe(catchError(() => of([]))),
        courses: this.api.getCourses().pipe(catchError(() => of([]))),
        allStudents: this.api.getStudents().pipe(catchError(() => of([]))),
        attendance: this.api.getAttendance().pipe(catchError(() => of([]))),
        grades: this.api.getGrades().pipe(catchError(() => of([]))),
      }).subscribe(d => {
        const enrollments = d.enrollments as any[];
        const enrolledCourseIds = [...new Set(enrollments.map((e: any) => e.courseId))];
        const enrolledClassIds = [...new Set(enrollments.map((e: any) => e.classId))];
        const enrolledStudentIds = [...new Set(enrollments.map((e: any) => e.studentId))];

        this.courses = (d.courses as any[]).filter(c => enrolledCourseIds.includes(c.courseId));
        this.myGrades = [...new Set(this.courses.map(c => c.gradeLevel).filter(Boolean))] as string[];

        if (enrolledStudentIds.length === 0) { this.cdr.detectChanges(); return; }

        const allStudents = (d.allStudents as any[]).filter(s => enrolledStudentIds.includes(s.studentId));
        const attendance = (d.attendance as any[]).filter(a => enrolledClassIds.includes(a.classId));
        const grades = d.grades as any[];

        this.students = allStudents.map(s => {
          const enrollment = enrollments.find((e: any) => e.studentId === s.studentId);
          const course = this.courses.find(c => c.courseId === enrollment?.courseId);

          const sAtt = attendance.filter(a => a.studentId === s.studentId);
          const present = sAtt.filter(a => a.status === 'PRESENT').length;
          const attPct = sAtt.length ? Math.round((present / sAtt.length) * 100) : 0;

          const sGrades = grades.filter(g => g.studentId === s.studentId);
          const avgSc = sGrades.length ? Math.round(sGrades.reduce((a, g) => a + g.score, 0) / sGrades.length) : 0;

          return {
            studentId: s.studentId,
            name: s.name,
            contactInfo: s.contactInfo,
            gradeLevel: s.gradeLevel,
            courseName: course?.title || '—',
            courseId: course?.courseId || null,
            attendancePct: attPct,
            avgScore: avgSc
          };
        });

        this.gradeBreakdown = this.myGrades.map(grade => {
          const course = this.courses.find(c => c.gradeLevel === grade);
          const count = this.students.filter(s => s.gradeLevel === grade).length;
          return { grade, count, courseName: course?.title || '—' };
        }).filter(g => g.count > 0);

        this.avgAttendance = this.students.length
          ? Math.round(this.students.reduce((a, s) => a + s.attendancePct, 0) / this.students.length) : 0;
        this.avgScore = this.students.filter(s => s.avgScore > 0).length
          ? Math.round(this.students.filter(s => s.avgScore > 0).reduce((a, s) => a + s.avgScore, 0) / this.students.filter(s => s.avgScore > 0).length) : 0;

        this.applyFilter();
        this.cdr.detectChanges();
      });
    });
  }

  applyFilter(): void {
    this.filtered = this.students.filter(s => {
      const ms = !this.search || s.name?.toLowerCase().includes(this.search.toLowerCase()) || s.contactInfo?.includes(this.search);
      const mg = !this.filterGrade || s.gradeLevel === this.filterGrade;
      return ms && mg;
    });
  }

  gradeStudentPct(count: number): number {
    const max = Math.max(...this.gradeBreakdown.map(g => g.count), 1);
    return Math.round((count / max) * 100);
  }
}
