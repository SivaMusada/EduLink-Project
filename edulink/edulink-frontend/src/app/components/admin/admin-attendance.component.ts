import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Attendance Monitoring</h2>
          <p class="text-muted small mb-0">View attendance by grade level</p>
        </div>
        <button class="btn-accent" *ngIf="isTeacher" (click)="showModal=true;resetForm()">+ Mark Attendance</button>
      </div>

      <!-- Grade Selector -->
      <div class="card p-4 mb-4">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label fw-semibold">Select Grade Level</label>
            <select class="form-select" [(ngModel)]="selectedGrade" (change)="onGradeChange()">
              <option value="">-- Select a grade --</option>
              <option *ngFor="let g of allGrades" [value]="g">{{ g }}</option>
            </select>
          </div>
          <div class="col-md-3" *ngIf="selectedGrade">
            <label class="form-label fw-semibold">Filter by Date</label>
            <input type="date" class="form-control" [(ngModel)]="filterDate" (change)="onGradeChange()">
          </div>
        </div>
      </div>

      <!-- Grade Summary Cards -->
      <div class="row g-3 mb-4" *ngIf="selectedGrade">
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Total Students</div>
            <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ summary.total }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Present</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ summary.present }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Absent</div>
            <div class="fw-bold" style="font-size:1.8rem;color:#ef4444">{{ summary.absent }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card text-center">
            <div class="text-muted small mb-1">Attendance Rate</div>
            <div class="fw-bold" style="font-size:1.8rem;"
              [ngStyle]="{'color': summary.rate>=75?'#10b981':summary.rate>=50?'#f59e0b':'#ef4444'}">
              {{ summary.rate }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Records Table -->
      <div class="table-wrapper" *ngIf="selectedGrade">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Student ID</th><th>Student Name</th><th>Date</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of gradeRecords">
              <td>{{ a.studentId }}</td>
              <td class="fw-semibold">{{ a.studentName }}</td>
              <td>{{ a.date }}</td>
              <td>
                <span class="badge"
                  [ngClass]="a.status==='PRESENT'?'bg-success':a.status==='ABSENT'?'bg-danger':'bg-warning text-dark'">
                  {{ a.status }}
                </span>
              </td>
            </tr>
            <tr *ngIf="gradeRecords.length===0">
              <td colspan="4" class="text-center text-muted py-4">
                No attendance records for {{ selectedGrade }}{{ filterDate ? ' on ' + filterDate : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!selectedGrade" class="text-center py-5">
        <div style="font-size:3rem">📋</div>
        <h5 class="mt-3" style="color:var(--text-primary)">Select a grade to view attendance</h5>
        <p class="text-muted">Choose a grade level from the dropdown above</p>
      </div>

      <!-- Teacher-only modal -->
      <div class="modal d-block" *ngIf="showModal && isTeacher" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">{{ editId ? 'Update Attendance' : 'Mark Attendance' }}</h5>
              <button class="btn-close" (click)="showModal=false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>Student</label>
                <select class="form-select mt-1" [(ngModel)]="form.studentId" (change)="onStudentSelect()">
                  <option value="">Select student</option>
                  <option *ngFor="let s of myStudents" [value]="s.studentId">{{ s.name }}</option>
                </select>
                <div class="mt-2 small p-2 rounded" *ngIf="isAlreadyMarked()"
                  style="background:rgba(239,68,68,0.1);color:#ef4444">
                  ⚠️ Attendance already marked for this student on the selected date.
                </div>
              </div>
              <div class="mb-3">
                <label>Class</label>
                <select class="form-select mt-1" [(ngModel)]="form.classId">
                  <option value="">Select class</option>
                  <option *ngFor="let cl of myClasses" [value]="cl.classId">{{ cl.schedule || 'Class #'+cl.classId }}</option>
                </select>
              </div>
              <div class="mb-3"><label>Date</label><input type="date" class="form-control mt-1" [(ngModel)]="form.date"></div>
              <div class="mb-3">
                <label>Status</label>
                <select class="form-select mt-1" [(ngModel)]="form.status">
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LATE">LATE</option>
                </select>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="showModal=false">Cancel</button>
              <button class="btn-accent" (click)="save()">{{ editId ? 'Update' : 'Save' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminAttendanceComponent implements OnInit {
  isTeacher = false;
  allGrades = ['Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
  selectedGrade = '';
  filterDate = '';

  attendance: any[] = [];
  studentGradeMap: Record<number, { name: string; grade: string }> = {};
  gradeCountMap: Record<string, number> = {};
  gradeRecords: any[] = [];
  summary = { total: 0, present: 0, absent: 0, rate: 0 };

  // Teacher-specific
  myClasses: any[] = [];
  myStudents: any[] = [];  // { studentId, name, classId }

  showModal = false;
  editId: number | null = null;
  form: any = {};

  constructor(private api: ApiService, private toast: ToastService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.isTeacher = this.auth.getRole() === 'TEACHER';
    if (this.isTeacher) {
      this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
        if (!user) { this.load(); return; }
        forkJoin({
          attendance: this.api.getAttendance().pipe(catchError(() => of([]))),
          students: this.api.getStudents().pipe(catchError(() => of([]))),
          users: this.auth.getUsers().pipe(catchError(() => of([]))),
          enrollments: this.api.getEnrollmentsByTeacher(user.userId).pipe(catchError(() => of([]))),
          classes: this.api.getClasses().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          const enrollments = d.enrollments as any[];
          const myClassIds = [...new Set(enrollments.map((e: any) => e.classId))];
          this.myClasses = (d.classes as any[]).filter(cl => myClassIds.includes(cl.classId));

          const students = d.students as any[];
          const activeStudentUsers = (d.users as any[]).filter(u => u.role === 'STUDENT' && u.status === 'ACTIVE' && u.gradeLevel);

          this.gradeCountMap = {};
          activeStudentUsers.forEach((u: any) => {
            this.gradeCountMap[u.gradeLevel] = (this.gradeCountMap[u.gradeLevel] || 0) + 1;
          });

          this.studentGradeMap = {};
          students.forEach((s: any) => {
            const u = activeStudentUsers.find((u: any) =>
              u.name?.toLowerCase().trim() === s.name?.toLowerCase().trim() || u.phone === s.contactInfo
            );
            this.studentGradeMap[s.studentId] = { name: s.name, grade: u?.gradeLevel || s.gradeLevel || '' };
          });

          // Build list of students enrolled in teacher's classes
          const myStudentIds = [...new Set(enrollments.map((e: any) => e.studentId))];
          this.myStudents = students
            .filter(s => myStudentIds.includes(s.studentId))
            .map(s => {
              const enr = enrollments.find((e: any) => e.studentId === s.studentId);
              return { studentId: s.studentId, name: s.name, classId: enr?.classId };
            });

          this.attendance = d.attendance as any[];
          // Restrict grade selector to teacher's grades only
          const myGrades = [...new Set(this.myClasses.map(cl => {
            // find course grade via enrollments
            const enr = enrollments.find((e: any) => e.classId === cl.classId);
            return this.studentGradeMap[enr?.studentId]?.grade || '';
          }).filter(Boolean))] as string[];
          if (myGrades.length) this.allGrades = myGrades;

          if (this.selectedGrade) this.onGradeChange();
          this.cdr.detectChanges();
        });
      });
    } else {
      this.load();
    }
  }

  load(): void {
    forkJoin({
      attendance: this.api.getAttendance().pipe(catchError(() => of([]))),
      students: this.api.getStudents().pipe(catchError(() => of([]))),
      users: this.auth.getUsers().pipe(catchError(() => of([]))),
    }).subscribe(d => {
      this.attendance = d.attendance as any[];
      const students = d.students as any[];

      const activeStudentUsers = (d.users as any[]).filter(u =>
        u.role === 'STUDENT' && u.status === 'ACTIVE' && u.gradeLevel
      );

      this.gradeCountMap = {};
      activeStudentUsers.forEach((u: any) => {
        this.gradeCountMap[u.gradeLevel] = (this.gradeCountMap[u.gradeLevel] || 0) + 1;
      });

      this.studentGradeMap = {};
      students.forEach((s: any) => {
        const user = activeStudentUsers.find((u: any) =>
          u.name?.toLowerCase().trim() === s.name?.toLowerCase().trim() ||
          u.phone === s.contactInfo
        );
        this.studentGradeMap[s.studentId] = {
          name: s.name,
          grade: user?.gradeLevel || s.gradeLevel || ''
        };
      });

      if (this.selectedGrade) this.onGradeChange();
      this.cdr.detectChanges();
    });
  }

  onGradeChange(): void {
    if (!this.selectedGrade) {
      this.gradeRecords = [];
      this.summary = { total: 0, present: 0, absent: 0, rate: 0 };
      return;
    }

    // Total from identity users directly — always accurate
    const totalStudents = this.gradeCountMap[this.selectedGrade] || 0;

    // Filter attendance records for this grade and optional date
    const records = this.attendance
      .filter(a => {
        const info = this.studentGradeMap[a.studentId];
        const gradeMatch = info?.grade === this.selectedGrade;
        const dateMatch = !this.filterDate || a.date === this.filterDate;
        return gradeMatch && dateMatch;
      })
      .map(a => ({
        ...a,
        studentName: this.studentGradeMap[a.studentId]?.name || `Student ${a.studentId}`
      }));

    this.gradeRecords = records;

    const present = records.filter(a => a.status === 'PRESENT').length;
    const absent = records.filter(a => a.status === 'ABSENT').length;
    const total = records.length;

    this.summary = {
      total: totalStudents,
      present,
      absent,
      rate: total ? Math.round((present / total) * 100) : 0
    };

    this.cdr.detectChanges();
  }

  resetForm(): void { this.editId = null; this.form = { studentId: '', classId: '', date: '', status: 'PRESENT' }; }

  onStudentSelect(): void {
    const s = this.myStudents.find(x => x.studentId == this.form.studentId);
    if (s?.classId) this.form.classId = s.classId;
  }

  isAlreadyMarked(): boolean {
    if (!this.form.studentId || !this.form.date) return false;
    return this.attendance.some(a => a.studentId == this.form.studentId && a.date === this.form.date);
  }

  save(): void {
    if (!this.editId) {
      const alreadyMarked = this.attendance.some(
        a => a.studentId == this.form.studentId && a.date === this.form.date
      );
      if (alreadyMarked) {
        this.toast.show('Attendance already marked for this student on the selected date', 'warning');
        return;
      }
    }
    const obs = this.editId ? this.api.updateAttendance(this.editId, this.form) : this.api.createAttendance(this.form);
    obs.subscribe({
      next: () => { this.toast.show('Attendance saved', 'success'); this.showModal = false; this.load(); },
      error: () => this.toast.show('Operation failed', 'error')
    });
  }
}
