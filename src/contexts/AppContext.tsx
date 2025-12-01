import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Theme } from '../types';

export interface Course {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  credits: number;
  instructor: string;
  time: string;
  room: string;
  department: string;
  level: number;
  capacity: number;
  enrolled: number;
  prerequisite?: string;
}

// ✅ إضافة نوع طلب التسجيل
export interface RegistrationRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseCode: string;
  courseName: string;
  section: string;
  time: string;
  credits: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
}

// ✅ إضافة نوع الإشعار
export interface Notification {
  id: string;
  userId: string;
  type: 'request' | 'approval' | 'rejection' | 'info';
  title: string;
  message: string;
  requestId?: string;
  read: boolean;
  createdAt: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  t: (key: string) => string;
  availableCourses: Course[];
  registeredCourses: Course[];
  setRegisteredCourses: (courses: Course[]) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  userInfo: { name: string; id: string; email: string; major: string; level?: number; gpa?: number; role?: string } | null;
  setUserInfo: (info: { name: string; id: string; email: string; major: string; level?: number; gpa?: number; role?: string } | null) => void;
  hasAcceptedAgreement: boolean;
  setHasAcceptedAgreement: (value: boolean) => void;
  // ✅ إضافة طلبات التسجيل والإشعارات
  registrationRequests: RegistrationRequest[];
  setRegistrationRequests: (requests: RegistrationRequest[]) => void;
  addRegistrationRequest: (request: Omit<RegistrationRequest, 'id' | 'requestDate' | 'status'>) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  unreadNotificationsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    about: 'عن المشروع',
    project: 'مراحل المشروع',
    projectPhases: 'مراحل التطوير',
    designMethodology: 'منهجية التصميم',
    howToRedesign: 'منهجية إعادة التصميم',
    news: 'الأخبار',
    contact: 'تواصل معنا',
    responsive: 'التصميم التجاوبي',
    accessibility: 'سهولة الوصول',
    privacy: 'سياسة الخصوصية',
    search: 'البحث',
    courses: 'المقررات المتاحة',
    schedule: 'الجدول الدراسي',
    transcript: 'السجل الأكاديمي',
    testing: 'مرحلة الاختبار',
    reports: 'تقاريري',
    documents: 'المستندات',
    notifications: 'الإشعارات',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    aiAssistant: 'المساعد الذكي',
    supervisorDashboard: 'لوحة المشرف',
    studentDashboard: 'لوحة التحكم',
    requests: 'طلبات التسجيل',
    curriculum: 'المنهج الدراسي',
    adminDashboard: 'لوحة المدير',
    manageCourses: 'إدارة المقررات',
    manageStudents: 'إدارة الطلاب',
    manageSupervisors: 'إدارة المشرفين',
    announcements: 'الإعلانات',
    messages: 'الرسائل',
    systemSettings: 'إعدادات النظام',
    systemTools: 'أدوات النظام',
    
    // Common
    back: 'رجوع',
    logout: 'تسجيل الخروج',
    welcome: 'مرحباً',
    loading: 'جاري التحميل...',
    submit: 'إرسال',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
  },
  en: {
    // Navigation
    home: 'Home',
    about: 'About',
    project: 'Project Phases',
    projectPhases: 'Development Phases',
    designMethodology: 'Design Methodology',
    howToRedesign: 'Redesign Methodology',
    news: 'News',
    contact: 'Contact',
    responsive: 'Responsive Design',
    accessibility: 'Accessibility',
    privacy: 'Privacy Policy',
    search: 'Search',
    courses: 'Available Courses',
    schedule: 'My Schedule',
    transcript: 'Transcript',
    testing: 'Testing Phase',
    reports: 'My Reports',
    documents: 'Documents',
    notifications: 'Notifications',
    login: 'Login',
    signup: 'Sign Up',
    aiAssistant: 'AI Assistant',
    supervisorDashboard: 'Supervisor Dashboard',
    studentDashboard: 'Student Dashboard',
    requests: 'Registration Requests',
    curriculum: 'Curriculum',
    adminDashboard: 'Admin Dashboard',
    manageCourses: 'Manage Courses',
    manageStudents: 'Manage Students',
    manageSupervisors: 'Manage Supervisors',
    announcements: 'Announcements',
    messages: 'Messages',
    systemSettings: 'System Settings',
    systemTools: 'System Tools',
    
    // Common
    back: 'Back',
    logout: 'Logout',
    welcome: 'Welcome',
    loading: 'Loading...',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
  },
};

// المقررات الحقيقية لقسم نظم المعلومات الإدارية - جامعة الملك خالد
// حسب الخطة الدراسية الرسمية
const allCourses: Course[] = [
  // ======= المستوى الأول =======
  { id: '101', code: 'ENGL101', nameAr: 'مهارات اللغة الإنجليزية (1)', nameEn: 'English Language Skills I', credits: 3, instructor: 'Dr. Sarah Ahmed', time: 'Sun, Tue 08:00-09:30', room: 'A101', department: 'Language', level: 1, capacity: 40, enrolled: 32 },
  { id: '102', code: 'ARAB101', nameAr: 'مهارات الاتصال', nameEn: 'Communication Skills', credits: 3, instructor: 'د. محمد العتيبي', time: 'Mon, Wed 08:00-09:30', room: 'A102', department: 'Language', level: 1, capacity: 40, enrolled: 35 },
  { id: '103', code: 'MATH110', nameAr: 'الرياضيات للإدارة', nameEn: 'Mathematics for Management', credits: 3, instructor: 'د. خالد الغامدي', time: 'Sun, Tue 10:00-11:30', room: 'B201', department: 'Math', level: 1, capacity: 45, enrolled: 40 },
  { id: '104', code: 'ISLM101', nameAr: 'المدخل إلى الثقافة الإسلامية', nameEn: 'Introduction to Islamic Culture', credits: 2, instructor: 'د. عبدالله السلمي', time: 'Thu 08:00-10:00', room: 'A201', department: 'Islamic', level: 1, capacity: 50, enrolled: 45 },
  { id: '105', code: 'CS100', nameAr: 'مقدمة في الحاسب الآلي', nameEn: 'Introduction to Computing', credits: 3, instructor: 'د. فاطمة الشهري', time: 'Mon, Wed 10:00-11:30', room: 'Lab1', department: 'CS', level: 1, capacity: 35, enrolled: 30 },
  { id: '106', code: 'MGT101', nameAr: 'مبادئ الإدارة', nameEn: 'Principles of Management', credits: 3, instructor: 'د. ماجد الشمري', time: 'Sun, Tue 13:00-14:30', room: 'C103', department: 'Business', level: 1, capacity: 40, enrolled: 33 },
  { id: '107', code: 'UNIV100', nameAr: 'المهارات الجامعية', nameEn: 'University Skills', credits: 2, instructor: 'د. نور الحربي', time: 'Wed 13:00-15:00', room: 'A105', department: 'General', level: 1, capacity: 50, enrolled: 42 },

  // ======= المستوى الثاني =======
  { id: '201', code: 'ENGL102', nameAr: 'مهارات اللغة الإنجليزية (2)', nameEn: 'English Language Skills II', credits: 3, instructor: 'Dr. Linda Brown', time: 'Sun, Tue 08:00-09:30', room: 'A103', department: 'Language', level: 2, capacity: 40, enrolled: 30, prerequisite: 'ENGL101' },
  { id: '202', code: 'STAT101', nameAr: 'مبادئ الإحصاء', nameEn: 'Principles of Statistics', credits: 3, instructor: 'د. أحمد القحطاني', time: 'Mon, Wed 08:00-09:30', room: 'B202', department: 'Math', level: 2, capacity: 40, enrolled: 28, prerequisite: 'MATH110' },
  { id: '203', code: 'ACC101', nameAr: 'مبادئ المحاسبة (1)', nameEn: 'Principles of Accounting I', credits: 3, instructor: 'د. عمر الزهراني', time: 'Sun, Tue 10:00-11:30', room: 'C101', department: 'Business', level: 2, capacity: 40, enrolled: 35 },
  { id: '204', code: 'ECON101', nameAr: 'مبادئ الاقتصاد الجزئي', nameEn: 'Principles of Microeconomics', credits: 3, instructor: 'د. منى الدوسري', time: 'Mon, Wed 10:00-11:30', room: 'C102', department: 'Business', level: 2, capacity: 40, enrolled: 30 },
  { id: '205', code: 'CS101', nameAr: 'البرمجة (1)', nameEn: 'Programming I', credits: 3, instructor: 'د. سارة العمري', time: 'Sun, Tue 13:00-14:30', room: 'Lab2', department: 'CS', level: 2, capacity: 35, enrolled: 32, prerequisite: 'CS100' },
  { id: '206', code: 'ISLM102', nameAr: 'الإسلام وبناء المجتمع', nameEn: 'Islam and Society Building', credits: 2, instructor: 'د. راشد القحطاني', time: 'Thu 10:00-12:00', room: 'A202', department: 'Islamic', level: 2, capacity: 50, enrolled: 40 },

  // ======= المستوى الثالث =======
  { id: '301', code: 'MIS200', nameAr: 'مقدمة في نظم المعلومات الإدارية', nameEn: 'Introduction to MIS', credits: 3, instructor: 'د. محمد رشيد', time: 'Sun, Tue 08:00-09:30', room: 'C201', department: 'MIS', level: 3, capacity: 40, enrolled: 35 },
  { id: '302', code: 'CS201', nameAr: 'البرمجة (2)', nameEn: 'Programming II', credits: 3, instructor: 'د. نواف الحربي', time: 'Mon, Wed 08:00-09:30', room: 'Lab3', department: 'CS', level: 3, capacity: 35, enrolled: 30, prerequisite: 'CS101' },
  { id: '303', code: 'CS220', nameAr: 'هياكل البيانات', nameEn: 'Data Structures', credits: 3, instructor: 'د. أحمد القحطاني', time: 'Sun, Tue 10:00-11:30', room: 'A301', department: 'CS', level: 3, capacity: 40, enrolled: 28, prerequisite: 'CS201' },
  { id: '304', code: 'ACC102', nameAr: 'مبادئ المحاسبة (2)', nameEn: 'Principles of Accounting II', credits: 3, instructor: 'د. فهد الغامدي', time: 'Mon, Wed 10:00-11:30', room: 'C104', department: 'Business', level: 3, capacity: 40, enrolled: 32, prerequisite: 'ACC101' },
  { id: '305', code: 'ECON102', nameAr: 'مبادئ الاقتصاد الكلي', nameEn: 'Principles of Macroeconomics', credits: 3, instructor: 'د. هند العمري', time: 'Sun, Tue 13:00-14:30', room: 'C105', department: 'Business', level: 3, capacity: 40, enrolled: 30, prerequisite: 'ECON101' },
  { id: '306', code: 'LAW101', nameAr: 'مبادئ القانون التجاري', nameEn: 'Principles of Commercial Law', credits: 2, instructor: 'د. سلطان الدوسري', time: 'Thu 08:00-10:00', room: 'A303', department: 'Business', level: 3, capacity: 45, enrolled: 38 },

  // ======= المستوى الرابع =======
  { id: '401', code: 'MIS210', nameAr: 'تحليل وتصميم النظم', nameEn: 'Systems Analysis and Design', credits: 3, instructor: 'د. خالد العتيبي', time: 'Sun, Tue 08:00-09:30', room: 'C210', department: 'MIS', level: 4, capacity: 40, enrolled: 30, prerequisite: 'MIS200' },
  { id: '402', code: 'CS250', nameAr: 'قواعد البيانات', nameEn: 'Database Systems', credits: 3, instructor: 'د. فاطمة الشهراني', time: 'Mon, Wed 08:00-09:30', room: 'Lab4', department: 'CS', level: 4, capacity: 35, enrolled: 32, prerequisite: 'CS220' },
  { id: '403', code: 'MIS220', nameAr: 'الشبكات والاتصالات', nameEn: 'Networks and Communications', credits: 3, instructor: 'د. عبدالرحمن الشمري', time: 'Sun, Tue 10:00-11:30', room: 'A402', department: 'MIS', level: 4, capacity: 40, enrolled: 28 },
  { id: '404', code: 'MGT201', nameAr: 'نظرية المنظمة', nameEn: 'Organization Theory', credits: 3, instructor: 'د. منال العمري', time: 'Mon, Wed 10:00-11:30', room: 'C106', department: 'Business', level: 4, capacity: 40, enrolled: 33, prerequisite: 'MGT101' },
  { id: '405', code: 'FIN101', nameAr: 'مبادئ الإدارة المالية', nameEn: 'Principles of Financial Management', credits: 3, instructor: 'د. بدر الزهراني', time: 'Sun, Tue 13:00-14:30', room: 'C107', department: 'Business', level: 4, capacity: 40, enrolled: 30 },
  { id: '406', code: 'MKT101', nameAr: 'مبادئ التسويق', nameEn: 'Principles of Marketing', credits: 3, instructor: 'د. ريم القحطاني', time: 'Mon, Wed 13:00-14:30', room: 'C108', department: 'Business', level: 4, capacity: 40, enrolled: 35 },

  // ======= المستوى الخامس =======
  { id: '501', code: 'MIS310', nameAr: 'برمجة تطبيقات الأعمال', nameEn: 'Business Applications Programming', credits: 3, instructor: 'د. طارق العتيبي', time: 'Sun, Tue 08:00-09:30', room: 'Lab5', department: 'MIS', level: 5, capacity: 35, enrolled: 28, prerequisite: 'CS201' },
  { id: '502', code: 'MIS320', nameAr: 'إدارة قواعد البيانات', nameEn: 'Database Management', credits: 3, instructor: 'د. ليل القحطاني', time: 'Mon, Wed 08:00-09:30', room: 'Lab6', department: 'MIS', level: 5, capacity: 35, enrolled: 30, prerequisite: 'CS250' },
  { id: '503', code: 'MIS330', nameAr: 'تطوير تطبيقات الويب', nameEn: 'Web Application Development', credits: 3, instructor: 'د. نواف الحربي', time: 'Sun, Tue 10:00-11:30', room: 'Lab7', department: 'MIS', level: 5, capacity: 30, enrolled: 25, prerequisite: 'MIS310' },
  { id: '504', code: 'STAT201', nameAr: 'الأساليب الكمية', nameEn: 'Quantitative Methods', credits: 3, instructor: 'د. سلمان الغامدي', time: 'Mon, Wed 10:00-11:30', room: 'B301', department: 'Math', level: 5, capacity: 40, enrolled: 32, prerequisite: 'STAT101' },
  { id: '505', code: 'MGT301', nameAr: 'السلوك التنظيمي', nameEn: 'Organizational Behavior', credits: 3, instructor: 'د. عائشة الشهري', time: 'Sun, Tue 13:00-14:30', room: 'C109', department: 'Business', level: 5, capacity: 40, enrolled: 30, prerequisite: 'MGT201' },
  { id: '506', code: 'HRM101', nameAr: 'إدارة الموارد البشرية', nameEn: 'Human Resource Management', credits: 3, instructor: 'د. وليد الدوسري', time: 'Mon, Wed 13:00-14:30', room: 'C110', department: 'Business', level: 5, capacity: 40, enrolled: 28 },

  // ======= المستوى السادس =======
  { id: '601', code: 'MIS410', nameAr: 'أمن المعلومات', nameEn: 'Information Security', credits: 3, instructor: 'د. ماجد الزهراني', time: 'Sun, Tue 08:00-09:30', room: 'A601', department: 'MIS', level: 6, capacity: 35, enrolled: 30, prerequisite: 'MIS220' },
  { id: '602', code: 'MIS420', nameAr: 'نظم دعم القرار', nameEn: 'Decision Support Systems', credits: 3, instructor: 'د. يوسف الشمري', time: 'Mon, Wed 08:00-09:30', room: 'C301', department: 'MIS', level: 6, capacity: 35, enrolled: 28, prerequisite: 'MIS200' },
  { id: '603', code: 'MIS430', nameAr: 'إدارة المشاريع التقنية', nameEn: 'IT Project Management', credits: 3, instructor: 'د. نورة الحربي', time: 'Sun, Tue 10:00-11:30', room: 'C302', department: 'MIS', level: 6, capacity: 40, enrolled: 32 },
  { id: '604', code: 'MIS440', nameAr: 'تطبيقات الأعمال الإلكترونية', nameEn: 'E-Business Applications', credits: 3, instructor: 'د. راشد الغامدي', time: 'Mon, Wed 10:00-11:30', room: 'Lab8', department: 'MIS', level: 6, capacity: 30, enrolled: 25, prerequisite: 'MIS330' },
  { id: '605', code: 'MGT401', nameAr: 'الإدارة الإستراتيجية', nameEn: 'Strategic Management', credits: 3, instructor: 'د. أمل الغامدي', time: 'Sun, Tue 13:00-14:30', room: 'C111', department: 'Business', level: 6, capacity: 40, enrolled: 30, prerequisite: 'MGT301' },
  { id: '606', code: 'MIS340', nameAr: 'تطوير تطبيقات الجوال', nameEn: 'Mobile Application Development', credits: 3, instructor: 'د. فهد الدوسري', time: 'Mon, Wed 13:00-14:30', room: 'Lab9', department: 'MIS', level: 6, capacity: 30, enrolled: 28, prerequisite: 'MIS330' },

  // ======= المستوى السابع =======
  { id: '701', code: 'MIS510', nameAr: 'ذكاء الأعمال', nameEn: 'Business Intelligence', credits: 3, instructor: 'د. بدر الزهراني', time: 'Sun, Tue 08:00-09:30', room: 'C401', department: 'MIS', level: 7, capacity: 35, enrolled: 30, prerequisite: 'MIS320' },
  { id: '702', code: 'MIS520', nameAr: 'إدارة المعرفة', nameEn: 'Knowledge Management', credits: 3, instructor: 'د. سعود الحربي', time: 'Mon, Wed 08:00-09:30', room: 'C402', department: 'MIS', level: 7, capacity: 35, enrolled: 28 },
  { id: '703', code: 'MIS530', nameAr: 'نظم المعلومات المحاسبية', nameEn: 'Accounting Information Systems', credits: 3, instructor: 'د. فيصل الزهراني', time: 'Sun, Tue 10:00-11:30', room: 'C403', department: 'MIS', level: 7, capacity: 40, enrolled: 32, prerequisite: 'ACC102' },
  { id: '704', code: 'MIS540', nameAr: 'إدارة علاقات العملاء', nameEn: 'Customer Relationship Management', credits: 3, instructor: 'د. عادل العتيبي', time: 'Mon, Wed 10:00-11:30', room: 'C404', department: 'MIS', level: 7, capacity: 35, enrolled: 25, prerequisite: 'MKT101' },
  { id: '705', code: 'MIS550', nameAr: 'تدقيق نظم المعلومات', nameEn: 'Information Systems Audit', credits: 3, instructor: 'د. ثامر القحطاني', time: 'Sun, Tue 13:00-14:30', room: 'C405', department: 'MIS', level: 7, capacity: 35, enrolled: 28, prerequisite: 'MIS410' },
  { id: '706', code: 'MIS598', nameAr: 'التدريب الميداني', nameEn: 'Field Training', credits: 3, instructor: 'د. محمد رشيد', time: 'TBA', room: 'Field', department: 'MIS', level: 7, capacity: 50, enrolled: 42 },

  // ======= المستوى الثامن =======
  { id: '801', code: 'MIS610', nameAr: 'إدارة تقنية المعلومات', nameEn: 'IT Management', credits: 3, instructor: 'د. إبراهيم الدوسري', time: 'Sun, Tue 08:00-09:30', room: 'C501', department: 'MIS', level: 8, capacity: 35, enrolled: 30 },
  { id: '802', code: 'MIS620', nameAr: 'حوكمة تقنية المعلومات', nameEn: 'IT Governance', credits: 3, instructor: 'د. خالد الزهراني', time: 'Mon, Wed 08:00-09:30', room: 'C502', department: 'MIS', level: 8, capacity: 30, enrolled: 25 },
  { id: '803', code: 'MIS630', nameAr: 'تحليل وتصميم نظم المعلومات المتقدمة', nameEn: 'Advanced Systems Analysis', credits: 3, instructor: 'د. جواهر الشمري', time: 'Sun, Tue 10:00-11:30', room: 'C503', department: 'MIS', level: 8, capacity: 35, enrolled: 28, prerequisite: 'MIS210' },
  { id: '804', code: 'MIS640', nameAr: 'الابتكار الرقمي', nameEn: 'Digital Innovation', credits: 3, instructor: 'د. سلطان الدوسري', time: 'Mon, Wed 10:00-11:30', room: 'C504', department: 'MIS', level: 8, capacity: 35, enrolled: 28 },
  { id: '805', code: 'MIS699', nameAr: 'مشروع التخرج', nameEn: 'Graduation Project', credits: 3, instructor: 'د. محمد رشيد', time: 'Thu 08:00-11:00', room: 'C505', department: 'MIS', level: 8, capacity: 40, enrolled: 38 },
  { id: '806', code: 'MIS650', nameAr: 'ندوة في نظم المعلومات', nameEn: 'Seminar in Information Systems', credits: 1, instructor: 'د. علي الشهري', time: 'Wed 13:00-14:00', room: 'Hall1', department: 'MIS', level: 8, capacity: 100, enrolled: 85 },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [theme, setThemeState] = useState<Theme>('light');
  const [currentPage, setCurrentPageState] = useState<string>('accessAgreement');
  const [registeredCourses, setRegisteredCourses] = useState<Course[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<{ name: string; id: string; email: string; major: string; level?: number; gpa?: number; role?: string } | null>(null);
  const [hasAcceptedAgreement, setHasAcceptedAgreementState] = useState<boolean>(false);
  // ✅ إضافة طلبات التسجيل والإشعارات
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // التحقق من تسجيل الدخول عند التحميل
  useEffect(() => {
    const agreementAccepted = localStorage.getItem('agreementAccepted');
    const savedUser = localStorage.getItem('userInfo');
    const savedLang = localStorage.getItem('language') as Language;
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedCourses = localStorage.getItem('registeredCourses');

    // تطبيق اللغة والثيم
    if (savedLang) setLanguageState(savedLang);
    if (savedTheme) setThemeState(savedTheme);

    // التحقق من تسجيل الدخول أولاً
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        console.log('🔄 [AppContext] Loading saved user from localStorage:', user);
        console.log('📊 [AppContext] User Level:', user.level);
        console.log('📊 [AppContext] User Major:', user.major);
        console.log('📊 [AppContext] User Role:', user.role);
        
        setUserInfo(user);
        setIsLoggedIn(true);
        
        const userRole = user.role || 'student';
        
        // ✅ المشرف والمدير لا يحتاجون للتعهد - يذهبون مباشرة للوحة التحكم
        if (userRole === 'admin') {
          setHasAcceptedAgreementState(true); // تخطي التعهد
          setCurrentPageState('adminDashboard');
          console.log('✅ [AppContext] Admin user - redirecting to adminDashboard');
          return;
        } else if (userRole === 'supervisor') {
          setHasAcceptedAgreementState(true); // تخطي التعهد
          setCurrentPageState('supervisorDashboard');
          console.log('✅ [AppContext] Supervisor user - redirecting to supervisorDashboard');
          return;
        }
        
        // ✅ الطالب يحتاج للتعهد
        if (agreementAccepted === 'true') {
          setHasAcceptedAgreementState(true);
          setCurrentPageState('studentDashboard');
          console.log('✅ [AppContext] Student user with agreement - redirecting to studentDashboard');
        } else {
          // لم يقبل التعهد - الذهاب لصفحة التعهد
          setCurrentPageState('accessAgreement');
          console.log('⚠️ [AppContext] Student user without agreement - redirecting to accessAgreement');
        }
      } catch (error) {
        console.error('⚠️ Error parsing user info from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('userInfo');
        localStorage.removeItem('access_token');
        localStorage.removeItem('isLoggedIn');
        setUserInfo(null);
        setIsLoggedIn(false);
        setCurrentPageState('accessAgreement');
      }
    } else {
      // ✅ لم يسجل دخول
      console.log('⚠️ [AppContext] No saved user found in localStorage');
      if (agreementAccepted === 'true') {
        setHasAcceptedAgreementState(true);
        // دع المستخدم في الصفحة التي هو فيها (login أو home)
      } else {
        // لم يقبل التعهد - الذهاب لصفحة التعهد
        setCurrentPageState('accessAgreement');
      }
    }

    if (savedCourses) {
      try {
        setRegisteredCourses(JSON.parse(savedCourses));
      } catch (error) {
        console.error('⚠️ Error parsing courses from localStorage:', error);
        localStorage.removeItem('registeredCourses');
      }
    }
  }, []);

  const setHasAcceptedAgreement = (value: boolean) => {
    setHasAcceptedAgreementState(value);
    if (value) {
      localStorage.setItem('agreementAccepted', 'true');
    } else {
      localStorage.removeItem('agreementAccepted');
    }
  };

  const setCurrentPage = (page: string) => {
    const protectedPages = ['courses', 'schedule', 'reports', 'documents', 'assistant', 'requests'];
    const agreementAccepted = localStorage.getItem('agreementAccepted');

    // ✅ منع المستخدم المسجل من الوصول لصفحات تسجيل الدخول أو التسجيل
    if ((page === 'login' || page === 'signup') && isLoggedIn && userInfo) {
      console.log('⚠️ User already logged in - Redirecting to dashboard');
      const userRole = userInfo.role || 'student';
      
      if (userRole === 'admin') {
        setCurrentPageState('adminDashboard');
      } else if (userRole === 'supervisor') {
        setCurrentPageState('supervisorDashboard');
      } else {
        setCurrentPageState('studentDashboard');
      }
      return;
    }

    // التحقق من التعهد للصفحات المحمية
    if (protectedPages.includes(page)) {
      if (agreementAccepted !== 'true') {
        console.log(' Access Agreement not accepted - Redirecting to agreement page');
        setCurrentPageState('accessAgreement');
        return;
      }
      
      if (!isLoggedIn) {
        console.log('❌ User not logged in - Redirecting to login page');
        localStorage.setItem('redirectAfterLogin', page);
        setCurrentPageState('login');
        return;
      }

      // التحقق من الأدوار
      if (page === 'requests') {
        const userRole = userInfo?.role || 'student';
        if (userRole !== 'supervisor' && userRole !== 'admin') {
          console.log('❌ Insufficient permissions for requests page');
          setCurrentPageState('home');
          return;
        }
      }
    }

    setCurrentPageState(page);
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (registeredCourses.length > 0) {
      localStorage.setItem('registeredCourses', JSON.stringify(registeredCourses));
    }
  }, [registeredCourses]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  // ✅ إضافة طلبات التسجيل والإشعارات
  const addRegistrationRequest = (request: Omit<RegistrationRequest, 'id' | 'requestDate' | 'status'>) => {
    const newRequest: RegistrationRequest = {
      id: Date.now().toString(),
      requestDate: new Date().toISOString(),
      status: 'pending',
      ...request,
    };
    setRegistrationRequests([...registrationRequests, newRequest]);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications([...notifications, newNotification]);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        currentPage,
        setCurrentPage,
        t,
        availableCourses: allCourses,
        registeredCourses,
        setRegisteredCourses,
        isLoggedIn,
        setIsLoggedIn,
        userInfo,
        setUserInfo,
        hasAcceptedAgreement,
        setHasAcceptedAgreement,
        // ✅ إضافة طلبات التسجيل والإشعارات
        registrationRequests,
        setRegistrationRequests,
        addRegistrationRequest,
        notifications,
        setNotifications,
        addNotification,
        markNotificationAsRead,
        unreadNotificationsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};