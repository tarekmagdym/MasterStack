import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { ProjectService, PaginatedProjects } from '../../core/services/Project.service';
import { ServiceService, Service } from '../../core/services/Service.service';
import { Subscription } from 'rxjs';
import AOS from 'aos';

export interface I18nStr { en: string; ar: string; }

export interface FeaturedProject {
  _id:               string;
  slug:              string;
  title:             I18nStr;
  description:       I18nStr;
  shortDescription?: I18nStr;
  tags?:             { en: string; ar: string }[];
  image:             string;
  technologies?:     string[];
  category:          string;
  liveUrl?:          string;
  year:              string;
  isFeatured:        boolean;
  isPublished:       boolean;
  order:             number;
  createdAt:         string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode = false;

  featuredProjects: FeaturedProject[] = [];
  projectsLoading  = false;
  projectsError    = false;

  featuredServices: Service[] = [];
  servicesLoading  = false;
  servicesError    = false;

  private langSubscription?:  Subscription;
  private themeSubscription?: Subscription;

  constructor(
    private translateService: TranslateService,
    private themeService:     ThemeService,
    private projectService:   ProjectService,
    private serviceApi:       ServiceService,
    private router:           Router,
    private titleService:     Title,
    private metaService:      Meta,
  ) {}

  ngOnInit(): void {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100,
      delay: 0,
    });

    this.currentLang = this.translateService.currentLang as 'ar' | 'en';
    this.updateSeoTags();

    this.langSubscription = this.translateService.currentLang$.subscribe(lang => {
      const prev = this.currentLang;
      this.currentLang = lang as 'ar' | 'en';
      this.updateSeoTags();
      setTimeout(() => AOS.refresh(), 100);

      if (lang !== prev || this.featuredServices.length === 0) {
        this.loadFeaturedServices();
      }
    });

    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      setTimeout(() => AOS.refresh(), 100);
    });

    this.loadFeaturedProjects();
    this.loadFeaturedServices();
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }

  private updateSeoTags(): void {
    if (this.currentLang === 'ar') {
      this.titleService.setTitle('ماستر ستاك | حلول برمجية متقدمة وتطوير ويب احترافي');
      this.metaService.updateTag({ name: 'description', content: 'ماستر ستاك تقدم حلول برمجية متقدمة وتطوير تطبيقات ويب ومنصات رقمية مخصصة تساعد الشركات على النمو والتميز.' });
      this.metaService.updateTag({ property: 'og:title', content: 'ماستر ستاك | حلول برمجية متقدمة وتطوير ويب احترافي' });
      this.metaService.updateTag({ property: 'og:description', content: 'ماستر ستاك تقدم حلول برمجية متقدمة وتطوير تطبيقات ويب ومنصات رقمية مخصصة.' });
    } else {
      this.titleService.setTitle('MasterStack | Professional Software Development & Digital Solutions');
      this.metaService.updateTag({ name: 'description', content: 'MasterStack builds web applications, platforms, and custom software solutions that help businesses grow and excel in the digital age.' });
      this.metaService.updateTag({ property: 'og:title', content: 'MasterStack | Professional Software Development & Digital Solutions' });
      this.metaService.updateTag({ property: 'og:description', content: 'MasterStack builds web applications, platforms, and custom software solutions that help businesses grow and excel in the digital age.' });
    }
  }

  private loadFeaturedProjects(): void {
    this.projectsLoading = true;
    this.projectsError   = false;

    this.projectService.getPublished({ featured: true, limit: 3 }).subscribe({
      next: (res: PaginatedProjects) => {
        this.featuredProjects = res.data as unknown as FeaturedProject[];
        this.projectsLoading  = false;
        setTimeout(() => AOS.refresh(), 100);
      },
      error: () => {
        this.projectsError   = true;
        this.projectsLoading = false;
      },
    });
  }

  private loadFeaturedServices(): void {
    this.servicesLoading = true;
    this.servicesError   = false;

    this.serviceApi.getFeaturedServices(this.currentLang).subscribe({
      next: (data: Service[]) => {
        this.featuredServices = data;
        this.servicesLoading  = false;
        setTimeout(() => AOS.refresh(), 100);
      },
      error: () => {
        this.servicesError   = true;
        this.servicesLoading = false;
      },
    });
  }

  t(field: { en: string; ar: string } | string | undefined): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return this.currentLang === 'ar' ? (field.ar || field.en) : (field.en || field.ar);
  }

  viewProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }
}