/**
 * GPA Calculation Utilities
 * أدوات حساب المعدل التراكمي
 * النظام السعودي - من 5.00
 */

export interface GradeRecord {
  course_id: string;
  course_code: string;
  course_name_ar: string;
  course_name_en: string;
  credit_hours: number;
  letter_grade: string;
  percentage: number;
  points: number;
  semester: string;
  academic_year: string;
  level: number;
}

export interface GPACalculation {
  gpa: number;                    // المعدل التراكمي
  semester_gpa: number;           // معدل الفصل
  total_hours_registered: number; // إجمالي الساعات المسجلة
  total_hours_passed: number;     // الساعات المكتسبة
  total_hours_failed: number;     // الساعات الراسبة
  total_points: number;           // إجمالي النقاط
  academic_status: string;        // الحالة الأكاديمية
  academic_status_ar: string;
  completion_percentage: number;  // نسبة الإنجاز
  remaining_hours: number;        // الساعات المتبقية
}

/**
 * نظام التقديرات السعودي (من 5.00)
 */
export const GRADE_SCALE = {
  'A+': { min: 95, max: 100, points: 5.0 },
  'A':  { min: 90, max: 94.99, points: 4.75 },
  'B+': { min: 85, max: 89.99, points: 4.5 },
  'B':  { min: 80, max: 84.99, points: 4.0 },
  'C+': { min: 75, max: 79.99, points: 3.5 },
  'C':  { min: 70, max: 74.99, points: 3.0 },
  'D+': { min: 65, max: 69.99, points: 2.5 },
  'D':  { min: 60, max: 64.99, points: 2.0 },
  'F':  { min: 0, max: 59.99, points: 1.0 },
};

/**
 * تحويل النسبة المئوية إلى تقدير حرفي
 */
export const percentageToLetterGrade = (percentage: number): string => {
  for (const [grade, range] of Object.entries(GRADE_SCALE)) {
    if (percentage >= range.min && percentage <= range.max) {
      return grade;
    }
  }
  return 'F';
};

/**
 * تحويل التقدير الحرفي إلى نقاط
 */
export const letterGradeToPoints = (letterGrade: string): number => {
  return GRADE_SCALE[letterGrade as keyof typeof GRADE_SCALE]?.points || 1.0;
};

/**
 * تحديد الحالة الأكاديمية حسب المعدل
 */
export const getAcademicStatus = (gpa: number): { ar: string; en: string } => {
  if (gpa >= 4.5) {
    return { ar: 'ممتاز', en: 'Excellent' };
  } else if (gpa >= 3.75) {
    return { ar: 'جيد جداً (مرتفع)', en: 'Very Good (High)' };
  } else if (gpa >= 3.25) {
    return { ar: 'جيد جداً', en: 'Very Good' };
  } else if (gpa >= 2.75) {
    return { ar: 'جيد (مرتفع)', en: 'Good (High)' };
  } else if (gpa >= 2.25) {
    return { ar: 'جيد', en: 'Good' };
  } else if (gpa >= 2.0) {
    return { ar: 'مقبول (مرتفع)', en: 'Pass (High)' };
  } else if (gpa >= 1.5) {
    return { ar: 'مقبول', en: 'Pass' };
  } else {
    return { ar: 'إنذار أكاديمي', en: 'Academic Warning' };
  }
};

/**
 * حساب المعدل التراكمي (GPA)
 */
export const calculateGPA = (grades: GradeRecord[]): GPACalculation => {
  if (!grades || grades.length === 0) {
    return {
      gpa: 0,
      semester_gpa: 0,
      total_hours_registered: 0,
      total_hours_passed: 0,
      total_hours_failed: 0,
      total_points: 0,
      academic_status: 'No Data',
      academic_status_ar: 'لا توجد بيانات',
      completion_percentage: 0,
      remaining_hours: 130, // إجمالي ساعات البرنامج
    };
  }

  let totalPoints = 0;
  let totalHours = 0;
  let passedHours = 0;
  let failedHours = 0;

  grades.forEach(record => {
    const points = letterGradeToPoints(record.letter_grade);
    const weightedPoints = points * record.credit_hours;
    
    totalPoints += weightedPoints;
    totalHours += record.credit_hours;
    
    if (record.letter_grade !== 'F') {
      passedHours += record.credit_hours;
    } else {
      failedHours += record.credit_hours;
    }
  });

  const gpa = totalHours > 0 ? totalPoints / totalHours : 0;
  const status = getAcademicStatus(gpa);
  
  const TOTAL_PROGRAM_HOURS = 130; // إجمالي ساعات برنامج نظم المعلومات الإدارية
  const completionPercentage = (passedHours / TOTAL_PROGRAM_HOURS) * 100;
  const remainingHours = Math.max(0, TOTAL_PROGRAM_HOURS - passedHours);

  return {
    gpa: Math.round(gpa * 100) / 100, // تقريب لرقمين عشريين
    semester_gpa: gpa, // يمكن تحسينه لحساب معدل الفصل الحالي فقط
    total_hours_registered: totalHours,
    total_hours_passed: passedHours,
    total_hours_failed: failedHours,
    total_points: Math.round(totalPoints * 100) / 100,
    academic_status: status.en,
    academic_status_ar: status.ar,
    completion_percentage: Math.round(completionPercentage * 100) / 100,
    remaining_hours: remainingHours,
  };
};

/**
 * حساب معدل فصل معين
 */
export const calculateSemesterGPA = (
  grades: GradeRecord[],
  semester: string,
  academicYear: string
): number => {
  const semesterGrades = grades.filter(
    g => g.semester === semester && g.academic_year === academicYear
  );
  
  const result = calculateGPA(semesterGrades);
  return result.gpa;
};

/**
 * تجميع الدرجات حسب المستوى
 */
export const groupGradesByLevel = (grades: GradeRecord[]): Map<number, GradeRecord[]> => {
  const grouped = new Map<number, GradeRecord[]>();
  
  grades.forEach(grade => {
    const level = grade.level || 1;
    if (!grouped.has(level)) {
      grouped.set(level, []);
    }
    grouped.get(level)!.push(grade);
  });
  
  return grouped;
};

/**
 * تجميع الدرجات حسب الفصل الدراسي
 */
export const groupGradesBySemester = (
  grades: GradeRecord[]
): Map<string, GradeRecord[]> => {
  const grouped = new Map<string, GradeRecord[]>();
  
  grades.forEach(grade => {
    const key = `${grade.academic_year}-${grade.semester}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(grade);
  });
  
  return grouped;
};

/**
 * توليد بيانات درجات تجريبية (للاختبار)
 */
export const generateSampleGrades = (): GradeRecord[] => {
  return [
    // المستوى الأول - الفصل الأول 2023-2024
    {
      course_id: 'ARAB101',
      course_code: 'ARAB 101',
      course_name_ar: 'المهارات اللغوية',
      course_name_en: 'Arabic Language Skills',
      credit_hours: 3,
      letter_grade: 'A',
      percentage: 92,
      points: 4.75,
      semester: 'Fall',
      academic_year: '2023-2024',
      level: 1,
    },
    {
      course_id: 'ISLM101',
      course_code: 'ISLM 101',
      course_name_ar: 'الثقافة الإسلامية',
      course_name_en: 'Islamic Culture',
      credit_hours: 2,
      letter_grade: 'A+',
      percentage: 96,
      points: 5.0,
      semester: 'Fall',
      academic_year: '2023-2024',
      level: 1,
    },
    {
      course_id: 'MGT101',
      course_code: 'MGT 101',
      course_name_ar: 'مبادئ الإدارة',
      course_name_en: 'Introduction to Management',
      credit_hours: 3,
      letter_grade: 'B+',
      percentage: 87,
      points: 4.5,
      semester: 'Fall',
      academic_year: '2023-2024',
      level: 1,
    },
    {
      course_id: 'CIS101',
      course_code: 'CIS 101',
      course_name_ar: 'مقدمة في الحاسب الآلي',
      course_name_en: 'Introduction to Computer',
      credit_hours: 3,
      letter_grade: 'A',
      percentage: 91,
      points: 4.75,
      semester: 'Fall',
      academic_year: '2023-2024',
      level: 1,
    },
    {
      course_id: 'MATH101',
      course_code: 'MATH 101',
      course_name_ar: 'رياضيات الأعمال',
      course_name_en: 'Mathematics for Business',
      credit_hours: 3,
      letter_grade: 'B',
      percentage: 83,
      points: 4.0,
      semester: 'Fall',
      academic_year: '2023-2024',
      level: 1,
    },
    
    // المستوى الأول - الفصل الثاني 2023-2024
    {
      course_id: 'UNIV101',
      course_code: 'UNIV 101',
      course_name_ar: 'المهارات الجامعية',
      course_name_en: 'University Skills',
      credit_hours: 1,
      letter_grade: 'A+',
      percentage: 98,
      points: 5.0,
      semester: 'Spring',
      academic_year: '2023-2024',
      level: 1,
    },
    {
      course_id: 'ENGL101',
      course_code: 'ENGL 101',
      course_name_ar: 'اللغة الإنجليزية',
      course_name_en: 'English Language',
      credit_hours: 3,
      letter_grade: 'B+',
      percentage: 88,
      points: 4.5,
      semester: 'Spring',
      academic_year: '2023-2024',
      level: 1,
    },
    {
      course_id: 'ACCT101',
      course_code: 'ACCT 101',
      course_name_ar: 'مبادئ المحاسبة',
      course_name_en: 'Principles of Accounting',
      credit_hours: 3,
      letter_grade: 'A',
      percentage: 90,
      points: 4.75,
      semester: 'Spring',
      academic_year: '2023-2024',
      level: 1,
    },
    {
      course_id: 'ECON101',
      course_code: 'ECON 101',
      course_name_ar: 'مبادئ الاقتصاد',
      course_name_en: 'Principles of Economics',
      credit_hours: 3,
      letter_grade: 'B',
      percentage: 82,
      points: 4.0,
      semester: 'Spring',
      academic_year: '2023-2024',
      level: 1,
    },
    
    // المستوى الثاني - الفصل الأول 2024-2025
    {
      course_id: 'IS200',
      course_code: 'IS 200',
      course_name_ar: 'مقدمة في نظم المعلومات',
      course_name_en: 'Introduction to Information Systems',
      credit_hours: 3,
      letter_grade: 'A+',
      percentage: 95,
      points: 5.0,
      semester: 'Fall',
      academic_year: '2024-2025',
      level: 2,
    },
    {
      course_id: 'STAT201',
      course_code: 'STAT 201',
      course_name_ar: 'الإحصاء للأعمال',
      course_name_en: 'Statistics for Business',
      credit_hours: 3,
      letter_grade: 'B+',
      percentage: 86,
      points: 4.5,
      semester: 'Fall',
      academic_year: '2024-2025',
      level: 2,
    },
    {
      course_id: 'MKT201',
      course_code: 'MKT 201',
      course_name_ar: 'مبادئ التسويق',
      course_name_en: 'Principles of Marketing',
      credit_hours: 3,
      letter_grade: 'A',
      percentage: 93,
      points: 4.75,
      semester: 'Fall',
      academic_year: '2024-2025',
      level: 2,
    },
  ];
};

/**
 * تنسيق GPA للعرض
 */
export const formatGPA = (gpa: number): string => {
  return gpa.toFixed(2);
};

/**
 * الحصول على لون الحالة الأكاديمية
 */
export const getStatusColor = (gpa: number): string => {
  if (gpa >= 4.5) return '#22C55E'; // أخضر - ممتاز
  if (gpa >= 3.75) return '#10B981'; // أخضر زمردي - جيد جداً مرتفع
  if (gpa >= 3.25) return '#14B8A6'; // تركواز - جيد جداً
  if (gpa >= 2.75) return '#06B6D4'; // سماوي - جيد مرتفع
  if (gpa >= 2.25) return '#3B82F6'; // أزرق - جيد
  if (gpa >= 2.0) return '#F59E0B'; // برتقالي - مقبول مرتفع
  if (gpa >= 1.5) return '#F97316'; // برتقالي محروق - مقبول
  return '#EF4444'; // أحمر - إنذار
};
