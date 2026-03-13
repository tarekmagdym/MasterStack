import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { ContactService } from '../../core/services/Contact.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss']
})
export class ContactPageComponent implements OnInit, OnDestroy {
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode = false;
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;

  // ── Inline Toast ────────────────────────────────────────────
  toast: { visible: boolean; type: 'success' | 'error'; message: string; sub: string } = {
    visible: false, type: 'success', message: '', sub: ''
  };
  private toastTimer?: ReturnType<typeof setTimeout>;

  private langSubscription?: Subscription;
  private themeSubscription?: Subscription;

  companyInfo = {
    address: { en: 'Cairo, Egypt', ar: 'القاهرة، مصر' },
    phone: '01127140695',
    email: 'masterstackk.official@gmail.com',
    workingHours: {
      en: 'Sunday - Thursday: 9:00 AM - 6:00 PM',
      ar: 'الأحد - الخميس: 9:00 صباحاً - 6:00 مساءً'
    }
  };

  constructor(
    private fb: FormBuilder,
    public translateService: TranslateService,
    public themeService: ThemeService,
    private contactService: ContactService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.contactForm = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(2)]],
      email:   ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.langSubscription = this.translateService.currentLang$.subscribe(lang => {
      this.currentLang = lang as 'ar' | 'en';
      this.updateSeoTags();
    });
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    this.updateSeoTags();
    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({ duration: 600, easing: 'ease-in-out', once: true, offset: 50 });
    }
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── SEO (same pattern as home) ───────────────────────────────
  private updateSeoTags(): void {
    if (this.currentLang === 'ar') {
      this.titleService.setTitle('تواصل معنا | ماستر ستاك - حلول برمجية متقدمة');
      this.metaService.updateTag({ name: 'description', content: 'تواصل مع فريق ماستر ستاك للحصول على استشارة مجانية أو لمناقشة مشروعك البرمجي. نحن في القاهرة، مصر، ونرد على استفساراتك بسرعة.' });
      this.metaService.updateTag({ name: 'keywords', content: 'تواصل معنا, ماستر ستاك, استشارة مجانية, مشروع برمجي, تطوير ويب, القاهرة مصر' });
      this.metaService.updateTag({ property: 'og:title', content: 'تواصل معنا | ماستر ستاك - حلول برمجية متقدمة' });
      this.metaService.updateTag({ property: 'og:description', content: 'تواصل مع فريق ماستر ستاك للحصول على استشارة مجانية أو لمناقشة مشروعك البرمجي.' });
      this.metaService.updateTag({ property: 'og:type', content: 'website' });
      this.metaService.updateTag({ property: 'og:url', content: 'https://masterstack.com/contact' });
      this.metaService.updateTag({ property: 'og:locale', content: 'ar_EG' });
      this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.metaService.updateTag({ name: 'twitter:title', content: 'تواصل معنا | ماستر ستاك' });
      this.metaService.updateTag({ name: 'twitter:description', content: 'تواصل مع فريق ماستر ستاك للحصول على استشارة مجانية.' });
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    } else {
      this.titleService.setTitle('Contact Us | MasterStack - Advanced Software Solutions');
      this.metaService.updateTag({ name: 'description', content: 'Get in touch with the MasterStack team for a free consultation or to discuss your software project. Based in Cairo, Egypt. We respond quickly.' });
      this.metaService.updateTag({ name: 'keywords', content: 'contact MasterStack, free consultation, software project, web development, Cairo Egypt, get in touch' });
      this.metaService.updateTag({ property: 'og:title', content: 'Contact Us | MasterStack - Advanced Software Solutions' });
      this.metaService.updateTag({ property: 'og:description', content: 'Get in touch with the MasterStack team for a free consultation or to discuss your software project.' });
      this.metaService.updateTag({ property: 'og:type', content: 'website' });
      this.metaService.updateTag({ property: 'og:url', content: 'https://masterstack.com/contact' });
      this.metaService.updateTag({ property: 'og:locale', content: 'en_US' });
      this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.metaService.updateTag({ name: 'twitter:title', content: 'Contact Us | MasterStack' });
      this.metaService.updateTag({ name: 'twitter:description', content: 'Get in touch with the MasterStack team for a free consultation.' });
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    }
  }

  // ── Toast ────────────────────────────────────────────────────
  private showToast(type: 'success' | 'error', message: string, sub: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { visible: true, type, message, sub };
    this.toastTimer = setTimeout(() => this.dismissToast(), 5000);
  }

  dismissToast(): void {
    this.toast = { ...this.toast, visible: false };
  }

  // ── Form helpers ─────────────────────────────────────────────
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.hasError('required'))
      return this.currentLang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
    if (field?.hasError('email'))
      return this.currentLang === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address';
    if (field?.hasError('minlength')) {
      const min = field.errors?.['minlength'].requiredLength;
      return this.currentLang === 'ar' ? `الحد الأدنى ${min} أحرف` : `Minimum ${min} characters required`;
    }
    return '';
  }

  // ── Submit ───────────────────────────────────────────────────
  onSubmit(): void {
    if (this.contactForm.invalid) {
      Object.keys(this.contactForm.controls).forEach(k => this.contactForm.get(k)?.markAsTouched());
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError   = false;

    const { name, email, subject, message } = this.contactForm.value;

    this.contactService.submitContact({ name, email, subject, message }).subscribe({
      next: () => {
        this.isSubmitting  = false;
        this.submitSuccess = true;
        this.contactForm.reset();
        this.showToast(
          'success',
          this.currentLang === 'ar' ? 'تم الإرسال بنجاح!' : 'Message Sent!',
          this.currentLang === 'ar' ? 'شكراً لتواصلك معنا. سنرد عليك قريباً.' : "Thank you for contacting us. We'll respond soon."
        );
        setTimeout(() => { this.submitSuccess = false; }, 5000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError  = true;
        const msg = err?.error?.message;
        this.showToast(
          'error',
          this.currentLang === 'ar' ? 'فشل الإرسال' : 'Send Failed',
          msg ?? (this.currentLang === 'ar' ? 'حدث خطأ، يرجى المحاولة مجدداً.' : 'Something went wrong, please try again.')
        );
      }
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}