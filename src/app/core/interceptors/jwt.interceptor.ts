import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest,HttpHandler, HttpEvent,HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private auth:   AuthService,
    private router: Router
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const token = this.auth.getToken();

    // Attach Bearer token — mirror backend: Authorization: Bearer <token>
    const authReq = token
      ? req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {

        if (err.status === 401) {
          // Mirror backend 401 cases:
          // - No token provided
          // - Token expired  (TokenExpiredError)
          // - Invalid token
          // - User no longer exists
          // - Account deactivated
          this.auth.logout();   // clears storage + redirects to /admin/login
        }

        // 403 — role not authorized → redirect to dashboard
        if (err.status === 403) {
          this.router.navigate(['/admin/dashboard']);
        }

        return throwError(() => err);
      })
    );
  }
}