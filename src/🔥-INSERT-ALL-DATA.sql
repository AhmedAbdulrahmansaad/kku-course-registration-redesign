-- ========================================
-- 🎓 ملء جميع الجداول - نظام تسجيل المقررات
-- جامعة الملك خالد - كلية إدارة الأعمال
-- ========================================

-- ========================================
-- 1️⃣ الأقسام الأكاديمية
-- ========================================

INSERT INTO departments (code, name_ar, name_en, college_ar, college_en, active) VALUES
-- الأقسام الرئيسية في كلية إدارة الأعمال
('MIS', 'نظم المعلومات الإدارية', 'Management Information Systems', 
 'كلية إدارة الأعمال', 'College of Business Administration', true),
 
('MGMT', 'إدارة الأعمال', 'Business Administration', 
 'كلية إدارة الأعمال', 'College of Business Administration', true),
 
('ACCT', 'المحاسبة', 'Accounting', 
 'كلية إدارة الأعمال', 'College of Business Administration', true),
 
('FIN', 'التمويل', 'Finance', 
 'كلية إدارة الأعمال', 'College of Business Administration', true),
 
('MKT', 'التسويق', 'Marketing', 
 'كلية إدارة الأعمال', 'College of Business Administration', true),
 
('ECON', 'الاقتصاد', 'Economics', 
 'كلية إدارة الأعمال', 'College of Business Administration', true),

-- أقسام المتطلبات العامة
('LANG', 'اللغات', 'Languages', 
 'المتطلبات العامة', 'General Requirements', true),
 
('MATH', 'الرياضيات', 'Mathematics', 
 'المتطلبات العامة', 'General Requirements', true),
 
('ISLM', 'الدراسات الإسلامية', 'Islamic Studies', 
 'المتطلبات العامة', 'General Requirements', true)

ON CONFLICT (code) DO NOTHING;

-- ========================================
-- 2️⃣ المقررات الدراسية (49 مقرر)
-- ========================================

-- المستوى الأول - الفصل الأول (6 مقررات)
INSERT INTO courses (course_id, code, name_ar, name_en, description_ar, description_en, credits, level, department_id, category, prerequisites, active) VALUES

('ARAB-101', 'ARAB 101', 'المهارات اللغوية', 'Arabic Language Skills',
 'تطوير مهارات الاتصال الشفهي والكتابي باللغة العربية',
 'Develop oral and written communication skills in Arabic',
 3, 1, (SELECT id FROM departments WHERE code = 'LANG'), 'متطلب جامعة', NULL, true),

('ISLM-101', 'ISLM 101', 'الثقافة الإسلامية', 'Islamic Culture',
 'دراسة أساسيات الثقافة الإسلامية ومبادئ الشريعة الإسلامية',
 'Study the fundamentals of Islamic culture and principles of Islamic Sharia',
 2, 1, (SELECT id FROM departments WHERE code = 'ISLM'), 'متطلب جامعة', NULL, true),

('ENGL-101', 'ENGL 101', 'اللغة الإنجليزية 1', 'English Language 1',
 'تطوير المهارات الأساسية في اللغة الإنجليزية',
 'Develop basic English language skills',
 3, 1, (SELECT id FROM departments WHERE code = 'LANG'), 'متطلب جامعة', NULL, true),

('MATH-101', 'MATH 101', 'الرياضيات للأعمال', 'Business Mathematics',
 'المبادئ الرياضية الأساسية وتطبيقاتها في إدارة الأعمال',
 'Basic mathematical principles and their applications in business',
 3, 1, (SELECT id FROM departments WHERE code = 'MATH'), 'متطلب جامعة', NULL, true),

('MGMT-101', 'MGMT 101', 'مبادئ الإدارة', 'Principles of Management',
 'المفاهيم الأساسية للإدارة ووظائفها',
 'Basic management concepts and functions',
 3, 1, (SELECT id FROM departments WHERE code = 'MGMT'), 'متطلب كلية', NULL, true),

('CS-101', 'CS 101', 'مهارات الحاسب الآلي', 'Computer Skills',
 'المهارات الأساسية لاستخدام الحاسب الآلي والبرامج المكتبية',
 'Basic computer skills and office applications',
 2, 1, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب جامعة', NULL, true)

ON CONFLICT (course_id) DO NOTHING;

-- المستوى الثاني (6 مقررات)
INSERT INTO courses (course_id, code, name_ar, name_en, description_ar, description_en, credits, level, department_id, category, prerequisites, active) VALUES

('STAT-201', 'STAT 201', 'الإحصاء التطبيقي', 'Applied Statistics',
 'المفاهيم الإحصائية الأساسية وتطبيقاتها',
 'Basic statistical concepts and applications',
 3, 2, (SELECT id FROM departments WHERE code = 'MATH'), 'متطلب كلية', ARRAY['MATH-101'], true),

('ACCT-201', 'ACCT 201', 'مبادئ المحاسبة', 'Principles of Accounting',
 'المبادئ الأساسية للمحاسبة المالية',
 'Basic principles of financial accounting',
 3, 2, (SELECT id FROM departments WHERE code = 'ACCT'), 'متطلب كلية', NULL, true),

('CS-201', 'CS 201', 'مقدمة في الحاسب الآلي', 'Introduction to Computers',
 'المفاهيم الأساسية للحاسب الآلي وتطبيقاته',
 'Basic computer concepts and applications',
 3, 2, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['CS-101'], true),

('ECON-201', 'ECON 201', 'مبادئ الاقتصاد الجزئي', 'Principles of Microeconomics',
 'المبادئ الأساسية للاقتصاد الجزئي',
 'Basic principles of microeconomics',
 3, 2, (SELECT id FROM departments WHERE code = 'ECON'), 'متطلب كلية', NULL, true),

('ENGL-201', 'ENGL 201', 'اللغة الإنجليزية 2', 'English Language 2',
 'تطوير المهارات المتقدمة في اللغة الإنجليزية',
 'Develop advanced English language skills',
 3, 2, (SELECT id FROM departments WHERE code = 'LANG'), 'متطلب جامعة', ARRAY['ENGL-101'], true),

('ISLM-201', 'ISLM 201', 'الثقافة الإسلامية 2', 'Islamic Culture 2',
 'دراسة متقدمة للثقافة الإسلامية',
 'Advanced study of Islamic culture',
 2, 2, (SELECT id FROM departments WHERE code = 'ISLM'), 'متطلب جامعة', ARRAY['ISLM-101'], true)

ON CONFLICT (course_id) DO NOTHING;

-- المستوى الثالث (6 مقررات)
INSERT INTO courses (course_id, code, name_ar, name_en, description_ar, description_en, credits, level, department_id, category, prerequisites, active) VALUES

('MIS-301', 'MIS 301', 'مقدمة في نظم المعلومات الإدارية', 'Introduction to MIS',
 'مقدمة شاملة لنظم المعلومات الإدارية ودورها في المنظمات',
 'Comprehensive introduction to MIS and its role in organizations',
 3, 3, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['CS-201'], true),

('MIS-302', 'MIS 302', 'قواعد البيانات', 'Database Management',
 'تصميم وإدارة قواعد البيانات العلائقية',
 'Design and management of relational databases',
 3, 3, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['CS-201'], true),

('MIS-303', 'MIS 303', 'البرمجة التطبيقية', 'Application Programming',
 'مبادئ البرمجة وتطوير التطبيقات',
 'Programming principles and application development',
 3, 3, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['CS-201'], true),

('MKT-301', 'MKT 301', 'مبادئ التسويق', 'Principles of Marketing',
 'المفاهيم الأساسية للتسويق',
 'Basic marketing concepts',
 3, 3, (SELECT id FROM departments WHERE code = 'MKT'), 'متطلب كلية', ARRAY['MGMT-101'], true),

('FIN-301', 'FIN 301', 'الإدارة المالية', 'Financial Management',
 'مبادئ الإدارة المالية واتخاذ القرارات المالية',
 'Principles of financial management and financial decision-making',
 3, 3, (SELECT id FROM departments WHERE code = 'FIN'), 'متطلب كلية', ARRAY['ACCT-201'], true),

('ECON-301', 'ECON 301', 'الاقتصاد الكلي', 'Macroeconomics',
 'المبادئ الأساسية للاقتصاد الكلي',
 'Basic principles of macroeconomics',
 3, 3, (SELECT id FROM departments WHERE code = 'ECON'), 'متطلب كلية', ARRAY['ECON-201'], true)

ON CONFLICT (course_id) DO NOTHING;

-- المستوى الرابع (6 مقررات)
INSERT INTO courses (course_id, code, name_ar, name_en, description_ar, description_en, credits, level, department_id, category, prerequisites, active) VALUES

('MIS-401', 'MIS 401', 'تحليل وتصميم النظم', 'Systems Analysis and Design',
 'منهجيات تحليل وتصميم نظم المعلومات',
 'Methodologies for information systems analysis and design',
 3, 4, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-301'], true),

('MIS-402', 'MIS 402', 'الشبكات وأمن المعلومات', 'Networks and Information Security',
 'مبادئ الشبكات وأمن المعلومات',
 'Network principles and information security',
 3, 4, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['CS-201'], true),

('MIS-403', 'MIS 403', 'إدارة المشاريع', 'Project Management',
 'مبادئ إدارة المشاريع التقنية',
 'Principles of IT project management',
 3, 4, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MGMT-101'], true),

('MIS-404', 'MIS 404', 'نظم دعم القرار', 'Decision Support Systems',
 'نظم دعم القرار والذكاء الاصطناعي',
 'Decision support systems and artificial intelligence',
 3, 4, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-301'], true),

('HRM-401', 'HRM 401', 'إدارة الموارد البشرية', 'Human Resource Management',
 'مبادئ إدارة الموارد البشرية',
 'Principles of human resource management',
 3, 4, (SELECT id FROM departments WHERE code = 'MGMT'), 'متطلب كلية', ARRAY['MGMT-101'], true),

('ACCT-401', 'ACCT 401', 'المحاسبة الإدارية', 'Managerial Accounting',
 'المحاسبة الإدارية واتخاذ القرارات',
 'Managerial accounting and decision making',
 3, 4, (SELECT id FROM departments WHERE code = 'ACCT'), 'متطلب كلية', ARRAY['ACCT-201'], true)

ON CONFLICT (course_id) DO NOTHING;

-- المستوى الخامس (6 مقررات)
INSERT INTO courses (course_id, code, name_ar, name_en, description_ar, description_en, credits, level, department_id, category, prerequisites, active) VALUES

('MIS-501', 'MIS 501', 'إدارة البيانات الضخمة', 'Big Data Management',
 'إدارة وتحليل البيانات الضخمة',
 'Big data management and analytics',
 3, 5, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-302'], true),

('MIS-502', 'MIS 502', 'التجارة الإلكترونية', 'E-Commerce',
 'مبادئ التجارة الإلكترونية وتطبيقاتها',
 'E-commerce principles and applications',
 3, 5, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-301'], true),

('MIS-503', 'MIS 503', 'نظم تخطيط موارد المؤسسات', 'Enterprise Resource Planning',
 'نظم ERP وتطبيقاتها في المنظمات',
 'ERP systems and their applications in organizations',
 3, 5, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-401'], true),

('MIS-504', 'MIS 504', 'الحوسبة السحابية', 'Cloud Computing',
 'مبادئ الحوسبة السحابية وتطبيقاتها',
 'Cloud computing principles and applications',
 3, 5, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-402'], true),

('MIS-505', 'MIS 505', 'إدارة علاقات العملاء', 'Customer Relationship Management',
 'نظم CRM وإدارة علاقات العملاء',
 'CRM systems and customer relationship management',
 3, 5, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MKT-301'], true),

('STAT-501', 'STAT 501', 'الإحصاء المتقدم', 'Advanced Statistics',
 'تقنيات إحصائية متقدمة',
 'Advanced statistical techniques',
 3, 5, (SELECT id FROM departments WHERE code = 'MATH'), 'متطلب كلية', ARRAY['STAT-201'], true)

ON CONFLICT (course_id) DO NOTHING;

-- المستوى السادس (6 مقررات)
INSERT INTO courses (course_id, code, name_ar, name_en, description_ar, description_en, credits, level, department_id, category, prerequisites, active) VALUES

('MIS-601', 'MIS 601', 'إدارة نظم المعلومات الاستراتيجية', 'Strategic Information Systems Management',
 'الإدارة الاستراتيجية لنظم المعلومات',
 'Strategic management of information systems',
 3, 6, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-401'], true),

('MIS-602', 'MIS 602', 'ذكاء الأعمال', 'Business Intelligence',
 'تقنيات ذكاء الأعمال وتحليل البيانات',
 'Business intelligence techniques and data analytics',
 3, 6, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-501'], true),

('MIS-603', 'MIS 603', 'إدارة سلسلة التوريد', 'Supply Chain Management',
 'إدارة سلسلة التوريد ونظم المعلومات',
 'Supply chain management and information systems',
 3, 6, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-503'], true),

('MIS-604', 'MIS 604', 'تطوير تطبيقات الأجهزة المحمولة', 'Mobile Application Development',
 'تطوير تطبيقات الهواتف الذكية',
 'Smartphone application development',
 3, 6, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-303'], true),

('MIS-605', 'MIS 605', 'الأمن السيبراني', 'Cybersecurity',
 'أساسيات الأمن السيبراني وحماية المعلومات',
 'Cybersecurity fundamentals and information protection',
 3, 6, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-402'], true),

('MGMT-601', 'MGMT 601', 'الإدارة الاستراتيجية', 'Strategic Management',
 'الإدارة الاستراتيجية للمنظمات',
 'Strategic management of organizations',
 3, 6, (SELECT id FROM departments WHERE code = 'MGMT'), 'متطلب كلية', ARRAY['MGMT-101'], true)

ON CONFLICT (course_id) DO NOTHING;

-- المستوى السابع (6 مقررات)
INSERT INTO courses (course_id, code, name_ar, name_en, description_ar, description_en, credits, level, department_id, category, prerequisites, active) VALUES

('MIS-701', 'MIS 701', 'مشروع التخرج (1)', 'Graduation Project (1)',
 'بداية مشروع التخرج وجمع المتطلبات',
 'Graduation project initiation and requirements gathering',
 3, 7, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-601'], true),

('MIS-702', 'MIS 702', 'الذكاء الاصطناعي في الأعمال', 'AI in Business',
 'تطبيقات الذكاء الاصطناعي في إدارة الأعمال',
 'AI applications in business management',
 3, 7, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-404'], true),

('MIS-703', 'MIS 703', 'تحليلات البيانات المتقدمة', 'Advanced Data Analytics',
 'تقنيات متقدمة لتحليل البيانات',
 'Advanced data analytics techniques',
 3, 7, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-602'], true),

('MIS-704', 'MIS 704', 'إنترنت الأشياء', 'Internet of Things (IoT)',
 'مبادئ إنترنت الأشياء وتطبيقاته',
 'IoT principles and applications',
 3, 7, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-402'], true),

('LAW-701', 'LAW 701', 'القانون التجاري الإلكتروني', 'E-Commerce Law',
 'القوانين والأنظمة المتعلقة بالتجارة الإلكترونية',
 'Laws and regulations related to e-commerce',
 2, 7, (SELECT id FROM departments WHERE code = 'MGMT'), 'اختياري', ARRAY['MIS-502'], true),

('MGMT-701', 'MGMT 701', 'أخلاقيات الأعمال', 'Business Ethics',
 'المبادئ الأخلاقية في إدارة الأعمال',
 'Ethical principles in business management',
 2, 7, (SELECT id FROM departments WHERE code = 'MGMT'), 'متطلب كلية', NULL, true)

ON CONFLICT (course_id) DO NOTHING;

-- المستوى الثامن (7 مقررات)
INSERT INTO courses (course_id, code, name_ar, name_en, description_ar, description_en, credits, level, department_id, category, prerequisites, active) VALUES

('MIS-801', 'MIS 801', 'مشروع التخرج (2)', 'Graduation Project (2)',
 'إكمال مشروع التخرج والعرض النهائي',
 'Graduation project completion and final presentation',
 3, 8, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-701'], true),

('MIS-802', 'MIS 802', 'التدريب الميداني', 'Internship',
 'تدريب عملي في منظمة حقيقية',
 'Practical training in a real organization',
 6, 8, (SELECT id FROM departments WHERE code = 'MIS'), 'متطلب قسم', ARRAY['MIS-601'], true),

('MIS-803', 'MIS 803', 'البلوك تشين وتطبيقاته', 'Blockchain and Applications',
 'تقنية البلوك تشين وتطبيقاتها في الأعمال',
 'Blockchain technology and its business applications',
 3, 8, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-402'], true),

('MIS-804', 'MIS 804', 'إدارة التغيير التنظيمي', 'Organizational Change Management',
 'إدارة التغيير في المنظمات الرقمية',
 'Change management in digital organizations',
 3, 8, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-601'], true),

('ENTR-801', 'ENTR 801', 'ريادة الأعمال التقنية', 'Technology Entrepreneurship',
 'بناء وإدارة المشاريع التقنية الناشئة',
 'Building and managing technology startups',
 3, 8, (SELECT id FROM departments WHERE code = 'MGMT'), 'اختياري', ARRAY['MGMT-101'], true),

('MIS-805', 'MIS 805', 'حوكمة تقنية المعلومات', 'IT Governance',
 'مبادئ حوكمة تقنية المعلومات',
 'IT governance principles',
 3, 8, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-601'], true),

('MIS-806', 'MIS 806', 'إدارة المعرفة', 'Knowledge Management',
 'إدارة المعرفة في المنظمات',
 'Knowledge management in organizations',
 3, 8, (SELECT id FROM departments WHERE code = 'MIS'), 'اختياري', ARRAY['MIS-601'], true)

ON CONFLICT (course_id) DO NOTHING;

-- ========================================
-- 3️⃣ إعلانات تجريبية
-- ========================================

-- سيتم إضافة الإعلانات من خلال لوحة تحكم المدير

-- ========================================
-- ✅ تم الانتهاء من إضافة البيانات
-- ========================================

-- ملخص ما تم إضافته:
-- ✅ 9 أقسام أكاديمية
-- ✅ 49 مقرراً دراسياً موزعة على 8 مستويات
-- ✅ جميع المتطلبات الأساسية (prerequisites) محددة
-- ✅ جميع المقررات مرتبطة بالأقسام الصحيحة

-- الخطوة التالية:
-- 1. تشغيل هذا SQL في Supabase
-- 2. التحقق من الجداول في Table Editor
-- 3. إنشاء حساب المدير من خلال التطبيق
-- 4. إنشاء حساب المشرف من خلال لوحة تحكم المدير
-- 5. اختبار النظام

-- ========================================
-- انتهى ✅
-- ========================================
