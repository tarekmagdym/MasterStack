import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { ServiceService, Service } from '../../core/services/Service.service';
import { ServiceFullPayload } from '../../core/services/Service.service';

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id:      string;
  type:    ToastType;
  titleEn: string;
  titleAr: string;
  msgEn:   string;
  msgAr:   string;
}

// ── Form model ────────────────────────────────────────────────────────────────
interface ServiceForm {
  titleEn:            string;
  titleAr:            string;
  descriptionEn:      string;
  descriptionAr:      string;
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  icon:               string;
  features:           string;   // comma-separated English features
  featuresAr:         string;   // comma-separated Arabic features
  isPublished:        boolean;
  isFeatured:         boolean;
  order:              number;
}

const EMPTY_FORM = (): ServiceForm => ({
  titleEn: '', titleAr: '',
  descriptionEn: '', descriptionAr: '',
  shortDescriptionEn: '', shortDescriptionAr: '',
  icon: '',
  features: '', featuresAr: '',
  isPublished: true,
  isFeatured:  false,
  order: 0,
});

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-services.component.html',
  styleUrls: ['./admin-services.component.scss']
})
export class AdminServicesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isDark    = false;
  isRtl     = false;
  showModal = false;
  isEditing = false;
  isLoading = false;
  isSaving  = false;

  toasts: ToastItem[] = [];

  services:  Service[] = [];
  editingId: string | null = null;
  form:      ServiceForm = EMPTY_FORM();

  deletingId:        string | null = null;
  showDeleteConfirm  = false;
  deleteConfirmed    = false;

  constructor(
    private translateService: TranslateService,
    private themeService:     ThemeService,
    private serviceApi:       ServiceService
  ) {}

  ngOnInit() {
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.isDark = d);

    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.isRtl = l === 'ar');

    this.loadServices();
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  // ── Toast ──────────────────────────────────────────────────────────────────
  showToast(type: ToastType, msgEn: string, msgAr: string, titleEn?: string, titleAr?: string): void {
    const defaults: Record<ToastType, { en: string; ar: string }> = {
      success: { en: 'Success', ar: 'تم بنجاح' },
      error:   { en: 'Error',   ar: 'خطأ'      },
      warning: { en: 'Warning', ar: 'تنبيه'    },
      info:    { en: 'Info',    ar: 'معلومة'   },
    };
    const id       = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const duration = type === 'error' ? 6000 : 4000;
    this.toasts = [...this.toasts, {
      id, type,
      titleEn: titleEn ?? defaults[type].en,
      titleAr: titleAr ?? defaults[type].ar,
      msgEn, msgAr,
    }];
    setTimeout(() => this.dismissToast(id), duration);
  }

  dismissToast(id: string): void  { this.toasts = this.toasts.filter(t => t.id !== id); }
  trackToastId(_: number, t: ToastItem): string { return t.id; }

  // ── Load ───────────────────────────────────────────────────────────────────
  loadServices() {
    this.isLoading = true;
    this.serviceApi.getAllAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  data => { this.services = data; this.isLoading = false; },
        error: err  => {
          this.isLoading = false;
          this.showToast('error',
            err.error?.message ?? 'Failed to load services. Please try again.',
            err.error?.message ?? 'فشل تحميل الخدمات، يرجى المحاولة مجدداً.'
          );
        }
      });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  t(field: { en: string; ar: string } | undefined): string {
    if (!field) return '';
    return this.isRtl ? (field.ar || field.en) : (field.en || field.ar);
  }

  private parseList(raw: string): string[] {
    return raw.split(',').map(f => f.trim()).filter(Boolean);
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  openAdd() {
    this.isEditing = false;
    this.editingId = null;
    this.form      = EMPTY_FORM();
    this.showModal = true;
  }

  openEdit(s: Service) {
    this.isEditing = true;
    this.editingId = s._id;
    this.form = {
      titleEn:            s.title?.en            || '',
      titleAr:            s.title?.ar            || '',
      descriptionEn:      s.description?.en      || '',
      descriptionAr:      s.description?.ar      || '',
      shortDescriptionEn: s.shortDescription?.en || '',
      shortDescriptionAr: s.shortDescription?.ar || '',
      icon:               s.icon                  || '',
      features:           (s.features   || []).join(', '),
      featuresAr:         (s.featuresAr || []).join(', '),  // ← populated from API
      isPublished:        s.isPublished,
      isFeatured:         s.isFeatured ?? false,
      order:              s.order,
    };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  // ── Save ───────────────────────────────────────────────────────────────────
  save() {
    if (this.isSaving) return;

    // Validate required bilingual titles
    if (!this.form.titleEn.trim() || !this.form.titleAr.trim()) {
      this.showToast('warning',
        'Please fill in both English and Arabic titles before saving.',
        'يرجى ملء العنوان بالإنجليزية والعربية قبل الحفظ.'
      );
      return;
    }

    // Validate required bilingual descriptions
    if (!this.form.descriptionEn.trim() || !this.form.descriptionAr.trim()) {
      this.showToast('warning',
        'Please fill in both English and Arabic descriptions before saving.',
        'يرجى ملء الوصف بالإنجليزية والعربية قبل الحفظ.'
      );
      return;
    }

    const payload: ServiceFullPayload = {
      title:            { en: this.form.titleEn.trim(),            ar: this.form.titleAr.trim()            },
      description:      { en: this.form.descriptionEn.trim(),      ar: this.form.descriptionAr.trim()      },
      shortDescription: { en: this.form.shortDescriptionEn.trim(), ar: this.form.shortDescriptionAr.trim() },
      icon:             this.form.icon.trim(),
      features:         this.parseList(this.form.features),
      featuresAr:       this.parseList(this.form.featuresAr),   // ← included in payload
      isPublished:      this.form.isPublished,
      isFeatured:       this.form.isFeatured,
      order:            this.form.order,
    };

    this.isSaving    = true;
    const isEdit     = this.isEditing && !!this.editingId;
    const req$       = isEdit
      ? this.serviceApi.update(this.editingId!, payload)
      : this.serviceApi.create(payload);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving  = false;
        this.showModal = false;
        this.showToast('success',
          isEdit ? 'Service updated successfully.' : 'Service added successfully.',
          isEdit ? 'تم تعديل الخدمة بنجاح.'       : 'تم إضافة الخدمة بنجاح.'
        );
        this.loadServices();
      },
      error: err => {
        this.isSaving = false;
        this.showToast('error',
          err.error?.message ?? 'Failed to save the service. Please try again.',
          err.error?.message ?? 'فشل حفظ الخدمة. يرجى المحاولة مرة أخرى.'
        );
      }
    });
  }

  // ── Toggle published ───────────────────────────────────────────────────────
  togglePublished(s: Service) {
    const next = !s.isPublished;
    this.serviceApi.update(s._id, { isPublished: next })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          s.isPublished = next;
          this.showToast('success',
            next ? 'Service is now active.'  : 'Service has been deactivated.',
            next ? 'الخدمة مفعّلة الآن.'     : 'تم إيقاف تفعيل الخدمة.'
          );
        },
        error: err => this.showToast('error',
          err.error?.message ?? 'Update failed.',
          err.error?.message ?? 'فشل التحديث.'
        )
      });
  }

  // ── Toggle featured ────────────────────────────────────────────────────────
  toggleFeatured(s: Service) {
    const next = !(s.isFeatured ?? false);
    this.serviceApi.update(s._id, { isFeatured: next })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          s.isFeatured = next;
          this.showToast('success',
            next ? 'Service is now shown on the home page.'  : 'Service removed from the home page.',
            next ? 'الخدمة تظهر الآن في الصفحة الرئيسية.'   : 'تمت إزالة الخدمة من الصفحة الرئيسية.'
          );
        },
        error: err => this.showToast('error',
          err.error?.message ?? 'Update failed.',
          err.error?.message ?? 'فشل التحديث.'
        )
      });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  confirmDelete(id: string) {
    this.deletingId       = id;
    this.deleteConfirmed  = false;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.deletingId        = null;
    this.showDeleteConfirm = false;
    this.deleteConfirmed   = false;
  }

  doDelete() {
    if (!this.deletingId || !this.deleteConfirmed) return;
    const id = this.deletingId;
    this.serviceApi.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showDeleteConfirm = false;
          this.deletingId        = null;
          this.deleteConfirmed   = false;
          this.services          = this.services.filter(s => s._id !== id);
          this.showToast('success', 'Service deleted successfully.', 'تم حذف الخدمة بنجاح.');
        },
        error: err => {
          this.showDeleteConfirm = false;
          this.deletingId        = null;
          this.deleteConfirmed   = false;
          this.showToast('error',
            err.error?.message ?? 'Failed to delete the service.',
            err.error?.message ?? 'فشل حذف الخدمة.'
          );
        }
      });
  }
}