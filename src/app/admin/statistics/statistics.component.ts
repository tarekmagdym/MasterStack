import {
  Component, OnInit, OnDestroy, HostListener
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Subscription }  from 'rxjs';
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

echarts.use([
  LineChart, BarChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  CanvasRenderer,
]);

import { TranslateService } from '../../core/services/translate.service';
import { ThemeService }     from '../../core/services/theme.service';
import { AuthService }      from '../../core/services/auth.service';
import { ApiService }       from '../../core/services/api.service';
import { StatisticsResponse } from '../../core/constants/api-endpoints';
import {
  stringToColor, getInitials, ACTION_META, actionToType,
} from '../../core/services/Activity log.service';

// ── Palette ───────────────────────────────────────────────────────────────────
const TEAL   = '#26cabc';
const BLUE   = '#0e3581';
const ORANGE = '#f59e0b';
const PURPLE = '#7c3aed';
const GREEN  = '#16a34a';
const PINK   = '#e11d8a';
const RED    = '#ef4444';

const PALETTE = [TEAL, BLUE, ORANGE, PURPLE, GREEN, PINK, RED];

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
    style({ opacity: 0, transform: 'translateY(-10px)' }),
    animate('380ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);
const fadeUp = trigger('fadeUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(14px)' }),
    animate('420ms 80ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);
const cardEnter = trigger('cardEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(16px) scale(0.97)' }),
    animate('350ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  animations: [fadeSlideDown, fadeUp, cardEnter],
})
export class StatisticsComponent implements OnInit, OnDestroy {

  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode   = false;
  isSuperAdmin = false;
  stats: StatisticsResponse | null = null;
  loading = true;
  error   = false;

  kpiCards: any[]     = [];
  servicesItems: any[] = [];

  // ── ECharts options ───────────────────────────────────────────────────────
  projectsLineOpt: EChartsOption | null = null;
  statusPieOpt:    EChartsOption | null = null;
  categoryPieOpt:  EChartsOption | null = null;
  messagesBarOpt:  EChartsOption | null = null;
  activityBarOpt:  EChartsOption | null = null;

  echartsTheme = '';

  resColors = PALETTE;
  skelH     = [42,68,52,84,60,92,74,56,88,50,76,96];

  private chartInstances: Map<string, any> = new Map();
  private subs: Subscription[] = [];

  get readRate(): number {
    const t = this.stats?.summary?.totalMessages ?? 0;
    const r = this.stats?.messages?.totalRead    ?? 0;
    return t ? Math.round((r / t) * 100) : 0;
  }

  constructor(
    private translate: TranslateService,
    private theme:     ThemeService,
    private auth:      AuthService,
    private api:       ApiService,
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.auth.isSuperAdmin();
    this.currentLang  = this.translate.currentLang as 'ar' | 'en';

    this.subs.push(
      this.translate.currentLang$.subscribe(l => {
        this.currentLang = l as 'ar' | 'en';
        this.buildAll();
      }),
      this.theme.isDarkMode$.subscribe(d => {
        this.isDarkMode   = d;
        this.echartsTheme = d ? 'dark' : '';
        if (this.stats) { this.buildAll(); }
      }),
    );

    this.loadStats();
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  @HostListener('window:resize')
  onResize(): void { this.chartInstances.forEach(inst => inst?.resize()); }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadStats(): void {
    this.loading = true; this.error = false;
    this.api.get<{ success: boolean; data: StatisticsResponse }>('/admin/statistics').subscribe({
      next: r => { this.stats = r.data; this.buildAll(); this.loading = false; },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  // ── Build all ─────────────────────────────────────────────────────────────
  private buildAll(): void {
    this.buildKpi();
    this.buildServicesItems();
    this.buildCharts();
  }

  private buildKpi(): void {
    const s = this.stats;
    this.kpiCards = [
      { label:'Total Projects', labelAr:'إجمالي المشاريع', value: s?.summary?.totalProjects ?? 0, color:'teal',
        icon:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke-width="2"/>' },
      { label:'Services', labelAr:'الخدمات', value: s?.summary?.totalServices ?? 0, color:'blue',
        icon:'<rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2"/><line x1="8" y1="21" x2="16" y2="21" stroke-width="2"/>' },
      { label:'Messages', labelAr:'الرسائل', value: s?.summary?.totalMessages ?? 0, color:'orange',
        icon:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2"/>' },
      { label:'Technologies', labelAr:'التقنيات', value: s?.summary?.totalTech ?? 0, color:'purple',
        icon:'<polyline points="16 18 22 12 16 6" stroke-width="2"/><polyline points="8 6 2 12 8 18" stroke-width="2"/>' },
      ...(this.isSuperAdmin ? [
        { label:'Users', labelAr:'المستخدمون', value: s?.summary?.totalUsers ?? 0, color:'green',
          icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke-width="2"/>' },
      ] : []),
    ];
  }

  private buildServicesItems(): void {
    const s = this.stats;
    this.servicesItems = [
      { label:'Total',     labelAr:'إجمالي', value: s?.services?.total     ?? 0, color:'teal',
        icon:'<circle cx="12" cy="12" r="10" stroke-width="2"/>' },
      { label:'Published', labelAr:'منشورة', value: s?.services?.published ?? 0, color:'green',
        icon:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2"/><polyline points="22 4 12 14.01 9 11.01" stroke-width="2"/>' },
      { label:'Featured',  labelAr:'مميزة',  value: s?.services?.featured  ?? 0, color:'orange',
        icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke-width="2"/>' },
      { label:'Draft',     labelAr:'مسودة',  value: s?.services?.draft     ?? 0, color:'purple',
        icon:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2"/>' },
    ];
  }

  // ── Build ECharts options ─────────────────────────────────────────────────
  private buildCharts(): void {
    const isDark    = this.isDarkMode;
    const axisColor = isDark ? '#7880a4' : '#9ca3af';
    const gridColor = isDark ? 'rgba(46,49,80,0.6)' : 'rgba(14,53,129,0.07)';
    const bgCard    = isDark ? '#1e2135' : '#ffffff';

    const mn = (n: number) =>
      this.currentLang === 'ar' ? MONTHS_AR[n] : MONTHS_EN[n];

    const tooltipStyle = {
      backgroundColor: isDark ? '#252840' : '#fff',
      borderColor:     isDark ? '#2e3150' : '#e5e7eb',
      textStyle: { color: isDark ? '#e2e4f0' : '#1a1a2e', fontFamily: 'IBM Plex Sans', fontSize: 12 },
    };

    // ── 1. Projects line ────────────────────────────────────────────────────
    const projData   = this.stats?.projects?.overTime ?? [];
    this.projectsLineOpt = {
      backgroundColor: 'transparent',
      grid: { top: 20, right: 24, bottom: 32, left: 44, containLabel: false },
      tooltip: { trigger: 'axis', ...tooltipStyle, axisPointer: { lineStyle: { color: TEAL, width: 1.5, type: 'dashed' } } },
      xAxis: {
        type: 'category', data: projData.map(p => mn(p._id.month)),
        axisLine: { lineStyle: { color: gridColor } }, axisTick: { show: false },
        axisLabel: { color: axisColor, fontSize: 11, fontFamily: 'IBM Plex Sans' },
      },
      yAxis: {
        type: 'value', minInterval: 1,
        splitLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: axisColor, fontSize: 11, fontFamily: 'IBM Plex Sans' },
      },
      series: [{
        type: 'line', data: projData.map(p => p.count), smooth: true,
        symbol: 'circle', symbolSize: 7,
        lineStyle: { color: TEAL, width: 2.5 },
        itemStyle: { color: TEAL, borderColor: bgCard, borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(38,202,188,0.22)' },
            { offset: 1, color: 'rgba(38,202,188,0.02)' },
          ]),
        },
      }],
    } as EChartsOption;

    // ── 2. Status donut ─────────────────────────────────────────────────────
    const bs = this.stats?.projects?.byStatus;
    const statusData = [
      { value: bs?.published ?? 0, name: this.currentLang === 'ar' ? 'منشورة' : 'Published', itemStyle: { color: TEAL } },
      { value: bs?.draft     ?? 0, name: this.currentLang === 'ar' ? 'مسودة'  : 'Draft',     itemStyle: { color: ORANGE } },
      { value: bs?.featured  ?? 0, name: this.currentLang === 'ar' ? 'مميزة'  : 'Featured',  itemStyle: { color: PURPLE } },
    ].filter(d => d.value > 0);

    this.statusPieOpt = this.buildDonut(statusData, tooltipStyle, axisColor);

    // ── 3. Category donut ───────────────────────────────────────────────────
    const catLabels: Record<string, {en:string;ar:string}> = {
      web:{en:'Web',ar:'ويب'}, mobile:{en:'Mobile',ar:'موبايل'},
      ecommerce:{en:'E-Commerce',ar:'تجارة إلكترونية'}, saas:{en:'SaaS',ar:'SaaS'},
    };
    const catData = (this.stats?.projects?.byCategory ?? []).map((c, i) => ({
      value: c.count,
      name: this.currentLang === 'ar' ? (catLabels[c._id]?.ar ?? c._id) : (catLabels[c._id]?.en ?? c._id),
      itemStyle: { color: PALETTE[i % PALETTE.length] },
    }));
    this.categoryPieOpt = this.buildDonut(catData, tooltipStyle, axisColor);

    // ── 4. Messages bar ─────────────────────────────────────────────────────
    const msgData  = this.stats?.messages?.overTime ?? [];
    const readLbl  = this.currentLang === 'ar' ? 'مقروءة'     : 'Read';
    const unrdLbl  = this.currentLang === 'ar' ? 'غير مقروءة' : 'Unread';

    this.messagesBarOpt = {
      backgroundColor: 'transparent',
      grid: { top: 16, right: 16, bottom: 30, left: 40, containLabel: false },
      tooltip: { trigger: 'axis', ...tooltipStyle, axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category', data: msgData.map(m => mn(m._id.month)),
        axisLine: { lineStyle: { color: gridColor } }, axisTick: { show: false },
        axisLabel: { color: axisColor, fontSize: 10, fontFamily: 'IBM Plex Sans' },
      },
      yAxis: {
        type: 'value', minInterval: 1,
        splitLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: axisColor, fontSize: 10, fontFamily: 'IBM Plex Sans' },
      },
      series: [
        {
          name: readLbl, type: 'bar', data: msgData.map(m => m.total - m.unread),
          barMaxWidth: 16,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0,0,0,1,[
              {offset:0,color:'#22c55e'},{offset:1,color:'#16a34a'},
            ]),
            borderRadius: [4,4,0,0],
          },
        },
        {
          name: unrdLbl, type: 'bar', data: msgData.map(m => m.unread),
          barMaxWidth: 16,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0,0,0,1,[
              {offset:0,color:'#fbbf24'},{offset:1,color:'#f59e0b'},
            ]),
            borderRadius: [4,4,0,0],
          },
        },
      ],
    } as EChartsOption;

    // ── 5. Activity bar ─────────────────────────────────────────────────────
    const actData  = this.stats?.activity?.overTime ?? [];
    this.activityBarOpt = {
      backgroundColor: 'transparent',
      grid: { top: 20, right: 24, bottom: 32, left: 44, containLabel: false },
      tooltip: { trigger: 'axis', ...tooltipStyle, axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category', data: actData.map(a => mn(a._id.month)),
        axisLine: { lineStyle: { color: gridColor } }, axisTick: { show: false },
        axisLabel: { color: axisColor, fontSize: 11, fontFamily: 'IBM Plex Sans' },
      },
      yAxis: {
        type: 'value', minInterval: 1,
        splitLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: axisColor, fontSize: 11, fontFamily: 'IBM Plex Sans' },
      },
      series: [{
        type: 'bar', data: actData.map(a => a.count),
        barMaxWidth: 28,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0,0,0,1,[
            {offset:0,color:PURPLE},{offset:1,color:'#5b21b6'},
          ]),
          borderRadius: [5,5,0,0],
        },
      }],
    } as EChartsOption;
  }

  // ── Shared donut builder ──────────────────────────────────────────────────
  private buildDonut(data: any[], tooltipStyle: any, axisColor: string): EChartsOption {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', ...tooltipStyle },
      legend: {
        bottom: 0, itemWidth: 9, itemHeight: 9, icon: 'circle',
        textStyle: { color: axisColor, fontSize: 11, fontFamily: 'IBM Plex Sans' },
      },
      series: [{
        type: 'pie', radius: ['48%','72%'], center: ['50%','43%'],
        data, label: { show: false }, avoidLabelOverlap: true,
        emphasis: { scale: true, scaleSize: 5, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' } },
      }],
    } as EChartsOption;
  }

  // ── Chart init callback ───────────────────────────────────────────────────
  onChartInit(chartInstance: any, key: string): void {
    this.chartInstances.set(key, chartInstance);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getColor(n: string)     { return stringToColor(n); }
  getInit(n: string)      { return getInitials(n); }
  getActionType(a: string){ return actionToType(a); }
  getActionIcon(a: string){ return ACTION_META[a]?.icon ?? ''; }
  getActionLabel(a: string) {
    const m = ACTION_META[a]; return m ? (this.currentLang === 'ar' ? m.labelAr : m.label) : a;
  }
  getCatLabel(cat: string): string {
    const m: Record<string,{en:string;ar:string}> = {
      web:{en:'Web',ar:'ويب'}, mobile:{en:'Mobile',ar:'موبايل'},
      ecommerce:{en:'E-Commerce',ar:'تجارة إلكترونية'}, saas:{en:'SaaS',ar:'SaaS'},
    };
    return this.currentLang === 'ar' ? (m[cat]?.ar ?? cat) : (m[cat]?.en ?? cat);
  }
  getCatPct(v: number, list: {count:number}[]): number {
    const t = list.reduce((s,c) => s + c.count, 0);
    return t ? Math.round((v / t) * 100) : 0;
  }
  getActPct(v: number, list: {count:number}[]): number {
    const mx = Math.max(...list.map(x => x.count), 1);
    return Math.round((v / mx) * 100);
  }
  getRoleLabel(role: string): string {
    const m: Record<string,{ar:string;en:string}> = {
      super_admin:{ar:'مدير عام',en:'Super Admin'}, admin:{ar:'مدير',en:'Admin'}, employee:{ar:'موظف',en:'Employee'},
    };
    return this.currentLang === 'ar' ? (m[role]?.ar ?? role) : (m[role]?.en ?? role);
  }
}