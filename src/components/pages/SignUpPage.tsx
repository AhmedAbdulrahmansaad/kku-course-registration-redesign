import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Mail, 
  UserPlus,
  IdCard,
  BookOpen,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export const SignUpPage: React.FC = () => {
  const { language, setLanguage, theme, setTheme, t, setCurrentPage } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
    gpa: '',
    major: '',
    level: '',
    role: 'student',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    return email.endsWith('@kku.edu.sa');
  };

  const validateStudentId = (id: string): boolean => {
    return /^\d{9}$/.test(id); // 9 digits
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = language === 'ar' ? 'الاسم الكامل مطلوب' : 'Full name is required';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = language === 'ar' ? 'الرقم الجامعي مطلوب' : 'Student ID is required';
    } else if (!validateStudentId(formData.studentId)) {
      newErrors.studentId = language === 'ar' ? 'الرقم الجامعي يجب أن يكون 9 أرقام' : 'Student ID must be 9 digits';
    }

    if (!formData.email.trim()) {
      newErrors.email = language === 'ar' ? 'البريد الجامعي مطلوب' : 'University email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = language === 'ar' ? 'يجب استخدام البريد الجامعي (@kku.edu.sa)' : 'Must use university email (@kku.edu.sa)';
    }

    if (!formData.password.trim()) {
      newErrors.password = language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = language === 'ar' ? 'كلمة المرور غير متطابقة' : 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.major) {
      newErrors.major = language === 'ar' ? 'التخصص مطلوب' : 'Major is required';
    }

    if (!formData.level) {
      newErrors.level = language === 'ar' ? 'المستوى الدراسي مطلوب' : 'Academic level is required';
    }

    // GPA is optional for first year students
    if (formData.gpa && (parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 5)) {
      newErrors.gpa = language === 'ar' ? 'المعدل يجب أن يكون بين 0 و 5' : 'GPA must be between 0 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    } else {
      toast.error(
        language === 'ar' 
          ? '⚠️ يرجى تصحيح الأخطاء في النموذج' 
          : ' Please fix the errors in the form'
      );
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      toast.error(
        language === 'ar' 
          ? '⚠️ يرجى تصحيح الأخطاء في النموذج' 
          : '⚠️ Please fix the errors in the form'
      );
      return;
    }

    setLoading(true);

    try {
      // Call server to create user
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            studentId: formData.studentId,
            email: formData.email,
            password: formData.password,
            gpa: formData.gpa ? parseFloat(formData.gpa) : null,
            major: formData.major,
            level: parseInt(formData.level),
            role: formData.role,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          language === 'ar' 
            ? '✅ تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول' 
            : '✅ Account created successfully! You can now login'
        );
        
        setTimeout(() => {
          setCurrentPage('login');
        }, 2000);
      } else {
        throw new Error(result.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // معالجة أخطاء محددة
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('Student ID already registered')) {
        toast.error(
          language === 'ar' 
            ? '⚠️ الرقم الجامعي مسجل بالفعل! هل تريد تسجيل الدخول بدلاً من ذلك؟' 
            : '⚠️ Student ID already registered! Would you like to login instead?',
          {
            duration: 5000,
            action: {
              label: language === 'ar' ? 'تسجيل الدخول' : 'Login',
              onClick: () => setCurrentPage('login'),
            },
          }
        );
      } else if (errorMessage.includes('Email already registered')) {
        toast.error(
          language === 'ar' 
            ? '⚠️ البريد الإلكتروني مسجل بالفعل! هل تريد تسجيل الدخول؟' 
            : '⚠️ Email already registered! Would you like to login?',
          {
            duration: 5000,
            action: {
              label: language === 'ar' ? 'تسجيل الدخول' : 'Login',
              onClick: () => setCurrentPage('login'),
            },
          }
        );
      } else {
        toast.error(
          language === 'ar' 
            ? `❌ حدث خطأ أثناء إنشاء الحساب: ${errorMessage}` 
            : `❌ Error creating account: ${errorMessage}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden -mt-8 -mx-4 px-4">
      {/* خلفية رؤية 2030 مع تفتيح أفضل */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1669407938045-152068ed42e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXNpb24lMjAyMDMwJTIwc2F1ZGklMjBhcmFiaWF8ZW58MXx8fHwxNzYyOTg1Nzc5fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Vision 2030"
          className="w-full h-full object-cover opacity-30"
        />
        {/* تدرجات مفتحة للقراءة الأفضل */}
        <div className="absolute inset-0 bg-gradient-to-br from-kku-green/70 via-gray-700/60 to-emerald-800/70"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
      </div>

      {/* شعار رؤية 2030 في الزاوية */}
      <div className="absolute bottom-8 left-8 opacity-20 hover:opacity-50 transition-opacity duration-300 hidden md:block">
        <div className="flex items-center gap-3 text-white animate-fade-in">
          <TrendingUp className="h-20 w-20 text-kku-gold drop-shadow-2xl" />
          <div>
            <p className="text-3xl font-bold drop-shadow-lg" style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
              {language === 'ar' ? 'رؤية 2030' : 'Vision 2030'}
            </p>
            <p className="text-sm text-kku-gold" style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
              {language === 'ar' ? 'نحو مستقبل أفضل' : 'Towards a Better Future'}
            </p>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 md:py-16">
        <div className="w-full max-w-2xl animate-fade-up" style={{ animationDuration: '0.7s' }}>
          {/* رأس الصفحة */}
          <div className="text-center mb-8 text-white">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-md p-6 rounded-full border-2 border-kku-gold/50 shadow-2xl animate-pulse">
                <UserPlus className="h-16 w-16 text-kku-gold drop-shadow-lg" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg" style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-2" style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
              {language === 'ar' ? '🎓 جامعة الملك خالد' : '🎓 King Khalid University'}
            </p>
            
            <p className="text-sm text-kku-gold" style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
              {language === 'ar' ? 'كلية إدارة العمال - قسم نظم المعلومات الإدارية' : 'College of Business - MIS Department'}
            </p>
          </div>

          {/* بطاقة التسجيل بتصميم مركزي وخلفية زجاجية */}
          <Card className="backdrop-blur-xl bg-white/10 border-2 border-white/20 shadow-2xl rounded-3xl overflow-hidden">
            {/* شريط ذهبي للعنوان */}
            <div className="bg-gradient-to-r from-kku-gold via-yellow-500 to-kku-gold p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-kku-green" />
                  <h2 className="text-xl md:text-2xl font-bold text-kku-green" style={{ fontFamily: language === 'ar' ? 'Tajawal, sans-serif' : 'Poppins, sans-serif' }}>
                    {step === 1 
                      ? (language === 'ar' ? '📝 البيانات الأساسية' : '📝 Basic Information')
                      : (language === 'ar' ? '🎯 البيانات الأكاديمية' : '🎯 Academic Information')
                    }
                  </h2>
                </div>
                <div className="bg-kku-green/20 px-4 py-2 rounded-full border border-kku-green/30">
                  <span className="text-kku-green font-bold">{step}/2</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <form className="space-y-5 animate-fade-in">
                  <div>
                    <Label htmlFor="fullName" className="text-base font-bold flex items-center gap-2">
                      <User className="h-4 w-4 text-[#184A2C]" />
                      {language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        setErrors({ ...errors, fullName: '' });
                      }}
                      className={`mt-2 h-12 ${errors.fullName ? 'border-red-500' : 'border-2'}`}
                      placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="studentId" className="text-base font-bold flex items-center gap-2">
                      <IdCard className="h-4 w-4 text-[#184A2C]" />
                      {language === 'ar' ? 'الرقم الجامعي *' : 'Student ID *'}
                    </Label>
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      onChange={(e) => {
                        setFormData({ ...formData, studentId: e.target.value });
                        setErrors({ ...errors, studentId: '' });
                      }}
                      className={`mt-2 h-12 ${errors.studentId ? 'border-red-500' : 'border-2'}`}
                      placeholder={language === 'ar' ? '9 أرقام (مثال: 442012345)' : '9 digits (e.g., 442012345)'}
                      maxLength={9}
                    />
                    {errors.studentId && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.studentId}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base font-bold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#184A2C]" />
                      {language === 'ar' ? 'البريد الجامعي الرسمي *' : 'University Email *'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setErrors({ ...errors, email: '' });
                      }}
                      className={`mt-2 h-12 ${errors.email ? 'border-red-500' : 'border-2'}`}
                      placeholder="example@kku.edu.sa"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-base font-bold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#184A2C]" />
                      {language === 'ar' ? 'كلمة المرور *' : 'Password *'}
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setErrors({ ...errors, password: '' });
                        }}
                        className={`h-12 ${errors.password ? 'border-red-500' : 'border-2'} pr-12`}
                        placeholder={language === 'ar' ? '8 أحرف على الأقل' : 'At least 8 characters'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-base font-bold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#184A2C]" />
                      {language === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        setErrors({ ...errors, confirmPassword: '' });
                      }}
                      className={`mt-2 h-12 ${errors.confirmPassword ? 'border-red-500' : 'border-2'}`}
                      placeholder={language === 'ar' ? 'أعد إدخال كلمة لمرور' : 'Re-enter password'}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleNext}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#184A2C] to-emerald-700 hover:from-[#184A2C]/90 hover:to-emerald-700/90 shadow-xl"
                  >
                    {language === 'ar' ? 'التالي ⬅️' : 'Next ➡️'}
                  </Button>
                </form>
              )}

              {/* Step 2: Academic Information */}
              {step === 2 && (
                <form onSubmit={handleSignUp} className="space-y-5 animate-fade-in">
                  <div>
                    <Label htmlFor="major" className="text-base font-bold flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#184A2C]" />
                      {language === 'ar' ? 'التخصص *' : 'Major *'}
                    </Label>
                    <Select value={formData.major} onValueChange={(value) => {
                      setFormData({ ...formData, major: value });
                      setErrors({ ...errors, major: '' });
                    }}>
                      <SelectTrigger className={`mt-2 h-12 ${errors.major ? 'border-red-500' : 'border-2'}`}>
                        <SelectValue placeholder={language === 'ar' ? 'اختر التخصص' : 'Select Major'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Management Information Systems">
                          {language === 'ar' ? '🎯 نظم المعلومات الإدارية' : '🎯 Management Information Systems'}
                        </SelectItem>
                        <SelectItem value="Business Administration">
                          {language === 'ar' ? '💼 إدارة الأعمال' : '💼 Business Administration'}
                        </SelectItem>
                        <SelectItem value="Accounting">
                          {language === 'ar' ? '📊 المحاسبة' : '📊 Accounting'}
                        </SelectItem>
                        <SelectItem value="Marketing">
                          {language === 'ar' ? '📈 التسويق' : '📈 Marketing'}
                        </SelectItem>
                        <SelectItem value="Finance">
                          {language === 'ar' ? '💰 المالية' : '💰 Finance'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.major && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.major}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="level" className="text-base font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#184A2C]" />
                      {language === 'ar' ? 'المستوى الدراسي *' : 'Academic Level *'}
                    </Label>
                    <Select value={formData.level} onValueChange={(value) => {
                      setFormData({ ...formData, level: value });
                      setErrors({ ...errors, level: '' });
                    }}>
                      <SelectTrigger className={`mt-2 h-12 ${errors.level ? 'border-red-500' : 'border-2'}`}>
                        <SelectValue placeholder={language === 'ar' ? 'اختر المستوى' : 'Select Level'} />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.level && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.level}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gpa" className="text-base font-bold flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#D4AF37]" />
                      {language === 'ar' ? 'المعدل التراكمي (اختياري)' : 'GPA (Optional)'}
                    </Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.gpa}
                      onChange={(e) => {
                        setFormData({ ...formData, gpa: e.target.value });
                        setErrors({ ...errors, gpa: '' });
                      }}
                      className={`mt-2 h-12 ${errors.gpa ? 'border-red-500' : 'border-2'}`}
                      placeholder={language === 'ar' ? 'اتركه فارغاً إذا كنت في السنة الأولى' : 'Leave empty if first year'}
                    />
                    {errors.gpa && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.gpa}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'ar' 
                        ? '💡 سيتم حساب المعدل تلقائياً بعد نهاية كل فصل' 
                        : '💡 GPA will be calculated automatically after each semester'}
                    </p>
                  </div>

                  {/* حقل الدور */}
                  <div className="bg-kku-gold/10 border-2 border-kku-gold/30 rounded-xl p-4">
                    <Label htmlFor="role" className="text-base font-bold flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-[#D4AF37]" />
                      {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
                    </Label>
                    <Select value={formData.role} onValueChange={(value) => {
                      setFormData({ ...formData, role: value });
                    }}>
                      <SelectTrigger className="h-12 border-2 bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          {language === 'ar' ? '👨‍🎓 طالب (Student)' : '👨‍🎓 Student'}
                        </SelectItem>
                        <SelectItem value="supervisor">
                          {language === 'ar' ? '👔 مشرف أكاديمي (Supervisor)' : '👔 Academic Supervisor'}
                        </SelectItem>
                        <SelectItem value="admin">
                          {language === 'ar' ? '⚙️ مدير النظام (Admin)' : '⚙️ System Admin'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.role === 'student' ? (
                        language === 'ar' 
                          ? '📚 يمكنك تسجيل المقررات وعرض الجدول والسجل الأكاديمي' 
                          : '📚 You can register courses and view schedule and transcript'
                      ) : formData.role === 'supervisor' ? (
                        language === 'ar' 
                          ? '✅ يمكنك الموافقة على طلبات التسجيل وعرض بيانات الطلاب' 
                          : '✅ You can approve registration requests and view student data'
                      ) : (
                        language === 'ar' 
                          ? '⚙️ لديك صلاحيات كاملة لإدارة النظام' 
                          : '⚙️ You have full system administration privileges'
                      )}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1 h-14 text-lg font-bold border-2"
                    >
                      {language === 'ar' ? '⬅️ السابق' : '⬅️ Previous'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-[#184A2C] to-emerald-700 hover:from-[#184A2C]/90 hover:to-emerald-700/90 shadow-xl"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="spinner h-5 w-5" />
                          {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
                        </div>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          {language === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};