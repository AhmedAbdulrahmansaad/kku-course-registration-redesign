import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Palette, 
  Layout, 
  Smartphone, 
  Moon, 
  Sun,
  Languages,
  Accessibility,
  Sparkles,
  Eye,
  Target,
  Users
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const designPrinciples = [
  {
    titleAr: 'تصميم متمحور حول المستخدم',
    titleEn: 'User-Centered Design',
    descriptionAr: 'التركيز على احتياجات المستخدمين وتجربتهم في كل مرحلة من مراحل التصميم',
    descriptionEn: 'Focusing on user needs and experience at every stage of design',
    icon: Users,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    titleAr: 'البساطة والوضوح',
    titleEn: 'Simplicity and Clarity',
    descriptionAr: 'واجهة نظيفة وبسيطة تسهل على المستخدمين إنجاز مهامهم بسرعة',
    descriptionEn: 'Clean and simple interface that helps users complete tasks quickly',
    icon: Eye,
    color: 'from-purple-500 to-pink-500'
  },
  {
    titleAr: 'الاتساق البصري',
    titleEn: 'Visual Consistency',
    descriptionAr: 'استخدام الألوان والخطوط والمكونات بشكل متسق في جميع الصفحات',
    descriptionEn: 'Consistent use of colors, fonts, and components across all pages',
    icon: Palette,
    color: 'from-orange-500 to-red-500'
  },
  {
    titleAr: 'سهولة الوصول',
    titleEn: 'Accessibility',
    descriptionAr: 'تصميم يراعي جميع المستخدمين بما في ذلك ذوي الاحتياجات الخاصة',
    descriptionEn: 'Design that accommodates all users including those with special needs',
    icon: Accessibility,
    color: 'from-green-500 to-emerald-500'
  },
  {
    titleAr: 'الاستجابة والتفاعل',
    titleEn: 'Responsiveness',
    descriptionAr: 'تصميم متجاوب يعمل بسلاسة على جميع الأجهزة والشاشات',
    descriptionEn: 'Responsive design that works smoothly on all devices and screens',
    icon: Smartphone,
    color: 'from-yellow-500 to-amber-500'
  },
  {
    titleAr: 'الهوية البصرية',
    titleEn: 'Visual Identity',
    descriptionAr: 'تطبيق الهوية البصرية الرسمية لجامعة الملك خالد',
    descriptionEn: 'Applying King Khalid University\'s official visual identity',
    icon: Target,
    color: 'from-indigo-500 to-purple-500'
  }
];

const features = [
  {
    titleAr: 'نظام الألوان',
    titleEn: 'Color System',
    icon: Palette,
    items: [
      { ar: 'الأخضر الداكن #184A2C (لون الجامعة الرئيسي)', en: 'Dark Green #184A2C (University primary color)' },
      { ar: 'الذهبي #D4AF37 (لون الجامعة الثانوي)', en: 'Gold #D4AF37 (University secondary color)' },
      { ar: 'تدرجات متناسقة لكل صفحة', en: 'Harmonious gradients for each page' },
      { ar: 'ألوان واضحة للحالات المختلفة', en: 'Clear colors for different states' }
    ]
  },
  {
    titleAr: 'التخطيط والبنية',
    titleEn: 'Layout and Structure',
    icon: Layout,
    items: [
      { ar: 'شبكة متناسقة في جميع الصفحات', en: 'Consistent grid across all pages' },
      { ar: 'مسافات بادئة واضحة ومنظمة', en: 'Clear and organized spacing' },
      { ar: 'تسلسل هرمي للمعلومات', en: 'Hierarchical information structure' },
      { ar: 'تنظيم المحتوى بشكل منطقي', en: 'Logical content organization' }
    ]
  },
  {
    titleAr: 'الوضع الليلي والنهاري',
    titleEn: 'Dark and Light Mode',
    icon: Moon,
    items: [
      { ar: 'دعم كامل للوضع الليلي', en: 'Full dark mode support' },
      { ar: 'دعم كامل للوضع النهاري', en: 'Full light mode support' },
      { ar: 'انتقال سلس بين الوضعين', en: 'Smooth transition between modes' },
      { ar: 'ألوان متوافقة في كلا الوضعين', en: 'Compatible colors in both modes' }
    ]
  },
  {
    titleAr: 'دعم اللغتين',
    titleEn: 'Bilingual Support',
    icon: Languages,
    items: [
      { ar: 'دعم كامل للغة العربية (RTL)', en: 'Full Arabic language support (RTL)' },
      { ar: 'دعم كامل للغة الإنجليزية (LTR)', en: 'Full English language support (LTR)' },
      { ar: 'تبديل فوري بين اللغتين', en: 'Instant language switching' },
      { ar: 'خطوط واضحة لكلا اللغتين', en: 'Clear fonts for both languages' }
    ]
  },
  {
    titleAr: 'التصميم المتجاوب',
    titleEn: 'Responsive Design',
    icon: Smartphone,
    items: [
      { ar: 'تصميم متوافق مع الهواتف الذكية', en: 'Mobile-friendly design' },
      { ar: 'تصميم متوافق مع الأجهزة اللوحية', en: 'Tablet-friendly design' },
      { ar: 'تصميم متوافق مع أجهزة الحاسوب', en: 'Desktop-friendly design' },
      { ar: 'تجربة سلسة على جميع الأحجام', en: 'Smooth experience on all sizes' }
    ]
  },
  {
    titleAr: 'التأثيرات البصرية',
    titleEn: 'Visual Effects',
    icon: Sparkles,
    items: [
      { ar: 'خلفيات جذابة لكل صفحة', en: 'Attractive backgrounds for each page' },
      { ar: 'تحركات وانيميشنات سلسة', en: 'Smooth animations and transitions' },
      { ar: 'تأثيرات hover تفاعلية', en: 'Interactive hover effects' },
      { ar: 'رسومات وأيقونات واضحة', en: 'Clear graphics and icons' }
    ]
  }
];

export const DesignMethodologyPage: React.FC = () => {
  const { language } = useApp();

  return (
    <div className="space-y-12">
      {/* Hero Header with Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-12">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1667039487487-2af414218c49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjB0aGlua2luZyUyMG1ldGhvZG9sb2d5fGVufDF8fHx8MTc2Mjk3ODMxNnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Design Methodology"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600/95 via-pink-600/95 to-fuchsia-600/95"></div>
        </div>

        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full animate-pulse">
              <Palette className="h-16 w-16" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            {language === 'ar' ? 'منهجية التصميم' : 'Design Methodology'}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            {language === 'ar'
              ? 'المبادئ والأسس التي اعتمدنا عليها في تصميم النظام'
              : 'Principles and foundations we relied on in designing the system'}
          </p>
        </div>
      </div>

      {/* Design Principles */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold gradient-text mb-4">
            {language === 'ar' ? 'مبادئ التصميم' : 'Design Principles'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'ar'
              ? 'المبادئ الأساسية التي توجه كل قرار تصميمي في المشروع'
              : 'Core principles that guide every design decision in the project'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designPrinciples.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <Card
                key={index}
                className="p-8 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex p-4 bg-gradient-to-br ${principle.color} rounded-2xl mb-4`}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {language === 'ar' ? principle.titleAr : principle.titleEn}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {language === 'ar' ? principle.descriptionAr : principle.descriptionEn}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Design Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold gradient-text mb-4">
            {language === 'ar' ? 'مميزات التصميم' : 'Design Features'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'ar'
              ? 'التفاصيل التقنية والفنية المطبقة في النظام'
              : 'Technical and artistic details applied in the system'}
          </p>
        </div>

        <div className="space-y-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-8 hover-lift animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="p-4 bg-gradient-to-br from-kku-green to-kku-gold rounded-2xl">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4">
                      {language === 'ar' ? feature.titleAr : feature.titleEn}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {feature.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-2 h-2 bg-kku-gold rounded-full mt-2"></div>
                          <p className="text-sm leading-relaxed">
                            {language === 'ar' ? item.ar : item.en}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Color Palette Demo */}
      <section>
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {language === 'ar' ? 'لوحة الألوان الرسمية' : 'Official Color Palette'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-full h-32 bg-kku-green rounded-lg mb-3 shadow-lg"></div>
              <p className="font-bold">KKU Green</p>
              <p className="text-sm text-muted-foreground">#184A2C</p>
            </div>
            
            <div className="text-center">
              <div className="w-full h-32 bg-kku-gold rounded-lg mb-3 shadow-lg"></div>
              <p className="font-bold">KKU Gold</p>
              <p className="text-sm text-muted-foreground">#D4AF37</p>
            </div>
            
            <div className="text-center">
              <div className="w-full h-32 bg-gradient-to-br from-kku-green to-emerald-700 rounded-lg mb-3 shadow-lg"></div>
              <p className="font-bold">{language === 'ar' ? 'تدرج أخضر' : 'Green Gradient'}</p>
              <p className="text-sm text-muted-foreground">Primary</p>
            </div>
            
            <div className="text-center">
              <div className="w-full h-32 bg-gradient-to-br from-kku-gold to-yellow-600 rounded-lg mb-3 shadow-lg"></div>
              <p className="font-bold">{language === 'ar' ? 'تدرج ذهبي' : 'Gold Gradient'}</p>
              <p className="text-sm text-muted-foreground">Secondary</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Summary */}
      <Card className="p-8 bg-gradient-to-br from-kku-green/10 via-transparent to-kku-gold/10">
        <div className="text-center max-w-3xl mx-auto">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-kku-gold" />
          <h2 className="text-3xl font-bold mb-4">
            {language === 'ar' ? 'تصميم احترافي عالمي المستوى' : 'World-Class Professional Design'}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {language === 'ar'
              ? 'تم تطبيق أفضل الممارسات العالمية في تصميم واجهات المستخدم لضمان تجربة استثنائية لجميع المستخدمين'
              : 'Applied world-class best practices in UI design to ensure an exceptional experience for all users'}
          </p>
        </div>
      </Card>
    </div>
  );
};
