import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GraduationCap, Lock, User, Eye, EyeOff, Mail, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const LoginPage: React.FC = () => {
  const { language, t, setCurrentPage, setIsLoggedIn, setUserInfo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email || !password) {
        toast.error(
          language === 'ar' 
            ? 'يرجى إدخال الرقم الجامعي/الوظيفي وكلمة المرور' 
            : 'Please enter ID and password'
        );
        setLoading(false);
        return;
      }

      console.log('🔐 محاولة تسجيل الدخول:', email);

      // تسجيل الدخول عبر Backend (SQL Database)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            identifier: email, // يمكن أن يكون رقم جامعي أو إيميل
            password,
            language, // ✅ إرسال اللغة للحصول على رسالة خطأ مناسبة
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Login error:', result.error);
        
        // التعامل مع حالة المستخدم اليتيم
        if (result.code === 'ORPHANED_ACCOUNT') {
          toast.error(
            language === 'ar' 
              ? '⚠️ حسابك غير مكتمل' 
              : '⚠️ Incomplete Account',
            {
              description: language === 'ar'
                ? 'جاري تنظيف الحساب... يرجى الانتظار ثم المحاولة مرة أخرى'
                : 'Cleaning up account... Please wait and try again',
              duration: 6000,
            }
          );
          
          // تنظيف المستخدم اليتيم تلقائياً
          setTimeout(async () => {
            try {
              const cleanupResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/public/cleanup-orphaned-user`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${publicAnonKey}`,
                  },
                  body: JSON.stringify({ email }),
                }
              );
              
              const cleanupResult = await cleanupResponse.json();
              
              if (cleanupResult.success && cleanupResult.cleaned) {
                toast.success(
                  language === 'ar'
                    ? '✅ تم تنظيف الحساب بنجاح! يمكنك الآن التسجيل من جديد'
                    : '✅ Account cleaned! You can now register again',
                  { duration: 5000 }
                );
              }
            } catch (error) {
              console.error('Failed to cleanup orphaned user:', error);
            }
          }, 2000);
          
          setLoading(false);
          return;
        }
        
        // عرض رسالة الخطأ مع النصيحة
        const errorMessage = language === 'ar' 
          ? result.error || '❌ بيانات الدخول غير صحيحة' 
          : result.error_en || '❌ Invalid login credentials';
        
        const hintMessage = result.hint || result.hint_en || (
          language === 'ar' 
            ? '💡 تأكد من:\n✓ البريد الإلكتروني صحيح\n✓ كلمة المرور صحيحة\n✓ أنك سجلت حساباً من قبل\n\n📌 إذا لم تسجل بعد، اضغط على "إنشاء حساب جديد" في الأسفل'
            : '💡 Make sure:\n✓ Email is correct\n✓ Password is correct\n✓ You have registered before\n\n📌 If not registered yet, click "Create New Account" below'
        );
        
        toast.error(errorMessage, {
          description: hintMessage,
          duration: 8000, // ⬆️ زيادة المدة لقراءة النصائح
          action: {
            label: language === 'ar' ? '📝 إنشاء حساب جديد' : '📝 Create New Account',
            onClick: () => setCurrentPage('signup'),
          },
        });
        
        setLoading(false);
        return;
      }

      // ✅ التحقق من بيانات الطالب فقط إذا كان الدور "student"
      if (result.user.role === 'student') {
        if (!result.user.students || result.user.students.length === 0) {
          console.error('❌ Student data is missing from database');
          toast.error(
            language === 'ar'
              ? '⚠️ حسابك غير مكتمل - بيانات الطالب مفقودة'
              : '⚠️ Incomplete Account - Student data missing',
            { 
              description: language === 'ar' 
                ? 'يرجى التواصل مع الدعم الفني أو إعادة التسجيل' 
                : 'Please contact support or register again',
              duration: 7000,
            }
          );
          setLoading(false);
          return;
        }
        
        // ✅ التحقق من أن بيانات الطالب صحيحة
        const studentData = result.user.students[0];
        if (!studentData.major || studentData.level === null || studentData.level === undefined) {
          console.error('❌ Student data is incomplete:', studentData);
          toast.error(
            language === 'ar'
              ? '⚠️ بيانات حسابك غير مكتملة (التخصص أو المستوى مفقود)'
              : '⚠️ Your account data is incomplete (major or level missing)',
            {
              description: language === 'ar'
                ? 'يرجى إعادة التسجيل بحساب جديد أو التواصل مع الدعم الفني'
                : 'Please register again or contact support',
              duration: 8000,
              action: {
                label: language === 'ar' ? 'التسجيل من جديد' : 'Register Again',
                onClick: () => {
                  // حذف الحساب القديم وتحويل للتسجيل
                  setCurrentPage('cleanup');
                },
              },
            }
          );
          setLoading(false);
          return;
        }
      }

      // ✅ حفظ بيانات المستخدم من SQL Database - بدون قيم افتراضية خاطئة
      const studentData = result.user.students?.[0];
      
      // ✅ استخدام البيانات الفعلية من SQL بدون قيم افتراضية للطلاب
      const userInfo = {
        name: result.user.name,
        id: result.user.student_id,
        user_db_id: result.user.id, // ✅ إضافة ID من جدول users
        email: result.user.email,
        // ✅ استخدام البيانات من SQL مباشرة - لا قيم افتراضية
        major: studentData?.major || null,
        level: studentData?.level !== undefined ? studentData.level : null,
        gpa: studentData?.gpa !== undefined ? studentData.gpa : 0,
        total_credits: studentData?.total_credits || 0,
        completed_credits: studentData?.completed_credits || 0,
        role: result.user.role || 'student',
        access_token: result.access_token,
      };
      
      // ✅ تحديث Context و localStorage معاً
      setUserInfo(userInfo);
      setIsLoggedIn(true);
      
      // حفظ في localStorage
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('isLoggedIn', 'true'); // ✅ إضافة flag واضح
      
      toast.success(
        language === 'ar' 
          ? `🎉 مرحباً ${result.user.name}!` 
          : `🎉 Welcome ${result.user.name}!`
      );

      // التحويل التلقائي حسب الدور
      setTimeout(() => {
        const redirectPage = localStorage.getItem('redirectAfterLogin');
        
        if (redirectPage) {
          // إذا كان هناك صفحة مطلوبة
          localStorage.removeItem('redirectAfterLogin');
          setCurrentPage(redirectPage);
        } else {
          // التحويل التلقائي حسب الدور
          if (userInfo.role === 'supervisor') {
            setCurrentPage('supervisorDashboard');
            toast.info(
              language === 'ar' 
                ? '📊 تم تحويلك إلى لوحة المشرف' 
                : '📊 Redirected to Supervisor Dashboard'
            );
          } else if (userInfo.role === 'admin') {
            setCurrentPage('adminDashboard');
            toast.info(
              language === 'ar' 
                ? '⚙️ مرحباً بك في لوحة الإدارة' 
                : '⚙️ Welcome to Admin Dashboard'
            );
          } else {
            // الطالب يذهب للصفحة الرئيسية أو لوحة التحكم
            setCurrentPage('studentDashboard');
          }
        }
      }, 500);
    } catch (error: any) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      toast.error(
        language === 'ar' 
          ? 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى' 
          : 'An error occurred during login. Please try again'
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-[calc(100vh-200px)] relative overflow-hidden -mt-8 -mx-4 px-4">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1723746571161-e45723f5db33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbG9naW4lMjBlZHVjYXRpb258ZW58MXx8fHwxNzYyOTc4MzE1fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Login"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-kku-green/95 via-emerald-700/95 to-teal-700/95"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-200px)] py-16">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8 text-white">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full animate-pulse">
                <GraduationCap className="h-20 w-20" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
              {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
            </h1>
            
            <p className="text-xl opacity-90 mb-2">
              {language === 'ar' ? 'نظام تسجيل المقررات' : 'Course Registration System'}
            </p>
            
            <p className="text-sm opacity-75">
              {language === 'ar' ? 'كلية إدارة الأعمال - قسم نظم المعلومات الإدارية' : 'College of Business - MIS Department'}
            </p>
          </div>

          {/* Login Card */}
          <Card className="p-8 shadow-2xl hover-lift animate-scale-in backdrop-blur-sm bg-background/95">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-kku-green dark:text-primary mb-2">
                  {t('login')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'سجل الدخول باستخدام بريدك الجامعي' 
                    : 'Login with your university email'}
                </p>
                
                {/* ✅ رسالة توضيحية جديدة */}
                <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {language === 'ar' 
                      ? '💡 لم تسجل حساباً بعد؟ اضغط "إنشاء حساب جديد" في الأسفل' 
                      : '💡 Haven\'t registered yet? Click "Create New Account" below'}
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-kku-green dark:text-primary" />
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={language === 'ar' ? 'example@kku.edu.sa' : 'example@kku.edu.sa'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-lg"
                  required
                />
                {/* ✅ ملاحظة توضيحية */}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <span>ℹ️</span>
                  <span>
                    {language === 'ar' 
                      ? 'استخدم نفس البريد الذي سجلت به' 
                      : 'Use the same email you registered with'}
                  </span>
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-kku-green dark:text-primary" />
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={language === 'ar' ? '••••••••' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-lg pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {/* ✅ ملاحظة توضيحية */}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <span>ℹ️</span>
                  <span>
                    {language === 'ar' 
                      ? 'استخدم نفس كلمة المرور التي سجلت بها' 
                      : 'Use the same password you registered with'}
                  </span>
                </p>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'تذكرني' : 'Remember me'}
                  </span>
                </label>
                <button
                  type="button"
                  className="text-kku-green dark:text-primary hover:underline"
                >
                  {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 text-lg bg-gradient-to-r from-kku-green to-kku-green/90 hover:from-kku-green/90 hover:to-kku-green dark:from-primary dark:to-primary/90 btn-shine"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner h-5 w-5" />
                    {language === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...'}
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {t('login')}
                  </span>
                )}
              </Button>

            </form>

            {/* Additional Links */}
            <div className="mt-6 pt-6 border-t border-border text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'طالب جديد؟' 
                  : 'New student?'}
                {' '}
                <button
                  type="button"
                  onClick={() => setCurrentPage('signup')}
                  className="text-kku-green dark:text-primary hover:underline font-medium"
                >
                  {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' 
                  ? 'بتسجيل الدخول، فإنك توافق على شروط الاستخدام وسياسة الخصوصية' 
                  : 'By logging in, you agree to the Terms of Service and Privacy Policy'}
              </p>
            </div>
          </Card>

          {/* Help Section */}
          <div className="mt-6 text-center text-sm space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'تواجه مشكلة في تسجيل الدخول؟' 
                : 'Having trouble logging in?'}
              {' '}
              <button
                type="button"
                onClick={() => setCurrentPage('contact')}
                className="text-kku-green dark:text-primary hover:underline"
              >
                {language === 'ar' ? 'اتصل بالدعم الفني' : 'Contact Support'}
              </button>
            </p>
            <p className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-2 inline-block">
              {language === 'ar' 
                ? '⚠️ مشكلة في التسجيل؟ ' 
                : '⚠️ Registration issue? '}
              <button
                type="button"
                onClick={() => setCurrentPage('cleanup')}
                className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
              >
                {language === 'ar' ? 'جرب أداة التنظيف' : 'Try Cleanup Tool'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
