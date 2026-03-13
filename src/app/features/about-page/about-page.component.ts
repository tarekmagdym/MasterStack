import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subject, takeUntil } from 'rxjs';

declare const AOS: any;

interface TeamMember {
  id: string;
  nameKey: string;
  roleKey: string;
  bioKey: string;
  linkedin?: string;
  twitter?: string;
  image?: string;
}

interface CompanyValue {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: 'clock' | 'shield' | 'sparkles' | 'users' | 'user' | 'activity';
}

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
  private translateService = inject(TranslateService);
  private themeService = inject(ThemeService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  currentLang: 'ar' | 'en' = 'en';
  isDarkMode: boolean = false;
  private destroy$ = new Subject<void>();

  companyStats: CompanyStat[] = [
    { id: 'experience', number: '5+',  labelKey: 'about.hero.stats.experience.label' },
    { id: 'projects',   number: '50+', labelKey: 'about.hero.stats.projects.label' },
    { id: 'clients',    number: '30+', labelKey: 'about.hero.stats.clients.label' },
    { id: 'team',       number: '15+', labelKey: 'about.hero.stats.team.label' }
  ];

  companyValues: CompanyValue[] = [
    { id: 'quality',       titleKey: 'about.values.list.quality.title',       descriptionKey: 'about.values.list.quality.description',       icon: 'clock' },
    { id: 'integrity',     titleKey: 'about.values.list.integrity.title',     descriptionKey: 'about.values.list.integrity.description',     icon: 'shield' },
    { id: 'innovation',    titleKey: 'about.values.list.innovation.title',    descriptionKey: 'about.values.list.innovation.description',    icon: 'sparkles' },
    { id: 'collaboration', titleKey: 'about.values.list.collaboration.title', descriptionKey: 'about.values.list.collaboration.description', icon: 'users' },
    { id: 'customer',      titleKey: 'about.values.list.customer.title',      descriptionKey: 'about.values.list.customer.description',      icon: 'user' },
    { id: 'learning',      titleKey: 'about.values.list.learning.title',      descriptionKey: 'about.values.list.learning.description',      icon: 'activity' }
  ];

  teamMembers: TeamMember[] = [
    { id: 'ceo',         nameKey: 'about.team.members.ceo.name',         roleKey: 'about.team.members.ceo.role',         bioKey: 'about.team.members.ceo.bio',         linkedin: '#', twitter: '#' },
    { id: 'dev_lead',    nameKey: 'about.team.members.dev_lead.name',    roleKey: 'about.team.members.dev_lead.role',    bioKey: 'about.team.members.dev_lead.bio',    linkedin: '#', twitter: '#' },
    { id: 'design_lead', nameKey: 'about.team.members.design_lead.name', roleKey: 'about.team.members.design_lead.role', bioKey: 'about.team.members.design_lead.bio', linkedin: '#', twitter: '#' },
    { id: 'pm',          nameKey: 'about.team.members.pm.name',          roleKey: 'about.team.members.pm.role',          bioKey: 'about.team.members.pm.bio',          linkedin: '#', twitter: '#' }
  ];

  constructor() {}

  ngOnInit(): void {
    this.translateService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLang = lang as 'ar' | 'en';
        this.updateSeoTags();
        this.setDirection();
        this.refreshAOS();
      });

    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => { this.isDarkMode = isDark; });

    this.currentLang = this.translateService.currentLang;
    this.isDarkMode = this.themeService.isDarkMode;
    this.updateSeoTags();
    this.setDirection();
    this.initializeAOS();
    this.scrollToTop();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateSeoTags(): void {
    if (this.currentLang === 'ar') {
      this.titleService.setTitle('من نحن | ماستر ستاك - فريق تطوير البرمجيات');
      this.metaService.updateTag({ name: 'description', content: 'تعرف على فريق ماستر ستاك، رحلتنا، رؤيتنا، ومهمتنا في تقديم حلول برمجية مبتكرة تساعد الشركات على النمو في العالم الرقمي.' });
      this.metaService.updateTag({ property: 'og:title', content: 'من نحن | ماستر ستاك' });
      this.metaService.updateTag({ property: 'og:description', content: 'تعرف على فريق ماستر ستاك ورحلتنا في تقديم حلول برمجية مبتكرة.' });
    } else {
      this.titleService.setTitle('About Us | MasterStack - Software Development Team');
      this.metaService.updateTag({ name: 'description', content: 'Learn about the MasterStack team, our story, vision, and mission in delivering innovative software solutions that help businesses grow in the digital world.' });
      this.metaService.updateTag({ property: 'og:title', content: 'About Us | MasterStack' });
      this.metaService.updateTag({ property: 'og:description', content: 'Learn about the MasterStack team and our journey in delivering innovative software solutions.' });
    }
  }

  private initializeAOS(): void {
    try {
      if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 100, delay: 0, anchorPlacement: 'top-bottom', disable: false });
      }
    } catch (error) {
      console.warn('AOS animation library not available:', error);
    }
  }

  private refreshAOS(): void {
    setTimeout(() => {
      try { if (typeof AOS !== 'undefined') { AOS.refresh(); } }
      catch (error) { console.warn('Error refreshing AOS:', error); }
    }, 150);
  }

  private setDirection(): void {
    const dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', this.currentLang);
  }

  private scrollToTop(): void {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (error) { window.scrollTo(0, 0); }
  }

  translate(key: string, lang?: 'ar' | 'en'): string { return this.translateService.translate(key, lang); }
  private getNestedValue(obj: any, path: string): string { return path.split('.').reduce((current, key) => current?.[key], obj) || path; }
  getTeamMemberText(member: TeamMember, property: 'name' | 'role' | 'bio'): string { return this.translate({ name: member.nameKey, role: member.roleKey, bio: member.bioKey }[property]); }
  getValueText(value: CompanyValue, property: 'title' | 'description'): string { return this.translate(property === 'title' ? value.titleKey : value.descriptionKey); }
  getStatLabel(stat: CompanyStat): string { return this.translate(stat.labelKey); }
  trackByIndex(index: number): number { return index; }
  trackByTeamMember(index: number, member: TeamMember): string { return member.id; }
  trackByValue(index: number, value: CompanyValue): string { return value.id; }
  trackByStat(index: number, stat: CompanyStat): string { return stat.id; }
  isRTL(): boolean { return this.currentLang === 'ar'; }
  toggleLanguage(): void { this.translateService.setLanguage(this.currentLang === 'en' ? 'ar' : 'en'); }
  toggleTheme(): void { this.themeService.toggleTheme(); }
}