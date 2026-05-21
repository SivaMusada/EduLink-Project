import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-grades.component.html'
})
export class StudentGradesComponent implements OnInit {
  grades: any[] = [];
  exams: any[] = [];
  courses: any[] = [];
  metrics: any[] = [];
  gradeBreakdown: any[] = [];
  subjectPerformance: any[] = [];
  passed = 0;
  avgScore = 0;
  bestGrade = '—';

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.api.getMyStudent().pipe(catchError(() => of(null))).subscribe((student: any) => {
        const studentId = student?.studentId;
        const grades$ = studentId
          ? this.api.getGradesByStudent(studentId).pipe(catchError(() => of([])))
          : this.api.getGrades().pipe(catchError(() => of([])));
        forkJoin({
          grades: grades$,
          exams: this.api.getExams().pipe(catchError(() => of([]))),
          courses: this.api.getCourses().pipe(catchError(() => of([]))),
          metrics: this.api.getPerformance().pipe(catchError(() => of([]))),
        }).subscribe(d => {
          this.grades = d.grades;
          this.exams = d.exams;
          this.courses = d.courses;
          this.metrics = d.metrics;
          this.compute();
          this.cdr.detectChanges();
        });
      });
    });
  }

  compute(): void {
    this.passed = this.grades.filter(g => g.grade && g.grade !== 'F').length;
    this.avgScore = this.grades.length ? Math.round(this.grades.reduce((a, g) => a + g.score, 0) / this.grades.length) : 0;
    const sorted = [...this.grades].sort((a, b) => b.score - a.score);
    this.bestGrade = sorted[0]?.grade || '—';

    const gc: Record<string, number> = {};
    this.grades.forEach(g => { gc[g.grade] = (gc[g.grade] || 0) + 1; });
    const colors: Record<string, string> = { A: '#10b981', B: '#4f46e5', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
    this.gradeBreakdown = Object.entries(gc).map(([grade, count]) => ({
      grade, count, pct: this.grades.length ? Math.round((count / this.grades.length) * 100) : 0, color: colors[grade] || '#adb5bd'
    })).sort((a, b) => a.grade.localeCompare(b.grade));

    const subMap: Record<string, number[]> = {};
    this.grades.forEach(g => {
      const exam = this.exams.find(e => e.examId === g.examId);
      if (exam) {
        const course = this.courses.find(c => c.courseId === exam.courseId);
        const subj = course?.subject || `Course ${exam.courseId}`;
        if (!subMap[subj]) subMap[subj] = [];
        subMap[subj].push(g.score);
      }
    });
    this.subjectPerformance = Object.entries(subMap).map(([subject, scores]) => ({
      subject, avg: Math.round(scores.reduce((a, s) => a + s, 0) / scores.length)
    })).sort((a, b) => b.avg - a.avg);
  }

  examCourse(examId: number): string {
    const exam = this.exams.find(e => e.examId === examId);
    if (!exam) return '—';
    return this.courses.find(c => c.courseId === exam.courseId)?.title || `Course ${exam.courseId}`;
  }

  gradeBadge(g: string): string {
    const map: any = { A: 'bg-success', B: 'bg-primary', C: 'bg-warning text-dark', D: 'bg-orange', F: 'bg-danger' };
    return map[g] || 'bg-secondary';
  }

  competencyLabel(s: number): string { if (s >= 85) return 'Expert'; if (s >= 70) return 'Proficient'; if (s >= 50) return 'Developing'; return 'Beginner'; }
  competencyBadge(s: number): string { if (s >= 85) return 'bg-success'; if (s >= 70) return 'bg-primary'; if (s >= 50) return 'bg-warning text-dark'; return 'bg-danger'; }

  downloadReportCard(): void {
    const rows = this.grades.map(g => `${g.examId},${this.examCourse(g.examId)},${g.score},${g.grade},${g.status}`).join('\n');
    const csv = `Exam ID,Course,Score,Grade,Status\n${rows}\n\nAverage Score,${this.avgScore}%\nPassed,${this.passed}\nTotal,${this.grades.length}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report_card_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }
}
