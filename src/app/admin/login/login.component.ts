import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';

export type ToastType = 'success' | 'error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(0.97)' }),
        animate('450ms cubic-bezier(0.4,0,0.2,1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),
    trigger('errorSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('250ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0, transform: 'translateY(-4px)' }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm!: FormGroup;
  isLoading    = false;
  showPassword = false;
  errorMessage = '';
  currentYear  = new Date().getFullYear();

  // Language & theme (synced with site-wide services)
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode = false;

  // Toast state
  toastVisible = false;
  toastType: ToastType = 'success';
  toastTitle   = '';
  toastMessage = '';
  private toastTimer?: ReturnType<typeof setTimeout>;

  private langSub?: Subscription;
  private themeSub?: Subscription;

  constructor(
    private fb:              FormBuilder,
    private auth:            AuthService,
    private router:          Router,
    private translateService: TranslateService,
    private themeService:    ThemeService
  ) {}

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    // Sync with site-wide language
    this.langSub = this.translateService.currentLang$.subscribe(lang => {
      this.currentLang = lang as 'ar' | 'en';
    });

    // Sync with site-wide theme
    this.themeSub = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });

    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.themeSub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Form submit ──────────────────────────────────────────────
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showToast(
          'success',
          this.currentLang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login Successful',
          this.currentLang === 'ar'
            ? 'مرحباً بك! جاري توجيهك إلى لوحة التحكم...'
            : 'Welcome back! Redirecting to your dashboard...'
        );
        // Delay navigation so user sees the toast
        setTimeout(() => {
          this.router.navigate(['/admin/dashboard']);
        }, 1800);
      },
      error: (err) => {
        this.isLoading = false;
        const serverMsg = err?.error?.message;

        // Show inline error for the form
        this.errorMessage = serverMsg
          || (this.currentLang === 'ar'
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
              : 'Invalid email or password. Please try again.');

        // Also show error toast
        this.showToast(
          'error',
          this.currentLang === 'ar' ? 'فشل تسجيل الدخول' : 'Login Failed',
          this.errorMessage
        );
      }
    });
  }

  // ── Toast helpers ────────────────────────────────────────────
  showToast(type: ToastType, title: string, message: string, duration = 3500): void {
    // Clear any running timer
    if (this.toastTimer) clearTimeout(this.toastTimer);

    this.toastType    = type;
    this.toastTitle   = title;
    this.toastMessage = message;
    this.toastVisible = true;

    this.toastTimer = setTimeout(() => this.hideToast(), duration);
  }

  hideToast(): void {
    this.toastVisible = false;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
  }
}