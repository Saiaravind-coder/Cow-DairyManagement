import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styles: [`
    :host {
      display: block;
      position: relative;
      min-height: 100vh;
    }
  `]
})
export class LoginComponent {
  farmName = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.farmName || !this.password) {
      this.error = 'Please fill in all fields.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.login(this.farmName, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard/home']),
      error: (err) => {
        if (err.status === 401) {
          this.error = 'Invalid farm name or password.';
        } else if (err.status === 0) {
          this.error = 'Cannot connect to server. Make sure the API is running.';
        } else {
          this.error = 'Something went wrong. Please try again.';
        }
        this.loading = false;
      }
    });
  }
}