import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export interface I18nString {
  en: string;
  ar: string;
}

/**
 * ProjectTag — bilingual chip label displayed on the public project card.
 * Maps directly to the { en, ar } objects stored in the DB tags array.
 */
export interface ProjectTag {
  en: string;
  ar: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin shape  (raw bilingual — returned by GET /api/admin/projects)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Project — raw document returned from the admin API.
 * All bilingual fields remain as { en, ar } objects.
 */
export interface Project {
  _id:               string;
  title:             I18nString;
  description:       I18nString;
  shortDescription?: I18nString;
  /** Bilingual chip labels shown on the public card */
  tags?:             ProjectTag[];
  slug:              string;
  /** Primary image URL — maps to `project.image` on the public page */
  thumbnail:         string;
  images?:           string[];
  technologies?:     string[];
  /**
   * Category slug — must be one of: 'web' | 'mobile' | 'ecommerce' | 'saas'
   * Matches the filter tab IDs on the public ProjectsPage.
   */
  category:          'web' | 'mobile' | 'ecommerce' | 'saas' | string;
  clientName?:       string;
  /** Live URL of the deployed project — maps to `project.liveUrl` on the public page */
  projectUrl?:       string;
  githubUrl?:        string;
  /**
   * Full ISO date stored in DB.
   * Public page extracts just the year: new Date(completionDate).getFullYear()
   * Maps to `project.year` on the public page.
   */
  completionDate?:   string;
  isFeatured:        boolean;
  isPublished:       boolean;
  order:             number;
  createdBy?:        { _id: string; name: string; email: string };
  updatedBy?:        { _id: string; name: string; email: string };
  createdAt:         string;
  updatedAt:         string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Write payload  (used for POST create & PUT update)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectPayload {
  title:             I18nString;
  description:       I18nString;
  shortDescription?: I18nString;
  /** Bilingual chip labels — sent as array of { en, ar } objects */
  tags?:             ProjectTag[];
  thumbnail:         string;
  images?:           string[];
  technologies?:     string[];
  category:          string;
  clientName?:       string;
  projectUrl?:       string;
  githubUrl?:        string;
  /** ISO date string or empty string (empty stripped before sending) */
  completionDate?:   string;
  isFeatured?:       boolean;
  isPublished?:      boolean;
  order?:            number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API response wrappers
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedProjects {
  success: boolean;
  data: Project[];
  pagination: {
    total: number;
    page:  number;
    limit: number;
    pages: number;
  };
}

export interface ProjectApiResponse {
  success: boolean;
  message: string;
  data:    Project;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProjectService {

  constructor(private http: HttpClient) {}

  // ── Admin: GET all ───────────────────────────────────────────────────────
  getAll(page = 1, limit = 12, search = ''): Observable<PaginatedProjects> {
    let params = new HttpParams()
      .set('page',  String(page))
      .set('limit', String(limit));

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http
      .get<PaginatedProjects>(API_ENDPOINTS.PROJECTS.ADMIN_GET_ALL, { params })
      .pipe(catchError(err => throwError(() => err)));
  }

  // ── Admin: CREATE ────────────────────────────────────────────────────────
  create(payload: ProjectPayload): Observable<ProjectApiResponse> {
    return this.http
      .post<ProjectApiResponse>(API_ENDPOINTS.PROJECTS.ADMIN_CREATE, payload)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ── Admin: UPDATE ────────────────────────────────────────────────────────
  update(id: string, payload: Partial<ProjectPayload>): Observable<ProjectApiResponse> {
    return this.http
      .put<ProjectApiResponse>(API_ENDPOINTS.PROJECTS.ADMIN_UPDATE(id), payload)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ── Admin: DELETE ────────────────────────────────────────────────────────
  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(API_ENDPOINTS.PROJECTS.ADMIN_DELETE(id))
      .pipe(catchError(err => throwError(() => err)));
  }

  // ── Public: GET all published ────────────────────────────────────────────
  getPublished(params?: {
    category?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }): Observable<PaginatedProjects> {
    let httpParams = new HttpParams();
    if (params?.category)           httpParams = httpParams.set('category', params.category);
    if (params?.featured === true)  httpParams = httpParams.set('featured', 'true');
    if (params?.page)               httpParams = httpParams.set('page',  String(params.page));
    if (params?.limit)              httpParams = httpParams.set('limit', String(params.limit));

    return this.http
      .get<PaginatedProjects>(API_ENDPOINTS.PROJECTS.GET_ALL, { params: httpParams })
      .pipe(catchError(err => throwError(() => err)));
  }

  // ── Public: GET by slug ──────────────────────────────────────────────────
  getBySlug(slug: string): Observable<{ success: boolean; data: Project }> {
    return this.http
      .get<{ success: boolean; data: Project }>(API_ENDPOINTS.PROJECTS.GET_BY_SLUG(slug))
      .pipe(catchError(err => throwError(() => err)));
  }
}