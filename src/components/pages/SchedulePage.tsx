import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Clock, MapPin, Users, Printer } from 'lucide-react';
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

interface ScheduleItem {
  day: string;
  day_ar: string;
  time: string;
  course_code: string;
  course_name: string;
  course_name_ar: string;
  location: string;
  location_ar: string;
  instructor: string;
  instructor_ar: string;
  color: string;
}

const scheduleData: ScheduleItem[] = [
  {
    day: 'Sunday',
    day_ar: 'الأحد',
    time: '10:00-11:30',
    course_code: 'CS301',
    course_name: 'Data Structures',
    course_name_ar: 'هياكل البيانات',
    location: 'Building A, Room 201',
    location_ar: 'المبنى أ، قاعة 201',
    instructor: 'Dr. Ahmed AlQahtani',
    instructor_ar: 'د. أحمد القحطاني',
    color: '#184A2C',
  },
  {
    day: 'Sunday',
    day_ar: 'الأحد',
    time: '13:00-14:30',
    course_code: 'CS310',
    course_name: 'Software Engineering',
    course_name_ar: 'هندسة البرمجيات',
    location: 'Building A, Room 305',
    location_ar: 'المبنى أ، قاعة 305',
    instructor: 'Dr. Mohammed AlGhamdi',
    instructor_ar: 'د. محمد الغامدي',
    color: '#D4AF37',
  },
  {
    day: 'Monday',
    day_ar: 'الاثنين',
    time: '10:00-11:30',
    course_code: 'IS320',
    course_name: 'Systems Analysis',
    course_name_ar: 'تحليل وتصميم النظم',
    location: 'Building C, Room 210',
    location_ar: 'المبنى ج، قاعة 210',
    instructor: 'Dr. Sara AlOtaibi',
    instructor_ar: 'د. سارة العتيبي',
    color: '#22C55E',
  },
  {
    day: 'Monday',
    day_ar: 'الاثنين',
    time: '13:00-14:30',
    course_code: 'CS350',
    course_name: 'Artificial Intelligence',
    course_name_ar: 'الذكاء الاصطناعي',
    location: 'Building A, Room 401',
    location_ar: 'المبنى أ، قاعة 401',
    instructor: 'Dr. Nasser AlBahhar',
    instructor_ar: 'د. نصر البحار',
    color: '#8B5CF6',
  },
  {
    day: 'Tuesday',
    day_ar: 'الثلاثاء',
    time: '10:00-11:30',
    course_code: 'CS301',
    course_name: 'Data Structures',
    course_name_ar: 'هياكل البيانات',
    location: 'Building A, Room 201',
    location_ar: 'المبنى أ، قاعة 201',
    instructor: 'Dr. Ahmed AlQahtani',
    instructor_ar: 'د. أحمد القحطاني',
    color: '#184A2C',
  },
  {
    day: 'Tuesday',
    day_ar: 'الثلاثاء',
    time: '13:00-14:30',
    course_code: 'CS310',
    course_name: 'Software Engineering',
    course_name_ar: 'هندسة البرمجيات',
    location: 'Building A, Room 305',
    location_ar: 'المبنى أ، قاعة 305',
    instructor: 'Dr. Mohammed AlGhamdi',
    instructor_ar: 'د. محمد الغامدي',
    color: '#D4AF37',
  },
  {
    day: 'Wednesday',
    day_ar: 'الأربعاء',
    time: '10:00-11:30',
    course_code: 'IS320',
    course_name: 'Systems Analysis',
    course_name_ar: 'تحليل وتصميم النظم',
    location: 'Building C, Room 210',
    location_ar: 'المبنى ج، قاعة 210',
    instructor: 'Dr. Sara AlOtaibi',
    instructor_ar: 'د. سارة العتيبي',
    color: '#22C55E',
  },
  {
    day: 'Wednesday',
    day_ar: 'الأربعاء',
    time: '13:00-14:30',
    course_code: 'CS350',
    course_name: 'Artificial Intelligence',
    course_name_ar: 'الذكاء الاصطناعي',
    location: 'Building A, Room 401',
    location_ar: 'المبنى أ، قاعة 401',
    instructor: 'Dr. Nasser AlBahhar',
    instructor_ar: 'د. نصر البحار',
    color: '#8B5CF6',
  },
];

const timeSlots = [
  '08:00-09:30',
  '10:00-11:30',
  '12:00-13:30',
  '13:00-14:30',
  '15:00-16:30',
];

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const days_ar = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export const SchedulePage: React.FC = () => {
  const { language } = useApp();

  const getScheduleForDayAndTime = (day: string, time: string) => {
    return scheduleData.find(item => item.day === day && item.time === time);
  };

  const downloadPDF = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
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
                        <span style="font-size: 0.85em; color: #666;">📍 ${scheduleItem.location}</span><br/>
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
            name: userInfo.name || 'Student Name',
            id: userInfo.id || 'Student ID',
            major: userInfo.major || (language === 'ar' ? 'نظم المعلومات الإدارية' : 'Management Information Systems'),
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
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
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
                        <span style="font-size: 0.85em; color: #666;">📍 ${scheduleItem.location}</span><br/>
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
            name: userInfo.name || 'Student Name',
            id: userInfo.id || 'Student ID',
            major: userInfo.major || (language === 'ar' ? 'نظم المعلومات الإدارية' : 'Management Information Systems'),
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
          <div className="text-3xl font-bold text-kku-green dark:text-primary mb-1">4</div>
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'مقررات مسجلة' : 'Registered Courses'}
          </div>
        </Card>
        
        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-kku-gold/20 rounded-full mb-3">
            <Clock className="h-8 w-8 text-kku-gold" />
          </div>
          <div className="text-3xl font-bold text-kku-gold mb-1">12</div>
          <div className="text-sm text-muted-foreground">
            {language === 'ar' ? 'ساعة معتمدة' : 'Credit Hours'}
          </div>
        </Card>
        
        <Card className="p-6 text-center hover-lift pattern-bg">
          <div className="inline-flex p-4 bg-green-500/10 rounded-full mb-3">
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-500 mb-1">4</div>
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