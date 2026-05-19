import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="section-title mb-0">Students</h2>
      </div>

      <!-- Students List Tab -->
      <div *ngIf="activeTab==='list'">
        <div class="d-flex gap-1 mb-3">
          <button class="btn btn-sm" [ngClass]="filter==='ALL'?'btn-accent':'btn-outline-secondary'" (click)="setFilter('ALL')">All</button>
          <button class="btn btn-sm" [ngClass]="filter==='ACTIVE'?'btn-accent':'btn-outline-secondary'" (click)="setFilter('ACTIVE')">Active</button>
          <button class="btn btn-sm" [ngClass]="filter==='PENDING'?'btn-accent':'btn-outline-secondary'" (click)="setFilter('PENDING')">
            Pending <span class="badge bg-warning text-dark ms-1">{{ pendingCount }}</span>
          </button>
        </div>
        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Grade</th><th>DOB</th><th>Gender</th>
                <th>Enrolled</th><th>Registration</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of filtered">
                <td class="fw-semibold">{{ s.name }}</td>
                <td>{{ s.email }}</td>
                <td>{{ s.phone }}</td>
                <td><span class="badge bg-info text-dark">{{ s.gradeLevel || '—' }}</span></td>
                <td>{{ s.dob }}</td>
                <td>{{ s.gender }}</td>
                <td>{{ s.enrollmentDate || '—' }}</td>
                <td>
                  <span class="badge" [ngClass]="statusBadge(s.registrationStatus)">{{ statusLabel(s.registrationStatus) }}</span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" (click)="viewStudent(s)">View</button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteStudent(s)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="filtered.length===0">
                <td colspan="9" class="text-center text-muted py-4">No students found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Assign Students to Teacher Tab -->
      <div *ngIf="activeTab==='assign' && role==='ADMIN'">
        <div class="card p-4 mb-4">
          <h6 class="fw-bold mb-3" style="color:var(--text-primary)">Select Teacher & Class</h6>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label small">Teacher</label>
              <select class="form-select" [(ngModel)]="assignTeacherId" (change)="onTeacherChange()">
                <option value="">Select teacher</option>
                <option *ngFor="let t of teachers" [value]="t.userId">{{ t.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label small">Class</label>
              <select class="form-select" [(ngModel)]="assignClassId" [disabled]="!assignTeacherId" (change)="onClassChange()">
                <option value="">Select class</option>
                <option *ngFor="let cl of teacherClasses" [value]="cl.classId">
                  {{ cl.courseName }} — {{ cl.schedule || 'No schedule' }}
                </option>
              </select>
              <div class="text-muted small mt-1" *ngIf="assignTeacherId && teacherClasses.length===0">No classes found for this teacher</div>
            </div>
            <div class="col-md-4" *ngIf="assignClassId">
              <label class="form-label small">Assign by Grade</label>
              <select class="form-select" [(ngModel)]="assignGrade" (change)="onGradeChange()">
                <option value="">Select grade</option>
                <option *ngFor="let g of gradeOptions" [value]="g">{{ g }}</option>
              </select>
              <div class="text-muted small mt-1" *ngIf="assignGrade && gradeStudents.length===0">No students in this grade</div>
            </div>
          </div>
        </div>

        <div class="card p-4" *ngIf="assignClassId && assignGrade && gradeStudents.length > 0">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 class="fw-bold mb-0" style="color:var(--text-primary)">Students in {{ assignGrade }}</h6>
              <p class="text-muted small mb-0">{{ gradeStudents.length }} student(s) not yet assigned to this class</p>
            </div>
            <button class="btn-accent btn-sm" (click)="confirmAssign()">
              Assign All {{ gradeStudents.length }} Students
            </button>
          </div>
          <div class="table-wrapper">
            <table class="table table-hover mb-0">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of gradeStudents">
                  <td class="fw-semibold">{{ s.name }}</td>
                  <td>{{ s.email }}</td>
                  <td>{{ s.phone }}</td>
                  <td><span class="badge" [ngClass]="statusBadge(s.registrationStatus)">{{ statusLabel(s.registrationStatus) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- View Student Modal -->
      <div class="modal d-block" *ngIf="viewSelected" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">Student Details</h5>
              <button class="btn-close" (click)="viewSelected=null"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Full Name</div><div class="fw-semibold" style="color:var(--text-primary)">{{ viewSelected.name }}</div></div></div>
                <div class="col-md-6"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Email</div><div class="fw-semibold" style="color:var(--text-primary)">{{ viewSelected.email }}</div></div></div>
                <div class="col-md-6"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Phone</div><div class="fw-semibold" style="color:var(--text-primary)">{{ viewSelected.phone }}</div></div></div>
                <div class="col-md-6"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Date of Birth</div><div class="fw-semibold" style="color:var(--text-primary)">{{ viewSelected.dob }}</div></div></div>
                <div class="col-md-6"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Gender</div><div class="fw-semibold" style="color:var(--text-primary)">{{ viewSelected.gender }}</div></div></div>
                <div class="col-md-6"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Grade Level</div><div class="fw-semibold" style="color:var(--text-primary)"><span class="badge bg-info text-dark">{{ viewSelected.gradeLevel || '—' }}</span></div></div></div>
                <div class="col-md-6"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Enrollment Date</div><div class="fw-semibold" style="color:var(--text-primary)">{{ viewSelected.enrollmentDate || '—' }}</div></div></div>
                <div class="col-12"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Address</div><div style="color:var(--text-primary)">{{ viewSelected.address }}</div></div></div>
                <div class="col-md-6"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Registration Status</div><span class="badge" [ngClass]="statusBadge(viewSelected.registrationStatus)">{{ statusLabel(viewSelected.registrationStatus) }}</span></div></div>
                <div class="col-md-6" *ngIf="viewSelected.studentId"><div class="p-3 rounded" style="background:var(--bg-secondary)"><div class="text-muted small mb-1">Student ID</div><div class="fw-semibold" style="color:var(--text-primary)">#{{ viewSelected.studentId }}</div></div></div>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="viewSelected=null">Close</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
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

        // If registered is empty (e.g. BOARD role fallback), build from student-service data
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

        // identity is the single source of truth — one entry per student
        // just enrich each registration with studentId from student-service
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
    // fetch existing enrollments for this class to exclude already-assigned students
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
    // exclude students already enrolled in this class
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
            // reset so admin can see the result clearly
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

    // delete from identity-service (cascades to student-service via deleteStudentRecord)
    if (s.userId) {
      this.auth.deleteUser(s.userId).subscribe({
        next: () => { this.toast.show('Student deleted successfully', 'success'); this.load(); },
        error: () => {
          // fallback: delete from student-service directly if userId delete fails
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
      // no userId — only in student-service
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
