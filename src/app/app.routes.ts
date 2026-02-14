import { Routes } from '@angular/router';

export const routes: Routes = [
  // Public Routes - User Pages
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
    path: 'saas',
    loadComponent: () => import('./features/saas/saas.component').then(m => m.SaasComponent),
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects-page/projects-page.component').then(m => m.ProjectsPageComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact-page/contact-page.component').then(m => m.ContactPageComponent),
  },

  // Admin Routes - Protected with Auth Guard
  {
    path: 'admin',
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./admin/login/login.component').then(m => m.LoginComponent),
        title: 'Admin Login'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
        // canActivate: [AuthGuard], // Uncomment when AuthGuard is ready
        title: 'Admin Dashboard'
      },
      {
        path: 'projects-management',
        loadComponent: () => import('./admin/projects-management/projects-management.component').then(m => m.ProjectsManagementComponent),
        // canActivate: [AuthGuard],
        title: 'Projects Management'
      },
      {
        path: 'services-management',
        loadComponent: () => import('./admin/services-management/services-management.component').then(m => m.ServicesManagementComponent),
        // canActivate: [AuthGuard],
        title: 'Services Management'
      },
      {
        path: 'admins-management',
        loadComponent: () => import('./admin/admins-management/admins-management.component').then(m => m.AdminsManagementComponent),
        // canActivate: [AuthGuard, RoleGuard], // For super admin only
        title: 'Admins Management'
      },
      {
        path: 'notifications',
        loadComponent: () => import('./admin/notifications/notifications.component').then(m => m.NotificationsComponent),
        // canActivate: [AuthGuard],
        title: 'Notifications'
      },
      {
        path: 'activity-logs',
        loadComponent: () => import('./admin/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent),
        // canActivate: [AuthGuard],
        title: 'Activity Logs'
      },
      {
        path: 'settings',
        loadComponent: () => import('./admin/settings/settings.component').then(m => m.SettingsComponent),
        // canActivate: [AuthGuard],
        title: 'Settings'
      }
    ]
  },

  // Wildcard Route - 404 Page
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];