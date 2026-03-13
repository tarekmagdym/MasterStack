import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { ServiceService, Service } from '../../core/services/Service.service';
import { Subject, takeUntil } from 'rxjs';

declare const AOS: any;

interface MainService {
  id: string;
  badge: string;
  icon: string;
  technologies: string[];
}

interface AdditionalService {
  id: string;
  icon: string;
}

interface ProcessStep {
  id: string;
  number: string;
}

interface Benefit {
  id: string;
  icon: string;
}

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './services-page.component.html',
  styleUrls: ['./services-page.component.scss']
})
export class ServicesPageComponent implements OnInit, OnDestroy {

  private translateService = inject(TranslateService);
  private themeService     = inject(ThemeService);
  private serviceApi       = inject(ServiceService);
  private titleService     = inject(Title);
  private metaService      = inject(Meta);

  currentLang: 'ar' | 'en' = 'en';
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  dbServices: Service[] = [];
  dbServicesLoading = false;
  dbServicesError   = false;

  mainServices: MainService[] = [
    { id: 'mobile',       badge: '01', icon: 'mobile',       technologies: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'Firebase'] },
    { id: 'website',      badge: '02', icon: 'website',      technologies: ['Angular', 'React', 'Vue.js', 'Node.js', 'WordPress'] },
    { id: 'subscription', badge: '03', icon: 'subscription', technologies: ['Stripe', 'PayPal', 'Laravel', 'MongoDB', 'AWS'] }
  ];

  additionalServices: AdditionalService[] = [
    { id: 'cybersecurity', icon: 'shield'    },
    { id: 'api',           icon: 'box'       },
    { id: 'consulting',    icon: 'book'      },
    { id: 'ai',            icon: 'sparkles'  },
    { id: 'analytics',     icon: 'chart'     },
    { id: 'support',       icon: 'users'     }
  ];

  processSteps: ProcessStep[] = [
    { id: 'consultation', number: '01' },
    { id: 'planning',     number: '02' },
    { id: 'design',       number: '03' },
    { id: 'development',  number: '04' },
    { id: 'launch',       number: '05' }
  ];

  benefits: Benefit[] = [
    { id: 'speed',    icon: 'zap'    },
    { id: 'quality',  icon: 'star'   },
    { id: 'security', icon: 'shield' },
    { id: 'support',  icon: 'user'   }
  ];

  constructor() {}

  ngOnInit(): void {
    this.currentLang = this.translateService.currentLang as 'ar' | 'en';
    this.isDarkMode  = this.themeService.isDarkMode;
    this.updateSeoTags();
    this.setDirection();
    this.initializeAOS();
    this.scrollToTop();

    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        const prev       = this.currentLang;
        this.currentLang = lang as 'ar' | 'en';
        this.updateSeoTags();
        this.setDirection();
        this.refreshAOS();

        if (lang !== prev || this.dbServices.length === 0) {
          this.loadServices();
        }
      });

    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => { this.isDarkMode = isDark; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateSeoTags(): void {
    if (this.currentLang === 'ar') {
      this.titleService.setTitle('خدماتنا | ماستر ستاك - حلول رقمية احترافية لعملك');
      this.metaService.updateTag({ name: 'description', content: 'ماستر ستاك تقدم خدمات تقنية شاملة تشمل تطوير تطبيقات الويب والموبايل، الاستشارات التقنية، تكامل الذكاء الاصطناعي، وحلول الأمن السيبراني.' });
      this.metaService.updateTag({ property: 'og:title', content: 'خدماتنا | ماستر ستاك - حلول رقمية احترافية لعملك' });
      this.metaService.updateTag({ property: 'og:description', content: 'ماستر ستاك تقدم خدمات تقنية شاملة تشمل تطوير تطبيقات الويب والموبايل، الاستشارات التقنية، وتكامل الذكاء الاصطناعي.' });
    } else {
      this.titleService.setTitle('Our Services | MasterStack - Professional Digital Solutions for Your Business');
      this.metaService.updateTag({ name: 'description', content: 'MasterStack offers comprehensive tech services including web & mobile app development, technical consulting, AI integration, cybersecurity, and 24/7 support.' });
      this.metaService.updateTag({ property: 'og:title', content: 'Our Services | MasterStack - Professional Digital Solutions for Your Business' });
      this.metaService.updateTag({ property: 'og:description', content: 'MasterStack offers comprehensive tech services including web & mobile app development, technical consulting, AI integration, and cybersecurity solutions.' });
    }
  }

  loadServices(): void {
    this.dbServicesLoading = true;
    this.dbServicesError   = false;

    this.serviceApi.getPublicServices(this.currentLang)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dbServices        = data;
          this.dbServicesLoading = false;
          this.refreshAOS();
        },
        error: () => {
          this.dbServicesError   = true;
          this.dbServicesLoading = false;
        }
      });
  }

  t(field: { en: string; ar: string } | string | undefined): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return this.currentLang === 'ar' ? (field.ar || field.en) : (field.en || field.ar);
  }

  private initializeAOS(): void {
    try {
      if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 100, delay: 0, anchorPlacement: 'top-bottom', disable: false });
      }
    } catch (error) {
      console.warn('AOS animation library not available:', error);
    }
  }

  private refreshAOS(): void {
    setTimeout(() => {
      try {
        if (typeof AOS !== 'undefined') AOS.refresh();
      } catch (error) {
        console.warn('Error refreshing AOS:', error);
      }
    }, 150);
  }

  private setDirection(): void {
    const dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', this.currentLang);
  }

  private scrollToTop(): void {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  trackByIndex(index: number): number                                { return index; }
  trackByService(_: number, s: MainService): string                 { return s.id; }
  trackByAdditionalService(_: number, s: AdditionalService): string { return s.id; }
  trackByStep(_: number, s: ProcessStep): string                    { return s.id; }
  trackByBenefit(_: number, b: Benefit): string                     { return b.id; }
  trackByDbService(_: number, s: Service): string                   { return s._id; }

  isRTL(): boolean { return this.currentLang === 'ar'; }

  toggleLanguage(): void {
    const newLang: 'ar' | 'en' = this.currentLang === 'en' ? 'ar' : 'en';
    this.translateService.setLanguage(newLang);
  }

  toggleTheme(): void { this.themeService.toggleTheme(); }
}