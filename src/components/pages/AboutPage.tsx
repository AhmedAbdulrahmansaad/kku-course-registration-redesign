import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { GraduationCap, Target, Users, Award, Sparkles, Code, Database, Palette } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { motion } from 'motion/react';
import { KKULogo } from '../KKULogo';

const teamMembers = [
  { name: 'سراج', nameEn: 'Siraj', role: 'قائد المشروع', roleEn: 'Project Leader', icon: Award },
  { name: 'سعيد', nameEn: 'Saeed', role: 'محلل الأنظمة', roleEn: 'Systems Analyst', icon: Target },
  { name: 'زياد', nameEn: 'Ziyad', role: 'مطور خلفية', roleEn: 'Backend Developer', icon: Database },
  { name: 'وليد', nameEn: 'Waleed', role: 'مطور واجهة أمامية', roleEn: 'Frontend Developer', icon: Code },
  { name: 'أسامة', nameEn: 'Osama', role: 'مصمم تجربة المستخدم', roleEn: 'UI/UX Designer', icon: Palette },
  { name: 'فارس', nameEn: 'Fares', role: 'مختبر ومُوثّق النظام', roleEn: 'Tester & Documenter', icon: Sparkles },
];

export const AboutPage: React.FC = () => {
  const { language, t } = useApp();

  return (
    <div className="space-y-16">
      {/* Hero Section with Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-12">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1562577309-2af414218c49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYm91dCUyMHVzJTIwdGVhbSUyMHVuaXZlcnNpdHl8ZW58MXx8fHwxNzYyOTc4MzE1fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="About Project"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-purple-600/95"></div>
        </div>

        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full animate-pulse">
              <GraduationCap className="h-16 w-16" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            {language === 'ar' ? 'عن المشروع' : 'About the Project'}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            {language === 'ar'
              ? 'مشروع تخرج لإعادة تصميم نظام تسجيل المقررات - ج��معة الملك خالد'
              : 'Graduation Project for Course Registration System Redesign - King Khalid University'}
          </p>
        </div>
      </div>

      {/* Project Info Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-gradient-to-br from-kku-green to-kku-gold rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-kku-green dark:text-primary mb-2">
            {language === 'ar' ? 'الجامعة' : 'University'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar'
              ? 'جامعة الملك خالد'
              : 'King Khalid University'}
          </p>
        </Card>

        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-kku-gold/20 rounded-full mb-4">
            <Code className="h-8 w-8 text-kku-gold" />
          </div>
          <h3 className="font-bold text-kku-green dark:text-primary mb-2">
            {language === 'ar' ? 'الكلية' : 'College'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar'
              ? 'كلية إدارة الأعمال'
              : 'College of Business'}
          </p>
        </Card>

        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-kku-green/20 dark:bg-primary/20 rounded-full mb-4">
            <Database className="h-8 w-8 text-kku-green dark:text-primary" />
          </div>
          <h3 className="font-bold text-kku-green dark:text-primary mb-2">
            {language === 'ar' ? 'القسم' : 'Department'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'المعلوماتية الإدارية' : 'Business Informatics'}
          </p>
        </Card>

        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-gradient-to-br from-kku-gold to-yellow-600 rounded-full mb-4">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-kku-green dark:text-primary mb-2">
            {language === 'ar' ? 'سنة التخرج' : 'Graduation Year'}
          </h3>
          <p className="text-sm text-muted-foreground font-bold">2026-2025</p>
        </Card>
      </section>

      {/* Supervisor Section */}
      <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <Card className="p-8 bg-gradient-to-br from-kku-green/10 via-transparent to-kku-gold/10 border-2 border-kku-green/20 dark:border-primary/20 hover-lift">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="p-6 bg-gradient-to-br from-kku-green to-kku-gold rounded-2xl">
                <Users className="h-16 w-16 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-start">
              <h2 className="text-2xl font-bold gradient-text mb-2">
                {t('supervisor')}
              </h2>
              <p className="text-xl font-medium mb-2">
                {language === 'ar' ? 'د. محمد رشيد' : 'Dr. Mohammed Rashid'}
              </p>
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? 'كلية إدارة الأعمال - قسم المعلوماتية الإدارية'
                  : 'College of Business - Department of Business Informatics'}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Team Members */}
      <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
            {t('team')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {language === 'ar'
              ? 'فريق عمل متميز من طلاب نظم المعلومات'
              : 'Outstanding team of Information Systems students'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => {
            const Icon = member.icon;
            return (
              <Card
                key={index}
                className="p-8 text-center hover-lift glass-effect animate-scale-in relative overflow-hidden"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-kku-gold/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-kku-green/10 dark:bg-primary/10 rounded-full blur-2xl" />
                
                <div className="relative z-10">
                  <Avatar className="h-28 w-28 mx-auto mb-4 ring-4 ring-kku-green/20 dark:ring-primary/20">
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-kku-green to-kku-gold text-white dark:from-primary dark:to-secondary">
                      {member.nameEn.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="mb-4">
                    <Icon className="h-8 w-8 mx-auto text-kku-gold" />
                  </div>
                  
                  <h3 className="font-bold text-xl mb-2">
                    {language === 'ar' ? member.name : member.nameEn}
                  </h3>
                  <p className="text-muted-foreground font-medium">
                    {language === 'ar' ? member.role : member.roleEn}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Project Goals */}
      <section className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <Card className="p-8 md:p-12 hover-lift pattern-bg">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-gradient-to-br from-kku-green to-kku-gold rounded-full mb-4">
              <Target className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-2">
              {language === 'ar' ? 'أهداف المشروع' : 'Project Goals'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'الأهداف الرئيسية التي يسعى المشروع لتحقيقها'
                : 'Main objectives the project aims to achieve'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                ar: 'إعادة تصميم نظام تسجيل المقررات بواجهة حديثة وسهلة الاستخدام',
                en: 'Redesign the course registration system with a modern and user-friendly interface',
                icon: Palette,
              },
              {
                ar: 'تحسين تجربة المستخدم وتسهيل عملية التسجيل',
                en: 'Improve user experience and simplify the registration process',
                icon: Sparkles,
              },
              {
                ar: 'توفير نظام آمن وموثوق لحماية بيانات الطلاب',
                en: 'Provide a secure and reliable system to protect student data',
                icon: Award,
              },
              {
                ar: 'دعم التحديثات الفورية والتواصل السريع مع المشرف الأكاديمي',
                en: 'Support real-time updates and quick communication with academic advisors',
                icon: Users,
              },
              {
                ar: 'تطبيق أفضل الممارسات في تطوير الأنظمة الحديثة',
                en: 'Apply best practices in modern system development',
                icon: Code,
              },
              {
                ar: 'دعم كامل للغتين العربية والإنجليزية مع تصميم متجاوب',
                en: 'Full support for Arabic and English with responsive design',
                icon: GraduationCap,
              },
            ].map((goal, index) => {
              const GoalIcon = goal.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-slide-in-right"
                  style={{ animationDelay: `${0.7 + index * 0.05}s` }}
                >
                  <div className="flex-shrink-0 p-2 bg-kku-gold/20 rounded-lg">
                    <GoalIcon className="h-6 w-6 text-kku-gold" />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'ar' ? goal.ar : goal.en}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Technologies */}
      <section className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-4">
            {language === 'ar' ? 'التقنيات المستخدمة' : 'Technologies Used'}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'React', icon: '⚛️' },
            { name: 'TypeScript', icon: '📘' },
            { name: 'Tailwind CSS', icon: '🎨' },
            { name: 'Supabase', icon: '🗄️' },
          ].map((tech, index) => (
            <Card
              key={index}
              className="p-6 text-center hover-lift animate-scale-in"
              style={{ animationDelay: `${0.9 + index * 0.05}s` }}
            >
              <div className="text-4xl mb-2">{tech.icon}</div>
              <p className="font-medium text-sm">{tech.name}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};