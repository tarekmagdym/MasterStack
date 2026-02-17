import { environment } from '../../../environment/environment';

// ============================================
// MASTERSTACK API ENDPOINTS
// ============================================
export const API_ENDPOINTS = {

  // ============================================
  // AUTHENTICATION
  // ============================================
  AUTH: {
    LOGIN:           `${environment.apiUrl}/auth/login`,
    ME:              `${environment.apiUrl}/auth/me`,
    CHANGE_PASSWORD: `${environment.apiUrl}/auth/change-password`,
  },

  // ============================================
  // PROJECTS
  // ============================================
  PROJECTS: {
    // Public
    GET_ALL:     `${environment.apiUrl}/projects`,
    GET_BY_SLUG: (slug: string) => `${environment.apiUrl}/projects/${slug}`,
    // Admin
    ADMIN_GET_ALL: `${environment.apiUrl}/admin/projects`,
    ADMIN_CREATE:  `${environment.apiUrl}/admin/projects`,
    ADMIN_UPDATE:  (id: string) => `${environment.apiUrl}/admin/projects/${id}`,
    ADMIN_DELETE:  (id: string) => `${environment.apiUrl}/admin/projects/${id}`,
  },

  // ============================================
  // SERVICES
  // ============================================
  SERVICES: {
    // Public
    GET_ALL: `${environment.apiUrl}/services`,
    // Admin
    ADMIN_GET_ALL: `${environment.apiUrl}/admin/services`,
    ADMIN_CREATE:  `${environment.apiUrl}/admin/services`,
    ADMIN_UPDATE:  (id: string) => `${environment.apiUrl}/admin/services/${id}`,
    ADMIN_DELETE:  (id: string) => `${environment.apiUrl}/admin/services/${id}`,
  },

  // ============================================
  // TECHNOLOGIES
  // ============================================
  TECHNOLOGIES: {
    // Public
    GET_ALL: `${environment.apiUrl}/technologies`,   // ?category=frontend
    // Admin
    ADMIN_GET_ALL: `${environment.apiUrl}/admin/technologies`,
    ADMIN_CREATE:  `${environment.apiUrl}/admin/technologies`,
    ADMIN_UPDATE:  (id: string) => `${environment.apiUrl}/admin/technologies/${id}`,
    ADMIN_DELETE:  (id: string) => `${environment.apiUrl}/admin/technologies/${id}`,
  },

  // ============================================
  // TEAM MEMBERS
  // ============================================
  TEAM: {
    // Public
    GET_ALL: `${environment.apiUrl}/team`,
    // Admin
    ADMIN_GET_ALL: `${environment.apiUrl}/admin/team`,
    ADMIN_CREATE:  `${environment.apiUrl}/admin/team`,
    ADMIN_UPDATE:  (id: string) => `${environment.apiUrl}/admin/team/${id}`,
    ADMIN_DELETE:  (id: string) => `${environment.apiUrl}/admin/team/${id}`,
  },

  // ============================================
  // TESTIMONIALS
  // ============================================
  TESTIMONIALS: {
    // Public
    GET_ALL: `${environment.apiUrl}/testimonials`,
    // Admin
    ADMIN_GET_ALL: `${environment.apiUrl}/testimonials/all`,
    ADMIN_GET_BY_ID: (id: string) => `${environment.apiUrl}/testimonials/${id}`,
    ADMIN_CREATE:    `${environment.apiUrl}/testimonials`,
    ADMIN_UPDATE:    (id: string) => `${environment.apiUrl}/testimonials/${id}`,
    ADMIN_DELETE:    (id: string) => `${environment.apiUrl}/testimonials/${id}`,
  },

  // ============================================
  // CONTACT MESSAGES
  // ============================================
  CONTACT: {
    // Public
    SUBMIT: `${environment.apiUrl}/contact`,
    // Admin
    ADMIN_GET_ALL:     `${environment.apiUrl}/admin/messages`,
    ADMIN_GET_BY_ID:   (id: string) => `${environment.apiUrl}/admin/messages/${id}`,
    ADMIN_TOGGLE_READ: (id: string) => `${environment.apiUrl}/admin/messages/${id}/read`,
    ADMIN_DELETE:      (id: string) => `${environment.apiUrl}/admin/messages/${id}`,
  },

  // ============================================
  // USER MANAGEMENT — Super Admin only
  // ============================================
  USERS: {
    GET_ALL: `${environment.apiUrl}/admin/users`,
    CREATE:  `${environment.apiUrl}/admin/users`,
    UPDATE:  (id: string) => `${environment.apiUrl}/admin/users/${id}`,
    DELETE:  (id: string) => `${environment.apiUrl}/admin/users/${id}`,
  },

  // ============================================
  // DASHBOARD & ACTIVITY LOGS
  // ============================================
  DASHBOARD: {
    STATS:         `${environment.apiUrl}/admin/stats`,
    ACTIVITY_LOGS: `${environment.apiUrl}/admin/activity-logs`,  // ?page=1&limit=20
  },

};

// ============================================
// Helper — Build URLs with query parameters
// ============================================
export class ApiUrlBuilder {

  static buildQueryUrl(baseUrl: string, params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  static buildPaginatedUrl(baseUrl: string, page: number = 1, limit: number = 10): string {
    return this.buildQueryUrl(baseUrl, { page, limit });
  }

  static buildSearchUrl(baseUrl: string, search: string, page?: number, limit?: number): string {
    const params: Record<string, any> = { search };
    if (page)  params['page']  = page;
    if (limit) params['limit'] = limit;
    return this.buildQueryUrl(baseUrl, params);
  }
}

// ============================================
// Types
// ============================================
export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}


export interface TestimonialPayload {
  name: string;
  position: string;
  company: string;
  content: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatar?: string;
  avatarColor?: string;
  isActive?: boolean;
  order?: number;
}
export interface ProjectPayload {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail: string;
  images?: string[];
  technologies?: string[];
  category: string;
  clientName?: string;
  projectUrl?: string;
  githubUrl?: string;
  completionDate?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  order?: number;
}

export interface ServicePayload {
  title: string;
  description: string;
  shortDescription?: string;
  icon: string;
  features?: string[];
  isPublished?: boolean;
  order?: number;
}

export interface TechnologyPayload {
  name: string;
  logo: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'other';
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isPublished?: boolean;
  order?: number;
}

export interface TeamMemberPayload {
  name: string;
  position: string;
  bio?: string;
  photo?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  skills?: string[];
  isPublished?: boolean;
  order?: number;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'employee';
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: 'super_admin' | 'admin' | 'employee';
  isActive?: boolean;
}

export default API_ENDPOINTS;