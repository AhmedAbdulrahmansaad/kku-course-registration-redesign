-- King Khalid University Course Registration System
-- Database Setup Script
-- 
-- IMPORTANT: This file is for reference only.
-- In Figma Make environment, you should use the kv_store table via utils/supabase/kv_store.tsx
-- Do not run this script directly as migrations are not supported.
--
-- This schema shows the intended structure for future development or migration to production.

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  major TEXT DEFAULT 'Information Systems',
  advisor_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Advisors Table
CREATE TABLE IF NOT EXISTS advisors (
  advisor_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
  admin_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  course_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  credits INTEGER NOT NULL,
  prerequisites TEXT,
  description TEXT,
  description_ar TEXT
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
  reg_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT REFERENCES students(student_id),
  course_id TEXT REFERENCES courses(course_id),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- News Table
CREATE TABLE IF NOT EXISTS news (
  news_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'replied')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Project Phases Table
CREATE TABLE IF NOT EXISTS project_phases (
  phase_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Insert sample data for project phases
INSERT INTO project_phases (phase_id, title, title_ar, description, description_ar, "order") VALUES
('1', 'Analysis', 'التحليل', 'System requirements analysis and documentation', 'تحليل متطلبات النظام وتوثيقها', 1),
('2', 'Design', 'التصميم', 'UI/UX design and database schema design', 'تصميم الواجهات وتصميم قاعدة البيانات', 2),
('3', 'Implementation', 'التنفيذ', 'Development of frontend and backend components', 'تطوير مكونات الواجهة الأمامية والخلفية', 3),
('4', 'Testing', 'الاختبار', 'System testing, bug fixing, and quality assurance', 'اختبار النظام وإصلاح الأخطاء وضمان الجودة', 4),
('5', 'Deployment', 'النشر', 'System deployment and documentation', 'نشر النظام وتوثيقه', 5)
ON CONFLICT (phase_id) DO NOTHING;

-- Insert sample news
INSERT INTO news (title, title_ar, content, content_ar) VALUES
('Registration Period Opens', 'افتتاح فترة التسجيل', 'The registration period for the Spring 2025 semester is now open. Students can register for courses starting today.', 'فترة التسجيل للفصل الدراسي ربيع 2025 مفتوحة الآن. يمكن للطلاب التسجيل في المقررات ابتداءً من اليوم.'),
('New System Features', 'ميزات جديدة في النظام', 'We have added new features to improve your experience including AI assistant and dark mode support.', 'أضفنا ميزات جديدة لتحسين تجربتك بما في ذلك المساعد الذكي ودعم الوضع الليلي.'),
('Academic Advising Available', 'الإرشاد الأكاديمي متاح', 'Academic advisors are available for consultation. Please contact your advisor to discuss your course selection.', 'المشرفون الأكاديميون متاحون للاستشارة. يرجى الاتصال بمشرفك لمناقشة اختيارك للمقررات.');

-- Insert sample courses
INSERT INTO courses (course_id, title, title_ar, credits, description, description_ar) VALUES
('MIS101', 'Introduction to MIS', 'مقدمة في نظم المعلومات الإدارية', 3, 'Introduction to Management Information Systems concepts and applications', 'مقدمة في مفاهيم وتطبيقات نظم المعلومات الإدارية'),
('MIS201', 'Database Systems', 'نظم قواعد البيانات', 3, 'Design and implementation of database systems', 'تصميم وتنفيذ أنظمة قواعد البيانات'),
('MIS301', 'Systems Analysis', 'تحليل النظم', 3, 'Methods and techniques for analyzing information systems', 'طرق وتقنيات تحليل نظم المعلومات'),
('MIS401', 'Project Management', 'إدارة المشاريع', 3, 'Project management principles and practices', 'مبادئ وممارسات إدارة المشاريع');

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

-- Public read access for courses, news, and project phases
CREATE POLICY "Public read access for courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public read access for news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read access for project phases" ON project_phases FOR SELECT USING (true);

-- Anyone can insert contacts
CREATE POLICY "Anyone can insert contacts" ON contacts FOR INSERT WITH CHECK (true);

-- NOTE: This is a reference schema. In Figma Make, use the kv_store table instead.
-- Access it via: import * as kv from './utils/supabase/kv_store.tsx'
