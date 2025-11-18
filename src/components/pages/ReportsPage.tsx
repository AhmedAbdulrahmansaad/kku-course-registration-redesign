import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { 
  FileText, 
  Download, 
  Printer,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  ArrowLeft,
  BarChart3,
  Sparkles,
  Users,
  User,
  Target,
  GraduationCap
} from 'lucide-react';
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
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { fetchJSON, getErrorMessage } from '../../utils/fetchWithTimeout';

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

interface StudentData {
  id: string;
  name: string;
  email: string;
  major: string;
  level: number;
  gpa: number;
  earned_hours: number;
  role: string;
}

interface StudentReport {
  student: StudentData;
  registrations: RegistrationData[];
  stats: {
    totalCourses: number;
    approvedCourses: number;
    pendingCourses: number;
    rejectedCourses: number;
    totalHours: number;
    approvedHours: number;
    semesterGPA: number;
    cumulativeGPA: number;
  };
}

export const ReportsPage: React.FC = () => {
  const { language, userInfo, setCurrentPage } = useApp();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  
  // للمدير: فلاتر البحث
  const [allStudents, setAllStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchStudentId, setSearchStudentId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);

  // تحديد الدور
  const userRole = userInfo?.role || 'student';
  const isStudent = userRole === 'student';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    // Set timeout for loading state
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ [Reports] Loading timeout - forcing stop');
        setLoading(false);
        toast.error(
          language === 'ar'
            ? 'انتهى وقت التحميل - يرجى المحاولة مرة أخرى'
            : 'Loading timeout - Please try again'
        );
      }
    }, 15000); // 15 seconds timeout

    if (isStudent) {
      fetchRegistrations();
    } else if (isAdmin) {
      fetchAllStudents();
    } else {
      setLoading(false);
    }

    return () => clearTimeout(loadingTimeout);
  }, [isStudent, isAdmin]);

  // Apply filters
  useEffect(() => {
    if (isAdmin && allStudents.length > 0) {
      applyFilters();
    }
  }, [selectedMajor, selectedLevel, searchStudentId, allStudents]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      console.log('📊 [Reports] Fetching student registrations...');

      if (!userInfo?.id) {
        console.error('🚫 Access denied: User not logged in');
        toast.error(
          language === 'ar'
            ? 'يرجى تسجيل الدخول أولاً'
            : 'Please login first'
        );
        setLoading(false);
        return;
      }

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.warn('⚠️ [Reports] No access token found');
        toast.error(
          language === 'ar'
            ? 'يرجى تسجيل الدخول مرة أخرى'
            : 'Please login again'
        );
        setLoading(false);
        return;
      }

      const result = await fetchJSON(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/registrations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      console.log('📊 [Reports] Response:', result);

      if (result.registrations) {
        setRegistrations(result.registrations);
        console.log('✅ [Reports] Loaded', result.registrations.length, 'registrations');
      } else {
        console.warn('⚠️ [Reports] No registrations returned');
        setRegistrations([]);
      }
    } catch (error: any) {
      console.error('❌ [Reports] Error fetching registrations:', error);
      setRegistrations([]);
      const errorMessage = getErrorMessage(
        error,
        { ar: 'فشل في تحميل البيانات', en: 'Failed to load data' },
        language
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      console.log('📊 [Reports] Fetching all students for admin...');

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.warn('⚠️ [Reports] No access token found');
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login');
        setLoading(false);
        return;
      }

      const result = await fetchJSON(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/students`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      console.log('📊 [Reports] Admin students response:', result);

      if (result.students) {
        setAllStudents(result.students);
        setFilteredStudents(result.students);
        console.log('✅ [Reports] Loaded', result.students.length, 'students');
      } else {
        console.warn('⚠️ [Reports] No students returned');
        setAllStudents([]);
        setFilteredStudents([]);
      }
    } catch (error: any) {
      console.error('❌ [Reports] Error fetching students:', error);
      setAllStudents([]);
      setFilteredStudents([]);
      const errorMessage = getErrorMessage(
        error,
        { ar: 'فشل في تحميل بيانات الطلاب', en: 'Failed to load student data' },
        language
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allStudents];

    // Filter by major
    if (selectedMajor !== 'all') {
      filtered = filtered.filter(s => s.major === selectedMajor);
    }

    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(s => s.level === parseInt(selectedLevel));
    }

    // Filter by student ID
    if (searchStudentId.trim()) {
      filtered = filtered.filter(s => s.id.includes(searchStudentId.trim()));
    }

    console.log('🔍 [Reports] Filtered students:', filtered.length);
    setFilteredStudents(filtered);
  };

  const fetchStudentReport = async (studentId: string) => {
    try {
      console.log('📊 [Reports] Fetching student report for:', studentId);

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login');
        return null;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/student-report/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log('📡 [Reports] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Reports] Server error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [Reports] Student report:', result);

      return result;
    } catch (error: any) {
      console.error('❌ [Reports] Error fetching student report:', error);
      toast.error(language === 'ar' ? `فشل: ${error.message}` : `Failed: ${error.message}`);
      return null;
    }
  };

  const handleViewReport = async (studentId: string) => {
    setSelectedStudentId(studentId);
    
    console.log('🔍 [Reports] Requesting report for student ID:', studentId);
    
    const report = await fetchStudentReport(studentId);
    
    if (report) {
      console.log('📊 [Reports] Report received:', report);
      console.log('👤 [Reports] Student data:', report.student);
      console.log('📚 [Reports] Registrations:', report.registrations?.length || 0);
      console.log('📈 [Reports] Stats:', report.stats);
      
      setStudentReports([report]);
      
      toast.success(
        language === 'ar' 
          ? `✅ تم تحميل تقرير ${report.student?.name || 'الطالب'}`
          : `✅ Report loaded for ${report.student?.name || 'student'}`
      );
    } else {
      console.error('❌ [Reports] No report data received');
      toast.error(
        language === 'ar'
          ? 'فشل في تحميل التقرير'
          : 'Failed to load report'
      );
    }
  };

  const handleViewAllReports = async () => {
    if (filteredStudents.length === 0) {
      toast.warning(language === 'ar' ? 'لا يوجد طلاب لعرضهم' : 'No students to display');
      return;
    }

    setLoading(true);
    const reports: StudentReport[] = [];

    for (const student of filteredStudents) {
      const report = await fetchStudentReport(student.id);
      if (report) {
        reports.push(report);
      }
    }

    setStudentReports(reports);
    setLoading(false);
    toast.success(
      language === 'ar' 
        ? `تم تحميل ${reports.length} تقرير` 
        : `Loaded ${reports.length} reports`
    );
  };

  // Get unique majors
  const majors = Array.from(new Set(allStudents.map(s => s.major)));

  // حساب البيانات للطالب
  const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');
  const pendingRegistrations = registrations.filter(reg => reg.status === 'pending');
  const rejectedRegistrations = registrations.filter(reg => reg.status === 'rejected');
  const completedHours = approvedRegistrations.reduce((sum, reg) => sum + (reg.course?.credit_hours || 0), 0);
  const currentSemesterHours = approvedRegistrations.reduce((sum, reg) => sum + (reg.course?.credit_hours || 0), 0);
  const gpa = userInfo?.gpa || 0;

  const studentData = isStudent ? {
    studentId: userInfo?.id || '443200000',
    fullName: userInfo?.name || 'الطالب',
    major: userInfo?.major || 'نظم المعلومات الإدارية',
    level: userInfo?.level || 1,
    gpa: gpa,
    completedHours: completedHours,
    totalHours: 132,
  } : null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (format: 'pdf' | 'word' | 'excel') => {
    try {
      const reportElement = document.getElementById('report-content');
      if (!reportElement) {
        toast.error(language === 'ar' ? 'فشل في إنشاء التقرير' : 'Failed to generate report');
        return;
      }

      const header = generateExportHeader(language);
      const footer = generateExportFooter(language);

      if (format === 'pdf') {
        await exportAsPDF(
          reportElement,
          language === 'ar' ? 'التقرير_الأكاديمي.pdf' : 'Academic_Report.pdf',
          header,
          footer
        );
      } else if (format === 'word') {
        await exportAsWord(
          reportElement,
          language === 'ar' ? 'التقرير_الأكاديمي.docx' : 'Academic_Report.docx',
          header,
          footer
        );
      } else if (format === 'excel') {
        await exportAsExcel(
          reportElement,
          language === 'ar' ? 'التقرير_الأكاديمي.xlsx' : 'Academic_Report.xlsx'
        );
      }

      toast.success(language === 'ar' ? 'تم التنزيل بنجاح' : 'Downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(language === 'ar' ? 'فشل التنزيل' : 'Download failed');
    }
  };

  // حالة التحميل
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-kku-gold/20 blur-3xl animate-pulse"></div>
            <Loader2 className="relative h-16 w-16 animate-spin text-kku-green dark:text-primary mx-auto" />
          </div>
          <p className="text-xl font-semibold bg-gradient-to-r from-kku-green to-kku-gold bg-clip-text text-transparent">
            {language === 'ar' ? 'جاري تحميل التقارير...' : 'Loading Reports...'}
          </p>
        </div>
      </div>
    );
  }

  // عرض للمدير
  if (isAdmin) {
    return (
      <div className="space-y-8 pb-12">
        {/* زر الرجوع الواضح */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCurrentPage('adminDashboard')}
            variant="outline"
            size="lg"
            className="group border-2 border-kku-green hover:bg-kku-green hover:text-white transition-all duration-300"
          >
            <ArrowLeft className={`h-5 w-5 group-hover:-translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
            <span className="mr-2">{language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
          </Button>
        </div>

        {/* Header الفاخر */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-kku-green via-emerald-700 to-kku-green p-12 text-white">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>

          <div className="relative">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 bg-kku-gold/20 rounded-2xl backdrop-blur-sm border-2 border-kku-gold/50">
                <BarChart3 className="h-16 w-16 text-kku-gold" strokeWidth={2.5} />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 drop-shadow-lg flex items-center justify-center gap-3">
              <Sparkles className="h-12 w-12 text-kku-gold animate-pulse" />
              {language === 'ar' ? 'التقارير الأكاديمية' : 'Academic Reports'}
              <Sparkles className="h-12 w-12 text-kku-gold animate-pulse" />
            </h1>
            
            <p className="text-center text-xl text-kku-gold/90 font-medium">
              {language === 'ar'
                ? 'لوحة التحكم الشاملة لعرض وتحليل التقارير الأكاديمية لجميع الطلاب'
                : 'Comprehensive Dashboard for Viewing and Analyzing All Student Reports'}
            </p>
          </div>
        </div>

        {/* Filters Card - تصميم فاخر */}
        <Card className="overflow-hidden border-2 border-kku-green/20 shadow-2xl">
          <div className="bg-gradient-to-r from-kku-green/10 to-emerald-500/10 p-6 border-b-2 border-kku-green/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-kku-green rounded-xl shadow-lg">
                <Filter className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-kku-green">
                  {language === 'ar' ? 'فلاتر البحث المتقدمة' : 'Advanced Search Filters'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'ابحث عن الطلاب حسب القسم، المستوى، أو الرقم الجامعي' : 'Search students by major, level, or student ID'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {/* Major Filter - قائمة الأقسام */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-kku-green" />
                  {language === 'ar' ? 'القسم' : 'Major'}
                </Label>
                <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                  <SelectTrigger className="h-12 border-2 border-kku-green/30 hover:border-kku-green focus:border-kku-green transition-colors">
                    <SelectValue placeholder={language === 'ar' ? 'اختر القسم' : 'Select Major'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-base font-medium">
                      {language === 'ar' ? '🎯 جميع الأقسام' : '🎯 All Majors'}
                    </SelectItem>
                    {majors.map(major => (
                      <SelectItem key={major} value={major} className="text-base">
                        📚 {major}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-kku-green" />
                  {language === 'ar' ? 'المستوى' : 'Level'}
                </Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="h-12 border-2 border-kku-green/30 hover:border-kku-green focus:border-kku-green transition-colors">
                    <SelectValue placeholder={language === 'ar' ? 'اختر المستوى' : 'Select Level'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-base font-medium">
                      {language === 'ar' ? '🎯 جميع المستويات' : '🎯 All Levels'}
                    </SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
                      <SelectItem key={level} value={level.toString()} className="text-base">
                        📊 {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student ID Search */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Search className="h-5 w-5 text-kku-green" />
                  {language === 'ar' ? 'الرقم الجامعي' : 'Student ID'}
                </Label>
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder={language === 'ar' ? 'ابحث بالرقم الجامعي...' : 'Search by student ID...'}
                    value={searchStudentId}
                    onChange={(e) => setSearchStudentId(e.target.value)}
                    className="h-12 pr-12 border-2 border-kku-green/30 hover:border-kku-green focus:border-kku-green transition-colors text-base"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleViewAllReports}
                className="h-12 px-8 bg-gradient-to-r from-kku-green to-emerald-600 hover:from-kku-green/90 hover:to-emerald-600/90 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={filteredStudents.length === 0}
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                {language === 'ar' 
                  ? `عرض تقارير الطلاب (${filteredStudents.length})`
                  : `View Reports (${filteredStudents.length})`}
              </Button>

              <Button
                onClick={() => {
                  setSelectedMajor('all');
                  setSelectedLevel('all');
                  setSearchStudentId('');
                  setStudentReports([]);
                }}
                variant="outline"
                className="h-12 px-8 border-2 border-kku-green text-kku-green hover:bg-kku-green hover:text-white text-lg font-semibold transition-all"
              >
                {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </Button>
            </div>

            {/* إحصائيات فاخرة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t-2 border-dashed border-kku-green/20">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-4xl font-bold text-blue-600 mb-2">{allStudents.length}</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الطلاب' : 'Total Students'}
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
                <Filter className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-4xl font-bold text-green-600 mb-2">{filteredStudents.length}</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'بعد التصفية' : 'Filtered'}
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
                <GraduationCap className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <p className="text-4xl font-bold text-purple-600 mb-2">{majors.length}</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'الأقسام' : 'Majors'}
                </p>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-2xl border-2 border-orange-200 dark:border-orange-800 shadow-lg hover:shadow-xl transition-shadow">
                <FileText className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <p className="text-4xl font-bold text-orange-600 mb-2">{studentReports.length}</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'التقارير المعروضة' : 'Reports Shown'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Students List - تصميم أنيق */}
        {filteredStudents.length > 0 && studentReports.length === 0 && (
          <Card className="border-2 border-kku-green/20 shadow-xl">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 border-b-2 border-kku-green/20">
              <h2 className="text-3xl font-bold text-kku-green flex items-center gap-3">
                <Users className="h-8 w-8" />
                {language === 'ar' ? 'قائمة الطلاب' : 'Students List'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  className="group flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-kku-green/20 hover:border-kku-green hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-kku-green to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground mb-1">{student.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{student.id}</span>
                        <span>•</span>
                        <span>{student.major}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right space-y-2">
                      <Badge className="bg-kku-gold text-kku-green text-sm px-3 py-1">
                        {language === 'ar' ? `المستوى ${student.level}` : `Level ${student.level}`}
                      </Badge>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        {language === 'ar' ? 'المعدل:' : 'GPA:'} 
                        <span className="font-bold text-kku-green">{student.gpa?.toFixed(2) || '0.00'}</span>
                      </p>
                    </div>
                    <Button
                      onClick={() => handleViewReport(student.id)}
                      size="lg"
                      className="bg-gradient-to-r from-kku-green to-emerald-600 hover:from-kku-green/90 hover:to-emerald-600/90 shadow-lg hover:shadow-xl transition-all"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      {language === 'ar' ? 'عرض التقرير' : 'View Report'}
                    </Button>
                  </div>
                </div>
              ))}</div>
          </Card>
        )}

        {/* Student Reports */}
        {studentReports.length > 0 && (
          <div className="space-y-8" id="report-content">
            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 print:hidden">
              <DownloadButton
                onDownload={handleDownload}
                language={language}
                variant="outline"
                className="h-12 border-2 border-kku-green text-kku-green hover:bg-kku-green hover:text-white text-base"
              />
              <Button 
                variant="outline"
                size="lg"
                className="h-12 gap-2 border-2 border-kku-gold text-kku-gold hover:bg-kku-gold hover:text-white text-base"
                onClick={handlePrint}
              >
                <Printer className="h-5 w-5" />
                {language === 'ar' ? 'طباعة' : 'Print'}
              </Button>
            </div>

            {studentReports.map((report) => (
              <Card key={report.student.id} className="overflow-hidden border-2 border-kku-green/20 shadow-2xl">
                {/* Student Header - فاخر */}
                <div className="bg-gradient-to-r from-kku-green via-emerald-700 to-kku-green p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="p-5 bg-kku-gold/20 rounded-2xl backdrop-blur-sm border-2 border-kku-gold/50">
                        <User className="h-12 w-12 text-kku-gold" />
                      </div>
                      <div>
                        <h2 className="text-4xl font-bold mb-2">{report.student.name}</h2>
                        <div className="flex items-center gap-4 text-lg text-kku-gold/90">
                          <span className="font-mono bg-white/10 px-3 py-1 rounded-lg">{report.student.id}</span>
                          <span>•</span>
                          <span>{report.student.major}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-kku-gold text-kku-green text-2xl px-6 py-3 font-bold shadow-lg">
                      {language === 'ar' ? `المستوى ${report.student.level}` : `Level ${report.student.level}`}
                    </Badge>
                  </div>
                </div>

                <div className="p-8">
                  {/* إحصائيات فاخرة */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow">
                      <CheckCircle className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                      <p className="text-4xl font-bold text-blue-600 mb-2">{report.stats.approvedCourses}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'المقررات المقبولة' : 'Approved Courses'}
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow">
                      <Target className="h-10 w-10 text-green-600 mx-auto mb-3" />
                      <p className="text-4xl font-bold text-green-600 mb-2">{report.stats.approvedHours}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'الساعات المقبولة' : 'Approved Hours'}
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-xl transition-shadow">
                      <Clock className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
                      <p className="text-4xl font-bold text-yellow-600 mb-2">{report.stats.pendingCourses}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                      </p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-shadow">
                      <Award className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                      <p className="text-4xl font-bold text-purple-600 mb-2">
                        {report.stats.cumulativeGPA.toFixed(2)}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'المعدل التراكمي' : 'Cumulative GPA'}
                      </p>
                    </div>
                  </div>

                  {/* قائمة المقررات */}
                  {report.registrations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="h-7 w-7 text-kku-green" />
                        <h3 className="text-2xl font-bold text-kku-green">
                          {language === 'ar' ? 'المقررات المسجلة' : 'Registered Courses'}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {report.registrations.map(reg => (
                          <div
                            key={reg.registration_id}
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-kku-green hover:shadow-lg transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <Badge
                                className="text-base px-4 py-2 font-bold"
                                variant={
                                  reg.status === 'approved'
                                    ? 'default'
                                    : reg.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {reg.course?.code}
                              </Badge>
                              <p className="text-lg font-medium">
                                {language === 'ar' ? reg.course?.name_ar : reg.course?.name_en}
                              </p>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className="text-base text-muted-foreground font-medium">
                                {reg.course?.credit_hours} {language === 'ar' ? 'ساعات' : 'hours'}
                              </span>
                              <Badge
                                className="text-base px-4 py-2"
                                variant={
                                  reg.status === 'approved' ? 'default' : 
                                  reg.status === 'pending' ? 'secondary' : 'destructive'
                                }
                              >
                                {reg.status === 'approved' && <CheckCircle className="h-4 w-4 mr-1" />}
                                {reg.status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                                {reg.status === 'rejected' && <XCircle className="h-4 w-4 mr-1" />}
                                {reg.status === 'approved'
                                  ? language === 'ar' ? 'مقبول' : 'Approved'
                                  : reg.status === 'pending'
                                  ? language === 'ar' ? 'قيد الانتظار' : 'Pending'
                                  : language === 'ar' ? 'مروض' : 'Rejected'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.registrations.length === 0 && (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <AlertCircle className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl font-medium text-muted-foreground">
                        {language === 'ar' ? 'لا توجد مقررات مسجلة' : 'No registered courses'}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <Card className="p-20 text-center border-2 border-dashed border-kku-green/30">
            <Users className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-3 text-kku-green">
              {language === 'ar' ? 'لا يوجد طلاب' : 'No Students Found'}
            </h3>
            <p className="text-lg text-muted-foreground">
              {language === 'ar'
                ? 'لا يوجد طلاب يطابقون معايير البحث'
                : 'No students match the search criteria'}
            </p>
          </Card>
        )}
      </div>
    );
  }

  // عرض للطالب - سأبقيه كما هو لكن مع زر رجوع واضح
  return (
    <div className="space-y-8 pb-12">
      {/* زر الرجوع الواضح */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setCurrentPage('studentDashboard')}
          variant="outline"
          size="lg"
          className="group border-2 border-kku-green hover:bg-kku-green hover:text-white transition-all duration-300"
        >
          <ArrowLeft className={`h-5 w-5 group-hover:-translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
          <span className="mr-2">{language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">
          {language === 'ar' ? 'التقرير الأكاديمي' : 'Academic Report'}
        </h1>
        <p className="text-lg text-muted-foreground">
          {language === 'ar' ? 'عرض شامل لسجلك الأكاديمي' : 'Comprehensive view of your academic record'}
        </p>
      </div>

      <div id="report-content" className="space-y-6">
        {studentData && (
          <>
            {/* معلومات الطالب */}
            <Card className="p-8 border-2 border-kku-green/20 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-kku-green/10 rounded-2xl">
                    <User className="h-12 w-12 text-kku-green" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{studentData.fullName}</h2>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">{studentData.studentId}</span>
                      <span>•</span>
                      <span>{studentData.major}</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-kku-gold text-kku-green text-xl px-6 py-3 font-bold">
                  {language === 'ar' ? `المستوى ${studentData.level}` : `Level ${studentData.level}`}
                </Badge>
              </div>

              {/* إحصائيات الطالب */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                  <Award className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  <p className="text-4xl font-bold text-blue-600 mb-2">{studentData.gpa.toFixed(2)}</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'المعدل التراكمي' : 'GPA'}
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-2xl border-2 border-green-200 dark:border-green-800">
                  <Target className="h-10 w-10 text-green-600 mx-auto mb-3" />
                  <p className="text-4xl font-bold text-green-600 mb-2">{studentData.completedHours}</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الساعات المكتسبة' : 'Earned Hours'}
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
                  <BookOpen className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                  <p className="text-4xl font-bold text-purple-600 mb-2">{approvedRegistrations.length}</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'المقررات المكتملة' : 'Completed Courses'}
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800">
                  <TrendingUp className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
                  <p className="text-4xl font-bold text-yellow-600 mb-2">{studentData.totalHours}</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الساعات' : 'Total Hours'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="flex justify-between mb-3">
                  <span className="font-medium">{language === 'ar' ? 'التقدم الأكاديمي' : 'Academic Progress'}</span>
                  <span className="font-bold text-kku-green">
                    {Math.round((studentData.completedHours / studentData.totalHours) * 100)}%
                  </span>
                </div>
                <Progress value={(studentData.completedHours / studentData.totalHours) * 100} className="h-4" />
              </div>
            </Card>

            {/* المقررات المسجلة */}
            {registrations.length > 0 && (
              <Card className="p-8 border-2 border-kku-green/20 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="h-7 w-7 text-kku-green" />
                  <h3 className="text-2xl font-bold text-kku-green">
                    {language === 'ar' ? 'المقررات المسجلة' : 'Registered Courses'}
                  </h3>
                </div>

                <div className="space-y-3">
                  {registrations.map(reg => (
                    <div
                      key={reg.registration_id}
                      className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-kku-green hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Badge className="text-base px-4 py-2 font-bold bg-kku-green text-white">
                          {reg.course?.code}
                        </Badge>
                        <p className="text-lg font-medium">
                          {language === 'ar' ? reg.course?.name_ar : reg.course?.name_en}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-base text-muted-foreground font-medium">
                          {reg.course?.credit_hours} {language === 'ar' ? 'ساعات' : 'hours'}
                        </span>
                        <Badge
                          className="text-base px-4 py-2"
                          variant={
                            reg.status === 'approved' ? 'default' : 
                            reg.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {reg.status === 'approved' && <CheckCircle className="h-4 w-4 mr-1" />}
                          {reg.status === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                          {reg.status === 'rejected' && <XCircle className="h-4 w-4 mr-1" />}
                          {reg.status === 'approved'
                            ? language === 'ar' ? 'مقبول' : 'Approved'
                            : reg.status === 'pending'
                            ? language === 'ar' ? 'قيد الانتظار' : 'Pending'
                            : language === 'ar' ? 'مرفوض' : 'Rejected'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 print:hidden">
              <DownloadButton
                onDownload={handleDownload}
                language={language}
                className="h-12 bg-kku-green hover:bg-kku-green/90 text-white"
              />
              <Button 
                variant="outline"
                size="lg"
                className="h-12 gap-2 border-2 border-kku-gold text-kku-gold hover:bg-kku-gold hover:text-white"
                onClick={handlePrint}
              >
                <Printer className="h-5 w-5" />
                {language === 'ar' ? 'طباعة' : 'Print'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};