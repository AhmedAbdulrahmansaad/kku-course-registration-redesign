import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Create Supabase client with SERVICE_ROLE_KEY for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ========================================
// HELPER FUNCTIONS
// ========================================

async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) return null;
  
  // Get user details from database
  const { data: userData } = await supabase
    .from('users')
    .select(`
      *,
      students(*),
      supervisors(*),
      admins(*)
    `)
    .eq('auth_id', data.user.id)
    .single();
  
  return userData;
}

// ========================================
// HEALTH CHECK
// ========================================

app.get('/make-server-1573e40a/health', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'KKU Course Registration System - SQL Database',
    database: 'PostgreSQL via Supabase',
    version: '2.0.0'
  });
});

// ========================================
// AUTHENTICATION ENDPOINTS
// ========================================

// تسجيل دخول
app.post('/make-server-1573e40a/auth/login', async (c) => {
  try {
    const { identifier, password } = await c.req.json();
    
    console.log('🔐 Login attempt:', identifier);

    let email = identifier;
    
    // إذا كان الـ identifier رقم جامعي/وظيفي
    if (!identifier.includes('@')) {
      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('student_id', identifier)
        .eq('active', true)
        .single();
      
      if (error || !user) {
        console.log('❌ User not found:', identifier);
        return c.json({ error: 'بيانات الدخول غير صحيحة' }, 401);
      }
      
      email = user.email;
    }

    // تسجيل الدخول
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error.message);
      return c.json({ error: 'بيانات الدخول غير صحيحة' }, 401);
    }

    // الحصول على معلومات المستخدم من قاعدة البيانات
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        students(*),
        supervisors(*),
        admins(*)
      `)
      .eq('auth_id', data.user.id)
      .single();

    if (userError || !userData) {
      console.error('❌ User data error:', userError);
      return c.json({ error: 'خطأ في جلب بيانات المستخدم' }, 404);
    }

    console.log('✅ Login successful:', userData.student_id, '-', userData.role);

    return c.json({
      success: true,
      user: userData,
      session: data.session,
      access_token: data.session.access_token,
    });

  } catch (error: any) {
    console.error('❌ Login error:', error);
    return c.json({ error: 'فشل تسجيل الدخول' }, 500);
  }
});

// تسجيل خروج
app.post('/make-server-1573e40a/auth/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      await supabase.auth.admin.signOut(token);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Logout error:', error);
    return c.json({ error: 'فشل تسجيل الخروج' }, 500);
  }
});

// إنشاء حساب جديد (تسجيل)
app.post('/make-server-1573e40a/auth/signup', async (c) => {
  try {
    const { studentId, email, password, name, phone } = await c.req.json();

    console.log('📝 Signup attempt:', studentId);

    // التحقق من عدم وجود المستخدم
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`student_id.eq.${studentId},email.eq.${email}`)
      .single();

    if (existing) {
      return c.json({ error: 'الرقم الجامعي أو البريد الإلكتروني مستخدم مسبقاً' }, 400);
    }

    // إنشاء حساب في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        student_id: studentId,
        name,
      },
    });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // الحصول على department_id
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', 'MIS')
      .single();

    // إنشاء سجل في جدول users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        student_id: studentId,
        email,
        name,
        phone,
        role: 'student',
        department_id: dept?.id,
        active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ User creation error:', userError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: 'فشل إنشاء المستخدم' }, 500);
    }

    // إنشاء سجل في جدول students
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: userData.id,
        level: 1,
        gpa: 0.0,
        total_credits: 0,
        completed_credits: 0,
        major: 'MIS',
        status: 'active',
        enrollment_year: new Date().getFullYear(),
        expected_graduation_year: new Date().getFullYear() + 4,
      });

    if (studentError) {
      console.error('❌ Student creation error:', studentError);
      return c.json({ error: 'فشل إنشاء سجل الطالب' }, 500);
    }

    console.log('✅ Signup successful:', studentId);

    return c.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: userData,
    });

  } catch (error: any) {
    console.error('❌ Signup error:', error);
    return c.json({ error: 'فشل إنشاء الحساب' }, 500);
  }
});

// الحصول على الجلسة الحالية
app.get('/make-server-1573e40a/auth/session', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({
      success: true,
      user,
    });

  } catch (error: any) {
    console.error('❌ Session error:', error);
    return c.json({ error: 'Session check failed' }, 500);
  }
});

// ========================================
// COURSES ENDPOINTS
// ========================================

// الحصول على جميع المقررات
app.get('/make-server-1573e40a/courses', async (c) => {
  try {
    const level = c.req.query('level');
    const department = c.req.query('department');

    console.log('📚 Fetching courses - Level:', level, 'Department:', department);

    let query = supabase
      .from('courses')
      .select('*')
      .eq('active', true);

    if (level) {
      query = query.eq('level', parseInt(level));
    }

    if (department) {
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', department)
        .single();
      
      if (dept) {
        query = query.eq('department_id', dept.id);
      }
    }

    const { data, error } = await query.order('level').order('code');

    if (error) {
      console.error('❌ Error fetching courses:', error);
      return c.json({ error: 'Failed to fetch courses' }, 500);
    }

    console.log(`✅ Found ${data.length} courses`);

    return c.json({
      success: true,
      courses: data,
      count: data.length,
    });

  } catch (error: any) {
    console.error('❌ Courses error:', error);
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }
});

// الحصول على المقررات المتاحة للتسجيل
app.get('/make-server-1573e40a/courses/available', async (c) => {
  try {
    const studentId = c.req.query('studentId');

    if (!studentId) {
      return c.json({ error: 'Student ID required' }, 400);
    }

    // Get student info
    const { data: userData } = await supabase
      .from('users')
      .select('id, students(*)')
      .eq('student_id', studentId)
      .single();

    if (!userData) {
      return c.json({ error: 'Student not found' }, 404);
    }

    const studentLevel = userData.students[0]?.level || 1;

    // Get available course offers
    const { data: courseOffers, error } = await supabase
      .from('course_offers')
      .select(`
        *,
        courses(*)
      `)
      .eq('active', true)
      .lte('courses.level', studentLevel);

    if (error) {
      console.error('❌ Error fetching available courses:', error);
      return c.json({ error: 'Failed to fetch available courses' }, 500);
    }

    // Get student's current registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('course_id')
      .eq('student_id', userData.id)
      .in('status', ['pending', 'approved', 'completed']);

    const registeredCourseIds = registrations?.map(r => r.course_id) || [];

    // Filter out already registered courses
    const availableCourses = courseOffers?.filter(
      offer => !registeredCourseIds.includes(offer.courses.id)
    ) || [];

    console.log(`✅ Found ${availableCourses.length} available courses for student`);

    return c.json({
      success: true,
      courses: availableCourses,
      count: availableCourses.length,
    });

  } catch (error: any) {
    console.error('❌ Available courses error:', error);
    return c.json({ error: 'Failed to fetch available courses' }, 500);
  }
});

// الحصول على مقرر محدد
app.get('/make-server-1573e40a/courses/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return c.json({ error: 'Course not found' }, 404);
    }

    return c.json({
      success: true,
      course: data,
    });

  } catch (error: any) {
    console.error('❌ Course fetch error:', error);
    return c.json({ error: 'Failed to fetch course' }, 500);
  }
});

// إضافة مقرر جديد (مدير فقط)
app.post('/make-server-1573e40a/courses', async (c) => {
  try {
    const courseData = await c.req.json();

    console.log('➕ Adding new course:', courseData.code);

    // Get department_id
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', 'MIS')
      .single();

    const { data, error } = await supabase
      .from('courses')
      .insert({
        course_id: courseData.course_id || courseData.code,
        code: courseData.code,
        name_ar: courseData.name_ar,
        name_en: courseData.name_en,
        description_ar: courseData.description_ar,
        description_en: courseData.description_en,
        credits: courseData.credits || courseData.credit_hours,
        level: courseData.level,
        department_id: dept?.id,
        category: courseData.category || 'متطلب قسم',
        prerequisites: courseData.prerequisites || [],
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding course:', error);
      return c.json({ error: error.message }, 500);
    }

    // Create course offer
    await supabase
      .from('course_offers')
      .insert({
        course_id: data.id,
        semester: courseData.semester || 'Fall',
        year: courseData.year || 2024,
        section: 'A',
        max_students: 40,
        enrolled_students: 0,
        instructor_id: null,
        active: true,
      });

    console.log('✅ Course added successfully');

    return c.json({
      success: true,
      course: data,
    });

  } catch (error: any) {
    console.error('❌ Add course error:', error);
    return c.json({ error: 'Failed to add course' }, 500);
  }
});

// تحديث مقرر (مدير فقط) - endpoint بديل
app.post('/make-server-1573e40a/admin/add-course', async (c) => {
  try {
    const courseData = await c.req.json();

    console.log('➕ [Admin] Adding new course:', courseData.code);

    // Get department_id
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', 'MIS')
      .single();

    const { data, error } = await supabase
      .from('courses')
      .insert({
        course_id: courseData.course_id || courseData.code,
        code: courseData.code,
        name_ar: courseData.name_ar,
        name_en: courseData.name_en,
        description_ar: courseData.description_ar,
        description_en: courseData.description_en,
        credits: courseData.credits || courseData.credit_hours,
        level: courseData.level,
        department_id: dept?.id,
        category: courseData.category || courseData.course_type === 'elective' ? 'متطلب اختياري' : 'متطلب قسم',
        prerequisites: Array.isArray(courseData.prerequisites) ? courseData.prerequisites : [],
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding course:', error);
      return c.json({ error: error.message }, 500);
    }

    // Create course offer
    await supabase
      .from('course_offers')
      .insert({
        course_id: data.id,
        semester: courseData.semester || 'Fall',
        year: courseData.year || 2024,
        section: 'A',
        max_students: 40,
        enrolled_students: 0,
        instructor_id: null,
        active: true,
      });

    console.log('✅ [Admin] Course added successfully');

    return c.json({
      success: true,
      course: data,
    });

  } catch (error: any) {
    console.error('❌ [Admin] Add course error:', error);
    return c.json({ error: 'Failed to add course' }, 500);
  }
});

// تحديث مقرر (مدير فقط)
app.put('/make-server-1573e40a/courses/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating course:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      success: true,
      course: data,
    });

  } catch (error: any) {
    console.error('❌ Update course error:', error);
    return c.json({ error: 'Failed to update course' }, 500);
  }
});

// حذف مقرر (مدير فقط)
app.delete('/make-server-1573e40a/courses/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Soft delete
    const { error } = await supabase
      .from('courses')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting course:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Course deleted successfully',
    });

  } catch (error: any) {
    console.error('❌ Delete course error:', error);
    return c.json({ error: 'Failed to delete course' }, 500);
  }
});

// ========================================
// REGISTRATIONS ENDPOINTS
// ========================================

// تسجيل مقرر
app.post('/make-server-1573e40a/registrations', async (c) => {
  try {
    const { studentId, courseOfferId } = await c.req.json();

    console.log('📝 Registration attempt:', studentId, courseOfferId);

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (!user) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Get course offer
    const { data: courseOffer } = await supabase
      .from('course_offers')
      .select('*, courses(*)')
      .eq('id', courseOfferId)
      .single();

    if (!courseOffer) {
      return c.json({ error: 'Course offer not found' }, 404);
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_offer_id', courseOfferId)
      .single();

    if (existing) {
      return c.json({ error: 'Already registered for this course' }, 400);
    }

    // Create registration
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        student_id: user.id,
        course_id: courseOffer.courses.id,
        course_offer_id: courseOfferId,
        status: 'pending',
        semester: courseOffer.semester,
        year: courseOffer.year,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Registration error:', error);
      return c.json({ error: error.message }, 500);
    }

    // Update enrolled count
    await supabase
      .from('course_offers')
      .update({ 
        enrolled_students: courseOffer.enrolled_students + 1 
      })
      .eq('id', courseOfferId);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'طلب تسجيل مقرر',
        message: `تم إرسال طلب تسجيل مقرر ${courseOffer.courses.name_ar}`,
        type: 'registration',
        reference_id: data.id,
        reference_type: 'registration',
        is_read: false,
      });

    console.log('✅ Registration successful');

    return c.json({
      success: true,
      registration: data,
    });

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    return c.json({ error: 'Failed to register' }, 500);
  }
});

// الحصول على تسجيلات الطالب
app.get('/make-server-1573e40a/registrations', async (c) => {
  try {
    const studentId = c.req.query('studentId');
    const status = c.req.query('status');

    let query = supabase
      .from('registrations')
      .select(`
        *,
        courses(*),
        course_offers(*)
      `);

    if (studentId) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('student_id', studentId)
        .single();

      if (user) {
        query = query.eq('student_id', user.id);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching registrations:', error);
      return c.json({ error: 'Failed to fetch registrations' }, 500);
    }

    return c.json({
      success: true,
      registrations: data,
      count: data?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ Registrations error:', error);
    return c.json({ error: 'Failed to fetch registrations' }, 500);
  }
});

// موافقة/رفض تسجيل (مشرف فقط)
app.put('/make-server-1573e40a/registrations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { status, supervisorId } = await c.req.json();

    console.log('✏️ Updating registration:', id, status);

    // Get supervisor user
    const { data: supervisor } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', supervisorId)
      .single();

    const { data, error } = await supabase
      .from('registrations')
      .update({
        status,
        supervisor_id: supervisor?.id,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select('*, courses(*)')
      .single();

    if (error) {
      console.error('❌ Error updating registration:', error);
      return c.json({ error: error.message }, 500);
    }

    // Create notification
    const message = status === 'approved' 
      ? `تمت الموافقة على تسجيل مقرر ${data.courses.name_ar}`
      : `تم رفض تسجيل مقرر ${data.courses.name_ar}`;

    await supabase
      .from('notifications')
      .insert({
        user_id: data.student_id,
        title: status === 'approved' ? 'موافقة على تسجيل' : 'رفض تسجيل',
        message,
        type: 'approval',
        reference_id: data.id,
        reference_type: 'registration',
        is_read: false,
        priority: 'high',
      });

    console.log('✅ Registration updated successfully');

    return c.json({
      success: true,
      registration: data,
    });

  } catch (error: any) {
    console.error('❌ Update registration error:', error);
    return c.json({ error: 'Failed to update registration' }, 500);
  }
});

// ========================================
// STUDENTS ENDPOINTS
// ========================================

// الحصول على جميع الطلاب
app.get('/make-server-1573e40a/students', async (c) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        students(*)
      `)
      .eq('role', 'student')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching students:', error);
      return c.json({ error: 'Failed to fetch students' }, 500);
    }

    return c.json({
      success: true,
      students: data,
      count: data.length,
    });

  } catch (error: any) {
    console.error('❌ Students error:', error);
    return c.json({ error: 'Failed to fetch students' }, 500);
  }
});

// الحصول على طالب محدد
app.get('/make-server-1573e40a/students/:id', async (c) => {
  try {
    const studentId = c.req.param('id');

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        students(*)
      `)
      .eq('student_id', studentId)
      .single();

    if (error || !data) {
      return c.json({ error: 'Student not found' }, 404);
    }

    return c.json({
      success: true,
      student: data,
    });

  } catch (error: any) {
    console.error('❌ Student fetch error:', error);
    return c.json({ error: 'Failed to fetch student' }, 500);
  }
});

// ========================================
// SUPERVISORS ENDPOINTS
// ========================================

// الحصول على جميع المشرفين
app.get('/make-server-1573e40a/supervisors', async (c) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        supervisors(*)
      `)
      .eq('role', 'supervisor')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('❌ Error fetching supervisors:', error);
      return c.json({ error: 'Failed to fetch supervisors' }, 500);
    }

    return c.json({
      success: true,
      supervisors: data,
      count: data.length,
    });

  } catch (error: any) {
    console.error('❌ Supervisors error:', error);
    return c.json({ error: 'Failed to fetch supervisors' }, 500);
  }
});

// إضافة مشرف جديد (مدير فقط)
app.post('/make-server-1573e40a/supervisors', async (c) => {
  try {
    const { employeeId, email, password, name, phone, specialization, officeLocation } = await c.req.json();

    console.log('➕ Adding new supervisor:', employeeId);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        employee_id: employeeId,
        name,
      },
    });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Get department
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', 'MIS')
      .single();

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        student_id: employeeId,
        email,
        name,
        phone,
        role: 'supervisor',
        department_id: dept?.id,
        active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ User creation error:', userError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: 'Failed to create user' }, 500);
    }

    // Create supervisor record
    const { error: supervisorError } = await supabase
      .from('supervisors')
      .insert({
        user_id: userData.id,
        department_id: dept?.id,
        specialization,
        office_location: officeLocation,
        max_students: 50,
        current_students: 0,
      });

    if (supervisorError) {
      console.error('❌ Supervisor creation error:', supervisorError);
      return c.json({ error: 'Failed to create supervisor record' }, 500);
    }

    console.log('✅ Supervisor added successfully');

    return c.json({
      success: true,
      message: 'Supervisor added successfully',
      supervisor: userData,
    });

  } catch (error: any) {
    console.error('❌ Add supervisor error:', error);
    return c.json({ error: 'Failed to add supervisor' }, 500);
  }
});

// إضافة مشرف جديد - endpoint بديل للمدير
app.post('/make-server-1573e40a/admin/add-supervisor', async (c) => {
  try {
    const { fullName, email, password, department, role } = await c.req.json();

    console.log('➕ [Admin] Adding new supervisor/admin:', email);

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return c.json({ error: 'Email already exists' }, 400);
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: fullName,
      },
    });

    if (authError) {
      console.error('❌ Auth creation error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Get department
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', 'MIS')
      .single();

    // Generate employee ID
    const timestamp = Date.now().toString().slice(-6);
    const employeeId = `EMP${timestamp}`;

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        student_id: employeeId,
        email,
        name: fullName,
        phone: '',
        role: role || 'supervisor',
        department_id: dept?.id,
        active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ User creation error:', userError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: 'Failed to create user' }, 500);
    }

    // Create supervisor record if role is supervisor
    if (role === 'supervisor' || !role) {
      const { error: supervisorError } = await supabase
        .from('supervisors')
        .insert({
          user_id: userData.id,
          department_id: dept?.id,
          specialization: department || 'نظم المعلومات الإدارية',
          office_location: 'مبنى الكلية',
          max_students: 50,
          current_students: 0,
        });

      if (supervisorError) {
        console.error('❌ Supervisor creation error:', supervisorError);
      }
    }

    console.log('✅ [Admin] Supervisor/Admin added successfully');

    return c.json({
      success: true,
      message: 'User added successfully',
      user: userData,
    });

  } catch (error: any) {
    console.error('❌ [Admin] Add supervisor error:', error);
    return c.json({ error: 'Failed to add user' }, 500);
  }
});

// تحديث مشرف
app.put('/make-server-1573e40a/supervisors/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();

    const { data, error } = await supabase
      .from('supervisors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating supervisor:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      success: true,
      supervisor: data,
    });

  } catch (error: any) {
    console.error('❌ Update supervisor error:', error);
    return c.json({ error: 'Failed to update supervisor' }, 500);
  }
});

// حذف مشرف (مدير فقط)
app.delete('/make-server-1573e40a/supervisors/:id', async (c) => {
  try {
    const employeeId = c.req.param('id');

    // Soft delete
    const { error } = await supabase
      .from('users')
      .update({ active: false })
      .eq('student_id', employeeId)
      .eq('role', 'supervisor');

    if (error) {
      console.error('❌ Error deleting supervisor:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Supervisor deleted successfully',
    });

  } catch (error: any) {
    console.error('❌ Delete supervisor error:', error);
    return c.json({ error: 'Failed to delete supervisor' }, 500);
  }
});

// ========================================
// DASHBOARD STATS
// ========================================

// إحصائيات الطالب
app.get('/make-server-1573e40a/dashboard/student/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, students(*)')
      .eq('student_id', studentId)
      .single();

    if (!user) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Get registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*, courses(*)')
      .eq('student_id', user.id);

    const approved = registrations?.filter(r => r.status === 'approved') || [];
    const pending = registrations?.filter(r => r.status === 'pending') || [];
    const completed = registrations?.filter(r => r.status === 'completed') || [];

    const totalCredits = approved.reduce((sum, r) => sum + (r.courses.credits || 0), 0);
    const completedCredits = completed.reduce((sum, r) => sum + (r.courses.credits || 0), 0);

    return c.json({
      success: true,
      stats: {
        level: user.students[0]?.level || 1,
        gpa: user.students[0]?.gpa || 0,
        totalCredits,
        completedCredits,
        registeredCourses: approved.length,
        pendingRequests: pending.length,
        completedCourses: completed.length,
      },
    });

  } catch (error: any) {
    console.error('❌ Dashboard stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// إحصائيات المشرف
app.get('/make-server-1573e40a/dashboard/supervisor/:supervisorId', async (c) => {
  try {
    const supervisorId = c.req.param('supervisorId');

    // Get user
    const { data: supervisor } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', supervisorId)
      .single();

    if (!supervisor) {
      return c.json({ error: 'Supervisor not found' }, 404);
    }

    // Get pending registrations
    const { data: pending } = await supabase
      .from('registrations')
      .select('*')
      .eq('status', 'pending');

    // Get approved registrations by this supervisor
    const { data: approved } = await supabase
      .from('registrations')
      .select('*')
      .eq('supervisor_id', supervisor.id)
      .eq('status', 'approved');

    // Get total students
    const { data: students } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .eq('active', true);

    return c.json({
      success: true,
      stats: {
        pendingRequests: pending?.length || 0,
        approvedRequests: approved?.length || 0,
        totalStudents: students?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('❌ Supervisor dashboard error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// إحصائيات المدير
app.get('/make-server-1573e40a/dashboard/admin', async (c) => {
  try {
    // Get counts
    const [students, supervisors, courses, registrations] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student').eq('active', true),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'supervisor').eq('active', true),
      supabase.from('courses').select('id', { count: 'exact' }).eq('active', true),
      supabase.from('registrations').select('id', { count: 'exact' }),
    ]);

    const { data: pending } = await supabase
      .from('registrations')
      .select('id')
      .eq('status', 'pending');

    return c.json({
      success: true,
      stats: {
        totalStudents: students.count || 0,
        totalSupervisors: supervisors.count || 0,
        totalCourses: courses.count || 0,
        totalRegistrations: registrations.count || 0,
        pendingRegistrations: pending?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('❌ Admin dashboard error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// ========================================
// NOTIFICATIONS
// ========================================

// الحصول على إشعارات المستخدم
app.get('/make-server-1573e40a/notifications/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', userId)
      .single();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Error fetching notifications:', error);
      return c.json({ error: 'Failed to fetch notifications' }, 500);
    }

    return c.json({
      success: true,
      notifications: data,
      count: data.length,
      unread: data.filter(n => !n.is_read).length,
    });

  } catch (error: any) {
    console.error('❌ Notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// تعليم الإشعار كمقروء
app.put('/make-server-1573e40a/notifications/:id/read', async (c) => {
  try {
    const id = c.req.param('id');

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Error marking notification as read:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Notification marked as read',
    });

  } catch (error: any) {
    console.error('❌ Mark as read error:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// ========================================
// REPORTS
// ========================================

// إنشاء تقرير أكاديمي
app.post('/make-server-1573e40a/reports/generate', async (c) => {
  try {
    const { studentId, semester, year } = await c.req.json();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, students(*)')
      .eq('student_id', studentId)
      .single();

    if (!user) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Get registrations for semester
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*, courses(*)')
      .eq('student_id', user.id)
      .eq('semester', semester)
      .eq('year', year)
      .eq('status', 'completed');

    const totalCourses = registrations?.length || 0;
    const passedCourses = registrations?.filter(r => r.grade_point && r.grade_point >= 2.0).length || 0;
    const failedCourses = totalCourses - passedCourses;

    const totalCredits = registrations?.reduce((sum, r) => sum + (r.courses.credits || 0), 0) || 0;

    // Calculate GPA
    const totalPoints = registrations?.reduce((sum, r) => 
      sum + ((r.grade_point || 0) * (r.courses.credits || 0)), 0) || 0;
    const semesterGpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        student_id: user.id,
        semester,
        year,
        total_credits: totalCredits,
        semester_gpa: semesterGpa,
        cumulative_gpa: user.students[0]?.gpa || 0,
        total_courses: totalCourses,
        passed_courses: passedCourses,
        failed_courses: failedCourses,
        report_data: {
          registrations: registrations,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error generating report:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      success: true,
      report,
    });

  } catch (error: any) {
    console.error('❌ Generate report error:', error);
    return c.json({ error: 'Failed to generate report' }, 500);
  }
});

// الحصول على تقارير الطالب
app.get('/make-server-1573e40a/reports/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (!user) {
      return c.json({ error: 'Student not found' }, 404);
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('student_id', user.id)
      .order('year', { ascending: false })
      .order('semester', { ascending: false });

    if (error) {
      console.error('❌ Error fetching reports:', error);
      return c.json({ error: 'Failed to fetch reports' }, 500);
    }

    return c.json({
      success: true,
      reports: data,
      count: data.length,
    });

  } catch (error: any) {
    console.error('❌ Reports error:', error);
    return c.json({ error: 'Failed to fetch reports' }, 500);
  }
});

// ========================================
// AI ASSISTANT
// ========================================

app.post('/make-server-1573e40a/ai/chat', async (c) => {
  try {
    const { question, studentId } = await c.req.json();

    console.log('🤖 AI Question:', question);

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', studentId)
      .single();

    // Simple AI responses (يمكن تطويره لاحقاً باستخدام OpenAI)
    let answer = '';
    
    const q = question.toLowerCase();
    
    if (q.includes('تسجيل') || q.includes('register')) {
      answer = 'يمكنك تسجيل المقررات من صفحة "المقررات المتاحة". اختر المقررات المناسبة لمستواك الدراسي واضغط زر التسجيل. سيتم إرسال طلبك للمشرف الأكاديمي للموافقة.';
    } else if (q.includes('معدل') || q.includes('gpa')) {
      answer = 'يتم حساب المعدل التراكمي (GPA) بناءً على درجاتك في جميع المقررات المكتملة. يمكنك مشاهدة معدلك الحالي في لوحة التحكم الرئيسية.';
    } else if (q.includes('مقرر') || q.includes('course')) {
      answer = 'يمكنك الاطلاع على جميع المقررات المتاحة من صفحة "المقررات المتاحة". كل مقرر يحتوي على معلومات عن عدد الساعات، المتطلبات السابقة، والمستوى الدراسي.';
    } else if (q.includes('مشرف') || q.includes('supervisor')) {
      answer = 'المشرف الأكاديمي مسؤول عن الموافقة على طلبات التسجيل الخاصة بك. سيتم إشعارك فور موافقة أو رفض المشرف لطلباتك.';
    } else {
      answer = 'شكراً لسؤالك. يمكنني مساعدتك في: التسجيل في المقررات، معلومات عن المعدل التراكمي، تفاصيل المقررات، والمشرفين الأكاديميين. كيف يمكنني مساعدتك؟';
    }

    // Save to AI logs
    if (user) {
      await supabase
        .from('ai_logs')
        .insert({
          user_id: user.id,
          question,
          answer,
          context: {},
        });
    }

    return c.json({
      success: true,
      answer,
    });

  } catch (error: any) {
    console.error('❌ AI chat error:', error);
    return c.json({ error: 'Failed to process question' }, 500);
  }
});

// ========================================
// AGREEMENTS
// ========================================

app.post('/make-server-1573e40a/agreements', async (c) => {
  try {
    const { fullName, ipAddress, userAgent, language } = await c.req.json();

    const { data, error } = await supabase
      .from('agreements')
      .insert({
        full_name: fullName,
        ip_address: ipAddress,
        user_agent: userAgent,
        language,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving agreement:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      success: true,
      agreement: data,
    });

  } catch (error: any) {
    console.error('❌ Agreement error:', error);
    return c.json({ error: 'Failed to save agreement' }, 500);
  }
});

// ========================================
// START SERVER
// ========================================

Deno.serve(app.fetch);