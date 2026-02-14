import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode: boolean = false;
  currentYear: number = new Date().getFullYear();
  companyEmail: string = 'masterstackk.official@gmail.com';
  private langSubscription?: Subscription;
  private themeSubscription?: Subscription;

  constructor(
    private translateService: TranslateService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Subscribe to language changes
    this.langSubscription = this.translateService.currentLang$.subscribe(lang => {
      this.currentLang = lang as 'ar' | 'en';
    });

    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }

  /**
   * Handle newsletter form submission
   */
  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const email = emailInput?.value;

    if (email) {
      console.log('Newsletter subscription:', email);
      // TODO: Implement newsletter subscription API call
      // For now, just show a success message
      alert(this.currentLang === 'ar' 
        ? 'شكراً لاشتراكك في النشرة الإخبارية!' 
        : 'Thank you for subscribing to our newsletter!'
      );
      
      // Reset form
      form.reset();
    }
  }
}