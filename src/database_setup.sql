-- ========================================
-- نظام تسجيل المقررات - جامعة الملك خالد
-- إعداد قاعدة البيانات الكاملة
-- ========================================

-- ========================================
-- 1️⃣ جدول الأقسام
-- ========================================
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- إدخال الأقسام الأساسية
INSERT INTO departments (code, name_ar, name_en) VALUES
('MIS', 'نظم المعلومات الإدارية', 'Management Information Systems'),
('BA', 'إدارة الأعمال', 'Business Administration'),
('ACC', 'المحاسبة', 'Accounting'),
('MKT', 'التسويق', 'Marketing'),
('FIN', 'التمويل', 'Finance')
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
-- ✅ تفعيل Row Level Security (RLS)
-- ========================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;
