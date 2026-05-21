import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {

  displayName = '';
  role = '';
  today = new Date().toLocaleDateString();

  kpis: any[] = [];
  courses: any[] = [];
  pendingStudents: any[] = [];
  gradeDistribution: any[] = [];

  passRate = 0;
  avgScore = 0;
  attendancePct = 0;

  presentCount = 0;
  absentCount = 0;
  lateCount = 0;
  lowAttendanceCount = 0;

  constructor(private auth: AuthService, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.role = this.auth.getRole() || '';
    this.auth.getMe().subscribe(u => {
      this.displayName = u?.name || '';
      this.cdr.detectChanges();
    });

    this.load();
  }

  load(): void {
    forkJoin({
      students: this.auth.getAllStudentRegistrations().pipe(catchError(() => of([]))),
      courses: this.api.getCourses().pipe(catchError(() => of([]))),
      users: this.auth.getUsers().pipe(catchError(() => of([]))),
      attendance: this.api.getAttendance().pipe(catchError(() => of([]))),
      grades: this.api.getGrades().pipe(catchError(() => of([]))),
    }).subscribe(d => {

      const teachers = d.users.filter((u: any) => u.role === 'TEACHER').length;
      const activeCourses = d.courses.filter((c: any) => c.status === 'ACTIVE').length;
      const approvedStudents = d.students.filter((s: any) => s.status === 'ACTIVE').length;

      this.passRate = d.grades.length ?
        Math.round(d.grades.filter((g: any) => g.grade && g.grade !== 'F').length / d.grades.length * 100) : 0;

      this.avgScore = d.grades.length ?
        Math.round(d.grades.reduce((a: number, g: any) => a + g.score, 0) / d.grades.length) : 0;

      this.presentCount = d.attendance.filter((a: any) => a.status === 'PRESENT').length;
      this.absentCount = d.attendance.filter((a: any) => a.status === 'ABSENT').length;
      this.lateCount = d.attendance.filter((a: any) => a.status === 'LATE').length;

      this.attendancePct = d.attendance.length ?
        Math.round(this.presentCount / d.attendance.length * 100) : 0;

      this.pendingStudents = d.students.filter((s: any) => s.status === 'PENDING');

      this.kpis = [
        { label: 'Students', value: approvedStudents, icon: '🎒', color: '#4f46e5', sub: 'Approved students', path: '/admin/students' },
        { label: 'Teachers', value: teachers, icon: '👨🏫', color: '#10b981', sub: 'Staff', path: '/admin/users' },
        { label: 'Courses', value: d.courses.length, icon: '📚', color: '#f59e0b', sub: `${activeCourses} active`, path: '/admin/courses' },
        { label: 'Pending Approvals', value: this.pendingStudents.length, icon: '⏳', color: '#ef4444', sub: 'Awaiting review', path: '/admin/approvals' }
      ].filter(k => !(this.role === 'BOARD' && k.label === 'Pending Approvals'));

      this.courses = d.courses;

      this.cdr.detectChanges();
    });
  }

  approve(id: number) {
    this.auth.approveStudent(id, 'ACTIVE').subscribe(() => this.load());
  }

  reject(id: number) {
    this.auth.approveStudent(id, 'REJECTED').subscribe(() => this.load());
  }

  courseBar(c: any): string {
    return c.status === 'ACTIVE' ? '100%' : '40%';
  }

}
