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
    AVATAR:          `${environment.apiUrl}/auth/avatar`,
  },

  // ============================================
  // PROJECTS
  // ============================================
  PROJECTS: {
    GET_ALL:     `${environment.apiUrl}/projects`,
    GET_BY_SLUG: (slug: string) => `${environment.apiUrl}/projects/${slug}`,
    ADMIN_GET_ALL: `${environment.apiUrl}/admin/projects`,
    ADMIN_CREATE:  `${environment.apiUrl}/admin/projects`,
    ADMIN_UPDATE:  (id: string) => `${environment.apiUrl}/admin/projects/${id}`,
    ADMIN_DELETE:  (id: string) => `${environment.apiUrl}/admin/projects/${id}`,
  },

  // ============================================
  // SERVICES
  // ============================================
  SERVICES: {
    GET_ALL:     `${environment.apiUrl}/services`,
    GET_FEATURED: `${environment.apiUrl}/services/featured`,
    ADMIN_GET_ALL: `${environment.apiUrl}/admin/services`,
    ADMIN_CREATE:  `${environment.apiUrl}/admin/services`,
    ADMIN_UPDATE:  (id: string) => `${environment.apiUrl}/admin/services/${id}`,
    ADMIN_DELETE:  (id: string) => `${environment.apiUrl}/admin/services/${id}`,
  },

  // ============================================
  // TECHNOLOGIES
  // ============================================
  TECHNOLOGIES: {
    GET_ALL:       `${environment.apiUrl}/technologies`,
    ADMIN_GET_ALL: `${environment.apiUrl}/admin/technologies`,
    ADMIN_CREATE:  `${environment.apiUrl}/admin/technologies`,
    ADMIN_UPDATE:  (id: string) => `${environment.apiUrl}/admin/technologies/${id}`,
    ADMIN_DELETE:  (id: string) => `${environment.apiUrl}/admin/technologies/${id}`,
  },

  // ============================================
  // TEAM MEMBERS
  // ============================================
  TEAM: {
    GET_ALL:       `${environment.apiUrl}/team`,
    ADMIN_GET_ALL: `${environment.apiUrl}/admin/team`,
    ADMIN_CREATE:  `${environment.apiUrl}/admin/team`,
    ADMIN_UPDATE:  (id: string) => `${environment.apiUrl}/admin/team/${id}`,
    ADMIN_DELETE:  (id: string) => `${environment.apiUrl}/admin/team/${id}`,
  },

  // ============================================
  // TESTIMONIALS
  // ============================================
  TESTIMONIALS: {
    GET_ALL:         `${environment.apiUrl}/testimonials`,
    ADMIN_GET_ALL:   `${environment.apiUrl}/testimonials/all`,
    ADMIN_GET_BY_ID: (id: string) => `${environment.apiUrl}/testimonials/${id}`,
    ADMIN_CREATE:    `${environment.apiUrl}/testimonials`,
    ADMIN_UPDATE:    (id: string) => `${environment.apiUrl}/testimonials/${id}`,
    ADMIN_DELETE:    (id: string) => `${environment.apiUrl}/testimonials/${id}`,
  },

  // ============================================
  // CONTACT MESSAGES
  // ============================================
  CONTACT: {
    SUBMIT:            `${environment.apiUrl}/contact`,
    ADMIN_GET_ALL:     `${environment.apiUrl}/admin/messages`,
    ADMIN_GET_BY_ID:   (id: string) => `${environment.apiUrl}/admin/messages/${id}`,
    ADMIN_TOGGLE_READ: (id: string) => `${environment.apiUrl}/admin/messages/${id}/read`,
    ADMIN_DELETE:      (id: string) => `${environment.apiUrl}/admin/messages/${id}`,
    ADMIN_REPLY:       (id: string) => `${environment.apiUrl}/admin/messages/${id}/reply`,
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
  // DASHBOARD & STATISTICS
  // ============================================
  DASHBOARD: {
    STATS:               `${environment.apiUrl}/admin/stats`,
    STATISTICS:          `${environment.apiUrl}/admin/statistics`,   // ← NEW
    ACTIVITY_LOGS:       `${environment.apiUrl}/admin/activity-logs`,
    CLEAR_ACTIVITY_LOGS: `${environment.apiUrl}/admin/activity-logs`,
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  NOTIFICATIONS: {
    GET_ALL:       `${environment.apiUrl}/admin/notifications`,
    GET_BY_ID:     (id: string) => `${environment.apiUrl}/admin/notifications/${id}`,
    MARK_READ:     (id: string) => `${environment.apiUrl}/admin/notifications/${id}/read`,
    MARK_ALL_READ: `${environment.apiUrl}/admin/notifications/read-all`,
    CREATE:        `${environment.apiUrl}/admin/notifications`,
    DELETE:        (id: string) => `${environment.apiUrl}/admin/notifications/${id}`,
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
// Shared i18n field type
// ============================================
export interface I18nString {
  en: string;
  ar: string;
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
  name:         I18nString;
  position:     I18nString;
  company:      I18nString;
  content:      I18nString;
  rating:       1 | 2 | 3 | 4 | 5;
  avatar?:      string;
  avatarColor?: string;
  isActive?:    boolean;
  order?:       number;
}

export interface ProjectPayload {
  title:            I18nString;
  description:      I18nString;
  shortDescription?: I18nString;
  thumbnail:        string;
  images?:          string[];
  technologies?:    string[];
  category:         string;
  clientName?:      string;
  projectUrl?:      string;
  githubUrl?:       string;
  completionDate?:  string;
  isFeatured?:      boolean;
  isPublished?:     boolean;
  order?:           number;
}

export interface ServicePayload {
  title:             I18nString;
  description:       I18nString;
  shortDescription?: I18nString;
  icon:              string;
  features?:         string[];
  isPublished?:      boolean;
  order?:            number;
}

export interface TechnologyPayload {
  name:               I18nString;
  logo:               string;
  category:           'frontend' | 'backend' | 'database' | 'devops' | 'mobile' | 'tools' | 'other';
  proficiencyLevel?:  'beginner' | 'intermediate' | 'advanced' | 'expert';
  isPublished?:       boolean;
  order?:             number;
}

export interface TeamMemberPayload {
  name:         I18nString;
  position:     I18nString;
  bio?:         I18nString;
  photo?:       string;
  socialLinks?: {
    linkedin?: string;
    github?:   string;
    twitter?:  string;
    website?:  string;
  };
  skills?:      string[];
  isPublished?: boolean;
  order?:       number;
}

export interface ContactPayload {
  name:     string;
  email:    string;
  phone?:   string;
  subject:  string;
  message:  string;
}

export interface CreateUserPayload {
  name:     string;
  email:    string;
  password: string;
  role:     'super_admin' | 'admin' | 'employee';
}

export interface UpdateUserPayload {
  name?:     string;
  email?:    string;
  role?:     'super_admin' | 'admin' | 'employee';
  isActive?: boolean;
}

export interface CreateNotificationPayload {
  title:        string;
  message:      string;
  type?:        'info' | 'success' | 'warning' | 'error';
  resourceType?: 'Project' | 'Service' | 'Technology' | 'TeamMember' | 'ContactMessage' | 'User' | 'Auth';
  resourceId?:  string;
  recipient?:   string;
}

// ============================================
// Statistics Response Types
// ============================================
export interface StatisticsResponse {
  summary: {
    totalProjects: number;
    totalMessages: number;
    totalUnread: number;
    totalUsers: number;
    totalServices: number;
    totalTech: number;
  };
  projects: {
    overTime: Array<{ _id: { year: number; month: number }; count: number }>;
    byCategory: Array<{ _id: string; count: number }>;
    byStatus: { published: number; draft: number; featured: number };
  };
  messages: {
    overTime: Array<{ _id: { year: number; month: number }; total: number; unread: number }>;
    totalRead: number;
    totalUnread: number;
  };
  services: {
    total: number;
    published: number;
    featured: number;
    draft: number;
  };
  activity: {
    byAction: Array<{ _id: string; count: number }>;
    byResource: Array<{ _id: string; count: number }>;
    overTime: Array<{ _id: { year: number; month: number }; count: number }>;
    topUsers: Array<{ name: string; email: string; role: string; count: number }>;
  };
}

export default API_ENDPOINTS;