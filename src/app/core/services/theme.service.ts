import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkSubject = new BehaviorSubject<boolean>(false);
  isDark$ = this.darkSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    this.darkSubject.next(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggle() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      this.darkSubject.next(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      this.darkSubject.next(true);
    }
  }

  isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }
}