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
  User, 
  AlertCircle,
  Globe,
  Moon,
  Sun,
  ArrowRight,
  Lock,
  FileCheck
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

تعهد استخدام نظام التسجيل الأكاديمي
جامعة الملك خالد - كلية إدارة الأعمال
قسم المعلوماتية الإدارية - نظم المعلومات الإدارية

أتعهد أنا الموقع أدناه بما يلي:

1. استخدام هذا النظام للأغراض الأكاديمية فقط والمتعلقة بتسجيل المقررات الدراسية.

2. عدم مشاركة بيانات الدخول الخاصة بي (البريد الإلكتروني وكلمة المرور) مع أي شخص آخر.

3. المحافظة على سرية المعلومات الشخصية والأكاديمية الخاصة بي وبزملائي الطلاب.

4. الالتزام بالأنظمة واللوائح الأكاديمية المعمول بها في جامعة الملك خالد.

5. عدم محاولة الوصول غير المصرح به إلى أي بيانات أو معلومات لا تخصني.

6. تحمل المسؤولية الكاملة عن أي استخدام لحسابي الشخصي في هذا النظام.

7. الإبلاغ الفوري عن أي نشاط مشبوه أو محاولة اختراق للنظام.

علماً بأن:
• سيتم تسجيل جميع عمليات الدخول والخروج من النظام.
• سيتم حفظ عنوان IP والوقت والمتصفح المستخدم لأغراض الأمان.
• أي مخالفة لهذا التعهد قد تؤدي إلى إيقاف حسابي وإحالتي للجهات المختصة.

أقر بأنني قرأت هذا التعهد وفهمت محتواه بالكامل وأوافق على الالتزام به.`;

  const agreementTextEn = `In the Name of Allah, the Most Gracious, the Most Merciful

Academic Registration System Usage Agreement
King Khalid University - College of Business Administration
Department of Management Information Systems

I, the undersigned, hereby pledge the following:

1. To use this system solely for academic purposes related to course registration.

2. Not to share my login credentials (email and password) with anyone else.

3. To maintain the confidentiality of personal and academic information of myself and fellow students.

4. To comply with all academic regulations and policies in effect at King Khalid University.

5. Not to attempt unauthorized access to any data or information that does not belong to me.

6. To take full responsibility for any use of my personal account in this system.

7. To immediately report any suspicious activity or attempted breach of the system.

Please note that:
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
          ? 'يرجى تصحيح الأخطاء في النموذج' 
          : 'Please fix the errors in the form'
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
        console.log('Could not fetch IP address');
      }

      // محاولة حفظ البيانات في قاعدة البيانات
      try {
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
          console.log('Agreement logged successfully in database');
        } else {
          console.warn('Failed to log in database, continuing with local storage');
        }
      } catch (dbError) {
        console.warn('Database error, continuing with local storage:', dbError);
      }

      // حفظ في Local Storage
      localStorage.setItem('agreementAccepted', 'true');
      localStorage.setItem('access_agreement_name', fullName);
      localStorage.setItem('access_agreement_time', timestamp);
      localStorage.setItem('access_agreement_ip', ipAddress);

      setHasAcceptedAgreement(true);

      toast.success(
        language === 'ar' 
          ? 'تم قبول التعهد بنجاح! جاري الانتقال لصفحة تسجيل الدخول...' 
          : 'Agreement accepted successfully! Redirecting to login...'
      );

      setTimeout(() => {
        setCurrentPage('login');
      }, 1500);
    } catch (error: any) {
      console.error('Error in agreement process:', error);
      toast.error(
        language === 'ar' 
          ? 'حدث خطأ، يرجى المحاولة مرة أخرى' 
          : 'An error occurred, please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1696691908119-15c737012c57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmclMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzYzNDA3OTMzfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="King Khalid University Campus"
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-kku-green/95 via-kku-green/90 to-emerald-900/95"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Language & Theme Selector */}
      <div className="absolute top-4 right-4 z-20 flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-kku-gold/30">
          <Globe className="w-4 h-4 text-kku-gold" />
          <Button
            variant={language === 'ar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('ar')}
            className={language === 'ar' ? 'bg-kku-green hover:bg-kku-green/90 text-white h-8' : 'h-8'}
          >
            عربي
          </Button>
          <Button
            variant={language === 'en' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'bg-kku-green hover:bg-kku-green/90 text-white h-8' : 'h-8'}
          >
            English
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-kku-gold/30">
          <Button
            variant={theme === 'light' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('light')}
            className={theme === 'light' ? 'bg-kku-green hover:bg-kku-green/90 text-white h-8' : 'h-8'}
          >
            <Sun className="w-4 h-4" />
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('dark')}
            className={theme === 'dark' ? 'bg-kku-green hover:bg-kku-green/90 text-white h-8' : 'h-8'}
          >
            <Moon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <Card className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl overflow-hidden border-2 border-kku-gold/50">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-kku-green to-emerald-700 p-6 sm:p-8 md:p-10 text-white">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-kku-gold" strokeWidth={2} />
            </div>
            <h1 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              {language === 'ar' 
                ? 'تعهد استخدام نظام التسجيل الأكاديمي' 
                : 'Academic Registration System Usage Agreement'}
            </h1>
            <p className="text-center text-base sm:text-lg md:text-xl text-white/90">
              {language === 'ar' 
                ? 'جامعة الملك خالد - كلية إدارة الأعمال' 
                : 'King Khalid University - College of Business'}
            </p>
            <p className="text-center text-sm sm:text-base text-white/80 mt-2">
              {language === 'ar' 
                ? 'قسم المعلوماتية الإدارية - نظم المعلومات الإدارية' 
                : 'Management Information Systems Department'}
            </p>
          </div>

          {/* Content Section */}
          <div className="p-6 sm:p-8 md:p-10 lg:p-12">
            {/* Agreement Text Box */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FileCheck className="w-6 h-6 sm:w-7 sm:h-7 text-kku-green" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {language === 'ar' ? 'نص التعهد' : 'Agreement Text'}
                </h2>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 border-2 border-kku-green/30 rounded-xl p-6 sm:p-8 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                <pre className="text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                  {language === 'ar' ? agreementTextAr : agreementTextEn}
                </pre>
              </div>
            </div>

            {/* Full Name Input */}
            <div className="mb-6">
              <Label htmlFor="fullName" className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                <User className="w-5 h-5 text-kku-green" />
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسمك الكامل (ثلاثي أو رباعي)' : 'Enter your full name'}
                className={`h-12 sm:h-14 text-base sm:text-lg border-2 rounded-lg ${
                  errors.fullName 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-kku-green'
                }`}
                disabled={loading}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm sm:text-base mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Agreement Checkbox */}
            <div className="mb-8">
              <div className="flex items-start gap-3 p-4 sm:p-6 bg-gradient-to-r from-kku-green/5 to-emerald-50/50 dark:from-kku-green/10 dark:to-emerald-900/20 border-2 border-kku-green/30 rounded-xl">
                <Checkbox
                  id="agreed"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1 h-6 w-6 border-2 border-kku-green data-[state=checked]:bg-kku-green data-[state=checked]:border-kku-green"
                  disabled={loading}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="agreed"
                    className="text-base sm:text-lg font-semibold cursor-pointer text-foreground leading-relaxed"
                  >
                    <span className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-kku-green flex-shrink-0 mt-0.5" />
                      <span>
                        {language === 'ar' 
                          ? 'أوافق على جميع بنود هذا التعهد وألتزم بتطبيقها'
                          : 'I agree to all terms of this pledge and commit to comply'}
                      </span>
                    </span>
                  </Label>
                  {errors.agreed && (
                    <p className="text-red-500 text-sm sm:text-base mt-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.agreed}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleAgree}
              disabled={loading || !agreed || !fullName.trim()}
              className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold bg-gradient-to-r from-kku-green to-emerald-700 hover:from-kku-green/90 hover:to-emerald-700/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin h-6 w-6 border-3 border-white border-t-kku-gold rounded-full"></div>
                  <span>{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>
                    {language === 'ar' ? 'أوافق وأتعهد - الانتقال للدخول' : 'I Agree - Go to Login'}
                  </span>
                  <ArrowRight className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
              <p className="text-center text-sm sm:text-base text-blue-900 dark:text-blue-100 flex items-center justify-center gap-2 flex-wrap">
                <Lock className="w-5 h-5 flex-shrink-0" />
                <span>
                  {language === 'ar' 
                    ? 'جميع البيانات محمية ومشفرة وفقاً لمعايير الأمان العالمية'
                    : 'All data is protected and encrypted according to international security standards'}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #184A2C, #10B981);
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #10B981, #184A2C);
        }
      `}</style>
    </div>
  );
};
