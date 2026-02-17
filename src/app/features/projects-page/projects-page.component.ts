import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';
import {ViewChild, ElementRef, AfterViewInit,HostListener} from '@angular/core';

interface ProjectTag {
  en: string;
  ar: string;
}

interface Project {
  id: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  fullDescription: string;
  fullDescriptionAr: string;
  image: string;
  category: string;
  tags: ProjectTag[];
  technologies: string[];
  client: string;
  year: string;
  duration: string;
  liveUrl?: string;
  features?: string[];
  featuresAr?: string[];
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
}

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './projects-page.component.html',
  styleUrls: ['./projects-page.component.scss']
})
export class ProjectsPageComponent implements OnInit, OnDestroy {
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode: boolean = false;
  selectedCategory: string = 'all';
  hasMoreProjects: boolean = false;


    // ── Public bindings (used in template) ──────
  currentSlide    = 0;
  totalSlides     = 5;
  sliderDots      = Array(5).fill(0);
  sliderOffset    = 0;
  isTransitioning = false;
  cardWidth       = 0;   // bound via [style.flex-basis.px]="cardWidth"
  sliderGap       = 24;  // bound via [style.gap.px]="sliderGap"

  // ── Private ──────────────────────────────────
  private _cardsVisible = 3;
  private _autoPlay: any;
  private _touchStartX  = 0;

  @ViewChild('sliderViewport') sliderViewport!: ElementRef<HTMLElement>;
  
  private langSubscription?: Subscription;
  private themeSubscription?: Subscription;

  // Categories for filtering
  categories: Category[] = [
    {
      id: 'all',
      name: 'All Projects',
      nameAr: 'جميع المشاريع',
      icon: 'M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM14 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 6v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6zM4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zM14 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z'
    },
    {
      id: 'web',
      name: 'Web Apps',
      nameAr: 'تطبيقات الويب',
      icon: 'M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9'
    },
    {
      id: 'mobile',
      name: 'Mobile Apps',
      nameAr: 'تطبيقات الموبايل',
      icon: 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z'
    },
    {
      id: 'ecommerce',
      name: 'E-Commerce',
      nameAr: 'التجارة الإلكترونية',
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'
    },
    {
      id: 'saas',
      name: 'SaaS',
      nameAr: 'SaaS',
      icon: 'M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0 0-10H7a5 5 0 1 1 0-10h9a4 4 0 0 0 4 4'
    }
  ];

  // All projects data
  allProjects: Project[] = [
    {
      id: 1,
      title: 'E-Learning Platform',
      titleAr: 'منصة التعليم الإلكتروني',
      description: 'Comprehensive online learning platform with video courses, quizzes, and certification',
      descriptionAr: 'منصة تعليم إلكتروني شاملة مع دورات فيديو واختبارات وشهادات',
      fullDescription: 'A complete e-learning solution featuring live classes, recorded courses, interactive quizzes, student progress tracking, and automated certification. Built with scalability in mind to handle thousands of concurrent users.',
      fullDescriptionAr: 'حل تعليمي إلكتروني كامل يتضمن فصولاً مباشرة ودورات مسجلة واختبارات تفاعلية وتتبع تقدم الطلاب وشهادات آلية. مبني مع مراعاة قابلية التوسع للتعامل مع آلاف المستخدمين المتزامنين.',
      image: '/assets/images/projects/elearning.jpg',
      category: 'web',
      tags: [
        { en: 'Web App', ar: 'تطبيق ويب' },
        { en: 'Education', ar: 'تعليم' }
      ],
      technologies: ['Angular', 'Node.js', 'MongoDB', 'AWS', 'Socket.io'],
      client: 'EduTech Solutions',
      year: '2024',
      duration: '6 months',
      liveUrl: 'https://example.com',
      features: [
        'Live video streaming classes',
        'Interactive quizzes and assessments',
        'Progress tracking dashboard',
        'Automated certificate generation',
        'Multi-language support'
      ],
      featuresAr: [
        'فصول البث المباشر بالفيديو',
        'اختبارات وتقييمات تفاعلية',
        'لوحة تتبع التقدم',
        'توليد الشهادات الآلي',
        'دعم متعدد اللغات'
      ]
    },
    {
      id: 2,
      title: 'Multi-Vendor E-Commerce',
      titleAr: 'متجر إلكتروني متعدد البائعين',
      description: 'Advanced marketplace platform connecting sellers and buyers with secure payments',
      descriptionAr: 'منصة سوق متقدمة تربط البائعين والمشترين بمدفوعات آمنة',
      fullDescription: 'A robust multi-vendor marketplace with vendor dashboard, inventory management, order tracking, payment gateway integration, and comprehensive analytics. Features include product reviews, wishlists, and promotional campaigns.',
      fullDescriptionAr: 'سوق قوي متعدد البائعين مع لوحة تحكم البائع وإدارة المخزون وتتبع الطلبات وتكامل بوابة الدفع والتحليلات الشاملة. تشمل الميزات مراجعات المنتجات وقوائم الرغبات والحملات الترويجية.',
      image: '/assets/images/projects/ecommerce.jpg',
      category: 'ecommerce',
      tags: [
        { en: 'E-Commerce', ar: 'تجارة إلكترونية' },
        { en: 'Marketplace', ar: 'سوق' }
      ],
      technologies: ['React', 'Next.js', 'PostgreSQL', 'Stripe', 'Redis'],
      client: 'ShopHub Inc',
      year: '2024',
      duration: '8 months',
      liveUrl: 'https://example.com',
      features: [
        'Vendor management system',
        'Real-time inventory tracking',
        'Secure payment processing',
        'Customer review system',
        'Advanced search and filtering'
      ],
      featuresAr: [
        'نظام إدارة البائعين',
        'تتبع المخزون في الوقت الفعلي',
        'معالجة الدفع الآمنة',
        'نظام مراجعات العملاء',
        'البحث والتصفية المتقدمة'
      ]
    },
    {
      id: 3,
      title: 'Healthcare Management System',
      titleAr: 'نظام إدارة الرعاية الصحية',
      description: 'Complete hospital management system with patient records and appointments',
      descriptionAr: 'نظام إدارة مستشفى متكامل مع سجلات المرضى والمواعيد',
      fullDescription: 'Comprehensive healthcare solution including patient management, appointment scheduling, electronic health records (EHR), billing, pharmacy management, and doctor-patient communication portal.',
      fullDescriptionAr: 'حل رعاية صحية شامل يتضمن إدارة المرضى وجدولة المواعيد والسجلات الصحية الإلكترونية والفواتير وإدارة الصيدلية وبوابة التواصل بين الطبيب والمريض.',
      image: '/assets/images/projects/healthcare.jpg',
      category: 'web',
      tags: [
        { en: 'Healthcare', ar: 'رعاية صحية' },
        { en: 'SaaS', ar: 'SaaS' }
      ],
      technologies: ['Vue.js', 'Laravel', 'MySQL', 'Azure', 'Docker'],
      client: 'MediCare Solutions',
      year: '2023',
      duration: '10 months',
      liveUrl: 'https://example.com',
      features: [
        'Electronic Health Records (EHR)',
        'Appointment scheduling',
        'Prescription management',
        'Billing and invoicing',
        'Patient portal'
      ],
      featuresAr: [
        'السجلات الصحية الإلكترونية',
        'جدولة المواعيد',
        'إدارة الوصفات الطبية',
        'الفواتير والفوترة',
        'بوابة المرضى'
      ]
    },
    {
      id: 4,
      title: 'Mobile Banking App',
      titleAr: 'تطبيق الخدمات المصرفية',
      description: 'Secure mobile banking application with biometric authentication',
      descriptionAr: 'تطبيق خدمات مصرفية آمن مع مصادقة بيومترية',
      fullDescription: 'Full-featured mobile banking app with account management, fund transfers, bill payments, investment tracking, and advanced security features including biometric authentication and fraud detection.',
      fullDescriptionAr: 'تطبيق خدمات مصرفية متكامل مع إدارة الحسابات وتحويل الأموال ودفع الفواتير وتتبع الاستثمارات وميزات أمان متقدمة تشمل المصادقة البيومترية وكشف الاحتيال.',
      image: '/assets/images/projects/banking.jpg',
      category: 'mobile',
      tags: [
        { en: 'Mobile', ar: 'موبايل' },
        { en: 'Finance', ar: 'مالية' }
      ],
      technologies: ['React Native', 'Node.js', 'PostgreSQL', 'AWS'],
      client: 'FinTech Bank',
      year: '2024',
      duration: '7 months',
      liveUrl: 'https://example.com',
      features: [
        'Biometric authentication',
        'Real-time transactions',
        'Bill payment system',
        'Investment portfolio tracking',
        'Fraud detection'
      ],
      featuresAr: [
        'المصادقة البيومترية',
        'المعاملات في الوقت الفعلي',
        'نظام دفع الفواتير',
        'تتبع محفظة الاستثمارات',
        'كشف الاحتيال'
      ]
    },
    {
      id: 5,
      title: 'Project Management SaaS',
      titleAr: 'منصة إدارة المشاريع',
      description: 'Cloud-based project management platform for teams and enterprises',
      descriptionAr: 'منصة إدارة مشاريع سحابية للفرق والمؤسسات',
      fullDescription: 'Enterprise-grade project management solution with task tracking, team collaboration, time tracking, resource allocation, reporting, and integrations with popular tools. Supports agile and waterfall methodologies.',
      fullDescriptionAr: 'حل إدارة مشاريع على مستوى المؤسسات مع تتبع المهام والتعاون الجماعي وتتبع الوقت وتخصيص الموارد والتقارير والتكامل مع الأدوات الشائعة. يدعم منهجيات أجايل والشلال.',
      image: '/assets/images/projects/project-mgmt.jpg',
      category: 'saas',
      tags: [
        { en: 'SaaS', ar: 'SaaS' },
        { en: 'Productivity', ar: 'إنتاجية' }
      ],
      technologies: ['Angular', 'NestJS', 'MongoDB', 'Redis', 'Kubernetes'],
      client: 'TaskFlow Pro',
      year: '2023',
      duration: '9 months',
      liveUrl: 'https://example.com',
      features: [
        'Kanban and Gantt charts',
        'Time tracking',
        'Resource management',
        'Team collaboration tools',
        'Custom reporting'
      ],
      featuresAr: [
        'مخططات كانبان وجانت',
        'تتبع الوقت',
        'إدارة الموارد',
        'أدوات التعاون الجماعي',
        'التقارير المخصصة'
      ]
    },
    {
      id: 6,
      title: 'Real Estate Platform',
      titleAr: 'منصة العقارات',
      description: 'Property listing and management platform with virtual tours',
      descriptionAr: 'منصة إدراج وإدارة العقارات مع جولات افتراضية',
      fullDescription: 'Advanced real estate platform featuring property listings, virtual 3D tours, mortgage calculator, agent profiles, property comparison tools, and AI-powered property recommendations.',
      fullDescriptionAr: 'منصة عقارية متقدمة تتضمن قوائم العقارات وجولات افتراضية ثلاثية الأبعاد وحاسبة الرهن العقاري وملفات الوكلاء وأدوات مقارنة العقارات وتوصيات العقارات المدعومة بالذكاء الاصطناعي.',
      image: '/assets/images/projects/realestate.jpg',
      category: 'web',
      tags: [
        { en: 'Real Estate', ar: 'عقارات' },
        { en: 'Web App', ar: 'تطبيق ويب' }
      ],
      technologies: ['React', 'Python', 'Django', 'PostgreSQL', 'AWS'],
      client: 'PropertyHub',
      year: '2024',
      duration: '5 months',
      liveUrl: 'https://example.com',
      features: [
        'Virtual 3D property tours',
        'Advanced search filters',
        'Mortgage calculator',
        'Agent directory',
        'Property comparison'
      ],
      featuresAr: [
        'جولات افتراضية ثلاثية الأبعاد',
        'مرشحات البحث المتقدمة',
        'حاسبة الرهن العقاري',
        'دليل الوكلاء',
        'مقارنة العقارات'
      ]
    },
    {
      id: 7,
      title: 'Food Delivery App',
      titleAr: 'تطبيق توصيل الطعام',
      description: 'Complete food delivery solution with real-time tracking',
      descriptionAr: 'حل توصيل طعام متكامل مع تتبع في الوقت الفعلي',
      fullDescription: 'End-to-end food delivery platform connecting restaurants, delivery drivers, and customers. Features include real-time order tracking, in-app payments, ratings and reviews, and loyalty programs.',
      fullDescriptionAr: 'منصة توصيل طعام شاملة تربط المطاعم وسائقي التوصيل والعملاء. تشمل الميزات تتبع الطلبات في الوقت الفعلي والمدفوعات داخل التطبيق والتقييمات والمراجعات وبرامج الولاء.',
      image: '/assets/images/projects/food-delivery.jpg',
      category: 'mobile',
      tags: [
        { en: 'Mobile', ar: 'موبايل' },
        { en: 'Delivery', ar: 'توصيل' }
      ],
      technologies: ['Flutter', 'Node.js', 'MongoDB', 'Firebase', 'Google Maps'],
      client: 'QuickEats',
      year: '2023',
      duration: '6 months',
      liveUrl: 'https://example.com',
      features: [
        'Real-time order tracking',
        'Multi-restaurant support',
        'In-app payments',
        'Rating and review system',
        'Loyalty rewards program'
      ],
      featuresAr: [
        'تتبع الطلبات في الوقت الفعلي',
        'دعم متعدد المطاعم',
        'المدفوعات داخل التطبيق',
        'نظام التقييم والمراجعة',
        'برنامج مكافآت الولاء'
      ]
    },
    {
      id: 8,
      title: 'Inventory Management System',
      titleAr: 'نظام إدارة المخزون',
      description: 'Smart inventory tracking and management for warehouses',
      descriptionAr: 'تتبع وإدارة ذكية للمخزون للمستودعات',
      fullDescription: 'Comprehensive warehouse management system with barcode scanning, stock alerts, supplier management, order fulfillment, and detailed inventory reports with predictive analytics.',
      fullDescriptionAr: 'نظام إدارة مستودعات شامل مع مسح الباركود وتنبيهات المخزون وإدارة الموردين وتنفيذ الطلبات وتقارير المخزون التفصيلية مع التحليلات التنبؤية.',
      image: '/assets/images/projects/inventory.jpg',
      category: 'saas',
      tags: [
        { en: 'SaaS', ar: 'SaaS' },
        { en: 'Logistics', ar: 'لوجستيات' }
      ],
      technologies: ['Vue.js', 'Laravel', 'PostgreSQL', 'Redis'],
      client: 'StockPro',
      year: '2024',
      duration: '4 months',
      liveUrl: 'https://example.com',
      features: [
        'Barcode scanning',
        'Real-time stock alerts',
        'Supplier management',
        'Order fulfillment tracking',
        'Predictive analytics'
      ],
      featuresAr: [
        'مسح الباركود',
        'تنبيهات المخزون في الوقت الفعلي',
        'إدارة الموردين',
        'تتبع تنفيذ الطلبات',
        'التحليلات التنبؤية'
      ]
    },
    {
      id: 9,
      title: 'Social Media Analytics',
      titleAr: 'تحليلات وسائل التواصل',
      description: 'Advanced analytics platform for social media performance',
      descriptionAr: 'منصة تحليلات متقدمة لأداء وسائل التواصل الاجتماعي',
      fullDescription: 'Powerful social media analytics tool that tracks engagement, follower growth, post performance, competitor analysis, and provides actionable insights with AI-powered recommendations.',
      fullDescriptionAr: 'أداة تحليلات وسائل التواصل الاجتماعي القوية التي تتبع التفاعل ونمو المتابعين وأداء المنشورات وتحليل المنافسين وتقدم رؤى قابلة للتنفيذ مع توصيات مدعومة بالذكاء الاصطناعي.',
      image: '/assets/images/projects/analytics.jpg',
      category: 'saas',
      tags: [
        { en: 'Analytics', ar: 'تحليلات' },
        { en: 'Marketing', ar: 'تسويق' }
      ],
      technologies: ['React', 'Python', 'TensorFlow', 'PostgreSQL', 'Redis'],
      client: 'SocialMetrics',
      year: '2023',
      duration: '8 months',
      liveUrl: 'https://example.com',
      features: [
        'Multi-platform analytics',
        'Competitor benchmarking',
        'AI-powered insights',
        'Custom reports',
        'Engagement tracking'
      ],
      featuresAr: [
        'تحليلات متعددة المنصات',
        'قياس المنافسين',
        'رؤى مدعومة بالذكاء الاصطناعي',
        'التقارير المخصصة',
        'تتبع التفاعل'
      ]
    }
  ];

  filteredProjects: Project[] = [];

  constructor(
    public translateService: TranslateService,
    public themeService: ThemeService,
    private router: Router
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

    // Initialize AOS
    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        offset: 50
      });
    }

    // Initialize filtered projects
    this.filteredProjects = this.allProjects;
    
  }
  // ── AfterViewInit ─────────────────────────────
ngAfterViewInit(): void {
  setTimeout(() => {
    this.measureSlider();
    this.startAutoPlay();
  }, 60);
}

// ── Resize ────────────────────────────────────
@HostListener('window:resize')
onWindowResize(): void {
  this.measureSlider();
  this.applyOffset(false);
}

// ── Measure viewport & calculate card size ───
private measureSlider(): void {
  if (!this.sliderViewport) return;
  const vpW = this.sliderViewport.nativeElement.offsetWidth;

  if (vpW < 640) {
    this._cardsVisible = 1;
    this.sliderGap     = 16;
  } else if (vpW < 1100) {
    this._cardsVisible = 2;
    this.sliderGap     = 20;
  } else {
    this._cardsVisible = 3;
    this.sliderGap     = 24;
  }

  // Card width = (viewport - total gaps between cards) / cards visible
  const totalGaps   = this.sliderGap * (this._cardsVisible - 1);
  this.cardWidth    = (vpW - totalGaps) / this._cardsVisible;

  this.applyOffset(false);
}

// ── Compute translateX offset ─────────────────
private applyOffset(animate = true): void {
  const max = Math.max(0, this.totalSlides - this._cardsVisible);

  if (this.currentSlide > max) this.currentSlide = max;
  if (this.currentSlide < 0)   this.currentSlide = 0;

  if (animate) {
    this.isTransitioning = true;
    setTimeout(() => this.isTransitioning = false, 520);
  }

  // Track has direction:ltr so negative translateX always moves left
  this.sliderOffset = -(this.currentSlide * (this.cardWidth + this.sliderGap));
}

// ── Navigation ────────────────────────────────
nextSlide(): void {
  const max = Math.max(0, this.totalSlides - this._cardsVisible);
  this.currentSlide = this.currentSlide >= max ? 0 : this.currentSlide + 1;
  this.applyOffset();
  this.resetAutoPlay();
}

prevSlide(): void {
  const max = Math.max(0, this.totalSlides - this._cardsVisible);
  this.currentSlide = this.currentSlide <= 0 ? max : this.currentSlide - 1;
  this.applyOffset();
  this.resetAutoPlay();
}

goToSlide(index: number): void {
  this.currentSlide = index;
  this.applyOffset();
  this.resetAutoPlay();
}

// ── Auto-play ────────────────────────────────
private startAutoPlay(): void {
  this._autoPlay = setInterval(() => this.nextSlide(), 4500);
}

private resetAutoPlay(): void {
  clearInterval(this._autoPlay);
  this.startAutoPlay();
}

// ── Touch / Swipe ────────────────────────────
onTouchStart(event: TouchEvent): void {
  this._touchStartX = event.touches[0].clientX;
}

onTouchEnd(event: TouchEvent): void {
  const delta = this._touchStartX - event.changedTouches[0].clientX;
  if (Math.abs(delta) < 45) return;

  const isRtl = document.documentElement.dir === 'rtl';
  if (isRtl) {
    delta > 0 ? this.prevSlide() : this.nextSlide();
  } else {
    delta > 0 ? this.nextSlide() : this.prevSlide();
  }
}

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
    clearInterval(this._autoPlay);
  }


  filterProjects(category: string): void {
    this.selectedCategory = category;
    
    if (category === 'all') {
      this.filteredProjects = this.allProjects;
    } else {
      this.filteredProjects = this.allProjects.filter(project => 
        project.category === category
      );
    }

    // Refresh AOS animations
    if (typeof (window as any).AOS !== 'undefined') {
      (window as any).AOS.refresh();
    }
  }

  getProjectCount(categoryId: string): number {
    if (categoryId === 'all') {
      return this.allProjects.length;
    }
    return this.allProjects.filter(project => project.category === categoryId).length;
  }

  viewProjectDetails(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }

  loadMoreProjects(): void {
    // Implement load more functionality if needed
    this.hasMoreProjects = false;
  }
}