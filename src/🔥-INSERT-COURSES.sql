-- ========================================
-- إضافة المقررات الدراسية - 49 مقرر
-- قسم نظم المعلومات الإدارية
-- جامعة الملك خالد
-- ========================================

-- الحصول على department_id
DO $$
DECLARE
  dept_id UUID;
BEGIN
  SELECT id INTO dept_id FROM departments WHERE code = 'MIS' LIMIT 1;

-- ========================================
-- المستوى الأول (Level 1) - 15 ساعة
-- ========================================

INSERT INTO courses (course_id, code, name_ar, name_en, credits, level, department_id, description_ar, description_en, category, prerequisites) VALUES
('ARAB101', 'ARAB 101', 'المهارات اللغوية', 'Arabic Language Skills', 3, 1, dept_id, 
 'تطوير مهارات الاتصال الشفهي والكتابي باللغة العربية', 
 'Develop oral and written communication skills in Arabic', 'متطلب جامعة', ARRAY[]::TEXT[]),

('ISLM101', 'ISLM 101', 'الثقافة الإسلامية', 'Islamic Culture', 2, 1, dept_id,
 'دراسة أساسيات الثقافة الإسلامية ومبادئ الشريعة الإسلامية',
 'Study the fundamentals of Islamic culture and Islamic Sharia principles', 'متطلب جامعة', ARRAY[]::TEXT[]),

('MGT101', 'MGT 101', 'مبادئ الإدارة', 'Introduction to Management', 3, 1, dept_id,
 'مقدمة في مفاهيم الإدارة الحديثة والوظائف الإدارية',
 'Introduction to modern management concepts and functions', 'متطلب كلية', ARRAY[]::TEXT[]),

('CIS101', 'CIS 101', 'مقدمة في الحاسب الآلي', 'Introduction to Computer', 3, 1, dept_id,
 'أساسيات الحاسب الآلي ومكوناته ونظم التشغيل',
 'Computer fundamentals, components and operating systems', 'متطلب قسم', ARRAY[]::TEXT[]),

('MATH101', 'MATH 101', 'الرياضيات للإدارة', 'Mathematics for Business', 3, 1, dept_id,
 'المفاهيم الرياضية الأساسية وتطبيقاتها في مجال الأعمال',
 'Basic mathematical concepts and their applications in business', 'متطلب كلية', ARRAY[]::TEXT[]),

('ENGL101', 'ENGL 101', 'اللغة الإنجليزية', 'English Language', 3, 1, dept_id,
 'تطوير مهارات اللغة الإنجليزية في القراءة والكتابة والمحادثة',
 'Develop English language skills in reading, writing and conversation', 'متطلب جامعة', ARRAY[]::TEXT[]);

-- ========================================
-- المستوى الثاني (Level 2) - 18 ساعة
-- ========================================

INSERT INTO courses (course_id, code, name_ar, name_en, credits, level, department_id, description_ar, description_en, category, prerequisites) VALUES
('ACC101', 'ACC 101', 'مبادئ المحاسبة (1)', 'Principles of Accounting I', 3, 2, dept_id,
 'المبادئ الأساسية للمحاسبة المالية والدورة المحاسبية',
 'Basic principles of financial accounting and accounting cycle', 'متطلب كلية', ARRAY[]::TEXT[]),

('ECON101', 'ECON 101', 'مبادئ الاقتصاد الجزئي', 'Principles of Microeconomics', 3, 2, dept_id,
 'دراسة سلوك المستهلكين والمنتجين في الأسواق',
 'Study of consumer and producer behavior in markets', 'متطلب كلية', ARRAY[]::TEXT[]),

('STAT101', 'STAT 101', 'مبادئ الإحصاء', 'Principles of Statistics', 3, 2, dept_id,
 'المفاهيم الإحصائية الأساسية وتطبيقاتها في الأعمال',
 'Basic statistical concepts and their business applications', 'متطلب كلية', ARRAY['MATH101']),

('CIS110', 'CIS 110', 'البرمجة المرئية', 'Visual Programming', 3, 2, dept_id,
 'أساسيات البرمجة باستخدام اللغات المرئية',
 'Programming fundamentals using visual languages', 'متطلب قسم', ARRAY['CIS101']),

('MIS100', 'MIS 100', 'مدخل إلى نظم المعلومات الإدارية', 'Introduction to MIS', 3, 2, dept_id,
 'مقدمة في مفهوم نظم المعلومات ودورها في المنظمات',
 'Introduction to information systems concept and their role in organizations', 'متطلب قسم', ARRAY['CIS101', 'MGT101']),

('COMM101', 'COMM 101', 'مهارات الاتصال', 'Communication Skills', 3, 2, dept_id,
 'تطوير مهارات الاتصال الفعال في بيئة العمل',
 'Develop effective communication skills in work environment', 'متطلب كلية', ARRAY[]::TEXT[]);

-- ========================================
-- المستوى الثالث (Level 3) - 18 ساعة
-- ========================================

INSERT INTO courses (course_id, code, name_ar, name_en, credits, level, department_id, description_ar, description_en, category, prerequisites) VALUES
('CIS210', 'CIS 210', 'برمجة الإنترنت', 'Web Programming', 3, 3, dept_id,
 'تطوير تطبيقات الويب باستخدام HTML, CSS, JavaScript',
 'Develop web applications using HTML, CSS, JavaScript', 'متطلب قسم', ARRAY['CIS110']),

('MIS210', 'MIS 210', 'تحليل وتصميم النظم', 'Systems Analysis and Design', 3, 3, dept_id,
 'منهجيات تحليل وتصميم نظم المعلومات',
 'Methodologies for information systems analysis and design', 'متطلب قسم', ARRAY['MIS100']),

('CIS220', 'CIS 220', 'قواعد البيانات', 'Database Management', 3, 3, dept_id,
 'أساسيات قواعد البيانات و SQL',
 'Database fundamentals and SQL', 'متطلب قسم', ARRAY['CIS110']),

('ACC201', 'ACC 201', 'مبادئ المحاسبة (2)', 'Principles of Accounting II', 3, 3, dept_id,
 'محاسبة الشركات والقوائم المالية',
 'Corporate accounting and financial statements', 'متطلب كلية', ARRAY['ACC101']),

('MKT201', 'MKT 201', 'مبادئ التسويق', 'Principles of Marketing', 3, 3, dept_id,
 'المفاهيم الأساسية للتسويق واستراتيجياته',
 'Basic marketing concepts and strategies', 'متطلب كلية', ARRAY['MGT101']),

('FIN201', 'FIN 201', 'إدارة مالية', 'Financial Management', 3, 3, dept_id,
 'مبادئ الإدارة المالية واتخاذ القرارات المالية',
 'Financial management principles and financial decision making', 'متطلب كلية', ARRAY['ACC101']);

-- ========================================
-- المستوى الرابع (Level 4) - 18 ساعة
-- ========================================

INSERT INTO courses (course_id, code, name_ar, name_en, credits, level, department_id, description_ar, description_en, category, prerequisites) VALUES
('MIS310', 'MIS 310', 'نظم المعلومات الإدارية المتقدمة', 'Advanced MIS', 3, 4, dept_id,
 'موضوعات متقدمة في نظم المعلومات الإدارية',
 'Advanced topics in management information systems', 'متطلب قسم', ARRAY['MIS210']),

('CIS310', 'CIS 310', 'برمجة قواعد البيانات', 'Database Programming', 3, 4, dept_id,
 'البرمجة المتقدمة لقواعد البيانات',
 'Advanced database programming', 'متطلب قسم', ARRAY['CIS220']),

('MIS320', 'MIS 320', 'أمن المعلومات', 'Information Security', 3, 4, dept_id,
 'أساسيات أمن المعلومات والحماية السيبرانية',
 'Information security fundamentals and cybersecurity', 'متطلب قسم', ARRAY['MIS210']),

('CIS330', 'CIS 330', 'الشبكات وتطبيقاتها', 'Networks and Applications', 3, 4, dept_id,
 'أساسيات شبكات الحاسب وتطبيقاتها',
 'Computer networks fundamentals and applications', 'متطلب قسم', ARRAY['CIS101']),

('MIS330', 'MIS 330', 'نظم دعم القرار', 'Decision Support Systems', 3, 4, dept_id,
 'نظم دعم القرار وأدوات ذكاء الأعمال',
 'Decision support systems and business intelligence tools', 'متطلب قسم', ARRAY['MIS210', 'STAT101']),

('MGT301', 'MGT 301', 'إدارة الموارد البشرية', 'Human Resource Management', 3, 4, dept_id,
 'مبادئ إدارة الموارد البشرية واستراتيجياتها',
 'Human resource management principles and strategies', 'متطلب كلية', ARRAY['MGT101']);

-- ========================================
-- المستوى الخامس (Level 5) - 18 ساعة
-- ========================================

INSERT INTO courses (course_id, code, name_ar, name_en, credits, level, department_id, description_ar, description_en, category, prerequisites) VALUES
('MIS410', 'MIS 410', 'إدارة المشاريع التقنية', 'IT Project Management', 3, 5, dept_id,
 'إدارة مشاريع تقنية المعلومات وتخطيطها',
 'IT project management and planning', 'متطلب قسم', ARRAY['MIS310']),

('CIS410', 'CIS 410', 'تطوير تطبيقات الجوال', 'Mobile App Development', 3, 5, dept_id,
 'تطوير تطبيقات الهواتف الذكية',
 'Smartphone applications development', 'متطلب قسم', ARRAY['CIS210']),

('MIS420', 'MIS 420', 'ذكاء الأعمال', 'Business Intelligence', 3, 5, dept_id,
 'أدوات وتقنيات ذكاء الأعمال وتحليل البيانات',
 'Business intelligence tools, techniques and data analytics', 'متطلب قسم', ARRAY['MIS330']),

('MIS430', 'MIS 430', 'التجارة الإلكترونية', 'E-Commerce', 3, 5, dept_id,
 'نماذج وتطبيقات التجارة الإلكترونية',
 'E-commerce models and applications', 'متطلب قسم', ARRAY['MIS310']),

('CIS420', 'CIS 420', 'الحوسبة السحابية', 'Cloud Computing', 3, 5, dept_id,
 'مفاهيم الحوسبة السحابية وتطبيقاتها',
 'Cloud computing concepts and applications', 'متطلب قسم', ARRAY['CIS330']),

('MIS440', 'MIS 440', 'إدارة المعرفة', 'Knowledge Management', 3, 5, dept_id,
 'نظم إدارة المعرفة في المنظمات',
 'Knowledge management systems in organizations', 'متطلب قسم', ARRAY['MIS310']);

-- ========================================
-- المستوى السادس (Level 6) - 18 ساعة
-- ========================================

INSERT INTO courses (course_id, code, name_ar, name_en, credits, level, department_id, description_ar, description_en, category, prerequisites) VALUES
('MIS510', 'MIS 510', 'تخطيط موارد المؤسسات (ERP)', 'Enterprise Resource Planning', 3, 6, dept_id,
 'نظم تخطيط موارد المؤسسات وتطبيقاتها',
 'ERP systems and their applications', 'متطلب قسم', ARRAY['MIS410']),

('MIS520', 'MIS 520', 'إدارة علاقات العملاء (CRM)', 'Customer Relationship Management', 3, 6, dept_id,
 'نظم إدارة علاقات العملاء واستراتيجياتها',
 'CRM systems and strategies', 'متطلب قسم', ARRAY['MIS430']),

('CIS510', 'CIS 510', 'الذكاء الاصطناعي', 'Artificial Intelligence', 3, 6, dept_id,
 'مقدمة في الذكاء الاصطناعي وتطبيقاته',
 'Introduction to AI and its applications', 'متطلب قسم', ARRAY['CIS410']),

('MIS530', 'MIS 530', 'إدارة سلسلة التوريد', 'Supply Chain Management', 3, 6, dept_id,
 'نظم إدارة سلسلة التوريد الإلكترونية',
 'Electronic supply chain management systems', 'متطلب قسم', ARRAY['MIS510']),

('MIS540', 'MIS 540', 'إدارة خدمات تقنية المعلومات', 'IT Service Management', 3, 6, dept_id,
 'إدارة خدمات تقنية المعلومات حسب ITIL',
 'IT service management according to ITIL', 'متطلب قسم', ARRAY['MIS410']),

('CIS520', 'CIS 520', 'تحليل البيانات الضخمة', 'Big Data Analytics', 3, 6, dept_id,
 'تقنيات تحليل البيانات الضخمة',
 'Big data analytics techniques', 'متطلب قسم', ARRAY['MIS420']);

-- ========================================
-- المستوى السابع (Level 7) - 15 ساعة
-- ========================================

INSERT INTO courses (course_id, code, name_ar, name_en, credits, level, department_id, description_ar, description_en, category, prerequisites) VALUES
('MIS610', 'MIS 610', 'حوكمة تقنية المعلومات', 'IT Governance', 3, 7, dept_id,
 'إطار حوكمة تقنية المعلومات وأفضل الممارسات',
 'IT governance framework and best practices', 'متطلب قسم', ARRAY['MIS540']),

('MIS620', 'MIS 620', 'إدارة المخاطر التقنية', 'IT Risk Management', 3, 7, dept_id,
 'إدارة المخاطر المرتبطة بتقنية المعلومات',
 'Managing IT related risks', 'متطلب قسم', ARRAY['MIS320']),

('MIS630', 'MIS 630', 'الابتكار الرقمي', 'Digital Innovation', 3, 7, dept_id,
 'التحول الرقمي والابتكار في الأعمال',
 'Digital transformation and business innovation', 'متطلب قسم', ARRAY['MIS520']),

('CIS610', 'CIS 610', 'إنترنت الأشياء', 'Internet of Things', 3, 7, dept_id,
 'مفاهيم وتطبيقات إنترنت الأشياء',
 'IoT concepts and applications', 'متطلب قسم', ARRAY['CIS420']),

('MIS640', 'MIS 640', 'أخلاقيات المعلوماتية', 'Information Ethics', 3, 7, dept_id,
 'القضايا الأخلاقية في تقنية المعلومات',
 'Ethical issues in information technology', 'متطلب قسم', ARRAY['MIS320']);

-- ========================================
-- المستوى الثامن (Level 8) - 12 ساعة
-- ========================================

INSERT INTO courses (course_id, code, name_ar, name_en, credits, level, department_id, description_ar, description_en, category, prerequisites) VALUES
('MIS700', 'MIS 700', 'مشروع التخرج (1)', 'Graduation Project I', 3, 8, dept_id,
 'بداية مشروع التخرج وتحديد المشكلة',
 'Start graduation project and problem definition', 'متطلب قسم', ARRAY['MIS610']),

('MIS710', 'MIS 710', 'مشروع التخرج (2)', 'Graduation Project II', 3, 8, dept_id,
 'إكمال مشروع التخرج وعرضه',
 'Complete and present graduation project', 'متطلب قسم', ARRAY['MIS700']),

('MIS720', 'MIS 720', 'ندوة في نظم المعلومات', 'Seminar in MIS', 2, 8, dept_id,
 'موضوعات معاصرة في نظم المعلومات',
 'Contemporary topics in information systems', 'متطلب قسم', ARRAY['MIS610']),

('MIS730', 'MIS 730', 'التدريب الميداني', 'Internship', 4, 8, dept_id,
 'التدريب العملي في منظمات القطاع العام أو الخاص',
 'Practical training in public or private sector organizations', 'متطلب قسم', ARRAY['MIS610']);

END $$;

-- ========================================
-- إضافة عروض المقررات للفصل الحالي
-- ========================================

DO $$
DECLARE
  course_rec RECORD;
BEGIN
  FOR course_rec IN SELECT id FROM courses LOOP
    INSERT INTO course_offers (course_id, semester, year, section, max_students, enrolled_students, active)
    VALUES (course_rec.id, 'Fall', 2024, 'A', 40, 0, true);
  END LOOP;
END $$;

-- ========================================
-- تحديث الخطة الدراسية
-- ========================================

DO $$
DECLARE
  course_rec RECORD;
BEGIN
  FOR course_rec IN SELECT id, level FROM courses LOOP
    INSERT INTO course_plan (course_id, level, semester, is_required)
    VALUES (course_rec.id, course_rec.level, 1, true);
  END LOOP;
END $$;

-- ========================================
-- انتهى إضافة المقررات ✅
-- Total: 49 مقرر
-- ========================================
