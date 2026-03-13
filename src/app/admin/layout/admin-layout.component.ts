import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService, BackendNotif } from '../../core/services/Notification.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  private hiddenNotifIds = new Set<string>(
    JSON.parse(localStorage.getItem('hiddenNotifIds') || '[]')
  );

  currentUser: AuthUser | null = null;
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode = false;
  sidebarCollapsed = false;
  mobileSidebarOpen = false;
  year = new Date().getFullYear();

  // ── Notification dropdown ─────────────────────────────────
  notifOpen     = false;
  notifications: BackendNotif[] = [];
  unreadCount   = 0;
  notifLoading  = false;

  // ── Logout confirm ────────────────────────────────────────
  showLogoutConfirm = false;
  logoutConfirmed   = false;

  constructor(
    private auth:             AuthService,
    private translateService: TranslateService,
    private themeService:     ThemeService,
    private router:           Router,
    private notifService:     NotificationService,
    private elRef:            ElementRef,
  ) {}

  ngOnInit(): void {
    this.auth.getUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.currentUser = u);

    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.currentLang = l as 'ar' | 'en');

    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.isDarkMode = d);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        this.mobileSidebarOpen = false;
        this.notifOpen = false;
        document.body.style.overflow = '';
      });

    this.loadUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.notifOpen = false;
    }
  }

  // ── Notifications ─────────────────────────────────────────

  private loadUnreadCount(): void {
    this.notifService.getAll(1, 1, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.unreadCount = res.unreadCount ?? 0);
  }

  toggleNotifDropdown(): void {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) {
      this.fetchNotifications();
    }
  }

  private fetchNotifications(): void {
    this.notifLoading = true;
    this.notifService.getAll(1, 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.notifications = (res.data ?? []).filter(
            n => !this.hiddenNotifIds.has(n._id)
          );
          this.unreadCount  = res.unreadCount ?? 0;
          this.notifLoading = false;
        },
        error: () => { this.notifLoading = false; }
      });
  }

  markOneRead(notif: BackendNotif, e: MouseEvent): void {
    e.stopPropagation();
    if (notif.isRead) return;
    notif.isRead = true;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.notifService.markAsRead(notif._id).subscribe();
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      }
    });
  }

  deleteNotif(notif: BackendNotif, e: MouseEvent): void {
    e.stopPropagation();
    this.hiddenNotifIds.add(notif._id);
    localStorage.setItem('hiddenNotifIds', JSON.stringify([...this.hiddenNotifIds]));
    this.notifications = this.notifications.filter(n => n._id !== notif._id);
    if (!notif.isRead) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
  }

  goToNotifications(): void {
    this.notifOpen = false;
    this.router.navigate(['/admin/notifications']);
  }

  notifTitle(n: BackendNotif): string {
    return this.currentLang === 'ar' && n.titleAr ? n.titleAr : n.title;
  }

  notifMessage(n: BackendNotif): string {
    return this.currentLang === 'ar' && n.messageAr ? n.messageAr : n.message;
  }

  notifTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return this.currentLang === 'ar' ? 'الآن'               : 'Just now';
    if (diff < 3600)  return this.currentLang === 'ar' ? `${Math.floor(diff/60)}د`   : `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return this.currentLang === 'ar' ? `${Math.floor(diff/3600)}س` : `${Math.floor(diff/3600)}h ago`;
    return this.currentLang === 'ar' ? `${Math.floor(diff/86400)}ي` : `${Math.floor(diff/86400)}d ago`;
  }

  // ── Logout confirm ────────────────────────────────────────

  logout(): void {
    this.openLogoutConfirm();
  }

  openLogoutConfirm(): void {
    this.showLogoutConfirm = true;
    this.logoutConfirmed   = false;
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
    this.logoutConfirmed   = false;
  }

  confirmLogout(): void {
    if (!this.logoutConfirmed) return;
    localStorage.removeItem('hiddenNotifIds');
    this.showLogoutConfirm = false;
    this.auth.logout();
  }

  // ── Helpers ───────────────────────────────────────────────

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'A';
    return this.currentUser.name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getRoleLabel(): string {
    const map: Record<string, { ar: string; en: string }> = {
      super_admin: { ar: 'مدير عام', en: 'Super Admin' },
      admin:       { ar: 'مدير',     en: 'Admin'       },
      employee:    { ar: 'موظف',     en: 'Employee'    }
    };
    const role = this.currentUser?.role ?? 'admin';
    return map[role]?.[this.currentLang] ?? role;
  }

  getPageTitle(): string {
    const url = this.router.url;
    const map: { match: string; ar: string; en: string }[] = [
      { match: '/admin/dashboard',     ar: 'لوحة التحكم',   en: 'Dashboard'     },
      { match: '/admin/statistics',    ar: 'الإحصائيات',    en: 'Statistics'    }, // ← replaced analytics
      { match: '/admin/projects',      ar: 'المشاريع',       en: 'Projects'      },
      { match: '/admin/services',      ar: 'الخدمات',        en: 'Services'      },
      { match: '/admin/contacts',      ar: 'رسائل التواصل',  en: 'Contacts'      },
      { match: '/admin/users',         ar: 'المشرفون',       en: 'Admins'        },
      { match: '/admin/activity-logs', ar: 'سجل النشاط',     en: 'Activity Logs' },
      { match: '/admin/notifications', ar: 'الإشعارات',      en: 'Notifications' },
      { match: '/admin/settings',      ar: 'الإعدادات',      en: 'Settings'      },
      { match: '/admin/technologies',  ar: 'التقنيات',        en: 'Technologies'  },
      { match: '/admin/testimonials',  ar: 'آراء العملاء',    en: 'Testimonials'  },
    ];
    const found = map.find(m => url.startsWith(m.match));
    return found ? found[this.currentLang] : (this.currentLang === 'ar' ? 'لوحة التحكم' : 'Dashboard');
  }

  // ── Actions ───────────────────────────────────────────────
  toggleSidebar(): void  { this.sidebarCollapsed = !this.sidebarCollapsed; }
  toggleDarkMode(): void { this.themeService.toggleTheme(); }
  switchLanguage(): void { this.translateService.setLanguage(this.currentLang === 'ar' ? 'en' : 'ar'); }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
    document.body.style.overflow = this.mobileSidebarOpen ? 'hidden' : '';
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
    document.body.style.overflow = '';
  }
}