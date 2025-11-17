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

export const StudentDashboard: React.FC = () => {
  const { language, userInfo } = useApp();
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [stats, setStats] = useState<AcademicStats | null>(null);
  const [alerts, setAlerts] = useState<AcademicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<any>(null); // إحصائيات من قاعدة البيانات

  useEffect(() => {
    fetchRegistrations();
    fetchStatistics(); // جلب الإحصائيات من الـ server
  }, []);

  const fetchStatistics = async () => {
    try {
      console.log('📊 [Dashboard] Fetching statistics from server...');
      
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.warn('⚠️ [Dashboard] No access token for statistics');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/statistics`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Dashboard] Server statistics:', result.stats);
        setDbStats(result.stats);
      } else {
        console.error('❌ [Dashboard] Failed to fetch statistics:', response.status);
      }
    } catch (error: any) {
      console.error('❌ [Dashboard] Error fetching statistics:', error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      console.log('📚 [Dashboard] Fetching registrations...');
      
      let accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.warn('⚠️ [Dashboard] No access token found');
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login');
        setLoading(false);
        return;
      }

      console.log('🔑 [Dashboard] Using access token:', accessToken.substring(0, 20) + '...');

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
        console.log('✅ [Dashboard] Found', regs.length, 'registrations');
        setRegistrations(regs);

        // حساب الإحصائيات
        const studentLevel = userInfo?.level || 1;
        const earnedHours = userInfo?.earned_hours || 0;
        const calculatedStats = calculateAcademicStats(regs, studentLevel, earnedHours);
        setStats(calculatedStats);
        console.log('📈 [Dashboard] Stats calculated:', calculatedStats);

        // توليد التنبيهات
        const generatedAlerts = generateAcademicAlerts(calculatedStats, regs, studentLevel);
        setAlerts(generatedAlerts);
        console.log('⚠️ [Dashboard] Generated', generatedAlerts.length, 'alerts');
      } else {
        console.error('❌ [Dashboard] Error response:', result);
        throw new Error(result.error || result.message || 'Unknown error');
      }
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
  const studentLevel = userInfo?.level || 1;
  const studentGPA = userInfo?.gpa || 0;

  return (
    <div className="space-y-6">
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
            <div className="text-center md:text-right">
              <Badge className="bg-kku-gold text-kku-green text-base md:text-lg px-4 py-2">
                {language === 'ar' ? `المستوى ${studentLevel}` : `Level ${studentLevel}`}
              </Badge>
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