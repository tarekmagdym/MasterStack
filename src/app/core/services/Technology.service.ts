import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';

export interface TechnologyName { en: string; ar: string; }

export interface Technology {
  _id:              string;
  name:             TechnologyName;
  logo:             string;
  category:         'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'tools' | 'other';
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isPublished:      boolean;
  order:            number;
  createdBy?:       { name: string; email: string };
  updatedBy?:       { name: string; email: string };
  createdAt?:       string;
  updatedAt?:       string;
}

export interface TechnologyPayload {
  name:             TechnologyName;
  logo:             string;
  category:         string;
  proficiencyLevel: string;
  isPublished:      boolean;
  order:            number;
}

interface ApiResponse<T = any> { success: boolean; message?: string; data: T; }

@Injectable({ providedIn: 'root' })
export class TechnologyService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Technology[]>> {
    return this.http.get<ApiResponse<Technology[]>>(API_ENDPOINTS.TECHNOLOGIES.ADMIN_GET_ALL);
  }

  create(payload: TechnologyPayload): Observable<ApiResponse<Technology>> {
    return this.http.post<ApiResponse<Technology>>(API_ENDPOINTS.TECHNOLOGIES.ADMIN_CREATE, payload);
  }

  update(id: string, payload: Partial<TechnologyPayload>): Observable<ApiResponse<Technology>> {
    return this.http.put<ApiResponse<Technology>>(API_ENDPOINTS.TECHNOLOGIES.ADMIN_UPDATE(id), payload);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(API_ENDPOINTS.TECHNOLOGIES.ADMIN_DELETE(id));
  }
}