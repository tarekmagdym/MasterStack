import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { TranslateService } from '../../core/services/translate.service';
import { ThemeService }     from '../../core/services/theme.service';
import {
  ProjectService,
  Project,
  ProjectPayload,
} from '../../core/services/Project.service';

// ── Toast types (local — no separate file needed) ─────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id:      string;
  type:    ToastType;
  titleEn: string;
  titleAr: string;
  msgEn:   string;
  msgAr:   string;
}

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-projects.component.html',
  styleUrls: ['./admin-projects.component.scss']
})
export class AdminProjectsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  isDark = false;
  isRtl  = false;

  // ── Toast state ───────────────────────────────────────────────────────────
  toasts: ToastItem[] = [];

  // ── Data ──────────────────────────────────────────────────────────────────
  projects: Project[] = [];
  loading  = false;
  error:   string | null = null;

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  totalPages  = 1;
  totalItems  = 0;
  pageLimit   = 12;

  // ── Filters ───────────────────────────────────────────────────────────────
  searchCtrl   = new FormControl('');
  activeFilter: 'all' | 'published' | 'draft' | 'featured' = 'all';

  // ── Modal ─────────────────────────────────────────────────────────────────
  showModal  = false;
  isEditMode = false;
  editingId: string | null = null;
  saving    = false;
  saveError: string | null = null;

  // ── Form ──────────────────────────────────────────────────────────────────
  form: ProjectPayload = this.emptyForm();
  techInput    = '';
  tagInputEn   = '';
  tagInputAr   = '';
  galleryInput = '';

  formErrors: Record<string, string> = {};

  // ── Delete ────────────────────────────────────────────────────────────────
  deletingId: string | null = null;
  showDeleteConfirm = false;
  deleteConfirmed   = false; // ← مطلوب للـ checkbox في modal الحذف

  readonly categoryOptions = [
    { value: 'web',       labelEn: 'Web Apps',    labelAr: 'تطبيقات الويب'       },
    { value: 'mobile',    labelEn: 'Mobile Apps', labelAr: 'تطبيقات الموبايل'    },
    { value: 'saas',      labelEn: 'SaaS',        labelAr: 'SaaS'                },
  ];

  constructor(
    private translateSvc: TranslateService,
    private themeSvc:     ThemeService,
    private projectSvc:   ProjectService
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.themeSvc.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.isDark = d);

    this.translateSvc.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.isRtl = l === 'ar');

    this.searchCtrl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadProjects();
    });

    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  showToast(
    type:    ToastType,
    msgEn:   string,
    msgAr:   string,
    titleEn?: string,
    titleAr?: string
  ): void {
    const defaults: Record<ToastType, { en: string; ar: string }> = {
      success: { en: 'Success', ar: 'تم بنجاح' },
      error:   { en: 'Error',   ar: 'خطأ'      },
      warning: { en: 'Warning', ar: 'تنبيه'    },
      info:    { en: 'Info',    ar: 'معلومة'   },
    };

    const id       = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const duration = type === 'error' ? 6000 : 4000;

    this.toasts = [...this.toasts, {
      id,
      type,
      titleEn: titleEn ?? defaults[type].en,
      titleAr: titleAr ?? defaults[type].ar,
      msgEn,
      msgAr,
    }];

    setTimeout(() => this.dismissToast(id), duration);
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  trackToastId(_: number, t: ToastItem): string { return t.id; }

  // ── Load ──────────────────────────────────────────────────────────────────

  loadProjects(): void {
    this.loading = true;
    this.error   = null;

    this.projectSvc
      .getAll(this.currentPage, this.pageLimit, this.searchCtrl.value ?? '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.projects   = res.data;
          this.totalPages = res.pagination.pages;
          this.totalItems = res.pagination.total;
          this.loading    = false;
        },
        error: (err) => {
          this.error   = err?.error?.message ?? (this.isRtl ? 'فشل تحميل المشاريع' : 'Failed to load projects');
          this.loading = false;
          this.showToast('error',
            'Failed to load projects. Please try again.',
            'فشل تحميل المشاريع، يرجى المحاولة مجدداً.'
          );
        }
      });
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  get filteredProjects(): Project[] {
    switch (this.activeFilter) {
      case 'published': return this.projects.filter(p =>  p.isPublished);
      case 'draft':     return this.projects.filter(p => !p.isPublished);
      case 'featured':  return this.projects.filter(p =>  p.isFeatured);
      default:          return this.projects;
    }
  }

  setFilter(f: typeof this.activeFilter): void { this.activeFilter = f; }

  // ── Pagination ────────────────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProjects();
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  title(p: Project): string {
    return this.isRtl ? (p.title.ar || p.title.en) : (p.title.en || p.title.ar);
  }

  desc(p: Project): string {
    const sd = this.isRtl ? p.shortDescription?.ar : p.shortDescription?.en;
    if (sd?.trim()) return sd;
    return this.isRtl ? p.description.ar : p.description.en;
  }

  initials(p: Project): string {
    return p.title.en.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }

  color(p: Project): string {
    const palette = ['#26cabc', '#0e3581', '#7c3aed', '#f59e0b', '#ef4444', '#16a34a'];
    return palette[parseInt(p._id.slice(-1), 16) % palette.length];
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString(this.isRtl ? 'ar-EG' : 'en-US', {
      month: 'short', year: 'numeric',
    });
  }

  categoryLabel(p: Project): string {
    const m = this.categoryOptions.find(c => c.value === p.category);
    return m ? (this.isRtl ? m.labelAr : m.labelEn) : p.category;
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  openAddModal(): void {
    this.isEditMode   = false;
    this.editingId    = null;
    this.form         = this.emptyForm();
    this.techInput    = '';
    this.tagInputEn   = '';
    this.tagInputAr   = '';
    this.galleryInput = '';
    this.formErrors   = {};
    this.saveError    = null;
    this.showModal    = true;
  }

  openEditModal(p: Project): void {
    this.isEditMode   = true;
    this.editingId    = p._id;
    this.formErrors   = {};
    this.saveError    = null;
    this.galleryInput = '';

    this.form = {
      title:            { en: p.title.en,            ar: p.title.ar            },
      description:      { en: p.description.en,      ar: p.description.ar      },
      shortDescription: { en: p.shortDescription?.en ?? '', ar: p.shortDescription?.ar ?? '' },
      tags:             (p.tags ?? []).map(t => ({ en: t.en, ar: t.ar })),
      thumbnail:        p.thumbnail,
      images:           [...(p.images ?? [])],
      technologies:     p.technologies  ?? [],
      category:         p.category,
      clientName:       p.clientName    ?? '',
      projectUrl:       p.projectUrl    ?? '',
      githubUrl:        p.githubUrl     ?? '',
      completionDate:   p.completionDate ? p.completionDate.split('T')[0] : '',
      isFeatured:       p.isFeatured,
      isPublished:      p.isPublished,
    };

    this.techInput  = (p.technologies ?? []).join(', ');
    this.tagInputEn = '';
    this.tagInputAr = '';
    this.showModal  = true;
  }

  closeModal(): void {
    this.showModal  = false;
    this.saving     = false;
    this.saveError  = null;
    this.formErrors = {};
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  addTag(): void {
    const en = this.tagInputEn.trim();
    const ar = this.tagInputAr.trim();
    if (!en && !ar) return;
    this.form.tags = [...(this.form.tags ?? []), { en, ar }];
    this.tagInputEn = '';
    this.tagInputAr = '';
  }

  removeTag(i: number): void { this.form.tags?.splice(i, 1); }

  // ── Gallery ───────────────────────────────────────────────────────────────

  addGalleryImage(): void {
    const url = this.galleryInput.trim();
    if (!url) return;
    if (!this.form.images) this.form.images = [];

    if (this.form.images.includes(url)) {
      this.showToast('warning',
        'This image URL is already in the gallery.',
        'هذا الرابط موجود بالفعل في المعرض.'
      );
      return;
    }

    this.form.images  = [...this.form.images, url];
    this.galleryInput = '';
  }

  removeGalleryImage(i: number): void { this.form.images?.splice(i, 1); }

  moveGalleryImageUp(i: number): void {
    if (!this.form.images || i === 0) return;
    const arr = [...this.form.images];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    this.form.images = arr;
  }

  moveGalleryImageDown(i: number): void {
    if (!this.form.images || i >= this.form.images.length - 1) return;
    const arr = [...this.form.images];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    this.form.images = arr;
  }

  // ── Validation ────────────────────────────────────────────────────────────

  private validate(): boolean {
    this.formErrors = {};
    const r = this.isRtl;

    if (!this.form.title.en.trim())
      this.formErrors['title.en']  = r ? 'الاسم بالإنجليزي مطلوب'     : 'English title is required';
    if (!this.form.title.ar.trim())
      this.formErrors['title.ar']  = r ? 'الاسم بالعربي مطلوب'         : 'Arabic title is required';
    if (!this.form.description.en.trim())
      this.formErrors['desc.en']   = r ? 'الوصف بالإنجليزي مطلوب'     : 'English description is required';
    if (!this.form.description.ar.trim())
      this.formErrors['desc.ar']   = r ? 'الوصف بالعربي مطلوب'         : 'Arabic description is required';
    if (!this.form.thumbnail.trim())
      this.formErrors['thumbnail'] = r ? 'رابط الصورة الرئيسية مطلوب' : 'Thumbnail URL is required';
    if (!this.form.category.trim())
      this.formErrors['category']  = r ? 'التصنيف مطلوب'               : 'Category is required';

    return Object.keys(this.formErrors).length === 0;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  save(): void {
    if (this.saving) return;

    this.form.technologies = this.techInput.split(',').map(t => t.trim()).filter(Boolean);

    if (!this.validate()) {
      this.showToast('warning',
        'Please fill in all required fields before saving.',
        'يرجى ملء جميع الحقول المطلوبة قبل الحفظ.'
      );
      return;
    }

    this.saving    = true;
    this.saveError = null;

    const payload: ProjectPayload = {
      ...this.form,
      completionDate:
        this.form.completionDate?.trim() ? this.form.completionDate : undefined,
      shortDescription:
        this.form.shortDescription?.en?.trim() || this.form.shortDescription?.ar?.trim()
          ? this.form.shortDescription
          : undefined,
      tags:   (this.form.tags   ?? []).filter(t => t.en.trim() || t.ar.trim()),
      images: (this.form.images ?? []).filter(Boolean),
    };

    const isEdit   = this.isEditMode && !!this.editingId;
    const request$ = isEdit
      ? this.projectSvc.update(this.editingId!, payload)
      : this.projectSvc.create(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving    = false;
        this.showModal = false;
        this.showToast('success',
          isEdit ? 'Project updated successfully.' : 'Project added successfully.',
          isEdit ? 'تم تعديل المشروع بنجاح.'       : 'تم إضافة المشروع بنجاح.'
        );
        this.loadProjects();
      },
      error: (err) => {
        this.saving    = false;
        const msg      = err?.error?.message;
        this.saveError = msg ?? (this.isRtl ? 'فشل الحفظ' : 'Failed to save');
        this.showToast('error',
          msg ?? 'Failed to save the project. Please try again.',
          msg ?? 'فشل حفظ المشروع. يرجى المحاولة مرة أخرى.'
        );
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  confirmDelete(id: string): void {
    this.deletingId        = id;
    this.deleteConfirmed   = false; // ← reset الـ checkbox كل مرة بتفتح modal الحذف
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.deletingId        = null;
    this.showDeleteConfirm = false;
    this.deleteConfirmed   = false; // ← reset عند الإلغاء
  }

  doDelete(): void {
    if (!this.deletingId || !this.deleteConfirmed) return;
    const id = this.deletingId;

    this.projectSvc.delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showDeleteConfirm = false;
          this.deletingId        = null;
          this.deleteConfirmed   = false; // ← reset بعد الحذف
          this.showToast('success',
            'Project deleted successfully.',
            'تم حذف المشروع بنجاح.'
          );
          this.loadProjects();
        },
        error: (err) => {
          this.showDeleteConfirm = false;
          this.deletingId        = null;
          this.deleteConfirmed   = false; // ← reset عند الخطأ
          this.showToast('error',
            err?.error?.message ?? 'Failed to delete the project.',
            err?.error?.message ?? 'فشل حذف المشروع.'
          );
        }
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private emptyForm(): ProjectPayload {
    return {
      title:            { en: '', ar: '' },
      description:      { en: '', ar: '' },
      shortDescription: { en: '', ar: '' },
      tags:             [],
      thumbnail:        '',
      images:           [],
      technologies:     [],
      category:         '',
      clientName:       '',
      projectUrl:       '',
      githubUrl:        '',
      completionDate:   '',
      isFeatured:       false,
      isPublished:      true,
    };
  }
}