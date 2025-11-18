-- ========================================
-- 🎓 نظام تسجيل المقررات - جامعة الملك خالد
-- SQL Database Schema - Complete
-- ========================================

-- ========================================
-- 1. DEPARTMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  college_ar VARCHAR(255),
  college_en VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. USERS TABLE (للمصادقة والأدوار)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID, -- Supabase Auth ID
  student_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'supervisor', 'admin')),
  department_id UUID REFERENCES departments(id),
  phone VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. STUDENTS TABLE (معلومات الطلاب الأكاديمية)
-- ========================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 8),
  gpa DECIMAL(3,2) DEFAULT 0.00 CHECK (gpa >= 0 AND gpa <= 5),
  total_credits INTEGER DEFAULT 0,
  completed_credits INTEGER DEFAULT 0,
  major VARCHAR(50) DEFAULT 'MIS',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated')),
  enrollment_year INTEGER,
  expected_graduation_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ========================================
-- 4. SUPERVISORS TABLE (معلومات المشرفين)
-- ========================================
CREATE TABLE IF NOT EXISTS supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  specialization VARCHAR(255),
  max_students INTEGER DEFAULT 50,
  current_students INTEGER DEFAULT 0,
  office_location VARCHAR(100),
  office_hours VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ========================================
-- 5. ADMINS TABLE (معلومات المدراء)
-- ========================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"all": true}',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ========================================
-- 6. COURSES TABLE (المقررات الدراسية)
-- ========================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR(20) UNIQUE NOT NULL,
  code VARCHAR(20) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 8),
  department_id UUID REFERENCES departments(id),
  category VARCHAR(50), -- 'متطلب جامعة', 'متطلب كلية', 'متطلب قسم', 'اختياري'
  prerequisites TEXT[], -- Array of course codes
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 7. COURSE_PLAN TABLE (الخطة الدراسية)
-- ========================================
CREATE TABLE IF NOT EXISTS course_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)), -- 1=خريف، 2=ربيع
  is_required BOOLEAN DEFAULT true,
  recommended_prerequisites UUID[], -- Array of course UUIDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 8. COURSE_OFFERS TABLE (عروض المقررات)
-- ========================================
CREATE TABLE IF NOT EXISTS course_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  semester VARCHAR(20) NOT NULL, -- 'Fall 2024', 'Spring 2025'
  year INTEGER NOT NULL,
  section VARCHAR(10) DEFAULT 'A',
  instructor_id UUID REFERENCES users(id),
  max_students INTEGER DEFAULT 40,
  enrolled_students INTEGER DEFAULT 0,
  schedule JSONB, -- [{day: 'sunday', start: '08:00', end: '09:30', room: 'A201'}]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 9. REGISTRATIONS TABLE (تسجيل الطلاب)
-- ========================================
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  course_offer_id UUID REFERENCES course_offers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'withdrawn')),
  grade VARCHAR(5),
  grade_point DECIMAL(3,2),
  semester VARCHAR(20),
  year INTEGER,
  supervisor_id UUID REFERENCES users(id),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_offer_id)
);

-- ========================================
-- 10. NOTIFICATIONS TABLE (الإشعارات)
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'registration', 'approval', 'grade', 'announcement'
  reference_id UUID,
  reference_type VARCHAR(50), -- 'registration', 'course', 'announcement'
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- ========================================
-- 11. REPORTS TABLE (التقارير الأكاديمية)
-- ========================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  semester VARCHAR(20),
  year INTEGER,
  total_credits INTEGER DEFAULT 0,
  semester_gpa DECIMAL(3,2),
  cumulative_gpa DECIMAL(3,2),
  total_courses INTEGER DEFAULT 0,
  passed_courses INTEGER DEFAULT 0,
  failed_courses INTEGER DEFAULT 0,
  report_data JSONB, -- Detailed report
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 12. AGREEMENTS TABLE (التعهدات)
-- ========================================
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  language VARCHAR(5) DEFAULT 'ar',
  agreed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 13. AI_LOGS TABLE (سجل المساعد الذكي)
-- ========================================
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context JSONB,
  response_time INTEGER, -- milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES للأداء
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);
CREATE INDEX IF NOT EXISTS idx_students_gpa ON students(gpa);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department_id);

CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_course ON registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_semester ON registrations(semester, year);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_reports_student ON reports(student_id);
CREATE INDEX IF NOT EXISTS idx_reports_semester ON reports(semester, year);

-- ========================================
-- TRIGGERS لتحديث updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON supervisors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_offers_updated_at BEFORE UPDATE ON course_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- سياسات مؤقتة للتطوير (السماح للجميع)
CREATE POLICY "Enable all for authenticated users" ON departments FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON students FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON supervisors FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON admins FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON courses FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON course_plan FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON course_offers FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON registrations FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON notifications FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON reports FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON agreements FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON ai_logs FOR ALL USING (true);

-- ========================================
-- البيانات الأولية
-- ========================================

-- 1. إضافة قسم نظم المعلومات الإدارية
INSERT INTO departments (code, name_ar, name_en, college_ar, college_en)
VALUES ('MIS', 'نظم المعلومات الإدارية', 'Management Information Systems', 
        'كلية إدارة الأعمال', 'College of Business Administration')
ON CONFLICT (code) DO NOTHING;

-- 2. إضافة المقررات الدراسية (49 مقرر)
-- سيتم إضافتها في script منفصل

-- ========================================
-- ملاحظات مهمة
-- ========================================

-- 1. بعد تنفيذ هذا الـ SQL:
--    ✅ جميع الجداول جاهزة
--    ✅ العلاقات مُنشأة
--    ✅ الـ Indexes للأداء
--    ✅ الـ Triggers للتحديث التلقائي
--    ✅ RLS مُفعل

-- 2. الخطوة التالية:
--    - تنفيذ SQL لإضافة المقررات
--    - إنشاء حساب المدير
--    - ربط النظام بقاعدة البيانات

-- 3. RLS Policies:
--    - حالياً مفتوحة للتطوير
--    - يمكن تخصيصها لاحقاً حسب الأدوار

-- ========================================
-- انتهى إنشاء الجداول ✅
-- ========================================
