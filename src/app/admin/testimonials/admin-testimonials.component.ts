import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { TestimonialService, Testimonial, TestimonialPayload, BilingualField } from '../../core/services/Testimonial.service';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; type: ToastType; title: string; message: string; }

const AVATAR_COLORS = ['#0e3581','#26cabc','#8b5cf6','#ef4444','#f59e0b','#22c55e','#ec4899','#0ea5e9'];

@Component({
  selector: 'app-admin-testimonials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-testimonials.component.html',
  styleUrls: ['./admin-testimonials.component.scss'],
})
export class AdminTestimonialsComponent implements OnInit, OnDestroy {
  private destroy$  = new Subject<void>();
  private toastSeed = 0;

  isDark = false;
  isRtl  = false;
  toasts: Toast[] = [];

  // ── Data ──────────────────────────────────────────────────
  testimonials: Testimonial[] = [];
  filtered:     Testimonial[] = [];
  loading = true;

  // ── Filters ───────────────────────────────────────────────
  search       = '';
  filterStatus = '';
  filterRating = '';

  // ── Modal ─────────────────────────────────────────────────
  modalOpen = false;
  isEditing = false;
  saving    = false;
  editingId = '';

  form: TestimonialPayload = this.emptyForm();
  avatarColors = AVATAR_COLORS;

  // ── Delete confirm ────────────────────────────────────────
  deleteTarget:    Testimonial | null = null;
  deleteConfirmed = false;

  constructor(
    private testimonialService: TestimonialService,
    private translateService:   TranslateService,
    private themeService:       ThemeService,
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
    this.testimonialService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.testimonials = res.data ?? [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('error', this.t('Load failed', 'فشل التحميل'), this.t('Could not load testimonials', 'تعذّر تحميل التقييمات'));
      }
    });
  }

  // ── Filter ────────────────────────────────────────────────
  applyFilter(): void {
    const s = this.search.toLowerCase();
    this.filtered = this.testimonials.filter(t => {
      const text = `${t.name.en} ${t.name.ar} ${t.company.en} ${t.company.ar}`.toLowerCase();
      const matchSearch = !s || text.includes(s);
      const matchStatus = !this.filterStatus ||
        (this.filterStatus === 'active'   &&  t.isActive) ||
        (this.filterStatus === 'inactive' && !t.isActive);
      const matchRating = !this.filterRating || t.rating === +this.filterRating;
      return matchSearch && matchStatus && matchRating;
    });
  }

  clearFilters(): void {
    this.search = ''; this.filterStatus = ''; this.filterRating = '';
    this.applyFilter();
  }

  // ── Modal ─────────────────────────────────────────────────
  openCreate(): void {
    this.form      = this.emptyForm();
    this.isEditing = false;
    this.editingId = '';
    this.modalOpen = true;
  }

  openEdit(t: Testimonial): void {
    this.form = {
      name:        { en: t.name.en,        ar: t.name.ar        },
      position:    { en: t.position.en,    ar: t.position.ar    },
      company:     { en: t.company.en,     ar: t.company.ar     },
      content:     { en: t.content.en,     ar: t.content.ar     },
      rating:      t.rating,
      avatar:      t.avatar ?? '',
      avatarColor: t.avatarColor,
      isActive:    t.isActive,
      order:       t.order,
    };
    this.isEditing = true;
    this.editingId = t._id;
    this.modalOpen = true;
  }

  closeModal(): void { this.modalOpen = false; }

  save(): void {
    const { name, position, company, content } = this.form;
    if (!name.en.trim() || !name.ar.trim() || !position.en.trim() || !company.en.trim() || !content.en.trim()) {
      this.showToast('error', this.t('Required fields', 'حقول مطلوبة'), this.t('Please fill all required fields', 'يرجى تعبئة جميع الحقول المطلوبة'));
      return;
    }
    this.saving = true;

    const req$ = this.isEditing
      ? this.testimonialService.update(this.editingId, this.form)
      : this.testimonialService.create(this.form);

    req$.subscribe({
      next: () => {
        this.saving    = false;
        this.modalOpen = false;
        this.showToast('success',
          this.isEditing ? this.t('Updated', 'تم التحديث') : this.t('Created', 'تم الإنشاء'),
          this.isEditing ? this.t('Testimonial updated successfully', 'تم تحديث التقييم بنجاح') : this.t('Testimonial created successfully', 'تم إنشاء التقييم بنجاح')
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
  confirmDelete(t: Testimonial): void { this.deleteTarget = t; this.deleteConfirmed = false; }
  cancelDelete():  void { this.deleteTarget = null; }

  doDelete(): void {
    if (!this.deleteTarget || !this.deleteConfirmed) return;
    this.testimonialService.delete(this.deleteTarget._id).subscribe({
      next: () => {
        this.showToast('success', this.t('Deleted', 'تم الحذف'), this.t('Testimonial deleted', 'تم حذف التقييم'));
        this.deleteTarget = null;
        this.loadData();
      },
      error: err => this.showToast('error', this.t('Delete failed', 'فشل الحذف'), err?.error?.message ?? '')
    });
  }

  // ── Toggle active ─────────────────────────────────────────
  toggleActive(t: Testimonial): void {
    this.testimonialService.update(t._id, { isActive: !t.isActive }).subscribe({
      next: () => {
        t.isActive = !t.isActive;
        this.showToast('info',
          t.isActive ? this.t('Activated', 'تم التفعيل') : this.t('Deactivated', 'تم الإلغاء'),
          t.isActive ? this.t('Testimonial is now visible', 'التقييم مرئي الآن') : this.t('Testimonial is now hidden', 'التقييم مخفي الآن')
        );
      },
      error: () => this.showToast('error', this.t('Failed', 'فشل'), this.t('Could not update status', 'تعذّر تحديث الحالة'))
    });
  }

  // ── Helpers ───────────────────────────────────────────────
  private emptyForm(): TestimonialPayload {
    return {
      name:        { en: '', ar: '' },
      position:    { en: '', ar: '' },
      company:     { en: '', ar: '' },
      content:     { en: '', ar: '' },
      rating:      5, avatar: '', avatarColor: AVATAR_COLORS[0], isActive: true, order: 0,
    };
  }

  t(en: string, ar: string): string { return this.isRtl ? ar : en; }

  getName(item: Testimonial): string    { return this.isRtl ? item.name.ar    : item.name.en; }
  getCompany(item: Testimonial): string { return this.isRtl ? item.company.ar : item.company.en; }
  getPosition(item: Testimonial): string{ return this.isRtl ? item.position.ar: item.position.en; }
  getContent(item: Testimonial): string { return this.isRtl ? item.content.ar : item.content.en; }

  getInitials(name: BilingualField): string {
    const n = this.isRtl ? name.ar : name.en;
    return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getStars(rating: number): number[] { return Array.from({ length: 5 }, (_, i) => i + 1); }

  setRating(r: number): void { this.form.rating = r; }

  trackBy(_: number, t: Testimonial): string { return t._id; }
  trackToast(_: number, t: Toast): number    { return t.id; }

  // ── Toast ─────────────────────────────────────────────────
  private showToast(type: ToastType, title: string, message = '', duration = 3500): void {
    const id = ++this.toastSeed;
    this.toasts = [...this.toasts, { id, type, title, message }];
    setTimeout(() => this.removeToast(id), duration);
  }
  removeToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }
}