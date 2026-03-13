import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService }     from '../../core/services/theme.service';
import { ProjectService }   from '../../core/services/Project.service';
import { Subscription } from 'rxjs';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface I18nStr { en: string; ar: string; }

export interface DetailProject {
  _id:               string;
  slug:              string;
  title:             I18nStr;
  description:       I18nStr;
  shortDescription?: I18nStr;
  fullDescription?:  I18nStr;
  challenge?:        I18nStr;
  solution?:         I18nStr;
  features?:         { en: string[]; ar: string[] };
  results?:          { en: string[]; ar: string[] };
  tags?:             { en: string; ar: string }[];
  image:             string;
  images?:           string[];
  technologies?:     string[];
  category:          string;
  clientName?:       string;
  liveUrl?:          string;
  year:              string;
  duration?:         string;
  isFeatured:        boolean;
  isPublished:       boolean;
  createdAt:         string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {

  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode = false;

  project:         DetailProject | null = null;
  relatedProjects: DetailProject[] = [];

  loading = false;
  error:   string | null = null;

  selectedGalleryImage = '';
  currentSlideIndex    = 0;

  private langSub?:  Subscription;
  private themeSub?: Subscription;
  private routeSub?: Subscription;

  constructor(
    private route:        ActivatedRoute,
    private router:       Router,
    public  translateSvc: TranslateService,
    public  themeSvc:     ThemeService,
    private projectSvc:   ProjectService,
    private titleService: Title,
    private metaService:  Meta,
  ) {}

  ngOnInit(): void {
    this.langSub  = this.translateSvc.currentLang$.subscribe(l => {
      this.currentLang = l as 'ar' | 'en';
      // Re-update SEO when language switches and project is already loaded
      if (this.project) this.updateSeoTags(this.project);
    });
    this.themeSub = this.themeSvc.isDarkMode$.subscribe(d => this.isDarkMode = d);

    this.routeSub = this.route.params.subscribe(params => {
      const id = params['id'] || params['slug'];
      this.loadProject(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({ duration: 600, easing: 'ease-in-out', once: true, offset: 50 });
    }
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.themeSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  // ── SEO (same pattern as home) ────────────────────────────────────────────

  private updateSeoTags(p: DetailProject): void {
    const titleAr  = p.title.ar;
    const titleEn  = p.title.en;
    const descAr   = p.shortDescription?.ar || p.description.ar;
    const descEn   = p.shortDescription?.en || p.description.en;
    const tagsAr   = (p.tags ?? []).map(t => t.ar).join('، ');
    const tagsEn   = (p.tags ?? []).map(t => t.en).join(', ');
    const techList = (p.technologies ?? []).join(', ');
    const pageUrl  = `https://masterstack.com/projects/${p.slug || p._id}`;

    if (this.currentLang === 'ar') {
      this.titleService.setTitle(`${titleAr} | ماستر ستاك`);
      this.metaService.updateTag({ name: 'description',        content: descAr });
      this.metaService.updateTag({ name: 'keywords',           content: `${titleAr}، ${tagsAr}، ${techList}، ماستر ستاك، مشاريع برمجية` });
      this.metaService.updateTag({ property: 'og:title',       content: `${titleAr} | ماستر ستاك` });
      this.metaService.updateTag({ property: 'og:description', content: descAr });
      this.metaService.updateTag({ property: 'og:image',       content: p.image });
      this.metaService.updateTag({ property: 'og:url',         content: pageUrl });
      this.metaService.updateTag({ property: 'og:type',        content: 'article' });
      this.metaService.updateTag({ property: 'og:locale',      content: 'ar_EG' });
      this.metaService.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
      this.metaService.updateTag({ name: 'twitter:title',       content: `${titleAr} | ماستر ستاك` });
      this.metaService.updateTag({ name: 'twitter:description', content: descAr });
      this.metaService.updateTag({ name: 'twitter:image',       content: p.image });
      this.metaService.updateTag({ name: 'robots',              content: 'index, follow' });
    } else {
      this.titleService.setTitle(`${titleEn} | MasterStack`);
      this.metaService.updateTag({ name: 'description',        content: descEn });
      this.metaService.updateTag({ name: 'keywords',           content: `${titleEn}, ${tagsEn}, ${techList}, MasterStack, software projects` });
      this.metaService.updateTag({ property: 'og:title',       content: `${titleEn} | MasterStack` });
      this.metaService.updateTag({ property: 'og:description', content: descEn });
      this.metaService.updateTag({ property: 'og:image',       content: p.image });
      this.metaService.updateTag({ property: 'og:url',         content: pageUrl });
      this.metaService.updateTag({ property: 'og:type',        content: 'article' });
      this.metaService.updateTag({ property: 'og:locale',      content: 'en_US' });
      this.metaService.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
      this.metaService.updateTag({ name: 'twitter:title',       content: `${titleEn} | MasterStack` });
      this.metaService.updateTag({ name: 'twitter:description', content: descEn });
      this.metaService.updateTag({ name: 'twitter:image',       content: p.image });
      this.metaService.updateTag({ name: 'robots',              content: 'index, follow' });
    }
  }

  // ── API ───────────────────────────────────────────────────────────────────

  private loadProject(id: string): void {
    this.loading = true;
    this.error   = null;
    this.project = null;
    this.relatedProjects   = [];
    this.currentSlideIndex = 0;

    this.projectSvc.getBySlug(id).subscribe({
      next: (res) => {
        this.project = res.data as unknown as DetailProject;
        this.loading = false;
        this.updateSeoTags(this.project);
        if (typeof (window as any).AOS !== 'undefined') (window as any).AOS.refresh();
        this.loadRelated();
      },
      error: (err) => {
        this.error   = err?.error?.message
          ?? (this.currentLang === 'ar' ? 'فشل تحميل المشروع' : 'Failed to load project');
        this.loading = false;
        // Fallback SEO for error state
        this.titleService.setTitle(this.currentLang === 'ar' ? 'مشروع | ماستر ستاك' : 'Project | MasterStack');
        this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
      }
    });
  }

  private loadRelated(): void {
    if (!this.project) return;
    this.projectSvc.getPublished({ category: this.project.category, limit: 4 })
      .subscribe({
        next: (res) => {
          this.relatedProjects = (res.data as unknown as DetailProject[])
            .filter(p => p._id !== this.project!._id)
            .slice(0, 3);
        },
        error: () => {}
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  t(field: I18nStr | undefined): string {
    if (!field) return '';
    return this.currentLang === 'ar' ? (field.ar || field.en) : (field.en || field.ar);
  }

  get currentFeatures(): string[] {
    if (!this.project?.features) return [];
    return (this.currentLang === 'ar' ? this.project.features.ar : this.project.features.en) ?? [];
  }

  get currentResults(): string[] {
    if (!this.project?.results) return [];
    return (this.currentLang === 'ar' ? this.project.results.ar : this.project.results.en) ?? [];
  }

  get gallerySlides(): string[] {
    if (this.project?.images?.length) return this.project.images;
    if (this.project?.image)          return [this.project.image];
    return [];
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void { this.router.navigate(['/projects']); }

  viewRelatedProject(id: string): void { this.router.navigate(['/projects', id]); }

  // ── Gallery slider ────────────────────────────────────────────────────────

  nextSlide(): void {
    const len = this.gallerySlides.length;
    if (!len) return;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % len;
  }

  prevSlide(): void {
    const len = this.gallerySlides.length;
    if (!len) return;
    this.currentSlideIndex = this.currentSlideIndex === 0 ? len - 1 : this.currentSlideIndex - 1;
  }

  goToSlide(i: number): void { this.currentSlideIndex = i; }

  openGalleryImage(img: string): void {
    this.selectedGalleryImage = img;
    document.body.style.overflow = 'hidden';
  }

  closeGalleryImage(): void {
    this.selectedGalleryImage = '';
    document.body.style.overflow = 'auto';
  }
}