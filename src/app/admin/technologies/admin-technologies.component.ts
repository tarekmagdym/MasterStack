import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { TechnologyService, Technology, TechnologyPayload } from '../../core/services/Technology.service';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; type: ToastType; title: string; message: string; }

const CATEGORIES = ['frontend', 'backend', 'database', 'devops', 'mobile', 'tools', 'other'] as const;
const LEVELS     = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

@Component({
  selector: 'app-admin-technologies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-technologies.component.html',
  styleUrls: ['./admin-technologies.component.scss'],
})
export class AdminTechnologiesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private toastSeed = 0;

  isDark  = false;
  isRtl   = false;
  toasts: Toast[] = [];

  // ── Data ──────────────────────────────────────────────────
  technologies: Technology[] = [];
  filtered:     Technology[] = [];
  loading = true;

  // ── Filters ───────────────────────────────────────────────
  search         = '';
  filterCategory = '';
  filterLevel    = '';
  filterStatus   = '';

  categories = [...CATEGORIES];
  levels     = [...LEVELS];

  // ── Modal ─────────────────────────────────────────────────
  modalOpen = false;
  isEditing = false;
  saving    = false;
  editingId = '';

  form: TechnologyPayload = this.emptyForm();

  // ── Delete confirm ────────────────────────────────────────
  deleteTarget: Technology | null = null;
  deleteConfirmed = false;

  constructor(
    private techService:      TechnologyService,
    private translateService: TranslateService,
    private themeService:     ThemeService,
  ) {}

  ngOnInit(): void {
    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$)).subscribe(d => this.isDark = d);
    this.translateService.currentLang$.pipe(takeUntil(this.destroy$)).subscribe(l => this.isRtl = l === 'ar');
    this.loadData();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Load ──────────────────────────────────────────────────
  loadData(): void {
    this.loading = true;
    this.techService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.technologies = res.data ?? [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('error', this.t('Load failed', 'فشل التحميل'), this.t('Could not load technologies', 'تعذّر تحميل التقنيات'));
      }
    });
  }

  // ── Filter ────────────────────────────────────────────────
  applyFilter(): void {
    const s = this.search.toLowerCase();
    this.filtered = this.technologies.filter(t => {
      const name = `${t.name.en} ${t.name.ar}`.toLowerCase();
      const matchSearch   = !s || name.includes(s);
      const matchCategory = !this.filterCategory || t.category === this.filterCategory;
      const matchLevel    = !this.filterLevel    || t.proficiencyLevel === this.filterLevel;
      const matchStatus   = !this.filterStatus   ||
        (this.filterStatus === 'published'   &&  t.isPublished) ||
        (this.filterStatus === 'unpublished' && !t.isPublished);
      return matchSearch && matchCategory && matchLevel && matchStatus;
    });
  }

  clearFilters(): void {
    this.search = ''; this.filterCategory = ''; this.filterLevel = ''; this.filterStatus = '';
    this.applyFilter();
  }

  // ── Modal ─────────────────────────────────────────────────
  openCreate(): void {
    this.form      = this.emptyForm();
    this.isEditing = false;
    this.editingId = '';
    this.modalOpen = true;
  }

  openEdit(tech: Technology): void {
    this.form = {
      name:             { en: tech.name.en, ar: tech.name.ar },
      logo:             tech.logo,
      category:         tech.category,
      proficiencyLevel: tech.proficiencyLevel,
      isPublished:      tech.isPublished,
      order:            tech.order,
    };
    this.isEditing = true;
    this.editingId = tech._id;
    this.modalOpen = true;
  }

  closeModal(): void { this.modalOpen = false; }

  save(): void {
    if (!this.form.name.en.trim() || !this.form.name.ar.trim() || !this.form.logo.trim()) {
      this.showToast('error', this.t('Required fields', 'حقول مطلوبة'), this.t('Please fill all required fields', 'يرجى تعبئة جميع الحقول المطلوبة'));
      return;
    }
    this.saving = true;

    const req$ = this.isEditing
      ? this.techService.update(this.editingId, this.form)
      : this.techService.create(this.form);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.modalOpen = false;
        this.showToast('success',
          this.isEditing ? this.t('Updated', 'تم التحديث') : this.t('Created', 'تم الإنشاء'),
          this.isEditing ? this.t('Technology updated successfully', 'تم تحديث التقنية بنجاح') : this.t('Technology created successfully', 'تم إنشاء التقنية بنجاح')
        );
        this.loadData();
      },
      error: err => {
        this.saving = false;
        this.showToast('error', this.t('Save failed', 'فشل الحفظ'), err?.error?.message ?? this.t('An error occurred', 'حدث خطأ'));
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────
  confirmDelete(tech: Technology): void {
    this.deleteTarget    = tech;
    this.deleteConfirmed = false;
  }

  cancelDelete(): void { this.deleteTarget = null; }

  doDelete(): void {
    if (!this.deleteTarget || !this.deleteConfirmed) return;
    this.techService.delete(this.deleteTarget._id).subscribe({
      next: () => {
        this.showToast('success', this.t('Deleted', 'تم الحذف'), this.t('Technology deleted successfully', 'تم حذف التقنية بنجاح'));
        this.deleteTarget = null;
        this.loadData();
      },
      error: err => {
        this.showToast('error', this.t('Delete failed', 'فشل الحذف'), err?.error?.message ?? this.t('An error occurred', 'حدث خطأ'));
      }
    });
  }

  // ── Toggle publish ────────────────────────────────────────
  togglePublish(tech: Technology): void {
    this.techService.update(tech._id, { isPublished: !tech.isPublished }).subscribe({
      next: () => {
        tech.isPublished = !tech.isPublished;
        this.showToast('info',
          tech.isPublished ? this.t('Published', 'تم النشر') : this.t('Unpublished', 'تم إلغاء النشر'),
          tech.isPublished ? this.t('Technology is now visible', 'التقنية مرئية الآن') : this.t('Technology is now hidden', 'التقنية مخفية الآن')
        );
      },
      error: () => this.showToast('error', this.t('Failed', 'فشل'), this.t('Could not update status', 'تعذّر تحديث الحالة'))
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  private emptyForm(): TechnologyPayload {
    return { name: { en: '', ar: '' }, logo: '', category: 'frontend', proficiencyLevel: 'intermediate', isPublished: true, order: 0 };
  }

  t(en: string, ar: string): string { return this.isRtl ? ar : en; }

  getCategoryLabel(cat: string): string {
    const map: Record<string, { en: string; ar: string }> = {
      frontend:  { en: 'Frontend',  ar: 'واجهة أمامية'  },
      backend:   { en: 'Backend',   ar: 'خادم'          },
      database:  { en: 'Database',  ar: 'قاعدة بيانات'  },
      devops:    { en: 'DevOps',    ar: 'ديف أوبس'      },
      mobile:    { en: 'Mobile',    ar: 'موبايل'         },
      tools:     { en: 'Tools',     ar: 'أدوات'          },
      other:     { en: 'Other',     ar: 'أخرى'           },
    };
    return map[cat]?.[this.isRtl ? 'ar' : 'en'] ?? cat;
  }

  getLevelLabel(lvl: string): string {
    const map: Record<string, { en: string; ar: string }> = {
      beginner:     { en: 'Beginner',     ar: 'مبتدئ'    },
      intermediate: { en: 'Intermediate', ar: 'متوسط'    },
      advanced:     { en: 'Advanced',     ar: 'متقدم'    },
      expert:       { en: 'Expert',       ar: 'خبير'     },
    };
    return map[lvl]?.[this.isRtl ? 'ar' : 'en'] ?? lvl;
  }

  getName(tech: Technology): string { return this.isRtl ? tech.name.ar : tech.name.en; }

  trackBy(_: number, t: Technology): string { return t._id; }
  trackToast(_: number, t: Toast): number   { return t.id; }

  // ── Toast ─────────────────────────────────────────────────
  private showToast(type: ToastType, title: string, message = '', duration = 3500): void {
    const id = ++this.toastSeed;
    this.toasts = [...this.toasts, { id, type, title, message }];
    setTimeout(() => this.removeToast(id), duration);
  }
  removeToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }
}