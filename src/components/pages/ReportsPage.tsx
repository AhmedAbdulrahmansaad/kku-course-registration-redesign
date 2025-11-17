import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, 
  Download,
  Printer,
  BarChart3,
  BookOpen,
  Award,
  TrendingUp,
  User,
  Mail,
  Shield,
  GraduationCap,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { 
  exportAsPDF, 
  exportAsWord, 
  exportAsExcel,
  generateExportHeader, 
  generateExportFooter 
} from '../../utils/exportUtils';
import { DownloadButton } from '../DownloadButton';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface RegistrationData {
  registration_id: string;
  course_id: string;
  status: string;
  registered_at: string;
  course: {
    code: string;
    name_ar: string;
    name_en: string;
    credit_hours: number;
    level: number;
  };
}

export const ReportsPage: React.FC = () => {
  const { language, userInfo } = useApp();
  const [activeTab, setActiveTab] = useState('academic');
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);

  // تحديد الدور
  const userRole = userInfo?.role || 'student';
  const isStudent = userRole === 'student';
  const isSupervisor = userRole === 'supervisor';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (isStudent) {
      fetchRegistrations();
    } else {
      setLoading(false);
    }
  }, [isStudent]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      console.log('📊 [Reports] Fetching registrations...');

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.warn('⚠️ [Reports] No access token found');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/registrations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();
      console.log('📊 [Reports] Response:', result);

      if (response.ok && result.registrations) {
        setRegistrations(result.registrations);
        console.log('✅ [Reports] Loaded', result.registrations.length, 'registrations');
      } else {
        console.error('❌ [Reports] Error:', result);
        setRegistrations([]);
      }
    } catch (error: any) {
      console.error('❌ [Reports] Error fetching registrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  // حساب البيانات من التسجيلات الحقيقية
  const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');
  const completedHours = approvedRegistrations.reduce((sum, reg) => sum + (reg.course?.credit_hours || 0), 0);
  const currentSemesterCourses = approvedRegistrations.filter(reg => reg.status === 'approved');
  const currentSemesterHours = currentSemesterCourses.reduce((sum, reg) => sum + (reg.course?.credit_hours || 0), 0);
  
  // حساب المعدل التراكمي (افتراضياً من userInfo أو 0)
  const gpa = userInfo?.gpa || 0;
  const currentSemesterGPA = gpa; // يمكن حسابه من الدرجات الفعلية لاحقاً

  // بيانات الطالب
  const studentData = isStudent ? {
    studentId: userInfo?.id || '443200000',
    fullName: userInfo?.name || 'الطالب',
    major: userInfo?.major || 'نظم المعلومات الإدارية',
    level: userInfo?.level || 1,
    gpa: gpa,
    completedHours: completedHours,
    totalHours: 132,
  } : null;

  const semesterGPAs = isStudent ? [
    { 
      semester: language === 'ar' ? 'الفصل الحالي' : 'Current Semester', 
      year: '2025-2026', 
      gpa: currentSemesterGPA, 
      hours: currentSemesterHours 
    },
  ] : [];

  const currentCourses = currentSemesterCourses.map(reg => ({
    code: reg.course?.code || '',
    name: language === 'ar' ? (reg.course?.name_ar || '') : (reg.course?.name_en || ''),
    credits: reg.course?.credit_hours || 0,
    grade: '-',
    gpa: 0
  }));

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (format: 'pdf' | 'word' | 'excel') => {
    if (!isStudent) {
      toast.error(
        language === 'ar' 
          ? '⚠️ هذه الميزة متاحة للطلاب فقط' 
          : '⚠️ This feature is only available for students'
      );
      return;
    }

    try {
      // Generate courses table
      const coursesTableHTML = currentCourses.length > 0 ? `
        <h3>${language === 'ar' ? 'المقررات المسجلة' : 'Registered Courses'}</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${language === 'ar' ? 'رمز المقرر' : 'Course Code'}</th>
              <th>${language === 'ar' ? 'اسم المقرر' : 'Course Name'}</th>
              <th>${language === 'ar' ? 'الساعات' : 'Credits'}</th>
              <th>${language === 'ar' ? 'الدرجة' : 'Grade'}</th>
            </tr>
          </thead>
          <tbody>
            ${currentCourses.map((course, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${course.code}</strong></td>
                <td>${course.name}</td>
                <td>${course.credits}</td>
                <td>${course.grade}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<p>${language === 'ar' ? 'لا توجد مقررات مسجلة' : 'No courses registered'}</p>`;

      // Generate GPA table
      const gpaTableHTML = semesterGPAs.length > 0 ? `
        <h3>${language === 'ar' ? 'المعدل التراكمي' : 'GPA History'}</h3>
        <table>
          <thead>
            <tr>
              <th>${language === 'ar' ? 'الفصل الدراسي' : 'Semester'}</th>
              <th>${language === 'ar' ? 'السنة' : 'Year'}</th>
              <th>${language === 'ar' ? 'الساعات' : 'Hours'}</th>
              <th>${language === 'ar' ? 'المعدل' : 'GPA'}</th>
            </tr>
          </thead>
          <tbody>
            ${semesterGPAs.map(sem => `
              <tr>
                <td>${sem.semester}</td>
                <td>${sem.year}</td>
                <td>${sem.hours}</td>
                <td><strong>${sem.gpa.toFixed(2)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '';

      // Generate HTML content for the report
      const htmlContent = `
        ${generateExportHeader(
          language === 'ar' ? 'التقرير الأكاديمي' : 'Academic Report',
          language === 'ar' ? 'تقرير شامل عن الأداء الأكاديمي' : 'Comprehensive Academic Performance Report',
          {
            name: studentData?.fullName,
            id: studentData?.studentId,
            major: studentData?.major,
            level: language === 'ar' ? `المستوى ${studentData?.level}` : `Level ${studentData?.level}`,
            gpa: studentData?.gpa.toFixed(2),
            completedHours: studentData?.completedHours,
            totalHours: studentData?.totalHours
          },
          language
        )}

        <div style="margin: 30px 0;">
          <h2>${language === 'ar' ? 'ملخص الأداء الأكاديمي' : 'Academic Performance Summary'}</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
              <h4 style="color: #16a34a; margin-bottom: 10px;">${language === 'ar' ? 'المعدل التراكمي' : 'Cumulative GPA'}</h4>
              <p style="font-size: 2em; font-weight: bold; color: #16a34a;">${studentData?.gpa.toFixed(2)}</p>
            </div>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
              <h4 style="color: #d97706; margin-bottom: 10px;">${language === 'ar' ? 'الساعات المكتسبة' : 'Earned Hours'}</h4>
              <p style="font-size: 2em; font-weight: bold; color: #d97706;">${studentData?.completedHours}/${studentData?.totalHours}</p>
            </div>
            <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; text-align: center;">
              <h4 style="color: #0284c7; margin-bottom: 10px;">${language === 'ar' ? 'المقررات المسجلة' : 'Registered Courses'}</h4>
              <p style="font-size: 2em; font-weight: bold; color: #0284c7;">${currentCourses.length}</p>
            </div>
          </div>
        </div>

        <div style="margin: 30px 0;">
          ${coursesTableHTML}
        </div>

        <div style="margin: 30px 0;">
          ${gpaTableHTML}
        </div>

        ${generateExportFooter(language)}
      `;

      const filename = language === 'ar' ? 'التقرير_الأكاديمي' : 'Academic_Report';

      if (format === 'pdf') {
        exportAsPDF(htmlContent, filename, language);
      } else if (format === 'word') {
        exportAsWord(htmlContent, filename, language);
      } else if (format === 'excel') {
        exportAsExcel(htmlContent, filename, language);
      }

      toast.success(
        language === 'ar' 
          ? '✅ تم تحميل التقرير بنجاح' 
          : '✅ Report downloaded successfully'
      );
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(
        language === 'ar' 
          ? '❌ فشل تحميل التقرير' 
          : '❌ Failed to download report'
      );
    }
  };

  // إذا لم يكن طالباً
  if (!isStudent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <Shield className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'هذه الصفحة للطلاب فقط' : 'This Page is for Students Only'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'التقارير الأكاديمية متاحة للطلاب فقط.'
                : 'Academic reports are available for students only.'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // حالة التحميل
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-kku-green dark:text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">
            {language === 'ar' ? 'جاري تحميل التقرير...' : 'Loading report...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FileText className="h-10 w-10 text-kku-green dark:text-primary" />
          <h1 className="text-4xl font-bold gradient-text">
            {language === 'ar' ? 'التقارير الأكاديمية' : 'Academic Reports'}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          {language === 'ar'
            ? 'تقرير شامل عن أدائك الأكاديمي ومعدلك التراكمي'
            : 'Comprehensive report of your academic performance and GPA'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <DownloadButton
            onDownload={handleDownload}
            language={language}
            variant="outline"
            className="border-kku-green text-kku-green hover:bg-kku-green/10 dark:border-primary dark:text-primary"
          />
          <Button 
            variant="outline"
            className="gap-2 border-kku-gold text-kku-gold hover:bg-kku-gold/10"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            {language === 'ar' ? 'طباعة' : 'Print'}
          </Button>
        </div>
      </div>

      {/* Student Info Card */}
      <Card className="p-6 animate-fade-in pattern-bg" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-kku-green/10 dark:bg-primary/10 rounded-full">
              <User className="h-6 w-6 text-kku-green dark:text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الاسم' : 'Name'}</p>
              <p className="font-bold">{studentData?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-kku-gold/20 rounded-full">
              <Shield className="h-6 w-6 text-kku-gold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الرقم الجامعي' : 'Student ID'}</p>
              <p className="font-bold font-mono">{studentData?.studentId}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <GraduationCap className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'التخصص' : 'Major'}</p>
              <p className="font-bold text-sm">{studentData?.major}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المستوى' : 'Level'}</p>
              <p className="font-bold">{studentData?.level}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full mb-3">
            <Award className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-500 mb-1">
            {studentData?.gpa.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'المعدل التراكمي' : 'Cumulative GPA'}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {language === 'ar' ? 'من 5.00' : 'out of 5.00'}
          </div>
        </Card>

        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-gradient-to-br from-kku-gold/20 to-yellow-500/20 rounded-full mb-3">
            <BookOpen className="h-8 w-8 text-kku-gold" />
          </div>
          <div className="text-3xl font-bold text-kku-gold mb-1">
            {studentData?.completedHours}
          </div>
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'الساعات المكتسبة' : 'Earned Hours'}
          </div>
          <Progress 
            value={(studentData?.completedHours / studentData?.totalHours) * 100} 
            className="mt-3"
          />
          <div className="text-xs text-muted-foreground mt-2">
            {language === 'ar' ? `من ${studentData?.totalHours} ساعة` : `of ${studentData?.totalHours} hours`}
          </div>
        </Card>

        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full mb-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-500 mb-1">
            {currentCourses.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'المقررات المسجلة' : 'Registered Courses'}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {currentSemesterHours} {language === 'ar' ? 'ساعة معتمدة' : 'credit hours'}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="academic">
            {language === 'ar' ? '📊 الأداء الأكاديمي' : '📊 Academic Performance'}
          </TabsTrigger>
          <TabsTrigger value="courses">
            {language === 'ar' ? '📚 المقررات الحالية' : '📚 Current Courses'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="space-y-6">
          {/* GPA Table */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-kku-green dark:text-primary mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {language === 'ar' ? 'المعدل التراكمي' : 'GPA History'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start p-3">{language === 'ar' ? 'الفصل الدراسي' : 'Semester'}</th>
                    <th className="text-start p-3">{language === 'ar' ? 'السنة' : 'Year'}</th>
                    <th className="text-start p-3">{language === 'ar' ? 'الساعات' : 'Hours'}</th>
                    <th className="text-start p-3">{language === 'ar' ? 'المعدل' : 'GPA'}</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterGPAs.map((sem, index) => (
                    <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="p-3 font-medium">{sem.semester}</td>
                      <td className="p-3">{sem.year}</td>
                      <td className="p-3">{sem.hours}</td>
                      <td className="p-3">
                        <Badge 
                          variant={sem.gpa >= 4.5 ? 'default' : sem.gpa >= 3.5 ? 'secondary' : 'destructive'}
                          className="font-bold"
                        >
                          {sem.gpa.toFixed(2)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          {/* Current Courses */}
          {currentCourses.length > 0 ? (
            <Card className="p-6">
              <h3 className="text-xl font-bold text-kku-green dark:text-primary mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {language === 'ar' ? 'المقررات المسجلة' : 'Registered Courses'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-start p-3">#</th>
                      <th className="text-start p-3">{language === 'ar' ? 'رمز المقرر' : 'Course Code'}</th>
                      <th className="text-start p-3">{language === 'ar' ? 'اسم المقرر' : 'Course Name'}</th>
                      <th className="text-start p-3">{language === 'ar' ? 'الساعات' : 'Credits'}</th>
                      <th className="text-start p-3">{language === 'ar' ? 'الدرجة' : 'Grade'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCourses.map((course, index) => (
                      <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="font-mono">
                            {course.code}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">{course.name}</td>
                        <td className="p-3">{course.credits}</td>
                        <td className="p-3">
                          <Badge variant="secondary">{course.grade}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar' ? 'لا توجد مقررات مسجلة' : 'No Registered Courses'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? 'لم تقم بتسجيل أي مقررات بعد.'
                  : 'You have not registered for any courses yet.'}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
