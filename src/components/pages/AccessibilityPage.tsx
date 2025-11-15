import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Eye, Keyboard, MousePointer, Volume2, Languages, Contrast } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export const AccessibilityPage: React.FC = () => {
  const { language } = useApp();

  const features = [
    {
      icon: Eye,
      title: 'Screen Reader Support',
      titleAr: 'دعم قارئ الشاشة',
      desc: 'Full compatibility with screen readers like JAWS and NVDA',
      descAr: 'توافق كامل مع قارئات الشاشة مثل JAWS و NVDA',
    },
    {
      icon: Keyboard,
      title: 'Keyboard Navigation',
      titleAr: 'التنقل بلوحة المفاتيح',
      desc: 'Complete keyboard navigation support for all features',
      descAr: 'دعم التنقل الكامل بلوحة المفاتيح لجميع الميزات',
    },
    {
      icon: Contrast,
      title: 'High Contrast Mode',
      titleAr: 'وضع التباين العالي',
      desc: 'Enhanced color contrast for better visibility',
      descAr: 'تباين ألوان محسّن لرؤية أفضل',
    },
    {
      icon: Volume2,
      title: 'Audio Cues',
      titleAr: 'التنبيهات الصوتية',
      desc: 'Audio feedback for important actions',
      descAr: 'ردود فعل صوتية للإجراءات المهمة',
    },
    {
      icon: Languages,
      title: 'Multiple Languages',
      titleAr: 'لغات متعددة',
      desc: 'Support for Arabic and English',
      descAr: 'دعم اللغتين العربية والإنجليزية',
    },
    {
      icon: MousePointer,
      title: 'Large Click Areas',
      titleAr: 'مناطق نقر كبيرة',
      desc: 'Larger interactive elements for easier use',
      descAr: 'عناصر تفاعلية أكبر لسهولة الاستخدام',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 text-kku-green dark:text-primary">
          {language === 'ar' ? 'إمكانية الوصول' : 'Accessibility'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {language === 'ar'
            ? 'نظام شامل يدعم جميع المستخدمين بما في ذلك ذوي الاحتياجات الخاصة'
            : 'An inclusive system that supports all users including those with disabilities'}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-kku-green/10 dark:bg-primary/10 rounded-full">
                  <Icon className="h-8 w-8 text-kku-green dark:text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">
                {language === 'ar' ? feature.titleAr : feature.title}
              </h3>
              <p className="text-muted-foreground text-center">
                {language === 'ar' ? feature.descAr : feature.desc}
              </p>
            </Card>
          );
        })}
      </div>

      {/* WCAG Compliance */}
      <section>
        <Card className="p-8">
          <h2 className="text-3xl font-bold mb-6 text-kku-green dark:text-primary text-center">
            {language === 'ar' ? 'معايير WCAG 2.1' : 'WCAG 2.1 Standards'}
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'النظام يتوافق مع إرشادات الوصول إلى محتوى الويب (WCAG 2.1) المستوى AA'
              : 'The system complies with Web Content Accessibility Guidelines (WCAG 2.1) Level AA'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                principle: 'Perceivable',
                principleAr: 'قابل للإدراك',
                desc: 'Information presented in ways users can perceive',
                descAr: 'المعلومات معروضة بطرق يمكن للمستخدمين إدراكها',
              },
              {
                principle: 'Operable',
                principleAr: 'قابل للتشغيل',
                desc: 'Interface components are operable by all users',
                descAr: 'مكونات الواجهة قابلة للتشغيل من قبل جميع المستخدمين',
              },
              {
                principle: 'Understandable',
                principleAr: 'قابل للفهم',
                desc: 'Information and operation are understandable',
                descAr: 'المعلومات والعمليات قابلة للفهم',
              },
              {
                principle: 'Robust',
                principleAr: 'قوي',
                desc: 'Content works with various assistive technologies',
                descAr: 'المحتوى يعمل مع مختلف التقنيات المساعدة',
              },
            ].map((item, index) => (
              <Card key={index} className="p-6 bg-muted/50">
                <h3 className="text-xl font-bold mb-2 text-kku-green dark:text-primary">
                  {language === 'ar' ? item.principleAr : item.principle}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar' ? item.descAr : item.desc}
                </p>
              </Card>
            ))}
          </div>
        </Card>
      </section>

      {/* Keyboard Shortcuts */}
      <section>
        <Card className="p-8">
          <h3 className="text-2xl font-bold mb-6 text-kku-green dark:text-primary text-center">
            {language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
          </h3>
          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              { key: 'Tab', action: 'Navigate forward', actionAr: 'التنقل للأمام' },
              { key: 'Shift + Tab', action: 'Navigate backward', actionAr: 'التنقل للخلف' },
              { key: 'Enter', action: 'Activate element', actionAr: 'تفعيل العنصر' },
              { key: 'Esc', action: 'Close dialog/modal', actionAr: 'إغلاق النافذة' },
              { key: 'Arrow Keys', action: 'Navigate menus', actionAr: 'التنقل في القوائم' },
            ].map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <kbd className="px-3 py-1 bg-background border rounded font-mono">
                  {shortcut.key}
                </kbd>
                <span className="text-muted-foreground">
                  {language === 'ar' ? shortcut.actionAr : shortcut.action}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};