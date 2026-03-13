import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService, BackendNotif } from '../../core/services/Notification.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateGroup(iso: string): 'today' | 'yesterday' | 'earlier' {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return 'earlier';
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)         return 'Just now';
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Notification type → icon + UI type ───────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  info:    '<circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/>',
  success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2"/><polyline points="22 4 12 14.01 9 11.01" stroke-width="2"/>',
  warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2"/>',
  error:   '<circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke-width="2" stroke-linecap="round"/>',
};

// Map backend type → UI class used in SCSS (.contact / .system / .alert)
const TYPE_CLASS: Record<string, string> = {
  info:    'system',
  success: 'system',
  warning: 'alert',
  error:   'alert',
};

// ── View model ────────────────────────────────────────────────────────────────

export interface NotifVM {
  id:       string;
  uiType:   string;
  title:    string;
  titleAr:  string;
  desc:     string;
  descAr:   string;
  time:     string;
  date:     'today' | 'yesterday' | 'earlier';
  read:     boolean;
  icon:     string;
}

function toVM(n: BackendNotif): NotifVM {
  return {
    id:      n._id,
    uiType:  TYPE_CLASS[n.type] ?? 'system',
    title:   n.title,
    titleAr: n.titleAr  || n.title,
    desc:    n.message,
    descAr:  n.messageAr || n.message,
    time:    timeAgo(n.createdAt),
    date:    dateGroup(n.createdAt),
    read:    n.isRead,
    icon:    TYPE_ICONS[n.type] ?? TYPE_ICONS['info'],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.scss']
})
export class AdminNotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isDark  = false;
  isRtl   = false;
  filter  = 'all';

  notifications: NotifVM[] = [];
  loading  = false;
  error    = '';

  // ── Computed ──────────────────────────────────────────────────────────────────

  get filteredNotifs(): NotifVM[] {
    if (this.filter === 'all')    return this.notifications;
    if (this.filter === 'unread') return this.notifications.filter(n => !n.read);
    return this.notifications.filter(n => n.uiType === this.filter);
  }

  get unreadCount(): number  { return this.notifications.filter(n => !n.read).length; }
  get systemCount(): number  { return this.notifications.filter(n => n.uiType === 'system').length; }
  get alertCount():  number  { return this.notifications.filter(n => n.uiType === 'alert').length; }

  get groupedNotifs(): { label: string; labelAr: string; items: NotifVM[] }[] {
    const groups: { label: string; labelAr: string; items: NotifVM[] }[] = [];
    const config = [
      { key: 'today',     label: 'Today',     labelAr: 'اليوم'  },
      { key: 'yesterday', label: 'Yesterday', labelAr: 'أمس'    },
      { key: 'earlier',   label: 'Earlier',   labelAr: 'سابقاً' },
    ];
    config.forEach(({ key, label, labelAr }) => {
      const items = this.filteredNotifs.filter(n => n.date === key);
      if (items.length) groups.push({ label, labelAr, items });
    });
    return groups;
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  onNotifClick(n: NotifVM): void {
    if (!n.read) {
      n.read = true;
      this.notifService.markAsRead(n.id).subscribe();
    }
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => this.notifications.forEach(n => n.read = true),
    });
  }

  dismiss(id: string): void {
    this.notifService.delete(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      },
      error: () => {
        this.error = this.isRtl ? 'تعذّر حذف الإشعار' : 'Could not delete notification';
      }
    });
  }

  clearAll(): void {
    // Delete all one by one (no bulk endpoint needed — backend handles it per-id)
    // Or just clear locally if you want UX speed and rely on dismiss per item
    const ids = [...this.notifications.map(n => n.id)];
    let completed = 0;
    if (!ids.length) return;

    ids.forEach(id => {
      this.notifService.delete(id).subscribe({
        next: () => {
          completed++;
          this.notifications = this.notifications.filter(n => n.id !== id);
        },
        error: () => {
          this.error = this.isRtl ? 'تعذّر مسح الإشعارات' : 'Could not clear notifications';
        }
      });
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  constructor(
    private translateService: TranslateService,
    private themeService:     ThemeService,
    private notifService:     NotificationService,
  ) {}

  ngOnInit(): void {
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.isDark = d);

    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.isRtl = l === 'ar');

    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotifications(): void {
    this.loading = true;
    this.error   = '';

    this.notifService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.notifications = (res.data ?? []).map(toVM);
          this.loading = false;
        },
        error: () => {
          this.error   = this.isRtl ? 'تعذّر تحميل الإشعارات' : 'Could not load notifications';
          this.loading = false;
        }
      });
  }
}