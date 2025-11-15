import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Lightbulb, 
  Search, 
  Pencil, 
  Code, 
  TestTube, 
  Rocket,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { motion } from 'motion/react';

const phases = [
  {
    id: 1,
    titleAr: 'التخطيط والتحليل',
    titleEn: 'Planning and Analysis',
    descriptionAr: 'تحديد متطلبات المشروع وتحليل النظام الحالي ووضع خطة عمل شاملة',
    descriptionEn: 'Defining project requirements, analyzing current system, and creating comprehensive work plan',
    icon: Lightbulb,
    status: 'completed',
    duration: 'أسبوعين',
    color: 'from-blue-500 to-cyan-500',
    tasks: [
      { ar: 'جمع المتطلبات', en: 'Requirements Gathering' },
      { ar: 'تحليل النظام الحالي', en: 'Current System Analysis' },
      { ar: 'تحديد أهداف المشروع', en: 'Project Goals Definition' },
      { ar: 'وضع الجدول الزمني', en: 'Timeline Creation' }
    ]
  },
  {
    id: 2,
    titleAr: 'البحث والدراسة',
    titleEn: 'Research and Study',
    descriptionAr: 'دراسة التقنيات الحديثة وأفضل الممارسات في تطوير أنظمة التسجيل',
    descriptionEn: 'Studying modern technologies and best practices in registration system development',
    icon: Search,
    status: 'completed',
    duration: 'أسبوع',
    color: 'from-purple-500 to-pink-500',
    tasks: [
      { ar: 'بحث عن التقنيات المناسبة', en: 'Technology Research' },
      { ar: 'دراسة أنظمة مشابهة', en: 'Similar Systems Study' },
      { ar: 'مراجعة الأدبيات', en: 'Literature Review' },
      { ar: 'اختيار الأدوات والمكتبات', en: 'Tools and Libraries Selection' }
    ]
  },
  {
    id: 3,
    titleAr: 'التصميم',
    titleEn: 'Design',
    descriptionAr: 'تصميم واجهة المستخدم وتجربة الاستخدام والهوية البصرية للنظام',
    descriptionEn: 'Designing user interface, user experience, and visual identity of the system',
    icon: Pencil,
    status: 'completed',
    duration: 'ثلاثة أسابيع',
    color: 'from-orange-500 to-red-500',
    tasks: [
      { ar: 'تصميم الهوية البصرية', en: 'Visual Identity Design' },
      { ar: 'رسم الشاشات والنماذج', en: 'Wireframes and Mockups' },
      { ar: 'تصميم تجربة المستخدم', en: 'UX Design' },
      { ar: 'اختيار الألوان والخطوط', en: 'Colors and Fonts Selection' }
    ]
  },
  {
    id: 4,
    titleAr: 'التطوير',
    titleEn: 'Development',
    descriptionAr: 'برمجة وتطوير النظام باستخدام React و TypeScript و Tailwind CSS',
    descriptionEn: 'Programming and developing the system using React, TypeScript, and Tailwind CSS',
    icon: Code,
    status: 'completed',
    duration: 'خمسة أسابيع',
    color: 'from-green-500 to-emerald-500',
    tasks: [
      { ar: 'إعداد بيئة التطوير', en: 'Development Environment Setup' },
      { ar: 'تطوير المكونات الأساسية', en: 'Core Components Development' },
      { ar: 'تطوير الصفحات', en: 'Pages Development' },
      { ar: 'ربط قاعدة البيانات', en: 'Database Integration' },
      { ar: 'تطبيق نظام المصادقة', en: 'Authentication Implementation' }
    ]
  },
  {
    id: 5,
    titleAr: 'الاختبار',
    titleEn: 'Testing',
    descriptionAr: 'اختبار النظام والتأكد من جودته وخلوه من الأخطاء',
    descriptionEn: 'Testing the system and ensuring its quality and error-free performance',
    icon: TestTube,
    status: 'in-progress',
    duration: 'أسبوعين',
    color: 'from-yellow-500 to-amber-500',
    tasks: [
      { ar: 'اختبار الوظائف', en: 'Functional Testing' },
      { ar: 'اختبار الأداء', en: 'Performance Testing' },
      { ar: 'اختبار التوافق', en: 'Compatibility Testing' },
      { ar: 'اختبار الأمان', en: 'Security Testing' }
    ]
  },
  {
    id: 6,
    titleAr: 'النشر والتسليم',
    titleEn: 'Deployment and Delivery',
    descriptionAr: 'نشر النظام وإعداد التوثيق النهائي للمشروع',
    descriptionEn: 'Deploying the system and preparing final project documentation',
    icon: Rocket,
    status: 'pending',
    duration: 'أسبوع',
    color: 'from-indigo-500 to-purple-500',
    tasks: [
      { ar: 'نشر النظام', en: 'System Deployment' },
      { ar: 'إعداد التوثيق', en: 'Documentation Preparation' },
      { ar: 'تدريب المستخدمين', en: 'User Training' },
      { ar: 'التسليم النهائي', en: 'Final Delivery' }
    ]
  }
];

export const ProjectPhasesPage: React.FC = () => {
  const { language } = useApp();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'مكتمل' : 'Completed'}
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Target className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'قادم' : 'Pending'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Header with Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-12">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1687862528147-0ecb1aa4b81d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9qZWN0JTIwcGxhbm5pbmclMjBzdHJhdGVneXxlbnwxfHx8fDE3NjI5NzgzMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Project Phases"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/95 via-purple-600/95 to-fuchsia-600/95"></div>
        </div>

        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full animate-pulse">
              <Rocket className="h-16 w-16" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            {language === 'ar' ? 'مراحل المشروع' : 'Project Phases'}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            {language === 'ar'
              ? 'رحلة تطوير نظام تسجيل المقررات من البداية إلى النهاية'
              : 'Journey of developing the course registration system from start to finish'}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="p-8 bg-gradient-to-br from-kku-green/10 via-transparent to-kku-gold/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">4/6</div>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'المراحل المكتملة' : 'Completed Phases'}
            </p>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-600 mb-2">1</div>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'المرحلة الحالية' : 'Current Phase'}
            </p>
          </div>
          <div>
            <div className="text-4xl font-bold text-kku-green mb-2">67%</div>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'}
            </p>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-8">
        {phases.map((phase, index) => {
          const Icon = phase.icon;
          const isEven = index % 2 === 0;

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: isEven ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-8 hover-lift relative overflow-hidden">
                {/* Decorative gradient */}
                <div className={`absolute top-0 ${isEven ? 'left-0' : 'right-0'} w-2 h-full bg-gradient-to-b ${phase.color}`}></div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Icon Section */}
                  <div className="flex-shrink-0">
                    <div className={`p-6 bg-gradient-to-br ${phase.color} rounded-2xl`}>
                      <Icon className="h-12 w-12 text-white" />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold">
                            {language === 'ar' ? phase.titleAr : phase.titleEn}
                          </h3>
                          {getStatusBadge(phase.status)}
                        </div>
                        <p className="text-muted-foreground">
                          {language === 'ar' ? phase.descriptionAr : phase.descriptionEn}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        <Clock className="w-3 h-3 mr-1" />
                        {phase.duration}
                      </Badge>
                    </div>

                    {/* Tasks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {phase.tasks.map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm">
                            {language === 'ar' ? task.ar : task.en}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phase Number */}
                  <div className="flex-shrink-0 hidden md:block">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-3xl font-bold text-muted-foreground">
                        {phase.id}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-8 bg-gradient-to-br from-kku-green to-emerald-700 text-white">
        <div className="text-center">
          <Rocket className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            {language === 'ar' ? 'المشروع في مساره النهائي!' : 'Project in Final Stages!'}
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'نحن في مرحلة الاختبار النهائي، وعلى وشك تسليم نظام متكامل واحترافي'
              : 'We are in the final testing phase, about to deliver a complete and professional system'}
          </p>
        </div>
      </Card>
    </div>
  );
};
