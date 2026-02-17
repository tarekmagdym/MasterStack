import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = environment.apiUrl; // e.g. 'https://api.masterstack.dev/api'

  constructor(private http: HttpClient) {}

  // ── Helpers ────────────────────────────────────────────────────

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  private buildParams(query?: Record<string, any>): HttpParams {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          params = params.set(key, String(val));
        }
      });
    }
    return params;
  }

  private handleError(error: any): Observable<never> {
    const message =
      error?.error?.message ||
      error?.message ||
      'An unexpected error occurred.';
    return throwError(() => ({ ...error, message }));
  }

  // ── Generic CRUD ───────────────────────────────────────────────

  get<T = any>(endpoint: string, query?: Record<string, any>): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params: this.buildParams(query)
      })
      .pipe(catchError(this.handleError));
  }

  post<T = any>(endpoint: string, body: any): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  put<T = any>(endpoint: string, body: any): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  patch<T = any>(endpoint: string, body?: any): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}${endpoint}`, body ?? {}, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  delete<T = any>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ── File / FormData upload ──────────────────────────────────────
  // Use for endpoints that accept multipart/form-data (images, files).
  // Content-Type is intentionally omitted so the browser sets the boundary.

  upload<T = any>(endpoint: string, formData: FormData): Observable<T> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  uploadPut<T = any>(endpoint: string, formData: FormData): Observable<T> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  // ── Dashboard ──────────────────────────────────────────────────

  getDashboardStats(): Observable<ApiResponse> {
    return this.get<ApiResponse>('/admin/stats');
  }

  // ── Projects ───────────────────────────────────────────────────

  getProjectsAdmin(page = 1, limit = 10): Observable<ApiResponse> {
    return this.get<ApiResponse>('/admin/projects', { page, limit });
  }

  createProject(data: FormData): Observable<ApiResponse> {
    return this.upload<ApiResponse>('/admin/projects', data);
  }

  updateProject(id: string, data: FormData): Observable<ApiResponse> {
    return this.uploadPut<ApiResponse>(`/admin/projects/${id}`, data);
  }

  deleteProject(id: string): Observable<ApiResponse> {
    return this.delete<ApiResponse>(`/admin/projects/${id}`);
  }

  // ── Services ───────────────────────────────────────────────────

  getServicesAdmin(page = 1, limit = 10): Observable<ApiResponse> {
    return this.get<ApiResponse>('/admin/services', { page, limit });
  }

  createService(data: any): Observable<ApiResponse> {
    return this.post<ApiResponse>('/admin/services', data);
  }

  updateService(id: string, data: any): Observable<ApiResponse> {
    return this.put<ApiResponse>(`/admin/services/${id}`, data);
  }

  deleteService(id: string): Observable<ApiResponse> {
    return this.delete<ApiResponse>(`/admin/services/${id}`);
  }

  // ── Technologies ───────────────────────────────────────────────

  getTechnologiesAdmin(page = 1, limit = 10): Observable<ApiResponse> {
    return this.get<ApiResponse>('/admin/technologies', { page, limit });
  }

  createTechnology(data: FormData): Observable<ApiResponse> {
    return this.upload<ApiResponse>('/admin/technologies', data);
  }

  updateTechnology(id: string, data: FormData): Observable<ApiResponse> {
    return this.uploadPut<ApiResponse>(`/admin/technologies/${id}`, data);
  }

  deleteTechnology(id: string): Observable<ApiResponse> {
    return this.delete<ApiResponse>(`/admin/technologies/${id}`);
  }

  // ── Team Members ───────────────────────────────────────────────

  getTeamAdmin(page = 1, limit = 10): Observable<ApiResponse> {
    return this.get<ApiResponse>('/admin/team', { page, limit });
  }

  createTeamMember(data: FormData): Observable<ApiResponse> {
    return this.upload<ApiResponse>('/admin/team', data);
  }

  updateTeamMember(id: string, data: FormData): Observable<ApiResponse> {
    return this.uploadPut<ApiResponse>(`/admin/team/${id}`, data);
  }

  deleteTeamMember(id: string): Observable<ApiResponse> {
    return this.delete<ApiResponse>(`/admin/team/${id}`);
  }

  // ── Contact Messages ───────────────────────────────────────────

  getMessages(page = 1, limit = 10): Observable<ApiResponse> {
    return this.get<ApiResponse>('/admin/messages', { page, limit });
  }

  getMessage(id: string): Observable<ApiResponse> {
    return this.get<ApiResponse>(`/admin/messages/${id}`);
  }

  toggleMessageRead(id: string): Observable<ApiResponse> {
    return this.patch<ApiResponse>(`/admin/messages/${id}/read`);
  }

  deleteMessage(id: string): Observable<ApiResponse> {
    return this.delete<ApiResponse>(`/admin/messages/${id}`);
  }

  // ── User Management (super_admin only) ─────────────────────────

  getUsers(): Observable<ApiResponse> {
    return this.get<ApiResponse>('/admin/users');
  }

  createUser(data: { name: string; email: string; password: string; role: 'admin' | 'employee' }): Observable<ApiResponse> {
    return this.post<ApiResponse>('/admin/users', data);
  }

  updateUser(id: string, data: Partial<{ name: string; email: string; role: string; isActive: boolean }>): Observable<ApiResponse> {
    return this.put<ApiResponse>(`/admin/users/${id}`, data);
  }

  deleteUser(id: string): Observable<ApiResponse> {
    return this.delete<ApiResponse>(`/admin/users/${id}`);
  }

  // ── Activity Logs (super_admin only) ───────────────────────────

  getActivityLogs(page = 1, limit = 50): Observable<ApiResponse> {
    return this.get<ApiResponse>('/admin/activity-logs', { page, limit });
  }
}