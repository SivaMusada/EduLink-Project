import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Course & Class Management</h2>
          <p class="text-muted small mb-0">{{ courses.length }} courses · {{ classes.length }} classes</p>
        </div>
        <div class="d-flex gap-2" *ngIf="role!=='TEACHER' && role!=='BOARD'">
          <button class="btn btn-outline-secondary btn-sm" (click)="activeTab='classes';showClassModal=true;resetClassForm()">+ Add Class</button>
          <button class="btn-accent" *ngIf="canEdit" (click)="activeTab='courses';showModal=true;resetForm()">+ Add Course</button>
        </div>
      </div>

      <ul class="nav nav-tabs mb-4">
        <li class="nav-item"><a class="nav-link" [class.active]="activeTab==='courses'" href="javascript:void(0)" (click)="activeTab='courses'">📚 Courses</a></li>
        <li class="nav-item"><a class="nav-link" [class.active]="activeTab==='classes'" href="javascript:void(0)" (click)="activeTab='classes'">🗓️ Classes</a></li>
      </ul>

      <div *ngIf="activeTab==='courses'">
        <div class="card p-3 mb-3">
          <div class="row g-2">
            <div class="col-md-6"><input class="form-control" [(ngModel)]="search" placeholder="🔍 Search courses..." (input)="applyFilter()"></div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="filterStatus" (change)="applyFilter()">
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="filterGrade" (change)="applyFilter()">
                <option value="">All Grades</option>
                <option *ngFor="let g of allGrades" [value]="g">{{ g }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead>
              <tr><th>Title</th><th>Subject</th><th>Grade Level</th><th>Credits</th><th>Classes</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredCourses">
                <td class="fw-semibold" style="color:var(--text-primary)">{{ c.title }}</td>
                <td>{{ c.subject }}</td>
                <td><span class="badge bg-info text-dark">{{ c.gradeLevel }}</span></td>
                <td>{{ c.credits }}</td>
                <td><span class="badge bg-secondary">{{ classCount(c.courseId) }}</span></td>
                <td><span class="badge" [ngClass]="c.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ c.status }}</span></td>
              </tr>
              <tr *ngIf="filteredCourses.length===0"><td colspan="7" class="text-center text-muted py-4">No courses found</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="activeTab==='classes'">
        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead>
              <tr><th>Class ID</th><th>Course</th><th>Teacher Name</th><th>Schedule</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let cl of classes">
                <td>#{{ cl.classId }}</td>
                <td>{{ courseName(cl.courseId) }}</td>
                <td>
                  <select class="form-select form-select-sm" style="width:auto" [(ngModel)]="cl.teacherId" (change)="updateClass(cl)" *ngIf="role==='ADMIN'">
                    <option *ngFor="let t of teachers" [value]="t.userId">{{ t.name }}</option>
                  </select>
                  <span *ngIf="role==='TEACHER'">{{ myName }}</span>
                  <span *ngIf="role!=='ADMIN' && role!=='TEACHER'">{{ teacherName(cl.teacherId) }}</span>
                </td>
                <td>{{ cl.schedule }}</td>
                <td><span class="badge" [ngClass]="cl.status==='ACTIVE'?'bg-success':'bg-secondary'">{{ cl.status }}</span></td>
              </tr>
              <tr *ngIf="classes.length===0"><td colspan="6" class="text-center text-muted py-4">No classes found</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Course Modal -->
      <div class="modal d-block" *ngIf="showModal" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">{{ editId ? 'Edit Course' : 'Add Course' }}</h5>
              <button class="btn-close" (click)="showModal=false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3"><label>Title</label><input class="form-control mt-1" name="title" [(ngModel)]="form.title" placeholder="Course title"></div>
              <div class="mb-3"><label>Subject</label><input class="form-control mt-1" name="subject" [(ngModel)]="form.subject" placeholder="Subject"></div>
              <div class="mb-3">
                <label>Grade Level</label>
                <select class="form-select mt-1" name="gradeLevel" [(ngModel)]="form.gradeLevel">
                  <option value="">Select grade</option>
                  <option *ngFor="let g of allGrades" [value]="g">{{ g }}</option>
                </select>
              </div>
              <div class="mb-3"><label>Credits</label><input type="number" class="form-control mt-1" name="credits" [(ngModel)]="form.credits"></div>
              <div class="mb-3" *ngIf="role==='ADMIN' && !editId">
                <label>Assign Teacher <span class="text-muted small">(optional)</span></label>
                <select class="form-select mt-1" name="teacherId" [(ngModel)]="form.teacherId">
                  <option value="">Select teacher</option>
                  <option *ngFor="let t of teachers" [value]="t.userId">{{ t.name }}</option>
                </select>
              </div>
              <div *ngIf="role==='ADMIN' && !editId && form.teacherId">
                <div class="mb-2">
                  <label>Start Date</label>
                  <input type="date" class="form-control mt-1" [(ngModel)]="schedPicker.startDate">
                </div>
                <div class="mb-2">
                  <label>Days</label>
                  <div class="d-flex flex-wrap gap-2 mt-1">
                    <div *ngFor="let d of weekDays" class="form-check form-check-inline m-0">
                      <input class="form-check-input" type="checkbox" [id]="'fd-'+d" [checked]="schedPicker.days.includes(d)" (change)="toggleDay(d, schedPicker)">
                      <label class="form-check-label small" [for]="'fd-'+d">{{d}}</label>
                    </div>
                  </div>
                </div>
                <div class="row g-2 mb-3">
                  <div class="col-6"><label>Start Time</label><input type="time" class="form-control mt-1" [(ngModel)]="schedPicker.startTime"></div>
                  <div class="col-6"><label>End Time</label><input type="time" class="form-control mt-1" [(ngModel)]="schedPicker.endTime"></div>
                </div>
              </div>
              <div class="mb-3 p-3 rounded" style="background:var(--bg-secondary)" *ngIf="role==='ADMIN' && !editId && form.gradeLevel">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="autoEnroll" name="autoEnroll" [(ngModel)]="form.autoEnroll">
                  <label class="form-check-label fw-semibold" for="autoEnroll">
                    Auto-enroll all <span class="badge bg-info text-dark">{{ form.gradeLevel }}</span> students
                    <span class="text-success small ms-1">(recommended)</span>
                  </label>
                </div>
                <div class="text-muted small mt-1">
                  {{ gradeStudentCount(form.gradeLevel) }} active student(s) will be enrolled automatically.
                  <span *ngIf="!form.autoEnroll" class="text-warning d-block mt-1">⚠️ Without this, students won't see this course in their dashboard.</span>
                </div>
              </div>
              <div class="mb-3">
                <label>Status</label>
                <select class="form-select mt-1" name="status" [(ngModel)]="form.status">
                  <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="showModal=false">Cancel</button>
              <button class="btn-accent" (click)="save()">{{ editId ? 'Update' : 'Create' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Class Modal -->
      <div class="modal d-block" *ngIf="showClassModal" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content p-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="fw-bold" style="color:var(--text-primary)">Add Class</h5>
              <button class="btn-close" (click)="showClassModal=false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>Course</label>
                <select class="form-select mt-1" [(ngModel)]="classForm.courseId">
                  <option value="">Select course</option>
                  <option *ngFor="let c of courses" [value]="c.courseId">{{ c.title }} ({{ c.gradeLevel }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label>Assign Teacher</label>
                <select class="form-select mt-1" [(ngModel)]="classForm.teacherId">
                  <option value="">Select teacher</option>
                  <option *ngFor="let t of teachers" [value]="t.userId">{{ t.name }}</option>
                </select>
              </div>
              <div class="mb-2">
                <label>Start Date</label>
                <input type="date" class="form-control mt-1" [(ngModel)]="classPicker.startDate">
              </div>
              <div class="mb-2">
                <label>Days</label>
                <div class="d-flex flex-wrap gap-2 mt-1">
                  <div *ngFor="let d of weekDays" class="form-check form-check-inline m-0">
                    <input class="form-check-input" type="checkbox" [id]="'cd-'+d" [checked]="classPicker.days.includes(d)" (change)="toggleDay(d, classPicker)">
                    <label class="form-check-label small" [for]="'cd-'+d">{{d}}</label>
                  </div>
                </div>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6"><label>Start Time</label><input type="time" class="form-control mt-1" [(ngModel)]="classPicker.startTime"></div>
                <div class="col-6"><label>End Time</label><input type="time" class="form-control mt-1" [(ngModel)]="classPicker.endTime"></div>
              </div>
              <div class="mb-3">
                <label>Status</label>
                <select class="form-select mt-1" [(ngModel)]="classForm.status">
                  <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button class="btn btn-secondary" (click)="showClassModal=false">Cancel</button>
              <button class="btn-accent" (click)="saveClass()">Create Class</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminCoursesComponent implements OnInit {
  courses: any[] = [];
  filteredCourses: any[] = [];
  classes: any[] = [];
  teachers: any[] = [];
  students: any[] = [];
  gradeOptions: string[] = [];
  search = '';
  filterStatus = '';
  filterGrade = '';
  activeTab = 'courses';
  showModal = false;
  showClassModal = false;
  editId: number | null = null;
  form: any = { title: '', subject: '', gradeLevel: '', credits: 0, status: 'ACTIVE', teacherId: '', autoEnroll: true };
  classForm: any = {};
  role = '';
  canEdit = false;
  myName = '';

  readonly allGrades = ['Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  schedPicker = { startDate: '', days: [] as string[], startTime: '', endTime: '' };
  classPicker = { startDate: '', days: [] as string[], startTime: '', endTime: '' };

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.role = this.auth.getRole() || '';
    this.canEdit = ['ADMIN', 'TEACHER', 'BOARD'].includes(this.role);
    if (this.role === 'TEACHER') {
      this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
        if (!user) { this.load(); return; }
        this.myName = user.name || this.auth.getName() || 'Teacher';
        this.api.getClasses().subscribe(allClasses => {
          const myClasses = (allClasses as any[]).filter(cl => cl.teacherId == user.userId);
          this.classes = myClasses;
          const courseIds = [...new Set(myClasses.map((cl: any) => cl.courseId))];
          this.api.getCourses().subscribe(c => {
            this.courses = (c as any[]).filter(course => courseIds.includes(course.courseId));
            this.applyFilter();
            this.cdr.detectChanges();
          });
        });
        this.auth.getUsers().pipe(catchError(() => of([]))).subscribe(u => {
          this.teachers = (u as any[]).filter(x => x.role === 'TEACHER');
          this.cdr.detectChanges();
        });
      });
    } else {
      this.load();
    }
  }

  load(): void {
    this.api.getCourses().subscribe(c => {
      this.courses = c;
      this.gradeOptions = [...new Set((c as any[]).map(x => x.gradeLevel).filter(Boolean))];
      this.applyFilter();
      this.cdr.detectChanges();
    });
    this.api.getClasses().subscribe(cl => { this.classes = cl; this.cdr.detectChanges(); });
    this.auth.getUsers().pipe(catchError(() => of([]))).subscribe(u => {
      this.teachers = (u as any[]).filter(x => x.role === 'TEACHER');
      this.cdr.detectChanges();
    });
    if (this.role === 'ADMIN') {
      this.api.getStudents().pipe(catchError(() => of([]))).subscribe(academic => {
        this.students = (academic as any[]).filter(s => s.status === 'ACTIVE' && s.gradeLevel);
        this.cdr.detectChanges();
      });
    }
  }

  applyFilter(): void {
    this.filteredCourses = this.courses.filter(c => {
      const ms = !this.search || c.title?.toLowerCase().includes(this.search.toLowerCase()) || c.subject?.toLowerCase().includes(this.search.toLowerCase());
      const mst = !this.filterStatus || c.status === this.filterStatus;
      const mg = !this.filterGrade || c.gradeLevel === this.filterGrade;
      return ms && mst && mg;
    });
  }

  classCount(courseId: number): number { return this.classes.filter(c => c.courseId === courseId).length; }
  courseName(courseId: number): string { return this.courses.find(c => c.courseId === courseId)?.title || `Course ${courseId}`; }
  teacherName(teacherId: any): string { return this.teachers.find(t => t.userId == teacherId)?.name || `Teacher ${teacherId}`; }
  gradeStudentCount(grade: string): number { return this.students.filter(s => s.gradeLevel === grade).length; }

  toggleDay(day: string, picker: { days: string[] }): void {
    const i = picker.days.indexOf(day);
    i === -1 ? picker.days.push(day) : picker.days.splice(i, 1);
  }

  buildSchedule(picker: { startDate: string; days: string[]; startTime: string; endTime: string }): string {
    const days = picker.days.join('/');
    const fmt = (t: string) => { if (!t) return ''; const [h, m] = t.split(':'); const hr = +h; return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`; };
    const time = picker.startTime && picker.endTime ? ` ${fmt(picker.startTime)}-${fmt(picker.endTime)}` : '';
    const date = picker.startDate ? ` (from ${picker.startDate})` : '';
    return `${days}${time}${date}`.trim();
  }

  resetForm(): void {
    this.editId = null;
    this.form = { title: '', subject: '', gradeLevel: '', credits: 0, status: 'ACTIVE', teacherId: '', autoEnroll: true };
    this.schedPicker = { startDate: '', days: [], startTime: '', endTime: '' };
  }

  resetClassForm(): void {
    this.classForm = { courseId: '', teacherId: '', status: 'ACTIVE' };
    this.classPicker = { startDate: '', days: [], startTime: '', endTime: '' };
  }

  edit(c: any): void {
    this.editId = c.courseId;
    this.form = { title: c.title, subject: c.subject, gradeLevel: c.gradeLevel, credits: c.credits, status: c.status };
    this.showModal = true;
  }

  save(): void {
    const { teacherId, autoEnroll, ...courseData } = this.form;
    const title = (courseData.title || '').toString().trim();
    const gradeLevel = (courseData.gradeLevel || '').toString().trim();
    if (!title) { this.toast.show('Title is required', 'error'); return; }
    if (!gradeLevel) { this.toast.show('Grade Level is required', 'error'); return; }
    courseData.title = title;
    courseData.gradeLevel = gradeLevel;
    courseData.credits = +courseData.credits || 0;
    const obs = this.editId ? this.api.updateCourse(this.editId, courseData) : this.api.createCourse(courseData);
    obs.subscribe({
      next: (course: any) => {
        this.showModal = false;
        if (!this.editId && teacherId) {
          const schedule = this.buildSchedule(this.schedPicker);
          this.api.createClass({ courseId: course.courseId, teacherId: +teacherId, schedule, status: 'ACTIVE' }).subscribe({
            next: (cls: any) => {
              this.toast.show('Course created and teacher assigned', 'success');
              if (course.gradeLevel) {
                this.autoEnrollByGrade(course.courseId, cls.classId, +teacherId, course.gradeLevel);
              }
              this.load();
            },
            error: () => { this.toast.show('Course created but teacher assignment failed', 'error'); this.load(); }
          });
        } else {
          this.toast.show(this.editId ? 'Course updated' : 'Course created', 'success');
          this.load();
        }
      },
      error: () => this.toast.show('Operation failed', 'error')
    });
  }

  autoEnrollByGrade(courseId: number, classId: number, teacherId: number, grade: string): void {
    this.api.enrollByGrade(courseId, classId, teacherId, grade).subscribe({
      next: (enrolled: any[]) => {
        if (enrolled.length > 0)
          this.toast.show(`${enrolled.length} student(s) from ${grade} enrolled successfully`, 'success');
        else
          this.toast.show(`No new students to enroll in ${grade} (already enrolled or none found)`, 'error');
      },
      error: () => this.toast.show(`Auto-enrollment failed for ${grade}`, 'error')
    });
  }

  delete(id: number): void {
    this.api.deleteCourse(id).subscribe({
      next: () => { this.toast.show('Course deleted', 'success'); this.load(); },
      error: () => this.toast.show('Delete failed', 'error')
    });
  }

  saveClass(): void {
    if (!this.classForm.courseId || !this.classForm.teacherId) { this.toast.show('Course and Teacher are required', 'error'); return; }
    const schedule = this.buildSchedule(this.classPicker);
    this.api.createClass({ courseId: +this.classForm.courseId, teacherId: +this.classForm.teacherId, schedule, status: this.classForm.status || 'ACTIVE' }).subscribe({
      next: (cls: any) => {
        this.toast.show('Class created', 'success');
        this.showClassModal = false;
        // auto-enroll all students of this course's grade
        const course = this.courses.find(c => c.courseId == this.classForm.courseId);
        if (course?.gradeLevel) {
          this.autoEnrollByGrade(cls.courseId, cls.classId, +this.classForm.teacherId, course.gradeLevel);
        }
        this.load();
      },
      error: () => this.toast.show('Failed to create class', 'error')
    });
  }

  updateClass(cl: any): void {
    this.api.updateClass(cl.classId, { courseId: +cl.courseId, teacherId: +cl.teacherId, schedule: cl.schedule, status: cl.status }).subscribe({
      next: () => this.toast.show('Teacher assigned', 'success'),
      error: () => this.toast.show('Failed to assign teacher', 'error')
    });
  }

  deleteClass(id: number): void {
    this.api.deleteClass(id).subscribe({
      next: () => { this.toast.show('Class deleted', 'success'); this.load(); },
      error: () => this.toast.show('Failed', 'error')
    });
  }
}
