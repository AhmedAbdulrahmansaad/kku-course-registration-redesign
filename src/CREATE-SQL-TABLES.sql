-- ========================================
-- SQL Schema للنظام الكامل
-- جامعة الملك خالد - نظام تسجيل المقررات
-- ========================================

-- 1. جدول الأقسام
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  college_ar VARCHAR(255),
  college_en VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول المستخدمين (students, supervisors, admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'supervisor', 'admin')),
  department_id UUID REFERENCES departments(id),
  level INTEGER,
  gpa DECIMAL(3,2),
  phone VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول المقررات
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR(20) UNIQUE NOT NULL,
  code VARCHAR(20) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  credits INTEGER NOT NULL,
  level INTEGER NOT NULL,
  department_id UUID REFERENCES departments(id),
  prerequisites TEXT[], -- Array of course codes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول عروض المقررات (الفصول الدراسية)
CREATE TABLE IF NOT EXISTS course_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  semester VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  section VARCHAR(10),
  instructor_id UUID REFERENCES users(id),
  max_students INTEGER DEFAULT 40,
  enrolled_students INTEGER DEFAULT 0,
  schedule JSONB, -- {day, start_time, end_time, room}
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول التسجيلات
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_offer_id UUID REFERENCES course_offers(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  grade VARCHAR(5),
  grade_point DECIMAL(3,2),
  supervisor_id UUID REFERENCES users(id),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_offer_id)
);

-- 6. جدول الجداول الدراسية
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  day VARCHAR(20),
  start_time TIME,
  end_time TIME,
  room VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جدول التقارير الأكاديمية
CREATE TABLE IF NOT EXISTS academic_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  semester VARCHAR(20),
  year INTEGER,
  total_credits INTEGER,
  semester_gpa DECIMAL(3,2),
  cumulative_gpa DECIMAL(3,2),
  total_courses INTEGER,
  passed_courses INTEGER,
  failed_courses INTEGER,
  report_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. جدول الإعلانات
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  target_role VARCHAR(20), -- 'student', 'supervisor', 'all'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50), -- 'registration', 'approval', 'grade', 'announcement'
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول سجلات المساعد الذكي
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. جدول التعهدات
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  language VARCHAR(5),
  agreed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Indexes للأداء
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة (مؤقتاً: السماح للجميع - يمكن تخصيصها لاحقاً)
CREATE POLICY "Enable read access for all users" ON departments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON courses FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON course_offers FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON registrations FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON schedules FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON academic_reports FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON announcements FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON ai_logs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON agreements FOR SELECT USING (true);

-- سياسات الكتابة (مؤقتاً: السماح للجميع - يمكن تخصيصها لاحقاً)
CREATE POLICY "Enable insert for all users" ON departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON course_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON academic_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON ai_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON agreements FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON departments FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON courses FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON course_offers FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON registrations FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON schedules FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON academic_reports FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON announcements FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON ai_logs FOR UPDATE USING (true);
CREATE POLICY "Enable update for all users" ON agreements FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON departments FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON users FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON courses FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON course_offers FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON registrations FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON schedules FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON academic_reports FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON announcements FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON notifications FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON ai_logs FOR DELETE USING (true);
CREATE POLICY "Enable delete for all users" ON agreements FOR DELETE USING (true);

-- ========================================
-- بيانات أولية (قسم نظم المعلومات الإدارية)
-- ========================================

INSERT INTO departments (code, name_ar, name_en, college_ar, college_en)
VALUES ('MIS', 'نظم المعلومات الإدارية', 'Management Information Systems', 'كلية إدارة الأعمال', 'College of Business Administration')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- Functions مساعدة
-- ========================================

-- Function لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Triggers
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_offers_updated_at BEFORE UPDATE ON course_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_reports_updated_at BEFORE UPDATE ON academic_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ملاحظات مهمة
-- ========================================

-- 1. بعد إنشاء الجداول، يجب إضافة البيانات الأساسية:
--    - 49 مقرر من الخطة الدراسية
--    - حساب المدير
--    - حساب المشرف
--    - حساب الطالب التجريبي

-- 2. سياسات RLS حالياً مفتوحة للجميع للتطوير
--    يجب تخصيصها لاحقاً حسب الأدوار

-- 3. يمكن إضافة المزيد من الـ Indexes حسب الحاجة

-- 4. يمكن إضافة constraints إضافية حسب متطلبات العمل
