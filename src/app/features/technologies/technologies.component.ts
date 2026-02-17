import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateService } from '../../core/services/translate.service';
import { ThemeService } from '../../core/services/theme.service';
import { Subscription } from 'rxjs';

interface Technology {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  color: string;
  badges?: string[];
}

interface TechCategory {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  description: string;
  descriptionAr: string;
  technologies: Technology[];
}

@Component({
  selector: 'app-technologies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './technologies.component.html',
  styleUrls: ['./technologies.component.scss']
})
export class TechnologiesComponent implements OnInit, OnDestroy {
  currentLang: 'ar' | 'en' = 'ar';
  isDarkMode: boolean = false;
  
  private langSubscription?: Subscription;
  private themeSubscription?: Subscription;

  // Optimized: Only 36 Most Essential Technologies (reduced from 112)
  techCategories: TechCategory[] = [
    {
      id: 'frontend',
      title: 'Frontend Technologies',
      titleAr: 'تقنيات الواجهات الأمامية',
      subtitle: 'Frontend',
      subtitleAr: 'الواجهات الأمامية',
      description: 'Building modern and interactive user interfaces using the latest frameworks and libraries',
      descriptionAr: 'نبني واجهات مستخدم حديثة وتفاعلية باستخدام أحدث أطر العمل والمكتبات',
      technologies: [
        {
          name: 'Angular',
          nameAr: 'أنجولار',
          description: 'Comprehensive framework for building complex and scalable web applications',
          descriptionAr: 'إطار عمل شامل لبناء تطبيقات ويب معقدة وقابلة للتطوير',
          icon: 'angular',
          color: '#dd0031'
        },
        {
          name: 'React',
          nameAr: 'رياكت',
          description: 'JavaScript library for building dynamic and fast user interfaces',
          descriptionAr: 'مكتبة جافاسكريبت لبناء واجهات مستخدم ديناميكية وسريعة',
          icon: 'react',
          color: '#61dafb'
        },
        {
          name: 'Vue.js',
          nameAr: 'فيو',
          description: 'Progressive framework for building simple and effective user interfaces',
          descriptionAr: 'إطار عمل تقدمي لبناء واجهات مستخدم بسيطة وفعالة',
          icon: 'vue',
          color: '#41b883'
        },
        {
          name: 'Next.js',
          nameAr: 'نكست',
          description: 'React framework for production with SEO optimization and high performance',
          descriptionAr: 'إطار React للإنتاج مع تحسين SEO وأداء عالي',
          icon: 'nextjs',
          color: '#000000'
        },
        {
          name: 'TypeScript',
          nameAr: 'تايب سكريبت',
          description: 'JavaScript with static types for safer and more maintainable code',
          descriptionAr: 'جافاسكريبت مع أنواع ثابتة لكود أكثر أماناً وقابلية للصيانة',
          icon: 'typescript',
          color: '#3178c6'
        },
        {
          name: 'Tailwind CSS',
          nameAr: 'تيل ويند',
          description: 'Utility-first CSS framework for rapid UI development',
          descriptionAr: 'إطار CSS متقدم لتطوير واجهات سريع ومرن',
          icon: 'tailwind',
          color: '#06b6d4'
        },
        {
          name: 'Bootstrap',
          nameAr: 'بوتستراب',
          description: 'Popular CSS framework for responsive web design',
          descriptionAr: 'إطار CSS الشهير للتصميم المتجاوب',
          icon: 'bootstrap',
          color: '#7952b3'
        },
        {
          name: 'SASS',
          nameAr: 'ساس',
          description: 'CSS preprocessor for more powerful stylesheets',
          descriptionAr: 'معالج CSS مسبق لأنماط أكثر قوة',
          icon: 'sass',
          color: '#cc6699'
        }
      ]
    },
    {
      id: 'backend',
      title: 'Backend Technologies',
      titleAr: 'تقنيات الخلفية',
      subtitle: 'Backend',
      subtitleAr: 'الخلفية',
      description: 'Developing powerful and scalable servers using the latest backend technologies',
      descriptionAr: 'نطور خوادم قوية وقابلة للتطوير باستخدام أحدث تقنيات الخلفية',
      technologies: [
        {
          name: 'Node.js',
          nameAr: 'نود',
          description: 'JavaScript runtime for building fast and scalable backend applications',
          descriptionAr: 'بيئة تشغيل جافاسكريبت لبناء تطبيقات خلفية سريعة وقابلة للتطوير',
          icon: 'nodejs',
          color: '#68a063'
        },
        {
          name: 'Python',
          nameAr: 'بايثون',
          description: 'Powerful programming language for AI and web applications',
          descriptionAr: 'لغة برمجة قوية للذكاء الاصطناعي وتطبيقات الويب',
          icon: 'python',
          color: '#3776ab'
        },
        {
          name: 'PHP',
          nameAr: 'بي إتش بي',
          description: 'Server-side scripting language for web development',
          descriptionAr: 'لغة برمجة نصية من جانب الخادم لتطوير الويب',
          icon: 'php',
          color: '#777bb4'
        },
        {
          name: 'Laravel',
          nameAr: 'لارافيل',
          description: 'Most popular PHP framework for secure web applications',
          descriptionAr: 'إطار عمل PHP الأكثر شعبية لتطوير تطبيقات ويب آمنة',
          icon: 'laravel',
          color: '#ff2d20'
        },
        {
          name: '.NET Core',
          nameAr: 'دوت نت',
          description: 'Microsoft development platform for high-performance applications',
          descriptionAr: 'منصة تطوير من مايكروسوفت لبناء تطبيقات عالية الأداء',
          icon: 'dotnet',
          color: '#512bd4'
        },
        {
          name: 'Express.js',
          nameAr: 'إكسبريس',
          description: 'Fast and flexible Node.js framework for building APIs',
          descriptionAr: 'إطار عمل Node.js سريع ومرن لبناء APIs قوية',
          icon: 'express',
          color: '#000000'
        },
        {
          name: 'NestJS',
          nameAr: 'نيست',
          description: 'Progressive Node.js framework for efficient backend applications',
          descriptionAr: 'إطار عمل Node.js تقدمي لبناء تطبيقات خلفية فعالة',
          icon: 'nestjs',
          color: '#e0234e'
        },
        {
          name: 'Django',
          nameAr: 'دجانجو',
          description: 'High-level Python web framework for rapid development',
          descriptionAr: 'إطار عمل Python عالي المستوى للتطوير السريع',
          icon: 'django',
          color: '#092e20'
        }
      ]
    },
    {
      id: 'mobile',
      title: 'Mobile Development',
      titleAr: 'تطوير تطبيقات الموبايل',
      subtitle: 'Mobile',
      subtitleAr: 'تطبيقات الموبايل',
      description: 'Building native and cross-platform mobile apps with highest quality',
      descriptionAr: 'نبني تطبيقات موبايل أصلية ومتعددة المنصات بأعلى جودة',
      technologies: [
        {
          name: 'React Native',
          nameAr: 'رياكت نيتيف',
          description: 'Develop iOS and Android apps with single codebase using React',
          descriptionAr: 'تطوير تطبيقات iOS و Android بكود واحد باستخدام React',
          icon: 'react-native',
          color: '#61dafb',
          badges: ['iOS', 'Android', 'Cross-Platform']
        },
        {
          name: 'Flutter',
          nameAr: 'فلاتر',
          description: 'Google framework for beautiful cross-platform apps',
          descriptionAr: 'إطار عمل Google لبناء تطبيقات جميلة ومتعددة المنصات',
          icon: 'flutter',
          color: '#02569b',
          badges: ['iOS', 'Android', 'Web']
        },
        {
          name: 'Swift',
          nameAr: 'سويفت',
          description: 'Apple programming language for native iOS development',
          descriptionAr: 'لغة برمجة Apple لتطوير تطبيقات iOS أصلية',
          icon: 'swift',
          color: '#f05138',
          badges: ['iOS', 'Native']
        },
        {
          name: 'Kotlin',
          nameAr: 'كوتلن',
          description: 'Official language for modern Android app development',
          descriptionAr: 'اللغة الرسمية لتطوير تطبيقات Android الحديثة',
          icon: 'kotlin',
          color: '#7f52fb',
          badges: ['Android', 'Native']
        }
      ]
    },
    {
      id: 'database',
      title: 'Database & Cloud',
      titleAr: 'قواعد البيانات والسحابة',
      subtitle: 'Database & Cloud',
      subtitleAr: 'قواعد البيانات والسحابة',
      description: 'Using the best databases and cloud services for performance and reliability',
      descriptionAr: 'نستخدم أفضل قواعد البيانات والخدمات السحابية لضمان الأداء والموثوقية',
      technologies: [
        {
          name: 'MongoDB',
          nameAr: 'مونجو',
          description: 'Flexible and scalable NoSQL database',
          descriptionAr: 'قاعدة بيانات NoSQL مرنة وقابلة للتطوير',
          icon: 'mongodb',
          color: '#47a248'
        },
        {
          name: 'PostgreSQL',
          nameAr: 'بوستجر',
          description: 'Advanced open-source relational database',
          descriptionAr: 'قاعدة بيانات علائقية متقدمة ومفتوحة المصدر',
          icon: 'postgresql',
          color: '#336791'
        },
        {
          name: 'MySQL',
          nameAr: 'ماي إس كيو إل',
          description: 'Reliable and popular database management system',
          descriptionAr: 'نظام إدارة قواعد بيانات موثوق وشائع',
          icon: 'mysql',
          color: '#4479a1'
        },
        {
          name: 'Firebase',
          nameAr: 'فاير بيس',
          description: 'Google platform for rapid development and infrastructure',
          descriptionAr: 'منصة Google للتطوير السريع والبنية التحتية',
          icon: 'firebase',
          color: '#ffca28'
        },
        {
          name: 'AWS',
          nameAr: 'أمازون ويب سيرفيس',
          description: 'Amazon world-leading cloud services',
          descriptionAr: 'خدمات Amazon السحابية الرائدة عالمياً',
          icon: 'aws',
          color: '#ff9900'
        },
        {
          name: 'Microsoft Azure',
          nameAr: 'مايكروسوفت أزور',
          description: 'Microsoft cloud platform for enterprise solutions',
          descriptionAr: 'منصة Microsoft السحابية للحلول المؤسسية',
          icon: 'azure',
          color: '#0078d4'
        }
      ]
    },
    {
      id: 'devops',
      title: 'DevOps & Tools',
      titleAr: 'DevOps والأدوات',
      subtitle: 'DevOps & Tools',
      subtitleAr: 'DevOps والأدوات',
      description: 'Using latest DevOps tools for rapid development and secure deployment',
      descriptionAr: 'نستخدم أحدث أدوات DevOps لضمان التطوير السريع والنشر الآمن',
      technologies: [
        {
          name: 'Git',
          nameAr: 'جيت',
          description: 'Distributed version control system',
          descriptionAr: 'نظام التحكم في الإصدارات الموزع',
          icon: 'git',
          color: '#f05032'
        },
        {
          name: 'Docker',
          nameAr: 'دوكر',
          description: 'Platform for containerizing applications',
          descriptionAr: 'منصة لتغليف التطبيقات في حاويات',
          icon: 'docker',
          color: '#2496ed'
        },
        {
          name: 'Kubernetes',
          nameAr: 'كوبرنيتيس',
          description: 'Container orchestration platform',
          descriptionAr: 'منصة لتنسيق الحاويات',
          icon: 'kubernetes',
          color: '#326ce5'
        },
        {
          name: 'GitHub Actions',
          nameAr: 'جيت هاب أكشنز',
          description: 'CI/CD automation in GitHub',
          descriptionAr: 'أتمتة CI/CD في GitHub',
          icon: 'github',
          color: '#2088ff'
        },
        {
          name: 'Jenkins',
          nameAr: 'جينكينز',
          description: 'Automation server for CI/CD',
          descriptionAr: 'خادم أتمتة لـ CI/CD',
          icon: 'jenkins',
          color: '#d24939'
        },
        {
          name: 'Nginx',
          nameAr: 'إن جينكس',
          description: 'High-performance web server',
          descriptionAr: 'خادم ويب عالي الأداء',
          icon: 'nginx',
          color: '#009639'
        }
      ]
    },
    {
      id: 'design',
      title: 'UI/UX Design',
      titleAr: 'تصميم واجهات المستخدم',
      subtitle: 'UI/UX Design',
      subtitleAr: 'تصميم UI/UX',
      description: 'Creating beautiful and user-friendly interfaces with professional design tools',
      descriptionAr: 'نصمم واجهات جميلة وسهلة الاستخدام باستخدام أدوات تصميم احترافية',
      technologies: [
        {
          name: 'Figma',
          nameAr: 'فيجما',
          description: 'Collaborative design platform for modern UI/UX',
          descriptionAr: 'منصة تصميم تعاونية لواجهات المستخدم الحديثة',
          icon: 'figma',
          color: '#f24e1e'
        },
        {
          name: 'Adobe XD',
          nameAr: 'أدوبي إكس دي',
          description: 'Professional UI/UX design and prototyping tool',
          descriptionAr: 'أداة احترافية لتصميم واجهات المستخدم والنماذج الأولية',
          icon: 'xd',
          color: '#ff61f6'
        },
        {
          name: 'Sketch',
          nameAr: 'سكيتش',
          description: 'Digital design toolkit for creating interfaces',
          descriptionAr: 'مجموعة أدوات التصميم الرقمي لإنشاء الواجهات',
          icon: 'sketch',
          color: '#f7b500'
        },
        {
          name: 'Adobe Photoshop',
          nameAr: 'فوتوشوب',
          description: 'Professional image editing and design software',
          descriptionAr: 'برنامج احترافي لتحرير الصور والتصميم',
          icon: 'photoshop',
          color: '#31a8ff'
        },
        {
          name: 'Adobe Illustrator',
          nameAr: 'إليستريتر',
          description: 'Vector graphics editor for logos and illustrations',
          descriptionAr: 'محرر الرسومات المتجهة للشعارات والرسوم التوضيحية',
          icon: 'illustrator',
          color: '#ff9a00'
        },
        {
          name: 'Framer',
          nameAr: 'فريمر',
          description: 'Interactive design and prototyping platform',
          descriptionAr: 'منصة التصميم التفاعلي والنماذج الأولية',
          icon: 'framer',
          color: '#0055ff'
        }
      ]
    }
  ];

  constructor(
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

    // Initialize AOS (Animate On Scroll) if available
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
    // Unsubscribe to prevent memory leaks
    this.langSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
  }



  // Helper method to get localized text
  getText(enText: string, arText: string): string {
    return this.currentLang === 'ar' ? arText : enText;
  }
}