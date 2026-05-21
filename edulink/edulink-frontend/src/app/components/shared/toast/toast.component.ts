import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html'
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
