import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">My Students</h2>
          <p class="text-muted small mb-0">{{ students.length }} students assigned to your classes</p>
        </div>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm" style="width:150px" [(ngModel)]="filterGrade" (change)="applyFilter()">
            <option value="">All Grades</option>
            <option *ngFor="let g of myGrades" [value]="g">{{ g }}</option>
          </select>
          <input class="form-control form-control-sm" style="width:160px" [(ngModel)]="search" placeholder="🔍 Search..." (input)="applyFilter()">
        </div>
      </div>

      <!-- Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Total Students</div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ students.length }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">My Courses</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#4f46e5">{{ courses.length }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Avg Attendance</div>
            <div class="fw-bold" style="font-size:1.8rem;" [ngStyle]="{'color': avgAttendance>=75?'#10b981':'#ef4444'}">{{ avgAttendance }}%</div>
          </div>
        </div>
      </div>

      <!-- Grade Breakdown Cards -->
      <div class="row g-3 mb-4" *ngIf="gradeBreakdown.length > 0">
        <div class="col-md-4" *ngFor="let g of gradeBreakdown">
          <div class="card p-3" style="border-left:4px solid var(--accent)">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold" style="color:var(--text-primary)">{{ g.grade }}</span>
              <span class="badge bg-info text-dark" style="font-size:0.9rem">{{ g.count }} students</span>
            </div>
            <div class="text-muted small mb-2">{{ g.courseName }}</div>
            <div class="progress" style="height:8px;border-radius:4px">
              <div class="progress-bar" style="background:var(--accent);border-radius:4px"
                [style.width]="gradeStudentPct(g.count)+'%'"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- No courses assigned -->
      <div *ngIf="myGrades.length === 0" class="text-center py-5">
        <div style="font-size:3rem">🎒</div>
        <h5 class="mt-3" style="color:var(--text-primary)">No courses assigned yet</h5>
        <p class="text-muted">Students will appear here once admin assigns courses to you.</p>
      </div>

      <!-- Students Table -->
      <div class="table-wrapper" *ngIf="myGrades.length > 0">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Name</th><th>Grade</th><th>Course</th><th>Contact</th><th>Attendance</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filtered">
              <td class="fw-semibold" style="color:var(--text-primary)">{{ s.name }}</td>
              <td><span class="badge bg-info text-dark">{{ s.gradeLevel }}</span></td>
              <td class="small text-muted">{{ s.courseName }}</td>
              <td class="small text-muted">{{ s.contactInfo }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1" style="height:6px;max-width:60px">
                    <div class="progress-bar" [style.width]="s.attendancePct+'%'"
                      [ngClass]="s.attendancePct>=75?'bg-success':s.attendancePct>=50?'bg-warning':'bg-danger'"></div>
                  </div>
                  <span class="small" [ngStyle]="{'color': s.attendancePct>=75?'#10b981':'#ef4444'}">{{ s.attendancePct }}%</span>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="s.attendancePct > 0 && s.attendancePct < 75 ? 'bg-warning text-dark' : 'bg-success'">
                  {{ s.attendancePct > 0 && s.attendancePct < 75 ? 'Low Attendance' : 'Active' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="filtered.length === 0 && myGrades.length > 0">
              <td colspan="6" class="text-center text-muted py-4">No students found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
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
