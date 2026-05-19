import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse, LoginRequest, RegisterRequest, StudentRegistrationRequest, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = '/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('email', res.email);
        localStorage.setItem('name', res.name || '');
      })
    );
  }

  register(req: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/register`, req);
  }

  registerStudent(req: StudentRegistrationRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/register/student`, req);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  getRole(): string | null { return localStorage.getItem('role'); }
  getEmail(): string | null { return localStorage.getItem('email'); }
  getName(): string | null { return localStorage.getItem('name'); }
  isLoggedIn(): boolean { return !!this.getToken(); }

  getMe(): Observable<User> { return this.http.get<User>(`${this.base}/me`); }
  updateMe(data: any): Observable<User> { return this.http.put<User>(`${this.base}/me`, data); }
  getUsers(): Observable<User[]> { return this.http.get<User[]>(`${this.base}/users`); }
  getUserById(id: number): Observable<User> { return this.http.get<User>(`${this.base}/users/${id}`); }
  updateUser(id: number, data: any): Observable<User> { return this.http.put<User>(`${this.base}/users/${id}`, data); }
  updatePassword(id: number, newPassword: string): Observable<any> { return this.http.put<any>(`${this.base}/users/${id}/password`, { newPassword }); }
  deleteUser(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/users/${id}`); }
  getAuditLogs(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/audit-logs`); }

  getPendingStudents(): Observable<User[]> { return this.http.get<User[]>(`${this.base}/students/pending`); }
  getAllStudentRegistrations(): Observable<User[]> { return this.http.get<User[]>(`${this.base}/students/all`); }
  getStudentWithFiles(id: number): Observable<User> { return this.http.get<User>(`${this.base}/students/${id}/details`); }
  approveStudent(id: number, status: string): Observable<User> {
    return this.http.put<User>(`${this.base}/students/${id}/approve`, { status });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(email: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.base}/reset-password`, { email, newPassword });
  }
}
