import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService }     from '../../core/services/theme.service';
import { AuthService }      from '../../core/services/auth.service';
import { HttpClient }       from '@angular/common/http';
import API_ENDPOINTS, { CreateUserPayload, UpdateUserPayload } from '../../core/constants/api-endpoints';

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id:      string;
  type:    ToastType;
  titleEn: string; titleAr: string;
  msgEn:   string; msgAr:   string;
}

// ── User types ────────────────────────────────────────────────────────────────
interface ApiUser {
  _id:       string;
  name:      string;
  email:     string;
  role:      'super_admin' | 'admin' | 'employee';
  isActive:  boolean;
  lastLogin?: string;
  createdAt: string;
}

interface UserRow extends ApiUser {
  initials:     string;
  color:        string;
  roleLabel:    string;
  roleAr:       string;
  lastLoginFmt: string;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#0e3581',
  admin:       '#26cabc',
  employee:    '#7c3aed',
};

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  super_admin: { en: 'Super Admin', ar: 'مشرف عام' },
  admin:       { en: 'Admin',       ar: 'مشرف'     },
  employee:    { en: 'Employee',    ar: 'موظف'      },
};

function toRow(u: ApiUser): UserRow {
  const parts    = u.name.trim().split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : u.name.slice(0, 2).toUpperCase();

  let lastLoginFmt = '—';
  if (u.lastLogin) {
    const diff = Date.now() - new Date(u.lastLogin).getTime();
    const mins = Math.floor(diff / 60000);
    if      (mins < 2)    lastLoginFmt = 'Just now';
    else if (mins < 60)   lastLoginFmt = `${mins}m ago`;
    else if (mins < 1440) lastLoginFmt = `${Math.floor(mins / 60)}h ago`;
    else                  lastLoginFmt = `${Math.floor(mins / 1440)}d ago`;
  }

  return {
    ...u,
    initials,
    color:     ROLE_COLORS[u.role] ?? '#6b7280',
    roleLabel: ROLE_LABELS[u.role]?.en ?? u.role,
    roleAr:    ROLE_LABELS[u.role]?.ar ?? u.role,
    lastLoginFmt,
  };
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isDark = false;
  isRtl  = false;

  // ── Current user (self-protection) ───────────────────────────────────────
  currentUserId   = '';
  currentUserRole = '';

  get isSuperAdmin() { return this.currentUserRole === 'super_admin'; }

  // ── Toast ─────────────────────────────────────────────────────────────────
  toasts: ToastItem[] = [];

  // ── Data ──────────────────────────────────────────────────────────────────
  users:  UserRow[] = [];
  loading = false;
  error   = '';

  // ── Filters ───────────────────────────────────────────────────────────────
  searchQuery = '';
  roleFilter  = 'all';

  // ── Create ────────────────────────────────────────────────────────────────
  showModal   = false;
  saving      = false;
  createForm: CreateUserPayload = { name: '', email: '', password: '', role: 'admin' };
  createError = '';

  // ── Edit ──────────────────────────────────────────────────────────────────
  showEditModal = false;
  editTarget:   UserRow | null = null;
  editForm:     { name: string; email: string; role: string; isActive: boolean } =
    { name: '', email: '', role: 'admin', isActive: true };
  editSaving    = false;
  editError     = '';

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteTarget:      UserRow | null = null;
  showDeleteConfirm  = false;
  deleting           = false;
  deleteConfirmed    = false; // ← مطلوب للـ checkbox في modal الحذف

  // ── Computed ──────────────────────────────────────────────────────────────
  get activeCount() { return this.users.filter(u => u.isActive).length; }
  get superCount()  { return this.users.filter(u => u.role === 'super_admin').length; }

  get filteredUsers() {
    const q = this.searchQuery.toLowerCase();
    return this.users.filter(u => {
      const matchRole   = this.roleFilter === 'all' || u.role === this.roleFilter;
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }

  // ── Permission helpers (used in template) ────────────────────────────────
  canEdit(u: UserRow): boolean {
    if (!this.isSuperAdmin) return false;
    return !(u.role === 'super_admin' && u._id !== this.currentUserId);
  }

  canDelete(u: UserRow): boolean {
    if (!this.isSuperAdmin)           return false;
    if (u._id === this.currentUserId) return false;
    if (u.role === 'super_admin')     return false;
    return true;
  }

  constructor(
    private http:             HttpClient,
    private translateService: TranslateService,
    private themeService:     ThemeService,
    private authService:      AuthService,
  ) {}

  ngOnInit(): void {
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.isDark = d);

    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.isRtl = l === 'ar');

    const me = this.authService.getCurrentUser();
    if (me) { this.currentUserId = me._id; this.currentUserRole = me.role; }

    this.loadUsers();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ══════════════════════════════════════════════════════════════════════════
  // TOAST
  // ══════════════════════════════════════════════════════════════════════════

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

  dismissToast(id: string): void { this.toasts = this.toasts.filter(t => t.id !== id); }
  trackToastId(_: number, t: ToastItem): string { return t.id; }

  // ══════════════════════════════════════════════════════════════════════════
  // LOAD
  // ══════════════════════════════════════════════════════════════════════════

  loadUsers(): void {
    this.loading = true;
    this.error   = '';
    this.http.get<{ success: boolean; data: ApiUser[] }>(API_ENDPOINTS.USERS.GET_ALL)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next:  res => { this.users = res.data.map(toRow); },
        error: ()  => {
          this.error = this.isRtl ? 'تعذّر تحميل المستخدمين' : 'Failed to load users';
          this.showToast('error', 'Failed to load users.', 'تعذّر تحميل المستخدمين.');
        },
      });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CREATE
  // ══════════════════════════════════════════════════════════════════════════

  openCreateModal(): void {
    this.createForm  = { name: '', email: '', password: '', role: 'admin' };
    this.createError = '';
    this.showModal   = true;
  }

  submitCreate(): void {
    if (!this.createForm.name || !this.createForm.email || !this.createForm.password) {
      this.createError = this.isRtl ? 'يرجى ملء جميع الحقول' : 'Please fill all fields';
      this.showToast('warning', 'Please fill all required fields.', 'يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    this.saving = true; this.createError = '';
    this.http.post<{ success: boolean; data: ApiUser }>(API_ENDPOINTS.USERS.CREATE, this.createForm)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: res => {
          this.users     = [toRow(res.data), ...this.users];
          this.showModal = false;
          this.showToast('success', 'Admin account created.', 'تم إنشاء الحساب بنجاح.');
        },
        error: err => {
          const msg        = err?.error?.message ?? (this.isRtl ? 'حدث خطأ' : 'Something went wrong');
          this.createError = msg;
          this.showToast('error', msg, msg);
        },
      });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EDIT
  // ══════════════════════════════════════════════════════════════════════════

  openEditModal(u: UserRow): void {
    if (!this.canEdit(u)) {
      this.showToast('warning', 'You cannot edit this account.', 'لا يمكنك تعديل هذا الحساب.');
      return;
    }
    this.editTarget    = u;
    this.editForm      = { name: u.name, email: u.email, role: u.role, isActive: u.isActive };
    this.editError     = '';
    this.showEditModal = true;
  }

  submitEdit(): void {
    if (!this.editTarget) return;
    this.editSaving = true; this.editError = '';
    const payload: UpdateUserPayload = {
      name: this.editForm.name, email: this.editForm.email,
      role: this.editForm.role as any, isActive: this.editForm.isActive,
    };
    this.http.put<{ success: boolean; data: ApiUser }>(
      API_ENDPOINTS.USERS.UPDATE(this.editTarget._id), payload
    )
      .pipe(finalize(() => this.editSaving = false))
      .subscribe({
        next: res => {
          this.users         = this.users.map(u => u._id === res.data._id ? toRow(res.data) : u);
          this.showEditModal = false;
          this.showToast('success', 'Account updated.', 'تم تحديث الحساب بنجاح.');
        },
        error: err => {
          const msg      = err?.error?.message ?? (this.isRtl ? 'حدث خطأ' : 'Something went wrong');
          this.editError = msg;
          this.showToast('error', msg, msg);
        },
      });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE
  // ══════════════════════════════════════════════════════════════════════════

  openDeleteConfirm(u: UserRow): void {
    if (u._id === this.currentUserId) {
      this.showToast('warning', 'You cannot delete your own account.', 'لا يمكنك حذف حسابك الخاص.'); return;
    }
    if (u.role === 'super_admin') {
      this.showToast('warning', 'Super admin accounts cannot be deleted.', 'لا يمكن حذف حساب المشرف العام.'); return;
    }
    if (!this.canDelete(u)) {
      this.showToast('warning', 'You do not have permission to delete this account.', 'لا تملك صلاحية الحذف.'); return;
    }
    this.deleteTarget      = u;
    this.deleteConfirmed   = false; // ← reset كل مرة تفتح modal
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.deleteTarget      = null;
    this.showDeleteConfirm = false;
    this.deleteConfirmed   = false; // ← reset عند الإلغاء
  }

  confirmDelete(): void {
    if (!this.deleteTarget || !this.deleteConfirmed) return;
    this.deleting = true;
    this.http.delete<{ success: boolean }>(API_ENDPOINTS.USERS.DELETE(this.deleteTarget._id))
      .pipe(finalize(() => this.deleting = false))
      .subscribe({
        next: () => {
          this.users             = this.users.filter(u => u._id !== this.deleteTarget!._id);
          this.showDeleteConfirm = false;
          this.deleteTarget      = null;
          this.deleteConfirmed   = false; // ← reset بعد الحذف
          this.showToast('success', 'Account deleted.', 'تم حذف الحساب بنجاح.');
        },
        error: err => {
          this.showDeleteConfirm = false;
          this.deleteTarget      = null;
          this.deleteConfirmed   = false; // ← reset عند الخطأ
          this.showToast('error',
            err?.error?.message ?? 'Failed to delete.',
            err?.error?.message ?? 'فشل الحذف.'
          );
        },
      });
  }
}