import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild,Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private auth:   AuthService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    return this.check();
  }

  canActivateChild(): boolean | UrlTree {
    return this.check();
  }

  private check(): boolean | UrlTree {
    if (this.auth.isAuthenticated()) {
      return true;
    }
    // Mirror backend: no token → redirect to login
    return this.router.createUrlTree(['/admin/login']);
  }
}