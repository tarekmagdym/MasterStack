import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

declare const AOS: any;

/**
 * Interface for main service data structure
 * Simplified - no translation keys needed
 */
interface MainService {
  id: string;
  badge: string;
  icon: string;
  technologies: string[];
}

/**
 * Interface for additional service data structure
 * Simplified - no translation keys needed
 */
interface AdditionalService {
  id: string;
  icon: string;
}

/**
 * Interface for process step data structure
 * Simplified - no translation keys needed
 */
interface ProcessStep {
  id: string;
  number: string;
}

/**
 * Interface for benefit data structure
 * Simplified - no translation keys needed
 */
interface Benefit {
  id: string;
  icon: string;
}

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './services-page.component.html',
  styleUrls: ['./services-page.component.scss']
})
export class ServicesPageComponent implements OnInit, OnDestroy {
  // Services
  private translateService = inject(TranslateService);
  private themeService = inject(ThemeService);
  
  // Component state
  currentLang: 'ar' | 'en' = 'en';
  isDarkMode: boolean = false;
  private destroy$ = new Subject<void>();
  
  /**
   * Main services data
   * Simplified structure - translations handled in template
   */
  mainServices: MainService[] = [
    {
      id: 'mobile',
      badge: '01',
      icon: 'mobile',
      technologies: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'Firebase']
    },
    {
      id: 'website',
      badge: '02',
      icon: 'website',
      technologies: ['Angular', 'React', 'Vue.js', 'Node.js', 'WordPress']
    },
    {
      id: 'subscription',
      badge: '03',
      icon: 'subscription',
      technologies: ['Stripe', 'PayPal', 'Laravel', 'MongoDB', 'AWS']
    }
  ];

  /**
   * Additional services data
   * Simplified structure
   */
  additionalServices: AdditionalService[] = [
    { id: 'cybersecurity', icon: 'shield' },
    { id: 'api', icon: 'box' },
    { id: 'consulting', icon: 'book' },
    { id: 'ai', icon: 'sparkles' },
    { id: 'analytics', icon: 'chart' },
    { id: 'support', icon: 'users' }
  ];

  /**
   * Process steps data
   * Simplified structure
   */
  processSteps: ProcessStep[] = [
    { id: 'consultation', number: '01' },
    { id: 'planning', number: '02' },
    { id: 'design', number: '03' },
    { id: 'development', number: '04' },
    { id: 'launch', number: '05' }
  ];

  /**
   * Benefits data
   * Simplified structure
   */
  benefits: Benefit[] = [
    { id: 'speed', icon: 'zap' },
    { id: 'quality', icon: 'star' },
    { id: 'security', icon: 'shield' },
    { id: 'support', icon: 'user' }
  ];

  constructor() {
    // Initialize component
  }

  ngOnInit(): void {
    // Subscribe to language changes
    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLang = lang as 'ar' | 'en';
        this.setDirection();
        this.refreshAOS();
      });

    // Subscribe to theme changes
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkMode = isDark;
      });

    // Initialize current values
    this.currentLang = this.translateService.currentLang;
    this.isDarkMode = this.themeService.isDarkMode;
    this.setDirection();

    // Initialize AOS animations
    this.initializeAOS();

    // Scroll to top when component loads
    this.scrollToTop();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize AOS (Animate On Scroll) library
   */
  private initializeAOS(): void {
    try {
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 800,
          easing: 'ease-in-out',
          once: true,
          offset: 100,
          delay: 0,
          anchorPlacement: 'top-bottom',
          disable: false
        });
      }
    } catch (error) {
      console.warn('AOS animation library not available:', error);
    }
  }

  /**
   * Refresh AOS to recalculate positions
   * Called after language/direction changes
   */
  private refreshAOS(): void {
    setTimeout(() => {
      try {
        if (typeof AOS !== 'undefined') {
          AOS.refresh();
        }
      } catch (error) {
        console.warn('Error refreshing AOS:', error);
      }
    }, 150);
  }

  /**
   * Set document direction based on current language
   */
  private setDirection(): void {
    const dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', this.currentLang);
  }

  /**
   * Scroll to top of page smoothly
   */
  private scrollToTop(): void {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      // Fallback for browsers that don't support smooth scrolling
      window.scrollTo(0, 0);
    }
  }

  /**
   * Track by function for ngFor optimization
   * @param index - Array index
   * @returns Index number
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Track main service by ID
   * @param index - Array index
   * @param service - Main service object
   * @returns Unique identifier
   */
  trackByService(index: number, service: MainService): string {
    return service.id;
  }

  /**
   * Track additional service by ID
   * @param index - Array index
   * @param service - Additional service object
   * @returns Unique identifier
   */
  trackByAdditionalService(index: number, service: AdditionalService): string {
    return service.id;
  }

  /**
   * Track process step by ID
   * @param index - Array index
   * @param step - Process step object
   * @returns Unique identifier
   */
  trackByStep(index: number, step: ProcessStep): string {
    return step.id;
  }

  /**
   * Track benefit by ID
   * @param index - Array index
   * @param benefit - Benefit object
   * @returns Unique identifier
   */
  trackByBenefit(index: number, benefit: Benefit): string {
    return benefit.id;
  }

  /**
   * Check if current language is RTL
   * @returns Boolean indicating RTL status
   */
  isRTL(): boolean {
    return this.currentLang === 'ar';
  }

  /**
   * Toggle language between English and Arabic
   */
  toggleLanguage(): void {
    const newLang: 'ar' | 'en' = this.currentLang === 'en' ? 'ar' : 'en';
    this.translateService.setLanguage(newLang);
  }

  /**
   * Toggle theme between light and dark mode
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}