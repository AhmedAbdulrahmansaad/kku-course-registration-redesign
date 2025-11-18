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
  FileCheck,
  GraduationCap,
  Building2,
  Award,
  ScrollText,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import backgroundImage from 'figma:asset/fbb9e9b84b4721283d9011c6c122927cd0790a04.png';

export const AccessAgreementPage: React.FC = () => {
  const { language, setLanguage, theme, setTheme, setCurrentPage, setHasAcceptedAgreement } = useApp();
  const [fullName, setFullName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const agreementTermsAr = [
    {
      icon: <Shield className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'الاستخدام الأكاديمي',
      text: 'استخدام هذا النظام للأغراض الأكاديمية فقط والمتعلقة بتسجيل المقررات الدراسية.'
    },
    {
      icon: <Lock className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'سرية البيانات',
      text: 'عدم مشاركة بيانات الدخول الخاصة بي (البريد الإلكتروني وكلمة المرور) مع أي شخص آخر.'
    },
    {
      icon: <User className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'الخصوصية',
      text: 'المحافظة على سرية المعلومات الشخصية والأكاديمية الخاصة بي وبزملائي الطلاب.'
    },
    {
      icon: <ScrollText className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'الالتزام باللوائح',
      text: 'الالتزام بالأنظمة واللوائح الأكاديمية المعمول بها في جامعة الملك خالد.'
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'عدم الوصول غير المصرح',
      text: 'عدم محاولة الوصول غير المصرح به إلى أي بيانات أو معلومات لا تخصني.'
    },
    {
      icon: <Award className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'المسؤولية الكاملة',
      text: 'تحمل المسؤولية الكاملة عن أي استخدام لحسابي الشخصي في هذا النظام.'
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'الإبلاغ الفوري',
      text: 'الإبلاغ الفوري عن أي نشاط مشبوه أو محاولة اختراق للنظام.'
    }
  ];

  const agreementTermsEn = [
    {
      icon: <Shield className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'Academic Use',
      text: 'To use this system solely for academic purposes related to course registration.'
    },
    {
      icon: <Lock className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'Data Confidentiality',
      text: 'Not to share my login credentials (email and password) with anyone else.'
    },
    {
      icon: <User className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'Privacy',
      text: 'To maintain the confidentiality of personal and academic information of myself and fellow students.'
    },
    {
      icon: <ScrollText className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'Compliance',
      text: 'To comply with all academic regulations and policies in effect at King Khalid University.'
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'No Unauthorized Access',
      text: 'Not to attempt unauthorized access to any data or information that does not belong to me.'
    },
    {
      icon: <Award className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'Full Responsibility',
      text: 'To take full responsibility for any use of my personal account in this system.'
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-kku-gold flex-shrink-0" />,
      title: 'Immediate Reporting',
      text: 'To immediately report any suspicious activity or attempted breach of the system.'
    }
  ];

  const terms = language === 'ar' ? agreementTermsAr : agreementTermsEn;

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

      // محاولة حفظ التعهد في قاعدة البيانات
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/agreements`,
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

        if (!response.ok) {
          const errorText = await response.text();
          console.warn('⚠️ Failed to save agreement in database:', errorText);
          toast.warning(
            language === 'ar'
              ? 'تم حفظ التعهد محلياً فقط'
              : 'Agreement saved locally only'
          );
        } else {
          try {
            const result = await response.json();
            console.log('✅ Agreement saved successfully in database:', result);
          } catch (jsonError) {
            console.warn('⚠️ Response saved but could not parse JSON:', jsonError);
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Database error:', dbError);
        toast.warning(
          language === 'ar'
            ? 'تم حفظ التعهد محلياً فقط'
            : 'Agreement saved locally only'
        );
      }

      // حفظ في Local Storage
      localStorage.setItem('agreementAccepted', 'true');
      localStorage.setItem('access_agreement_name', fullName);
      localStorage.setItem('access_agreement_time', timestamp);
      localStorage.setItem('access_agreement_ip', ipAddress);

      setHasAcceptedAgreement(true);

      toast.success(
        language === 'ar' 
          ? '✅ تم قبول التعهد بنجاح! جاري الانتقال لصفحة تسجيل الدخول...' 
          : '✅ Agreement accepted successfully! Redirecting to login...'
      );

      setTimeout(() => {
        setCurrentPage('login');
      }, 1500);
    } catch (error: any) {
      console.error('❌ Error in agreement process:', error);
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Images - Abha City Night View */}
      <div className="absolute inset-0 z-0">
        {/* Abha City Aerial View Background */}
        <img
          src={backgroundImage}
          alt="Abha City - King Khalid University"
          className="w-full h-full object-cover opacity-50 dark:opacity-40"
        />
        
        {/* Gradient Overlay - KKU Colors with Golden Accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-kku-green/93 via-blue-900/85 to-kku-green/93"></div>
        
        {/* Radial Gradient for depth and focus on center */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-kku-green/10 to-kku-green/50"></div>
        
        {/* Golden Light Effect to match the city lights */}
        <div className="absolute inset-0 bg-gradient-to-t from-kku-gold/5 via-transparent to-transparent"></div>
        
        {/* Animated Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0-5.523-4.477-10-10-10zm-20 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm-20 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm60 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM30 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm60 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zM10 30c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          animation: 'float 20s ease-in-out infinite'
        }}></div>

        {/* Floating lights inspired by city lights */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-kku-gold/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-kku-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 right-1/3 w-28 h-28 bg-kku-gold/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Sparkle effect for golden accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-kku-gold rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-kku-gold rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-kku-gold rounded-full animate-pulse" style={{ animationDelay: '2.1s' }}></div>
        </div>
      </div>

      {/* Language & Theme Selector */}
      <div className="absolute top-4 right-4 z-20 flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-2 rounded-xl shadow-xl border border-kku-gold/30">
          <Globe className="w-4 h-4 text-kku-gold" />
          <Button
            variant={language === 'ar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('ar')}
            className={language === 'ar' ? 'bg-kku-green hover:bg-kku-green/90 text-white h-8' : 'h-8 hover:bg-kku-green/10'}
          >
            عربي
          </Button>
          <Button
            variant={language === 'en' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'bg-kku-green hover:bg-kku-green/90 text-white h-8' : 'h-8 hover:bg-kku-green/10'}
          >
            English
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-2 rounded-xl shadow-xl border border-kku-gold/30">
          <Button
            variant={theme === 'light' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('light')}
            className={theme === 'light' ? 'bg-kku-green hover:bg-kku-green/90 text-white h-8' : 'h-8 hover:bg-kku-green/10'}
          >
            <Sun className="w-4 h-4" />
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('dark')}
            className={theme === 'dark' ? 'bg-kku-green hover:bg-kku-green/90 text-white h-8' : 'h-8 hover:bg-kku-green/10'}
          >
            <Moon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-6xl mx-auto animate-fade-in">
        <Card className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden border-4 border-kku-gold/60 hover:border-kku-gold/80 transition-all duration-500">
          {/* Header Section with KKU Branding */}
          <div className="relative bg-gradient-to-br from-kku-green via-emerald-700 to-kku-green p-8 md:p-12 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>

            {/* University Logo Placeholder */}
            <div className="relative flex items-center justify-center gap-4 mb-6">
              <div className="p-4 bg-kku-gold/20 rounded-full backdrop-blur-sm border-2 border-kku-gold/50">
                <GraduationCap className="w-16 h-16 md:w-20 md:h-20 text-kku-gold" strokeWidth={2} />
              </div>
            </div>
            
            <h1 className="relative text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
              {language === 'ar' 
                ? 'تعهد استخدام نظام التسجيل' 
                : 'System Usage Agreement'}
            </h1>
            
            <div className="relative text-center space-y-2">
              <p className="text-xl md:text-2xl text-kku-gold font-bold flex items-center justify-center gap-2 flex-wrap">
                <Building2 className="w-6 h-6" />
                {language === 'ar' 
                  ? 'جامعة الملك خالد' 
                  : 'King Khalid University'}
              </p>
              <p className="text-lg md:text-xl text-white/90">
                {language === 'ar' 
                  ? 'كلية إدارة الأعمال - قسم المعلوماتية الإدارية' 
                  : 'College of Business - MIS Department'}
              </p>
              <p className="text-base md:text-lg text-white/80 font-semibold">
                {language === 'ar' 
                  ? 'نظم المعلومات الإدارية' 
                  : 'Management Information Systems'}
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-10 lg:p-12 space-y-8">
            {/* Agreement Terms Cards */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-kku-green/10 rounded-lg">
                  <FileCheck className="w-7 h-7 text-kku-green" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {language === 'ar' ? 'بنود التعهد' : 'Agreement Terms'}
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {terms.map((term, index) => (
                  <div
                    key={index}
                    className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border-2 border-kku-green/20 hover:border-kku-green/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-gray-900 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        {term.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2 text-kku-green group-hover:text-kku-green/80 transition-colors">
                          {term.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {term.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2 text-amber-900 dark:text-amber-100">
                    {language === 'ar' ? 'علماً بأن:' : 'Please Note:'}
                  </h3>
                  <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        {language === 'ar'
                          ? 'سيتم تسجيل جميع عمليات الدخول والخروج من النظام'
                          : 'All login and logout operations will be recorded'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        {language === 'ar'
                          ? 'سيتم حفظ عنوان IP والوقت والمتصفح المستخدم لأغراض الأمان'
                          : 'IP address, time, and browser will be stored for security purposes'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        {language === 'ar'
                          ? 'أي مخالفة لهذا التعهد قد تؤدي إلى إيقاف حسابك وإحالتك للجهات المختصة'
                          : 'Any violation may result in account suspension and referral to authorities'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Full Name Input */}
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-lg font-bold flex items-center gap-2 text-foreground">
                <User className="w-5 h-5 text-kku-green" />
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسمك الكامل (ثلاثي أو رباعي)' : 'Enter your full name'}
                className={`h-14 text-lg border-3 rounded-xl transition-all duration-300 ${
                  errors.fullName 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-kku-green/30 focus:border-kku-green focus:ring-kku-green/20 hover:border-kku-green/50'
                }`}
                disabled={loading}
              />
              {errors.fullName && (
                <p className="text-red-500 text-base flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Agreement Checkbox */}
            <div>
              <div className={`flex items-start gap-4 p-6 rounded-xl border-3 transition-all duration-300 ${
                agreed 
                  ? 'bg-gradient-to-br from-kku-green/10 to-emerald-50/50 dark:from-kku-green/20 dark:to-emerald-900/30 border-kku-green/60' 
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
              }`}>
                <Checkbox
                  id="agreed"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1 h-7 w-7 border-3 border-kku-green data-[state=checked]:bg-kku-green data-[state=checked]:border-kku-green transition-all duration-300"
                  disabled={loading}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="agreed"
                    className="text-lg font-bold cursor-pointer text-foreground leading-relaxed"
                  >
                    <span className="flex items-start gap-3">
                      <CheckCircle2 className={`w-6 h-6 flex-shrink-0 mt-0.5 transition-colors duration-300 ${
                        agreed ? 'text-kku-green' : 'text-gray-400'
                      }`} />
                      <span>
                        {language === 'ar' 
                          ? 'أقر بأنني قرأت هذا التعهد وفهمت محتواه بالكامل وأوافق على الالتزام بجميع بنوده'
                          : 'I acknowledge that I have read, understood, and agree to comply with all terms of this agreement'}
                      </span>
                    </span>
                  </Label>
                  {errors.agreed && (
                    <p className="text-red-500 text-base mt-3 flex items-center gap-2 animate-shake">
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
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-kku-green via-emerald-700 to-kku-green hover:from-kku-green/90 hover:via-emerald-700/90 hover:to-kku-green/90 text-white shadow-xl hover:shadow-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl group relative overflow-hidden"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              {loading ? (
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <div className="animate-spin h-6 w-6 border-3 border-white border-t-kku-gold rounded-full"></div>
                  <span>{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <CheckCircle2 className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  <span>
                    {language === 'ar' ? 'أوافق وأتعهد - الانتقال للدخول' : 'I Agree - Go to Login'}
                  </span>
                  <ArrowRight className={`w-7 h-7 group-hover:translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <div className="p-5 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-xl">
              <p className="text-center text-base text-blue-900 dark:text-blue-100 flex items-center justify-center gap-3 flex-wrap">
                <Lock className="w-6 h-6 flex-shrink-0" />
                <span className="font-semibold">
                  {language === 'ar' 
                    ? 'جميع البيانات محمية ومشفرة وفقاً لمعايير الأمان العالمية 🔒'
                    : 'All data is protected and encrypted according to international security standards 🔒'}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

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