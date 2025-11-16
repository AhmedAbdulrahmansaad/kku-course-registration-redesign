import React, { useState } from 'react';
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
  TrendingUp
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

export const ReportsPage: React.FC = () => {
  const { language, userInfo, registeredCourses } = useApp();
  const [activeTab, setActiveTab] = useState('academic');

  // بيانات الطالب من الحساب الحالي
  const studentData = {
    studentId: userInfo?.id || '443200000',
    fullName: userInfo?.name || 'الطالب',
    major: userInfo?.major || 'نظم المعلومات الإدارية',
    gpa: 0.00,
    completedHours: 0,
    totalHours: 132,
  };

  // حساب المعدل من المقررات المسجلة (افتراضياً 4.50 للمقرر ال��كتمل)
  const currentSemesterGPA = registeredCourses.length > 0 
    ? (registeredCourses.reduce((sum, course) => sum + 4.50, 0) / registeredCourses.length).toFixed(2)
    : '0.00';

  const semesterGPAs = [
    { semester: 'الفصل الحالي', year: '2026-2025', gpa: parseFloat(currentSemesterGPA), hours: registeredCourses.reduce((sum, c) => sum + c.credits, 0) },
  ];

  const currentCourses = registeredCourses.map(course => ({
    code: course.code,
    name: language === 'ar' ? course.nameAr : course.nameEn,
    credits: course.credits,
    grade: '-',
    gpa: 0
  }));

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (format: 'pdf' | 'word' | 'excel') => {
    try {
      // Generate HTML content for the report
      const htmlContent = `
        ${generateExportHeader(
          language === 'ar' ? 'التقرير الأكاديمي' : 'Academic Report',
          language === 'ar' ? 'تقرير شامل عن الأداء الأكاديمي' : 'Comprehensive Academic Performance Report',
          {
            name: studentData.fullName,
            id: studentData.studentId,
            major: studentData.major,
            level: language === 'ar' ? 'المستوى الحالي' : 'Current Level',
            gpa: studentData.gpa,
            completedHours: studentData.completedHours,
            totalHours: studentData.totalHours
          },
          language
        )}
        
        <h3>${language === 'ar' ? 'معدلات الفصول الدراسية' : 'Semester GPAs'}</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${language === 'ar' ? 'الفصل' : 'Semester'}</th>
              <th>${language === 'ar' ? 'السنة' : 'Year'}</th>
              <th>${language === 'ar' ? 'الساعات' : 'Hours'}</th>
              <th>${language === 'ar' ? 'المعدل' : 'GPA'}</th>
            </tr>
          </thead>
          <tbody>
            ${semesterGPAs.map((sem, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${sem.semester}</td>
                <td>${sem.year}</td>
                <td>${sem.hours}</td>
                <td><strong>${sem.gpa.toFixed(2)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${currentCourses.length > 0 ? `
          <h3 style="margin-top: 30px;">${language === 'ar' ? 'المقررات الحالية' : 'Current Courses'}</h3>
          <table>
            <thead>
              <tr>
                <th>${language === 'ar' ? 'الرمز' : 'Code'}</th>
                <th>${language === 'ar' ? 'اسم المقرر' : 'Course Name'}</th>
                <th>${language === 'ar' ? 'الساعات' : 'Credits'}</th>
                <th>${language === 'ar' ? 'التقدير' : 'Grade'}</th>
              </tr>
            </thead>
            <tbody>
              ${currentCourses.map(course => `
                <tr>
                  <td>${course.code}</td>
                  <td>${course.name}</td>
                  <td>${course.credits}</td>
                  <td>${course.grade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
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
    } catch (error) {
      console.error('Error generating file:', error);
      toast.error(
        language === 'ar' 
          ? '❌ فشل تحميل الملف' 
          : '❌ Failed to download file'
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header with Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-8">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1748609160056-7b95f30041f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmFseXRpY3MlMjBkYXRhJTIwZGFzaGJvYXJkfGVufDF8fHx8MTc2Mjk2MjE2MXww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Reports"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/95 via-green-600/95 to-teal-600/95"></div>
        </div>

        <div className="relative z-10 text-center py-16 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-5 rounded-full animate-pulse">
              <FileText className="w-14 h-14" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            {language === 'ar' ? 'تقاريري الأكاديمية' : 'My Academic Reports'}
          </h1>
          
          <p className="text-xl opacity-90 mb-6">
            {language === 'ar' 
              ? 'تقارير شاملة عن أدائك الأكاديمي والإحصائيات الدراسية' 
              : 'Comprehensive reports on your academic performance and statistics'}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <DownloadButton
              onDownload={handleDownload}
              language={language}
              variant="default"
              className="bg-white text-emerald-600 hover:bg-white/90"
            />
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-white text-white hover:bg-white/20 gap-2"
            >
              <Printer className="w-4 h-4" />
              {language === 'ar' ? 'طباعة' : 'Print'}
            </Button>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'ar' ? 'اسم الطالب' : 'Student Name'}
            </p>
            <p className="font-bold">{studentData.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'ar' ? 'الرقم الجامعي' : 'Student ID'}
            </p>
            <p className="font-bold">{studentData.studentId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'ar' ? 'التخصص' : 'Major'}
            </p>
            <p className="font-bold">{studentData.major}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'ar' ? 'المعدل التراكمي' : 'GPA'}
            </p>
            <p className="text-2xl font-bold text-kku-green">{studentData.gpa.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {/* Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-kku-green" />
              <h3 className="font-bold">
                {language === 'ar' ? 'التقدم الدراسي' : 'Academic Progress'}
              </h3>
            </div>
            <Badge className="bg-kku-green text-white">
              {Math.round((studentData.completedHours / studentData.totalHours) * 100)}%
            </Badge>
          </div>
          <Progress value={(studentData.completedHours / studentData.totalHours) * 100} className="mb-2" />
          <p className="text-sm text-muted-foreground">
            {studentData.completedHours} / {studentData.totalHours} {language === 'ar' ? 'ساعة مكتملة' : 'hours completed'}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-kku-green" />
              <h3 className="font-bold">
                {language === 'ar' ? 'الأداء الأكاديمي' : 'Academic Performance'}
              </h3>
            </div>
            <Badge className="bg-kku-green text-white">
              {language === 'ar' ? 'ممتاز' : 'Excellent'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' 
              ? 'معدل تراكمي متميز، استمر في التفوق!'
              : 'Outstanding GPA, keep up the excellent work!'}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="academic">
            <BarChart3 className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'التقرير الأكاديمي' : 'Academic Report'}
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'تقرير الأداء' : 'Performance'}
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'المقررات' : 'Courses'}
          </TabsTrigger>
        </TabsList>

        {/* Academic Tab */}
        <TabsContent value="academic">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">
              {language === 'ar' ? 'عدلات الفصول الدراسية' : 'Semester GPAs'}
            </h2>
            <div className="space-y-4">
              {semesterGPAs.map((sem, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-kku-green text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{sem.semester}</p>
                      <p className="text-sm text-muted-foreground">{sem.year}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-kku-green">{sem.gpa.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {sem.hours} {language === 'ar' ? 'ساعة' : 'hours'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">
              {language === 'ar' ? 'توزيع التقديرات' : 'Grade Distribution'}
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{language === 'ar' ? 'تقدير A+' : 'Grade A+'}</span>
                  <span className="text-kku-green font-bold">18 {language === 'ar' ? 'مقرر' : 'courses'}</span>
                </div>
                <Progress value={62} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{language === 'ar' ? 'تقدير A' : 'Grade A'}</span>
                  <span className="text-kku-green font-bold">8 {language === 'ar' ? 'مقررات' : 'courses'}</span>
                </div>
                <Progress value={28} />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{language === 'ar' ? 'تقدير B+' : 'Grade B+'}</span>
                  <span className="text-kku-green font-bold">3 {language === 'ar' ? 'مقررات' : 'courses'}</span>
                </div>
                <Progress value={10} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">
              {language === 'ar' ? 'المقررات الحالية' : 'Current Courses'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3 font-semibold">
                      {language === 'ar' ? 'رمز المقرر' : 'Code'}
                    </th>
                    <th className="text-right p-3 font-semibold">
                      {language === 'ar' ? 'اسم المقرر' : 'Course Name'}
                    </th>
                    <th className="text-center p-3 font-semibold">
                      {language === 'ar' ? 'الساعات' : 'Credits'}
                    </th>
                    <th className="text-center p-3 font-semibold">
                      {language === 'ar' ? 'التقدير' : 'Grade'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentCourses.map((course, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">
                        <Badge variant="outline">{course.code}</Badge>
                      </td>
                      <td className="p-3 font-medium">{course.name}</td>
                      <td className="p-3 text-center">{course.credits}</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-kku-green text-white">
                          {course.grade}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};