import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-courses.component.html'
})
export class StudentCoursesComponent implements OnInit {
  enrolledCourses: any[] = [];
  materials: any[] = [];
  expanded: Record<number, boolean> = {};
  completed: Record<number, boolean> = {};
  studentId: number | null = null;

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('completed_materials');
    if (saved) this.completed = JSON.parse(saved);

    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      forkJoin({
        enrollments: this.api.getMyEnrollments().pipe(catchError(() => of([]))),
        courses: this.api.getCourses().pipe(catchError(() => of([]))),
        classes: this.api.getClasses().pipe(catchError(() => of([]))),
        materials: this.api.getMaterials().pipe(catchError(() => of([]))),
        users: this.auth.getUsers().pipe(catchError(() => of([]))),
      }).subscribe(d => {
        this.materials = d.materials;
        const allCourses = d.courses as any[];
        const teachers = (d.users as any[]).filter((u: any) => u.role === 'TEACHER');

        console.log('Enrollments:', d.enrollments);
        console.log('Courses:', allCourses);
        console.log('Teachers:', teachers);

        this.enrolledCourses = (d.enrollments as any[])
          .filter(e => e.status?.toUpperCase() === 'ACTIVE')
          .map(enrollment => {
            const course = allCourses.find(c => c.courseId === enrollment.courseId);
            const teacher = teachers.find((t: any) => t.userId == enrollment.teacherId);
            return { enrollment, course, teacherName: teacher?.name || '—' };
          })
          .filter(item => !!item.course);

        this.cdr.detectChanges();
      });
    });
  }

  toggleMaterials(courseId: number): void { this.expanded[courseId] = !this.expanded[courseId]; }
  getMaterials(courseId: number): any[] { return this.materials.filter(m => m.courseId === courseId); }

  markComplete(materialId: number): void {
    this.completed[materialId] = true;
    localStorage.setItem('completed_materials', JSON.stringify(this.completed));
    this.toast.show('Material marked as completed!', 'success');
    this.cdr.detectChanges();
  }
}
