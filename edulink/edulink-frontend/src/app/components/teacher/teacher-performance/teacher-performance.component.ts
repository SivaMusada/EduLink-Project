import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-teacher-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-performance.component.html'
})
export class TeacherPerformanceComponent implements OnInit {
  metrics: any[] = [];
  filtered: any[] = [];
  courses: any[] = [];
  allStudents: any[] = [];
  courseSummary: any[] = [];
  filterCourse = '';
  filterLevel = '';
  filterMetric = '';
  classAvg = 0; topPerformers = 0;

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getClasses().pipe(catchError(() => of([]))).subscribe(allClasses => {
        const myCourseIds = [...new Set((allClasses as any[]).filter(cl => cl.teacherId == user.userId).map((cl: any) => cl.courseId))];
        forkJoin({
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
          exams: this.api.getExams().pipe(catchError(() => of([]))),
          grades: this.api.getGrades().pipe(catchError(() => of([]))),
          students: this.api.getStudents().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          this.courses = (d.courses as any[]).filter(c => myCourseIds.includes(c.courseId));
          this.allStudents = d.students as any[];

          const myExams = (d.exams as any[]).filter(e => myCourseIds.includes(e.courseId));
          const myExamIds = new Set(myExams.map((e: any) => e.examId));
          const examCourseMap: Record<number, number> = {};
          myExams.forEach((e: any) => { examCourseMap[e.examId] = e.courseId; });

          this.metrics = (d.grades as any[])
            .filter(g => myExamIds.has(g.examId))
            .map(g => ({
              studentId: g.studentId,
              courseId: examCourseMap[g.examId],
              score: g.score,
              date: g.gradeId ? new Date().toISOString().split('T')[0] : '',
              grade: g.grade,
              status: g.status
            }));

          this.computeStats();
          this.applyFilter();
          this.cdr.detectChanges();
        });
      });
    });
  }

  computeStats(): void {
    this.classAvg = this.metrics.length ? Math.round(this.metrics.reduce((a, m) => a + m.score, 0) / this.metrics.length) : 0;
    this.topPerformers = this.metrics.filter(m => m.score >= 85).length;

    this.courseSummary = this.courses.map(c => {
      const cm = this.metrics.filter(m => m.courseId === c.courseId);
      return {
        title: c.title,
        count: cm.length,
        avg: cm.length ? Math.round(cm.reduce((a, m) => a + m.score, 0) / cm.length) : 0,
        top: cm.length ? Math.max(...cm.map(m => m.score)) : 0
      };
    });
  }

  applyFilter(): void {
    this.filtered = this.metrics.filter(m => {
      const mc = !this.filterCourse || m.courseId === +this.filterCourse;
      const ml = !this.filterLevel ||
        (this.filterLevel === 'expert' && m.score >= 85) ||
        (this.filterLevel === 'proficient' && m.score >= 70 && m.score < 85) ||
        (this.filterLevel === 'developing' && m.score >= 50 && m.score < 70) ||
        (this.filterLevel === 'beginner' && m.score < 50);
      const mm = !this.filterMetric ||
        (this.filterMetric === 'above_avg' && m.score >= this.classAvg) ||
        (this.filterMetric === 'below_avg' && m.score < this.classAvg) ||
        (this.filterMetric === 'improving' && m.score >= 85) ||
        (this.filterMetric === 'at_risk' && m.score < 50);
      return mc && ml && mm;
    });
  }

  courseName(id: number): string { return this.courses.find(c => c.courseId === id)?.title || `Course ${id}`; }
  levelColor(s: number): string { if (s >= 85) return '#10b981'; if (s >= 70) return '#4f46e5'; if (s >= 50) return '#f59e0b'; return '#ef4444'; }
  competencyLabel(s: number): string { if (s >= 85) return 'Expert'; if (s >= 70) return 'Proficient'; if (s >= 50) return 'Developing'; return 'Beginner'; }
  competencyBadge(s: number): string { if (s >= 85) return 'bg-success'; if (s >= 70) return 'bg-primary'; if (s >= 50) return 'bg-warning text-dark'; return 'bg-danger'; }

}
