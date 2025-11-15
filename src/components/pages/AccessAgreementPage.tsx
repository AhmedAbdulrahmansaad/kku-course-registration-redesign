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
  Smartphone,
  Tablet,
  Monitor
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
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const agreementTextAr = `
📜 تعهد استخدام نظام التسجيل الجامعي

بسم الله الرحمن الرحيم

أتعهد أنا الموقع أدناه بما يلي:

1️⃣ استخدام هذا النظام للأغراض الأكاديمية فقط والمتعلقة بتسجيل المقررات الدراسية.

2️⃣ عدم مشاركة بيانات الدخول الخاصة بي (البريد الإلكتروني كلمة المرور) مع أي شخص آخر.

3️⃣ المحافظة على سرية المعلومات الشخصية والأكاديمية الخاصة بي وبزملائي الطلاب.

4️⃣ الالتزام بالأنظمة واللوائح الأكاديمية المعمول بها في جامعة الملك خالد.

5️⃣ عدم محاولة الوصول غير المصرح به إلى أي بيانات أو معلومات لا تخصني.

6️⃣ تحمل المسؤولية الكاملة عن أي استخدام لحسابي الشخصي في هذا النظام.

7️⃣ الإبلاغ الفوري عن أي نشاط مشبوه أو محاولة اختراق للنظام.

🔒 علماً بأن:
• سيتم تسجيل جميع عمليات الدخول والخروج من النظام.
• سيتم حفظ عنوان IP والوقت والمتصفح المستخدم لأغراض الأمان.
• أي مخالفة لهذا التعهد قد تؤدي إلى إيقاف حسابي وإحالتي للجهات المختصة.

أقر بأنني قرأت هذا التعهد وفهمت محتواه بالكامل وأوافق على الالتزام به.
`;

  const agreementTextEn = `
📜 University Registration System Usage Agreement

In the Name of Allah, the Most Gracious, the Most Merciful

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

I acknowledge that I have read and understood this agreement and agree to abide by it.
`;

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
      // Get user information
      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();
      
      // Get IP address (using a simple method)
      let ipAddress = 'Unknown';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (e) {
        console.log('Could not fetch IP');
      }

      // Log access to Supabase
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
        // Store agreement acceptance in localStorage
        localStorage.setItem('agreementAccepted', 'true');
        localStorage.setItem('access_agreement_name', fullName);
        localStorage.setItem('access_agreement_time', timestamp);

        toast.success(
          language === 'ar' 
            ? '✅ تم قبول التعهد بنجاح! مرحباً بك في النظام' 
            : '✅ Agreement accepted successfully! Welcome to the system'
        );

        // Update context
        setHasAcceptedAgreement(true);

        // Wait a moment then navigate
        setTimeout(() => {
          setCurrentPage('home');
        }, 1500);
      } else {
        throw new Error('Failed to log access');
      }
    } catch (error: any) {
      console.error('Error logging access:', error);
      // Still allow access even if logging fails
      localStorage.setItem('agreementAccepted', 'true');
      localStorage.setItem('access_agreement_name', fullName);
      setHasAcceptedAgreement(true);
      toast.success(
        language === 'ar' 
          ? '✅ مرحباً بك في النظام' 
          : '✅ Welcome to the system'
      );
      setTimeout(() => {
        setCurrentPage('home');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAgree();
  };

  return (
    <div className="min-h-screen fixed inset-0 z-50 overflow-auto bg-gradient-to-br from-kku-green via-emerald-800 to-teal-900">
      {/* أزرار التحكم في الزاوية العلوية */}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 animate-fade-in">
        {/* أزرار اللغة والثيم */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex gap-2 shadow-2xl">
          {/* زر اللغة */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="gap-2 text-white hover:bg-white/20 hover:text-kku-gold transition-all"
            title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline text-sm font-bold">
              {language === 'ar' ? 'EN' : 'عربي'}
            </span>
          </Button>

          {/* زر الثيم */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="text-white hover:bg-white/20 hover:text-kku-gold transition-all"
            title={theme === 'light' ? (language === 'ar' ? 'الوضع الليلي' : 'Dark Mode') : (language === 'ar' ? 'الوضع النهاري' : 'Light Mode')}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* أزرار معاينة الأجهزة */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex gap-2 shadow-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewDevice('mobile')}
            className={`text-white hover:bg-white/20 transition-all ${previewDevice === 'mobile' ? 'bg-kku-gold text-kku-green scale-110' : ''}`}
            title={language === 'ar' ? 'معاينة الجوال' : 'Mobile Preview'}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewDevice('tablet')}
            className={`text-white hover:bg-white/20 transition-all ${previewDevice === 'tablet' ? 'bg-kku-gold text-kku-green scale-110' : ''}`}
            title={language === 'ar' ? 'معاينة التابلت' : 'Tablet Preview'}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewDevice('desktop')}
            className={`text-white hover:bg-white/20 transition-all ${previewDevice === 'desktop' ? 'bg-kku-gold text-kku-green scale-110' : ''}`}
            title={language === 'ar' ? 'معاينة الحاسوب' : 'Desktop Preview'}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </div>

        {/* عرض اسم الجهاز الحالي */}
        <div className="bg-kku-gold/90 backdrop-blur-md border border-kku-gold rounded-2xl px-4 py-2 shadow-2xl">
          <p className="text-kku-green text-xs font-bold text-center whitespace-nowrap">
            {previewDevice === 'mobile' ? (language === 'ar' ? '📱 جوال' : '📱 Mobile') :
             previewDevice === 'tablet' ? (language === 'ar' ? '📲 تابلت' : '📲 Tablet') :
             (language === 'ar' ? '💻 حاسوب' : '💻 Desktop')}
          </p>
        </div>
      </div>

      {/* خلفية جذابة مع صور متعددة */}
      <div className="absolute inset-0">
        {/* صورة الخلفية الرئيسية */}
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1670284768187-5cc68eada1b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwbW9kZXJuJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyOTg5NTI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="King Khalid University Campus"
          className="w-full h-full object-cover opacity-10"
        />
        
        {/* تأثير Overlay متدرج ثلاثي */}
        <div className="absolute inset-0 bg-gradient-to-br from-kku-green/98 via-emerald-800/95 to-teal-900/98"></div>
        
        {/* نقاط مضيئة متحركة */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-kku-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-teal-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
        </div>
        
        {/* شبكة نقاط خفيفة */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* شعار الجامعة في الزاوية */}
        <div className="absolute top-8 right-8 flex items-center gap-4 text-white animate-fade-in">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-2xl hover:scale-110 transition-transform">
            <Shield className="h-16 w-16 text-kku-gold drop-shadow-2xl" />
          </div>
          <div className={`${language === 'ar' ? 'text-right' : 'text-left'} hidden md:block`}>
            <h1 className="text-2xl font-bold text-white drop-shadow-2xl" style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
              {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
            </h1>
            <p className="text-kku-gold drop-shadow-lg" style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
              {language === 'ar' ? 'نحو مستقبل أكاديمي متميز' : 'Towards Excellence'}
            </p>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي مع Device Preview */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        {/* حاوية المعاينة */}
        <div 
          className={`transition-all duration-500 ease-in-out ${
            previewDevice === 'mobile' ? 'w-full max-w-[375px] scale-95' :
            previewDevice === 'tablet' ? 'w-full max-w-[768px] scale-98' :
            'w-full max-w-4xl'
          } animate-fade-up`}
          style={{ animationDuration: '0.8s' }}
        >
          {/* إطار الجهاز */}
          <div className={`relative ${
            previewDevice === 'mobile' ? 'shadow-[0_0_0_12px_#1a1a1a,0_0_0_13px_#d4af37] rounded-[3rem]' :
            previewDevice === 'tablet' ? 'shadow-[0_0_0_8px_#2a2a2a,0_0_0_9px_#d4af37] rounded-[2rem]' :
            ''
          }`}>
            {/* مربع التعهد مع Frosted Glass Effect */}
            <Card className="backdrop-blur-xl bg-white/10 border-2 border-white/20 shadow-2xl rounded-3xl overflow-hidden">
              {/* شريط ذهبي للعنوان */}
              <div className="bg-gradient-to-r from-kku-gold via-yellow-500 to-kku-gold p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                <FileText className="h-12 w-12 mx-auto mb-3 text-kku-green drop-shadow-lg" />
                <h2 className={`${previewDevice === 'mobile' ? 'text-xl' : 'text-3xl md:text-4xl'} font-bold text-kku-green drop-shadow-lg`} style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
                  {language === 'ar' ? '📜 تعهد استخدام النظام' : '📜 System Usage Agreement'}
                </h2>
                <p className={`text-kku-green/80 mt-2 ${previewDevice === 'mobile' ? 'text-sm' : ''}`} style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
                  {language === 'ar' ? 'نظام تسجيل المقررات الجامعية' : 'University Course Registration System'}
                </p>
              </div>

              <div className={`${previewDevice === 'mobile' ? 'p-4' : 'p-6 md:p-10'}`}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* نص التعهد مع خلفية زجاجية */}
                  <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl ${previewDevice === 'mobile' ? 'p-3 max-h-64' : 'p-6 max-h-96'} overflow-y-auto scrollbar-thin scrollbar-thumb-kku-gold/50 scrollbar-track-white/10`}>
                    <pre className={`whitespace-pre-wrap ${previewDevice === 'mobile' ? 'text-xs' : 'text-sm md:text-base'} leading-relaxed text-white/95`} style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
                      {language === 'ar' ? agreementTextAr : agreementTextEn}
                    </pre>
                  </div>

                  {/* حقل الاسم الكامل */}
                  <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <Label htmlFor="fullName" className={`flex items-center gap-2 text-white ${previewDevice === 'mobile' ? 'text-sm' : 'text-lg'}`} style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
                      <User className={`${previewDevice === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'} text-kku-gold`} />
                      {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`${previewDevice === 'mobile' ? 'h-12 text-base' : 'h-14 text-lg'} bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-kku-gold transition-all`}
                      style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}
                    />
                    {errors.fullName && (
                      <p className={`text-red-300 ${previewDevice === 'mobile' ? 'text-xs' : 'text-sm'} flex items-center gap-2 animate-shake`}>
                        <AlertCircle className="h-4 w-4" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* مربع الموافقة */}
                  <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl ${previewDevice === 'mobile' ? 'p-3' : 'p-6'} animate-fade-in`} style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id="agree"
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(checked as boolean)}
                        className="mt-1 border-white/30 data-[state=checked]:bg-kku-gold data-[state=checked]:border-kku-gold"
                      />
                      <div className="flex-1">
                        <label htmlFor="agree" className={`text-white cursor-pointer leading-relaxed ${previewDevice === 'mobile' ? 'text-sm' : ''}`} style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
                          {language === 'ar' ? (
                            <>
                              <CheckCircle2 className={`inline ${previewDevice === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'} text-kku-gold ml-2`} />
                              أقر بأنني قرأت هذا التعهد وفهمت محتواه بالكامل وأوافق على الالتزام به، وأتحمل المسؤولية الكاملة عن استخدامي لهذا النظام.
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className={`inline ${previewDevice === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'} text-kku-gold mr-2`} />
                              I acknowledge that I have read and understood this agreement and agree to abide by it, and take full responsibility for my use of this system.
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                    {errors.agreed && (
                      <p className={`text-red-300 ${previewDevice === 'mobile' ? 'text-xs' : 'text-sm'} flex items-center gap-2 mt-3 animate-shake`}>
                        <AlertCircle className="h-4 w-4" />
                        {errors.agreed}
                      </p>
                    )}
                  </div>

                  {/* زر الموافقة */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full ${previewDevice === 'mobile' ? 'h-12 text-base' : 'h-16 text-xl'} bg-gradient-to-r from-kku-gold via-yellow-500 to-kku-gold hover:from-yellow-600 hover:to-kku-gold text-kku-green font-bold shadow-2xl hover:shadow-kku-gold/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in border-2 border-yellow-600`}
                    style={{ animationDelay: '0.4s', fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="spinner h-6 w-6 border-kku-green" />
                        {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                      </div>
                    ) : (
                      <span className="flex items-center gap-3">
                        <CheckCircle2 className={`${previewDevice === 'mobile' ? 'h-5 w-5' : 'h-6 w-6'}`} />
                        {language === 'ar' ? 'أوافق على التعهد والمتابعة' : 'I Agree and Continue'}
                        <Shield className={`${previewDevice === 'mobile' ? 'h-5 w-5' : 'h-6 w-6'}`} />
                      </span>
                    )}
                  </Button>

                  {/* ملاحظة أمنية */}
                  <div className={`bg-red-500/10 backdrop-blur-md border border-red-300/30 rounded-xl ${previewDevice === 'mobile' ? 'p-3' : 'p-4'} animate-fade-in`} style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`${previewDevice === 'mobile' ? 'h-4 w-4' : 'h-5 w-5'} text-red-300 flex-shrink-0 mt-0.5`} />
                      <p className={`${previewDevice === 'mobile' ? 'text-xs' : 'text-sm'} text-red-100 leading-relaxed`} style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
                        {language === 'ar' ? (
                          <>
                            <strong className="text-red-200">تنبيه أمني:</strong> سيتم تسجيل عنوان IP الخاص بك، نوع المتصفح، والوقت لأغراض الأمان. أي محاولة للاختراق أو الاستخدام غير المصرح به سيؤدي إلى اتخاذ الإجراءات القانونية اللازمة.
                          </>
                        ) : (
                          <>
                            <strong className="text-red-200">Security Notice:</strong> Your IP address, browser type, and timestamp will be logged for security purposes. Any attempt to breach or unauthorized use will result in legal action.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          {/* معلومات إضافية */}
          <div className={`mt-6 text-center text-white/80 ${previewDevice === 'mobile' ? 'text-xs' : 'text-sm'} animate-fade-in`} style={{ animationDelay: '0.6s', fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
            <p>
              {language === 'ar' 
                ? '🔒 جميع بياناتك محمية ومشفرة وفقاً لأعلى معايير الأمان' 
                : '🔒 All your data is protected and encrypted according to the highest security standards'}
            </p>
            <p className="mt-2">
              {language === 'ar' 
                ? 'كلية إدارة الأعمال - قسم نظم المعلومات الإدارية' 
                : 'College of Business - MIS Department'}
            </p>
            <p className="text-kku-gold mt-1">
              {language === 'ar' 
                ? '© 2025 جامعة الملك خالد - جميع الحقوق محفوظة' 
                : '© 2025 King Khalid University - All Rights Reserved'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};