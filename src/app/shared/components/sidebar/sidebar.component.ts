import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  farmName = '';
  isDark = false;

  constructor(
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.farmName = localStorage.getItem('farmName') ?? 'My Farm';
    this.isDark = this.themeService.isDark();
  }

  toggleTheme() {
    this.themeService.toggle();
    this.isDark = this.themeService.isDark();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}