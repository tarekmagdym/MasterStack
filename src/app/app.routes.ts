import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ServicesPageComponent } from './features/services-page/services-page.component';
import { ProjectsPageComponent } from './features/projects-page/projects-page.component';
import { AboutPageComponent } from './features/about-page/about-page.component';
import { ContactPageComponent } from './features/contact-page/contact-page.component';
import { ActivityLogsComponent } from './admin/activity-logs/activity-logs.component';
import { AdminsManagementComponent } from './admin/admins-management/admins-management.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { LoginComponent } from './admin/login/login.component';
import { NotificationsComponent } from './admin/notifications/notifications.component';
import { ProjectsManagementComponent } from './admin/projects-management/projects-management.component';
import { ServicesManagementComponent } from './admin/services-management/services-management.component';
import { SettingsComponent } from './admin/settings/settings.component';

export const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  { path: 'services', component: ServicesPageComponent },
  { path: 'projects', component: ProjectsPageComponent },
  { path: 'about', component: AboutPageComponent },
  { path: 'contact', component: ContactPageComponent },
  
  // Admin routes (lazy loaded)
  { 
    path: 'admin/login', 
    component: LoginComponent 
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'services', component: ServicesManagementComponent },
      { path: 'projects', component: ProjectsManagementComponent },
      { path: 'admins', component: AdminsManagementComponent, canActivate: [RoleGuard] },
      { path: 'settings', component: SettingsComponent },
      { path: 'logs', component: ActivityLogsComponent },
      { path: 'notifications', component: NotificationsComponent }
    ]
  }
];