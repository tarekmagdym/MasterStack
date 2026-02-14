import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';
import AOS from 'aos';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode: boolean = false;
  
  private langSubscription?: Subscription;
  private themeSubscription?: Subscription;

  constructor(
    private translateService: TranslateService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Initialize AOS animations
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100,
      delay: 0
    });

    // Subscribe to language changes
    this.langSubscription = this.translateService.currentLang$.subscribe(lang => {
      this.currentLang = lang as 'ar' | 'en';
      // Refresh AOS on language change to recalculate positions
      setTimeout(() => AOS.refresh(), 100);
    });

    // Subscribe to theme changes
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      // Refresh AOS on theme change to recalculate positions if needed
      setTimeout(() => AOS.refresh(), 100);
    });
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }
}