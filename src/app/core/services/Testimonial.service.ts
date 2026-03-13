import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface BilingualField { en: string; ar: string; }

export interface Testimonial {
  _id:         string;
  name:        BilingualField;
  position:    BilingualField;
  company:     BilingualField;
  content:     BilingualField;
  rating:      number;
  avatar?:     string;
  avatarColor: string;
  isActive:    boolean;
  order:       number;
  createdAt?:  string;
  updatedAt?:  string;
}

export interface TestimonialPayload {
  name:        BilingualField;
  position:    BilingualField;
  company:     BilingualField;
  content:     BilingualField;
  rating:      number;
  avatar?:     string;
  avatarColor: string;
  isActive:    boolean;
  order:       number;
}

interface ApiResponse<T = any> { success: boolean; message?: string; data: T; count?: number; }

@Injectable({ providedIn: 'root' })
export class TestimonialService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Testimonial[]>> {
    return this.http.get<ApiResponse<Testimonial[]>>(API_ENDPOINTS.TESTIMONIALS.ADMIN_GET_ALL);
  }

  getById(id: string): Observable<ApiResponse<Testimonial>> {
    return this.http.get<ApiResponse<Testimonial>>(API_ENDPOINTS.TESTIMONIALS.ADMIN_GET_BY_ID(id));
  }

  create(payload: TestimonialPayload): Observable<ApiResponse<Testimonial>> {
    return this.http.post<ApiResponse<Testimonial>>(API_ENDPOINTS.TESTIMONIALS.ADMIN_CREATE, payload);
  }

  update(id: string, payload: Partial<TestimonialPayload>): Observable<ApiResponse<Testimonial>> {
    return this.http.put<ApiResponse<Testimonial>>(API_ENDPOINTS.TESTIMONIALS.ADMIN_UPDATE(id), payload);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(API_ENDPOINTS.TESTIMONIALS.ADMIN_DELETE(id));
  }
}