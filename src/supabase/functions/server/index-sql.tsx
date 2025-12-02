import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ========================================
// HEALTH CHECK
// ========================================

app.get('/make-server-1573e40a/health', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'KKU Course Registration System - SQL Database',
    database: 'PostgreSQL via Supabase'
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

    // محاولة تسجيل الدخول باستخدام Supabase Auth
    let email = identifier;
    
    // إذا كان الـ identifier رقم جامعي/وظيفي، نحصل على الإيميل من قاعدة البيانات
    if (!identifier.includes('@')) {
      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('student_id', identifier)
        .single();
      
      if (error || !user) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }
      
      email = user.email;
    }

    // تسجيل الدخول
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error);
      return c.json({ error: 'Invalid credentials' }, 401);
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
      return c.json({ error: 'User data not found' }, 404);
    }

    console.log('✅ Login successful:', userData.student_id);

    return c.json({
      success: true,
      user: userData,
      session: data.session,
      access_token: data.session.access_token,
    });

  } catch (error: any) {
    console.error('❌ Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// تسجيل خروج
app.post('/make-server-1573e40a/auth/logout', async (c) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Logout error:', error);
      return c.json({ error: 'Logout failed' }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// إنشاء حساب جديد (تسجيل)
app.post('/make-server-1573e40a/auth/signup', async (c) => {
  try {
    const { studentId, email, password, name, phone, role, level, major, gpa } = await c.req.json();

    console.log('📝 Signup attempt:', { studentId, role, level, major, gpa });

    // التحقق من عدم وجود المستخدم مسبقاً
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', studentId)
      .single();

    if (existing) {
      return c.json({ error: 'Student ID already exists' }, 400);
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

    // إنشاء سجل في جدول users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        student_id: studentId,
        email,
        name,
        phone,
        role: role || 'student',
        active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ User creation error:', userError);
      return c.json({ error: 'Failed to create user' }, 500);
    }

    // ✅ إذا كان طالب، إنشاء سجل في جدول students
    if (role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: userData.id,
          level: level || 1,
          gpa: gpa || 0.0,
          total_credits: 0,
          completed_credits: 0,
          major: major || 'Management Information Systems',
          status: 'active',
          enrollment_year: new Date().getFullYear(),
        });

      if (studentError) {
        console.error('❌ Student creation error:', studentError);
        return c.json({ error: 'Failed to create student record' }, 500);
      }
      
      console.log('✅ Student record created with:', { level, major, gpa });
    }
    
    // ✅ إذا كان مشرف، إنشاء سجل في جدول supervisors
    if (role === 'supervisor') {
      const { error: supervisorError } = await supabase
        .from('supervisors')
        .insert({
          user_id: userData.id,
          specialization: '',
          office_location: '',
          max_students: 50,
          current_students: 0,
        });

      if (supervisorError) {
        console.error('❌ Supervisor creation error:', supervisorError);
        return c.json({ error: 'Failed to create supervisor record' }, 500);
      }
      
      console.log('✅ Supervisor record created');
    }
    
    // ✅ إذا كان مدير، إنشاء سجل في جدول admins
    if (role === 'admin') {
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: userData.id,
          permissions: ['all'],
        });

      if (adminError) {
        console.error('❌ Admin creation error:', adminError);
        return c.json({ error: 'Failed to create admin record' }, 500);
      }
      
      console.log('✅ Admin record created');
    }

    console.log('✅ Signup successful:', studentId);

    return c.json({
      success: true,
      message: 'Account created successfully',
      user: userData,
    });

  } catch (error: any) {
    console.error('❌ Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// الحصول على الجلسة الحالية
app.get('/make-server-1573e40a/auth/session', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    // الحصول على معلومات المستخدم
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
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      user: userData,
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

    // الحصول على department_id
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', courseData.department || 'MIS')
      .single();

    const { data, error } = await supabase
      .from('courses')
      .insert({
        course_id: courseData.course_id,
        code: courseData.code,
        name_ar: courseData.name_ar,
        name_en: courseData.name_en,
        description_ar: courseData.description_ar,
        description_en: courseData.description_en,
        credits: courseData.credits,
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

    // soft delete
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

// TO BE CONTINUED...
// Will add more endpoints in next steps

Deno.serve(app.fetch);