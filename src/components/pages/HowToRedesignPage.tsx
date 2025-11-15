import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Lightbulb, Palette, Code, TestTube, Rocket } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const steps = [
  {
    icon: Lightbulb,
    title: 'Research & Analysis',
    titleAr: 'البحث والتحليل',
    description: 'Understanding user needs and analyzing current system limitations',
    descriptionAr: 'فهم احتياجات المستخدمين وتحليل قيود النظام الحالي',
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    titleAr: 'تصميم الواجهات',
    description: 'Creating wireframes, prototypes, and visual design systems',
    descriptionAr: 'إنشاء النماذج الأولية وأنظمة التصميم البصري',
  },
  {
    icon: Code,
    title: 'Development',
    titleAr: 'التطوير',
    description: 'Building the system using React, TypeScript, and Supabase',
    descriptionAr: 'بناء النظام باستخدام React و TypeScript و Supabase',
  },
  {
    icon: TestTube,
    title: 'Testing & QA',
    titleAr: 'الاختبار والجودة',
    description: 'Comprehensive testing to ensure quality and performance',
    descriptionAr: 'اختبار شامل لضمان الجودة والأداء',
  },
  {
    icon: Rocket,
    title: 'Launch & Iterate',
    titleAr: 'الإطلاق والتحسين',
    description: 'Deploying the system and gathering user feedback',
    descriptionAr: 'نشر النظام وجمع ملاحظات المستخدمين',
  },
];

export const HowToRedesignPage: React.FC = () => {
  const { language } = useApp();

  return (
    <div className="space-y-12 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-kku-green/5 via-background to-kku-gold/5 -z-10" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1562939651-9359f291c988?w=1200')] bg-cover bg-center opacity-5 -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kku-green/10 dark:bg-primary/10 rounded-full blur-3xl animate-pulse-soft -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-kku-gold/10 rounded-full blur-3xl animate-pulse-soft -z-10" style={{ animationDelay: '1.5s' }} />
      
      {/* Header */}
      <div className="text-center animate-fade-in relative z-10">
        <h1 className="text-4xl font-bold mb-4 text-kku-green dark:text-primary">
          {language === 'ar' ? 'منهجية إعادة التصميم' : 'Redesign Methodology'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {language === 'ar'
            ? 'نتبع منهجية حديثة لضمان تطوير نظام فعال وسهل الاستخدام'
            : 'We follow a modern methodology to ensure an effective and user-friendly system'}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-kku-green/10 dark:bg-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-kku-green dark:text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl font-bold text-kku-gold">{index + 1}</span>
                    <h3 className="text-2xl font-bold">
                      {language === 'ar' ? step.titleAr : step.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    {language === 'ar' ? step.descriptionAr : step.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Design Principles */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center text-kku-green dark:text-primary">
          {language === 'ar' ? 'مبادئ التصميم' : 'Design Principles'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'User-Centered',
              titleAr: 'محوره المستخدم',
              desc: 'Designed with student needs as the top priority',
              descAr: 'مصمم مع احتياجات الطالب كأولوية قصوى',
            },
            {
              title: 'Consistency',
              titleAr: 'الاتساق',
              desc: 'Consistent design patterns throughout the system',
              descAr: 'أنماط تصميم متسقة في جميع أنحاء النظام',
            },
            {
              title: 'Accessibility',
              titleAr: 'إمكانية الوصول',
              desc: 'Accessible to all users including those with disabilities',
              descAr: 'متاح لجميع المستخدمين بما في ذلك ذوي الإعاقة',
            },
            {
              title: 'Performance',
              titleAr: 'الأداء',
              desc: 'Fast loading times and smooth interactions',
              descAr: 'أوقات تحميل سريعة وتفاعلات سلسة',
            },
          ].map((principle, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all">
              <h3 className="text-xl font-bold mb-2 text-kku-green dark:text-primary">
                {language === 'ar' ? principle.titleAr : principle.title}
              </h3>
              <p className="text-muted-foreground">
                {language === 'ar' ? principle.descAr : principle.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-center text-kku-green dark:text-primary">
          {language === 'ar' ? 'التقنيات المستخدمة' : 'Technology Stack'}
        </h2>
        <Card className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { name: 'React', desc: 'Frontend Framework' },
              { name: 'TypeScript', desc: 'Type Safety' },
              { name: 'TailwindCSS', desc: 'Styling' },
              { name: 'Supabase', desc: 'Backend & Database' },
            ].map((tech, index) => (
              <div key={index} className="p-4">
                <div className="h-16 w-16 rounded-lg bg-kku-green/10 dark:bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-bold text-kku-green dark:text-primary">
                    {tech.name.charAt(0)}
                  </span>
                </div>
                <h4 className="font-bold mb-1">{tech.name}</h4>
                <p className="text-sm text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};