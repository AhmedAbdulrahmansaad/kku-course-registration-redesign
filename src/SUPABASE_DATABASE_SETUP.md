# 🗄️ إعداد قاعدة البيانات في Supabase

## ⚡ الطريقة السريعة (موصى بها)

### الخطوة 1️⃣: انسخ الكود من ملف SQL
افتح ملف `database_setup.sql` وانسخ المحتوى بالكامل

### الخطوة 2️⃣: نفذ في Supabase
1. اذهب إلى **Supabase Dashboard**
2. افتح **SQL Editor**
3. الصق الكود الذي نسخته
4. اضغط **Run** أو **Ctrl+Enter**

### الخطوة 3️⃣: تحقق من النجاح
افتح ملف `verify_database.sql` وشغل الاستعلامات للتحقق

---

## نظرة عامة
هذا الدليل يوضح كيفية إعداد قاعدة البيانات الكاملة لنظام تسجيل المقررات بجامعة الملك خالد.

## ✅ الجداول المطلوبة

النظام يستخدم **7 جداول رئيسية**:

1. **users** - معلومات جميع المستخدمين (طلاب، مشرفين، مدراء)
2. **students** - معلومات إضافية خاصة بالطلاب فقط
3. **supervisors** - معلومات المشرفين الأكاديميين
4. **admins** - معلومات مدراء النظام
5. **departments** - الأقسام الأكاديمية في الكلية
6. **courses** - المقررات الدراسية
7. **course_offerings** - عروض المقررات (الشعب المتاحة)

---

## 📋 الكود الكامل لإنشاء الجداول

قم بتنفيذ الكود التالي في **Supabase SQL Editor**:

```sql
-- ========================================
-- 1️⃣ جدول الأقسام
-- ========================================
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- إدخال الأقسام الأساسية
INSERT INTO departments (code, name_ar, name_en, description_ar, description_en) VALUES
('MIS', 'نظم المعلومات الإدارية', 'Management Information Systems', 'قسم نظم المعلومات الإدارية', 'MIS Department'),
('BA', 'إدارة الأعمال', 'Business Administration', 'قسم إدارة الأعمال', 'Business Administration Department'),
('ACC', 'المحاسبة', 'Accounting', 'قسم المحاسبة', 'Accounting Department'),
('MKT', 'التسويق', 'Marketing', 'قسم التسويق', 'Marketing Department'),
('FIN', 'التمويل', 'Finance', 'قسم التمويل', 'Finance Department')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- 2️⃣ جدول المستخدمين (الجدول الرئيسي)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'supervisor', 'admin')),
  department_id INTEGER REFERENCES departments(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء Index لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ========================================
-- 3️⃣ جدول الطلاب (البيانات الأكاديمية)
-- ========================================
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  gpa NUMERIC(3, 2) DEFAULT 0.0 CHECK (gpa >= 0 AND gpa <= 5),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  major TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated', 'withdrawn')),
  enrollment_year INTEGER,
  expected_graduation_year INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء Index
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);
CREATE INDEX IF NOT EXISTS idx_students_major ON students(major);

-- ========================================
-- 4️⃣ جدول المشرفين
-- ========================================
CREATE TABLE IF NOT EXISTS supervisors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id),
  specialization TEXT,
  office_location TEXT,
  max_students INTEGER DEFAULT 50,
  current_students INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 5️⃣ جدول المدراء
-- ========================================
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT ARRAY['all'],
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 6️⃣ جدول المقررات
-- ========================================
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits >= 1 AND credits <= 6),
  level INTEGER CHECK (level >= 1 AND level <= 8),
  department_id INTEGER REFERENCES departments(id),
  prerequisite_codes TEXT[],
  description_ar TEXT,
  description_en TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء Index
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);

-- ========================================
-- 7️⃣ جدول عروض المقررات (الشعب)
-- ========================================
CREATE TABLE IF NOT EXISTS course_offerings (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section VARCHAR(10) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  instructor_name TEXT,
  schedule_days TEXT[],
  schedule_time TEXT,
  room TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  enrolled INTEGER DEFAULT 0 CHECK (enrolled >= 0),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, section, semester, year)
);

-- إنشاء Index
CREATE INDEX IF NOT EXISTS idx_offerings_course_id ON course_offerings(course_id);
CREATE INDEX IF NOT EXISTS idx_offerings_semester ON course_offerings(semester, year);

-- ========================================
-- ✅ التحقق من إنشاء الجداول
-- ========================================
-- قم بتشغيل الاستعلام التالي للتحقق:
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'students', 'supervisors', 'admins', 'departments', 'courses', 'course_offerings')
ORDER BY table_name;
```

---

## 🔒 إعداد Row Level Security (RLS)

**مهم جداً:** قم بتفعيل RLS لكل جدول لحماية البيانات:

```sql
-- تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة: يسمح للجميع بقراءة البيانات عبر SERVICE_ROLE_KEY
-- (تذكر: نحن نستخدم SERVICE_ROLE_KEY في الـ Backend فقط)

-- سياسة للكتابة: يسمح فقط عبر SERVICE_ROLE_KEY
```

---

## 🎯 التحقق من نجاح الإعداد

بعد تنفيذ الكود أعلاه، قم بتشغيل هذا الاستعلام للتحقق:

```sql
-- 1. التحقق من الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. التحقق من بيانات الأقسام
SELECT * FROM departments ORDER BY code;

-- 3. التحقق من عدد المستخدمين (يجب أن يكون 0 في البداية)
SELECT role, COUNT(*) as count FROM users GROUP BY role;
```

---

## 🚨 ملاحظات مهمة

### ⚠️ العلاقة بين الجداول

```
auth.users (Supabase Auth)
    ↓
users (معلومات أساسية)
    ↓
    ├─→ students (إذا role = 'student')
    ├─→ supervisors (إذا role = 'supervisor')
    └─→ admins (إذا role = 'admin')
```

### ✅ ما تم إصلاحه في هذا الدليل

1. **جدول students**: يحفظ المستوى والتخصص والمعدل
2. **جدول users**: يربط بين Auth وبيانات المستخدم
3. **العلاقات الصحيحة**: `user_id` في `students` يشير إلى `users.id`

### 🔍 حل مشكلة "البيانات لا تظهر"

إذا كانت بيانات الطالب لا تظهر بعد التسجيل:

1. **تحقق من جدول students:**
   ```sql
   SELECT s.*, u.name, u.email 
   FROM students s 
   JOIN users u ON s.user_id = u.id;
   ```

2. **تحقق من البيانات المحفوظة:**
   ```sql
   SELECT * FROM students WHERE user_id = (
     SELECT id FROM users WHERE email = 'YOUR_EMAIL@kku.edu.sa'
   );
   ```

---

## 📊 مثال: إنشاء حساب طالب يدوياً للاختبار

```sql
-- 1. إنشاء حساب Auth أولاً (من خلال SignUp)
-- 2. إدخال بيانات المستخدم
INSERT INTO users (auth_id, student_id, email, name, role, department_id)
VALUES (
  'AUTH_UUID_HERE',  -- استبدل بـ UUID من auth.users
  '442012345',
  'test@kku.edu.sa',
  'طالب تجريبي',
  'student',
  (SELECT id FROM departments WHERE code = 'MIS')
);

-- 3. إدخال بيانات الطالب الأكاديمية
INSERT INTO students (user_id, level, major, gpa)
VALUES (
  (SELECT id FROM users WHERE student_id = '442012345'),
  3,
  'Management Information Systems',
  3.5
);
```

---

## ✨ الخلاصة

بعد تنفيذ هذا الدليل:
- ✅ جميع الجداول تم إنشاؤها بشكل صحيح
- ✅ البيانات ستُحفظ عند التسجيل
- ✅ بيانات الطالب (المستوى، التخصص، المعدل) ستظهر في لوحة التحكم
- ✅ النظام جاهز للاستخدام

إذا واجهتك أي مشاكل، تحقق من:
1. هل الجداول موجودة؟
2. هل البيانات محفوظة في جدول `students`؟
3. هل العلاقة بين `users` و `students` صحيحة؟