import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

interface NavItem {
  label: {
    ar: string;
    en: string;
  };
  route: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isScrolled = false;
  showTopBar = true;
  lastScrollTop = 0;
  isMobileMenuOpen = false;
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode = false;
  
  navItems: NavItem[] = [
    { label: { ar: 'الرئيسية', en: 'Home' }, route: '/' },
    { label: { ar: 'من نحن', en: 'About Us' }, route: '/about' },
    { label: { ar: 'خدماتنا', en: 'Our Services' }, route: '/services' },
    { label: { ar: 'التقنيات', en: 'Technologies' }, route: '/technologies' },
    { label: { ar: 'منصات SaaS', en: 'SaaS Platforms' }, route: '/saas' },
    { label: { ar: 'أعمالنا', en: 'Our Work' }, route: '/projects' }
  ];

  constructor(
    private translateService: TranslateService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Subscribe to language changes
    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLang = lang as 'ar' | 'en';
      });
    
    // Subscribe to theme changes
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkMode = isDark;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add scrolled class after 30px
    this.isScrolled = scrollTop > 30;
    
    // Hide top bar when scrolling down past 80px, show when scrolling up
    if (scrollTop > this.lastScrollTop && scrollTop > 80) {
      this.showTopBar = false;
    } else if (scrollTop < this.lastScrollTop) {
      this.showTopBar = true;
    }
    
    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    // Prevent body scroll when mobile menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  switchLanguage(): void {
    const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
    this.translateService.setLanguage(newLang);
  }

  toggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  getNavLabel(item: NavItem): string {
    return item.label[this.currentLang];
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }
}