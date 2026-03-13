import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import API_ENDPOINTS, { ServicePayload } from '../constants/api-endpoints';

export interface I18nString { en: string; ar: string; }

export interface Service {
  _id:               string;
  title:             I18nString;
  description:       I18nString;
  shortDescription?: I18nString;
  icon:              string;
  features?:         string[];
  featuresAr?:       string[];      // ← Arabic features list
  isPublished:       boolean;
  isFeatured:        boolean;
  order:             number;
  createdBy?:        { name: string; email: string };
  updatedBy?:        { name: string; email: string };
  createdAt:         string;
  updatedAt:         string;
}

export interface ServicesResponse { success: boolean; data: Service[]; }
export interface ServiceResponse  { success: boolean; data: Service; message?: string; }

// Extended payload that includes featuresAr and isFeatured
export interface ServiceFullPayload extends ServicePayload {
  featuresAr?: string[];
  isFeatured?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServiceService {

  constructor(private http: HttpClient) {}

  // ── Public: all published ─────────────────────────────────────────────────
  getPublicServices(lang: 'en' | 'ar' = 'en'): Observable<Service[]> {
    const headers = new HttpHeaders({ 'Accept-Language': lang });
    return this.http.get<ServicesResponse>(API_ENDPOINTS.SERVICES.GET_ALL, { headers })
      .pipe(map(r => r.data));
  }

  // ── Public: featured only (home page) ────────────────────────────────────
  getFeaturedServices(lang: 'en' | 'ar' = 'en'): Observable<Service[]> {
    const headers = new HttpHeaders({ 'Accept-Language': lang });
    return this.http.get<ServicesResponse>(API_ENDPOINTS.SERVICES.GET_FEATURED, { headers })
      .pipe(map(r => r.data));
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAllAdmin(): Observable<Service[]> {
    return this.http.get<ServicesResponse>(API_ENDPOINTS.SERVICES.ADMIN_GET_ALL)
      .pipe(map(r => r.data));
  }

  create(payload: ServiceFullPayload): Observable<ServiceResponse> {
    return this.http.post<ServiceResponse>(API_ENDPOINTS.SERVICES.ADMIN_CREATE, payload);
  }

  update(id: string, payload: Partial<ServiceFullPayload>): Observable<ServiceResponse> {
    return this.http.put<ServiceResponse>(API_ENDPOINTS.SERVICES.ADMIN_UPDATE(id), payload);
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.SERVICES.ADMIN_DELETE(id)
    );
  }
}