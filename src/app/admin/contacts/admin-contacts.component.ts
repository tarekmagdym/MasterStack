import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  ContactService,
  ContactMessage,
  stringToColor,
  getInitials,
  timeAgo,
  formatDate,
} from '../../core/services/Contact.service';

export interface ContactViewModel {
  _id:      string;
  name:     string;
  email:    string;
  phone?:   string;
  initials: string;
  color:    string;
  subject:  string;
  message:  string;
  time:     string;
  date:     string;
  read:     boolean;
  replied:  boolean;
}

interface SentReply {
  text: string;
  time: string;
}

// ── localStorage keys ──────────────────────────────────────────────────────────
const LS_REPLIED_IDS   = 'ms_replied_ids';    // string[]  — list of replied message IDs
const LS_SENT_REPLIES  = 'ms_sent_replies';   // Record<id, SentReply[]>

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-contacts.component.html',
  styleUrls: ['./admin-contacts.component.scss'],
})
export class AdminContactsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── Persistent state (backed by localStorage) ─────────────────────────────
  private repliedIds  = new Set<string>();
  private sentReplies = new Map<string, SentReply[]>();

  // ── UI state ──────────────────────────────────────────────────────────────
  isDark = false;
  isRtl  = false;

  contacts:    ContactViewModel[] = [];
  isLoading    = false;
  hasError     = false;
  errorMsg     = '';
  activeTab    = 'all';
  selectedId:  string | null = null;
  replyText    = '';
  isSending    = false;
  unreadCount  = 0;

  toast: { visible: boolean; type: 'success' | 'error'; message: string; sub: string } = {
    visible: false, type: 'success', message: '', sub: ''
  };
  private toastTimer?: ReturnType<typeof setTimeout>;

  // ── Getters ───────────────────────────────────────────────────────────────
  get selected(): ContactViewModel | undefined {
    return this.contacts.find(c => c._id === this.selectedId);
  }

  get filteredContacts(): ContactViewModel[] {
    if (this.activeTab === 'unread')  return this.contacts.filter(c => !c.read);
    if (this.activeTab === 'replied') return this.contacts.filter(c => c.replied);
    return this.contacts;
  }

  get repliedCount(): number {
    return this.contacts.filter(c => c.replied).length;
  }

  getSentReplies(id: string): SentReply[] {
    return this.sentReplies.get(id) ?? [];
  }

  constructor(
    private translateService: TranslateService,
    private themeService: ThemeService,
    private contactService: ContactService,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // restore persisted data FIRST before loading messages
    this.loadFromStorage();

    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(d => this.isDark = d);

    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(l => this.isRtl = l === 'ar');

    this.loadMessages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  showToast(type: 'success' | 'error', message: string, sub: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { visible: true, type, message, sub };
    this.toastTimer = setTimeout(() => this.dismissToast(), 5000);
  }

  dismissToast(): void {
    this.toast = { ...this.toast, visible: false };
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  loadMessages(): void {
    this.isLoading = true;
    this.hasError  = false;

    this.contactService.getMessages({ limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.contacts    = res.data.map(m => this.toViewModel(m));
          this.unreadCount = res.unreadCount;
          this.isLoading   = false;

          // clean up localStorage for deleted messages
          this.pruneStorage(res.data.map(m => m._id));
        },
        error: (err) => {
          this.hasError  = true;
          this.errorMsg  = err?.error?.message ?? 'Failed to load messages.';
          this.isLoading = false;
        },
      });
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  select(c: ContactViewModel): void {
    this.selectedId = c._id;
    this.replyText  = '';

    if (!c.read) {
      this.contactService.getMessage(c._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            const idx = this.contacts.findIndex(x => x._id === c._id);
            if (idx !== -1) this.contacts[idx] = this.toViewModel(res.data);
            this.recalcUnread();
          },
          error: () => { c.read = true; this.recalcUnread(); },
        });
    }
  }

  toggleRead(c: ContactViewModel): void {
    this.contactService.toggleRead(c._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const idx = this.contacts.findIndex(x => x._id === c._id);
          if (idx !== -1) this.contacts[idx] = this.toViewModel(res.data);
          this.recalcUnread();
        },
        error: () => { c.read = !c.read; this.recalcUnread(); },
      });
  }

  markAllRead(): void {
    this.contacts.filter(c => !c.read).forEach(c => {
      this.contactService.toggleRead(c._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => { c.read = true; this.recalcUnread(); },
          error: () => { c.read = true; this.recalcUnread(); },
        });
    });
  }

  deleteContact(id: string): void {
    this.contactService.deleteMessage(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // remove from localStorage too
          this.repliedIds.delete(id);
          this.sentReplies.delete(id);
          this.saveToStorage();

          this.contacts = this.contacts.filter(c => c._id !== id);
          if (this.selectedId === id) this.selectedId = null;
          this.recalcUnread();
        },
        error: (err) => {
          this.showToast('error',
            this.isRtl ? 'فشل الحذف' : 'Delete Failed',
            err?.error?.message ?? (this.isRtl ? 'حدث خطأ' : 'Something went wrong.')
          );
        },
      });
  }

  sendReply(): void {
    if (!this.replyText.trim() || !this.selected) return;

    this.isSending = true;
    const id             = this.selected._id;
    const recipientEmail = this.selected.email;
    const text           = this.replyText.trim();

    this.contactService.replyToMessage(id, text)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSending = false;
          this.replyText = '';

          // ✅ add to sentReplies and persist
          const existing = this.sentReplies.get(id) ?? [];
          existing.push({ text, time: this.nowLabel() });
          this.sentReplies.set(id, existing);

          // ✅ mark as replied and persist
          this.repliedIds.add(id);
          this.saveToStorage();

          // update contact in list
          const idx = this.contacts.findIndex(c => c._id === id);
          if (idx !== -1) {
            this.contacts[idx].read    = true;
            this.contacts[idx].replied = true;
          }
          this.recalcUnread();

          this.showToast('success',
            this.isRtl ? 'تم إرسال الرد!' : 'Reply Sent!',
            this.isRtl ? `تم إرسال الرد إلى ${recipientEmail}` : `Reply sent to ${recipientEmail}`
          );
        },
        error: (err) => {
          this.isSending = false;
          this.showToast('error',
            this.isRtl ? 'فشل الإرسال' : 'Send Failed',
            err?.error?.message ?? (this.isRtl ? 'حدث خطأ، حاول مجدداً.' : 'Something went wrong, please try again.')
          );
        },
      });
  }

  // ── localStorage helpers ──────────────────────────────────────────────────

  /** Save repliedIds and sentReplies to localStorage */
  private saveToStorage(): void {
    try {
      localStorage.setItem(LS_REPLIED_IDS,  JSON.stringify([...this.repliedIds]));
      localStorage.setItem(LS_SENT_REPLIES, JSON.stringify(Object.fromEntries(this.sentReplies)));
    } catch { /* storage full or unavailable — fail silently */ }
  }

  /** Restore repliedIds and sentReplies from localStorage on init */
  private loadFromStorage(): void {
    try {
      const ids = localStorage.getItem(LS_REPLIED_IDS);
      if (ids) this.repliedIds = new Set<string>(JSON.parse(ids));

      const replies = localStorage.getItem(LS_SENT_REPLIES);
      if (replies) {
        const obj: Record<string, SentReply[]> = JSON.parse(replies);
        this.sentReplies = new Map(Object.entries(obj));
      }
    } catch { /* corrupted data — start fresh */ }
  }

  /**
   * After loading messages from server, remove any stored IDs for messages
   * that no longer exist (were deleted from backend).
   */
  private pruneStorage(activeIds: string[]): void {
    const activeSet = new Set(activeIds);
    let changed = false;

    this.repliedIds.forEach(id => {
      if (!activeSet.has(id)) { this.repliedIds.delete(id); changed = true; }
    });

    this.sentReplies.forEach((_, id) => {
      if (!activeSet.has(id)) { this.sentReplies.delete(id); changed = true; }
    });

    if (changed) this.saveToStorage();
  }

  // ── Internal helpers ──────────────────────────────────────────────────────
  private toViewModel(m: ContactMessage): ContactViewModel {
    return {
      _id:      m._id,
      name:     m.name,
      email:    m.email,
      phone:    m.phone,
      initials: getInitials(m.name),
      color:    stringToColor(m.name),
      subject:  m.subject || '(No subject)',
      message:  m.message,
      time:     timeAgo(m.createdAt),
      date:     formatDate(m.createdAt),
      read:     m.isRead,
      replied:  this.repliedIds.has(m._id),  // ✅ restored from localStorage
    };
  }

  private recalcUnread(): void {
    this.unreadCount = this.contacts.filter(c => !c.read).length;
  }

  private nowLabel(): string {
    const now = new Date();
    return now.toLocaleTimeString(this.isRtl ? 'ar-EG' : 'en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  }
}