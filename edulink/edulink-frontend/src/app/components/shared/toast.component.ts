import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <div *ngFor="let t of toasts" class="toast show align-items-center text-white border-0 mb-2"
        [ngClass]="bgClass(t.type)">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <span>{{ icon(t.type) }}</span>
            {{ t.message }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toast$.subscribe(t => {
      this.toasts.push(t);
      setTimeout(() => this.toasts.shift(), 3500);
    });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  bgClass(type: string): string {
    const map: any = { success: 'bg-success', error: 'bg-danger', info: 'bg-primary', warning: 'bg-warning text-dark' };
    return map[type] || 'bg-secondary';
  }

  icon(type: string): string {
    const map: any = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    return map[type] || '';
  }
}
