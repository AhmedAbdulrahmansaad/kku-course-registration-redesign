import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  CheckCircle, 
  Clock, 
  Shield, 
  BookOpen, 
  Calendar, 
  BarChart3,
  Upload,
  LogIn,
  UserPlus,
  Sparkles,
  GraduationCap,
  Award,
  Users,
  MessageCircle,
  Star
} from 'lucide-react';
import { KKULogoSVG } from '../KKULogoSVG';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const features = [
  { icon: CheckCircle, titleAr: 'سهل الاستخدام', titleEn: 'Easy to Use', descAr: 'واجهة بسيطة وواضحة', descEn: 'Simple and clear interface' },
  { icon: Clock, titleAr: 'سريع وفعال', titleEn: 'Fast & Efficient', descAr: 'تسجيل فوري للمقررات', descEn: 'Instant registration' },
  { icon: Shield, titleAr: 'آمن وموثوق', titleEn: 'Secure & Reliable', descAr: 'حماية بياناتك بأمان', descEn: 'Secure data protection' },
  { icon: Award, titleAr: 'معتمد رسمياً', titleEn: 'Officially Certified', descAr: 'نظام معتمد من الجامعة', descEn: 'University certified system' },
  { icon: Users, titleAr: 'دعم فني', titleEn: 'Technical Support', descAr: 'فريق دعم متاح دائماً', descEn: 'Support team always available' },
  { icon: GraduationCap, titleAr: 'تجربة متميزة', titleEn: 'Excellent Experience', descAr: 'تجربة طلابية مثالية', descEn: 'Perfect student experience' },
];

const quickActions = [
  { icon: BookOpen, labelAr: 'المقررات المتاحة', labelEn: 'Available Courses', page: 'courses', color: 'from-blue-500 to-blue-600' },
  { icon: Calendar, labelAr: 'الجدول الدراسي', labelEn: 'My Schedule', page: 'schedule', color: 'from-purple-500 to-purple-600' },
  { icon: BarChart3, labelAr: 'التقارير', labelEn: 'Reports', page: 'reports', color: 'from-green-500 to-green-600' },
  { icon: Upload, labelAr: 'المستندات', labelEn: 'Documents', page: 'documents', color: 'from-orange-500 to-orange-600' },
  { icon: MessageCircle, labelAr: 'المساعد الذكي', labelEn: 'AI Assistant', page: 'assistant', color: 'from-pink-500 to-pink-600' },
];

export const HomePage: React.FC = () => {
  const { language, setCurrentPage } = useApp();

  // تهيئة المقررات تلقائياً عند تحميل الصفحة الرئيسية
  useEffect(() => {
    const initCourses = async () => {
      try {
        // التحقق إذا كانت المقررات محملة مسبقاً
        const coursesInitialized = localStorage.getItem('coursesInitialized');
        if (coursesInitialized === 'true') {
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/init-courses`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        const result = await response.json();
        if (response.ok) {
          localStorage.setItem('coursesInitialized', 'true');
        }
      } catch (error) {
        // Silent fail - courses initialization is optional
      }
    };

    initCourses();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section with Background */}
      <section className="relative -mt-8 -mx-4 px-4">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 h-[600px] overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1631599143424-5bc234fbebf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyOTExMDA2fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="University Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-kku-green/95 via-kku-green/90 to-kku-green/80 dark:from-kku-green/98 dark:via-kku-green/95 dark:to-kku-green/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center py-24">
          {/* Animated Logo */}
          <div className="flex justify-center mb-8 animate-pulse">
            <div className="bg-white p-6 rounded-3xl shadow-2xl ring-4 ring-kku-gold/30">
              <KKULogoSVG size={140} />
            </div>
          </div>
          
          {/* Animated Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-kku-gold fill-kku-gold animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
            {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
          </h1>
          
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
            <Sparkles className="w-5 h-5 text-kku-gold" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {language === 'ar' ? 'نظام التسجيل المطور' : 'Advanced Registration System'}
            </h2>
            <Sparkles className="w-5 h-5 text-kku-gold" />
          </div>
          
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto drop-shadow-lg">
            {language === 'ar' 
              ? 'منصة حديثة ومتطورة لتسجيل المقررات الدراسية بسهولة وأمان'
              : 'Modern and advanced platform for course registration with ease and security'}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setCurrentPage('login')}
              className="bg-white text-kku-green hover:bg-white/90 gap-2 text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform"
            >
              <LogIn className="w-6 h-6" />
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Button>
            <Button
              size="lg"
              onClick={() => setCurrentPage('signup')}
              className="bg-kku-gold text-white hover:bg-kku-gold/90 gap-2 text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-transform"
            >
              <UserPlus className="w-6 h-6" />
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Actions with Beautiful Cards */}
      <section className="relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-kku-green/10 to-kku-gold/10 px-6 py-3 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-kku-green" />
            <span className="font-bold text-kku-green">
              {language === 'ar' ? 'الخدمات السريعة' : 'Quick Services'}
            </span>
          </div>
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-kku-green to-emerald-600 bg-clip-text text-transparent">
            {language === 'ar' ? 'ابدأ رحلتك التعليمية' : 'Start Your Educational Journey'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {language === 'ar' ? 'اختر الخدمة التي تريدها' : 'Choose the service you need'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-kku-green"
                onClick={() => setCurrentPage(action.page)}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                
                <div className="relative p-8">
                  <div className={`bg-gradient-to-br ${action.color} p-5 rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <Icon className="w-10 h-10 text-white mx-auto" />
                  </div>
                  <h3 className="font-bold text-center text-lg mb-2">
                    {language === 'ar' ? action.labelAr : action.labelEn}
                  </h3>
                  <div className="h-1 bg-gradient-to-r from-transparent via-kku-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section with Image Background */}
      <section className="relative">
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1703236079592-4d2f222e8d2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaWJyYXJ5JTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYyOTA3ODA2fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Library"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-kku-green/10 to-kku-gold/10 px-6 py-3 rounded-full mb-4">
              <Award className="w-5 h-5 text-kku-gold" />
              <span className="font-bold text-kku-green">
                {language === 'ar' ? 'المميزات' : 'Features'}
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-kku-green to-emerald-600 bg-clip-text text-transparent">
              {language === 'ar' ? 'لماذا نظامنا هو الأفضل؟' : 'Why Our System is the Best?'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {language === 'ar' ? 'مميزات استثنائية لتجربة تعليمية متميزة' : 'Exceptional features for an outstanding educational experience'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-kku-green group">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-br from-kku-green to-emerald-600 p-5 rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-bold mb-3 text-lg">
                      {language === 'ar' ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-muted-foreground">
                      {language === 'ar' ? feature.descAr : feature.descEn}
                    </p>
                    <div className="mt-4 h-1 w-16 bg-gradient-to-r from-kku-green to-kku-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section with Graduation Background */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1648915880517-64a029f4194a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2VyZW1vbnklMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjI5NjEyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Graduation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-kku-green/95 via-emerald-700/95 to-kku-green/95"></div>
        </div>

        <div className="relative z-10 p-16 text-center text-white">
          <div className="flex justify-center mb-6">
            <GraduationCap className="w-20 h-20 animate-bounce" />
          </div>
          
          <h2 className="text-5xl font-bold mb-6 drop-shadow-lg">
            {language === 'ar' ? 'ابدأ رحلتك الأكاديمية الآن!' : 'Start Your Academic Journey Now!'}
          </h2>
          
          <p className="text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'انضم إلى آلاف الطلاب الذين اختاروا التميز'
              : 'Join thousands of students who chose excellence'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Button
              size="lg"
              onClick={() => setCurrentPage('signup')}
              className="bg-white text-kku-green hover:bg-white/90 gap-3 text-xl px-10 py-7 shadow-2xl hover:scale-110 transition-transform"
            >
              <UserPlus className="w-6 h-6" />
              {language === 'ar' ? 'سجل الآن مجاناً' : 'Register Now Free'}
            </Button>
            <Button
              size="lg"
              onClick={() => setCurrentPage('assistant')}
              className="bg-kku-gold text-white hover:bg-kku-gold/90 gap-3 text-xl px-10 py-7 shadow-2xl hover:scale-110 transition-transform"
            >
              <MessageCircle className="w-6 h-6" />
              {language === 'ar' ? 'تحدث مع المساعد' : 'Chat with Assistant'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};