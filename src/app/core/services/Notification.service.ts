import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface BackendNotif {
  _id:          string;
  title:        string;
  titleAr:      string;
  message:      string;
  messageAr:    string;
  type:         'info' | 'success' | 'warning' | 'error';
  resourceType: string | null;
  resourceId:   string | null;
  recipient:    string | null;
  isRead:       boolean;
  createdBy:    { name: string } | null;
  createdAt:    string;
}

export interface NotifResponse {
  success:     boolean;
  data:        BackendNotif[];
  unreadCount: number;
  pagination: {
    total: number;
    page:  number;
    limit: number;
    pages: number;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  /** Get all notifications for the current user */
  getAll(page = 1, limit = 20, unreadOnly = false): Observable<NotifResponse> {
    let params = new HttpParams()
      .set('page',  String(page))
      .set('limit', String(limit));
    if (unreadOnly) params = params.set('unreadOnly', 'true');

    return this.http.get<NotifResponse>(
      API_ENDPOINTS.NOTIFICATIONS.GET_ALL,
      { headers: this.headers(), params }
    );
  }

  /** Get single notification (auto-marks as read) */
  getOne(id: string): Observable<{ success: boolean; data: BackendNotif }> {
    return this.http.get<{ success: boolean; data: BackendNotif }>(
      API_ENDPOINTS.NOTIFICATIONS.GET_BY_ID(id),
      { headers: this.headers() }
    );
  }

  /** Mark one notification as read */
  markAsRead(id: string): Observable<any> {
    return this.http.patch(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id),
      {},
      { headers: this.headers() }
    );
  }

  /** Mark all notifications as read */
  markAllAsRead(): Observable<any> {
    return this.http.patch(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
      {},
      { headers: this.headers() }
    );
  }

  /** Delete a single notification */
  delete(id: string): Observable<any> {
    return this.http.delete(
      API_ENDPOINTS.NOTIFICATIONS.DELETE(id),
      { headers: this.headers() }
    );
  }
}