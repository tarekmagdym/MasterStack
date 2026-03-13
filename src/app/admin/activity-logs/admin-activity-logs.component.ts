import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  ActivityLogService,
  ActivityLog,
  ActivityLogPagination,
  ActivityLogFilters,
  actionToType,
  stringToColor,
  getInitials,
  timeAgo,
  ACTION_META,
} from '../../core/services/Activity log.service';

// ─── View model ───────────────────────────────────────────────────────────────
export interface LogViewModel {
  _id:          string;
  title:        string;
  titleAr:      string;
  detail:       string;
  detailAr:     string;
  type:         'auth' | 'create' | 'update' | 'delete' | 'view';
  icon:         string;
  user:         string;
  userInitials: string;
  userColor:    string;
  ip:           string;
  time:         string;
}

@Component({
  selector:    'app-admin-activity-logs',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './admin-activity-logs.component.html',
  styleUrls:   ['./admin-activity-logs.component.scss'],
})
export class AdminActivityLogsComponent implements OnInit, OnDestroy {

  private destroy$      = new Subject<void>();
  private searchSubject = new Subject<string>();

  // ── Theme / i18n ─────────────────────────────────────────────────────────────
  isDark = false;
  isRtl  = false;

  // ── State ────────────────────────────────────────────────────────────────────
  logs:       LogViewModel[]       = [];
  pagination: ActivityLogPagination = { total: 0, page: 1, limit: 20, pages: 1 };
  isLoading   = false;
  hasError    = false;
  errorMsg    = '';

  // ── Clear logs state ─────────────────────────────────────────────────────────
  isClearing       = false;
  showClearConfirm = false;

  // ── Filters ──────────────────────────────────────────────────────────────────
  searchQuery  = '';
  actionFilter = 'all';
  userFilter   = 'all';
  uniqueUsers: string[] = [];

  // ── Pagination helpers ────────────────────────────────────────────────────────
  get currentPage() { return this.pagination.page; }
  get totalPages()  { return this.pagination.pages; }
  get pageNumbers() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  constructor(
    private translateService:  TranslateService,
    private themeService:      ThemeService,
    private activityLogService: ActivityLogService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.isDark = d);

    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.isRtl = l === 'ar');

    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.loadLogs(1));

    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────────────────────────
  loadLogs(page = this.pagination.page): void {
    this.isLoading = true;
    this.hasError  = false;

    const filters: ActivityLogFilters = { page, limit: this.pagination.limit };
    if (this.actionFilter !== 'all') filters.action = this.actionFilter;
    if (this.searchQuery.trim())     filters.search = this.searchQuery.trim();

    this.activityLogService.getLogs(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.pagination = res.pagination;
          this.logs       = res.data.map(log => this.toViewModel(log));
          this.uniqueUsers = [...new Set(this.logs.map(l => l.user))].sort();
          this.isLoading  = false;
        },
        error: (err) => {
          this.hasError  = true;
          this.errorMsg  = err?.error?.message ?? 'Failed to load activity logs.';
          this.isLoading = false;
        },
      });
  }

  // ── Clear logs ────────────────────────────────────────────────────────────────

  /** Step 1: user clicks the button → show confirm */
  promptClearLogs(): void {
    this.showClearConfirm = true;
  }

  /** Step 2: user cancels */
  cancelClear(): void {
    this.showClearConfirm = false;
  }

  /** Step 3: user confirms → call API */
  confirmClearLogs(): void {
    this.isClearing      = true;
    this.showClearConfirm = false;

    this.activityLogService.clearLogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.logs        = [];
          this.pagination  = { total: 0, page: 1, limit: 20, pages: 1 };
          this.uniqueUsers = [];
          this.isClearing  = false;
        },
        error: (err) => {
          this.errorMsg  = err?.error?.message ?? 'Failed to clear logs.';
          this.hasError  = true;
          this.isClearing = false;
        },
      });
  }

  // ── Filter handlers ───────────────────────────────────────────────────────────
  onSearchChange(): void      { this.searchSubject.next(this.searchQuery); }
  onActionFilterChange(): void { this.loadLogs(1); }
  onUserFilterChange(): void  { /* client-side only */ }

  get filteredLogs(): LogViewModel[] {
    if (this.userFilter === 'all') return this.logs;
    return this.logs.filter(l => l.user === this.userFilter);
  }

  // ── Pagination ────────────────────────────────────────────────────────────────
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.loadLogs(page);
  }

  // ── Export ────────────────────────────────────────────────────────────────────
  exportLogs(): void {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      const script    = document.createElement('script');
      script.src      = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
      script.onload   = () => this.generateExcel((window as any).XLSX);
      document.head.appendChild(script);
    } else {
      this.generateExcel(XLSX);
    }
  }

  private generateExcel(XLSX: any): void {
    const rows = this.filteredLogs.map(l => ({
      [this.isRtl ? 'النشاط'   : 'Activity']: l.title,
      [this.isRtl ? 'التفاصيل' : 'Detail']:   l.detail,
      [this.isRtl ? 'المستخدم' : 'User']:     l.user,
      [this.isRtl ? 'النوع'    : 'Type']:     l.type,
      [this.isRtl ? 'الوقت'    : 'Time']:     l.time,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.isRtl ? 'سجل النشاط' : 'Activity Logs');
    ws['!cols'] = [{ wch: 28 }, { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 16 }];
    XLSX.writeFile(wb, `activity-logs-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ── View model mapper ─────────────────────────────────────────────────────────
  private toViewModel(log: ActivityLog): LogViewModel {
    const meta          = ACTION_META[log.action] ?? ACTION_META['VIEW'];
    const userName      = log.user?.name ?? 'Unknown';
    const resourceLabel = log.resourceTitle ?? log.resourceId ?? '';
    const detail        = resourceLabel ? `${log.resourceType}: ${resourceLabel}` : log.resourceType;
    const detailAr      = resourceLabel
      ? `${this.resourceTypeAr(log.resourceType)}: ${resourceLabel}`
      : this.resourceTypeAr(log.resourceType);

    return {
      _id:          log._id,
      title:        meta.label,
      titleAr:      meta.labelAr,
      detail,
      detailAr,
      type:         actionToType(log.action),
      icon:         meta.icon,
      user:         userName,
      userInitials: getInitials(userName),
      userColor:    stringToColor(userName),
      ip:           log.ipAddress ?? '—',
      time:         timeAgo(log.createdAt),
    };
  }

  private resourceTypeAr(type: string): string {
    const map: Record<string, string> = {
      Project: 'مشروع', Service: 'خدمة', Technology: 'تقنية',
      TeamMember: 'عضو الفريق', ContactMessage: 'رسالة', User: 'مستخدم', Auth: 'مصادقة',
    };
    return map[type] ?? type;
  }
}