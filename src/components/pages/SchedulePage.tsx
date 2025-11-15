import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Clock, MapPin, Users, Download, Printer, BookOpen, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { jsPDF } from 'jspdf';

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
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
      // Colors
      const kkuGreen = [24, 74, 44];
      const kkuGold = [212, 175, 55];
      
      // Header
      pdf.setFillColor(...kkuGreen);
      pdf.rect(0, 0, 297, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text(language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University', 148.5, 10, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text(language === 'ar' ? 'الجدول الدراسي' : 'Course Schedule', 148.5, 18, { align: 'center' });
      
      // Student Info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      let yPos = 35;
      pdf.text(`${language === 'ar' ? 'الطالب:' : 'Student:'} ${userInfo.name || 'Student Name'}`, 15, yPos);
      pdf.text(`${language === 'ar' ? 'الرقم الجامعي:' : 'ID:'} ${userInfo.id || 'Student ID'}`, 15, yPos + 5);
      pdf.text(`${language === 'ar' ? 'الفصل الدراسي:' : 'Semester:'} 2025-2026`, 15, yPos + 10);
      
      yPos += 20;
      
      // Table
      const tableStartY = yPos;
      const colWidth = 44;
      const rowHeight = 25;
      
      // Table Header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, tableStartY, colWidth, rowHeight, 'FD');
      pdf.setFontSize(10);
      pdf.text(language === 'ar' ? 'الوقت' : 'Time', 15 + colWidth / 2, tableStartY + rowHeight / 2, { align: 'center' });
      
      const daysToUse = language === 'ar' ? days_ar : days;
      daysToUse.forEach((day, index) => {
        const x = 15 + colWidth + (index * colWidth);
        pdf.setFillColor(230, 245, 235);
        pdf.rect(x, tableStartY, colWidth, rowHeight, 'FD');
        pdf.setFontSize(9);
        pdf.text(day, x + colWidth / 2, tableStartY + rowHeight / 2, { align: 'center' });
      });
      
      // Table Body
      timeSlots.forEach((time, timeIndex) => {
        const y = tableStartY + rowHeight + (timeIndex * rowHeight);
        
        // Time column
        pdf.setFillColor(250, 250, 250);
        pdf.rect(15, y, colWidth, rowHeight, 'FD');
        pdf.setFontSize(8);
        pdf.text(time, 15 + colWidth / 2, y + rowHeight / 2, { align: 'center' });
        
        // Day columns
        days.forEach((day, dayIndex) => {
          const x = 15 + colWidth + (dayIndex * colWidth);
          const scheduleItem = getScheduleForDayAndTime(day, time);
          
          pdf.rect(x, y, colWidth, rowHeight, 'D');
          
          if (scheduleItem) {
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'bold');
            pdf.text(scheduleItem.course_code, x + 2, y + 6);
            
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(7);
            const courseName = language === 'ar' ? scheduleItem.course_name_ar : scheduleItem.course_name;
            const maxWidth = colWidth - 4;
            const lines = pdf.splitTextToSize(courseName, maxWidth);
            pdf.text(lines, x + 2, y + 11);
            
            pdf.setFontSize(6);
            const location = language === 'ar' ? scheduleItem.location_ar : scheduleItem.location;
            pdf.text(location, x + 2, y + rowHeight - 3);
          }
        });
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${language === 'ar' ? 'تاريخ الطباعة:' : 'Printed:'} ${new Date().toLocaleDateString()}`, 15, 200);
      
      pdf.save(`schedule_${new Date().getTime()}.pdf`);
      toast.success(language === 'ar' ? '✅ تم تحميل الجدول بنجاح!' : '✅ Schedule downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(language === 'ar' ? '❌ حدث خطأ أثناء إنشاء الملف' : '❌ Error generating PDF');
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
          <Button 
            variant="outline" 
            className="gap-2 border-kku-green text-kku-green hover:bg-kku-green/10 dark:border-primary dark:text-primary"
            onClick={downloadPDF}
          >
            <Download className="h-4 w-4" />
            {language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
          </Button>
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