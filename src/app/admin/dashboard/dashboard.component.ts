import {
  Component, OnInit, OnDestroy, HostListener, NgZone
} from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription }      from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

// ngx-echarts — all modules registered inline, no external setup file needed
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { LineChart, BarChart, PieChart }          from 'echarts/charts';
import {
  GridComponent, TooltipComponent,
  LegendComponent, DataZoomComponent,
}                                                  from 'echarts/components';
import { CanvasRenderer }                          from 'echarts/renderers';

// Register everything once at module level (idempotent — safe to call twice)
echarts.use([
  LineChart, BarChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  CanvasRenderer,
]);

import { TranslateService }  from '../../core/services/translate.service';
import { ThemeService }      from '../../core/services/theme.service';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { ApiService }        from '../../core/services/api.service';
import { ContactService, ContactMessage } from '../../core/services/Contact.service';
import {
  ActivityLogService, ActivityLog,
  actionToType, stringToColor, getInitials, timeAgo, ACTION_META,
} from '../../core/services/Activity log.service';
import { StatisticsResponse } from '../../core/constants/api-endpoints';

// ── Chart color palette ───────────────────────────────────────────────────────
const TEAL   = '#26cabc';
const BLUE   = '#0e3581';
const ORANGE = '#f59e0b';
const PURPLE = '#7c3aed';
const GREEN  = '#16a34a';
const PINK   = '#e11d8a';

const PALETTE = [TEAL, BLUE, ORANGE, PURPLE, GREEN, PINK];

// ── Month labels ──────────────────────────────────────────────────────────────
const MONTHS_EN: Record<number, string> = {
  1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',
  7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec',
};
const MONTHS_AR: Record<number, string> = {
  1:'يناير',2:'فبراير',3:'مارس',4:'أبريل',5:'مايو',6:'يونيو',
  7:'يوليو',8:'أغسطس',9:'سبتمبر',10:'أكتوبر',11:'نوفمبر',12:'ديسمبر',
};

// ── Animations ────────────────────────────────────────────────────────────────
const fadeSlideDown = trigger('fadeSlideDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-12px)' }),
    animate('400ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);
const fadeUp = trigger('fadeUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(16px)' }),
    animate('450ms 120ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);
const cardEnter = trigger('cardEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px) scale(0.97)' }),
    animate('380ms var(--delay, 0ms) cubic-bezier(0.4,0,0.2,1)',
      style({ opacity: 1, transform: 'none' })),
  ]),
]);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [fadeSlideDown, fadeUp, cardEnter],
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── UI state ──────────────────────────────────────────────────────────────
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode   = false;
  isSuperAdmin = false;
  currentUser: AuthUser | null = null;
  lastUpdated  = '';

  loading          = true;
  logsLoading      = true;
  messagesLoading  = true;

  // ── Data ──────────────────────────────────────────────────────────────────
  stats: StatisticsResponse | null = null;
  recentLogs: ActivityLog[]        = [];
  recentMessages: ContactMessage[] = [];
  topUsers: { name: string; email: string; role: string; count: number }[] = [];

  // ── KPI cards config ──────────────────────────────────────────────────────
  kpiCards: any[] = [];

  // ── Quick actions ─────────────────────────────────────────────────────────
  // FIX: Corrected routes to match app.routes.ts:
  //   - /admin/projects/create → /admin/projects (no create child route exists)
  //   - /admin/messages        → /admin/contacts  (route is named 'contacts')
  //   - /admin/team            → /admin/users     (no team route exists; users is the closest match)
  quickActions = [
    { route: '/admin/projects', label: 'New Project', labelAr: 'مشروع جديد', color: 'teal',
      icon: '<line x1="12" y1="5" x2="12" y2="19" stroke-width="2"/><line x1="5" y1="12" x2="19" y2="12" stroke-width="2"/>' },
    { route: '/admin/services', label: 'Services', labelAr: 'الخدمات', color: 'blue',
      icon: '<rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2"/><line x1="8" y1="21" x2="16" y2="21" stroke-width="2"/>' },
    { route: '/admin/contacts', label: 'Messages', labelAr: 'الرسائل', color: 'orange',
      icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2"/>' },
    { route: '/admin/users', label: 'Team', labelAr: 'الفريق', color: 'purple',
      icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke-width="2"/>' },
    { route: '/admin/technologies', label: 'Tech Stack', labelAr: 'التقنيات', color: 'green',
      icon: '<polyline points="16 18 22 12 16 6" stroke-width="2"/><polyline points="8 6 2 12 8 18" stroke-width="2"/>' },
    { route: '/admin/statistics', label: 'Statistics', labelAr: 'الإحصائيات', color: 'pink',
      icon: '<line x1="18" y1="20" x2="18" y2="10" stroke-width="2"/><line x1="12" y1="20" x2="12" y2="4" stroke-width="2"/><line x1="6" y1="20" x2="6" y2="14" stroke-width="2"/>' },
  ];

  // ── Status rows ───────────────────────────────────────────────────────────
  statusRows: { en: string; ar: string; value: number; cls: string }[] = [];

  // ── ECharts options ───────────────────────────────────────────────────────
  projectsLineOpt:  EChartsOption | null = null;
  categoryPieOpt:   EChartsOption | null = null;
  messagesBarOpt:   EChartsOption | null = null;

  // Map of chart instances for resize
  private chartInstances: Map<string, any> = new Map();

  echartsTheme = '';   // '' = default light; set to 'dark' via isDarkMode

  skelH = [40,65,50,80,60,90,70,55,85,48,72,95];

  get readRate(): number {
    const t = this.stats?.summary?.totalMessages ?? 0;
    const r = this.stats?.messages?.totalRead    ?? 0;
    return t ? Math.round((r / t) * 100) : 0;
  }

  private subs: Subscription[] = [];

  constructor(
    private translate: TranslateService,
    private theme:     ThemeService,
    private auth:      AuthService,
    private api:       ApiService,
    private contact:   ContactService,
    private actLog:    ActivityLogService,
    private router:    Router,
    private zone:      NgZone,
  ) {}

  ngOnInit(): void {
    this.currentUser  = this.auth.getCurrentUser();
    this.isSuperAdmin = this.auth.isSuperAdmin();
    this.currentLang  = this.translate.currentLang as 'ar' | 'en';

    this.subs.push(
      this.translate.currentLang$.subscribe(l => {
        this.currentLang = l as 'ar' | 'en';
        this.buildKpi();
        if (this.stats) { this.buildCharts(); }
      }),
      this.theme.isDarkMode$.subscribe(d => {
        this.isDarkMode    = d;
        this.echartsTheme  = d ? 'dark' : '';
        if (this.stats) { this.buildCharts(); }
      }),
    );

    this.loadDashboard();
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  @HostListener('window:resize')
  onResize(): void {
    this.chartInstances.forEach(inst => inst?.resize());
  }

  // ── Public refresh ────────────────────────────────────────────────────────
  loadDashboard(): void {
    this.lastUpdated = new Date().toLocaleTimeString(
      this.currentLang === 'ar' ? 'ar-EG' : 'en-US',
      { hour: '2-digit', minute: '2-digit' });
    this.loadStats();
    this.loadLogs();
    this.loadMessages();
  }

  // ── Loaders ───────────────────────────────────────────────────────────────
  private loadStats(): void {
    this.loading = true;
    this.api.get<{ success: boolean; data: StatisticsResponse }>('/admin/statistics').subscribe({
      next: res => {
        this.stats    = res.data;
        this.topUsers = res.data?.activity?.topUsers ?? [];
        this.buildKpi();
        this.buildStatusRows();
        this.buildCharts();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private loadLogs(): void {
    this.logsLoading = true;
    this.actLog.getLogs({ page: 1, limit: 10 }).subscribe({
      next: r => { this.recentLogs = r.data; this.logsLoading = false; },
      error: () => { this.logsLoading = false; },
    });
  }

  private loadMessages(): void {
    this.messagesLoading = true;
    this.contact.getMessages({ page: 1, limit: 5 }).subscribe({
      next: r => { this.recentMessages = r.data; this.messagesLoading = false; },
      error: () => { this.messagesLoading = false; },
    });
  }

  // ── Build KPI config ──────────────────────────────────────────────────────
  private buildKpi(): void {
    const s = this.stats;
    this.kpiCards = [
      {
        label: 'Total Projects', labelAr: 'إجمالي المشاريع',
        value: s?.summary?.totalProjects ?? 0,
        color: 'teal', trend: true,
        footer: 'Published: ', footerAr: 'منشورة: ',
        footerVal: s?.projects?.byStatus?.published ?? 0,
        icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke-width="2"/>',
      },
      {
        label: 'Services', labelAr: 'الخدمات',
        value: s?.summary?.totalServices ?? 0,
        color: 'blue',
        footer: 'Active: ', footerAr: 'نشطة: ',
        footerVal: s?.services?.published ?? 0,
        icon: '<rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2"/><line x1="8" y1="21" x2="16" y2="21" stroke-width="2"/>',
      },
      {
        label: 'Messages', labelAr: 'الرسائل',
        value: s?.summary?.totalMessages ?? 0,
        color: 'orange',
        badge: (s?.summary?.totalUnread ?? 0) > 0 ? s?.summary?.totalUnread : null,
        footer: 'Unread: ', footerAr: 'غير مقروءة: ',
        footerVal: s?.summary?.totalUnread ?? 0, footerWarn: true,
        icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2"/>',
      },
      {
        label: 'Technologies', labelAr: 'التقنيات',
        value: s?.summary?.totalTech ?? 0,
        color: 'purple',
        footer: 'In projects', footerAr: 'مستخدمة', footerVal: '',
        icon: '<polyline points="16 18 22 12 16 6" stroke-width="2"/><polyline points="8 6 2 12 8 18" stroke-width="2"/>',
      },
      ...(this.isSuperAdmin ? [{
        label: 'Users', labelAr: 'المستخدمون',
        value: s?.summary?.totalUsers ?? 0,
        color: 'green',
        footer: 'Admins & employees', footerAr: 'مدراء وموظفون', footerVal: '',
        icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke-width="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke-width="2"/>',
      }] : []),
    ];
  }

  private buildStatusRows(): void {
    const bs = this.stats?.projects?.byStatus;
    this.statusRows = [
      { en: 'Published', ar: 'منشورة', value: bs?.published ?? 0, cls: 'teal' },
      { en: 'Draft',     ar: 'مسودة',  value: bs?.draft     ?? 0, cls: 'orange' },
      { en: 'Featured',  ar: 'مميزة',  value: bs?.featured  ?? 0, cls: 'purple' },
    ];
  }

  // ── Build ECharts options ─────────────────────────────────────────────────
  private buildCharts(): void {
    const isDark  = this.isDarkMode;
    const isRtl   = this.currentLang === 'ar';
    const axisColor = isDark ? '#7880a4' : '#9ca3af';
    const gridColor = isDark ? 'rgba(46,49,80,0.6)' : 'rgba(14,53,129,0.07)';
    const bgColor   = isDark ? '#1e2135'             : '#ffffff';

    const mn = (n: number) =>
      this.currentLang === 'ar' ? MONTHS_AR[n] : MONTHS_EN[n];

    // ── 1. Projects Line ────────────────────────────────────────────────────
    const projData = this.stats?.projects?.overTime ?? [];
    const projCategories = projData.map(p => mn(p._id.month));
    const projValues     = projData.map(p => p.count);

    this.projectsLineOpt = {
      backgroundColor: 'transparent',
      grid: { top: 20, right: 20, bottom: 30, left: 40, containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#252840' : '#fff',
        borderColor: isDark ? '#2e3150' : '#e5e7eb',
        textStyle: { color: isDark ? '#e2e4f0' : '#1a1a2e', fontFamily: 'IBM Plex Sans' },
        axisPointer: { lineStyle: { color: TEAL, width: 1.5, type: 'dashed' } },
      },
      xAxis: {
        type: 'category',
        data: projCategories,
        axisLine:  { lineStyle: { color: gridColor } },
        axisTick:  { show: false },
        axisLabel: { color: axisColor, fontSize: 11, fontFamily: 'IBM Plex Sans' },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: axisColor, fontSize: 11, fontFamily: 'IBM Plex Sans' },
      },
      series: [{
        type: 'line',
        data: projValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: TEAL, width: 2.5 },
        itemStyle: { color: TEAL, borderColor: bgColor, borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(38,202,188,0.25)' },
            { offset: 1, color: 'rgba(38,202,188,0.02)' },
          ]),
        },
      }],
    } as EChartsOption;

    // ── 2. Category Donut ───────────────────────────────────────────────────
    const catLabels: Record<string, { en: string; ar: string }> = {
      web:       { en: 'Web',        ar: 'ويب' },
      mobile:    { en: 'Mobile',     ar: 'موبايل' },
      ecommerce: { en: 'E-Commerce', ar: 'تجارة إلكترونية' },
      saas:      { en: 'SaaS',       ar: 'SaaS' },
    };
    const catData = (this.stats?.projects?.byCategory ?? []).map((c, i) => ({
      value: c.count,
      name: this.currentLang === 'ar'
        ? (catLabels[c._id]?.ar ?? c._id)
        : (catLabels[c._id]?.en ?? c._id),
      itemStyle: { color: PALETTE[i % PALETTE.length] },
    }));

    this.categoryPieOpt = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#252840' : '#fff',
        borderColor: isDark ? '#2e3150' : '#e5e7eb',
        textStyle: { color: isDark ? '#e2e4f0' : '#1a1a2e', fontFamily: 'IBM Plex Sans' },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        bottom: 0,
        itemWidth: 10, itemHeight: 10,
        textStyle: { color: axisColor, fontSize: 11, fontFamily: 'IBM Plex Sans' },
        icon: 'circle',
      },
      series: [{
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        data: catData,
        label: { show: false },
        emphasis: {
          scale: true, scaleSize: 6,
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' },
        },
      }],
    } as EChartsOption;

    // ── 3. Messages Grouped Bar ─────────────────────────────────────────────
    const msgData  = this.stats?.messages?.overTime ?? [];
    const msgCats  = msgData.map(m => mn(m._id.month));
    const readVals = msgData.map(m => m.total - m.unread);
    const unrdVals = msgData.map(m => m.unread);

    const readLabel  = this.currentLang === 'ar' ? 'مقروءة'     : 'Read';
    const unrdLabel  = this.currentLang === 'ar' ? 'غير مقروءة' : 'Unread';

    this.messagesBarOpt = {
      backgroundColor: 'transparent',
      grid: { top: 16, right: 16, bottom: 30, left: 40, containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#252840' : '#fff',
        borderColor: isDark ? '#2e3150' : '#e5e7eb',
        textStyle: { color: isDark ? '#e2e4f0' : '#1a1a2e', fontFamily: 'IBM Plex Sans' },
        axisPointer: { type: 'shadow' },
      },
      legend: { show: false },   // using inline legend in template
      xAxis: {
        type: 'category',
        data: msgCats,
        axisLine:  { lineStyle: { color: gridColor } },
        axisTick:  { show: false },
        axisLabel: { color: axisColor, fontSize: 10, fontFamily: 'IBM Plex Sans' },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: axisColor, fontSize: 10, fontFamily: 'IBM Plex Sans' },
      },
      series: [
        {
          name: readLabel, type: 'bar', data: readVals, barMaxWidth: 16,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#22c55e' },
              { offset: 1, color: '#16a34a' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: unrdLabel, type: 'bar', data: unrdVals, barMaxWidth: 16,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#fbbf24' },
              { offset: 1, color: '#f59e0b' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    } as EChartsOption;
  }

  // ── Chart init callback ───────────────────────────────────────────────────
  onChartInit(chartInstance: any, key: string): void {
    this.chartInstances.set(key, chartInstance);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getColor(name: string)    { return stringToColor(name); }
  getInit(name: string)     { return getInitials(name); }
  timeAgo(d: string)        { return timeAgo(d); }
  getActionType(a: string)  { return actionToType(a); }
  getActionIcon(a: string)  { return ACTION_META[a]?.icon ?? ''; }
  getActionLabel(a: string) {
    const m = ACTION_META[a];
    return m ? (this.currentLang === 'ar' ? m.labelAr : m.label) : a;
  }

  getStatusPct(v: number): number {
    const total = this.stats?.summary?.totalProjects || 1;
    return Math.round((v / total) * 100);
  }

  getRoleLabel(role: string): string {
    const m: Record<string, { ar: string; en: string }> = {
      super_admin: { ar: 'مدير عام', en: 'Super Admin' },
      admin:       { ar: 'مدير',     en: 'Admin' },
      employee:    { ar: 'موظف',     en: 'Employee' },
    };
    return this.currentLang === 'ar' ? (m[role]?.ar ?? role) : (m[role]?.en ?? role);
  }

  // FIX: was navigating to /admin/messages/:id — corrected to /admin/contacts/:id
  goMsg(id: string): void { this.router.navigate(['/admin/contacts', id]); }
}