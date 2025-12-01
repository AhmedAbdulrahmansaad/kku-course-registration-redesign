import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Clock, MapPin, Users, Printer, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
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
import {
  generateSchedule,
  getCourseAtSlot,
  getCoursesForDay,
  getTotalCreditHours,
  getUniqueInstructors,
  days,
  days_ar,
  timeSlots,
  type ScheduleSlot
} from '../../utils/scheduleUtils';
import { fetchJSON, getErrorMessage } from '../../utils/fetchWithTimeout';

export const SchedulePage: React.FC = () => {
  const { language, userInfo } = useApp();
  const [scheduleData, setScheduleData] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalInstructors, setTotalInstructors] = useState(0);

  useEffect(() => {
    fetchSchedule();
  }, [userInfo]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      console.log('📅 [Schedule] Fetching schedule for user:', userInfo);

      if (!userInfo?.id) {
        console.error('🚫 [Schedule] Access denied: User not logged in');
        toast.error(
          language === 'ar'
            ? 'يرجى تسجيل الدخول أولاً'
            : 'Please login first'
        );
        setScheduleData([]);
        setLoading(false);
        return;
      }

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        console.warn('⚠️ [Schedule] No access token found');
        toast.error(
          language === 'ar'
            ? 'يرجى تسجيل الدخول مرة أخرى'
            : 'Please login again'
        );
        setScheduleData([]);
        setLoading(false);
        return;
      }

      let approvedRegistrations: any[] = [];

      // ✅ Try backend first
      try {
        const result = await fetchJSON(
          `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/registrations`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            timeout: 10000,
          }
        );

        console.log('📚 [Schedule] Backend registrations response:', result);

        if (result.registrations) {
          approvedRegistrations = result.registrations.filter(
            (reg: any) => reg.status === 'approved'
          );
          console.log('✅ [Schedule] Loaded from backend:', approvedRegistrations.length);
        }
      } catch (backendError: any) {
        console.log('🔄 [Schedule] Backend offline, using localStorage');
      }

      // ✅ Fallback to localStorage if no backend data
      if (approvedRegistrations.length === 0) {
        const localRegs = JSON.parse(localStorage.getItem('kku_registrations') || '[]');
        const userEmail = userInfo?.email || '';
        
        approvedRegistrations = localRegs.filter(
          (reg: any) => 
            reg.studentEmail === userEmail && 
            reg.status === 'approved'
        );
        
        console.log('✅ [Schedule] Loaded from localStorage:', approvedRegistrations.length);
      }

      // ✅ Generate schedule
      if (approvedRegistrations.length === 0) {
        setScheduleData([]);
        setTotalCourses(0);
        setTotalHours(0);
        setTotalInstructors(0);
        return;
      }

      // استخراج المقررات من التسجيلات المقبولة
      const approvedCourses = approvedRegistrations
        .map((reg: any) => reg.course)
        .filter((course: any) => course != null);

      console.log('📚 [Schedule] Approved courses:', approvedCourses);

      // توليد الجدول الدراسي تلقائياً
      const schedule = generateSchedule(approvedCourses);
      console.log('🗓️ [Schedule] Generated schedule:', schedule);

      setScheduleData(schedule);
      setTotalCourses(approvedCourses.length);
      setTotalHours(getTotalCreditHours(approvedCourses));
      setTotalInstructors(getUniqueInstructors(approvedCourses).length);
    } catch (error: any) {
      console.error('❌ [Schedule] Error:', error);
      toast.error(
        language === 'ar' ? 'فشل في تحميل الجدول الدراسي' : 'Failed to load schedule'
      );
      setScheduleData([]);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForDayAndTime = (day: string, time: string) => {
    return scheduleData.find(item => item.day === day && item.time === time);
  };

  const downloadPDF = () => {
    try {
      const userInfoData = userInfo || {};
      
      // Generate schedule table HTML
      const scheduleHTML = `
        <table>
          <thead>
            <tr>
              <th>${language === 'ar' ? 'الوقت' : 'Time'}</th>
              ${(language === 'ar' ? days_ar : days).map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${timeSlots.map(time => `
              <tr>
                <td style="font-weight: bold; background-color: #f5f5f5;">${time}</td>
                ${days.map(day => {
                  const scheduleItem = getScheduleForDayAndTime(day, time);
                  if (scheduleItem) {
                    return `
                      <td style="background-color: #f0fdf4; padding: 8px;">
                        <strong>${scheduleItem.course_code}</strong><br/>
                        <span style="font-size: 0.9em;">${language === 'ar' ? scheduleItem.course_name_ar : scheduleItem.course_name}</span><br/>
                        <span style="font-size: 0.85em; color: #666;">📍 ${language === 'ar' ? `${scheduleItem.building_ar}، ${scheduleItem.room_ar}` : `${scheduleItem.building}, ${scheduleItem.room}`}</span><br/>
                        <span style="font-size: 0.85em; color: #666;">👨‍🏫 ${language === 'ar' ? scheduleItem.instructor_ar : scheduleItem.instructor}</span>
                      </td>
                    `;
                  } else {
                    return '<td style="background-color: #fafafa;"></td>';
                  }
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      
      // Generate full HTML content
      const htmlContent = `
        ${generateExportHeader(
          language === 'ar' ? 'الجدول الدراسي' : 'Course Schedule',
          language === 'ar' ? 'الفصل الدراسي 2025-2026' : 'Semester 2025-2026',
          {
            name: userInfoData.name || 'Student Name',
            id: userInfoData.id || 'Student ID',
            major: userInfoData.major || (language === 'ar' ? 'نظم المعلومات الإدارية' : 'Management Information Systems'),
            level: language === 'ar' ? 'المستوى الحالي' : 'Current Level'
          },
          language
        )}
        
        <div style="margin: 20px 0;">
          <h3>${language === 'ar' ? 'الجدول الأسبوعي' : 'Weekly Schedule'}</h3>
          ${scheduleHTML}
        </div>
        
        ${scheduleData.length > 0 ? `
          <div style="margin-top: 30px; page-break-before: always;">
            <h3>${language === 'ar' ? 'قائمة المقررات المسجلة' : 'Registered Courses List'}</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>${language === 'ar' ? 'رمز المقرر' : 'Code'}</th>
                  <th>${language === 'ar' ? 'اسم المقرر' : 'Course Name'}</th>
                  <th>${language === 'ar' ? 'الأستاذ' : 'Instructor'}</th>
                  <th>${language === 'ar' ? 'القاعة' : 'Room'}</th>
                  <th>${language === 'ar' ? 'الأيام' : 'Days'}</th>
                  <th>${language === 'ar' ? 'الوقت' : 'Time'}</th>
                </tr>
              </thead>
              <tbody>
                ${scheduleData.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${item.course_code}</strong></td>
                    <td>${language === 'ar' ? item.course_name_ar : item.course_name}</td>
                    <td>${language === 'ar' ? item.instructor_ar : item.instructor}</td>
                    <td>${item.location}</td>
                    <td>${language === 'ar' ? item.day_ar : item.day}</td>
                    <td>${item.time}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${generateExportFooter(language)}
      `;
      
      exportAsPDF(
        htmlContent,
        language === 'ar' ? 'الجدول_الدراسي' : 'Course_Schedule',
        language
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(
        language === 'ar' 
          ? '❌ فشل تحميل PDF' 
          : '❌ Failed to download PDF'
      );
    }
  };

  const handleDownload = async (format: 'pdf' | 'word' | 'excel') => {
    try {
      const userInfoData = userInfo || {};
      
      // Generate schedule table HTML
      const scheduleHTML = `
        <table>
          <thead>
            <tr>
              <th>${language === 'ar' ? 'الوقت' : 'Time'}</th>
              ${(language === 'ar' ? days_ar : days).map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${timeSlots.map(time => `
              <tr>
                <td style="font-weight: bold; background-color: #f5f5f5;">${time}</td>
                ${days.map(day => {
                  const scheduleItem = getScheduleForDayAndTime(day, time);
                  if (scheduleItem) {
                    return `
                      <td style="background-color: #f0fdf4; padding: 8px;">
                        <strong>${scheduleItem.course_code}</strong><br/>
                        <span style="font-size: 0.9em;">${language === 'ar' ? scheduleItem.course_name_ar : scheduleItem.course_name}</span><br/>
                        <span style="font-size: 0.85em; color: #666;">📍 ${language === 'ar' ? `${scheduleItem.building_ar}، ${scheduleItem.room_ar}` : `${scheduleItem.building}, ${scheduleItem.room}`}</span><br/>
                        <span style="font-size: 0.85em; color: #666;">👨‍🏫 ${language === 'ar' ? scheduleItem.instructor_ar : scheduleItem.instructor}</span>
                      </td>
                    `;
                  } else {
                    return '<td style="background-color: #fafafa;"></td>';
                  }
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      
      // Generate course list HTML
      const courseListHTML = scheduleData.length > 0 ? `
        <div style="margin-top: 30px;">
          <h3>${language === 'ar' ? 'قائمة المقررات المسجلة' : 'Registered Courses List'}</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${language === 'ar' ? 'رمز المقرر' : 'Code'}</th>
                <th>${language === 'ar' ? 'اسم المقرر' : 'Course Name'}</th>
                <th>${language === 'ar' ? 'الأستاذ' : 'Instructor'}</th>
                <th>${language === 'ar' ? 'القاعة' : 'Room'}</th>
                <th>${language === 'ar' ? 'الأيام' : 'Days'}</th>
                <th>${language === 'ar' ? 'الوقت' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleData.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${item.course_code}</strong></td>
                  <td>${language === 'ar' ? item.course_name_ar : item.course_name}</td>
                  <td>${language === 'ar' ? item.instructor_ar : item.instructor}</td>
                  <td>${item.location}</td>
                  <td>${language === 'ar' ? item.day_ar : item.day}</td>
                  <td>${item.time}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '';
      
      // Generate full HTML content
      const htmlContent = `
        ${generateExportHeader(
          language === 'ar' ? 'الجدول الدراسي' : 'Course Schedule',
          language === 'ar' ? 'الفصل الدراسي 2025-2026' : 'Semester 2025-2026',
          {
            name: userInfoData.name || 'Student Name',
            id: userInfoData.id || 'Student ID',
            major: userInfoData.major || (language === 'ar' ? 'نظم المعلومات الإدارية' : 'Management Information Systems'),
            level: language === 'ar' ? 'المستوى الحالي' : 'Current Level'
          },
          language
        )}
        
        <div style="margin: 20px 0;">
          <h3>${language === 'ar' ? 'الجدول الأسبوعي' : 'Weekly Schedule'}</h3>
          ${scheduleHTML}
        </div>
        
        ${courseListHTML}
        
        ${generateExportFooter(language)}
      `;
      
      const filename = language === 'ar' ? 'الجدول_الدراسي' : 'Course_Schedule';
      
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-kku-green dark:text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">
            {language === 'ar' ? 'جاري تحميل الجدول الدراسي...' : 'Loading schedule...'}
          </p>
        </div>
      </div>
    );
  }

  if (scheduleData.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <AlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'لا توجد مقررات مسجلة' : 'No Registered Courses'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'لم تقم بتسجيل أي مقررات بعد. يرجى الذهاب إلى صفحة المقررات لتسجيل مقرراتك.'
                : 'You have not registered for any courses yet. Please go to the Courses page to register for courses.'}
            </p>
          </div>

          <Button
            onClick={() => {
              const event = new CustomEvent('navigateTo', { detail: 'courses' });
              window.dispatchEvent(event);
            }}
            className="w-full bg-gradient-to-r from-[#184A2C] to-emerald-700"
          >
            {language === 'ar' ? 'تسجيل المقررات' : 'Register Courses'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Calendar className="h-10 w-10 text-kku-green dark:text-primary" />
          <h1 className="text-4xl font-bold gradient-text">
            {language === 'ar' ? 'الجدول الدراسي' : 'Course Schedule'}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          {language === 'ar' 
            ? 'جدولك الدراسي للفصل الدراسي الحالي' 
            : 'Your course schedule for the current semester'}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-kku-green/10 dark:bg-primary/10 rounded-full mb-3">
            <Calendar className="h-8 w-8 text-kku-green dark:text-primary" />
          </div>
          <div className="text-3xl font-bold text-kku-green dark:text-primary mb-1">{totalCourses}</div>
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'مقررات مسجلة' : 'Registered Courses'}
          </div>
        </Card>
        
        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-kku-gold/20 rounded-full mb-3">
            <Clock className="h-8 w-8 text-kku-gold" />
          </div>
          <div className="text-3xl font-bold text-kku-gold mb-1">{totalHours}</div>
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'ساعة معتمدة' : 'Credit Hours'}
          </div>
        </Card>
        
        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-green-500/10 rounded-full mb-3">
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-500 mb-1">{totalInstructors}</div>
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'أساتذة' : 'Instructors'}
          </div>
        </Card>
      </div>

      {/* Weekly Schedule Table - Desktop */}
      <Card className="p-6 overflow-x-auto hidden lg:block animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-2xl font-bold text-kku-green dark:text-primary mb-6">
          {language === 'ar' ? 'الجدول الأسبوعي' : 'Weekly Schedule'}
        </h2>
        
        <div className="min-w-[900px]" id="schedule-table">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border p-3 bg-muted/50 w-32">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-kku-gold" />
                    <span className="font-bold">{language === 'ar' ? 'الوقت' : 'Time'}</span>
                  </div>
                </th>
                {(language === 'ar' ? days_ar : days).map((day, index) => (
                  <th key={index} className="border border-border p-3 bg-gradient-to-br from-kku-green/5 to-kku-gold/5">
                    <span className="font-bold text-kku-green dark:text-primary">{day}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, timeIndex) => (
                <tr key={timeIndex}>
                  <td className="border border-border p-3 bg-muted/30 font-mono text-sm text-center font-medium">
                    {time}
                  </td>
                  {days.map((day, dayIndex) => {
                    const scheduleItem = getScheduleForDayAndTime(day, time);
                    
                    return (
                      <td key={dayIndex} className="border border-border p-2 hover:bg-accent/50 transition-colors">
                        {scheduleItem ? (
                          <div 
                            className="p-3 rounded-lg text-white h-full animate-scale-in"
                            style={{ 
                              background: `linear-gradient(135deg, ${scheduleItem.color} 0%, ${scheduleItem.color}dd 100%)`,
                              animationDelay: `${(timeIndex * days.length + dayIndex) * 0.02}s`
                            }}
                          >
                            <div className="font-mono font-bold text-sm mb-1">
                              {scheduleItem.course_code}
                            </div>
                            <div className="text-xs font-medium mb-2 opacity-90">
                              {language === 'ar' ? scheduleItem.course_name_ar : scheduleItem.course_name}
                            </div>
                            <div className="text-xs opacity-80 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{language === 'ar' ? scheduleItem.location_ar : scheduleItem.location}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 text-center text-muted-foreground text-xs">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* List View - Mobile */}
      <div className="space-y-4 lg:hidden">
        {days.map((day, dayIndex) => {
          const daySchedule = scheduleData.filter(item => item.day === day);
          
          if (daySchedule.length === 0) return null;
          
          return (
            <Card key={dayIndex} className="p-6 animate-fade-in" style={{ animationDelay: `${dayIndex * 0.1}s` }}>
              <h3 className="text-xl font-bold text-kku-green dark:text-primary mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {language === 'ar' ? days_ar[dayIndex] : day}
              </h3>
              
              <div className="space-y-3">
                {daySchedule.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="p-4 rounded-lg text-white animate-slide-in-right"
                    style={{ 
                      background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`,
                      animationDelay: `${itemIndex * 0.05}s`
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono font-bold">{item.course_code}</span>
                      <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                        {item.time}
                      </Badge>
                    </div>
                    <div className="font-medium mb-3">
                      {language === 'ar' ? item.course_name_ar : item.course_name}
                    </div>
                    <div className="space-y-1 text-sm opacity-90">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{language === 'ar' ? item.instructor_ar : item.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{language === 'ar' ? item.location_ar : item.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};