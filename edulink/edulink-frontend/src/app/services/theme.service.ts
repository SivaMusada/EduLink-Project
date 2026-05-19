import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private dark = false;

  constructor() {
    const saved = localStorage.getItem('theme');
    this.dark = saved === 'dark';
    this.apply();
  }

  toggle(): void {
    this.dark = !this.dark;
    localStorage.setItem('theme', this.dark ? 'dark' : 'light');
    this.apply();
  }

  isDark(): boolean { return this.dark; }

  private apply(): void {
    document.documentElement.setAttribute('data-theme', this.dark ? 'dark' : 'light');
  }
}
