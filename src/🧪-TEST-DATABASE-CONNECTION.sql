-- ========================================
-- 🧪 اختبار الاتصال بقاعدة البيانات
-- ========================================

-- ✅ 1. التحقق من وجود الجداول
SELECT 
  '1️⃣ الجداول الموجودة:' as test_name,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN ('departments', 'users', 'students', 'supervisors', 'courses', 'course_offerings', 'enrollments');

-- ✅ 2. عدد السجلات في كل جدول
SELECT '2️⃣ عدد السجلات في الجداول:' as test_name;

SELECT 'departments' as table_name, COUNT(*) as count FROM departments
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'supervisors', COUNT(*) FROM supervisors
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'course_offerings', COUNT(*) FROM course_offerings
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
ORDER BY table_name;

-- ✅ 3. التحقق من الأقسام
SELECT 
  '3️⃣ الأقسام المتاحة:' as test_name,
  COUNT(*) as count,
  STRING_AGG(code || ' - ' || name_ar, ', ') as departments
FROM departments;

-- ✅ 4. التحقق من المقررات حسب المستوى
SELECT 
  '4️⃣ المقررات حسب المستوى:' as test_name,
  level,
  COUNT(*) as count,
  STRING_AGG(code, ', ' ORDER BY code) as courses
FROM courses
WHERE active = TRUE
GROUP BY level
ORDER BY level;

-- ✅ 5. التحقق من المستخدمين
SELECT 
  '5️⃣ المستخدمين حسب الدور:' as test_name,
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- ✅ 6. التحقق من الطلاب
SELECT 
  '6️⃣ الطلاب حسب المستوى:' as test_name,
  level,
  COUNT(*) as count
FROM students
GROUP BY level
ORDER BY level;

-- ✅ 7. التحقق من التسجيلات
SELECT 
  '7️⃣ التسجيلات حسب الحالة:' as test_name,
  status,
  COUNT(*) as count
FROM enrollments
GROUP BY status
ORDER BY status;

-- ✅ 8. عرض آخر 5 مستخدمين مسجلين
SELECT 
  '8️⃣ آخر 5 مستخدمين:' as test_name;

SELECT 
  u.student_id,
  u.name,
  u.email,
  u.role,
  s.level,
  s.major,
  s.gpa,
  u.created_at
FROM users u
LEFT JOIN students s ON u.id = s.user_id
ORDER BY u.created_at DESC
LIMIT 5;

-- ✅ 9. عرض آخر 5 تسجيلات في المقررات
SELECT 
  '9️⃣ آخر 5 تسجيلات:' as test_name;

SELECT 
  u.student_id,
  u.name as student_name,
  c.code as course_code,
  c.name_ar as course_name,
  e.status,
  e.semester,
  e.year,
  e.registered_at
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
ORDER BY e.registered_at DESC
LIMIT 5;

-- ✅ 10. التحقق من العلاقات بين الجداول
SELECT 
  '🔟 التحقق من العلاقات:' as test_name;

-- عدد الطلاب الذين لديهم حسابات مستخدمين
SELECT 
  'طلاب بحسابات' as check_type,
  COUNT(*) as count
FROM students s
INNER JOIN users u ON s.user_id = u.id;

-- عدد المقررات التي لديها عروض (شعب)
SELECT 
  'مقررات بعروض' as check_type,
  COUNT(DISTINCT c.id) as count
FROM courses c
INNER JOIN course_offerings co ON c.id = co.course_id;

-- عدد التسجيلات المربوطة بمقررات صحيحة
SELECT 
  'تسجيلات صحيحة' as check_type,
  COUNT(*) as count
FROM enrollments e
INNER JOIN courses c ON e.course_id = c.id
INNER JOIN users u ON e.user_id = u.id;

-- ✅ النتيجة النهائية
SELECT 
  '✅ الاختبار اكتمل!' as message,
  NOW() as tested_at;
