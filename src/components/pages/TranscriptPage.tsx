import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  FileText,
  Award,
  TrendingUp,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  Loader2,
  GraduationCap,
  BarChart3,
  Star,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  calculateGPA,
  generateSampleGrades,
  groupGradesByLevel,
  groupGradesBySemester,
  formatGPA,
  getStatusColor,
  GRADE_SCALE,
  type GradeRecord,
  type GPACalculation,
} from '../../utils/gpaUtils';
import {
  exportAsPDF,
  exportAsWord,
  generateExportHeader,
  generateExportFooter,
} from '../../utils/exportUtils';
import { DownloadButton } from '../DownloadButton';
import { projectId } from '../../utils/supabase/info';

export const TranscriptPage: React.FC = () => {
  const { language, userInfo } = useApp();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [gpaData, setGpaData] = useState<GPACalculation | null>(null);
  const [selectedView, setSelectedView] = useState<'all' | 'semester' | 'level'>('all');

  useEffect(() => {
    fetchGrades();
  }, [userInfo]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching grades for user:', userInfo);

      // مؤقتاً: استخدام بيانات تجريبية
      // في المستقبل، يمكن جلب البيانات من السيرفر
      const sampleGrades = generateSampleGrades();
      setGrades(sampleGrades);

      // حساب المعدل
      const gpaCalculation = calculateGPA(sampleGrades);
      setGpaData(gpaCalculation);

      console.log('✅ Grades loaded:', sampleGrades.length);
      console.log('📊 GPA Data:', gpaCalculation);
    } catch (error) {
      console.error('❌ Error fetching grades:', error);
      toast.error(
        language === 'ar'
          ? 'فشل في تحميل السجل الأكاديمي'
          : 'Failed to load academic transcript'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'word') => {
    try {
      const userInfoData = userInfo || {};
      
      // توليد جدول الدرجات
      const gradesHTML = `
        <table>
          <thead>
            <tr>
              <th>${language === 'ar' ? '#' : '#'}</th>
              <th>${language === 'ar' ? 'رمز المقرر' : 'Course Code'}</th>
              <th>${language === 'ar' ? 'اسم المقرر' : 'Course Name'}</th>
              <th>${language === 'ar' ? 'الساعات' : 'Credits'}</th>
              <th>${language === 'ar' ? 'التقدير' : 'Grade'}</th>
              <th>${language === 'ar' ? 'النسبة %' : 'Score %'}</th>
              <th>${language === 'ar' ? 'النقاط' : 'Points'}</th>
            </tr>
          </thead>
          <tbody>
            ${grades.map((grade, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${grade.course_code}</strong></td>
                <td>${language === 'ar' ? grade.course_name_ar : grade.course_name_en}</td>
                <td>${grade.credit_hours}</td>
                <td><strong style="color: ${grade.letter_grade === 'F' ? '#EF4444' : '#22C55E'};">${grade.letter_grade}</strong></td>
                <td>${grade.percentage}%</td>
                <td>${grade.points.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // معلومات المعدل
      const gpaInfoHTML = gpaData ? `
        <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border: 2px solid #22C55E; border-radius: 8px;">
          <h3 style="color: #184A2C; margin-bottom: 15px;">${language === 'ar' ? 'ملخص الأداء الأكاديمي' : 'Academic Performance Summary'}</h3>
          <table style="border: none;">
            <tr>
              <td style="border: none; padding: 8px;"><strong>${language === 'ar' ? 'المعدل التراكمي:' : 'Cumulative GPA:'}</strong></td>
              <td style="border: none; padding: 8px; color: #184A2C; font-size: 1.2em;"><strong>${formatGPA(gpaData.gpa)} / 5.00</strong></td>
            </tr>
            <tr>
              <td style="border: none; padding: 8px;"><strong>${language === 'ar' ? 'الحالة الأكاديمية:' : 'Academic Status:'}</strong></td>
              <td style="border: none; padding: 8px; color: #22C55E;"><strong>${language === 'ar' ? gpaData.academic_status_ar : gpaData.academic_status}</strong></td>
            </tr>
            <tr>
              <td style="border: none; padding: 8px;"><strong>${language === 'ar' ? 'الساعات المكتسبة:' : 'Hours Earned:'}</strong></td>
              <td style="border: none; padding: 8px;">${gpaData.total_hours_passed} ${language === 'ar' ? 'ساعة' : 'hours'}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 8px;"><strong>${language === 'ar' ? 'الساعات المتبقية:' : 'Remaining Hours:'}</strong></td>
              <td style="border: none; padding: 8px;">${gpaData.remaining_hours} ${language === 'ar' ? 'ساعة' : 'hours'}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 8px;"><strong>${language === 'ar' ? 'نسبة الإنجاز:' : 'Completion:'}</strong></td>
              <td style="border: none; padding: 8px;">${gpaData.completion_percentage.toFixed(1)}%</td>
            </tr>
          </table>
        </div>
      ` : '';

      const htmlContent = `
        ${generateExportHeader(
          language === 'ar' ? 'السجل الأكاديمي الرسمي' : 'Official Academic Transcript',
          language === 'ar' ? 'برنامج نظم المعلومات الإدارية' : 'Management Information Systems Program',
          {
            name: userInfoData.name || 'Student Name',
            id: userInfoData.id || 'Student ID',
            major: language === 'ar' ? 'نظم المعلومات الإدارية' : 'Management Information Systems',
            level: language === 'ar' ? `المستوى ${userInfoData.level || '1'}` : `Level ${userInfoData.level || '1'}`,
          },
          language
        )}
        
        ${gpaInfoHTML}
        
        <div style="margin: 20px 0;">
          <h3>${language === 'ar' ? 'سجل المقررات الدراسية' : 'Course Records'}</h3>
          ${gradesHTML}
        </div>
        
        <div style="margin-top: 40px; padding: 15px; background-color: #FEF3C7; border-left: 4px solid #D4AF37;">
          <p style="margin: 0; font-size: 0.9em;">
            <strong>${language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong>
            ${language === 'ar' 
              ? 'هذا السجل الأكاديمي صادر من نظام التسجيل الإلكتروني لجامعة الملك خالد - كلية إدارة الأعمال.'
              : 'This academic transcript is issued by King Khalid University Electronic Registration System - College of Business Administration.'
            }
          </p>
        </div>
        
        ${generateExportFooter(language)}
      `;

      const filename = language === 'ar' ? 'السجل_الأكاديمي' : 'Academic_Transcript';

      if (format === 'pdf') {
        exportAsPDF(htmlContent, filename, language);
      } else {
        exportAsWord(htmlContent, filename, language);
      }

      toast.success(
        language === 'ar'
          ? '✅ تم تحميل السجل الأكاديمي بنجاح'
          : '✅ Transcript downloaded successfully'
      );
    } catch (error) {
      console.error('Error generating transcript:', error);
      toast.error(
        language === 'ar'
          ? '❌ فشل تحميل الملف'
          : '❌ Failed to download file'
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-kku-green dark:text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">
            {language === 'ar' ? 'جاري تحميل السجل الأكاديمي...' : 'Loading transcript...'}
          </p>
        </div>
      </div>
    );
  }

  const groupedByLevel = groupGradesByLevel(grades);
  const groupedBySemester = groupGradesBySemester(grades);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <GraduationCap className="h-10 w-10 text-kku-green dark:text-primary" />
          <h1 className="text-4xl font-bold gradient-text">
            {language === 'ar' ? 'السجل الأكاديمي' : 'Academic Transcript'}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          {language === 'ar'
            ? 'سجلك الأكاديمي الشامل مع المعدل التراكمي والإنجاز'
            : 'Your comprehensive academic record with GPA and achievements'}
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

      {/* GPA Summary Cards */}
      {gpaData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Cumulative GPA */}
          <Card className="p-6 text-center hover-lift pattern-bg">
            <div className="inline-flex p-4 bg-gradient-to-br from-kku-green/10 to-kku-gold/10 rounded-full mb-3">
              <Award className="h-8 w-8 text-kku-green dark:text-primary" />
            </div>
            <div className="text-4xl font-bold mb-1" style={{ color: getStatusColor(gpaData.gpa) }}>
              {formatGPA(gpaData.gpa)}
            </div>
            <div className="text-sm text-muted-foreground mb-1">
              {language === 'ar' ? 'المعدل التراكمي' : 'Cumulative GPA'}
            </div>
            <div className="text-xs text-muted-foreground">
              {language === 'ar' ? 'من 5.00' : 'out of 5.00'}
            </div>
          </Card>

          {/* Academic Status */}
          <Card className="p-6 text-center hover-lift pattern-bg">
            <div className="inline-flex p-4 bg-green-500/10 rounded-full mb-3">
              <Star className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500 mb-1">
              {language === 'ar' ? gpaData.academic_status_ar : gpaData.academic_status}
            </div>
            <div className="text-sm text-muted-foreground">
              {language === 'ar' ? 'الحالة الأكاديمية' : 'Academic Status'}
            </div>
          </Card>

          {/* Hours Earned */}
          <Card className="p-6 text-center hover-lift pattern-bg">
            <div className="inline-flex p-4 bg-blue-500/10 rounded-full mb-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-blue-500 mb-1">
              {gpaData.total_hours_passed}
            </div>
            <div className="text-sm text-muted-foreground mb-1">
              {language === 'ar' ? 'الساعات المكتسبة' : 'Hours Earned'}
            </div>
            <div className="text-xs text-muted-foreground">
              {language === 'ar' ? `من 130 ساعة` : `out of 130 hours`}
            </div>
          </Card>

          {/* Completion */}
          <Card className="p-6 text-center hover-lift pattern-bg">
            <div className="inline-flex p-4 bg-kku-gold/20 rounded-full mb-3">
              <TrendingUp className="h-8 w-8 text-kku-gold" />
            </div>
            <div className="text-4xl font-bold text-kku-gold mb-1">
              {gpaData.completion_percentage.toFixed(0)}%
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              {language === 'ar' ? 'نسبة الإنجاز' : 'Completion'}
            </div>
            <Progress value={gpaData.completion_percentage} className="h-2" />
          </Card>
        </div>
      )}

      {/* Progress Details */}
      {gpaData && (
        <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-kku-green dark:text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {language === 'ar' ? 'تفاصيل التقدم الدراسي' : 'Academic Progress Details'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {gpaData.total_hours_passed}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'ساعات مكتسبة' : 'Hours Passed'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
              <Calendar className="h-10 w-10 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {gpaData.remaining_hours}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'ساعات متبقية' : 'Hours Remaining'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <XCircle className="h-10 w-10 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {gpaData.total_hours_failed}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'ساعات راسبة' : 'Hours Failed'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grades Table */}
      <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-kku-green dark:text-primary flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {language === 'ar' ? 'سجل الدرجات' : 'Grade Records'}
          </h2>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={selectedView === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('all')}
              className={selectedView === 'all' ? 'bg-kku-green hover:bg-kku-green/90' : ''}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </Button>
            <Button
              variant={selectedView === 'semester' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('semester')}
              className={selectedView === 'semester' ? 'bg-kku-green hover:bg-kku-green/90' : ''}
            >
              {language === 'ar' ? 'حسب الفصل' : 'By Semester'}
            </Button>
            <Button
              variant={selectedView === 'level' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('level')}
              className={selectedView === 'level' ? 'bg-kku-green hover:bg-kku-green/90' : ''}
            >
              {language === 'ar' ? 'حسب المستوى' : 'By Level'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {selectedView === 'all' && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-3">{language === 'ar' ? '#' : '#'}</th>
                  <th className="text-right p-3">{language === 'ar' ? 'رمز المقرر' : 'Code'}</th>
                  <th className="text-right p-3">{language === 'ar' ? 'اسم المقرر' : 'Course Name'}</th>
                  <th className="text-center p-3">{language === 'ar' ? 'الساعات' : 'Credits'}</th>
                  <th className="text-center p-3">{language === 'ar' ? 'التقدير' : 'Grade'}</th>
                  <th className="text-center p-3">{language === 'ar' ? 'النسبة %' : 'Score %'}</th>
                  <th className="text-center p-3">{language === 'ar' ? 'النقاط' : 'Points'}</th>
                  <th className="text-center p-3">{language === 'ar' ? 'الفصل' : 'Semester'}</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade, index) => (
                  <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-mono font-bold">{grade.course_code}</td>
                    <td className="p-3">{language === 'ar' ? grade.course_name_ar : grade.course_name_en}</td>
                    <td className="p-3 text-center">{grade.credit_hours}</td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={grade.letter_grade === 'F' ? 'destructive' : 'default'}
                        className={grade.letter_grade !== 'F' ? 'bg-green-500' : ''}
                      >
                        {grade.letter_grade}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">{grade.percentage}%</td>
                    <td className="p-3 text-center font-bold">{grade.points.toFixed(2)}</td>
                    <td className="p-3 text-center text-sm text-muted-foreground">
                      {grade.semester} {grade.academic_year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedView === 'level' && (
            <div className="space-y-6">
              {Array.from(groupedByLevel.entries())
                .sort(([a], [b]) => a - b)
                .map(([level, levelGrades]) => {
                  const levelGPA = calculateGPA(levelGrades);
                  return (
                    <div key={level} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-kku-green dark:text-primary">
                          {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                        </h3>
                        <Badge variant="secondary" className="text-lg">
                          {language === 'ar' ? 'المعدل:' : 'GPA:'} {formatGPA(levelGPA.gpa)}
                        </Badge>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-sm">
                            <th className="text-right p-2">{language === 'ar' ? 'رمز' : 'Code'}</th>
                            <th className="text-right p-2">{language === 'ar' ? 'المقرر' : 'Course'}</th>
                            <th className="text-center p-2">{language === 'ar' ? 'ساعات' : 'Hrs'}</th>
                            <th className="text-center p-2">{language === 'ar' ? 'التقدير' : 'Grade'}</th>
                            <th className="text-center p-2">{language === 'ar' ? 'النقاط' : 'Points'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {levelGrades.map((grade, idx) => (
                            <tr key={idx} className="border-b border-border hover:bg-accent/50">
                              <td className="p-2 font-mono text-sm">{grade.course_code}</td>
                              <td className="p-2 text-sm">{language === 'ar' ? grade.course_name_ar : grade.course_name_en}</td>
                              <td className="p-2 text-center">{grade.credit_hours}</td>
                              <td className="p-2 text-center">
                                <Badge variant={grade.letter_grade === 'F' ? 'destructive' : 'secondary'}>
                                  {grade.letter_grade}
                                </Badge>
                              </td>
                              <td className="p-2 text-center font-bold">{grade.points.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
            </div>
          )}

          {selectedView === 'semester' && (
            <div className="space-y-6">
              {Array.from(groupedBySemester.entries()).map(([semesterKey, semesterGrades]) => {
                const semesterGPA = calculateGPA(semesterGrades);
                const [year, semester] = semesterKey.split('-');
                return (
                  <div key={semesterKey} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-kku-green dark:text-primary">
                        {semester} {year}
                      </h3>
                      <Badge variant="secondary" className="text-lg">
                        {language === 'ar' ? 'المعدل:' : 'GPA:'} {formatGPA(semesterGPA.gpa)}
                      </Badge>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-sm">
                          <th className="text-right p-2">{language === 'ar' ? 'رمز' : 'Code'}</th>
                          <th className="text-right p-2">{language === 'ar' ? 'المقرر' : 'Course'}</th>
                          <th className="text-center p-2">{language === 'ar' ? 'ساعات' : 'Hrs'}</th>
                          <th className="text-center p-2">{language === 'ar' ? 'التقدير' : 'Grade'}</th>
                          <th className="text-center p-2">{language === 'ar' ? 'النقاط' : 'Points'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semesterGrades.map((grade, idx) => (
                          <tr key={idx} className="border-b border-border hover:bg-accent/50">
                            <td className="p-2 font-mono text-sm">{grade.course_code}</td>
                            <td className="p-2 text-sm">{language === 'ar' ? grade.course_name_ar : grade.course_name_en}</td>
                            <td className="p-2 text-center">{grade.credit_hours}</td>
                            <td className="p-2 text-center">
                              <Badge variant={grade.letter_grade === 'F' ? 'destructive' : 'secondary'}>
                                {grade.letter_grade}
                              </Badge>
                            </td>
                            <td className="p-2 text-center font-bold">{grade.points.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Grade Scale Reference */}
      <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-xl font-bold text-kku-green dark:text-primary mb-4">
          {language === 'ar' ? 'مقياس التقديرات' : 'Grade Scale'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(GRADE_SCALE).map(([grade, data]) => (
            <div key={grade} className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-kku-green dark:text-primary mb-1">
                {grade}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {data.min}-{data.max}%
              </div>
              <div className="text-xs font-bold text-kku-gold">
                {data.points.toFixed(2)} {language === 'ar' ? 'نقطة' : 'pts'}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
