import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ActivityLogUser {
  _id:   string;
  name:  string;
  email: string;
  role:  string;
}

export interface ActivityLog {
  _id:           string;
  user:          ActivityLogUser;
  action:        'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'MARK_READ';
  resourceType:  'Project' | 'Service' | 'Technology' | 'TeamMember' | 'ContactMessage' | 'User' | 'Auth';
  resourceId?:   string;
  resourceTitle?: string;
  details?:      any;
  ipAddress?:    string;
  createdAt:     string;
}

export interface ActivityLogPagination {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

export interface ActivityLogResponse {
  success:    boolean;
  data:       ActivityLog[];
  pagination: ActivityLogPagination;
}

export interface ActivityLogFilters {
  page?:         number;
  limit?:        number;
  action?:       string;
  resourceType?: string;
  search?:       string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function actionToType(action: string): 'auth' | 'create' | 'update' | 'delete' | 'view' {
  switch (action) {
    case 'LOGIN':
    case 'LOGOUT':    return 'auth';
    case 'CREATE':    return 'create';
    case 'UPDATE':
    case 'MARK_READ': return 'update';
    case 'DELETE':    return 'delete';
    default:          return 'view';
  }
}

export function stringToColor(str: string): string {
  const palette = ['#0e3581', '#26cabc', '#e67e22', '#8e44ad', '#c0392b', '#16a34a'];
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
  return new Date(isoDate).toLocaleDateString();
}

// ─── Action metadata ──────────────────────────────────────────────────────────

export const ACTION_META: Record<string, { icon: string; label: string; labelAr: string }> = {
  LOGIN: {
    label: 'User logged in', labelAr: 'تسجيل دخول مستخدم',
    icon: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke-width="2"/><polyline points="10 17 15 12 10 7" stroke-width="2"/><line x1="15" y1="12" x2="3" y2="12" stroke-width="2"/>',
  },
  LOGOUT: {
    label: 'User logged out', labelAr: 'تسجيل خروج مستخدم',
    icon: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-width="2"/><polyline points="16 17 21 12 16 7" stroke-width="2"/><line x1="21" y1="12" x2="9" y2="12" stroke-width="2"/>',
  },
  CREATE: {
    label: 'Record created', labelAr: 'تم إنشاء سجل',
    icon: '<line x1="12" y1="5" x2="12" y2="19" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>',
  },
  UPDATE: {
    label: 'Record updated', labelAr: 'تم تحديث سجل',
    icon: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2"/>',
  },
  MARK_READ: {
    label: 'Message marked as read', labelAr: 'تم تعليم رسالة كمقروءة',
    icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/>',
  },
  DELETE: {
    label: 'Record deleted', labelAr: 'تم حذف سجل',
    icon: '<polyline points="3 6 5 6 21 6" stroke-width="2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke-width="2"/>',
  },
  VIEW: {
    label: 'Record viewed', labelAr: 'تم عرض سجل',
    icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/>',
  },
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ActivityLogService {

  constructor(private http: HttpClient) {}

  getLogs(filters: ActivityLogFilters = {}): Observable<ActivityLogResponse> {
    let params = new HttpParams();
    if (filters.page)         params = params.set('page',         String(filters.page));
    if (filters.limit)        params = params.set('limit',        String(filters.limit));
    if (filters.action)       params = params.set('action',       filters.action);
    if (filters.resourceType) params = params.set('resourceType', filters.resourceType);
    if (filters.search)       params = params.set('search',       filters.search);

    return this.http.get<ActivityLogResponse>(API_ENDPOINTS.DASHBOARD.ACTIVITY_LOGS, { params });
  }

  /** Delete ALL activity logs — super_admin only */
  clearLogs(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.DASHBOARD.CLEAR_ACTIVITY_LOGS
    );
  }
}