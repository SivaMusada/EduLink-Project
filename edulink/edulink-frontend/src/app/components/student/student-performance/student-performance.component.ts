import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-student-performance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-performance.component.html'
})
export class StudentPerformanceComponent implements OnInit {
  metrics: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.api.getPerformance().subscribe(m => { this.metrics = m; this.cdr.detectChanges(); }); }

  label(s: number): string { if (s >= 85) return 'Expert'; if (s >= 70) return 'Proficient'; if (s >= 50) return 'Developing'; return 'Beginner'; }
  badge(s: number): string { if (s >= 85) return 'bg-success'; if (s >= 70) return 'bg-primary'; if (s >= 50) return 'bg-warning text-dark'; return 'bg-danger'; }
  color(s: number): string { if (s >= 70) return 'bg-success'; if (s >= 50) return 'bg-warning'; return 'bg-danger'; }
}
