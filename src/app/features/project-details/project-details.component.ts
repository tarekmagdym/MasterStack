import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';

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
  gallery?: string[];
  challenge?: string;
  challengeAr?: string;
  solution?: string;
  solutionAr?: string;
  results?: string[];
  resultsAr?: string[];
}

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode: boolean = false;
  project: Project | null = null;
  relatedProjects: Project[] = [];
  selectedGalleryImage: string = '';
  currentSlideIndex: number = 0;
  
  private langSubscription?: Subscription;
  private themeSubscription?: Subscription;
  private routeSubscription?: Subscription;

  // All projects data (same as projects page)
  allProjects: Project[] = [
    {
      id: 1,
      title: 'E-Learning Platform',
      titleAr: 'منصة التعليم الإلكتروني',
      description: 'Comprehensive online learning platform with video courses, quizzes, and certification',
      descriptionAr: 'منصة تعليم إلكتروني شاملة مع دورات فيديو واختبارات وشهادات',
      fullDescription: 'A complete e-learning solution featuring live classes, recorded courses, interactive quizzes, student progress tracking, and automated certification. Built with scalability in mind to handle thousands of concurrent users. The platform integrates seamlessly with payment gateways and provides comprehensive analytics for educators.',
      fullDescriptionAr: 'حل تعليمي إلكتروني كامل يتضمن فصولاً مباشرة ودورات مسجلة واختبارات تفاعلية وتتبع تقدم الطلاب وشهادات آلية. مبني مع مراعاة قابلية التوسع للتعامل مع آلاف المستخدمين المتزامنين. تتكامل المنصة بسلاسة مع بوابات الدفع وتوفر تحليلات شاملة للمعلمين.',
      image: '/assets/images/projects/elearning.jpg',
      category: 'web',
      tags: [
        { en: 'Web App', ar: 'تطبيق ويب' },
        { en: 'Education', ar: 'تعليم' }
      ],
      technologies: ['Angular', 'Node.js', 'MongoDB', 'AWS', 'Socket.io', 'WebRTC'],
      client: 'EduTech Solutions',
      year: '2024',
      duration: '6 months',
      liveUrl: 'https://example.com',
      features: [
        'Live video streaming classes with up to 100 participants',
        'Interactive quizzes and assessments with instant feedback',
        'Progress tracking dashboard for students and instructors',
        'Automated certificate generation with custom branding',
        'Multi-language support (English, Arabic, French)',
        'Mobile-responsive design for learning on-the-go',
        'Integration with popular payment gateways',
        'Advanced analytics and reporting'
      ],
      featuresAr: [
        'فصول البث المباشر بالفيديو مع ما يصل إلى 100 مشارك',
        'اختبارات وتقييمات تفاعلية مع تعليقات فورية',
        'لوحة تتبع التقدم للطلاب والمدرسين',
        'توليد الشهادات الآلي مع العلامة التجارية المخصصة',
        'دعم متعدد اللغات (الإنجليزية والعربية والفرنسية)',
        'تصميم متجاوب للموبايل للتعلم أثناء التنقل',
        'التكامل مع بوابات الدفع الشهيرة',
        'تحليلات وتقارير متقدمة'
      ],
      challenge: 'The client needed a platform that could handle thousands of concurrent users while maintaining high-quality video streaming and real-time interactions. The system also needed to support multiple languages and integrate with various third-party services.',
      challengeAr: 'احتاج العميل إلى منصة يمكنها التعامل مع آلاف المستخدمين المتزامنين مع الحفاظ على بث فيديو عالي الجودة وتفاعلات في الوقت الفعلي. كما احتاج النظام إلى دعم لغات متعددة والتكامل مع خدمات طرف ثالث متنوعة.',
      solution: 'We built a scalable cloud-based solution using microservices architecture. For video streaming, we implemented WebRTC with fallback options. The platform uses Redis for caching and MongoDB for flexible data storage. We also implemented a comprehensive CDN strategy for global content delivery.',
      solutionAr: 'قمنا ببناء حل سحابي قابل للتطوير باستخدام بنية الخدمات الصغيرة. لبث الفيديو، قمنا بتنفيذ WebRTC مع خيارات احتياطية. تستخدم المنصة Redis للتخزين المؤقت وMongoDB لتخزين البيانات المرن. كما قمنا بتنفيذ استراتيجية CDN شاملة لتوصيل المحتوى عالميًا.',
      results: [
        'Successfully handles 5,000+ concurrent users',
        '99.9% uptime achieved',
        '40% increase in student engagement',
        '25,000+ courses completed in the first 6 months',
        'Average video quality of 1080p maintained'
      ],
      resultsAr: [
        'يتعامل بنجاح مع أكثر من 5000 مستخدم متزامن',
        'تحقيق وقت تشغيل 99.9٪',
        'زيادة 40٪ في تفاعل الطلاب',
        'أكثر من 25000 دورة مكتملة في أول 6 أشهر',
        'الحفاظ على متوسط جودة فيديو 1080p'
      ],
      gallery: [
        '/assets/images/projects/elearning.jpg',
        '/assets/images/projects/elearning-2.jpg',
        '/assets/images/projects/elearning-3.jpg'
      ]
    },
    {
      id: 2,
      title: 'Multi-Vendor E-Commerce',
      titleAr: 'متجر إلكتروني متعدد البائعين',
      description: 'Advanced marketplace platform connecting sellers and buyers with secure payments',
      descriptionAr: 'منصة سوق متقدمة تربط البائعين والمشترين بمدفوعات آمنة',
      fullDescription: 'A robust multi-vendor marketplace with vendor dashboard, inventory management, order tracking, payment gateway integration, and comprehensive analytics. Features include product reviews, wishlists, and promotional campaigns. The platform supports multiple currencies and languages.',
      fullDescriptionAr: 'سوق قوي متعدد البائعين مع لوحة تحكم البائع وإدارة المخزون وتتبع الطلبات وتكامل بوابة الدفع والتحليلات الشاملة. تشمل الميزات مراجعات المنتجات وقوائم الرغبات والحملات الترويجية. تدعم المنصة عملات ولغات متعددة.',
      image: '/assets/images/projects/ecommerce.jpg',
      category: 'ecommerce',
      tags: [
        { en: 'E-Commerce', ar: 'تجارة إلكترونية' },
        { en: 'Marketplace', ar: 'سوق' }
      ],
      technologies: ['React', 'Next.js', 'PostgreSQL', 'Stripe', 'Redis', 'Docker'],
      client: 'ShopHub Inc',
      year: '2024',
      duration: '8 months',
      liveUrl: 'https://example.com',
      features: [
        'Vendor management system with comprehensive dashboard',
        'Real-time inventory tracking across multiple warehouses',
        'Secure payment processing with Stripe integration',
        'Customer review and rating system',
        'Advanced search and filtering with AI recommendations',
        'Multi-currency and multi-language support',
        'Automated email notifications and marketing campaigns',
        'Mobile apps for vendors and customers'
      ],
      featuresAr: [
        'نظام إدارة البائعين مع لوحة تحكم شاملة',
        'تتبع المخزون في الوقت الفعلي عبر مستودعات متعددة',
        'معالجة الدفع الآمنة مع تكامل Stripe',
        'نظام مراجعات وتقييمات العملاء',
        'البحث والتصفية المتقدمة مع توصيات الذكاء الاصطناعي',
        'دعم العملات واللغات المتعددة',
        'إشعارات البريد الإلكتروني الآلية والحملات التسويقية',
        'تطبيقات الموبايل للبائعين والعملاء'
      ],
      challenge: 'Creating a platform that balances the needs of multiple vendors while providing a seamless experience for customers. The system needed to handle complex inventory management, multiple payment methods, and ensure data security.',
      challengeAr: 'إنشاء منصة توازن احتياجات البائعين المتعددين مع توفير تجربة سلسة للعملاء. احتاج النظام إلى التعامل مع إدارة المخزون المعقدة وطرق الدفع المتعددة وضمان أمن البيانات.',
      solution: 'We implemented a microservices architecture with separate services for vendors, customers, payments, and inventory. Used PostgreSQL for transactional data and Redis for caching. Implemented event-driven architecture for real-time updates.',
      solutionAr: 'قمنا بتنفيذ بنية الخدمات الصغيرة مع خدمات منفصلة للبائعين والعملاء والمدفوعات والمخزون. استخدمنا PostgreSQL لبيانات المعاملات وRedis للتخزين المؤقت. قمنا بتنفيذ بنية مدفوعة بالأحداث للتحديثات في الوقت الفعلي.',
      results: [
        '200+ active vendors on the platform',
        '$2M+ in monthly transactions',
        '50,000+ products listed',
        '95% customer satisfaction rate',
        '30% reduction in order processing time'
      ],
      resultsAr: [
        'أكثر من 200 بائع نشط على المنصة',
        'أكثر من 2 مليون دولار في المعاملات الشهرية',
        'أكثر من 50,000 منتج مدرج',
        'معدل رضا العملاء 95٪',
        'تقليل وقت معالجة الطلبات بنسبة 30٪'
      ],
      gallery: [
        '/assets/images/projects/ecommerce.jpg',
        '/assets/images/projects/ecommerce-2.jpg',
        '/assets/images/projects/ecommerce-3.jpg'
      ]
    },
    {
      id: 3,
      title: 'Healthcare Management System',
      titleAr: 'نظام إدارة الرعاية الصحية',
      description: 'Complete hospital management system with patient records and appointments',
      descriptionAr: 'نظام إدارة مستشفى متكامل مع سجلات المرضى والمواعيد',
      fullDescription: 'Comprehensive healthcare solution including patient management, appointment scheduling, electronic health records (EHR), billing, pharmacy management, and doctor-patient communication portal. HIPAA compliant with end-to-end encryption.',
      fullDescriptionAr: 'حل رعاية صحية شامل يتضمن إدارة المرضى وجدولة المواعيد والسجلات الصحية الإلكترونية والفواتير وإدارة الصيدلية وبوابة التواصل بين الطبيب والمريض. متوافق مع HIPAA مع تشفير شامل.',
      image: '/assets/images/projects/healthcare.jpg',
      category: 'web',
      tags: [
        { en: 'Healthcare', ar: 'رعاية صحية' },
        { en: 'SaaS', ar: 'SaaS' }
      ],
      technologies: ['Vue.js', 'Laravel', 'MySQL', 'Azure', 'Docker', 'Redis'],
      client: 'MediCare Solutions',
      year: '2023',
      duration: '10 months',
      features: [
        'Electronic Health Records (EHR) system',
        'Appointment scheduling with automated reminders',
        'Prescription management and e-prescribing',
        'Billing and insurance claim processing',
        'Patient portal for medical records access',
        'Telemedicine video consultation',
        'Lab results integration',
        'HIPAA compliance and data encryption'
      ],
      featuresAr: [
        'نظام السجلات الصحية الإلكترونية',
        'جدولة المواعيد مع تذكيرات آلية',
        'إدارة الوصفات الطبية والوصف الإلكتروني',
        'الفواتير ومعالجة مطالبات التأمين',
        'بوابة المرضى للوصول إلى السجلات الطبية',
        'استشارة الفيديو الطبية عن بعد',
        'تكامل نتائج المختبر',
        'الامتثال لـ HIPAA وتشفير البيانات'
      ],
      challenge: 'Developing a HIPAA-compliant system that securely handles sensitive patient data while providing intuitive interfaces for medical staff with varying technical skills.',
      challengeAr: 'تطوير نظام متوافق مع HIPAA يتعامل بأمان مع بيانات المرضى الحساسة مع توفير واجهات بديهية للطاقم الطبي ذو المهارات التقنية المتفاوتة.',
      solution: 'Implemented role-based access control, end-to-end encryption, and comprehensive audit logging. Used Azure cloud services for scalability and compliance. Created intuitive workflows based on user research with medical professionals.',
      solutionAr: 'قمنا بتنفيذ التحكم في الوصول القائم على الأدوار والتشفير الشامل والتسجيل الشامل للمراجعة. استخدمنا خدمات Azure السحابية لقابلية التوسع والامتثال. أنشأنا سير عمل بديهي بناءً على بحث المستخدم مع المهنيين الطبيين.',
      results: [
        '15 hospitals using the system',
        '100,000+ patient records managed',
        '60% reduction in administrative time',
        'Zero security breaches since launch',
        '98% user satisfaction rate'
      ],
      resultsAr: [
        '15 مستشفى تستخدم النظام',
        'إدارة أكثر من 100,000 سجل مريض',
        'تقليل الوقت الإداري بنسبة 60٪',
        'عدم وجود انتهاكات أمنية منذ الإطلاق',
        'معدل رضا المستخدم 98٪'
      ],
      gallery: [
        '/assets/images/projects/healthcare.jpg',
        '/assets/images/projects/healthcare-2.jpg',
        '/assets/images/projects/healthcare-3.jpg'
      ]
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public translateService: TranslateService,
    public themeService: ThemeService
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

    // Subscribe to route params
    this.routeSubscription = this.route.params.subscribe(params => {
      const projectId = +params['id'];
      this.loadProject(projectId);
      this.scrollToTop();
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
    this.routeSubscription?.unsubscribe();
  }

  private loadProject(id: number): void {
    this.project = this.allProjects.find(p => p.id === id) || null;
    
    if (!this.project) {
      this.router.navigate(['/projects']);
      return;
    }

    // Reset slide index when loading new project
    this.currentSlideIndex = 0;

    // Load related projects (same category, different id)
    this.relatedProjects = this.allProjects
      .filter(p => p.category === this.project?.category && p.id !== id)
      .slice(0, 3);
  }


  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Gallery Slider Methods
  nextSlide(): void {
    if (this.project?.gallery) {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.project.gallery.length;
    }
  }

  prevSlide(): void {
    if (this.project?.gallery) {
      this.currentSlideIndex = this.currentSlideIndex === 0 
        ? this.project.gallery.length - 1 
        : this.currentSlideIndex - 1;
    }
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  openGalleryImage(image: string): void {
    this.selectedGalleryImage = image;
    document.body.style.overflow = 'hidden';
  }

  closeGalleryImage(): void {
    this.selectedGalleryImage = '';
    document.body.style.overflow = 'auto';
  }

  viewRelatedProject(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}