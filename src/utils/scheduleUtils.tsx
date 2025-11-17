/**
 * Schedule Utilities
 * أدوات مساعدة لتوليد الجدول الدراسي
 */

export interface ScheduleSlot {
  day: string;
  day_ar: string;
  time: string;
  course_code: string;
  course_name: string;
  course_name_ar: string;
  building: string;
  building_ar: string;
  room: string;
  room_ar: string;
  location: string;      // Combined building + room
  location_ar: string;   // Combined building + room in Arabic
  college: string;
  college_ar: string;
  instructor: string;
  instructor_ar: string;
  color: string;
  credit_hours: number;
}

// الأيام
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const days_ar = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

// الأوقات المتاحة
const timeSlots = [
  '08:00-09:30',
  '10:00-11:30',
  '12:00-13:30',
  '14:00-15:30',
  '15:30-17:00',
];

// المباني والقاعات
const buildings = [
  { name: 'Building A', name_ar: 'المبنى أ', rooms: ['101', '102', '103', '201', '202', '203', '301', '302'] },
  { name: 'Building B', name_ar: 'المبنى ب', rooms: ['101', '102', '201', '202', '301', '302'] },
  { name: 'Building C', name_ar: 'المبنى ج', rooms: ['101', '102', '103', '201', '202', '301'] },
  { name: 'IT Building', name_ar: 'مبنى تقنية المعلومات', rooms: ['L101', 'L102', 'L201', 'L202', 'L301'] },
];

// ألوان للمقررات
const courseColors = [
  '#184A2C',  // أخضر KKU الداكن
  '#D4AF37',  // ذهبي KKU
  '#22C55E',  // أخضر فاتح
  '#8B5CF6',  // بنفسجي
  '#F59E0B',  // برتقالي
  '#EC4899',  // وردي
  '#06B6D4',  // سماوي
  '#10B981',  // أخضر زمردي
  '#F97316',  // برتقالي محروق
  '#6366F1',  // نيلي
  '#14B8A6',  // تركواز
  '#EF4444',  // أحمر
];

/**
 * توليد جدول دراسي ديناميكي للطالب
 */
export const generateSchedule = (courses: any[]): ScheduleSlot[] => {
  const schedule: ScheduleSlot[] = [];
  const usedSlots = new Map<string, boolean>(); // لتتبع الأوقات المستخدمة

  courses.forEach((course, index) => {
    const color = courseColors[index % courseColors.length];
    
    // عدد الحصص حسب الساعات المعتمدة
    // 3 ساعات معتمدة = حصتين (يوم + يوم)
    // 2 ساعة معتمدة = حصة واحدة
    // 1 ساعة معتمدة = حصة واحدة
    const sessionsCount = course.credit_hours >= 3 ? 2 : 1;
    
    // اختيار مبنى حسب نوع المقرر
    let buildingIndex = 0;
    if (course.code.startsWith('CIS') || course.code.startsWith('MIS') || course.code.startsWith('IS')) {
      buildingIndex = 3; // IT Building
    } else if (course.code.startsWith('MGT') || course.code.startsWith('MKT')) {
      buildingIndex = 0; // Building A
    } else if (course.code.startsWith('ACCT') || course.code.startsWith('FIN')) {
      buildingIndex = 1; // Building B
    } else {
      buildingIndex = 2; // Building C
    }
    
    const building = buildings[buildingIndex];
    const room = building.rooms[index % building.rooms.length];
    
    // توزيع الحصص
    let assignedSessions = 0;
    let attemptDay = index % days.length; // ابدأ من يوم مختلف لكل مقرر
    let attemptTime = 0;
    
    while (assignedSessions < sessionsCount) {
      // جرب الأوقات المختلفة
      for (let t = attemptTime; t < timeSlots.length; t++) {
        const slotKey = `${days[attemptDay]}-${timeSlots[t]}`;
        
        // إذا كان الوقت متاح
        if (!usedSlots.has(slotKey)) {
          schedule.push({
            day: days[attemptDay],
            day_ar: days_ar[attemptDay],
            time: timeSlots[t],
            course_code: course.code,
            course_name: course.name_en,
            course_name_ar: course.name_ar,
            building: building.name,
            building_ar: building.name_ar,
            room: room,
            room_ar: `قاعة ${room}`,
            location: `${building.name}, Room ${room}`,
            location_ar: `${building.name_ar}، قاعة ${room}`,
            college: 'College of Business Administration',
            college_ar: 'كلية إدارة الأعمال',
            instructor: course.instructor || 'Dr. Faculty Member',
            instructor_ar: course.instructor_ar || course.instructor || 'د. عضو هيئة التدريس',
            color: color,
            credit_hours: course.credit_hours,
          });
          
          usedSlots.set(slotKey, true);
          assignedSessions++;
          attemptTime = t + 1; // حاول الوقت التالي للحصة التالية
          break;
        }
      }
      
      // إذا لم نجد وقت متاح في هذا اليوم، جرب اليوم التالي
      attemptDay = (attemptDay + 1) % days.length;
      attemptTime = 0;
      
      // حماية من التكرار اللانهائي
      if (usedSlots.size >= days.length * timeSlots.length) {
        break;
      }
    }
  });
  
  return schedule;
};

/**
 * الحصول على المقررات في يوم ووقت محدد
 */
export const getCourseAtSlot = (
  schedule: ScheduleSlot[],
  day: string,
  time: string
): ScheduleSlot | undefined => {
  return schedule.find(slot => slot.day === day && slot.time === time);
};

/**
 * الحصول على جميع المقررات في يوم محدد
 */
export const getCoursesForDay = (
  schedule: ScheduleSlot[],
  day: string
): ScheduleSlot[] => {
  return schedule.filter(slot => slot.day === day);
};

/**
 * حساب إجمالي الساعات المسجلة
 */
export const getTotalCreditHours = (courses: any[]): number => {
  return courses.reduce((total, course) => total + (course.credit_hours || 0), 0);
};

/**
 * الحصول على قائمة الأساتذة الفريدة
 */
export const getUniqueInstructors = (courses: any[]): string[] => {
  const instructors = new Set<string>();
  courses.forEach(course => {
    if (course.instructor) {
      instructors.add(course.instructor);
    }
  });
  return Array.from(instructors);
};

export { days, days_ar, timeSlots };