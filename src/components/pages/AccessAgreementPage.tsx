import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { 
  Shield, 
  CheckCircle2, 
  FileText, 
  User, 
  AlertCircle,
  Globe,
  Moon,
  Sun,
  ArrowRight,
  Lock,
  Sparkles,
  Crown,
  Award
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const AccessAgreementPage: React.FC = () => {
  const { language, setLanguage, theme, setTheme, setCurrentPage, setHasAcceptedAgreement } = useApp();
  const [fullName, setFullName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const agreementTextAr = `بسم الله الرحمن الرحيم

📜 تعهد استخدام نظام التسجيل الأكاديمي
جامعة الملك خالد - كلية إدارة الأعمال
قسم المعلوماتية الإدارية - نظم المعلومات الإدارية

أتعهد أنا الموقع أدناه بما يلي:

1️⃣ استخدام هذا النظام للأغراض الأكاديمية فقط والمتعلقة بتسجيل المقررات الدراسية.

2️⃣ عدم مشاركة بيانات الدخول الخاصة بي (البريد الإلكتروني وكلمة المرور) مع أي شخص آخر.

3️⃣ المحافظة على سرية المعلومات الشخصية والأكاديمية الخاصة بي وبزملائي الطلاب.

4️⃣ الالتزام بالأنظمة واللوائح الأكاديمية المعمول بها في جامعة الملك خالد.

5️⃣ عدم محاولة الوصول غير المصرح به إلى أي بيانات أو معلومات لا تخصني.

6️⃣ تحمل المسؤولية الكاملة عن أي استخدام لحسابي الشخصي في هذا النظام.

7️⃣ الإبلاغ الفوري عن أي نشاط مشبوه أو محاولة اختراق للنظام.

🔒 علماً بأن:
• سيتم تسجيل جميع عمليات الدخول والخروج من النظام.
• سيتم حفظ عنوان IP والوقت والمتصفح المستخدم لأغراض الأمان.
• أي مخالفة لهذا التعهد قد تؤدي إلى إيقاف حسابي وإحالتي للجهات المختصة.

أقر بأنني قرأت هذا التعهد وفهمت محتواه بالكامل وأوافق على الالتزام به.`;

  const agreementTextEn = `In the Name of Allah, the Most Gracious, the Most Merciful

📜 Academic Registration System Usage Agreement
King Khalid University - College of Business Administration
Department of Management Information Systems

I, the undersigned, hereby pledge the following:

1️⃣ To use this system solely for academic purposes related to course registration.

2️⃣ Not to share my login credentials (email and password) with anyone else.

3️⃣ To maintain the confidentiality of personal and academic information of myself and fellow students.

4️⃣ To comply with all academic regulations and policies in effect at King Khalid University.

5️⃣ Not to attempt unauthorized access to any data or information that does not belong to me.

6️⃣ To take full responsibility for any use of my personal account in this system.

7️⃣ To immediately report any suspicious activity or attempted breach of the system.

🔒 Please note that:
• All login and logout operations will be recorded.
• IP address, time, and browser information will be stored for security purposes.
• Any violation of this pledge may result in account suspension and referral to the authorities.

I acknowledge that I have read and understood this agreement and agree to abide by it.`;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = language === 'ar' 
        ? 'الاسم الكامل مطلوب' 
        : 'Full name is required';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = language === 'ar' 
        ? 'يجب أن يكون الاسم 3 أحرف على الأقل' 
        : 'Name must be at least 3 characters';
    }

    if (!agreed) {
      newErrors.agreed = language === 'ar' 
        ? 'يجب الموافقة على التعهد للمتابعة' 
        : 'You must agree to the pledge to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAgree = async () => {
    if (!validateForm()) {
      toast.error(
        language === 'ar' 
          ? '⚠️ يرجى تصحيح الأخطاء في النموذج' 
          : '⚠️ Please fix the errors in the form'
      );
      return;
    }

    setLoading(true);

    try {
      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();
      
      let ipAddress = 'Unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (e) {
        console.log('Could not fetch IP');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/log-access`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            fullName,
            ipAddress,
            userAgent,
            timestamp,
            language,
          }),
        }
      );

      if (response.ok) {
        localStorage.setItem('agreementAccepted', 'true');
        localStorage.setItem('access_agreement_name', fullName);
        localStorage.setItem('access_agreement_time', timestamp);

        toast.success(
          language === 'ar' 
            ? '✅ تم قبول التعهد بنجاح! جاري الانتقال لصفحة تسجيل الدخول...' 
            : '✅ Agreement accepted successfully! Redirecting to login...'
        );

        setHasAcceptedAgreement(true);

        setTimeout(() => {
          setCurrentPage('login');
        }, 1000);
      } else {
        throw new Error('Failed to log access');
      }
    } catch (error: any) {
      console.error('Error logging access:', error);
      localStorage.setItem('agreementAccepted', 'true');
      localStorage.setItem('access_agreement_name', fullName);
      setHasAcceptedAgreement(true);
      toast.success(
        language === 'ar' 
          ? '✅ تم قبول التعهد! جاري الانتقال لصفحة تسجيل الدخول...' 
          : '✅ Agreement accepted! Redirecting to login...'
      );
      setTimeout(() => {
        setCurrentPage('login');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ultra Premium Background - Multiple Layers */}
      <div className="absolute inset-0 z-0">
        {/* Base Image */}
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1762463463957-7ffea2664743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwbHV4dXJ5JTIwaXNsYW1pYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NjMzNTU0NzV8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="جامعة الملك خالد - King Khalid University"
          className="w-full h-full object-cover scale-105 animate-slow-zoom"
        />
        
        {/* Premium Gradient Overlay - Layer 1 */}
        <div className="absolute inset-0 bg-gradient-to-br from-kku-green/97 via-emerald-900/95 to-kku-green/97 backdrop-blur-[2px]"></div>
        
        {/* Gold Luxury Overlay - Layer 2 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-kku-gold/20 via-transparent to-kku-gold/30 mix-blend-overlay"></div>
        
        {/* Radial Glow - Layer 3 */}
        <div className="absolute inset-0 bg-radial-gradient opacity-40"></div>
        
        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-kku-gold/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            ></div>
          ))}
        </div>
        
        {/* Luxury Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        {/* Top Gold Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-kku-gold to-transparent"></div>
        
        {/* Bottom Gold Accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-kku-gold to-transparent"></div>
      </div>

      {/* Floating Crown Icon - Top Left */}
      <div className="absolute top-8 left-8 z-10 animate-float">
        <div className="relative">
          <div className="absolute inset-0 bg-kku-gold/40 blur-xl rounded-full"></div>
          <Crown className="relative w-12 h-12 text-kku-gold drop-shadow-2xl" />
        </div>
      </div>

      {/* Floating Award Icon - Top Right (before language buttons) */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 animate-float" style={{ animationDelay: '1s' }}>
        <div className="relative">
          <div className="absolute inset-0 bg-kku-gold/40 blur-xl rounded-full"></div>
          <Award className="relative w-12 h-12 text-kku-gold drop-shadow-2xl" />
        </div>
      </div>

      {/* Language & Theme Selector - Top Right */}
      <div className="absolute top-6 right-6 z-20 flex flex-wrap gap-3">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-kku-gold via-yellow-400 to-kku-gold rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          
          <div className="relative flex items-center gap-2 bg-white/98 dark:bg-gray-950/98 backdrop-blur-xl p-2.5 rounded-2xl shadow-2xl border-2 border-kku-gold/50">
            <Globe className="w-5 h-5 text-kku-gold" />
            <Button
              variant={language === 'ar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('ar')}
              className={language === 'ar' ? 'bg-gradient-to-r from-kku-green to-emerald-700 text-white hover:from-kku-green/90 hover:to-emerald-700/90 shadow-lg' : 'hover:bg-kku-green/10'}
            >
              عربي
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className={language === 'en' ? 'bg-gradient-to-r from-kku-green to-emerald-700 text-white hover:from-kku-green/90 hover:to-emerald-700/90 shadow-lg' : 'hover:bg-kku-green/10'}
            >
              English
            </Button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-kku-gold via-yellow-400 to-kku-gold rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          
          <div className="relative flex items-center gap-2 bg-white/98 dark:bg-gray-950/98 backdrop-blur-xl p-2.5 rounded-2xl shadow-2xl border-2 border-kku-gold/50">
            <Button
              variant={theme === 'light' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTheme('light')}
              className={theme === 'light' ? 'bg-gradient-to-r from-kku-green to-emerald-700 text-white hover:from-kku-green/90 hover:to-emerald-700/90 shadow-lg' : 'hover:bg-kku-green/10'}
            >
              <Sun className="w-4 h-4" />
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTheme('dark')}
              className={theme === 'dark' ? 'bg-gradient-to-r from-kku-green to-emerald-700 text-white hover:from-kku-green/90 hover:to-emerald-700/90 shadow-lg' : 'hover:bg-kku-green/10'}
            >
              <Moon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Card - ULTRA PREMIUM */}
      <div className="relative z-10 w-full max-w-7xl">
        {/* Outer Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-kku-gold via-yellow-500 to-kku-gold rounded-[3rem] blur-2xl opacity-20 animate-pulse-slow"></div>
        
        <Card className="relative bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl shadow-[0_0_80px_rgba(212,175,55,0.3)] border-[3px] border-kku-gold/60 rounded-[2.5rem] overflow-hidden">
          {/* Gold Border Animation */}
          <div className="absolute inset-0 rounded-[2.5rem] border-2 border-kku-gold/30 animate-border-flow pointer-events-none"></div>
          
          <div className="p-8 sm:p-12 md:p-16 lg:p-20">
            {/* Luxury Header */}
            <div className="text-center mb-12 lg:mb-16">
              {/* Shield Icon with Premium Effects */}
              <div className="flex justify-center mb-10">
                <div className="relative group">
                  {/* Multiple glow layers */}
                  <div className="absolute inset-0 bg-kku-gold/60 blur-3xl animate-pulse-slow rounded-full scale-150"></div>
                  <div className="absolute inset-0 bg-emerald-500/40 blur-2xl animate-pulse rounded-full scale-125" style={{ animationDelay: '0.5s' }}></div>
                  
                  {/* Icon container */}
                  <div className="relative bg-gradient-to-br from-kku-green via-emerald-600 to-kku-green p-10 rounded-[2rem] shadow-2xl transform group-hover:scale-105 transition-transform duration-500 border-4 border-kku-gold/40">
                    {/* Inner glow */}
                    <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-[1.5rem]"></div>
                    
                    <Shield className="relative w-32 h-32 text-white drop-shadow-2xl" strokeWidth={1.5} />
                    
                    {/* Sparkles */}
                    <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-kku-gold animate-pulse" />
                    <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
              </div>
              
              {/* Title with Gradient */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-kku-green via-emerald-600 to-kku-green bg-clip-text text-transparent animate-gradient-x">
                  {language === 'ar' ? 'تعهد استخدام النظام الأكاديمي' : 'Academic System Usage Agreement'}
                </span>
              </h1>
              
              {/* University Info */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-kku-gold/20 via-yellow-500/20 to-kku-gold/20 rounded-2xl border-2 border-kku-gold/40 shadow-lg backdrop-blur-sm">
                  <Crown className="w-8 h-8 text-kku-gold" />
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-kku-green to-emerald-700 bg-clip-text text-transparent">
                    {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
                  </p>
                  <Crown className="w-8 h-8 text-kku-gold" />
                </div>
                
                <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium">
                  {language === 'ar' 
                    ? 'نظام التسجيل المطور - قسم نظم المعلومات الإدارية'
                    : 'Advanced Registration System - MIS Department'}
                </p>
              </div>
            </div>

            {/* Agreement Box - ULTRA LUXURY */}
            <div className="mb-12 relative group">
              {/* Outer glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-kku-gold/30 via-yellow-500/30 to-kku-gold/30 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              <Card className="relative bg-gradient-to-br from-amber-50/80 via-yellow-50/80 to-amber-50/80 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 backdrop-blur-xl border-[3px] border-kku-gold shadow-[0_0_60px_rgba(212,175,55,0.2)] rounded-[1.75rem] overflow-hidden">
                {/* Top gold line */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-kku-gold to-transparent"></div>
                
                <div className="p-10 sm:p-12 md:p-14 lg:p-16">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-10 bg-gradient-to-r from-kku-green/10 via-emerald-600/10 to-kku-green/10 dark:from-kku-green/20 dark:via-emerald-600/20 dark:to-kku-green/20 p-7 rounded-2xl border-[3px] border-kku-green/40 shadow-xl backdrop-blur-sm relative overflow-hidden">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    
                    <FileText className="relative w-14 h-14 sm:w-16 sm:h-16 text-kku-green flex-shrink-0 drop-shadow-lg" />
                    <h2 className="relative text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-kku-green to-emerald-700 bg-clip-text text-transparent">
                      {language === 'ar' ? '📜 نص التعهد' : '📜 Agreement Text'}
                    </h2>
                  </div>
                  
                  {/* Agreement Text - Premium Scrollable */}
                  <div className="relative group/scroll">
                    <div className="absolute -inset-1 bg-gradient-to-r from-kku-gold/20 via-transparent to-kku-gold/20 rounded-2xl"></div>
                    
                    <div className="relative bg-white dark:bg-gray-950 p-10 sm:p-12 md:p-14 rounded-2xl border-[3px] border-kku-gold/30 shadow-inner max-h-[600px] overflow-y-auto custom-scrollbar">
                      <pre className="text-xl sm:text-2xl md:text-3xl leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                        {language === 'ar' ? agreementTextAr : agreementTextEn}
                      </pre>
                    </div>
                  </div>
                </div>
                
                {/* Bottom gold line */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-kku-gold to-transparent"></div>
              </Card>
            </div>

            {/* Name Input - Premium */}
            <div className="mb-10">
              <Label htmlFor="fullName" className="text-2xl sm:text-3xl font-bold mb-4 flex items-center gap-3 text-foreground">
                <div className="p-2 bg-gradient-to-br from-kku-green to-emerald-700 rounded-xl">
                  <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-kku-gold/30 to-emerald-500/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل اسمك الثلاثي أو الرباعي' : 'Enter your full name'}
                  className={`relative h-20 sm:h-24 text-xl sm:text-2xl md:text-3xl border-[3px] rounded-2xl shadow-lg backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 ${
                    errors.fullName ? 'border-red-500' : 'border-kku-green/50 focus:border-kku-gold focus:ring-4 focus:ring-kku-gold/30'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-lg sm:text-xl mt-3 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-6 h-6" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Checkbox - Premium */}
            <div className="mb-12 relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-kku-gold/20 via-emerald-500/20 to-kku-gold/20 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
              
              <Card className="relative bg-gradient-to-br from-kku-green/5 via-emerald-50/50 to-kku-green/5 dark:from-kku-green/10 dark:via-gray-800 dark:to-kku-green/10 backdrop-blur-xl border-[3px] border-kku-green/50 shadow-2xl rounded-[1.5rem]">
                <div className="p-10 sm:p-12 md:p-14">
                  <div className="flex items-start gap-6">
                    <Checkbox
                      id="agreed"
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked as boolean)}
                      className="mt-2 h-12 w-12 sm:h-14 sm:w-14 border-[3px] border-kku-green data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-kku-green data-[state=checked]:to-emerald-700 data-[state=checked]:border-kku-gold rounded-xl shadow-lg"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="agreed"
                        className="text-2xl sm:text-3xl md:text-4xl font-bold cursor-pointer text-foreground leading-relaxed"
                      >
                        <span className="inline-flex items-center gap-4 flex-wrap">
                          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-kku-green flex-shrink-0" />
                          {language === 'ar' 
                            ? 'أوافق على جميع بنود هذا التعهد وألتزم بتطبيقها'
                            : 'I agree to all terms of this pledge and commit to comply'}
                        </span>
                      </Label>
                      {errors.agreed && (
                        <p className="text-red-500 text-lg sm:text-xl mt-4 flex items-center gap-3 font-medium">
                          <AlertCircle className="w-6 h-6" />
                          {errors.agreed}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Submit Button - ULTRA PREMIUM */}
            <div className="relative group mb-12">
              {/* Multiple glow layers */}
              <div className="absolute -inset-4 bg-gradient-to-r from-kku-gold via-yellow-400 to-kku-gold rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-70 animate-pulse-slow transition-opacity duration-500"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-kku-green to-emerald-500 rounded-[1.75rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              
              <Button
                onClick={handleAgree}
                disabled={loading || !agreed || !fullName.trim()}
                className="relative w-full h-24 sm:h-28 md:h-32 text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-kku-green via-emerald-600 to-kku-green hover:from-emerald-600 hover:via-kku-green hover:to-emerald-600 text-white shadow-2xl transition-all duration-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-[1.5rem] border-[3px] border-kku-gold/50 overflow-hidden group"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                
                {/* Gold accent lines */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-kku-gold to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-kku-gold to-transparent"></div>
                
                {loading ? (
                  <div className="flex items-center justify-center gap-5 relative z-10">
                    <div className="animate-spin h-12 w-12 border-[4px] border-white border-t-kku-gold rounded-full"></div>
                    <span>{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-5 relative z-10">
                    <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 animate-pulse" />
                    <span className="flex-1">
                      {language === 'ar' ? '✅ أوافق وأتعهد - الانتقال للدخول' : '✅ I Agree - Go to Login'}
                    </span>
                    <ArrowRight className={`w-12 h-12 sm:w-14 sm:h-14 ${language === 'ar' ? 'rotate-180' : ''} animate-bounce-x`} />
                  </div>
                )}
              </Button>
            </div>

            {/* Security Footer - Premium */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-blue-500/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              
              <div className="relative p-8 sm:p-10 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-blue-950/50 backdrop-blur-xl rounded-2xl border-[3px] border-blue-300 dark:border-blue-700 shadow-xl">
                <p className="text-center text-lg sm:text-xl md:text-2xl text-blue-900 dark:text-blue-100 flex items-center justify-center gap-4 flex-wrap font-semibold">
                  <Lock className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" />
                  <span>
                    {language === 'ar' 
                      ? '🔒 جميع البيانات محمية ومشفرة وفقاً لمعايير الأمان العالمية ISO 27001'
                      : '🔒 All data is protected and encrypted according to ISO 27001 security standards'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes slow-zoom {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.1); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes border-flow {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-bounce-x {
          animation: bounce-x 1s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-in-out infinite;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-border-flow {
          animation: border-flow 3s ease-in-out infinite;
        }
        .bg-radial-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.3) 0%, transparent 70%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(212, 175, 55, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #184A2C, #10B981);
          border-radius: 10px;
          border: 2px solid rgba(212, 175, 55, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #10B981, #184A2C);
        }
      `}</style>
    </div>
  );
};