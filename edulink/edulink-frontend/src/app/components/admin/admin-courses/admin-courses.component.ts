import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-courses.component.html'
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
