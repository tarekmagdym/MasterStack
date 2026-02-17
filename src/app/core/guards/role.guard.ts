import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot,Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  // Mirror backend ROLE_HIERARCHY
  private readonly hierarchy: Record<string, number> = {
    super_admin: 3,
    admin:       2,
    employee:    1,
  };

  constructor(
    private auth:   AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const user = this.auth.getCurrentUser();

    // Not authenticated at all → go to login
    if (!user) {
      return this.router.createUrlTree(['/admin/login']);
    }

    // Read required roles from route data
    // Usage in routes: data: { roles: ['super_admin'] }
    const requiredRoles: string[] = route.data?.['roles'] ?? [];

    // No roles required → any authenticated user passes
    if (requiredRoles.length === 0) {
      return true;
    }

    // Mirror backend authorize(...roles) check
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Role not sufficient → send to dashboard (403 equivalent)
    return this.router.createUrlTree(['/admin/dashboard']);
  }

  // ── Helper methods (mirror backend helpers) ──────────────

  /** Mirror: canWrite = super_admin | admin */
  canWrite(): boolean {
    return this.auth.hasRole('super_admin', 'admin');
  }

  /** Mirror: canDelete = super_admin | admin */
  canDelete(): boolean {
    return this.auth.hasRole('super_admin', 'admin');
  }

  /** Mirror: isSuperAdmin = super_admin only */
  isSuperAdmin(): boolean {
    return this.auth.hasRole('super_admin');
  }

  /** Mirror: attachRoleMeta — returns object for template use */
  getRoleMeta(): {
    canCreate:     boolean;
    canEdit:       boolean;
    canDelete:     boolean;
    canManageUsers: boolean;
  } {
    const user = this.auth.getCurrentUser();
    const role = user?.role ?? '';
    return {
      canCreate:      ['super_admin', 'admin'].includes(role),
      canEdit:        ['super_admin', 'admin'].includes(role),
      canDelete:      ['super_admin', 'admin'].includes(role),
      canManageUsers: role === 'super_admin',
    };
  }
}