/**
 * Academic Calculations Utility
 * نظام حساب الساعات الأكاديمية والمقررات
 * جامعة الملك خالد - نظام تسجيل المقررات
 */

// أنواع البيانات
export interface CourseRegistration {
  registration_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
  course?: {
    code: string;
    name_ar: string;
    name_en: string;
    credit_hours: number;
    level: number;
    prerequisites?: string[];
  };
}

export interface AcademicStats {
  totalRegisteredCourses: number; // عدد المقررات المسجلة
  totalApprovedCourses: number; // المقررات المقبولة
  totalPendingCourses: number; // قيد الانتظار
  totalRejectedCourses: number; // المرفوضة
  totalCreditHours: number; // إجمالي الساعات المقبولة
  pendingCreditHours: number; // الساعات قيد الانتظار
  remainingCreditHours: number; // الساعات المتبقية للمستوى
  progressPercentage: number; // نسبة التقدم
  levelRequiredHours: number; // الساعات المطلوبة للمستوى
  earnedHours: number; // الساعات المكتسبة من الفصول السابقة
  totalEarnedHours: number; // إجمالي الساعات المكتسبة
}

export interface AcademicAlert {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  timestamp: Date;
}

// الساعات المطلوبة لكل مستوى
export const LEVEL_REQUIREMENTS: Record<number, number> = {
  1: 15, // المستوى الأول: 15 ساعة
  2: 18, // المستوى الثاني: 18 ساعة
  3: 18, // المستوى الثالث: 18 ساعة
  4: 18, // المستوى الرابع: 18 ساعة
  5: 18, // المستوى الخامس: 18 ساعة
  6: 18, // المستوى السادس: 18 ساعة
  7: 15, // المستوى السابع: 15 ساعة
  8: 12, // المستوى الثامن: 12 ساعة
};

// الحد الأدنى والأعلى للساعات في الفصل
export const MIN_CREDIT_HOURS = 12;
export const MAX_CREDIT_HOURS = 21;
export const TOTAL_PROGRAM_HOURS = 132; // إجمالي ساعات البرنامج

/**
 * حساب الإحصائيات الأكاديمية للطالب
 */
export const calculateAcademicStats = (
  registrations: CourseRegistration[],
  studentLevel: number = 1,
  earnedHours: number = 0 // الساعات المكتسبة من الفصول السابقة
): AcademicStats => {
  // فلترة المقررات حسب الحالة
  const approvedCourses = registrations.filter(r => r.status === 'approved');
  const pendingCourses = registrations.filter(r => r.status === 'pending');
  const rejectedCourses = registrations.filter(r => r.status === 'rejected');

  // حساب الساعات المقبولة فقط
  const totalCreditHours = approvedCourses.reduce(
    (sum, r) => sum + (r.course?.credit_hours || 0),
    0
  );

  // حساب الساعات قيد الانتظار
  const pendingCreditHours = pendingCourses.reduce(
    (sum, r) => sum + (r.course?.credit_hours || 0),
    0
  );

  // الساعات المطلوبة للمستوى الحالي
  const levelRequiredHours = LEVEL_REQUIREMENTS[studentLevel] || 18;

  // الساعات المتبقية للمستوى
  const remainingCreditHours = Math.max(0, levelRequiredHours - totalCreditHours);

  // نسبة التقدم في المستوى
  const progressPercentage = Math.min(
    100,
    Math.round((totalCreditHours / levelRequiredHours) * 100)
  );

  // إجمالي الساعات المكتسبة (السابقة + الحالية)
  const totalEarnedHours = earnedHours + totalCreditHours;

  return {
    totalRegisteredCourses: registrations.length,
    totalApprovedCourses: approvedCourses.length,
    totalPendingCourses: pendingCourses.length,
    totalRejectedCourses: rejectedCourses.length,
    totalCreditHours,
    pendingCreditHours,
    remainingCreditHours,
    progressPercentage,
    levelRequiredHours,
    earnedHours,
    totalEarnedHours,
  };
};

/**
 * إنشاء التنبيهات الأكاديمية الذكية
 */
export const generateAcademicAlerts = (
  registrations: CourseRegistration[],
  studentLevel: number = 1,
  studentGPA: number = 0,
  language: 'ar' | 'en' = 'ar'
): AcademicAlert[] => {
  // ✅ التحقق من أن registrations هو array
  if (!Array.isArray(registrations)) {
    console.warn('⚠️ [generateAcademicAlerts] registrations is not an array:', registrations);
    return [];
  }

  // حساب الإحصائيات أولاً
  const stats = calculateAcademicStats(registrations, studentLevel, studentGPA);
  
  const alerts: AcademicAlert[] = [];
  const now = new Date();

  // تنبيه: أقل من الحد الأدنى للساعات
  if (
    stats.totalCreditHours > 0 &&
    stats.totalCreditHours < MIN_CREDIT_HOURS &&
    stats.totalPendingCourses === 0
  ) {
    alerts.push({
      id: 'low-credit-hours',
      type: 'warning',
      titleAr: '⚠️ عدد ساعات أقل من المطلوب',
      titleEn: '⚠️ Credit Hours Below Minimum',
      messageAr: `لقد سجلت ${stats.totalCreditHours} ساعة فقط. الحد الأدنى المطلوب هو ${MIN_CREDIT_HOURS} ساعة.`,
      messageEn: `You have registered only ${stats.totalCreditHours} credit hours. Minimum required is ${MIN_CREDIT_HOURS} hours.`,
      timestamp: now,
    });
  }

  // تنبيه: تجاوز الحد الأقصى للساعات
  if (stats.totalCreditHours > MAX_CREDIT_HOURS) {
    alerts.push({
      id: 'max-credit-hours',
      type: 'error',
      titleAr: '❌ تجاوزت الحد الأقصى للساعات',
      titleEn: '❌ Exceeded Maximum Credit Hours',
      messageAr: `لقد سجلت ${stats.totalCreditHours} ساعة. الحد الأقصى المسموح ${MAX_CREDIT_HOURS} ساعة.`,
      messageEn: `You have registered ${stats.totalCreditHours} credit hours. Maximum allowed is ${MAX_CREDIT_HOURS} hours.`,
      timestamp: now,
    });
  }

  // تنبيه: مقررات مرفوضة
  const rejectedCourses = registrations.filter(r => r.status === 'rejected');
  if (rejectedCourses.length > 0) {
    rejectedCourses.forEach(course => {
      alerts.push({
        id: `rejected-${course.course_id}`,
        type: 'error',
        titleAr: '❌ تم رفض التسجيل',
        titleEn: '❌ Registration Rejected',
        messageAr: `تم رفض تسجيلك في مقرر "${course.course?.name_ar || course.course_id}" من قبل المشرف الأكاديمي.`,
        messageEn: `Your registration for course "${course.course?.name_en || course.course_id}" was rejected by the academic advisor.`,
        timestamp: now,
      });
    });
  }

  // تنبيه: مقررات قيد الانتظار
  if (stats.totalPendingCourses > 0) {
    alerts.push({
      id: 'pending-courses',
      type: 'info',
      titleAr: '⏳ مقررات قيد الموافقة',
      titleEn: '⏳ Courses Pending Approval',
      messageAr: `لديك ${stats.totalPendingCourses} مقرر (${stats.pendingCreditHours} ساعة) قيد انتظار موافقة المشرف الأكاديمي.`,
      messageEn: `You have ${stats.totalPendingCourses} courses (${stats.pendingCreditHours} hours) pending academic advisor approval.`,
      timestamp: now,
    });
  }

  // تنبيه: إكمال نسبة من المستوى
  if (stats.progressPercentage >= 75 && stats.progressPercentage < 100) {
    alerts.push({
      id: 'progress-milestone',
      type: 'success',
      titleAr: '🎉 أحسنت! قاربت على الإنتهاء',
      titleEn: '🎉 Well Done! Almost Complete',
      messageAr: `أكملت ${stats.progressPercentage}% من متطلبات المستوى ${studentLevel}. بقي ${stats.remainingCreditHours} ساعة فقط!`,
      messageEn: `You completed ${stats.progressPercentage}% of Level ${studentLevel} requirements. Only ${stats.remainingCreditHours} hours remaining!`,
      timestamp: now,
    });
  }

  // تنبيه: إكمال المستوى
  if (stats.totalCreditHours >= stats.levelRequiredHours) {
    alerts.push({
      id: 'level-complete',
      type: 'success',
      titleAr: '✅ تهانينا! أكملت متطلبات المستوى',
      titleEn: '✅ Congratulations! Level Requirements Complete',
      messageAr: `أكملت جميع متطلبات المستوى ${studentLevel} بنجاح (${stats.totalCreditHours}/${stats.levelRequiredHours} ساعة).`,
      messageEn: `You successfully completed all Level ${studentLevel} requirements (${stats.totalCreditHours}/${stats.levelRequiredHours} hours).`,
      timestamp: now,
    });
  }

  // تنبيه: اقتراب التخرج
  const totalProgramProgress = (stats.totalEarnedHours / TOTAL_PROGRAM_HOURS) * 100;
  if (totalProgramProgress >= 90) {
    alerts.push({
      id: 'graduation-near',
      type: 'success',
      titleAr: '🎓 اقتربت من التخرج!',
      titleEn: '🎓 Close to Graduation!',
      messageAr: `أكملت ${stats.totalEarnedHours} من ${TOTAL_PROGRAM_HOURS} ساعة (${Math.round(totalProgramProgress)}%). مبروك، قاربت على التخرج!`,
      messageEn: `You completed ${stats.totalEarnedHours} of ${TOTAL_PROGRAM_HOURS} hours (${Math.round(totalProgramProgress)}%). Congratulations, you're close to graduation!`,
      timestamp: now,
    });
  }

  // تنبيه: لا يوجد تسجيل
  if (stats.totalRegisteredCourses === 0) {
    alerts.push({
      id: 'no-registration',
      type: 'warning',
      titleAr: '⚠️ لم تسجل أي مقررات',
      titleEn: '⚠️ No Courses Registered',
      messageAr: 'لم تقم بتسجيل أي مقررات حتى الآن. يرجى التسجيل في المقررات المطلوبة.',
      messageEn: 'You have not registered for any courses yet. Please register for required courses.',
      timestamp: now,
    });
  }

  return alerts;
};

/**
 * التحقق من تعارض الجدول
 */
export const checkScheduleConflicts = (
  registrations: CourseRegistration[]
): { hasConflict: boolean; conflicts: string[] } => {
  // هنا يمكن إضافة منطق للتحقق من التعارضات في الجدول
  // مثلاً: مقررين في نفس الوقت والتاريخ
  
  // للتبسيط، نعيد false الآن
  return {
    hasConflict: false,
    conflicts: [],
  };
};

/**
 * التحقق من المتطلبات السابقة
 */
export const checkPrerequisites = (
  courseId: string,
  completedCourses: string[]
): { satisfied: boolean; missingPrerequisites: string[] } => {
  // هنا يمكن إضافة منطق للتحقق من المتطلبات السابقة
  // مثلاً: هل الطالب أكمل المقررات المطلوبة؟
  
  // للتبسيط، نعيد true الآن
  return {
    satisfied: true,
    missingPrerequisites: [],
  };
};

/**
 * حساب المعدل التراكمي (GPA)
 */
export const calculateGPA = (
  courses: Array<{ credit_hours: number; grade: number }>
): number => {
  if (courses.length === 0) return 0;

  const totalPoints = courses.reduce(
    (sum, course) => sum + course.credit_hours * course.grade,
    0
  );
  const totalHours = courses.reduce(
    (sum, course) => sum + course.credit_hours,
    0
  );

  return totalHours > 0 ? Number((totalPoints / totalHours).toFixed(2)) : 0;
};

/**
 * الحصول على لون نسبة التقدم
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return 'bg-green-600';
  if (percentage >= 75) return 'bg-emerald-600';
  if (percentage >= 50) return 'bg-blue-600';
  if (percentage >= 25) return 'bg-yellow-600';
  return 'bg-red-600';
};

/**
 * الحصول على نص حالة التقدم
 */
export const getProgressStatus = (
  percentage: number,
  language: 'ar' | 'en'
): string => {
  if (percentage >= 100) {
    return language === 'ar' ? 'مكتمل' : 'Complete';
  }
  if (percentage >= 75) {
    return language === 'ar' ? 'متقدم جداً' : 'Very Advanced';
  }
  if (percentage >= 50) {
    return language === 'ar' ? 'متقدم' : 'Advanced';
  }
  if (percentage >= 25) {
    return language === 'ar' ? 'جيد' : 'Good';
  }
  return language === 'ar' ? 'ابدأ الآن' : 'Get Started';
};