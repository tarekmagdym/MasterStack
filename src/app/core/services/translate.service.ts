import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private currentLangSubject = new BehaviorSubject<string>('ar');
  public currentLang$ = this.currentLangSubject.asObservable();

  private translations: { [key: string]: any } = {};

  constructor() {
    // Get saved language or default to Arabic
    const savedLang = (localStorage.getItem('preferredLang') as 'ar' | 'en') || 'ar';
    this.setLanguage(savedLang);
  }

  get currentLang(): 'ar' | 'en' {
    return this.currentLangSubject.value as 'ar' | 'en';
  }

  setLanguage(lang: 'ar' | 'en') {
    this.currentLangSubject.next(lang);
    localStorage.setItem('preferredLang', lang);
    
    // Update document direction and language
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }

  loadTranslations(lang: string, translations: any) {
    this.translations[lang] = translations;
  }

  translate(key: string, lang?: string): string {
    const currentLang = lang || this.currentLang;
    return this.translations[currentLang]?.[key] || key;
  }
}