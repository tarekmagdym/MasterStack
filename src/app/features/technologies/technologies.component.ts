import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService }     from '../../core/services/theme.service';
import { TechnologyService, Technology } from '../../core/services/Technology.service';
import { Subscription } from 'rxjs';

interface TechCategory {
  id:            string;
  title:         string;
  titleAr:       string;
  subtitle:      string;
  subtitleAr:    string;
  description:   string;
  descriptionAr: string;
  technologies:  Technology[];
}

@Component({
  selector:    'app-technologies',
  standalone:  true,
  imports:     [CommonModule, RouterModule],
  templateUrl: './technologies.component.html',
  styleUrls:   ['./technologies.component.scss'],
})
export class TechnologiesComponent implements OnInit, OnDestroy {

  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode = false;

  loading = false;
  error:  string | null = null;

  readonly skeletonRows = Array(6).fill(0);

  techCategories: TechCategory[] = [
    {
      id: 'frontend',
      title: 'Frontend Technologies', titleAr: 'تقنيات الواجهات الأمامية',
      subtitle: 'Frontend',           subtitleAr: 'الواجهات الأمامية',
      description:   'Building modern and interactive user interfaces using the latest frameworks and libraries',
      descriptionAr: 'نبني واجهات مستخدم حديثة وتفاعلية باستخدام أحدث أطر العمل والمكتبات',
      technologies: [],
    },
    {
      id: 'backend',
      title: 'Backend Technologies', titleAr: 'تقنيات الخلفية',
      subtitle: 'Backend',            subtitleAr: 'الخلفية',
      description:   'Developing powerful and scalable servers using the latest backend technologies',
      descriptionAr: 'نطور خوادم قوية وقابلة للتطوير باستخدام أحدث تقنيات الخلفية',
      technologies: [],
    },
    {
      id: 'mobile',
      title: 'Mobile Development', titleAr: 'تطوير تطبيقات الموبايل',
      subtitle: 'Mobile',            subtitleAr: 'تطبيقات الموبايل',
      description:   'Building native and cross-platform mobile apps with highest quality',
      descriptionAr: 'نبني تطبيقات موبايل أصلية ومتعددة المنصات بأعلى جودة',
      technologies: [],
    },
    {
      id: 'database',
      title: 'Database & Cloud', titleAr: 'قواعد البيانات والسحابة',
      subtitle: 'Database & Cloud',   subtitleAr: 'قواعد البيانات والسحابة',
      description:   'Using the best databases and cloud services for performance and reliability',
      descriptionAr: 'نستخدم أفضل قواعد البيانات والخدمات السحابية لضمان الأداء والموثوقية',
      technologies: [],
    },
    {
      id: 'devops',
      title: 'DevOps & Tools', titleAr: 'DevOps والأدوات',
      subtitle: 'DevOps & Tools',     subtitleAr: 'DevOps والأدوات',
      description:   'Using latest DevOps tools for rapid development and secure deployment',
      descriptionAr: 'نستخدم أحدث أدوات DevOps لضمان التطوير السريع والنشر الآمن',
      technologies: [],
    },
    {
      id: 'tools',
      title: 'UI/UX Design', titleAr: 'تصميم واجهات المستخدم',
      subtitle: 'UI/UX Design',       subtitleAr: 'تصميم UI/UX',
      description:   'Creating beautiful and user-friendly interfaces with professional design tools',
      descriptionAr: 'نصمم واجهات جميلة وسهلة الاستخدام باستخدام أدوات تصميم احترافية',
      technologies: [],
    },
  ];

  get visibleCategories(): TechCategory[] {
    return this.techCategories.filter(c => c.technologies.length > 0);
  }

  private langSubscription?:  Subscription;
  private themeSubscription?: Subscription;

  constructor(
    public  translateService:  TranslateService,
    public  themeService:      ThemeService,
    private technologyService: TechnologyService,
    private titleService:      Title,
    private metaService:       Meta,
  ) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(d => this.isDarkMode = d);

    this.langSubscription = this.translateService.currentLang$.subscribe(lang => {
      this.currentLang = lang as 'ar' | 'en';
      this.updateSeoTags();
    });

    this.currentLang = this.translateService.currentLang as 'ar' | 'en';
    this.updateSeoTags();

    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({ duration: 600, easing: 'ease-in-out', once: true, offset: 50 });
    }

    this.loadTechnologies();
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }

  private updateSeoTags(): void {
    if (this.currentLang === 'ar') {
      this.titleService.setTitle('التقنيات | ماستر ستاك - أحدث تقنيات تطوير البرمجيات');
      this.metaService.updateTag({ name: 'description', content: 'اكتشف التقنيات الحديثة التي يستخدمها فريق ماستر ستاك في تطوير تطبيقات الويب والموبايل وقواعد البيانات والحلول السحابية.' });
      this.metaService.updateTag({ property: 'og:title', content: 'التقنيات | ماستر ستاك - أحدث تقنيات تطوير البرمجيات' });
      this.metaService.updateTag({ property: 'og:description', content: 'اكتشف التقنيات الحديثة التي يستخدمها فريق ماستر ستاك في تطوير تطبيقات الويب والموبايل وقواعد البيانات والحلول السحابية.' });
    } else {
      this.titleService.setTitle('Technologies | MasterStack - Latest Software Development Technologies');
      this.metaService.updateTag({ name: 'description', content: 'Explore the modern technologies MasterStack uses to build web apps, mobile apps, databases, and cloud solutions — from Angular and React to Node.js, Flutter, and AWS.' });
      this.metaService.updateTag({ property: 'og:title', content: 'Technologies | MasterStack - Latest Software Development Technologies' });
      this.metaService.updateTag({ property: 'og:description', content: 'Explore the modern technologies MasterStack uses to build web apps, mobile apps, databases, and cloud solutions — from Angular and React to Node.js, Flutter, and AWS.' });
    }
  }

  loadTechnologies(): void {
    this.loading = true;
    this.error   = null;

    this.technologyService.getAll().subscribe({
      next: (res) => {
        this.techCategories.forEach(c => c.technologies = []);

        for (const tech of res.data) {
          if (!tech.isPublished) continue;
          const cat = this.techCategories.find(c => c.id === tech.category);
          if (cat) cat.technologies.push(tech);
        }

        this.techCategories.forEach(c =>
          c.technologies.sort((a, b) => a.order - b.order)
        );

        this.loading = false;

        if (typeof (window as any).AOS !== 'undefined') {
          (window as any).AOS.refresh();
        }
      },
      error: (err) => {
        this.error = err?.error?.message
          ?? (this.currentLang === 'ar'
              ? 'فشل تحميل التقنيات، يرجى المحاولة مرة أخرى'
              : 'Failed to load technologies. Please try again.');
        this.loading = false;
      },
    });
  }

  getTechName(tech: Technology): string {
    return this.currentLang === 'ar' ? tech.name.ar : tech.name.en;
  }

  isCompact(categoryId: string):    boolean { return categoryId === 'devops'; }
  isMobileGrid(categoryId: string): boolean { return categoryId === 'mobile'; }
  isFeatured(categoryId: string, index: number): boolean {
    return categoryId === 'mobile' && index < 2;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2326cabc' stroke-width='1.5'><circle cx='12' cy='12' r='3'/><path d='M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83'/></svg>`;
    img.style.opacity = '0.4';
  }
}