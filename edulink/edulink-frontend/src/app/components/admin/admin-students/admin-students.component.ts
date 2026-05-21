import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-students.component.html'
})
export class AdminStudentsComponent implements OnInit {
  allStudents: any[] = [];
  filtered: any[] = [];
  filter = 'ALL';
  pendingCount = 0;

  role = '';
  viewSelected: any = null;
  activeTab = 'list';

  teachers: any[] = [];
  allClasses: any[] = [];
  allCourses: any[] = [];
  assignTeacherId = '';
  assignClassId = '';
  teacherClasses: any[] = [];
  assignGrade = '';
  gradeStudents: any[] = [];
  enrolledStudentIds: Set<number> = new Set();

  get gradeOptions(): string[] {
    return [...new Set(this.allStudents.filter(s => s.studentId && s.gradeLevel).map(s => s.gradeLevel))];
  }

  constructor(private api: ApiService, private toast: ToastService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.role = this.auth.getRole() || '';
    this.load();
    if (this.role === 'ADMIN') {
      this.auth.getUsers().pipe(catchError(() => of([]))).subscribe(u => {
        this.teachers = (u as any[]).filter(x => x.role === 'TEACHER');
        this.cdr.detectChanges();
      });
      this.api.getClasses().subscribe(cl => { this.allClasses = cl; this.cdr.detectChanges(); });
      this.api.getCourses().subscribe(c => { this.allCourses = c; this.cdr.detectChanges(); });
    }
  }

  load(): void {
    this.auth.getAllStudentRegistrations().pipe(catchError(() => of([]))).subscribe(registered => {
      this.api.getStudents().pipe(catchError(() => of([]))).subscribe(academic => {

        if ((registered as any[]).length === 0 && (academic as any[]).length > 0) {
          this.allStudents = (academic as any[]).map((a: any) => ({
            ...a,
            studentId: a.studentId,
            name: a.name,
            email: a.contactInfo || '—',
            phone: a.contactInfo || '—',
            enrollmentDate: a.enrollmentDate,
            registrationStatus: a.status || 'ACTIVE',
            gradeLevel: a.gradeLevel || null
          }));
          this.pendingCount = 0;
          this.applyFilter();
          this.cdr.detectChanges();
          return;
        }

        const deduped = (registered as any[]).map(r => {
          const match = (academic as any[]).find((a: any) =>
            a.contactInfo === r.phone ||
            a.name?.toLowerCase().trim() === r.name?.toLowerCase().trim()
          );
          return {
            ...r,
            studentId: match?.studentId || null,
            enrollmentDate: match?.enrollmentDate || null,
            registrationStatus: r.status,
            gradeLevel: r.gradeLevel || match?.gradeLevel || null
          };
        });

        this.allStudents = deduped;
        this.pendingCount = deduped.filter((s: any) => s.status === 'PENDING').length;
        this.applyFilter();
        this.cdr.detectChanges();
      });
    });
  }

  setFilter(f: string): void { this.filter = f; this.applyFilter(); }

  applyFilter(): void {
    const nonRejected = this.allStudents.filter(s => s.registrationStatus !== 'REJECTED');
    this.filtered = this.filter === 'ALL'
      ? nonRejected
      : nonRejected.filter(s => s.registrationStatus === this.filter);
  }

  viewStudent(s: any): void { this.viewSelected = s; }

  onTeacherChange(): void {
    this.assignClassId = '';
    this.assignGrade = '';
    this.gradeStudents = [];
    this.teacherClasses = this.allClasses
      .filter(cl => cl.teacherId == +this.assignTeacherId)
      .map(cl => ({
        ...cl,
        courseName: this.allCourses.find(c => c.courseId === cl.courseId)?.title || `Course ${cl.courseId}`
      }));
  }

  onClassChange(): void {
    this.assignGrade = '';
    this.gradeStudents = [];
    this.enrolledStudentIds = new Set();
    const cl = this.allClasses.find(c => c.classId == this.assignClassId);
    if (!cl) return;
    this.api.getEnrollmentsByCourse(cl.courseId).subscribe({
      next: (enrollments: any[]) => {
        this.enrolledStudentIds = new Set(
          enrollments.filter(e => e.classId == this.assignClassId).map(e => e.studentId)
        );
        const course = this.allCourses.find(c => c.courseId === cl.courseId);
        if (course?.gradeLevel) {
          this.assignGrade = course.gradeLevel;
          this.onGradeChange();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        const course = this.allCourses.find(c => c.courseId === cl.courseId);
        if (course?.gradeLevel) { this.assignGrade = course.gradeLevel; this.onGradeChange(); }
      }
    });
  }

  onGradeChange(): void {
    this.gradeStudents = this.allStudents.filter(s =>
      s.studentId && s.gradeLevel === this.assignGrade &&
      s.registrationStatus === 'ACTIVE' && !this.enrolledStudentIds.has(s.studentId)
    );
  }

  confirmAssign(): void {
    if (!this.assignClassId || !this.gradeStudents.length) { this.toast.show('No active students to assign', 'error'); return; }
    const cl = this.allClasses.find(c => c.classId == this.assignClassId);
    if (!cl) return;
    let done = 0, failed = 0;
    const total = this.gradeStudents.length;
    this.gradeStudents.forEach(s => {
      this.api.enrollStudent({ studentId: s.studentId, courseId: cl.courseId, classId: +this.assignClassId, teacherId: cl.teacherId }).subscribe({
        next: () => {
          done++;
          if (done + failed === total) {
            this.onAssignComplete(done, failed);
            this.assignTeacherId = '';
            this.assignClassId = '';
            this.assignGrade = '';
            this.gradeStudents = [];
            this.teacherClasses = [];
          }
        },
        error: () => {
          failed++;
          if (done + failed === total) this.onAssignComplete(done, failed);
        }
      });
    });
  }

  onAssignComplete(done: number, failed: number): void {
    if (done > 0) this.toast.show(`${done} student(s) assigned successfully`, 'success');
    if (failed > 0) this.toast.show(`${failed} assignment(s) failed`, 'error');
  }

  deleteStudent(s: any): void {
    if (!confirm(`Delete student "${s.name}"? This will permanently remove all their data.`)) return;

    if (s.userId) {
      this.auth.deleteUser(s.userId).subscribe({
        next: () => { this.toast.show('Student deleted successfully', 'success'); this.load(); },
        error: () => {
          if (s.studentId) {
            this.api.deleteStudent(s.studentId).subscribe({
              next: () => { this.toast.show('Student removed', 'success'); this.load(); },
              error: () => this.toast.show('Delete failed', 'error')
            });
          } else {
            this.toast.show('Delete failed', 'error');
          }
        }
      });
    } else if (s.studentId) {
      this.api.deleteStudent(s.studentId).subscribe({
        next: () => { this.toast.show('Student removed', 'success'); this.load(); },
        error: () => this.toast.show('Delete failed', 'error')
      });
    } else {
      this.toast.show('Cannot delete: no ID found', 'error');
    }
  }

  statusBadge(status: string): string {
    const map: any = { ACTIVE: 'bg-success', PENDING: 'bg-warning text-dark', REJECTED: 'bg-danger', INACTIVE: 'bg-secondary', GRADUATED: 'bg-info text-dark' };
    return map[status] || 'bg-secondary';
  }

  statusLabel(status: string): string {
    const map: any = { ACTIVE: 'Approved', PENDING: 'Pending', REJECTED: 'Rejected', INACTIVE: 'Inactive', GRADUATED: 'Graduated' };
    return map[status] || status;
  }
}
