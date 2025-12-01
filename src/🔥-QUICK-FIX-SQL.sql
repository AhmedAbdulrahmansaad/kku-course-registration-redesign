-- 🔥 إصلاح سريع لقاعدة البيانات
-- تاريخ: 27 نوفمبر 2025
-- الهدف: التأكد من وجود جميع الأعمدة المطلوبة في الجداول

-- ========================================
-- 1. إضافة أعمدة الاتفاقية في جدول users (إذا لم تكن موجودة)
-- ========================================

-- التحقق وإضافة عمود agreement_accepted
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='agreement_accepted') THEN
        ALTER TABLE users ADD COLUMN agreement_accepted BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added agreement_accepted column to users table';
    ELSE
        RAISE NOTICE 'ℹ️ agreement_accepted column already exists';
    END IF;
END $$;

-- التحقق وإضافة عمود agreement_accepted_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='agreement_accepted_at') THEN
        ALTER TABLE users ADD COLUMN agreement_accepted_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added agreement_accepted_at column to users table';
    ELSE
        RAISE NOTICE 'ℹ️ agreement_accepted_at column already exists';
    END IF;
END $$;

-- ========================================
-- 2. التحقق من وجود الجداول الأساسية
-- ========================================

-- التحقق من جدول users
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
        RAISE NOTICE '✅ users table exists';
    ELSE
        RAISE EXCEPTION '❌ users table does not exist - please run database_setup.sql';
    END IF;
END $$;

-- التحقق من جدول students
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='students') THEN
        RAISE NOTICE '✅ students table exists';
    ELSE
        RAISE EXCEPTION '❌ students table does not exist - please run database_setup.sql';
    END IF;
END $$;

-- التحقق من جدول supervisors
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='supervisors') THEN
        RAISE NOTICE '✅ supervisors table exists';
    ELSE
        RAISE EXCEPTION '❌ supervisors table does not exist - please run database_setup.sql';
    END IF;
END $$;

-- التحقق من جدول courses
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='courses') THEN
        RAISE NOTICE '✅ courses table exists';
    ELSE
        RAISE EXCEPTION '❌ courses table does not exist - please run database_setup.sql';
    END IF;
END $$;

-- ========================================
-- 3. التحقق من الأعمدة المطلوبة في جدول students
-- ========================================

-- التحقق من عمود level
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='students' AND column_name='level') THEN
        RAISE NOTICE '✅ students.level column exists';
    ELSE
        RAISE EXCEPTION '❌ students.level column does not exist - please check your schema';
    END IF;
END $$;

-- التحقق من عمود gpa
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='students' AND column_name='gpa') THEN
        RAISE NOTICE '✅ students.gpa column exists';
    ELSE
        RAISE EXCEPTION '❌ students.gpa column does not exist - please check your schema';
    END IF;
END $$;

-- التحقق من عمود major
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='students' AND column_name='major') THEN
        RAISE NOTICE '✅ students.major column exists';
    ELSE
        RAISE EXCEPTION '❌ students.major column does not exist - please check your schema';
    END IF;
END $$;

-- ========================================
-- 4. تنظيف المستخدمين اليتامى (اختياري)
-- ========================================

-- عرض عدد المستخدمين في Auth ولكن ليس في جدول users
-- ملاحظة: هذا الاستعلام لا يمكن تشغيله في SQL Editor
-- يجب استخدام صفحة "أدوات النظام" في التطبيق

-- ========================================
-- 5. التحقق من صحة البيانات
-- ========================================

-- عرض عدد السجلات في كل جدول
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'supervisors', COUNT(*) FROM supervisors
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'registrations', COUNT(*) FROM registrations
UNION ALL
SELECT 'registration_requests', COUNT(*) FROM registration_requests;

-- ========================================
-- 6. التحقق من علاقات الجداول
-- ========================================

-- التحقق من أن كل طالب لديه مستخدم مرتبط
SELECT 
    COUNT(*) AS orphaned_students,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ لا يوجد طلاب يتامى'
        ELSE '⚠️ يوجد طلاب بدون مستخدمين!'
    END AS status
FROM students s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;

-- التحقق من أن كل مستخدم طالب لديه سجل في جدول students
SELECT 
    COUNT(*) AS users_without_student_record,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ كل الطلاب لديهم سجلات'
        ELSE '⚠️ يوجد مستخدمين بدون سجلات طلاب!'
    END AS status
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.role = 'student' AND s.id IS NULL;

-- ========================================
-- 7. عرض ملخص النظام
-- ========================================

SELECT 
    '📊 ملخص النظام' AS info,
    '' AS separator;

SELECT 
    'إجمالي المستخدمين' AS metric,
    COUNT(*) AS value
FROM users
UNION ALL
SELECT 
    'الطلاب',
    COUNT(*)
FROM users
WHERE role = 'student'
UNION ALL
SELECT 
    'المشرفون',
    COUNT(*)
FROM users
WHERE role = 'supervisor'
UNION ALL
SELECT 
    'المديرون',
    COUNT(*)
FROM users
WHERE role = 'admin'
UNION ALL
SELECT 
    'المقررات المتاحة',
    COUNT(*)
FROM courses
UNION ALL
SELECT 
    'التسجيلات النشطة',
    COUNT(*)
FROM registrations
WHERE status = 'approved'
UNION ALL
SELECT 
    'الطلبات المعلقة',
    COUNT(*)
FROM registration_requests
WHERE status = 'pending';

-- ========================================
-- ✅ انتهى الفحص
-- ========================================

-- إذا لم تظهر أي أخطاء، فهذا يعني أن قاعدة البيانات جاهزة! ✅
