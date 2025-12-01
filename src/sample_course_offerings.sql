-- ========================================
-- بيانات تجريبية: عروض المقررات (الشعب)
-- الفصل الدراسي: الأول 1446
-- ========================================

-- إضافة شعب للمقررات (عينة من المستويات المختلفة)
INSERT INTO course_offerings (course_id, section, semester, year, instructor_name, schedule_days, schedule_time, room, capacity, enrolled, status) 
SELECT 
  c.id,
  '01',
  'الفصل الأول',
  1446,
  CASE 
    WHEN c.code = 'MIS101' THEN 'د. أحمد محمد العمري'
    WHEN c.code = 'CS101' THEN 'د. سارة عبدالله الشهري'
    WHEN c.code = 'MATH101' THEN 'د. خالد إبراهيم القحطاني'
    WHEN c.code = 'MIS201' THEN 'د. فاطمة حسن الزهراني'
    WHEN c.code = 'CS201' THEN 'د. محمد علي الغامدي'
    WHEN c.code = 'MIS301' THEN 'د. نورة سعيد العتيبي'
    WHEN c.code = 'MIS302' THEN 'د. عبدالرحمن يوسف الدوسري'
    WHEN c.code = 'MIS401' THEN 'د. ليلى أحمد الأحمدي'
    WHEN c.code = 'MIS402' THEN 'د. عمر عبدالله الشمراني'
    WHEN c.code = 'MIS501' THEN 'د. هند محمد الحربي'
    WHEN c.code = 'MIS502' THEN 'د. سلطان فهد المالكي'
    WHEN c.code = 'MIS601' THEN 'د. منى صالح العنزي'
    WHEN c.code = 'MIS701' THEN 'د. ماجد عبدالعزيز السبيعي'
    WHEN c.code = 'MIS801' THEN 'د. رانيا خالد البقمي'
    ELSE 'د. عبدالله محمد آل سعود'
  END,
  ARRAY['الأحد', 'الثلاثاء']::TEXT[],
  '08:00 - 09:40',
  CASE 
    WHEN c.level = 1 THEN 'قاعة 101'
    WHEN c.level = 2 THEN 'قاعة 201'
    WHEN c.level = 3 THEN 'قاعة 301'
    WHEN c.level = 4 THEN 'قاعة 401'
    WHEN c.level = 5 THEN 'قاعة 501'
    WHEN c.level = 6 THEN 'قاعة 601'
    WHEN c.level = 7 THEN 'قاعة 701'
    WHEN c.level = 8 THEN 'قاعة 801'
    ELSE 'قاعة 100'
  END,
  40,
  FLOOR(RANDOM() * 30 + 5)::INTEGER,
  'open'
FROM courses c
WHERE c.code IN ('MIS101', 'CS101', 'MATH101', 'MIS201', 'CS201', 'MIS301', 'MIS302', 'MIS401', 'MIS402', 'MIS501', 'MIS502', 'MIS601', 'MIS701', 'MIS801')
ON CONFLICT (course_id, section, semester, year) DO NOTHING;

-- إضافة شعبة ثانية لبعض المقررات الشائعة
INSERT INTO course_offerings (course_id, section, semester, year, instructor_name, schedule_days, schedule_time, room, capacity, enrolled, status) 
SELECT 
  c.id,
  '02',
  'الفصل الأول',
  1446,
  CASE 
    WHEN c.code = 'MIS101' THEN 'د. إبراهيم محمد الشهري'
    WHEN c.code = 'CS101' THEN 'د. ريم عبدالله الغامدي'
    WHEN c.code = 'MATH101' THEN 'د. فيصل سليمان القرني'
    WHEN c.code = 'MIS201' THEN 'د. أمل حسين العسيري'
    WHEN c.code = 'CS201' THEN 'د. طارق محمد الشمراني'
    ELSE 'د. مريم أحمد الزهراني'
  END,
  ARRAY['الاثنين', 'الأربعاء']::TEXT[],
  '10:00 - 11:40',
  CASE 
    WHEN c.level = 1 THEN 'قاعة 102'
    WHEN c.level = 2 THEN 'قاعة 202'
    WHEN c.level = 3 THEN 'قاعة 302'
    ELSE 'قاعة 101'
  END,
  40,
  FLOOR(RANDOM() * 30 + 5)::INTEGER,
  'open'
FROM courses c
WHERE c.code IN ('MIS101', 'CS101', 'MATH101', 'MIS201', 'CS201')
ON CONFLICT (course_id, section, semester, year) DO NOTHING;

-- إضافة شعب مسائية
INSERT INTO course_offerings (course_id, section, semester, year, instructor_name, schedule_days, schedule_time, room, capacity, enrolled, status) 
SELECT 
  c.id,
  'M01',
  'الفصل الأول',
  1446,
  'د. عبدالعزيز راشد الدوسري',
  ARRAY['الأحد', 'الثلاثاء']::TEXT[],
  '17:00 - 18:40',
  'قاعة 501 (مسائي)',
  35,
  FLOOR(RANDOM() * 25 + 3)::INTEGER,
  'open'
FROM courses c
WHERE c.code IN ('MIS101', 'MIS201', 'MIS301')
ON CONFLICT (course_id, section, semester, year) DO NOTHING;

-- عرض النتيجة
SELECT 
  COUNT(*) as total_sections,
  COUNT(DISTINCT course_id) as total_courses
FROM course_offerings
WHERE semester = 'الفصل الأول' AND year = 1446;
