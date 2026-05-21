import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-teacher-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-exams.component.html'
})
export class TeacherExamsComponent implements OnInit {
  quizzes: any[] = [];
  showBuilder = false;
  selectedQuiz: any = null;
  selectedResults: any[] = [];
  myCourses: any[] = [];
  myGrades: string[] = [];
  saving = false;
  builder: any = { title: '', gradeLevel: '', courseId: '', date: '', deadlineDate: '', deadlineTime: '23:59', questions: [] };

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      forkJoin({
        classes: this.api.getClasses().pipe(catchError(() => of([]))),
        courses: this.api.getCourses().pipe(catchError(() => of([]))),
        exams: this.api.getExams().pipe(catchError(() => of([]))),
      }).subscribe(d => {
        const myClasses = (d.classes as any[]).filter(cl => cl.teacherId == user.userId);
        const courseIds = [...new Set(myClasses.map((cl: any) => cl.courseId))];
        this.myCourses = (d.courses as any[]).filter(c => courseIds.includes(c.courseId));
        if (this.myCourses.length === 0) {
          this.myCourses = (d.courses as any[]).filter(c => c.status === 'ACTIVE');
        }
        this.myGrades = [...new Set(this.myCourses.map((c: any) => c.gradeLevel).filter(Boolean))] as string[];
        this.quizzes = (d.exams as any[])
          .filter(e => e.type === 'QUIZ' && e.questions)
          .map(e => {
            try {
              const parsed = JSON.parse(e.questions);
              return { ...e, title: parsed.title || 'Untitled Quiz', parsedItems: parsed.items || [] };
            } catch { return null; }
          })
          .filter(Boolean);
        this.cdr.detectChanges();
      });
    });
  }

  openCreate(): void {
    this.builder = {
      title: '', gradeLevel: this.myGrades[0] || '', courseId: this.myCourses[0]?.courseId || '',
      date: new Date().toISOString().split('T')[0],
      deadlineDate: '',
      deadlineTime: '23:59',
      questions: [this.newQuestion()]
    };
    this.showBuilder = true;
    this.selectedQuiz = null;
  }

  newQuestion(): any { return { text: '', options: ['', '', '', ''], correct: 0 }; }
  addQuestion(): void { this.builder.questions.push(this.newQuestion()); }
  removeQuestion(i: number): void { this.builder.questions.splice(i, 1); }
  trackByIndex(i: number): number { return i; }

  saveQuiz(): void {
    if (!this.builder.title || !this.builder.gradeLevel || !this.builder.date || !this.builder.deadlineDate || !this.builder.deadlineTime) {
      this.toast.show('Please fill Title, Grade, Exam Date, Deadline Date and Deadline Time', 'error'); return;
    }
    const deadlineDateTime = `${this.builder.deadlineDate}T${this.builder.deadlineTime}:00`;
    if (this.builder.deadlineDate < this.builder.date) {
      this.toast.show('Deadline must be on or after the exam date', 'error'); return;
    }
    if (this.builder.questions.some((q: any) => !q.text || q.options.some((o: string) => !o.trim()))) {
      this.toast.show('Please fill all question texts and options', 'error'); return;
    }
    this.saving = true;
    const payload = {
      courseId: this.builder.courseId || null,
      gradeLevel: this.builder.gradeLevel,
      type: 'QUIZ',
      date: this.builder.date,
      deadline: deadlineDateTime,
      status: 'SCHEDULED',
      questions: JSON.stringify({ title: this.builder.title, items: this.builder.questions })
    };
    this.api.createExam(payload).subscribe({
      next: () => {
        this.toast.show('Quiz saved to database', 'success');
        this.saving = false;
        this.showBuilder = false;
        this.ngOnInit();
      },
      error: () => { this.toast.show('Failed to save quiz', 'error'); this.saving = false; this.cdr.detectChanges(); }
    });
  }

  deleteQuiz(id: number): void {
    if (!confirm('Delete this quiz?')) return;
    this.api.deleteExam(id).subscribe({
      next: () => { this.toast.show('Quiz deleted', 'success'); this.quizzes = this.quizzes.filter(q => q.examId !== id); this.cdr.detectChanges(); },
      error: () => this.toast.show('Failed', 'error')
    });
  }

  viewResults(quiz: any): void {
    this.selectedQuiz = quiz;
    this.api.getGrades().pipe(catchError(() => of([]))).subscribe(grades => {
      this.selectedResults = (grades as any[]).filter(g => g.examId === quiz.examId);
      this.cdr.detectChanges();
    });
  }

  computeStatus(q: any): string {
    if (!q.deadline) return q.status;
    return new Date() > new Date(q.deadline) ? 'COMPLETED' : 'SCHEDULED';
  }

  questionCount(q: any): number { return q.parsedItems?.length || 0; }

  pct(score: number, max: number): number { return max ? Math.round((score / max) * 100) : 0; }

  gradeBadge(g: string): string {
    const m: any = { A: 'bg-success', B: 'bg-primary', C: 'bg-warning text-dark', F: 'bg-danger' };
    return m[g] || 'bg-secondary';
  }
}
