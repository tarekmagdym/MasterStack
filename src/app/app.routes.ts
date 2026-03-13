// FIXED ROUTES — AdminLayoutComponent properly wraps all /admin/* children
// so the sidebar is always visible on protected pages.
import { Routes } from '@angular/router';
import { ProjectDetailsComponent } from './features/project-details/project-details.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Public Routes ─────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about-page/about-page.component').then(m => m.AboutPageComponent),
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services-page/services-page.component').then(m => m.ServicesPageComponent),
  },
  {
    path: 'technologies',
    loadComponent: () => import('./features/technologies/technologies.component').then(m => m.TechnologiesComponent),
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects-page/projects-page.component').then(m => m.ProjectsPageComponent),
  },
  {
    path: 'projects/:id',
    component: ProjectDetailsComponent,
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact-page/contact-page.component').then(m => m.ContactPageComponent),
  },

  // ── Admin Routes ──────────────────────────────────────────────
  {
    path: 'admin',
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },

      {
        path: 'login',
        loadComponent: () =>
          import('./admin/login/login.component').then(m => m.LoginComponent),
      },

      {
        path: '',
        loadComponent: () =>
          import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        children: [
          // ── Dashboard & Statistics ──────────────────────────
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
          },
          {
            path: 'statistics',                                   
            loadComponent: () =>
              import('./admin/statistics/statistics.component').then(m => m.StatisticsComponent),
          },

          // ── Content Management ──────────────────────────────
          {
            path: 'projects',
            loadComponent: () =>
              import('./admin/projects/admin-projects.component').then(m => m.AdminProjectsComponent),
          },
          {
            path: 'services',
            loadComponent: () =>
              import('./admin/services/admin-services.component').then(m => m.AdminServicesComponent),
          },
          {
            path: 'contacts',
            loadComponent: () =>
              import('./admin/contacts/admin-contacts.component').then(m => m.AdminContactsComponent),
          },
          {
            path: 'technologies',
            loadComponent: () =>
              import('./admin/technologies/admin-technologies.component').then(m => m.AdminTechnologiesComponent),
          },
          {
            path: 'testimonials',
            loadComponent: () =>
              import('./admin/testimonials/admin-testimonials.component').then(m => m.AdminTestimonialsComponent),
          },

          // ── System ──────────────────────────────────────────
          {
            path: 'settings',
            loadComponent: () =>
              import('./admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./admin/users/admin-users.component').then(m => m.AdminUsersComponent),
          },
          {
            path: 'activity-logs',
            loadComponent: () =>
              import('./admin/activity-logs/admin-activity-logs.component').then(m => m.AdminActivityLogsComponent),
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./admin/notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent),
          },

          // fallback once past login
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
    ],
  },

  // ── Wildcard ──────────────────────────────────────────────────
  { path: '**', redirectTo: '', pathMatch: 'full' },
];