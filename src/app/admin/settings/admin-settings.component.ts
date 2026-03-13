import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService, AuthUser } from '../../core/services/auth.service';

// ── Toast types ────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { id: number; type: ToastType; title: string; message: string; }

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  private destroy$  = new Subject<void>();
  private toastSeed = 0;

  isDark    = false;
  isRtl     = false;
  activeTab = 'profile';

  // ── Toast ──────────────────────────────────────────────────
  toasts: ToastItem[] = [];

  // ── Current user ──────────────────────────────────────────
  currentUser: AuthUser | null = null;

  // ── Profile form ──────────────────────────────────────────
  profileForm   = { name: '', email: '' };
  profileSaving = false;

  // ── Avatar upload ─────────────────────────────────────────
  avatarUploading = false;

  // ── Security form ─────────────────────────────────────────
  securityForm   = { currentPassword: '', newPassword: '', confirmPassword: '' };
  securitySaving = false;
  showCurrent    = false;
  showNew        = false;
  showConfirm    = false;

  // ── Tabs ──────────────────────────────────────────────────
  tabs = [
    {
      id: 'profile', label: 'Profile', labelAr: 'الملف الشخصي',
      icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-width="2"/><circle cx="12" cy="7" r="4" stroke-width="2"/>'
    },
    {
      id: 'security', label: 'Security', labelAr: 'الأمان',
      icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-width="2"/>'
    },
    {
      id: 'appearance', label: 'Appearance', labelAr: 'المظهر',
      icon: '<circle cx="12" cy="12" r="5" stroke-width="2"/><line x1="12" y1="1" x2="12" y2="3" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="21" x2="12" y2="23" stroke-width="2" stroke-linecap="round"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke-width="2" stroke-linecap="round"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="12" x2="3" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="21" y1="12" x2="23" y2="12" stroke-width="2" stroke-linecap="round"/>'
    },
  ];



  constructor(
    private translateService: TranslateService,
    private themeService:     ThemeService,
    private authService:      AuthService,
  ) {}

  ngOnInit(): void {
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.isDark = d);

    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.isRtl = l === 'ar');

    this.authService.getUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => {
        this.currentUser       = u;
        this.profileForm.name  = u?.name  ?? '';
        this.profileForm.email = u?.email ?? '';
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ══════════════════════════════════════════════════════════
  // TOAST HELPERS
  // ══════════════════════════════════════════════════════════
  private showToast(type: ToastType, title: string, message = '', duration = 3500): void {
    const id = ++this.toastSeed;
    this.toasts = [...this.toasts, { id, type, title, message }];
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  trackToast(_: number, t: ToastItem): number { return t.id; }

  private success(title: string, msg = '')  { this.showToast('success', title, msg); }
  private error  (title: string, msg = '')  { this.showToast('error',   title, msg, 5000); }
  private info   (title: string, msg = '')  { this.showToast('info',    title, msg); }

  // ══════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════
  getInitials(): string {
    if (!this.currentUser?.name) return 'A';
    return this.currentUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getRoleLabel(): string {
    const map: Record<string, { ar: string; en: string }> = {
      super_admin: { ar: 'مدير عام', en: 'Super Admin' },
      admin:       { ar: 'مدير',     en: 'Admin'       },
      employee:    { ar: 'موظف',     en: 'Employee'    },
    };
    const role = this.currentUser?.role ?? 'admin';
    return map[role]?.[this.isRtl ? 'ar' : 'en'] ?? role;
  }

  // ══════════════════════════════════════════════════════════
  // AVATAR UPLOAD
  // ══════════════════════════════════════════════════════════
  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.error(
        this.isRtl ? 'نوع غير مدعوم'    : 'Unsupported type',
        this.isRtl ? 'يُسمح بـ JPG أو PNG أو WebP فقط' : 'Only JPG, PNG or WebP allowed'
      );
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.error(
        this.isRtl ? 'الصورة كبيرة جداً' : 'File too large',
        this.isRtl ? 'الحد الأقصى 2MB'    : 'Maximum size is 2MB'
      );
      return;
    }

    this.avatarUploading = true;
    this.authService.uploadAvatar(file).subscribe({
      next: () => {
        this.avatarUploading = false;
        this.success(
          this.isRtl ? 'تم بنجاح'                     : 'Avatar updated',
          this.isRtl ? 'تم تحديث صورة الملف الشخصي'   : 'Your profile photo has been updated'
        );
      },
      error: (err) => {
        this.avatarUploading = false;
        this.error(
          this.isRtl ? 'فشل الرفع'         : 'Upload failed',
          err?.error?.message ?? (this.isRtl ? 'تعذّر رفع الصورة' : 'Could not upload avatar')
        );
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // PROFILE SAVE
  // ══════════════════════════════════════════════════════════
  saveProfile(): void {
    if (!this.profileForm.name.trim()) {
      this.error(
        this.isRtl ? 'حقل مطلوب'         : 'Required field',
        this.isRtl ? 'الاسم الكامل مطلوب' : 'Full name is required'
      );
      return;
    }
    this.profileSaving = true;
    this.authService.fetchMe().subscribe({
      next: () => {
        this.profileSaving = false;
        this.success(
          this.isRtl ? 'تم الحفظ'                       : 'Profile saved',
          this.isRtl ? 'تم مزامنة بيانات ملفك الشخصي'   : 'Your profile data has been synced'
        );
      },
      error: () => {
        this.profileSaving = false;
        this.error(
          this.isRtl ? 'فشل الحفظ'                              : 'Save failed',
          this.isRtl ? 'تعذّر مزامنة البيانات، حاول مجدداً'    : 'Could not sync profile, please try again'
        );
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // CHANGE PASSWORD
  // ══════════════════════════════════════════════════════════
  savePassword(): void {
    const { currentPassword, newPassword, confirmPassword } = this.securityForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.error(
        this.isRtl ? 'حقول مطلوبة'              : 'Required fields',
        this.isRtl ? 'يرجى تعبئة جميع الحقول'   : 'Please fill in all fields'
      );
      return;
    }
    if (newPassword.length < 8) {
      this.error(
        this.isRtl ? 'كلمة مرور قصيرة'               : 'Password too short',
        this.isRtl ? 'يجب أن تكون 8 أحرف على الأقل'  : 'Must be at least 8 characters'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      this.error(
        this.isRtl ? 'كلمتا المرور مختلفتان'         : 'Passwords do not match',
        this.isRtl ? 'تأكد من تطابق كلمتَي المرور'   : 'Make sure both passwords are identical'
      );
      return;
    }

    this.securitySaving = true;
    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.securitySaving = false;
        this.securityForm   = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.success(
          this.isRtl ? 'تم التغيير'                      : 'Password changed',
          this.isRtl ? 'تم تغيير كلمة المرور بنجاح'      : 'Your password has been updated successfully'
        );
      },
      error: (err) => {
        this.securitySaving = false;
        this.error(
          this.isRtl ? 'فشل التغيير'          : 'Change failed',
          err?.error?.message ?? (this.isRtl ? 'تعذّر تغيير كلمة المرور' : 'Could not change password')
        );
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // PASSWORD STRENGTH
  // ══════════════════════════════════════════════════════════
  get passwordStrength(): number {
    const p = this.securityForm.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)           s++;
    if (p.length >= 12)          s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    return s;
  }

  get passwordStrengthLabel(): string {
    const s = this.passwordStrength;
    if (s <= 1) return this.isRtl ? 'ضعيفة جداً' : 'Very weak';
    if (s === 2) return this.isRtl ? 'ضعيفة'     : 'Weak';
    if (s === 3) return this.isRtl ? 'متوسطة'    : 'Fair';
    if (s === 4) return this.isRtl ? 'قوية'      : 'Strong';
    return this.isRtl ? 'قوية جداً' : 'Very strong';
  }

  get passwordStrengthClass(): string {
    const s = this.passwordStrength;
    if (s <= 1) return 'very-weak';
    if (s === 2) return 'weak';
    if (s === 3) return 'fair';
    if (s === 4) return 'strong';
    return 'very-strong';
  }

  // ══════════════════════════════════════════════════════════
  // APPEARANCE
  // ══════════════════════════════════════════════════════════
  setTheme(t: string): void {
    if ((t === 'dark') !== this.isDark) {
      this.themeService.toggleTheme();
      this.info(
        this.isRtl ? 'تم تغيير السمة' : 'Theme changed',
        t === 'dark'
          ? (this.isRtl ? 'تم التحويل إلى الوضع الداكن' : 'Switched to dark mode')
          : (this.isRtl ? 'تم التحويل إلى الوضع الفاتح' : 'Switched to light mode')
      );
    }
  }

  setLang(l: 'ar' | 'en'): void {
    if ((l === 'ar') !== this.isRtl) {
      this.translateService.setLanguage(l);
      this.info(
        l === 'ar' ? 'تم تغيير اللغة'    : 'Language changed',
        l === 'ar' ? 'تم التحويل إلى العربية' : 'Switched to English'
      );
    }
  }

  // ══════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════════════════
  saveNotifPrefs(): void {
    this.success(
      this.isRtl ? 'تم الحفظ'                    : 'Preferences saved',
      this.isRtl ? 'تم حفظ إعدادات الإشعارات'    : 'Notification preferences have been saved'
    );
  }
}