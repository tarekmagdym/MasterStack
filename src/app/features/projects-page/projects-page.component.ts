import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewInit, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService }     from '../../core/services/theme.service';
import { ProjectService }   from '../../core/services/Project.service';
import { TestimonialService, Testimonial } from '../../core/services/Testimonial.service';
import { Subscription } from 'rxjs';

export interface I18nStr { en: string; ar: string; }

export interface PublicProject {
  _id:               string;
  slug:              string;
  title:             I18nStr;
  description:       I18nStr;
  shortDescription?: I18nStr;
  tags?:             { en: string; ar: string }[];
  image:             string;
  technologies?:     string[];
  category:          string;
  clientName?:       string;
  liveUrl?:          string;
  year:              string;
  isFeatured:        boolean;
  isPublished:       boolean;
  order:             number;
  createdAt:         string;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
}

const AVATAR_STYLES = ['gradient', 'teal', 'blue', 'gradient', 'teal'] as const;

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './projects-page.component.html',
  styleUrls: ['./projects-page.component.scss']
})
export class ProjectsPageComponent implements OnInit, OnDestroy, AfterViewInit {

  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode   = false;
  selectedCategory = 'all';

  allProjects:      PublicProject[] = [];
  filteredProjects: PublicProject[] = [];
  loading           = false;
  error:            string | null = null;
  hasMoreProjects   = false;

  private currentPage = 1;
  private pageLimit   = 20;

  testimonials:          Testimonial[] = [];
  testimonialsLoading    = false;
  testimonialsError:     string | null = null;

  get averageRating(): string {
    if (!this.testimonials.length) return '5.0';
    const sum = this.testimonials.reduce((acc, t) => acc + (t.rating ?? 5), 0);
    return (sum / this.testimonials.length).toFixed(1);
  }

  readonly overviewStars = Array(5).fill(0);

  getAvatarStyle(index: number): string {
    return AVATAR_STYLES[index % AVATAR_STYLES.length];
  }

  getInitials(t: Testimonial): string {
    const name = this.currentLang === 'ar' ? t.name.ar : t.name.en;
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  }

  currentSlide    = 0;
  totalSlides     = 0;
  sliderDots:     number[] = [];
  sliderOffset    = 0;
  isTransitioning = false;
  cardWidth       = 0;
  sliderGap       = 24;

  private _cardsVisible = 3;
  private _autoPlay: any;
  private _touchStartX = 0;

  @ViewChild('sliderViewport') sliderViewport!: ElementRef<HTMLElement>;

  categories: Category[] = [
    {
      id: 'all', name: 'All Projects', nameAr: 'جميع المشاريع',
      icon: 'M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM14 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 6v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6zM4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zM14 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z'
    },
    {
      id: 'web', name: 'Web Apps', nameAr: 'تطبيقات الويب',
      icon: 'M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9'
    },
    {
      id: 'mobile', name: 'Mobile Apps', nameAr: 'تطبيقات الموبايل',
      icon: 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z'
    },
    {
      id: 'platforms', name: 'Platforms', nameAr: 'المنصات',
      icon: 'M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0 0-10H7a5 5 0 1 1 0-10h9a4 4 0 0 0 4 4'
    },
  ];

  private langSubscription?:  Subscription;
  private themeSubscription?: Subscription;

  constructor(
    public  translateService:    TranslateService,
    public  themeService:        ThemeService,
    private router:              Router,
    private projectService:      ProjectService,
    private testimonialService:  TestimonialService,
    private titleService:        Title,
    private metaService:         Meta,
  ) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(d => this.isDarkMode = d);

    this.langSubscription = this.translateService.currentLang$.subscribe(lang => {
      const prev = this.currentLang;
      this.currentLang = lang as 'ar' | 'en';
      this.updateSeoTags();
      if (prev !== this.currentLang && this.allProjects.length > 0) {
        if (typeof (window as any).AOS !== 'undefined') (window as any).AOS.refresh();
      }
    });

    this.currentLang = this.translateService.currentLang as 'ar' | 'en';
    this.updateSeoTags();

    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({ duration: 600, easing: 'ease-in-out', once: true, offset: 50 });
    }

    this.loadProjects();
    this.loadTestimonials();
  }

  ngAfterViewInit(): void {
    setTimeout(() => { this.measureSlider(); this.startAutoPlay(); }, 60);
  }

  @HostListener('window:resize')
  onWindowResize(): void { this.measureSlider(); this.applyOffset(false); }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
    clearInterval(this._autoPlay);
  }

  private updateSeoTags(): void {
    if (this.currentLang === 'ar') {
      this.titleService.setTitle('مشاريعنا | ماستر ستاك - أعمال وحلول برمجية ناجحة');
      this.metaService.updateTag({ name: 'description', content: 'استكشف مشاريع ماستر ستاك الناجحة في تطوير تطبيقات الويب والموبايل والمنصات الرقمية لعملاء من مختلف الصناعات.' });
      this.metaService.updateTag({ property: 'og:title', content: 'مشاريعنا | ماستر ستاك - أعمال وحلول برمجية ناجحة' });
      this.metaService.updateTag({ property: 'og:description', content: 'استكشف مشاريع ماستر ستاك الناجحة في تطوير تطبيقات الويب والموبايل والمنصات الرقمية.' });
    } else {
      this.titleService.setTitle('Our Projects | MasterStack - Successful Software Solutions');
      this.metaService.updateTag({ name: 'description', content: 'Explore MasterStack\'s portfolio of successful web apps, mobile apps, and digital platforms built for clients across various industries.' });
      this.metaService.updateTag({ property: 'og:title', content: 'Our Projects | MasterStack - Successful Software Solutions' });
      this.metaService.updateTag({ property: 'og:description', content: 'Explore MasterStack\'s portfolio of successful web apps, mobile apps, and digital platforms built for clients across various industries.' });
    }
  }

  loadProjects(): void {
    this.loading = true;
    this.error   = null;
    this.currentPage = 1;

    this.projectService.getPublished({ page: this.currentPage, limit: this.pageLimit })
      .subscribe({
        next: (res) => {
          this.allProjects     = res.data as unknown as PublicProject[];
          this.hasMoreProjects = res.pagination.page < res.pagination.pages;
          this.applyFilter();
          this.loading = false;
          if (typeof (window as any).AOS !== 'undefined') (window as any).AOS.refresh();
        },
        error: (err) => {
          this.error   = err?.error?.message
            ?? (this.currentLang === 'ar' ? 'فشل تحميل المشاريع' : 'Failed to load projects');
          this.loading = false;
        }
      });
  }

  loadMoreProjects(): void {
    if (!this.hasMoreProjects) return;
    this.currentPage++;
    this.projectService.getPublished({ page: this.currentPage, limit: this.pageLimit })
      .subscribe({
        next: (res) => {
          this.allProjects     = [...this.allProjects, ...(res.data as unknown as PublicProject[])];
          this.hasMoreProjects = res.pagination.page < res.pagination.pages;
          this.applyFilter();
        },
        error: () => { this.currentPage--; }
      });
  }

  filterProjects(category: string): void {
    this.selectedCategory = category;
    this.applyFilter();
    if (typeof (window as any).AOS !== 'undefined') (window as any).AOS.refresh();
  }

  private applyFilter(): void {
    this.filteredProjects = this.selectedCategory === 'all'
      ? this.allProjects
      : this.allProjects.filter(p => p.category === this.selectedCategory);
  }

  getProjectCount(categoryId: string): number {
    return categoryId === 'all'
      ? this.allProjects.length
      : this.allProjects.filter(p => p.category === categoryId).length;
  }

  viewProjectDetails(id: string): void { this.router.navigate(['/projects', id]); }

  loadTestimonials(): void {
    this.testimonialsLoading = true;
    this.testimonialsError   = null;

    this.testimonialService.getAll().subscribe({
      next: (res) => {
        this.testimonials = res.data.filter(t => t.isActive).sort((a, b) => a.order - b.order);
        this.totalSlides  = this.testimonials.length;
        this.sliderDots   = Array(this.totalSlides).fill(0);
        this.currentSlide = 0;
        this.testimonialsLoading = false;
        setTimeout(() => { this.measureSlider(); }, 60);
      },
      error: () => {
        this.testimonialsError = this.currentLang === 'ar'
          ? 'فشل تحميل آراء العملاء'
          : 'Failed to load testimonials';
        this.testimonialsLoading = false;
      }
    });
  }

  getStars(rating: number): number[] {
    return Array(Math.min(5, Math.max(0, Math.round(rating)))).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    const filled = Math.min(5, Math.max(0, Math.round(rating)));
    return Array(5 - filled).fill(0);
  }

  private measureSlider(): void {
    if (!this.sliderViewport) return;
    const vpW = this.sliderViewport.nativeElement.offsetWidth;
    if (vpW < 640)       { this._cardsVisible = 1; this.sliderGap = 16; }
    else if (vpW < 1100) { this._cardsVisible = 2; this.sliderGap = 20; }
    else                 { this._cardsVisible = 3; this.sliderGap = 24; }
    this.cardWidth = (vpW - this.sliderGap * (this._cardsVisible - 1)) / this._cardsVisible;
    this.applyOffset(false);
  }

  private applyOffset(animate = true): void {
    const max = Math.max(0, this.totalSlides - this._cardsVisible);
    if (this.currentSlide > max) this.currentSlide = max;
    if (this.currentSlide < 0)   this.currentSlide = 0;
    if (animate) { this.isTransitioning = true; setTimeout(() => this.isTransitioning = false, 520); }
    this.sliderOffset = -(this.currentSlide * (this.cardWidth + this.sliderGap));
  }

  nextSlide(): void {
    const max = Math.max(0, this.totalSlides - this._cardsVisible);
    this.currentSlide = this.currentSlide >= max ? 0 : this.currentSlide + 1;
    this.applyOffset(); this.resetAutoPlay();
  }

  prevSlide(): void {
    const max = Math.max(0, this.totalSlides - this._cardsVisible);
    this.currentSlide = this.currentSlide <= 0 ? max : this.currentSlide - 1;
    this.applyOffset(); this.resetAutoPlay();
  }

  goToSlide(i: number): void { this.currentSlide = i; this.applyOffset(); this.resetAutoPlay(); }

  private startAutoPlay(): void { this._autoPlay = setInterval(() => this.nextSlide(), 4500); }
  private resetAutoPlay(): void { clearInterval(this._autoPlay); this.startAutoPlay(); }

  onTouchStart(e: TouchEvent): void { this._touchStartX = e.touches[0].clientX; }
  onTouchEnd(e: TouchEvent): void {
    const delta = this._touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) < 45) return;
    const rtl = document.documentElement.dir === 'rtl';
    if (rtl) { delta > 0 ? this.prevSlide() : this.nextSlide(); }
    else      { delta > 0 ? this.nextSlide() : this.prevSlide(); }
  }
}