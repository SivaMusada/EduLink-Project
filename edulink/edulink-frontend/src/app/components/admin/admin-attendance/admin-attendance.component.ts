import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-attendance.component.html'
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

  myClasses: any[] = [];
  myStudents: any[] = [];

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

          const myStudentIds = [...new Set(enrollments.map((e: any) => e.studentId))];
          this.myStudents = students
            .filter(s => myStudentIds.includes(s.studentId))
            .map(s => {
              const enr = enrollments.find((e: any) => e.studentId === s.studentId);
              return { studentId: s.studentId, name: s.name, classId: enr?.classId };
            });

          this.attendance = d.attendance as any[];
          const myGrades = [...new Set(this.myClasses.map(cl => {
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

    const totalStudents = this.gradeCountMap[this.selectedGrade] || 0;

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
