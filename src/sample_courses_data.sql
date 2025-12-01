-- ========================================
-- بيانات تجريبية: مقررات نظم المعلومات الإدارية
-- جامعة الملك خالد - كلية إدارة الأعمال
-- ========================================

-- ✅ الحصول على department_id لقسم MIS
DO $$
DECLARE
  mis_dept_id INTEGER;
BEGIN
  SELECT id INTO mis_dept_id FROM departments WHERE code = 'MIS';
  
  -- ========================================
  -- المستوى الأول
  -- ========================================
  INSERT INTO courses (code, name_ar, name_en, credits, level, department_id, prerequisite_codes, description_ar, description_en, active) VALUES
  ('MIS101', 'مقدمة في نظم المعلومات', 'Introduction to Information Systems', 3, 1, mis_dept_id, ARRAY[]::TEXT[], 'مقدمة في نظم المعلومات وأنواعها وتطبيقاتها', 'Introduction to information systems, types and applications', true),
  ('CS101', 'مقدمة في علوم الحاسب', 'Introduction to Computer Science', 3, 1, mis_dept_id, ARRAY[]::TEXT[], 'أساسيات علوم الحاسب والبرمجة', 'Computer science fundamentals and programming', true),
  ('MATH101', 'الرياضيات للأعمال', 'Business Mathematics', 3, 1, mis_dept_id, ARRAY[]::TEXT[], 'المفاهيم الرياضية الأساسية للأعمال', 'Basic mathematical concepts for business', true),
  ('ENG101', 'اللغة الإنجليزية 1', 'English Language 1', 3, 1, mis_dept_id, ARRAY[]::TEXT[], 'مهارات اللغة الإنجليزية الأساسية', 'Basic English language skills', true),
  ('ARAB101', 'اللغة العربية', 'Arabic Language', 2, 1, mis_dept_id, ARRAY[]::TEXT[], 'مهارات اللغة العربية', 'Arabic language skills', true),
  ('ISLAM101', 'الثقافة الإسلامية 1', 'Islamic Culture 1', 2, 1, mis_dept_id, ARRAY[]::TEXT[], 'مبادئ الثقافة الإسلامية', 'Principles of Islamic culture', true)
  ON CONFLICT (code) DO NOTHING;

  -- ========================================
  -- المستوى الثاني
  -- ========================================
  INSERT INTO courses (code, name_ar, name_en, credits, level, department_id, prerequisite_codes, description_ar, description_en, active) VALUES
  ('MIS201', 'قواعد البيانات', 'Database Systems', 3, 2, mis_dept_id, ARRAY['MIS101'], 'تصميم وإدارة قواعد البيانات', 'Database design and management', true),
  ('CS201', 'البرمجة الهيكلية', 'Structured Programming', 3, 2, mis_dept_id, ARRAY['CS101'], 'مفاهيم البرمجة الهيكلية', 'Structured programming concepts', true),
  ('STAT201', 'الإحصاء للأعمال', 'Business Statistics', 3, 2, mis_dept_id, ARRAY['MATH101'], 'التحليل الإحصائي للأعمال', 'Statistical analysis for business', true),
  ('MGT201', 'مبادئ الإدارة', 'Principles of Management', 3, 2, mis_dept_id, ARRAY[]::TEXT[], 'المفاهيم الإدارية الأساسية', 'Basic management concepts', true),
  ('ACC201', 'مبادئ المحاسبة', 'Principles of Accounting', 3, 2, mis_dept_id, ARRAY[]::TEXT[], 'أساسيات المحاسبة المالية', 'Financial accounting fundamentals', true),
  ('ENG102', 'اللغة الإنجليزية 2', 'English Language 2', 3, 2, mis_dept_id, ARRAY['ENG101'], 'مهارات اللغة الإنجليزية المتقدمة', 'Advanced English language skills', true)
  ON CONFLICT (code) DO NOTHING;

  -- ========================================
  -- المستوى الثالث
  -- ========================================
  INSERT INTO courses (code, name_ar, name_en, credits, level, department_id, prerequisite_codes, description_ar, description_en, active) VALUES
  ('MIS301', 'تحليل وتصميم النظم', 'Systems Analysis and Design', 3, 3, mis_dept_id, ARRAY['MIS201'], 'منهجيات تحليل وتصميم النظم', 'Systems analysis and design methodologies', true),
  ('MIS302', 'الشبكات والاتصالات', 'Networks and Communications', 3, 3, mis_dept_id, ARRAY['MIS101'], 'أساسيات الشبكات والاتصالات', 'Networks and communications fundamentals', true),
  ('CS301', 'البرمجة الشيئية', 'Object-Oriented Programming', 3, 3, mis_dept_id, ARRAY['CS201'], 'مفاهيم البرمجة الشيئية', 'Object-oriented programming concepts', true),
  ('MKT301', 'مبادئ التسويق', 'Principles of Marketing', 3, 3, mis_dept_id, ARRAY[]::TEXT[], 'أساسيات التسويق', 'Marketing fundamentals', true),
  ('FIN301', 'الإدارة المالية', 'Financial Management', 3, 3, mis_dept_id, ARRAY['ACC201'], 'مبادئ الإدارة المالية', 'Financial management principles', true),
  ('ISLAM102', 'الثقافة الإسلامية 2', 'Islamic Culture 2', 2, 3, mis_dept_id, ARRAY['ISLAM101'], 'الثقافة الإسلامية المتقدمة', 'Advanced Islamic culture', true)
  ON CONFLICT (code) DO NOTHING;

  -- ========================================
  -- المستوى الرابع
  -- ========================================
  INSERT INTO courses (code, name_ar, name_en, credits, level, department_id, prerequisite_codes, description_ar, description_en, active) VALUES
  ('MIS401', 'إدارة قواعد البيانات', 'Database Management', 3, 4, mis_dept_id, ARRAY['MIS201'], 'إدارة وصيانة قواعد البيانات', 'Database administration and maintenance', true),
  ('MIS402', 'نظم دعم القرار', 'Decision Support Systems', 3, 4, mis_dept_id, ARRAY['MIS301'], 'نظم دعم اتخاذ القرار', 'Decision support systems', true),
  ('MIS403', 'برمجة الويب', 'Web Programming', 3, 4, mis_dept_id, ARRAY['CS301'], 'تطوير تطبيقات الويب', 'Web application development', true),
  ('MIS404', 'أمن المعلومات', 'Information Security', 3, 4, mis_dept_id, ARRAY['MIS302'], 'أساسيات أمن المعلومات', 'Information security fundamentals', true),
  ('MGT401', 'السلوك التنظيمي', 'Organizational Behavior', 3, 4, mis_dept_id, ARRAY['MGT201'], 'دراسة السلوك في المنظمات', 'Study of behavior in organizations', true),
  ('ECON401', 'الاقتصاد الإداري', 'Managerial Economics', 3, 4, mis_dept_id, ARRAY[]::TEXT[], 'تطبيق المفاهيم الاقتصادية في الإدارة', 'Application of economic concepts in management', true)
  ON CONFLICT (code) DO NOTHING;

  -- ========================================
  -- المستوى الخامس
  -- ========================================
  INSERT INTO courses (code, name_ar, name_en, credits, level, department_id, prerequisite_codes, description_ar, description_en, active) VALUES
  ('MIS501', 'نظم المعلومات الإدارية', 'Management Information Systems', 3, 5, mis_dept_id, ARRAY['MIS301'], 'نظم المعلومات على مستوى الإدارة', 'Management-level information systems', true),
  ('MIS502', 'تطوير تطبيقات الأعمال', 'Business Application Development', 3, 5, mis_dept_id, ARRAY['MIS403'], 'تطوير تطبيقات الأعمال الإلكترونية', 'Electronic business applications development', true),
  ('MIS503', 'إدارة المشاريع التقنية', 'IT Project Management', 3, 5, mis_dept_id, ARRAY['MIS301'], 'إدارة مشاريع تقنية المعلومات', 'Information technology project management', true),
  ('MIS504', 'التجارة الإلكترونية', 'E-Commerce', 3, 5, mis_dept_id, ARRAY['MIS403'], 'مفاهيم وتطبيقات التجارة الإلكترونية', 'E-commerce concepts and applications', true),
  ('MIS505', 'ذكاء الأعمال', 'Business Intelligence', 3, 5, mis_dept_id, ARRAY['MIS402'], 'أنظمة ذكاء الأعمال والتحليلات', 'Business intelligence and analytics systems', true),
  ('LAW501', 'القانون التجاري', 'Commercial Law', 2, 5, mis_dept_id, ARRAY[]::TEXT[], 'أساسيات القانون التجاري', 'Commercial law fundamentals', true)
  ON CONFLICT (code) DO NOTHING;

  -- ========================================
  -- المستوى السادس
  -- ========================================
  INSERT INTO courses (code, name_ar, name_en, credits, level, department_id, prerequisite_codes, description_ar, description_en, active) VALUES
  ('MIS601', 'نظم المعلومات الاستراتيجية', 'Strategic Information Systems', 3, 6, mis_dept_id, ARRAY['MIS501'], 'استخدام نظم المعلومات في الاستراتيجية', 'Use of information systems in strategy', true),
  ('MIS602', 'إدارة الموارد المعلوماتية', 'Information Resources Management', 3, 6, mis_dept_id, ARRAY['MIS501'], 'إدارة موارد تقنية المعلومات', 'IT resources management', true),
  ('MIS603', 'تطبيقات الذكاء الاصطناعي', 'AI Applications', 3, 6, mis_dept_id, ARRAY['MIS505'], 'تطبيقات الذكاء الاصطناعي في الأعمال', 'AI applications in business', true),
  ('MIS604', 'أنظمة تخطيط موارد المؤسسات', 'ERP Systems', 3, 6, mis_dept_id, ARRAY['MIS501'], 'نظم تخطيط موارد المؤسسات', 'Enterprise Resource Planning systems', true),
  ('MIS605', 'تدقيق نظم المعلومات', 'Information Systems Audit', 3, 6, mis_dept_id, ARRAY['MIS404'], 'تدقيق ومراجعة نظم المعلومات', 'Information systems auditing', true),
  ('MGT601', 'إدارة الموارد البشرية', 'Human Resources Management', 3, 6, mis_dept_id, ARRAY['MGT401'], 'إدارة الموارد البشرية', 'Human resources management', true)
  ON CONFLICT (code) DO NOTHING;

  -- ========================================
  -- المستوى السابع
  -- ========================================
  INSERT INTO courses (code, name_ar, name_en, credits, level, department_id, prerequisite_codes, description_ar, description_en, active) VALUES
  ('MIS701', 'بحوث العمليات', 'Operations Research', 3, 7, mis_dept_id, ARRAY['STAT201'], 'تطبيقات بحوث العمليات', 'Operations research applications', true),
  ('MIS702', 'إدارة المعرفة', 'Knowledge Management', 3, 7, mis_dept_id, ARRAY['MIS601'], 'نظم إدارة المعرفة', 'Knowledge management systems', true),
  ('MIS703', 'تعدين البيانات', 'Data Mining', 3, 7, mis_dept_id, ARRAY['MIS505'], 'تقنيات تعدين البيانات', 'Data mining techniques', true),
  ('MIS704', 'البيانات الضخمة', 'Big Data', 3, 7, mis_dept_id, ARRAY['MIS505'], 'تحليل البيانات الضخمة', 'Big data analytics', true),
  ('MIS705', 'أخلاقيات تقنية المعلومات', 'IT Ethics', 2, 7, mis_dept_id, ARRAY[]::TEXT[], 'الأخلاقيات في تقنية المعلومات', 'Ethics in information technology', true),
  ('MGT701', 'الإدارة الاستراتيجية', 'Strategic Management', 3, 7, mis_dept_id, ARRAY['MGT401'], 'التخطيط والإدارة الاستراتيجية', 'Strategic planning and management', true)
  ON CONFLICT (code) DO NOTHING;

  -- ========================================
  -- المستوى الثامن
  -- ========================================
  INSERT INTO courses (code, name_ar, name_en, credits, level, department_id, prerequisite_codes, description_ar, description_en, active) VALUES
  ('MIS801', 'مشروع التخرج 1', 'Graduation Project 1', 2, 8, mis_dept_id, ARRAY['MIS601'], 'بداية مشروع التخرج', 'Start of graduation project', true),
  ('MIS802', 'مشروع التخرج 2', 'Graduation Project 2', 3, 8, mis_dept_id, ARRAY['MIS801'], 'إكمال مشروع التخرج', 'Completion of graduation project', true),
  ('MIS803', 'حوكمة تقنية المعلومات', 'IT Governance', 3, 8, mis_dept_id, ARRAY['MIS601'], 'حوكمة تقنية المعلومات', 'Information technology governance', true),
  ('MIS804', 'الحوسبة السحابية', 'Cloud Computing', 3, 8, mis_dept_id, ARRAY['MIS302'], 'مفاهيم وتطبيقات الحوسبة السحابية', 'Cloud computing concepts and applications', true),
  ('MIS805', 'ريادة الأعمال الرقمية', 'Digital Entrepreneurship', 3, 8, mis_dept_id, ARRAY['MIS504'], 'ريادة الأعمال في العصر الرقمي', 'Entrepreneurship in the digital age', true)
  ON CONFLICT (code) DO NOTHING;

  RAISE NOTICE '✅ تم إدخال 49 مقرراً دراسياً بنجاح!';
  
END $$;
