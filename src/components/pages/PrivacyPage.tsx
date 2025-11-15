import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Shield, Lock, Eye, Database, UserCheck, AlertTriangle } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export const PrivacyPage: React.FC = () => {
  const { language } = useApp();

  return (
    <div className="space-y-12 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-kku-green/5 via-background to-kku-gold/5 -z-10" />
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-kku-green/10 dark:bg-primary/10 rounded-full blur-3xl animate-pulse-soft -z-10" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-kku-gold/10 rounded-full blur-3xl animate-pulse-soft -z-10" style={{ animationDelay: '1s' }} />
      
      {/* Header */}
      <div className="text-center animate-fade-in relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="h-10 w-10 text-kku-green dark:text-primary" />
          <h1 className="text-4xl font-bold text-kku-green dark:text-primary">
            {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {language === 'ar'
            ? 'نحن ملتزمون بحماية خصوصيتك وأمان بياناتك'
            : 'We are committed to protecting your privacy and data security'}
        </p>
      </div>

      {/* Introduction */}
      <Card className="p-8 relative z-10">
        <h2 className="text-2xl font-bold mb-4 text-kku-green dark:text-primary">
          {language === 'ar' ? 'مقدمة' : 'Introduction'}
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {language === 'ar'
            ? 'يهدف نظام تسجيل المقررات المطور في جامعة الملك خالد إلى توفير خدمة آمنة وموثوقة لجميع الطلاب. نحن نأخذ خصوصية بياناتك على محمل الجد ونلتزم بأعلى معايير الأمان والحماية.'
            : 'The Advanced Course Registration System at King Khalid University aims to provide a secure and reliable service for all students. We take your data privacy seriously and adhere to the highest security and protection standards.'}
        </p>
      </Card>

      {/* Security Features */}
      <section className="relative z-10">
        <h2 className="text-3xl font-bold mb-8 text-center text-kku-green dark:text-primary">
          {language === 'ar' ? 'ميزات الأمان' : 'Security Features'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Lock,
              title: 'Data Encryption',
              titleAr: 'تشفير البيانات',
              desc: 'All data is encrypted using industry-standard protocols',
              descAr: 'جميع البيانات مشفرة باستخدام بروتوكولات معيارية',
            },
            {
              icon: UserCheck,
              title: 'Authentication',
              titleAr: 'المصادقة',
              desc: 'Secure authentication system for student access',
              descAr: 'نظام مصادقة آمن لوصول الطلاب',
            },
            {
              icon: Database,
              title: 'Row Level Security',
              titleAr: 'أمان على مستوى الصف',
              desc: 'Database protection with RLS policies',
              descAr: 'حماية قاعدة البيانات بسياسات RLS',
            },
            {
              icon: Eye,
              title: 'Access Control',
              titleAr: 'التحكم في الوصول',
              desc: 'Strict access controls to protect your information',
              descAr: 'ضوابط صارمة للوصول لحماية معلوماتك',
            },
            {
              icon: Shield,
              title: 'Secure Storage',
              titleAr: 'تخزين آمن',
              desc: 'Your data is stored in secure, compliant infrastructure',
              descAr: 'بياناتك مخزنة في بنية تحتية آمنة ومتوافقة',
            },
            {
              icon: AlertTriangle,
              title: 'Regular Audits',
              titleAr: 'مراجعات منتظمة',
              desc: 'Regular security audits and updates',
              descAr: 'مراجعات وتحديثات أمنية منتظمة',
            },
          ].map((feature, index) => {
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
      </section>

      {/* Data Collection */}
      <Card className="p-8 relative z-10">
        <h2 className="text-2xl font-bold mb-6 text-kku-green dark:text-primary">
          {language === 'ar' ? 'البيانات التي نجمعها' : 'Data We Collect'}
        </h2>
        <ul className="space-y-4">
          {[
            {
              ar: 'الرقم الجامعي والاسم الكامل',
              en: 'Student ID and full name',
            },
            {
              ar: 'البريد الإلكتروني الجامعي',
              en: 'University email address',
            },
            {
              ar: 'التخصص والمستوى الدراسي',
              en: 'Major and academic level',
            },
            {
              ar: 'المقررات المسجلة والجدول الدراسي',
              en: 'Registered courses and schedule',
            },
            {
              ar: 'سجل التفاعل مع النظام',
              en: 'System interaction logs',
            },
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-kku-gold flex-shrink-0" />
              <p className="text-muted-foreground">
                {language === 'ar' ? item.ar : item.en}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Data Usage */}
      <Card className="p-8 relative z-10">
        <h2 className="text-2xl font-bold mb-6 text-kku-green dark:text-primary">
          {language === 'ar' ? 'كيف نستخدم بياناتك' : 'How We Use Your Data'}
        </h2>
        <ul className="space-y-4">
          {[
            {
              ar: 'لتوفير خدمات التسجيل وإدارة المقررات',
              en: 'To provide registration and course management services',
            },
            {
              ar: 'للتواصل معك بخصوص التحديثات الأكاديمية',
              en: 'To communicate academic updates with you',
            },
            {
              ar: 'لتحسين تجربة المستخدم وجودة الخدمة',
              en: 'To improve user experience and service quality',
            },
            {
              ar: 'لضمان أمان النظام ومنع الاستخدام غير المصرح به',
              en: 'To ensure system security and prevent unauthorized use',
            },
            {
              ar: 'للامتثال للمتطلبات الأكاديمية والقانونية',
              en: 'To comply with academic and legal requirements',
            },
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-kku-gold flex-shrink-0" />
              <p className="text-muted-foreground">
                {language === 'ar' ? item.ar : item.en}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Your Rights */}
      <Card className="p-8 relative z-10">
        <h2 className="text-2xl font-bold mb-6 text-kku-green dark:text-primary">
          {language === 'ar' ? 'حقوقك' : 'Your Rights'}
        </h2>
        <p className="text-muted-foreground mb-4">
          {language === 'ar'
            ? 'لديك الحق في:'
            : 'You have the right to:'}
        </p>
        <ul className="space-y-4">
          {[
            {
              ar: 'الوصول إلى بياناتك الشخصية ومراجعتها',
              en: 'Access and review your personal data',
            },
            {
              ar: 'طلب تصحيح البيانات غير الدقيقة',
              en: 'Request correction of inaccurate data',
            },
            {
              ar: 'الاعتراض على معالجة بياناتك في حالات معينة',
              en: 'Object to data processing in certain cases',
            },
            {
              ar: 'طلب حذف بياناتك بعد انتهاء فترة الدراسة',
              en: 'Request deletion of your data after graduation',
            },
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-kku-gold flex-shrink-0" />
              <p className="text-muted-foreground">
                {language === 'ar' ? item.ar : item.en}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Contact */}
      <Card className="p-8 bg-kku-green/5 dark:bg-primary/5 border-kku-green/20 relative z-10">
        <h2 className="text-2xl font-bold mb-4 text-kku-green dark:text-primary">
          {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
        </h2>
        <p className="text-muted-foreground mb-4">
          {language === 'ar'
            ? 'إذا كان لديك أي أسئلة حول سياسة الخصوصية أو كيفية استخدام بياناتك، يرجى التواصل معنا:'
            : 'If you have any questions about the privacy policy or how your data is used, please contact us:'}
        </p>
        <p className="font-bold">sraj3225@gmail.com</p>
        <p className="text-muted-foreground mt-2">
          {language === 'ar'
            ? 'آخر تحديث: 2025'
            : 'Last updated: 2025'}
        </p>
      </Card>
    </div>
  );
};