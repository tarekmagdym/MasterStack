import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
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
  isDarkMode: boolean = false;
  contactForm: FormGroup;
  isSubmitting: boolean = false;
  submitSuccess: boolean = false;
  submitError: boolean = false;
  
  private langSubscription?: Subscription;
  private themeSubscription?: Subscription;

  // Company Information
  companyInfo = {
    address: {
      en: 'Cairo, Egypt',
      ar: 'القاهرة، مصر'
    },
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
    public themeService: ThemeService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Subscribe to language changes
    this.langSubscription = this.translateService.currentLang$.subscribe(lang => {
      this.currentLang = lang as 'ar' | 'en';
    });

    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });

    // Initialize AOS
    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        offset: 50
      });
    }
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }



  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return this.currentLang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
    }
    
    if (field?.hasError('email')) {
      return this.currentLang === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address';
    }
    
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return this.currentLang === 'ar' 
        ? `الحد الأدنى ${minLength} أحرف`
        : `Minimum ${minLength} characters required`;
    }
    
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;

    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.submitSuccess = true;
      this.contactForm.reset();

      // Hide success message after 5 seconds
      setTimeout(() => {
        this.submitSuccess = false;
      }, 5000);
    }, 1500);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}