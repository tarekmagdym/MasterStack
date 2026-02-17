import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError,throwError, BehaviorSubject } from 'rxjs';
import { API_ENDPOINTS, LoginPayload,ChangePasswordPayload } from '../constants/api-endpoints';

export interface AuthUser {
  _id:       string;
  name:      string;
  email:     string;
  role:      'super_admin' | 'admin' | 'employee';
  lastLogin?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user:  AuthUser;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?:   any;
}

const TOKEN_KEY = 'ms_token';
const USER_KEY  = 'ms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // Reactive current user — sidebar / navbar can subscribe to this
  private currentUser$ = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());

  constructor(
    private http:   HttpClient,
    private router: Router
  ) {}

  // ── Login ──────────────────────────────────────────────────
  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, payload)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.saveSession(res.data.token, res.data.user);
          }
        }),
        catchError((err) => throwError(() => err))
      );
  }

  // ── Logout ─────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/admin/login']);
  }

  // ── Get current user from API (refresh) ───────────────────
  fetchMe(): Observable<ApiResponse> {
    return this.http
      .get<ApiResponse>(API_ENDPOINTS.AUTH.ME)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.updateStoredUser(res.data);
          }
        }),
        catchError((err) => throwError(() => err))
      );
  }

  // ── Change password ────────────────────────────────────────
  changePassword(payload: ChangePasswordPayload): Observable<ApiResponse> {
    return this.http
      .put<ApiResponse>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload)
      .pipe(
        catchError((err) => throwError(() => err))
      );
  }

  // ── Session helpers ────────────────────────────────────────
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser$.getValue();
  }

  /** Observable stream — subscribe in components for reactivity */
  getUser$(): Observable<AuthUser | null> {
    return this.currentUser$.asObservable();
  }

  hasRole(...roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  isAdmin(): boolean {
    return this.hasRole('super_admin', 'admin');
  }

  // ── Private ────────────────────────────────────────────────
  private saveSession(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser$.next(user);
  }

  private updateStoredUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser$.next(user);
  }

  private getUserFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}