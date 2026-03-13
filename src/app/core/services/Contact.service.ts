import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  readBy?: { _id: string; name: string; email: string };
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessagesResponse {
  success: boolean;
  data: ContactMessage[];
  unreadCount: number;
  pagination: { total: number; page: number; limit: number; pages: number };
}

export interface ContactMessageResponse {
  success: boolean;
  data: ContactMessage;
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function stringToColor(str: string): string {
  const palette = ['#0e3581', '#26cabc', '#7c3aed', '#f59e0b', '#ef4444', '#16a34a'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');
}

export function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60)         return 'Just now';
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ContactService {

  constructor(private http: HttpClient) {}

  // Public — submit contact form
  submitContact(payload: {
    name: string; email: string; phone?: string; subject: string; message: string;
  }): Observable<{ success: boolean; message: string; data: { _id: string } }> {
    return this.http.post<{ success: boolean; message: string; data: { _id: string } }>(
      API_ENDPOINTS.CONTACT.SUBMIT, payload
    );
  }

  // Admin — reply to a message by email
  replyToMessage(id: string, replyText: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.CONTACT.ADMIN_REPLY(id),
      { replyText }
    );
  }

  // Admin — get all messages
  getMessages(filters: ContactFilters = {}): Observable<ContactMessagesResponse> {
    let params = new HttpParams();
    if (filters.page)                params = params.set('page',   String(filters.page));
    if (filters.limit)               params = params.set('limit',  String(filters.limit));
    if (filters.isRead !== undefined) params = params.set('isRead', String(filters.isRead));
    return this.http.get<ContactMessagesResponse>(API_ENDPOINTS.CONTACT.ADMIN_GET_ALL, { params });
  }

  // Admin — get single message
  getMessage(id: string): Observable<ContactMessageResponse> {
    return this.http.get<ContactMessageResponse>(API_ENDPOINTS.CONTACT.ADMIN_GET_BY_ID(id));
  }

  // Admin — toggle read/unread
  toggleRead(id: string): Observable<ContactMessageResponse> {
    return this.http.patch<ContactMessageResponse>(API_ENDPOINTS.CONTACT.ADMIN_TOGGLE_READ(id), {});
  }

  // Admin — delete message
  deleteMessage(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(API_ENDPOINTS.CONTACT.ADMIN_DELETE(id));
  }
}