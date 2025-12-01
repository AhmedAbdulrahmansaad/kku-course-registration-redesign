-- ========================================
-- استعلامات التحقق من نجاح إعداد قاعدة البيانات
-- ========================================

-- 1️⃣ التحقق من الجداول المنشأة
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'students', 'supervisors', 'admins', 'departments', 'courses', 'course_offerings')
ORDER BY table_name;

-- 2️⃣ التحقق من بيانات الأقسام
SELECT * FROM departments ORDER BY code;

-- 3️⃣ عدد المستخدمين حسب الدور
SELECT 
  role, 
  COUNT(*) as count 
FROM users 
GROUP BY role;

-- 4️⃣ عدد الطلاب
SELECT COUNT(*) as total_students FROM students;

-- 5️⃣ التحقق من بيانات طالب معين (استبدل البريد)
SELECT 
  u.name, 
  u.student_id, 
  u.email,
  u.role,
  s.level, 
  s.major, 
  s.gpa,
  s.total_credits,
  s.completed_credits
FROM users u
LEFT JOIN students s ON s.user_id = u.id
WHERE u.role = 'student'
LIMIT 5;
