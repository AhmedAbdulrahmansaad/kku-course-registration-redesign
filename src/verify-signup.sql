-- 🔍 التحقق من نجاح إنشاء الحساب
-- استخدم هذا الملف في Supabase SQL Editor للتحقق من البيانات

-- ========================================
-- 1️⃣ عرض آخر 5 مستخدمين تم إنشاؤهم
-- ========================================
SELECT 
  u.id as user_id,
  u.auth_id,
  u.student_id,
  u.email,
  u.name,
  u.role,
  u.active,
  u.created_at,
  -- معلومات الطالب (إن وجدت)
  s.level as student_level,
  s.major as student_major,
  s.gpa as student_gpa,
  s.status as student_status,
  -- معلومات المشرف (إن وجدت)
  sup.department as supervisor_department,
  sup.specialization as supervisor_specialization
FROM users u
LEFT JOIN students s ON u.id = s.user_id
LEFT JOIN supervisors sup ON u.id = sup.user_id
ORDER BY u.created_at DESC
LIMIT 5;

-- ========================================
-- 2️⃣ عد المستخدمين حسب الدور
-- ========================================
SELECT 
  role,
  COUNT(*) as count,
  COUNT(CASE WHEN active = true THEN 1 END) as active_count
FROM users
GROUP BY role
ORDER BY count DESC;

-- ========================================
-- 3️⃣ البحث عن مستخدم محدد بالبريد
-- ========================================
-- استبدل البريد بالبريد الذي أنشأته
SELECT 
  u.*,
  s.level,
  s.major,
  s.gpa,
  s.status
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.email = 'ahmed442012345@kku.edu.sa'; -- غير البريد هنا

-- ========================================
-- 4️⃣ البحث عن مستخدم محدد بالرقم الجامعي
-- ========================================
-- استبدل الرقم بالرقم الذي أنشأته
SELECT 
  u.*,
  s.level,
  s.major,
  s.gpa,
  s.status
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.student_id = '442012345'; -- غير الرقم هنا

-- ========================================
-- 5️⃣ التحقق من اكتمال بيانات الطلاب
-- ========================================
-- يجب أن لا يكون هناك طلاب بدون سجل في جدول students
SELECT 
  u.id,
  u.student_id,
  u.email,
  u.name,
  u.role,
  CASE 
    WHEN s.id IS NULL THEN '❌ Missing student record'
    ELSE '✅ Complete'
  END as status
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.role = 'student'
ORDER BY u.created_at DESC;

-- ========================================
-- 6️⃣ التحقق من اكتمال بيانات المشرفين
-- ========================================
-- يجب أن لا يكون هناك مشرفين بدون سجل في جدول supervisors
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  CASE 
    WHEN sup.id IS NULL THEN '❌ Missing supervisor record'
    ELSE '✅ Complete'
  END as status
FROM users u
LEFT JOIN supervisors sup ON u.id = sup.user_id
WHERE u.role = 'supervisor'
ORDER BY u.created_at DESC;

-- ========================================
-- 7️⃣ عرض جميع الطلاب مع بياناتهم الكاملة
-- ========================================
SELECT 
  u.student_id,
  u.email,
  u.name,
  s.level,
  s.major,
  s.gpa,
  s.status,
  s.enrollment_year,
  s.total_credits,
  s.completed_credits,
  u.created_at
FROM users u
INNER JOIN students s ON u.id = s.user_id
WHERE u.role = 'student'
ORDER BY u.created_at DESC;

-- ========================================
-- 8️⃣ عرض جميع المشرفين مع بياناتهم
-- ========================================
SELECT 
  u.email,
  u.name,
  sup.department,
  sup.specialization,
  u.created_at
FROM users u
INNER JOIN supervisors sup ON u.id = sup.user_id
WHERE u.role = 'supervisor'
ORDER BY u.created_at DESC;

-- ========================================
-- 9️⃣ عرض جميع المدراء
-- ========================================
SELECT 
  u.email,
  u.name,
  u.phone,
  u.active,
  u.created_at
FROM users u
WHERE u.role = 'admin'
ORDER BY u.created_at DESC;

-- ========================================
-- 🔟 التحقق من المستخدمين اليتامى في Auth
-- ========================================
-- هذا الاستعلام يكشف المستخدمين الموجودين في Auth لكن ليس في جدول users
-- ملاحظة: يجب تشغيل هذا من Supabase Dashboard → Authentication
-- لا يمكن تشغيله من SQL Editor

-- للتحقق يدوياً:
-- 1. افتح Supabase Dashboard
-- 2. اذهب إلى Authentication → Users
-- 3. انسخ auth_id لأي مستخدم
-- 4. ابحث عنه في جدول users:
SELECT 
  id,
  auth_id,
  email,
  name,
  role
FROM users
WHERE auth_id = 'paste-auth-id-here'; -- الصق auth_id هنا

-- ========================================
-- 1️⃣1️⃣ إحصائيات شاملة
-- ========================================
SELECT 
  'Total Users' as metric,
  COUNT(*) as value
FROM users

UNION ALL

SELECT 
  'Active Users' as metric,
  COUNT(*) as value
FROM users
WHERE active = true

UNION ALL

SELECT 
  'Students' as metric,
  COUNT(*) as value
FROM users
WHERE role = 'student'

UNION ALL

SELECT 
  'Supervisors' as metric,
  COUNT(*) as value
FROM users
WHERE role = 'supervisor'

UNION ALL

SELECT 
  'Admins' as metric,
  COUNT(*) as value
FROM users
WHERE role = 'admin'

UNION ALL

SELECT 
  'Students with records' as metric,
  COUNT(*) as value
FROM students

UNION ALL

SELECT 
  'Supervisors with records' as metric,
  COUNT(*) as value
FROM supervisors;

-- ========================================
-- 1️⃣2️⃣ التحقق من التخصصات
-- ========================================
SELECT 
  major,
  COUNT(*) as student_count
FROM students
GROUP BY major
ORDER BY student_count DESC;

-- ========================================
-- 1️⃣3️⃣ التحقق من المستويات
-- ========================================
SELECT 
  level,
  COUNT(*) as student_count
FROM students
GROUP BY level
ORDER BY level;

-- ========================================
-- 1️⃣4️⃣ التحقق من سنوات التسجيل
-- ========================================
SELECT 
  enrollment_year,
  COUNT(*) as student_count
FROM students
GROUP BY enrollment_year
ORDER BY enrollment_year DESC;

-- ========================================
-- 1️⃣5️⃣ آخر 10 مستخدمين تم إنشاؤهم (ملخص)
-- ========================================
SELECT 
  u.student_id,
  u.email,
  u.name,
  u.role,
  s.level,
  s.major,
  u.created_at,
  u.active
FROM users u
LEFT JOIN students s ON u.id = s.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- ========================================
-- 💡 نصائح للاستخدام:
-- ========================================
-- 1. شغل الاستعلامات واحداً تلو الآخر
-- 2. ركز على الاستعلام الأول (آخر 5 مستخدمين)
-- 3. استبدل البريد/الرقم الجامعي في الاستعلامات 3 و 4
-- 4. الاستعلامات 5 و 6 تكشف البيانات الناقصة
-- 5. استخدم الاستعلام 11 للإحصائيات الشاملة

-- ========================================
-- ✅ ما الذي يجب أن تراه بعد إنشاء حساب ناجح؟
-- ========================================
-- ✅ سجل في جدول users بـ auth_id صحيح
-- ✅ سجل في جدول students (للطلاب) بـ user_id مطابق
-- ✅ سجل في جدول supervisors (للمشرفين) بـ user_id مطابق
-- ✅ role صحيح (student/supervisor/admin)
-- ✅ active = true
-- ✅ level و major موجودان (للطلاب)
-- ✅ department و specialization موجودان (للمشرفين)
-- ✅ created_at حديث (آخر دقائق)
