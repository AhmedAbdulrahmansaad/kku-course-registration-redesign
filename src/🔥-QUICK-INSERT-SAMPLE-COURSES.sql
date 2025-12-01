-- ========================================
-- إدخال مقررات تجريبية سريعة
-- ========================================

-- 📌 ملاحظة: تأكد من تشغيل database_setup.sql أولاً!

-- إدخال المقررات الأساسية (10 مقررات تجريبية)
INSERT INTO courses (code, name_ar, name_en, credits, level, prerequisite_codes, description_ar, description_en, active, department_id) VALUES
-- المستوى الأول
('MIS101', 'مقدمة في نظم المعلومات الإدارية', 'Introduction to MIS', 3, 1, ARRAY[]::TEXT[], 'مقدمة شاملة لنظم المعلومات الإدارية ودورها في المنظمات', 'Comprehensive introduction to Management Information Systems', TRUE, 1),
('CS101', 'أساسيات البرمجة', 'Programming Fundamentals', 3, 1, ARRAY[]::TEXT[], 'أساسيات البرمجة باستخدام Python', 'Programming basics using Python', TRUE, 1),
('MATH101', 'الرياضيات للأعمال', 'Business Mathematics', 3, 1, ARRAY[]::TEXT[], 'مقدمة في الرياضيات للأعمال والإدارة', 'Introduction to business mathematics', TRUE, 1),
('ENG101', 'اللغة الإنجليزية للأعمال', 'Business English', 3, 1, ARRAY[]::TEXT[], 'تطوير مهارات اللغة الإنجليزية للاتصالات التجارية', 'English language skills for business', TRUE, 1),

-- المستوى الثاني
('MIS201', 'قواعد البيانات', 'Database Systems', 3, 2, ARRAY['MIS101']::TEXT[], 'تصميم وإدارة قواعد البيانات العلائقية', 'Relational database design and management', TRUE, 1),
('MIS202', 'تحليل وتصميم النظم', 'Systems Analysis & Design', 3, 2, ARRAY['MIS101']::TEXT[], 'منهجيات تحليل وتصميم نظم المعلومات', 'Information systems analysis and design methodologies', TRUE, 1),
('CS201', 'البرمجة الكائنية', 'Object-Oriented Programming', 3, 2, ARRAY['CS101']::TEXT[], 'مفاهيم البرمجة الكائنية باستخدام Java', 'Object-oriented programming concepts using Java', TRUE, 1),
('STAT201', 'الإحصاء للأعمال', 'Business Statistics', 3, 2, ARRAY['MATH101']::TEXT[], 'الأساليب الإحصائية في تحليل البيانات التجارية', 'Statistical methods for business data analysis', TRUE, 1),

-- المستوى الثالث
('MIS301', 'إدارة المشاريع التقنية', 'IT Project Management', 3, 3, ARRAY['MIS201', 'MIS202']::TEXT[], 'إدارة مشاريع تقنية المعلومات والتطبيقات', 'IT project and application management', TRUE, 1),
('MIS302', 'أمن المعلومات', 'Information Security', 3, 3, ARRAY['MIS201']::TEXT[], 'مبادئ وممارسات أمن المعلومات والشبكات', 'Information and network security principles', TRUE, 1)
ON CONFLICT (code) DO NOTHING;

-- إدخال عروض المقررات (Sections)
INSERT INTO course_offerings (course_id, section, semester, year, instructor_name, schedule_days, schedule_time, room, capacity, enrolled, status) VALUES
-- Fall 2024
((SELECT id FROM courses WHERE code = 'MIS101'), '01', 'Fall', 2024, 'د. محمد أحمد', ARRAY['الأحد', 'الثلاثاء'], '08:00-09:30', 'A201', 40, 0, 'open'),
((SELECT id FROM courses WHERE code = 'CS101'), '01', 'Fall', 2024, 'د. فاطمة علي', ARRAY['الاثنين', 'الأربعاء'], '10:00-11:30', 'B105', 35, 0, 'open'),
((SELECT id FROM courses WHERE code = 'MATH101'), '01', 'Fall', 2024, 'د. عبدالله خالد', ARRAY['الأحد', 'الثلاثاء'], '10:00-11:30', 'C301', 40, 0, 'open'),
((SELECT id FROM courses WHERE code = 'ENG101'), '01', 'Fall', 2024, 'د. سارة محمد', ARRAY['الاثنين', 'الأربعاء'], '08:00-09:30', 'D210', 30, 0, 'open'),

((SELECT id FROM courses WHERE code = 'MIS201'), '01', 'Fall', 2024, 'د. أحمد حسن', ARRAY['الأحد', 'الثلاثاء'], '12:00-13:30', 'A202', 35, 0, 'open'),
((SELECT id FROM courses WHERE code = 'MIS202'), '01', 'Fall', 2024, 'د. سارة محمد', ARRAY['الاثنين', 'الأربعاء'], '12:00-13:30', 'A203', 35, 0, 'open'),
((SELECT id FROM courses WHERE code = 'CS201'), '01', 'Fall', 2024, 'د. خالد عبدالله', ARRAY['الأحد', 'الثلاثاء'], '14:00-15:30', 'B106', 30, 0, 'open'),
((SELECT id FROM courses WHERE code = 'STAT201'), '01', 'Fall', 2024, 'د. نورة أحمد', ARRAY['الاثنين', 'الأربعاء'], '14:00-15:30', 'C302', 40, 0, 'open'),

((SELECT id FROM courses WHERE code = 'MIS301'), '01', 'Fall', 2024, 'د. محمد رشيد', ARRAY['الأحد', 'الثلاثاء'], '16:00-17:30', 'A204', 30, 0, 'open'),
((SELECT id FROM courses WHERE code = 'MIS302'), '01', 'Fall', 2024, 'د. أحمد علي', ARRAY['الاثنين', 'الأربعاء'], '16:00-17:30', 'A205', 30, 0, 'open')
ON CONFLICT (course_id, section, semester, year) DO NOTHING;

-- عرض النتائج
SELECT 
  'إجمالي عدد المقررات:' as message,
  COUNT(*) as count
FROM courses;

SELECT 
  'إجمالي عدد العروض (الشعب):' as message,
  COUNT(*) as count
FROM course_offerings;

-- عرض المقررات حسب المستوى
SELECT 
  level as المستوى,
  COUNT(*) as عدد_المقررات,
  STRING_AGG(code, ', ' ORDER BY code) as رموز_المقررات
FROM courses
WHERE active = TRUE
GROUP BY level
ORDER BY level;
