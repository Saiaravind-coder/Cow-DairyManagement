import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://localhost:7088/api/Auth';

  constructor(private http: HttpClient, private router: Router) {}

  

  login(farmName: string, password: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
    FarmName: farmName,
    Password: password
  }).pipe(tap(res => this.saveSession(res)));
}

register(farmName: string, password: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
    FarmName: farmName,
    Password: password
  }).pipe(tap(res => this.saveSession(res)));
}

  private saveSession(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('farmName', res.farmName);
    localStorage.setItem('farmId', res.farmId.toString());
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getFarmName(): string {
    return localStorage.getItem('farmName') ?? '';
  }
}