import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-teacher-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="section-title mb-1">Exams & Quizzes</h2>
          <p class="text-muted small mb-0">Create MCQ quizzes for your grade students</p>
        </div>
        <button class="btn-accent" (click)="openCreate()" *ngIf="!showBuilder">+ Create Quiz</button>
      </div>

      <!-- Quiz List -->
      <div *ngIf="!showBuilder && !selectedQuiz">
        <div *ngIf="quizzes.length===0" class="text-center py-5">
          <div style="font-size:3rem">📝</div>
          <h5 class="mt-3" style="color:var(--text-primary)">No quizzes created yet</h5>
          <p class="text-muted">Click "+ Create Quiz" to build your first MCQ quiz</p>
        </div>
        <div class="row g-3">
          <div class="col-md-6 col-lg-4" *ngFor="let q of quizzes">
            <div class="card p-4 h-100" style="border-left:4px solid var(--accent)">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div class="fw-bold" style="color:var(--text-primary)">{{ q.title }}</div>
                  <div class="text-muted small">Exam: {{ q.date }}</div>
                  <div class="text-muted small" *ngIf="q.deadline">Deadline: {{ q.deadline | date:'dd MMM yyyy, hh:mm a' }}</div>
                </div>
                <span class="badge bg-info text-dark">{{ q.gradeLevel }}</span>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-4">
                  <div class="p-2 rounded text-center" style="background:var(--bg-secondary)">
                    <div class="small text-muted">Questions</div>
                    <div class="fw-bold" style="color:var(--text-primary)">{{ questionCount(q) }}</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="p-2 rounded text-center" style="background:var(--bg-secondary)">
                    <div class="small text-muted">Marks</div>
                    <div class="fw-bold" style="color:var(--text-primary)">{{ questionCount(q) * 10 }}</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="p-2 rounded text-center" style="background:var(--bg-secondary)">
                    <div class="small text-muted">Status</div>
                    <div class="fw-bold small" [ngClass]="computeStatus(q)==='SCHEDULED'?'text-warning':'text-success'">{{ computeStatus(q) }}</div>
                  </div>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary flex-grow-1" (click)="viewResults(q)">📊 Results</button>
                <button class="btn btn-sm btn-outline-danger" (click)="deleteQuiz(q.examId)">Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Panel -->
      <div *ngIf="selectedQuiz && !showBuilder">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0" style="color:var(--text-primary)">Results — {{ selectedQuiz.title }}</h5>
          <button class="btn btn-sm btn-outline-secondary" (click)="selectedQuiz=null">← Back</button>
        </div>
        <div class="table-wrapper">
          <table class="table table-hover mb-0">
            <thead><tr><th>Student ID</th><th>Score</th><th>Percentage</th><th>Grade</th><th>Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let g of selectedResults">
                <td>{{ g.studentId }}</td>
                <td>{{ g.score }} / {{ questionCount(selectedQuiz) * 10 }}</td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height:6px;max-width:80px">
                      <div class="progress-bar" [style.width]="pct(g.score, questionCount(selectedQuiz)*10)+'%'"
                        [ngClass]="pct(g.score,questionCount(selectedQuiz)*10)>=60?'bg-success':'bg-danger'"></div>
                    </div>
                    <span>{{ pct(g.score, questionCount(selectedQuiz)*10) }}%</span>
                  </div>
                </td>
                <td><span class="badge" [ngClass]="gradeBadge(g.grade)">{{ g.grade }}</span></td>
                <td><span class="badge" [ngClass]="g.status==='PASS'?'bg-success':'bg-danger'">{{ g.status }}</span></td>
              </tr>
              <tr *ngIf="selectedResults.length===0">
                <td colspan="5" class="text-center text-muted py-3">No attempts yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quiz Builder -->
      <div *ngIf="showBuilder" class="card p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-bold mb-0" style="color:var(--text-primary)">Build MCQ Quiz</h5>
          <button class="btn btn-sm btn-outline-secondary" (click)="showBuilder=false">Cancel</button>
        </div>

        <div class="row g-3 mb-4 p-3 rounded" style="background:var(--bg-secondary)">
          <div class="col-md-3">
            <label class="form-label small fw-semibold">Quiz Title *</label>
            <input class="form-control" [(ngModel)]="builder.title" placeholder="e.g. Chapter 1 Quiz">
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Grade *</label>
            <select class="form-select" [(ngModel)]="builder.gradeLevel">
              <option value="">Select grade</option>
              <option *ngFor="let g of myGrades" [value]="g">{{ g }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Course</label>
            <select class="form-select" [(ngModel)]="builder.courseId">
              <option value="">Select</option>
              <option *ngFor="let c of myCourses" [value]="c.courseId">{{ c.title }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Exam Date *</label>
            <input type="date" class="form-control" [(ngModel)]="builder.date">
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Deadline Date *</label>
            <input type="date" class="form-control" [(ngModel)]="builder.deadlineDate">
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-semibold">Deadline Time *</label>
            <input type="time" class="form-control" [(ngModel)]="builder.deadlineTime">
          </div>
        </div>

        <div *ngFor="let q of builder.questions; let i = index; trackBy: trackByIndex" class="card p-3 mb-3" style="border-left:3px solid var(--accent)">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="fw-semibold" style="color:var(--accent)">Q{{ i+1 }} <span class="text-muted small fw-normal">(10 marks)</span></span>
            <button class="btn btn-sm btn-outline-danger" (click)="removeQuestion(i)" *ngIf="builder.questions.length > 1">✕</button>
          </div>
          <input class="form-control mb-3" [(ngModel)]="q.text" placeholder="Enter question...">
          <div class="row g-2 mb-1">
            <div class="col-md-6" *ngFor="let j of [0,1,2,3]">
              <div class="d-flex align-items-center gap-2 p-2 rounded"
                [ngStyle]="{'background': q.correct===j?'rgba(16,185,129,0.1)':'var(--bg-secondary)',
                             'border': '1px solid ' + (q.correct===j?'#10b981':'transparent')}">
                <input type="radio" [name]="'c'+i" [checked]="q.correct===j" (change)="q.correct=j" style="cursor:pointer">
                <span class="fw-semibold small" style="min-width:20px">{{ ['A','B','C','D'][j] }}.</span>
                <input class="form-control form-control-sm border-0" style="background:transparent"
                  [ngModel]="q.options[j]"
                  (ngModelChange)="q.options[j]=$event"
                  [placeholder]="'Option '+(j+1)">
                <span *ngIf="q.correct===j" style="color:#10b981">✓</span>
              </div>
            </div>
          </div>
          <div class="text-muted small mt-1">Select the radio button next to the correct answer</div>
        </div>

        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-outline-secondary" (click)="addQuestion()">+ Add Question</button>
          <button class="btn-accent ms-auto" (click)="saveQuiz()" [disabled]="saving">
            <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
            💾 Save Quiz
          </button>
        </div>
      </div>
    </div>
  `
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
        // fallback: if no courses assigned, show all active courses for grade selection
        if (this.myCourses.length === 0) {
          this.myCourses = (d.courses as any[]).filter(c => c.status === 'ACTIVE');
        }
        this.myGrades = [...new Set(this.myCourses.map((c: any) => c.gradeLevel).filter(Boolean))] as string[];
        // parse all QUIZ exams — extract title from questions JSON
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
