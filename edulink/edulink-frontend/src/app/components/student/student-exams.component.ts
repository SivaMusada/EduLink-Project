import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Taking Quiz View -->
      <div *ngIf="activeQuiz">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="section-title mb-1">{{ activeQuiz.title }}</h2>
            <p class="text-muted small mb-0">{{ activeQuiz.questions.length }} questions • {{ activeQuiz.questions.length * 10 }} marks</p>
          </div>
          <span class="badge bg-info text-dark px-3 py-2">Q {{ currentQ + 1 }} / {{ activeQuiz.questions.length }}</span>
        </div>

        <div class="progress mb-4" style="height:8px;border-radius:4px">
          <div class="progress-bar" style="background:var(--accent);border-radius:4px"
            [style.width]="((currentQ+1)/activeQuiz.questions.length*100)+'%'"></div>
        </div>

        <div class="card p-4 mb-4">
          <div class="fw-bold mb-4" style="color:var(--text-primary);font-size:1.1rem">
            {{ currentQ + 1 }}. {{ activeQuiz.questions[currentQ].text }}
          </div>
          <div class="d-flex flex-column gap-3">
            <div *ngFor="let opt of activeQuiz.questions[currentQ].options; let j = index"
              class="p-3 rounded d-flex align-items-center gap-3"
              style="cursor:pointer;border:2px solid"
              [ngStyle]="{
                'border-color': answers[currentQ]===j ? 'var(--accent)' : 'var(--border-color)',
                'background': answers[currentQ]===j ? 'rgba(79,70,229,0.08)' : 'var(--bg-secondary)'
              }"
              (click)="selectAnswer(j)">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style="width:32px;height:32px;min-width:32px;font-size:0.85rem"
                [ngStyle]="{
                  'background': answers[currentQ]===j ? 'var(--accent)' : 'var(--bg-secondary)',
                  'color': answers[currentQ]===j ? '#fff' : 'var(--text-primary)',
                  'border': '2px solid ' + (answers[currentQ]===j ? 'var(--accent)' : 'var(--border-color)')
                }">
                {{ ['A','B','C','D'][j] }}
              </div>
              <span style="color:var(--text-primary)">{{ opt }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-between">
          <button class="btn btn-outline-secondary" (click)="prevQ()" [disabled]="currentQ===0">‹ Previous</button>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary" (click)="cancelQuiz()">Cancel</button>
            <button class="btn btn-outline-primary" (click)="nextQ()" *ngIf="currentQ < activeQuiz.questions.length-1">Next ›</button>
            <button class="btn-accent" (click)="submitQuiz()" [disabled]="submitting">
              <span *ngIf="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Submit Quiz
            </button>
          </div>
        </div>

        <div class="card p-3 mt-4">
          <div class="small text-muted mb-2">Question Navigator</div>
          <div class="d-flex flex-wrap gap-2">
            <button *ngFor="let q of activeQuiz.questions; let i = index"
              class="btn btn-sm"
              [ngClass]="i===currentQ ? 'btn-primary' : answers[i]!==undefined ? 'btn-success' : 'btn-outline-secondary'"
              (click)="currentQ=i">{{ i+1 }}</button>
          </div>
        </div>
      </div>

      <!-- Result View -->
      <div *ngIf="quizResult && !activeQuiz">
        <div class="text-center py-4">
          <div style="font-size:4rem">{{ quizResult.pct >= 60 ? '🎉' : '📚' }}</div>
          <h3 class="fw-bold mt-3" style="color:var(--text-primary)">Quiz Completed!</h3>
          <p class="text-muted">{{ quizResult.title }}</p>
        </div>
        <div class="row g-3 mb-4 justify-content-center">
          <div class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-muted small mb-1">Score</div>
              <div class="fw-bold" style="font-size:1.8rem;color:var(--accent)">{{ quizResult.score }}/{{ quizResult.total }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-muted small mb-1">Percentage</div>
              <div class="fw-bold" style="font-size:1.8rem;" [ngStyle]="{'color': quizResult.pct>=60?'#10b981':'#ef4444'}">{{ quizResult.pct }}%</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-muted small mb-1">Grade</div>
              <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ quizResult.grade }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-muted small mb-1">Status</div>
              <div class="fw-bold" style="font-size:1.8rem;" [ngStyle]="{'color': quizResult.pct>=60?'#10b981':'#ef4444'}">{{ quizResult.pct>=60?'PASS':'FAIL' }}</div>
            </div>
          </div>
        </div>

        <div class="card p-4 mb-4">
          <h6 class="fw-bold mb-3" style="color:var(--text-primary)">Answer Review</h6>
          <div *ngFor="let q of quizResult.questions; let i = index" class="mb-4">
            <div class="d-flex align-items-start gap-2 mb-2">
              <span [ngStyle]="{'color': quizResult.answers[i]===q.correct?'#10b981':'#ef4444'}">
                {{ quizResult.answers[i]===q.correct ? '✓' : '✗' }}
              </span>
              <span class="fw-semibold" style="color:var(--text-primary)">{{ i+1 }}. {{ q.text }}</span>
            </div>
            <div class="row g-2 ms-3">
              <div class="col-md-6" *ngFor="let opt of q.options; let j = index">
                <div class="p-2 rounded small"
                  [ngStyle]="{
                    'background': j===q.correct ? 'rgba(16,185,129,0.1)' : (j===quizResult.answers[i] && j!==q.correct ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)'),
                    'color': j===q.correct ? '#10b981' : (j===quizResult.answers[i] && j!==q.correct ? '#ef4444' : 'var(--text-primary)')
                  }">
                  {{ ['A','B','C','D'][j] }}. {{ opt }}
                  <span *ngIf="j===q.correct"> ✓ Correct</span>
                  <span *ngIf="j===quizResult.answers[i] && j!==q.correct"> ✗ Your answer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn-accent w-100" (click)="quizResult=null">Back to Exams</button>
      </div>

      <!-- Exams List View -->
      <div *ngIf="!activeQuiz && !quizResult">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="section-title mb-1">My Exams & Quizzes</h2>
            <p class="text-muted small mb-0">Grade: {{ myGrade }}</p>
          </div>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-muted small mb-1">Available</div>
              <div class="fw-bold" style="font-size:1.8rem;color:var(--text-primary)">{{ myQuizzes.length }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-muted small mb-1">Attempted</div>
              <div class="fw-bold" style="font-size:1.8rem;color:#10b981">{{ myGrades.length }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-muted small mb-1">Pending</div>
              <div class="fw-bold" style="font-size:1.8rem;color:#f59e0b">{{ myQuizzes.length - myGrades.length }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card text-center">
              <div class="text-muted small mb-1">Avg Score</div>
              <div class="fw-bold" style="font-size:1.8rem;color:#4f46e5">{{ avgScore }}%</div>
            </div>
          </div>
        </div>

        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border" style="color:var(--accent)"></div>
          <p class="text-muted mt-2">Loading quizzes...</p>
        </div>

        <div *ngIf="!loading && myQuizzes.length===0" class="text-center py-5">
          <div style="font-size:3rem">📝</div>
          <h5 class="mt-3" style="color:var(--text-primary)">No quizzes available yet</h5>
          <p class="text-muted">Your teacher will assign quizzes for grade {{ myGrade }}. Check back later.</p>
        </div>

        <div class="row g-3">
          <div class="col-md-6 col-lg-4" *ngFor="let q of myQuizzes">
            <div class="card p-4 h-100" [style.border-left]="getMyGrade(q.examId) ? '4px solid #10b981' : '4px solid #f59e0b'">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div class="fw-bold" style="color:var(--text-primary)">{{ q.title }}</div>
                  <div class="text-muted small">{{ q.date | date:'mediumDate' }}</div>
                </div>
                <span class="badge" [ngClass]="getMyGrade(q.examId) ? 'bg-success' : 'bg-warning text-dark'">
                  {{ getMyGrade(q.examId) ? 'Completed' : 'Pending' }}
                </span>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <div class="p-2 rounded text-center" style="background:var(--bg-secondary)">
                    <div class="small text-muted">Questions</div>
                    <div class="fw-bold" style="color:var(--text-primary)">{{ q.questions.length }}</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-2 rounded text-center" style="background:var(--bg-secondary)">
                    <div class="small text-muted">Total Marks</div>
                    <div class="fw-bold" style="color:var(--text-primary)">{{ q.questions.length * 10 }}</div>
                  </div>
                </div>
              </div>

              <div *ngIf="getMyGrade(q.examId) as gr" class="p-2 rounded mb-3 text-center"
                [ngStyle]="{'background': gr.score/( q.questions.length*10)>=0.6 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}">
                <span class="fw-bold" [ngStyle]="{'color': gr.score/(q.questions.length*10)>=0.6 ? '#10b981' : '#ef4444'}">
                  Score: {{ gr.score }}/{{ q.questions.length*10 }} ({{ pct(gr.score, q.questions.length*10) }}%) — {{ gr.grade }}
                </span>
              </div>

              <button class="btn btn-sm w-100"
                [ngClass]="getMyGrade(q.examId) ? 'btn-outline-secondary' : 'btn-primary'"
                (click)="getMyGrade(q.examId) ? showResult(q) : startQuiz(q)">
                {{ getMyGrade(q.examId) ? '📊 View Result' : '▶ Start Quiz' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentExamsComponent implements OnInit {
  myQuizzes: any[] = [];
  myGrades: any[] = [];
  activeQuiz: any = null;
  quizResult: any = null;
  answers: Record<number, number> = {};
  currentQ = 0;
  myGrade = '';
  studentId = 0;   // real student-service studentId
  userId = 0;      // identity-service userId
  avgScore = 0;
  loading = true;
  submitting = false;

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.auth.getMe().pipe(catchError(() => of(null))).subscribe(user => {
      if (!user) return;
      this.myGrade = (user as any).gradeLevel || '';
      this.userId = user.userId;
      // Primary: GET /api/students/me (STUDENT-accessible, returns studentId directly)
      this.api.getMyStudent().pipe(catchError(() => of(null))).subscribe((student: any) => {
        if (student?.studentId) {
          this.studentId = student.studentId;
          this.loadData();
        } else {
          // Fallback: derive studentId from enrollments
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
    // if no gradeLevel, fetch all exams and filter by QUIZ type
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

    // Step 1: save submission record
    this.api.submitQuiz({
      examId: this.activeQuiz.examId,
      studentId: this.studentId,
      answers: JSON.stringify(this.answers)
    }).pipe(catchError(() => of(null))).subscribe(() => {
      // Step 2: save grade (submission saved regardless of grade save outcome)
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
