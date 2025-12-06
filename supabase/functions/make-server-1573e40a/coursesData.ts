/**
 * MIS Courses Data - King Khalid University
 * بيانات مقررات تخصص نظم المعلومات الإدارية
 * College of Business Administration
 */

export interface ScheduleTime {
  day: string;        // e.g., 'Sunday', 'Monday'
  day_ar: string;     // e.g., 'الأحد', 'الاثنين'
  time: string;       // e.g., '08:00-09:30'
}

export interface Course {
  course_id: string;
  code: string;
  name_ar: string;
  name_en: string;
  credit_hours: number;
  level: number;
  department: string;
  description_ar?: string;
  description_en?: string;
  prerequisites?: string[];
  semester?: string;
  instructor?: string;
  instructor_ar?: string;
  // معلومات الجدول الدراسي
  schedule?: ScheduleTime[];  // قد يكون للمقرر أكثر من موعد في الأسبوع
  building?: string;           // e.g., 'Building A', 'المبنى أ'
  building_ar?: string;
  room?: string;               // e.g., 'Room 201', 'قاعة 201'
  room_ar?: string;
  college?: string;            // e.g., 'Business Administration'
  college_ar?: string;         // e.g., 'إدارة الأعمال'
  color?: string;              // لون المقرر في الجدول
}

/**
 * مقررات المستوى الأول (Level 1)
 * إجمالي الساعات: 15 ساعة
 */
export const LEVEL_1_COURSES: Course[] = [
  {
    course_id: 'ARAB101',
    code: 'ARAB 101',
    name_ar: 'المهارات اللغوية',
    name_en: 'Arabic Language Skills',
    credit_hours: 3,
    level: 1,
    department: 'MIS',
    description_ar: 'تطوير مهارات الاتصال الشفهي والكتابي باللغة العربية، والتعرف على أساسيات القراءة والكتابة الأكاديمية.',
    description_en: 'Develop oral and written communication skills in Arabic, and learn the fundamentals of academic reading and writing.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'هيئة التدريس',
  },
  {
    course_id: 'ISLM101',
    code: 'ISLM 101',
    name_ar: 'الثقافة الإسلامية',
    name_en: 'Islamic Culture',
    credit_hours: 2,
    level: 1,
    department: 'MIS',
    description_ar: 'دراسة أساسيات الثقافة الإسلامية ومبادئ الشريعة الإسلامية وتطبيقاتها في الحياة المعاصرة.',
    description_en: 'Study the fundamentals of Islamic culture, principles of Islamic Sharia, and their applications in contemporary life.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'هيئة التدريس',
  },
  {
    course_id: 'MGT101',
    code: 'MGT 101',
    name_ar: 'مبادئ الإدارة',
    name_en: 'Introduction to Management',
    credit_hours: 3,
    level: 1,
    department: 'MIS',
    description_ar: 'مقدمة في مفاهيم الإدارة الحديثة، الوظائف الإدارية (التخطيط، التنظيم، التوجيه، الرقابة)، ودور المدير في المنظمات.',
    description_en: 'Introduction to modern management concepts, management functions (planning, organizing, directing, controlling), and the role of manager in organizations.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. محمد رشيد',
  },
  {
    course_id: 'CIS101',
    code: 'CIS 101',
    name_ar: 'مقدمة في الحاسب الآلي',
    name_en: 'Introduction to Computer',
    credit_hours: 3,
    level: 1,
    department: 'MIS',
    description_ar: 'أساسيات الحاسب الآلي، مكونات الحاسب (Hardware & Software)، نظم التشغيل، تطبيقات المكتب (Word, Excel, PowerPoint)، والإنترنت.',
    description_en: 'Computer fundamentals, computer components (Hardware & Software), operating systems, office applications (Word, Excel, PowerPoint), and Internet.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. أحمد الغامدي',
  },
  {
    course_id: 'MATH101',
    code: 'MATH 101',
    name_ar: 'رياضيات الأعمال',
    name_en: 'Mathematics for Business',
    credit_hours: 3,
    level: 1,
    department: 'MIS',
    description_ar: 'مبادئ الرياضيات التطبيقية في مجال الأعمال، الجبر، المعادلات الخطية، النسب والتناسب، والإحصاء الوصفي.',
    description_en: 'Principles of applied mathematics in business, algebra, linear equations, ratios and proportions, and descriptive statistics.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. سارة العتيبي',
  },
  {
    course_id: 'UNIV101',
    code: 'UNIV 101',
    name_ar: 'المهارات الجامعية',
    name_en: 'University Skills',
    credit_hours: 1,
    level: 1,
    department: 'MIS',
    description_ar: 'مهارات الدراسة الجامعية، إدارة الوقت، البحث العلمي، والتكيف مع الحياة الجامعية.',
    description_en: 'University study skills, time management, scientific research, and adaptation to university life.',
    prerequisites: [],
    semester: 'Fall',
    instructor: 'هيئة التدريس',
  },
];

/**
 * مقررات المستوى الثاني (Level 2)
 * إجمالي الساعات: 18 ساعة
 */
export const LEVEL_2_COURSES: Course[] = [
  {
    course_id: 'MIS200',
    code: 'MIS 200',
    name_ar: 'مقدمة في نظم المعلومات الإدارية',
    name_en: 'Introduction to Management Information Systems',
    credit_hours: 3,
    level: 2,
    department: 'MIS',
    description_ar: 'مفاهيم نظم المعلومات، أنواع نظم المعلومات، دورها في المنظمات، والبنية التحتية لتقنية المعلومات.',
    description_en: 'Information systems concepts, types of information systems, their role in organizations, and IT infrastructure.',
    prerequisites: ['CIS101'],
    semester: 'Fall/Spring',
    instructor: 'د. محمد رشيد',
  },
  {
    course_id: 'ACCT201',
    code: 'ACCT 201',
    name_ar: 'مبادئ المحاسبة المالية',
    name_en: 'Principles of Financial Accounting',
    credit_hours: 3,
    level: 2,
    department: 'MIS',
    description_ar: 'أساسيات المحاسبة المالية، الدورة المحاسبية، إعداد القوائم المالية، والمعايير المحاسبية.',
    description_en: 'Fundamentals of financial accounting, accounting cycle, financial statement preparation, and accounting standards.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. خالد الشهري',
  },
  {
    course_id: 'ECON201',
    code: 'ECON 201',
    name_ar: 'مبادئ الاقتصاد الجزئي',
    name_en: 'Principles of Microeconomics',
    credit_hours: 3,
    level: 2,
    department: 'MIS',
    description_ar: 'مفاهيم العرض والطلب، سلوك المستهلك، سلوك المنتج، وهياكل الأسواق.',
    description_en: 'Supply and demand concepts, consumer behavior, producer behavior, and market structures.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. فاطمة القحطاني',
  },
  {
    course_id: 'STAT201',
    code: 'STAT 201',
    name_ar: 'الإحصاء للأعمال',
    name_en: 'Business Statistics',
    credit_hours: 3,
    level: 2,
    department: 'MIS',
    description_ar: 'الإحصاء الوصفي والتحليلي، التوزيعات الاحتمالية، اختبار الفرضيات، والانحدار والارتباط.',
    description_en: 'Descriptive and analytical statistics, probability distributions, hypothesis testing, and regression and correlation.',
    prerequisites: ['MATH101'],
    semester: 'Fall/Spring',
    instructor: 'د. عبدالله الدوسري',
  },
  {
    course_id: 'ENG201',
    code: 'ENG 201',
    name_ar: 'مهارات الكتابة بالإنجليزية',
    name_en: 'English Writing Skills',
    credit_hours: 3,
    level: 2,
    department: 'MIS',
    description_ar: 'تطوير مهارات الكتابة الأكاديمية والمهنية باللغة الإنجليزية.',
    description_en: 'Develop academic and professional writing skills in English.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'Dr. Sarah Johnson',
  },
  {
    course_id: 'COMM201',
    code: 'COMM 201',
    name_ar: 'مهارات الاتصال',
    name_en: 'Communication Skills',
    credit_hours: 3,
    level: 2,
    department: 'MIS',
    description_ar: 'مهارات الاتصال الفعال، العروض التقديمية، الاتصال الكتابي والشفهي.',
    description_en: 'Effective communication skills, presentations, written and oral communication.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. نورة العمري',
  },
];

/**
 * مقررات المستوى الثالث (Level 3)
 * إجمالي الساعات: 18 ساعة
 */
export const LEVEL_3_COURSES: Course[] = [
  {
    course_id: 'MIS310',
    code: 'MIS 310',
    name_ar: 'تحليل وتصميم النظم',
    name_en: 'Systems Analysis and Design',
    credit_hours: 3,
    level: 3,
    department: 'MIS',
    description_ar: 'منهجيات تحليل وتصميم نظم المعلومات، دورة حياة تطوير النظم، النمذجة، وأدوات التحليل.',
    description_en: 'Information systems analysis and design methodologies, systems development life cycle, modeling, and analysis tools.',
    prerequisites: ['MIS200'],
    semester: 'Fall/Spring',
    instructor: 'د. محمد رشيد',
  },
  {
    course_id: 'MIS320',
    code: 'MIS 320',
    name_ar: 'قواعد البيانات',
    name_en: 'Database Management Systems',
    credit_hours: 3,
    level: 3,
    department: 'MIS',
    description_ar: 'مفاهيم قواعد البيانات، نموذج العلاقات، SQL، التصميم والتطبيع، ونظم إدارة قواعد البيانات.',
    description_en: 'Database concepts, relational model, SQL, design and normalization, and database management systems.',
    prerequisites: ['MIS200'],
    semester: 'Fall/Spring',
    instructor: 'د. أحمد الغامدي',
  },
  {
    course_id: 'MIS330',
    code: 'MIS 330',
    name_ar: 'البرمجة للأعمال',
    name_en: 'Business Programming',
    credit_hours: 3,
    level: 3,
    department: 'MIS',
    description_ar: 'أساسيات البرمجة، ��لخوارزميات، هياكل البيانات، وتطوير تطبيقات الأعمال.',
    description_en: 'Programming fundamentals, algorithms, data structures, and business application development.',
    prerequisites: ['CIS101'],
    semester: 'Fall/Spring',
    instructor: 'د. عمر الزهراني',
  },
  {
    course_id: 'MGT310',
    code: 'MGT 310',
    name_ar: 'إدارة العمليات',
    name_en: 'Operations Management',
    credit_hours: 3,
    level: 3,
    department: 'MIS',
    description_ar: 'مبادئ إدارة العمليات، تخطيط الإنتاج، إدارة المخزون، والجودة الشاملة.',
    description_en: 'Operations management principles, production planning, inventory management, and total quality management.',
    prerequisites: ['MGT101'],
    semester: 'Fall/Spring',
    instructor: 'د. سلطان القرني',
  },
  {
    course_id: 'ACCT202',
    code: 'ACCT 202',
    name_ar: 'المحاسبة الإدارية',
    name_en: 'Managerial Accounting',
    credit_hours: 3,
    level: 3,
    department: 'MIS',
    description_ar: 'محاسبة التكاليف، إعداد الموازنات، تحليل التكلفة-الحجم-الربح، واتخاذ القرارات.',
    description_en: 'Cost accounting, budgeting, cost-volume-profit analysis, and decision making.',
    prerequisites: ['ACCT201'],
    semester: 'Fall/Spring',
    instructor: 'د. منى الشمراني',
  },
  {
    course_id: 'ECON202',
    code: 'ECON 202',
    name_ar: 'مبادئ الاقتصاد الكلي',
    name_en: 'Principles of Macroeconomics',
    credit_hours: 3,
    level: 3,
    department: 'MIS',
    description_ar: 'الناتج المحلي الإجمالي، التضخم، البطالة، السياسات النقدية والمالية.',
    description_en: 'Gross domestic product, inflation, unemployment, monetary and fiscal policies.',
    prerequisites: ['ECON201'],
    semester: 'Fall/Spring',
    instructor: 'د. فاطمة القحطاني',
  },
];

/**
 * مقررات المستوى الرابع (Level 4)
 * إجمالي الساعات: 18 ساعة
 */
export const LEVEL_4_COURSES: Course[] = [
  {
    course_id: 'MIS340',
    code: 'MIS 340',
    name_ar: 'تطوير تطبيقات الويب',
    name_en: 'Web Application Development',
    credit_hours: 3,
    level: 4,
    department: 'MIS',
    description_ar: 'تصميم وتطوير تطبيقات الويب، HTML, CSS, JavaScript، وأطر العمل الحديثة.',
    description_en: 'Web application design and development, HTML, CSS, JavaScript, and modern frameworks.',
    prerequisites: ['MIS330'],
    semester: 'Fall/Spring',
    instructor: 'د. نواف الحربي',
  },
  {
    course_id: 'MIS350',
    code: 'MIS 350',
    name_ar: 'الشبكات والاتصالات',
    name_en: 'Networks and Communications',
    credit_hours: 3,
    level: 4,
    department: 'MIS',
    description_ar: 'أساسيات الشبكات، بروتوكولات الاتصال، أمن الشبكات، والشبكات اللاسلكية.',
    description_en: 'Network fundamentals, communication protocols, network security, and wireless networks.',
    prerequisites: ['CIS101'],
    semester: 'Fall/Spring',
    instructor: 'د. عبدالرحمن الشمري',
  },
  {
    course_id: 'MIS360',
    code: 'MIS 360',
    name_ar: 'نظم المعلومات المحاسبية',
    name_en: 'Accounting Information Systems',
    credit_hours: 3,
    level: 4,
    department: 'MIS',
    description_ar: 'تطبيقات نظم المعلومات في المحاسبة، أنظمة ERP، وتحليل البيانات المالية.',
    description_en: 'Information systems applications in accounting, ERP systems, and financial data analysis.',
    prerequisites: ['ACCT202', 'MIS320'],
    semester: 'Fall/Spring',
    instructor: 'د. فيصل الزهراني',
  },
  {
    course_id: 'FIN201',
    code: 'FIN 201',
    name_ar: 'الإدارة المالية',
    name_en: 'Financial Management',
    credit_hours: 3,
    level: 4,
    department: 'MIS',
    description_ar: 'مبادئ الإدارة المالية، التخطيط المالي، تحليل الاستثمارات، وإدارة رأس المال.',
    description_en: 'Financial management principles, financial planning, investment analysis, and capital management.',
    prerequisites: ['ACCT201'],
    semester: 'Fall/Spring',
    instructor: 'د. بدر الزهراني',
  },
  {
    course_id: 'MKT201',
    code: 'MKT 201',
    name_ar: 'مبادئ التسويق',
    name_en: 'Principles of Marketing',
    credit_hours: 3,
    level: 4,
    department: 'MIS',
    description_ar: 'مفاهيم التسويق، سلوك المستهلك، المزيج التسويقي، والتسويق الرقمي.',
    description_en: 'Marketing concepts, consumer behavior, marketing mix, and digital marketing.',
    prerequisites: ['MGT101'],
    semester: 'Fall/Spring',
    instructor: 'د. ريم القحطاني',
  },
  {
    course_id: 'LAW201',
    code: 'LAW 201',
    name_ar: 'القانون التجاري والإلكتروني',
    name_en: 'Commercial and E-Commerce Law',
    credit_hours: 3,
    level: 4,
    department: 'MIS',
    description_ar: 'القوانين التجارية، قانون التجارة الإلكترونية، حماية المستهلك، والملكية الفكرية.',
    description_en: 'Commercial laws, e-commerce law, consumer protection, and intellectual property.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. سلطان الدوسري',
  },
];

/**
 * مقررات المستوى الخامس (Level 5)
 * إجمالي الساعات: 18 ساعة
 */
export const LEVEL_5_COURSES: Course[] = [
  {
    course_id: 'MIS410',
    code: 'MIS 410',
    name_ar: 'إدارة المشاريع التقنية',
    name_en: 'IT Project Management',
    credit_hours: 3,
    level: 5,
    department: 'MIS',
    description_ar: 'مبادئ إدارة المشاريع، تخطيط المشاريع، إدارة الموارد، ومنهجيات Agile و Scrum.',
    description_en: 'Project management principles, project planning, resource management, and Agile/Scrum methodologies.',
    prerequisites: ['MIS310'],
    semester: 'Fall/Spring',
    instructor: 'د. نورة الحربي',
  },
  {
    course_id: 'MIS420',
    code: 'MIS 420',
    name_ar: 'أمن المعلومات',
    name_en: 'Information Security',
    credit_hours: 3,
    level: 5,
    department: 'MIS',
    description_ar: 'مبادئ أمن المعلومات، التشفير، أمن الشبكات، والحماية من الهجمات الإلكترونية.',
    description_en: 'Information security principles, cryptography, network security, and cyber attack protection.',
    prerequisites: ['MIS350'],
    semester: 'Fall/Spring',
    instructor: 'د. ماجد الزهراني',
  },
  {
    course_id: 'MIS430',
    code: 'MIS 430',
    name_ar: 'تطبيقات الأعمال الإلكترونية',
    name_en: 'E-Business Applications',
    credit_hours: 3,
    level: 5,
    department: 'MIS',
    description_ar: 'نماذج الأعمال الإلكترونية، التجارة الإلكترونية، أنظمة الدفع الإلكتروني، والتسويق الرقمي.',
    description_en: 'E-business models, e-commerce, electronic payment systems, and digital marketing.',
    prerequisites: ['MIS340', 'MKT201'],
    semester: 'Fall/Spring',
    instructor: 'د. راشد الغامدي',
  },
  {
    course_id: 'MIS440',
    code: 'MIS 440',
    name_ar: 'تطوير تطبيقات الجوال',
    name_en: 'Mobile Application Development',
    credit_hours: 3,
    level: 5,
    department: 'MIS',
    description_ar: 'تصميم وتطوير تطبيقات الجوال، Android, iOS، وتطبيقات الويب التقدمية.',
    description_en: 'Mobile application design and development, Android, iOS, and progressive web apps.',
    prerequisites: ['MIS340'],
    semester: 'Fall/Spring',
    instructor: 'د. فهد الدوسري',
  },
  {
    course_id: 'STAT301',
    code: 'STAT 301',
    name_ar: 'الأساليب الكمية',
    name_en: 'Quantitative Methods',
    credit_hours: 3,
    level: 5,
    department: 'MIS',
    description_ar: 'النماذج الرياضية، بحوث العمليات، البرمجة الخطية، ونظرية القرار.',
    description_en: 'Mathematical models, operations research, linear programming, and decision theory.',
    prerequisites: ['STAT201'],
    semester: 'Fall/Spring',
    instructor: 'د. سلمان الغامدي',
  },
  {
    course_id: 'HRM301',
    code: 'HRM 301',
    name_ar: 'إدارة الموارد البشرية',
    name_en: 'Human Resource Management',
    credit_hours: 3,
    level: 5,
    department: 'MIS',
    description_ar: 'استراتيجيات الموارد البشرية، التوظيف، التدريب، التقييم، والتعويضات.',
    description_en: 'HR strategies, recruitment, training, performance evaluation, and compensation.',
    prerequisites: ['MGT101'],
    semester: 'Fall/Spring',
    instructor: 'د. وليد الدوسري',
  },
];

/**
 * مقررات المستوى السادس (Level 6)
 * إجمالي الساعات: 18 ساعة
 */
export const LEVEL_6_COURSES: Course[] = [
  {
    course_id: 'MIS510',
    code: 'MIS 510',
    name_ar: 'ذكاء الأعمال وتحليل البيانات',
    name_en: 'Business Intelligence and Data Analytics',
    credit_hours: 3,
    level: 6,
    department: 'MIS',
    description_ar: 'أدوات ذكاء الأعمال، تحليل البيانات، التنقيب عن البيانات، ولوحات المعلومات.',
    description_en: 'Business intelligence tools, data analytics, data mining, and dashboards.',
    prerequisites: ['MIS320', 'STAT301'],
    semester: 'Fall/Spring',
    instructor: 'د. بدر الزهراني',
  },
  {
    course_id: 'MIS520',
    code: 'MIS 520',
    name_ar: 'نظم دعم القرار',
    name_en: 'Decision Support Systems',
    credit_hours: 3,
    level: 6,
    department: 'MIS',
    description_ar: 'أنواع نظم دعم القرار، النماذج التحليلية، الذكاء الاصطناعي في اتخاذ القرار.',
    description_en: 'Types of decision support systems, analytical models, AI in decision making.',
    prerequisites: ['MIS310', 'STAT301'],
    semester: 'Fall/Spring',
    instructor: 'د. يوسف الشمري',
  },
  {
    course_id: 'MIS530',
    code: 'MIS 530',
    name_ar: 'إدارة علاقات العملاء',
    name_en: 'Customer Relationship Management',
    credit_hours: 3,
    level: 6,
    department: 'MIS',
    description_ar: 'استراتيجيات CRM، أنظمة إدارة العملاء، تحليل بيانات العملاء، وولاء العملاء.',
    description_en: 'CRM strategies, customer management systems, customer data analysis, and customer loyalty.',
    prerequisites: ['MKT201', 'MIS320'],
    semester: 'Fall/Spring',
    instructor: 'د. عادل العتيبي',
  },
  {
    course_id: 'MIS540',
    code: 'MIS 540',
    name_ar: 'الحوسبة السحابية',
    name_en: 'Cloud Computing',
    credit_hours: 3,
    level: 6,
    department: 'MIS',
    description_ar: 'مفاهيم الحوسبة السحابية، AWS, Azure, نماذج الخدمة (IaaS, PaaS, SaaS)، والأمن السحابي.',
    description_en: 'Cloud computing concepts, AWS, Azure, service models (IaaS, PaaS, SaaS), and cloud security.',
    prerequisites: ['MIS350'],
    semester: 'Fall/Spring',
    instructor: 'د. طارق العتيبي',
  },
  {
    course_id: 'MGT401',
    code: 'MGT 401',
    name_ar: 'الإدارة الاستراتيجية',
    name_en: 'Strategic Management',
    credit_hours: 3,
    level: 6,
    department: 'MIS',
    description_ar: 'التخطيط الاستراتيجي، التحليل البيئي، الميزة التنافسية، وتنفيذ الاستراتيجية.',
    description_en: 'Strategic planning, environmental analysis, competitive advantage, and strategy implementation.',
    prerequisites: ['MGT310'],
    semester: 'Fall/Spring',
    instructor: 'د. أمل الغامدي',
  },
  {
    course_id: 'MIS550',
    code: 'MIS 550',
    name_ar: 'تدقيق نظم المعلومات',
    name_en: 'Information Systems Audit',
    credit_hours: 3,
    level: 6,
    department: 'MIS',
    description_ar: 'معايير التدقيق، تقييم المخاطر، ضوابط نظم المعلومات، وإطار COBIT.',
    description_en: 'Audit standards, risk assessment, IS controls, and COBIT framework.',
    prerequisites: ['MIS420'],
    semester: 'Fall/Spring',
    instructor: 'د. ثامر القحطاني',
  },
];

/**
 * مقررات المستوى السابع (Level 7)
 * إجمالي الساعات: 18 ساعة
 */
export const LEVEL_7_COURSES: Course[] = [
  {
    course_id: 'MIS610',
    code: 'MIS 610',
    name_ar: 'إدارة تقنية المعلومات',
    name_en: 'IT Management',
    credit_hours: 3,
    level: 7,
    department: 'MIS',
    description_ar: 'استراتيجيات تقنية المعلومات، إدارة البنية التحتية، ITIL، وإدارة الخدمات.',
    description_en: 'IT strategies, infrastructure management, ITIL, and service management.',
    prerequisites: ['MIS410'],
    semester: 'Fall/Spring',
    instructor: 'د. إبراهيم الدوسري',
  },
  {
    course_id: 'MIS620',
    code: 'MIS 620',
    name_ar: 'حوكمة تقنية المعلومات',
    name_en: 'IT Governance',
    credit_hours: 3,
    level: 7,
    department: 'MIS',
    description_ar: 'إطار حوكمة تقنية المعلومات، معايير ISO، الامتثال، وإدارة المخاطر.',
    description_en: 'IT governance framework, ISO standards, compliance, and risk management.',
    prerequisites: ['MIS550'],
    semester: 'Fall/Spring',
    instructor: 'د. خالد الزهراني',
  },
  {
    course_id: 'MIS630',
    code: 'MIS 630',
    name_ar: 'إدارة المعرفة',
    name_en: 'Knowledge Management',
    credit_hours: 3,
    level: 7,
    department: 'MIS',
    description_ar: 'استراتيجيات إدارة المعرفة، نظم إدارة المحتوى، التشارك المعرفي، والذاكرة المؤسسية.',
    description_en: 'Knowledge management strategies, content management systems, knowledge sharing, and organizational memory.',
    prerequisites: ['MIS200'],
    semester: 'Fall/Spring',
    instructor: 'د. سعود الحربي',
  },
  {
    course_id: 'MIS640',
    code: 'MIS 640',
    name_ar: 'الابتكار الرقمي',
    name_en: 'Digital Innovation',
    credit_hours: 3,
    level: 7,
    department: 'MIS',
    description_ar: 'التحول الرقمي، تقنيات ناشئة، الذكاء الاصطناعي، blockchain، وإنترنت الأشياء.',
    description_en: 'Digital transformation, emerging technologies, AI, blockchain, and Internet of Things.',
    prerequisites: ['MIS510'],
    semester: 'Fall/Spring',
    instructor: 'د. سلطان الدوسري',
  },
  {
    course_id: 'MIS650',
    code: 'MIS 650',
    name_ar: 'نظم المعلومات المتقدمة',
    name_en: 'Advanced Information Systems',
    credit_hours: 3,
    level: 7,
    department: 'MIS',
    description_ar: 'أنظمة المؤسسات، ERP, SCM, نظم ذكية، والتكامل بين الأنظمة.',
    description_en: 'Enterprise systems, ERP, SCM, intelligent systems, and systems integration.',
    prerequisites: ['MIS310'],
    semester: 'Fall/Spring',
    instructor: 'د. جواهر الشمري',
  },
  {
    course_id: 'MIS598',
    code: 'MIS 598',
    name_ar: 'التدريب الميداني',
    name_en: 'Field Training',
    credit_hours: 3,
    level: 7,
    department: 'MIS',
    description_ar: 'تدريب عملي في منظمة، تطبيق المعرفة، اكتساب الخبرة، وإعداد تقرير التدريب.',
    description_en: 'Practical training in an organization, knowledge application, experience acquisition, and training report preparation.',
    prerequisites: [],
    semester: 'Summer',
    instructor: 'د. محمد رشيد',
  },
];

/**
 * مقررات المستوى الثامن (Level 8)
 * إجمالي الساعات: 15 ساعة
 */
export const LEVEL_8_COURSES: Course[] = [
  {
    course_id: 'MIS710',
    code: 'MIS 710',
    name_ar: 'تحليلات البيانات الضخمة',
    name_en: 'Big Data Analytics',
    credit_hours: 3,
    level: 8,
    department: 'MIS',
    description_ar: 'تقنيات البيانات الضخمة، Hadoop, Spark، التعلم الآلي، والتحليل التنبؤي.',
    description_en: 'Big data technologies, Hadoop, Spark, machine learning, and predictive analytics.',
    prerequisites: ['MIS510'],
    semester: 'Fall/Spring',
    instructor: 'د. عبدالعزيز القحطاني',
  },
  {
    course_id: 'MIS720',
    code: 'MIS 720',
    name_ar: 'أخلاقيات تقنية المعلومات',
    name_en: 'IT Ethics',
    credit_hours: 2,
    level: 8,
    department: 'MIS',
    description_ar: 'الأخلاقيات المهنية، الخصوصية، حقوق الملكية الفكرية، والمسؤولية الاجتماعية.',
    description_en: 'Professional ethics, privacy, intellectual property rights, and social responsibility.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. منيرة الشهري',
  },
  {
    course_id: 'MIS730',
    code: 'MIS 730',
    name_ar: 'ندوة في نظم المعلومات',
    name_en: 'Seminar in Information Systems',
    credit_hours: 1,
    level: 8,
    department: 'MIS',
    description_ar: 'مناقشة موضوعات معاصرة، أبحاث حديثة، عروض تقديمية، وضيوف متخصصين.',
    description_en: 'Discussion of contemporary topics, recent research, presentations, and guest speakers.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. علي الشهري',
  },
  {
    course_id: 'MIS740',
    code: 'MIS 740',
    name_ar: 'موضوعات خاصة في نظم المعلومات',
    name_en: 'Special Topics in Information Systems',
    credit_hours: 3,
    level: 8,
    department: 'MIS',
    description_ar: 'موضوعات متقدمة ومتغيرة حسب التطورات التقنية والاحتياجات الصناعية.',
    description_en: 'Advanced topics varying according to technological developments and industry needs.',
    prerequisites: [],
    semester: 'Fall/Spring',
    instructor: 'د. هند العسيري',
  },
  {
    course_id: 'MIS699',
    code: 'MIS 699',
    name_ar: 'مشروع التخرج',
    name_en: 'Graduation Project',
    credit_hours: 6,
    level: 8,
    department: 'MIS',
    description_ar: 'مشروع تطبيقي شامل، تصميم وتطوير نظام معلومات كامل، وإعداد وثائق ومستندات المشروع.',
    description_en: 'Comprehensive applied project, design and development of a complete information system, and preparation of project documentation.',
    prerequisites: ['MIS310', 'MIS320', 'MIS410'],
    semester: 'Fall/Spring',
    instructor: 'د. محمد رشيد',
  },
];

/**
 * All courses combined
 */
export const ALL_COURSES: Course[] = [
  ...LEVEL_1_COURSES,
  ...LEVEL_2_COURSES,
  ...LEVEL_3_COURSES,
  ...LEVEL_4_COURSES,
  ...LEVEL_5_COURSES,
  ...LEVEL_6_COURSES,
  ...LEVEL_7_COURSES,
  ...LEVEL_8_COURSES,
];

/**
 * Get courses by level
 */
export const getCoursesByLevel = (level: number): Course[] => {
  return ALL_COURSES.filter(course => course.level === level);
};

/**
 * Get course by ID
 */
export const getCourseById = (courseId: string): Course | undefined => {
  return ALL_COURSES.find(course => course.course_id === courseId);
};

/**
 * Get courses by department
 */
export const getCoursesByDepartment = (department: string): Course[] => {
  return ALL_COURSES.filter(course => course.department === department);
};