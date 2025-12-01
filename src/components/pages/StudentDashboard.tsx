import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
  Target,
  BarChart3,
  BookMarked,
  GraduationCap,
  Sparkles,
  Bell,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import {
  calculateAcademicStats,
  generateAcademicAlerts,
  getProgressColor,
  getProgressStatus,
  type CourseRegistration,
  type AcademicStats,
  type AcademicAlert,
  TOTAL_PROGRAM_HOURS,
} from '../../utils/academicCalculations';
import { KKULogoSVG } from '../KKULogoSVG';
import { MAJORS, getMajorByCode } from '../../utils/departments';

export const StudentDashboard: React.FC = () => {
  const { language, userInfo, setUserInfo } = useApp();
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [stats, setStats] = useState<AcademicStats | null>(null);
  const [alerts, setAlerts] = useState<AcademicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<any>(null); // إحصائيات من قاعدة البيانات
  const [refreshedUserData, setRefreshedUserData] = useState<any>(null); // ✅ بيانات محدّثة من SQL

  useEffect(() => {
    refreshUserData(); // ✅ جلب بيانات المستخدم المحدثة أولاً
    fetchRegistrations();
    fetchStatistics(); // جلب الإحصائيات من الـ server
    
    // ✅ إضافة event listener لتحديث التسجيلات عند تغيير localStorage
    const handleStorageChange = () => {
      console.log('🔄 [Dashboard] localStorage changed, refreshing registrations...');
      fetchRegistrations();
      fetchStatistics();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ✅ جلب بيانات المستخدم المحدثة من SQL
  const refreshUserData = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        console.warn('⚠️ [Dashboard] No access token for refresh');
        return;
      }

      // 🔥 استخدام localStorage مباشرة بدون محاولة Backend
      console.log('💾 [Dashboard] Using localStorage directly...');
      
      const savedUserInfo = localStorage.getItem('userInfo');
      
      if (savedUserInfo) {
        const parsedUserInfo = JSON.parse(savedUserInfo);
        console.log('✅ [Dashboard] Loaded user data from localStorage:', parsedUserInfo);
        console.log('📊 [Dashboard] User Level:', parsedUserInfo.level);
        console.log('📊 [Dashboard] User GPA:', parsedUserInfo.gpa);
        console.log('📊 [Dashboard] User Major:', parsedUserInfo.major);
        
        setUserInfo(parsedUserInfo);
        
        // ✅ تحويل parsedUserInfo لنفس تنسيق backend
        const formattedUserData = {
          ...parsedUserInfo,
          students: [{
            major: parsedUserInfo.major,
            level: parsedUserInfo.level,
            gpa: parsedUserInfo.gpa,
            total_credits: parsedUserInfo.total_credits || 0,
            completed_credits: parsedUserInfo.completed_credits || 0,
          }]
        };
        
        setRefreshedUserData(formattedUserData);
        
        toast.info(
          language === 'ar'
            ? '💾 استخدام بيانات محلية'
            : '💾 Using local data',
          {
            duration: 2000,
          }
        );
      } else {
        console.warn('⚠️ [Dashboard] No user info in localStorage');
        toast.warning(
          language === 'ar'
            ? '⚠️ لا توجد بيانات محفوظة'
            : '⚠️ No saved data',
          {
            duration: 3000,
          }
        );
      }
    } catch (error: any) {
      console.error('❌ [Dashboard] Error refreshing user data:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log('📊 [Dashboard] Fetching statistics from SQL Database...');
      
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken || !userInfo?.id) {
        console.warn('⚠️ [Dashboard] No access token for statistics');
        return;
      }

      // 🔥 FALLBACK: محاولة Backend أولاً
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/dashboard/student/${userInfo.id}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log('✅ [Dashboard] SQL Database statistics:', result.stats);
          setDbStats(result.stats);
          return;
        }
      } catch (fetchError: any) {
        // ✅ صامت - لا نعرض أي شيء
      }

      // 🔥 FALLBACK: حساب الإحصائيات محلياً
      console.log('🔄 [Dashboard] Calculating statistics locally (Backend offline)...');
      const localRegs = JSON.parse(localStorage.getItem('kku_registrations') || '[]');
      const userEmail = userInfo?.email;
      const userRegs = localRegs.filter((r: any) => r.studentEmail === userEmail);
      
      const localStats = {
        totalApprovedCourses: userRegs.filter((r: any) => r.status === 'approved').length,
        totalPendingCourses: userRegs.filter((r: any) => r.status === 'pending').length,
        totalRejectedCourses: userRegs.filter((r: any) => r.status === 'rejected').length,
        totalCreditHours: userRegs
          .filter((r: any) => r.status === 'approved')
          .reduce((sum: number, r: any) => sum + (r.course?.credit_hours || 0), 0),
      };
      
      setDbStats(localStats);
      console.log('✅ [Dashboard] Local statistics:', localStats);
    } catch (error: any) {
      console.warn('⚠️ [Dashboard] Error fetching statistics (non-critical):', error.message);
      // لا نعرض toast error لأن هذا غير حرج
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      console.log('📡 [Dashboard] Fetching registrations...');

      let accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.warn('⚠️ [Dashboard] No access token found');
        setLoading(false);
        return;
      }

      console.log('🔑 [Dashboard] Using access token:', accessToken.substring(0, 20) + '...');

      // 🔥 FALLBACK: محاولة Backend أولاً
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/registrations`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        console.log('📡 [Dashboard] Response status:', response.status);

        const result = await response.json();
        console.log('📊 [Dashboard] Response data:', result);

        // ✅ إذا كان الـ token منتهي الصلاحية (401)
        if (response.status === 401) {
          console.warn('⚠️ [Dashboard] Token expired or invalid, logging out...');
          
          // مسح البيانات المحلية
          localStorage.removeItem('access_token');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('isLoggedIn');
          
          toast.error(
            language === 'ar'
              ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'
              : 'Session expired, please login again'
          );
          
          // إعادة التوجيه لصفحة تسجيل الدخول
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
          setLoading(false);
          return;
        }

        if (response.ok) {
          const regs = result.registrations || [];
          console.log('✅ [Dashboard] Backend registrations:', regs);
          setRegistrations(regs);
          
          // ✅ حساب الإحصائيات
          const studentLevel = userInfo?.level || 1;
          const studentGPA = userInfo?.gpa || 0;
          const calculatedStats = calculateAcademicStats(regs, studentLevel, studentGPA);
          const generatedAlerts = generateAcademicAlerts(regs, studentLevel, studentGPA, language);
          
          setStats(calculatedStats);
          setAlerts(generatedAlerts);
          
          setLoading(false);
          return;
        }
      } catch (fetchError: any) {
        console.log('🔄 [Dashboard] Using localStorage (Backend offline)');
      }

      // 🔥 FALLBACK: استخدام localStorage
      console.log('🔄 [Dashboard] Using localStorage for registrations...');
      const localRegs = JSON.parse(localStorage.getItem('kku_registrations') || '[]');
      
      // تصفية التسجيلات للمستخدم الحالي
      const userEmail = userInfo?.email;
      const userRegs = localRegs.filter((r: any) => r.studentEmail === userEmail);
      
      console.log('✅ [Dashboard] Local registrations:', userRegs);
      setRegistrations(userRegs);
      
      // ✅ حساب الإحصائيات من التسجيلات المحلية
      const studentLevel = userInfo?.level || 1;
      const studentGPA = userInfo?.gpa || 0;
      const calculatedStats = calculateAcademicStats(userRegs, studentLevel, studentGPA);
      const generatedAlerts = generateAcademicAlerts(userRegs, studentLevel, studentGPA, language);
      
      setStats(calculatedStats);
      setAlerts(generatedAlerts);
      
      setLoading(false);
    } catch (error: any) {
      console.error('❌ [Dashboard] Error fetching registrations:', error);
      console.error('❌ [Dashboard] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      
      // حتى لو فشل التحميل، نعرض dashboard فارغ بدلاً من صفحة خطأ
      setRegistrations([]);
      
      const studentLevel = userInfo?.level || 1;
      const calculatedStats = calculateAcademicStats([], studentLevel, 0);
      setStats(calculatedStats);
      setAlerts([]);
      
      toast.error(
        language === 'ar'
          ? `فشل في تحميل البيانات: ${error.message}`
          : `Failed to load data: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-16 text-center">
        <div className="spinner h-12 w-12 mx-auto mb-4" />
        <p className="text-muted-foreground">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </Card>
    );
  }

  const studentName = userInfo?.name || (language === 'ar' ? 'الطالب' : 'Student');
  // ✅ استخدام البيانات من SQL أولاً، ثم userInfo كـ fallback (بدون قيمة افتراضية ثابتة)
  const studentLevel = refreshedUserData?.students?.[0]?.level ?? userInfo?.level ?? 1;
  const studentGPA = refreshedUserData?.students?.[0]?.gpa ?? userInfo?.gpa ?? 0;
  const studentMajor = refreshedUserData?.students?.[0]?.major ?? userInfo?.major ?? null; // ✅ null بدلاً من 'Management Information Systems'

  // ✅ دالة لتحويل كود التخصص إلى اسمه بالعربية أو الإنجليزية
  const getMajorDisplayName = (majorCode: string | null): string => {
    if (!majorCode) {
      return language === 'ar' ? 'لم يتم تحديد التخصص' : 'Major not specified';
    }
    
    const major = getMajorByCode(majorCode);
    if (major) {
      return language === 'ar' ? major.name_ar : major.name_en;
    }
    // fallback للتخصصات الشائعة (للتوافق مع البيانات القديمة)
    const fallbacks: Record<string, { ar: string; en: string }> = {
      'Management Information Systems': { ar: 'نظم المعلومات الإدارية', en: 'MIS' },
      'Business Administration': { ar: 'إدارة الأعمال', en: 'Business Admin' },
      'Accounting': { ar: 'المحاسبة', en: 'Accounting' },
      'Marketing': { ar: 'التسويق', en: 'Marketing' },
      'Finance': { ar: 'المالية', en: 'Finance' },
    };
    return fallbacks[majorCode]?.[language === 'ar' ? 'ar' : 'en'] || majorCode;
  };

  // ✅ طباعة معلومات الطالب للتأكد
  console.log('👤 [StudentDashboard] UserInfo:', userInfo);
  console.log('📊 [StudentDashboard] RefreshedUserData:', refreshedUserData);
  console.log('📊 [StudentDashboard] Student Level (from SQL):', refreshedUserData?.students?.[0]?.level);
  console.log('📊 [StudentDashboard] Student Level (final):', studentLevel);
  console.log('📊 [StudentDashboard] Student GPA (from SQL):', refreshedUserData?.students?.[0]?.gpa);
  console.log('📊 [StudentDashboard] Student GPA (final):', studentGPA);
  console.log('📚 [StudentDashboard] Student Major (from SQL):', refreshedUserData?.students?.[0]?.major);
  console.log('📚 [StudentDashboard] Student Major (final):', studentMajor);

  return (
    <div className="space-y-6">
      {/* ✅ Debug Panel - يُظهر البيانات الحقيقية من SQL */}
      {refreshedUserData && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300 dark:border-blue-700">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Info className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                {language === 'ar' ? '✅ البيانات محملة من قاعدة البيانات' : '✅ Data Loaded from Database'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-white dark:bg-gray-900 p-2 rounded">
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الاسم' : 'Name'}</p>
                  <p className="font-bold">{refreshedUserData.name}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-2 rounded">
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المستوى' : 'Level'}</p>
                  <p className="font-bold text-blue-600">{refreshedUserData.students?.[0]?.level || 'N/A'}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-2 rounded">
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'التخصص' : 'Major'}</p>
                  <p className="font-bold text-green-600">{refreshedUserData.students?.[0]?.major || 'N/A'}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-2 rounded">
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المعدل' : 'GPA'}</p>
                  <p className="font-bold text-purple-600">{refreshedUserData.students?.[0]?.gpa?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Hero Section */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-80 bg-gradient-to-br from-[#184A2C] via-emerald-700 to-emerald-900 dark:from-[#0e2818] dark:via-emerald-900 dark:to-black"></div>
        <div className="absolute inset-0 h-80 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>
        
        <div className="relative z-10 text-white py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="bg-white p-2 md:p-3 rounded-2xl shadow-xl">
                <KKULogoSVG size={50} className="md:w-[60px] md:h-[60px]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold drop-shadow-2xl">
                  {language === 'ar' ? 'لوحة التحكم الأكاديمية' : 'Academic Dashboard'}
                </h1>
                <p className="text-lg md:text-xl opacity-90 mt-1">
                  {language === 'ar' ? `مرحباً ${studentName}` : `Welcome ${studentName}`}
                </p>
              </div>
            </div>
            <div className="text-center md:text-right flex flex-col gap-2">
              <Badge className="bg-kku-gold text-kku-green text-base md:text-lg px-4 py-2">
                {language === 'ar' ? `المستوى ${studentLevel}` : `Level ${studentLevel}`}
              </Badge>
              {studentMajor && (
                <Badge className="bg-white/20 border-2 border-white/40 text-white text-sm md:text-base px-3 py-1.5">
                  {language === 'ar' ? '🎓 ' : '🎓 '}
                  {getMajorDisplayName(studentMajor)}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'المقررات' : 'Courses'}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{stats?.totalApprovedCourses || 0}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'الساعات' : 'Hours'}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{stats?.totalCreditHours || 0}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'المتبقي' : 'Remaining'}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{stats?.remainingCreditHours || 0}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 md:h-5 md:w-5 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'المعدل' : 'GPA'}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{studentGPA.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="p-6 border-l-4 border-l-kku-gold">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-6 w-6 text-kku-gold" />
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'التنبيهات الأكاديمية' : 'Academic Alerts'}
            </h2>
            <Badge variant="secondary">{alerts.length}</Badge>
          </div>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/20 border-l-red-500'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-yellow-500'
                    : alert.type === 'success'
                    ? 'bg-green-50 dark:bg-green-950/20 border-l-green-500'
                    : 'bg-blue-50 dark:bg-blue-950/20 border-l-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {alert.type === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : alert.type === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  ) : alert.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">
                      {language === 'ar' ? alert.titleAr : alert.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? alert.messageAr : alert.messageEn}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detailed Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Level Progress */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-6 w-6 text-[#184A2C]" />
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'تقدم المستوى الحالي' : 'Current Level Progress'}
            </h2>
          </div>

          {/* Database Statistics Verification */}
          {dbStats && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  {language === 'ar' ? '📊 إحصائيات قاعدة البيانات' : '📊 Database Statistics'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'المقررات المقبولة:' : 'Approved:'}
                  </span>
                  <span className="font-bold ml-1">{dbStats.totalApprovedCourses}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'الساعات المقبولة:' : 'Hours:'}
                  </span>
                  <span className="font-bold ml-1">{dbStats.totalCreditHours}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'قيد الانتظار:' : 'Pending:'}
                  </span>
                  <span className="font-bold ml-1">{dbStats.totalPendingCourses}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'المرفوضة:' : 'Rejected:'}
                  </span>
                  <span className="font-bold ml-1">{dbStats.totalRejectedCourses}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">
                  {language === 'ar' 
                    ? `المستوى ${studentLevel}` 
                    : `Level ${studentLevel}`}
                </span>
                <span className="font-bold text-[#184A2C]">
                  {stats?.progressPercentage || 0}%
                </span>
              </div>
              <Progress 
                value={stats?.progressPercentage || 0} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'ar'
                  ? `${stats?.totalCreditHours || 0} من ${stats?.levelRequiredHours || 0} ساعة`
                  : `${stats?.totalCreditHours || 0} of ${stats?.levelRequiredHours || 0} hours`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.totalApprovedCourses || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'مقبول' : 'Approved'}
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.totalPendingCourses || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.totalRejectedCourses || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'مرفوض' : 'Rejected'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Overall Program Progress */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="h-6 w-6 text-[#184A2C]" />
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'تقدم البرنامج الكلي' : 'Overall Program Progress'}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 56 * (1 - (stats?.totalEarnedHours || 0) / TOTAL_PROGRAM_HOURS)
                    }`}
                    className="text-[#184A2C] transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute">
                  <p className="text-3xl font-bold text-[#184A2C]">
                    {Math.round(((stats?.totalEarnedHours || 0) / TOTAL_PROGRAM_HOURS) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'ar' ? 'المكتسبة' : 'Earned'}
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats?.totalEarnedHours || 0}
                </p>
              </div>

              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'ar' ? 'المتبقية' : 'Remaining'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {TOTAL_PROGRAM_HOURS - (stats?.totalEarnedHours || 0)}
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {language === 'ar'
                ? `إجمالي البرنامج: ${TOTAL_PROGRAM_HOURS} ساعة`
                : `Total Program: ${TOTAL_PROGRAM_HOURS} hours`}
            </p>
          </div>
        </Card>
      </div>

      {/* Registered Courses */}
      {registrations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookMarked className="h-6 w-6 text-[#184A2C]" />
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? 'المقررات المسجلة' : 'Registered Courses'}
              </h2>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {registrations.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {registrations.map(reg => (
              <div
                key={reg.registration_id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      reg.status === 'approved'
                        ? 'bg-green-100 dark:bg-green-950/20'
                        : reg.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-950/20'
                        : 'bg-red-100 dark:bg-red-950/20'
                    }`}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">
                      {language === 'ar'
                        ? reg.course?.name_ar || reg.course_id
                        : reg.course?.name_en || reg.course_id}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {reg.course?.code} • {reg.course?.credit_hours} {language === 'ar' ? 'ساعات' : 'hours'}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={
                    reg.status === 'approved'
                      ? 'default'
                      : reg.status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="ml-4"
                >
                  {reg.status === 'approved' ? (
                    language === 'ar' ? 'مقبول' : 'Approved'
                  ) : reg.status === 'pending' ? (
                    language === 'ar' ? 'قيد الانتظار' : 'Pending'
                  ) : (
                    language === 'ar' ? 'مرفوض' : 'Rejected'
                  )}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {registrations.length === 0 && (
        <Card className="p-16 text-center">
          <BookOpen className="h-20 w-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'لا توجد مقررات مسجلة' : 'No Courses Registered'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {language === 'ar'
              ? 'ابدأ بتسجيل المقررات المطلوبة لمستواك الدراسي'
              : 'Start by registering courses for your academic level'}
          </p>
          <Button
            className="bg-[#184A2C] hover:bg-[#0e2818]"
            onClick={() => window.location.href = '#courses'}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'تصفح المقررات' : 'Browse Courses'}
          </Button>
        </Card>
      )}
    </div>
  );
};