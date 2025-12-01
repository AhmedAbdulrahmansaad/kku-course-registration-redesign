// ========================================
// جميع الأقسام والتخصصات في كلية إدارة الأعمال - جامعة الملك خالد
// College of Business Administration - King Khalid University
// ========================================

export interface Department {
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
}

export interface Major {
  code: string;
  name_ar: string;
  name_en: string;
  department_code: string;
  total_credits: number;
  duration_years: number;
}

// ========================================
// الأقسام (Departments)
// ========================================
export const DEPARTMENTS: Department[] = [
  {
    code: 'MIS',
    name_ar: 'نظم المعلومات الإدارية',
    name_en: 'Management Information Systems',
    description_ar: 'قسم نظم المعلومات الإدارية يهتم بدراسة تطبيقات تقنية المعلومات في بيئة الأعمال',
    description_en: 'Management Information Systems department focuses on IT applications in business environment',
  },
  {
    code: 'BA',
    name_ar: 'إدارة الأعمال',
    name_en: 'Business Administration',
    description_ar: 'قسم إدارة الأعمال يركز على المهارات الإدارية والقيادية في منظمات الأعمال',
    description_en: 'Business Administration department focuses on managerial and leadership skills',
  },
  {
    code: 'ACC',
    name_ar: 'المحاسبة',
    name_en: 'Accounting',
    description_ar: 'قسم المحاسبة يختص بدراسة المعايير المحاسبية والتقارير المالية',
    description_en: 'Accounting department specializes in accounting standards and financial reporting',
  },
  {
    code: 'MKT',
    name_ar: 'التسويق',
    name_en: 'Marketing',
    description_ar: 'قسم التسويق يهتم بدراسة استراتيجيات التسويق وسلوك المستهلك',
    description_en: 'Marketing department focuses on marketing strategies and consumer behavior',
  },
  {
    code: 'FIN',
    name_ar: 'التمويل',
    name_en: 'Finance',
    description_ar: 'قسم التمويل يختص بدراسة الاستثمارات والتمويل المؤسسي',
    description_en: 'Finance department specializes in investments and corporate finance',
  },
  {
    code: 'HRM',
    name_ar: 'إدارة الموارد البشرية',
    name_en: 'Human Resources Management',
    description_ar: 'قسم إدارة الموارد البشرية يركز على تطوير وإدارة الكوادر البشرية',
    description_en: 'HRM department focuses on developing and managing human capital',
  },
  {
    code: 'SCM',
    name_ar: 'إدارة سلاسل الإمداد',
    name_en: 'Supply Chain Management',
    description_ar: 'قسم إدارة سلاسل الإمداد يهتم بإدارة العمليات اللوجستية',
    description_en: 'SCM department focuses on logistics and operations management',
  },
  {
    code: 'ECOM',
    name_ar: 'التجارة الإلكترونية',
    name_en: 'E-Commerce',
    description_ar: 'قسم التجارة الإلكترونية يختص بدراسة الأعمال الرقمية والتسويق الإلكتروني',
    description_en: 'E-Commerce department specializes in digital business and online marketing',
  },
];

// ========================================
// التخصصات (Majors)
// ========================================
export const MAJORS: Major[] = [
  // نظم المعلومات الإدارية
  {
    code: 'MIS',
    name_ar: 'نظم المعلومات الإدارية',
    name_en: 'Management Information Systems',
    department_code: 'MIS',
    total_credits: 140,
    duration_years: 4,
  },
  {
    code: 'MIS-DS',
    name_ar: 'نظم المعلومات الإدارية - علم البيانات',
    name_en: 'Management Information Systems - Data Science',
    department_code: 'MIS',
    total_credits: 140,
    duration_years: 4,
  },
  {
    code: 'MIS-CS',
    name_ar: 'نظم المعلومات الإدارية - الأمن السيبراني',
    name_en: 'Management Information Systems - Cybersecurity',
    department_code: 'MIS',
    total_credits: 140,
    duration_years: 4,
  },
  
  // إدارة الأعمال
  {
    code: 'BA',
    name_ar: 'إدارة الأعمال',
    name_en: 'Business Administration',
    department_code: 'BA',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'BA-ENT',
    name_ar: 'إدارة الأعمال - ريادة الأعمال',
    name_en: 'Business Administration - Entrepreneurship',
    department_code: 'BA',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'BA-INT',
    name_ar: 'إدارة الأعمال الدولية',
    name_en: 'International Business Administration',
    department_code: 'BA',
    total_credits: 132,
    duration_years: 4,
  },
  
  // المحاسبة
  {
    code: 'ACC',
    name_ar: 'المحاسبة',
    name_en: 'Accounting',
    department_code: 'ACC',
    total_credits: 135,
    duration_years: 4,
  },
  {
    code: 'ACC-AUD',
    name_ar: 'المحاسبة والمراجعة',
    name_en: 'Accounting and Auditing',
    department_code: 'ACC',
    total_credits: 135,
    duration_years: 4,
  },
  {
    code: 'ACC-TAX',
    name_ar: 'المحاسبة الضريبية',
    name_en: 'Tax Accounting',
    department_code: 'ACC',
    total_credits: 135,
    duration_years: 4,
  },
  
  // التسويق
  {
    code: 'MKT',
    name_ar: 'التسويق',
    name_en: 'Marketing',
    department_code: 'MKT',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'MKT-DIG',
    name_ar: 'التسويق الرقمي',
    name_en: 'Digital Marketing',
    department_code: 'MKT',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'MKT-RET',
    name_ar: 'التسويق والتجزئة',
    name_en: 'Marketing and Retail',
    department_code: 'MKT',
    total_credits: 132,
    duration_years: 4,
  },
  
  // التمويل
  {
    code: 'FIN',
    name_ar: 'التمويل',
    name_en: 'Finance',
    department_code: 'FIN',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'FIN-INV',
    name_ar: 'التمويل والاستثمار',
    name_en: 'Finance and Investment',
    department_code: 'FIN',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'FIN-BANK',
    name_ar: 'التمويل والخدمات المصرفية',
    name_en: 'Finance and Banking',
    department_code: 'FIN',
    total_credits: 132,
    duration_years: 4,
  },
  
  // إدارة الموارد البشرية
  {
    code: 'HRM',
    name_ar: 'إدارة الموارد البشرية',
    name_en: 'Human Resources Management',
    department_code: 'HRM',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'HRM-DEV',
    name_ar: 'إدارة الموارد البشرية والتطوير',
    name_en: 'HRM and Development',
    department_code: 'HRM',
    total_credits: 132,
    duration_years: 4,
  },
  
  // إدارة سلاسل الإمداد
  {
    code: 'SCM',
    name_ar: 'إدارة سلاسل الإمداد',
    name_en: 'Supply Chain Management',
    department_code: 'SCM',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'SCM-LOG',
    name_ar: 'إدارة سلاسل الإمداد واللوجستيات',
    name_en: 'Supply Chain and Logistics Management',
    department_code: 'SCM',
    total_credits: 132,
    duration_years: 4,
  },
  
  // التجارة الإلكترونية
  {
    code: 'ECOM',
    name_ar: 'التجارة الإلكترونية',
    name_en: 'E-Commerce',
    department_code: 'ECOM',
    total_credits: 132,
    duration_years: 4,
  },
  {
    code: 'ECOM-DIG',
    name_ar: 'التجارة الإلكترونية والأعمال الرقمية',
    name_en: 'E-Commerce and Digital Business',
    department_code: 'ECOM',
    total_credits: 132,
    duration_years: 4,
  },
];

// ========================================
// التخصصات بصيغة مناسبة للـ Select Component
// ========================================
export const MAJORS_FOR_SELECT = [
  // نظم المعلومات الإدارية
  { value: 'Management Information Systems', label: '🎯 نظم المعلومات الإدارية - MIS', icon: '🎯' },
  { value: 'MIS - Data Science', label: '📊 نظم المعلومات - علم البيانات - MIS Data Science', icon: '📊' },
  { value: 'MIS - Cybersecurity', label: '🔒 نظم المعلومات - الأمن السيبراني - MIS Cybersecurity', icon: '🔒' },
  
  // إدارة الأعمال
  { value: 'Business Administration', label: '💼 إدارة الأعمال - Business Administration', icon: '💼' },
  { value: 'BA - Entrepreneurship', label: '🚀 إدارة الأعمال - ريادة الأعمال - Entrepreneurship', icon: '🚀' },
  { value: 'International Business', label: '🌍 إدارة الأعمال الدولية - International Business', icon: '🌍' },
  
  // المحاسبة
  { value: 'Accounting', label: '📊 المحاسبة - Accounting', icon: '📊' },
  { value: 'Accounting and Auditing', label: '🔍 المحاسبة والمراجعة - Accounting & Auditing', icon: '🔍' },
  { value: 'Tax Accounting', label: '💰 المحاسبة الضريبية - Tax Accounting', icon: '💰' },
  
  // التسويق
  { value: 'Marketing', label: '📈 التسويق - Marketing', icon: '📈' },
  { value: 'Digital Marketing', label: '📱 التسويق الرقمي - Digital Marketing', icon: '📱' },
  { value: 'Marketing and Retail', label: '🛍️ التسويق والتجزئة - Marketing & Retail', icon: '🛍️' },
  
  // التمويل
  { value: 'Finance', label: '💵 التمويل - Finance', icon: '💵' },
  { value: 'Finance and Investment', label: '💹 التمويل والاستثمار - Finance & Investment', icon: '💹' },
  { value: 'Finance and Banking', label: '🏦 التمويل والخدمات المصرفية - Finance & Banking', icon: '🏦' },
  
  // إدارة الموارد البشرية
  { value: 'Human Resources Management', label: '👥 إدارة الموارد البشرية - HRM', icon: '👥' },
  { value: 'HRM and Development', label: '📈 إدارة الموارد البشرية والتطوير - HRM & Development', icon: '📈' },
  
  // إدارة سلاسل الإمداد
  { value: 'Supply Chain Management', label: '📦 إدارة سلاسل الإمداد - Supply Chain', icon: '📦' },
  { value: 'Supply Chain and Logistics', label: '🚚 سلاسل الإمداد واللوجستيات - SCM & Logistics', icon: '🚚' },
  
  // التجارة الإلكترونية
  { value: 'E-Commerce', label: '🛒 التجارة الإلكترونية - E-Commerce', icon: '🛒' },
  { value: 'E-Commerce and Digital Business', label: '💻 التجارة الإلكترونية والأعمال الرقمية - E-Commerce & Digital', icon: '💻' },
];

// ========================================
// دالة للحصول على القسم حسب الكود
// ========================================
export const getDepartmentByCode = (code: string): Department | undefined => {
  return DEPARTMENTS.find(dept => dept.code === code);
};

// ========================================
// دالة للحصول على التخصص حسب الكود
// ========================================
export const getMajorByCode = (code: string): Major | undefined => {
  return MAJORS.find(major => major.code === code);
};

// ========================================
// دالة للحصول على التخصصات حسب القسم
// ========================================
export const getMajorsByDepartment = (departmentCode: string): Major[] => {
  return MAJORS.filter(major => major.department_code === departmentCode);
};

// ========================================
// المستويات الدراسية
// ========================================
export const ACADEMIC_LEVELS = [
  { value: '1', label_ar: 'المستوى الأول', label_en: 'Level 1', label: '📚 المستوى الأول - Level 1' },
  { value: '2', label_ar: 'المستوى الثاني', label_en: 'Level 2', label: '📘 المستوى الثاني - Level 2' },
  { value: '3', label_ar: 'المستوى الثالث', label_en: 'Level 3', label: '📙 المستوى الثالث - Level 3' },
  { value: '4', label_ar: 'المستوى الرابع', label_en: 'Level 4', label: '📕 المستوى الرابع - Level 4' },
  { value: '5', label_ar: 'المستوى الخامس', label_en: 'Level 5', label: '📗 المستوى الخامس - Level 5' },
  { value: '6', label_ar: 'المستوى السادس', label_en: 'Level 6', label: '📓 المستوى السادس - Level 6' },
  { value: '7', label_ar: 'المستوى السابع', label_en: 'Level 7', label: '📔 المستوى السابع - Level 7' },
  { value: '8', label_ar: 'المستوى الثامن', label_en: 'Level 8', label: '📖 المستوى الثامن - Level 8' },
];

// ========================================
// الأدوار (Roles)
// ========================================
export const USER_ROLES = [
  { 
    value: 'student', 
    label_ar: 'طالب', 
    label_en: 'Student',
    label: '🎓 طالب - Student',
    icon: '🎓',
    description: 'حساب طالب للوصول إلى المقررات والتسجيل - Student account to access courses and registration',
  },
  { 
    value: 'supervisor', 
    label_ar: 'مشرف أكاديمي', 
    label_en: 'Academic Supervisor',
    label: '👨‍🏫 مشرف أكاديمي - Supervisor',
    icon: '👨‍🏫',
    description: 'حساب مشرف للموافقة على طلبات التسجيل - Supervisor account to approve registration requests',
  },
  { 
    value: 'admin', 
    label_ar: 'مدير النظام', 
    label_en: 'System Administrator',
    label: '⚙️ مدير النظام - Admin',
    icon: '⚙️',
    description: 'حساب مدير بصلاحيات كاملة - Administrator account with full permissions',
  },
];