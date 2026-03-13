import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  private auth   = inject(AuthService);
  private router = inject(Router);

  // ── CanActivate ───────────────────────────────────────────────
  canActivate(
    _route: ActivatedRouteSnapshot,
    state:  RouterStateSnapshot
  ): boolean | UrlTree {
    return this.check(state.url);
  }

  // ── CanActivateChild ──────────────────────────────────────────
  canActivateChild(
    _childRoute: ActivatedRouteSnapshot,
    state:       RouterStateSnapshot
  ): boolean | UrlTree {
    return this.check(state.url);
  }

  // ── Core logic ────────────────────────────────────────────────
  private check(returnUrl: string): boolean | UrlTree {
    if (this.auth.isAuthenticated()) {
      return true;
    }

    // Preserve the intended URL so login can redirect back after success
    return this.router.createUrlTree(
      ['/admin/login'],
      { queryParams: { returnUrl } }
    );
  }
}