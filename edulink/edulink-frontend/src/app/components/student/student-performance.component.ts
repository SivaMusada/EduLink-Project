import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-student-performance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="section-title">My Performance & Competency</h2>
      <div class="row g-3">
        <div class="col-md-6" *ngFor="let m of metrics">
          <div class="card p-3">
            <div class="d-flex justify-content-between mb-2">
              <div>
                <div class="fw-semibold" style="color:var(--text-primary)">Course {{ m.courseId }}</div>
                <div class="text-muted small">{{ m.date }}</div>
              </div>
              <span class="badge" [ngClass]="badge(m.score)">{{ label(m.score) }}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-grow-1" style="height:10px">
                <div class="progress-bar" [style.width]="m.score+'%'" [ngClass]="color(m.score)"></div>
              </div>
              <span class="fw-bold" style="color:var(--text-primary)">{{ m.score }}%</span>
            </div>
            <div class="mt-2 p-2 rounded small" *ngIf="m.score < 60" style="background:rgba(239,68,68,0.1);color:#ef4444">
              ⚠️ Skill gap identified — consider additional practice
            </div>
          </div>
        </div>
        <div *ngIf="metrics.length===0" class="col-12 text-center text-muted py-5">No performance data available yet</div>
      </div>
    </div>
  `
})
export class StudentPerformanceComponent implements OnInit {
  metrics: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.api.getPerformance().subscribe(m => { this.metrics = m; this.cdr.detectChanges(); }); }

  label(s: number): string { if (s >= 85) return 'Expert'; if (s >= 70) return 'Proficient'; if (s >= 50) return 'Developing'; return 'Beginner'; }
  badge(s: number): string { if (s >= 85) return 'bg-success'; if (s >= 70) return 'bg-primary'; if (s >= 50) return 'bg-warning text-dark'; return 'bg-danger'; }
  color(s: number): string { if (s >= 70) return 'bg-success'; if (s >= 50) return 'bg-warning'; return 'bg-danger'; }
}
