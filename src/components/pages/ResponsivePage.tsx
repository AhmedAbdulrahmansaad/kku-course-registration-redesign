import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export const ResponsivePage: React.FC = () => {
  const { language } = useApp();

  return (
    <div className="space-y-12 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-kku-green/5 via-background to-kku-gold/5 -z-10" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-kku-green/10 dark:bg-primary/10 rounded-full blur-3xl animate-pulse-soft -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-kku-gold/10 rounded-full blur-3xl animate-pulse-soft -z-10" style={{ animationDelay: '1.5s' }} />
      
      {/* Header */}
      <div className="text-center animate-fade-in relative z-10">
        <h1 className="text-4xl font-bold mb-4 text-kku-green dark:text-primary">
          {language === 'ar' ? 'التصميم المتجاوب' : 'Responsive Design'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {language === 'ar'
            ? 'نظام متوافق مع جميع الأجهزة والشاشات'
            : 'A system compatible with all devices and screens'}
        </p>
      </div>

      {/* Device Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          {
            icon: Monitor,
            name: 'Desktop',
            nameAr: 'الحاسوب',
            desc: 'Optimized for large screens',
            descAr: 'محسّن للشاشات الكبيرة',
            size: '1920x1080',
          },
          {
            icon: Tablet,
            name: 'Tablet',
            nameAr: 'التابلت',
            desc: 'Perfect for medium screens',
            descAr: 'مثالي للشاشات المتوسطة',
            size: '768x1024',
          },
          {
            icon: Smartphone,
            name: 'Mobile',
            nameAr: 'الجوال',
            desc: 'Designed for small screens',
            descAr: 'مصمم للشاشات الصغيرة',
            size: '375x667',
          },
        ].map((device, index) => {
          const Icon = device.icon;
          return (
            <Card
              key={index}
              className="p-6 text-center hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-kku-green/10 dark:bg-primary/10 rounded-full">
                  <Icon className="h-12 w-12 text-kku-green dark:text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar' ? device.nameAr : device.name}
              </h3>
              <p className="text-muted-foreground mb-2">
                {language === 'ar' ? device.descAr : device.desc}
              </p>
              <p className="text-sm text-muted-foreground">{device.size}</p>
            </Card>
          );
        })}
      </div>

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center text-kku-green dark:text-primary">
          {language === 'ar' ? 'مميزات التصميم المتجاوب' : 'Responsive Design Features'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Fluid Layout',
              titleAr: 'تخطيط مرن',
              desc: 'Layout adapts automatically to screen size',
              descAr: 'يتكيف التخطيط تلقائياً مع حجم الشاشة',
            },
            {
              title: 'Touch Friendly',
              titleAr: 'ملائم للمس',
              desc: 'Larger touch targets for mobile devices',
              descAr: 'أهداف لمس أكبر للأجهزة المحمولة',
            },
            {
              title: 'Flexible Images',
              titleAr: 'صور مرنة',
              desc: 'Images scale perfectly on all screens',
              descAr: 'تتكيف الصور بشكل مثالي على جميع الشاشات',
            },
            {
              title: 'Mobile First',
              titleAr: 'الجوال أولاً',
              desc: 'Designed for mobile then enhanced for desktop',
              descAr: 'مصمم للجوال ثم محسّن للحاسوب',
            },
            {
              title: 'Fast Performance',
              titleAr: 'أداء سريع',
              desc: 'Optimized loading for all devices',
              descAr: 'تحميل محسّن لجميع الأجهزة',
            },
            {
              title: 'Consistent Experience',
              titleAr: 'تجربة متسقة',
              desc: 'Same great experience on all platforms',
              descAr: 'نفس التجربة الرائعة على جميع المنصات',
            },
          ].map((feature, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <h3 className="text-xl font-bold mb-2 text-kku-green dark:text-primary">
                {language === 'ar' ? feature.titleAr : feature.title}
              </h3>
              <p className="text-muted-foreground">
                {language === 'ar' ? feature.descAr : feature.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Breakpoints */}
      <Card className="p-8">
        <h3 className="text-2xl font-bold mb-6 text-kku-green dark:text-primary text-center">
          {language === 'ar' ? 'نقاط التكيف' : 'Breakpoints'}
        </h3>
        <div className="space-y-4">
          {[
            { name: 'Mobile', range: '< 768px', color: 'bg-blue-500' },
            { name: 'Tablet', range: '768px - 1024px', color: 'bg-green-500' },
            { name: 'Desktop', range: '> 1024px', color: 'bg-purple-500' },
          ].map((breakpoint, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className={`h-4 w-4 rounded-full ${breakpoint.color}`} />
              <span className="font-bold w-24">{breakpoint.name}</span>
              <span className="text-muted-foreground">{breakpoint.range}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};