import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-exams.component.html'
})
export class StudentExamsComponent implements OnInit {
  myQuizzes: any[] = [];
  myGrades: any[] = [];
  activeQuiz: any = null;
  quizResult: any = null;
  answers: Record<number, number> = {};
  currentQ = 0;
  myGrade = '';
  studentId = 0;
  userId = 0;
  avgScore = 0;
  loading = true;
  submitting = false;

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.myGrade = (user as any).gradeLevel || '';
      this.userId = user.userId;
      this.api.getMyStudent().pipe(catchError(() => of(null))).subscribe((student: any) => {
        if (student?.studentId) {
          this.studentId = student.studentId;
          this.loadData();
        } else {
          this.api.getMyEnrollments().pipe(catchError(() => of([]))).subscribe((enrollments: any[]) => {
            this.studentId = enrollments.length > 0 && enrollments[0].studentId
              ? enrollments[0].studentId : this.userId;
            this.loadData();
          });
        }
      });
    });
  }

  loadData(): void {
    this.loading = true;
    const exams$ = this.myGrade
      ? this.api.getExamsByGrade(this.myGrade).pipe(catchError(() => of([])))
      : this.api.getExams().pipe(catchError(() => of([])));

    forkJoin({
      exams: exams$,
      grades: this.api.getGradesByStudent(this.studentId).pipe(catchError(() => of([])))
    }).subscribe(({ exams, grades }) => {
      this.myQuizzes = (exams as any[])
        .filter(e => e.type === 'QUIZ' && e.questions)
        .map(e => {
          try {
            const parsed = JSON.parse(e.questions);
            return { examId: e.examId, title: parsed.title || 'Quiz', date: e.date, questions: parsed.items || [] };
          } catch { return null; }
        })
        .filter(Boolean);

      this.myGrades = grades as any[];
      this.calcStats();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  calcStats(): void {
    const attempted = this.myGrades.filter(g => this.myQuizzes.some(q => q.examId === g.examId));
    this.avgScore = attempted.length
      ? Math.round(attempted.reduce((sum: number, g: any) => {
          const quiz = this.myQuizzes.find(q => q.examId === g.examId);
          return sum + this.pct(g.score, quiz ? quiz.questions.length * 10 : 1);
        }, 0) / attempted.length)
      : 0;
  }

  getMyGrade(examId: number): any {
    return this.myGrades.find(g => g.examId === examId) || null;
  }

  startQuiz(quiz: any): void {
    this.activeQuiz = quiz;
    this.answers = {};
    this.currentQ = 0;
    this.cdr.detectChanges();
  }

  cancelQuiz(): void { this.activeQuiz = null; this.cdr.detectChanges(); }
  selectAnswer(j: number): void { this.answers[this.currentQ] = j; this.cdr.detectChanges(); }
  nextQ(): void { if (this.currentQ < this.activeQuiz.questions.length - 1) this.currentQ++; }
  prevQ(): void { if (this.currentQ > 0) this.currentQ--; }

  submitQuiz(): void {
    const unanswered = this.activeQuiz.questions.filter((_: any, i: number) => this.answers[i] === undefined).length;
    if (unanswered > 0 && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;

    let correct = 0;
    this.activeQuiz.questions.forEach((q: any, i: number) => {
      if (this.answers[i] === q.correct) correct++;
    });

    const total = this.activeQuiz.questions.length;
    const score = correct * 10;
    const maxScore = total * 10;
    const percentage = this.pct(score, maxScore);
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';

    this.submitting = true;

    this.api.submitQuiz({
      examId: this.activeQuiz.examId,
      studentId: this.studentId,
      answers: JSON.stringify(this.answers)
    }).pipe(catchError(() => of(null))).subscribe(() => {
      this.api.createGrade({
        examId: this.activeQuiz.examId,
        studentId: this.studentId,
        score,
        grade,
        status: 'PUBLISHED'
      }).subscribe({
        next: (saved: any) => {
          this.myGrades.push(saved);
          this.quizResult = {
            title: this.activeQuiz.title,
            score, total: maxScore, pct: percentage, grade,
            answers: { ...this.answers },
            questions: this.activeQuiz.questions
          };
          this.activeQuiz = null;
          this.submitting = false;
          this.calcStats();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toast.show('Failed to save result. Please try again.', 'error');
          this.submitting = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  showResult(quiz: any): void {
    const gr = this.getMyGrade(quiz.examId);
    if (!gr) return;
    this.quizResult = {
      title: quiz.title,
      score: gr.score,
      total: quiz.questions.length * 10,
      pct: this.pct(gr.score, quiz.questions.length * 10),
      grade: gr.grade,
      answers: {},
      questions: quiz.questions
    };
    this.cdr.detectChanges();
  }

  pct(score: number, max: number): number { return max ? Math.round((score / max) * 100) : 0; }
}
