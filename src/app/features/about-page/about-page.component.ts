import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

declare const AOS: any;

/**
 * Interface for team member data structure
 * Contains translation keys for dynamic content
 */
interface TeamMember {
  id: string;
  nameKey: string;
  roleKey: string;
  bioKey: string;
  linkedin?: string;
  twitter?: string;
  image?: string;
}

/**
 * Interface for company value data structure
 * Contains translation keys and icon identifier
 */
interface CompanyValue {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: 'clock' | 'shield' | 'sparkles' | 'users' | 'user' | 'activity';
}

/**
 * Interface for company statistics
 * Number is static, label comes from translation
 */
interface CompanyStat {
  id: string;
  number: string;
  labelKey: string;
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss']
})
export class AboutPageComponent implements OnInit, OnDestroy {
  // Services
  private translateService = inject(TranslateService);
  private themeService = inject(ThemeService);
  
  // Component state
  currentLang: 'ar' | 'en' = 'en';
  isDarkMode: boolean = false;
  private destroy$ = new Subject<void>();
  
  /**
   * Company statistics data
   * Uses translation keys for labels
   */
  companyStats: CompanyStat[] = [
    { 
      id: 'experience',
      number: '5+', 
      labelKey: 'about.hero.stats.experience.label'
    },
    { 
      id: 'projects',
      number: '50+', 
      labelKey: 'about.hero.stats.projects.label'
    },
    { 
      id: 'clients',
      number: '30+', 
      labelKey: 'about.hero.stats.clients.label'
    },
    { 
      id: 'team',
      number: '15+', 
      labelKey: 'about.hero.stats.team.label'
    }
  ];

  /**
   * Company core values data
   * Uses translation keys for titles and descriptions
   */
  companyValues: CompanyValue[] = [
    {
      id: 'quality',
      titleKey: 'about.values.list.quality.title',
      descriptionKey: 'about.values.list.quality.description',
      icon: 'clock'
    },
    {
      id: 'integrity',
      titleKey: 'about.values.list.integrity.title',
      descriptionKey: 'about.values.list.integrity.description',
      icon: 'shield'
    },
    {
      id: 'innovation',
      titleKey: 'about.values.list.innovation.title',
      descriptionKey: 'about.values.list.innovation.description',
      icon: 'sparkles'
    },
    {
      id: 'collaboration',
      titleKey: 'about.values.list.collaboration.title',
      descriptionKey: 'about.values.list.collaboration.description',
      icon: 'users'
    },
    {
      id: 'customer',
      titleKey: 'about.values.list.customer.title',
      descriptionKey: 'about.values.list.customer.description',
      icon: 'user'
    },
    {
      id: 'learning',
      titleKey: 'about.values.list.learning.title',
      descriptionKey: 'about.values.list.learning.description',
      icon: 'activity'
    }
  ];

  /**
   * Team members data
   * Uses translation keys for names, roles, and bios
   */
  teamMembers: TeamMember[] = [
    {
      id: 'ceo',
      nameKey: 'about.team.members.ceo.name',
      roleKey: 'about.team.members.ceo.role',
      bioKey: 'about.team.members.ceo.bio',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'dev_lead',
      nameKey: 'about.team.members.dev_lead.name',
      roleKey: 'about.team.members.dev_lead.role',
      bioKey: 'about.team.members.dev_lead.bio',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'design_lead',
      nameKey: 'about.team.members.design_lead.name',
      roleKey: 'about.team.members.design_lead.role',
      bioKey: 'about.team.members.design_lead.bio',
      linkedin: '#',
      twitter: '#'
    },
    {
      id: 'pm',
      nameKey: 'about.team.members.pm.name',
      roleKey: 'about.team.members.pm.role',
      bioKey: 'about.team.members.pm.bio',
      linkedin: '#',
      twitter: '#'
    }
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

    // Initialize current values - FIX: Access getter property, not method
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
   * Get translated text helper method
   * Uses the translate method from TranslateService
   * @param key - Translation key from JSON files (e.g., 'about.hero.badge')
   * @param lang - Optional language override
   * @returns Translated string
   */
  translate(key: string, lang?: 'ar' | 'en'): string {
    return this.translateService.translate(key, lang);
  }

  /**
   * Get nested translation value from object
   * Handles nested keys like 'about.hero.title.line1'
   * @param obj - Translation object
   * @param path - Dot notation path
   * @returns Translation value or key if not found
   */
  private getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  }

  /**
   * Get translated text for team member property
   * @param member - Team member object
   * @param property - Property key (name, role, bio)
   * @returns Translated string
   */
  getTeamMemberText(member: TeamMember, property: 'name' | 'role' | 'bio'): string {
    const keyMap = {
      name: member.nameKey,
      role: member.roleKey,
      bio: member.bioKey
    };
    return this.translate(keyMap[property]);
  }

  /**
   * Get translated text for company value property
   * @param value - Company value object
   * @param property - Property key (title, description)
   * @returns Translated string
   */
  getValueText(value: CompanyValue, property: 'title' | 'description'): string {
    const key = property === 'title' ? value.titleKey : value.descriptionKey;
    return this.translate(key);
  }

  /**
   * Get translated label for company stat
   * @param stat - Company stat object
   * @returns Translated label string
   */
  getStatLabel(stat: CompanyStat): string {
    return this.translate(stat.labelKey);
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
   * Track team member by ID
   * @param index - Array index
   * @param member - Team member object
   * @returns Unique identifier
   */
  trackByTeamMember(index: number, member: TeamMember): string {
    return member.id;
  }

  /**
   * Track value by ID
   * @param index - Array index
   * @param value - Company value object
   * @returns Unique identifier
   */
  trackByValue(index: number, value: CompanyValue): string {
    return value.id;
  }

  /**
   * Track stat by ID
   * @param index - Array index
   * @param stat - Company stat object
   * @returns Unique identifier
   */
  trackByStat(index: number, stat: CompanyStat): string {
    return stat.id;
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