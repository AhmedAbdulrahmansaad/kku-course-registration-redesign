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
    console.log('🔐 Attempting Supabase auth with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error.message);
      console.error('❌ Login error details:', JSON.stringify(error));
      return c.json({ 
        error: 'بيانات الدخول غير صحيحة',
        details: error.message 
      }, 401);
    }
    
    console.log('✅ Supabase auth successful, user ID:', data.user.id);

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
    console.log('📊 Student data:', {
      level: userData.students?.[0]?.level,
      gpa: userData.students?.[0]?.gpa,
      major: userData.students?.[0]?.major,
      user_id: userData.id
    });

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
    const { studentId, email, password, name, phone, role, level, major, gpa } = await c.req.json();

    console.log('📝 Signup attempt:', { studentId, email, role, level, major });

    // ✅ معالجة خاصة للمشرفين والمدراء (لا يحتاجون studentId)
    let finalStudentId = studentId;
    
    if ((role === 'supervisor' || role === 'admin') && !studentId) {
      // توليد رقم وظيفي مؤقت
      const timestamp = Date.now().toString().slice(-6);
      finalStudentId = role === 'supervisor' ? `SUP${timestamp}` : `ADM${timestamp}`;
      console.log(`✅ Generated employee ID for ${role}:`, finalStudentId);
    }

    // التحقق من عدم وجود المستخدم
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`student_id.eq.${finalStudentId},email.eq.${email}`)
      .single();

    if (existing) {
      console.log('❌ User already exists:', finalStudentId, email);
      return c.json({ error: 'الرقم الجامعي أو البريد الإلكتروني مستخدم مسبقاً' }, 400);
    }

    // إنشاء حساب في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        student_id: finalStudentId,
        name,
        role,
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
        student_id: finalStudentId,
        email,
        name,
        phone,
        role: role || 'student', // ✅ استخدام الدور من الطلب
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

    // ✅ إنشاء سجل في جدول students فقط إذا كان الدور طالب
    if (role === 'student' || !role) {
      console.log(`📚 [Signup] Creating student record with level: ${level ? parseInt(level) : 1}, gpa: ${gpa ? parseFloat(gpa) : 0.0}, major: ${major || 'MIS'}`);
      
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: userData.id,
          level: level ? parseInt(level) : 1, // ✅ استخدام المستوى من الطلب
          gpa: gpa ? parseFloat(gpa) : 0.0, // ✅ استخدام المعدل من الطلب
          total_credits: 0,
          completed_credits: 0,
          major: major || 'MIS', // ✅ استخدام التخصص من الطلب
          status: 'active',
          enrollment_year: new Date().getFullYear(),
          expected_graduation_year: new Date().getFullYear() + 4,
        });

      if (studentError) {
        console.error('❌ Student creation error:', studentError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('users').delete().eq('id', userData.id);
        return c.json({ error: 'فشل إنشاء سجل الطالب' }, 500);
      }
    }

    // ✅ إنشاء سجل في جدول supervisors إذا كان الدور مشرف
    if (role === 'supervisor') {
      const { error: supervisorError } = await supabase
        .from('supervisors')
        .insert({
          user_id: userData.id,
          department_id: dept?.id,
          specialization: major || 'نظم المعلومات الإدارية',
          office_location: 'مبنى الكلية',
          max_students: 50,
          current_students: 0,
        });

      if (supervisorError) {
        console.error('❌ Supervisor creation error:', supervisorError);
        // لا نحذف الحساب لأن المشرف يمكن أن يكون بدون سجل في supervisors
      }
    }

    console.log('✅ Signup successful:', finalStudentId, '-', role);

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
      .not('courses', 'is', null);

    if (error) {
      console.error('❌ Error fetching available courses:', error);
      return c.json({ error: 'Failed to fetch available courses' }, 500);
    }

    // Filter by student level and ensure courses exist
    const validOffers = courseOffers?.filter(
      offer => offer.courses && offer.courses.level <= studentLevel
    ) || [];

    // Get student's current registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('course_id')
      .eq('student_id', userData.id)
      .in('status', ['pending', 'approved', 'completed']);

    const registeredCourseIds = registrations?.map(r => r.course_id) || [];

    // Filter out already registered courses
    const availableCourses = validOffers.filter(
      offer => !registeredCourseIds.includes(offer.courses.id)
    );

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

// تحديث مقرر - endpoint بديل للمدير
app.put('/make-server-1573e40a/admin/update-course', async (c) => {
  try {
    const { courseId, ...updates } = await c.req.json();

    console.log('✏️ [Admin] Updating course:', courseId);

    // Get department if needed
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', 'MIS')
      .single();

    const updateData: any = {};
    
    if (updates.code) updateData.code = updates.code;
    if (updates.name_ar) updateData.name_ar = updates.name_ar;
    if (updates.name_en) updateData.name_en = updates.name_en;
    if (updates.description_ar) updateData.description_ar = updates.description_ar;
    if (updates.description_en) updateData.description_en = updates.description_en;
    if (updates.credit_hours) updateData.credits = updates.credit_hours;
    if (updates.level) updateData.level = updates.level;
    if (updates.prerequisites) updateData.prerequisites = Array.isArray(updates.prerequisites) ? updates.prerequisites : [];
    if (updates.course_type) {
      updateData.category = updates.course_type === 'elective' ? 'متطلب اختياري' : 'متطلب قسم';
    }

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating course:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('✅ [Admin] Course updated successfully');

    return c.json({
      success: true,
      course: data,
    });

  } catch (error: any) {
    console.error('❌ [Admin] Update course error:', error);
    return c.json({ error: 'Failed to update course' }, 500);
  }
});

// حذف مقرر (مدير فقط)
app.delete('/make-server-1573e40a/courses/:id', async (c) => {
  try {
    const id = c.req.param('id');

    console.log('🗑️ [Server] Deleting course:', id);

    // Try to find by course_id first, then by id
    let courseQuery = supabase
      .from('courses')
      .select('id, course_id, code')
      .eq('course_id', id);
    
    let { data: course } = await courseQuery.single();

    // If not found by course_id, try by id
    if (!course) {
      const queryById = await supabase
        .from('courses')
        .select('id, course_id, code')
        .eq('id', id)
        .single();
      course = queryById.data;
    }

    if (!course) {
      console.error('❌ Course not found:', id);
      return c.json({ success: false, error: 'Course not found' }, 404);
    }

    console.log('✅ Found course to delete:', course);

    // Soft delete by course id (database id)
    const { error } = await supabase
      .from('courses')
      .update({ active: false })
      .eq('id', course.id);

    if (error) {
      console.error('❌ Error deleting course:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Also deactivate course offers
    await supabase
      .from('course_offers')
      .update({ active: false })
      .eq('course_id', course.id);

    console.log('✅ [Server] Course deleted successfully');

    return c.json({
      success: true,
      message: 'Course deleted successfully',
      deletedCourse: {
        id: course.id,
        courseId: course.course_id,
        code: course.code
      }
    });

  } catch (error: any) {
    console.error('❌ Delete course error:', error);
    return c.json({ success: false, error: 'Failed to delete course' }, 500);
  }
});

// ========================================
// REGISTRATIONS ENDPOINTS
// ========================================

// تسجيل مقرر
app.post('/make-server-1573e40a/registrations', async (c) => {
  try {
    const { studentId, courseOfferId } = await c.req.json();

    console.log('📝 [Registrations] Registration attempt:', studentId, courseOfferId);

    // Validate input
    if (!studentId || !courseOfferId) {
      console.error('❌ [Registrations] Missing required fields');
      return c.json({ 
        success: false,
        error: 'Student ID and Course Offer ID are required' 
      }, 400);
    }

    // Validate student exists
    const { data: user } = await supabase
      .from('users')
      .select('id, student_id')
      .eq('student_id', studentId)
      .eq('active', true)
      .single();

    if (!user) {
      console.error('❌ [Registrations] Student not found:', studentId);
      return c.json({ 
        success: false,
        error: 'Student not found' 
      }, 404);
    }

    console.log('✅ [Registrations] Student found:', studentId);

    // Get course offer
    const { data: courseOffer } = await supabase
      .from('course_offers')
      .select('*, courses(*)')
      .eq('id', courseOfferId)
      .eq('active', true)
      .single();

    if (!courseOffer) {
      console.error('❌ [Registrations] Course offer not found:', courseOfferId);
      return c.json({ 
        success: false,
        error: 'Course offer not found' 
      }, 404);
    }

    // Check if course is full
    if (courseOffer.enrolled_students >= courseOffer.max_students) {
      console.warn('⚠️ [Registrations] Course is full');
      return c.json({ 
        success: false,
        error: 'Course is full' 
      }, 400);
    }

    // Check if already registered for this course (any status except rejected)
    const { data: existing } = await supabase
      .from('registrations')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('course_id', courseOffer.courses.id)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      console.warn('⚠️ [Registrations] Already registered');
      return c.json({ 
        success: false,
        error: 'Already registered for this course',
        existingStatus: existing.status
      }, 400);
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
      console.error('❌ [Registrations] Registration error:', error);
      return c.json({ 
        success: false,
        error: error.message 
      }, 500);
    }

    // Update enrolled count
    await supabase
      .from('course_offers')
      .update({ 
        enrolled_students: courseOffer.enrolled_students + 1 
      })
      .eq('id', courseOfferId);

    // Get course details for response
    const { data: courseDetails } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseOffer.courses.id)
      .single();

    console.log('✅ [Registrations] Registration successful:', data.id);

    return c.json({
      success: true,
      registration: {
        ...data,
        courses: courseDetails
      },
      message: 'Registration created successfully'
    });

  } catch (error: any) {
    console.error('❌ [Registrations] Unexpected error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to register for course' 
    }, 500);
  }
});

// الحصول على تسجيلات الطالب
app.get('/make-server-1573e40a/registrations', async (c) => {
  try {
    const studentId = c.req.query('studentId');
    const status = c.req.query('status');

    console.log('📋 [Registrations] Fetching registrations:', { studentId, status });

    let query = supabase
      .from('registrations')
      .select('*');

    if (studentId) {
      // Convert student_id (text) to user.id (UUID)
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('student_id', studentId)
        .single();

      if (!user) {
        console.warn('⚠️ [Registrations] Student not found:', studentId);
        return c.json({
          success: true,
          registrations: [],
          count: 0,
        });
      }

      query = query.eq('student_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: registrations, error: regError } = await query.order('created_at', { ascending: false });

    if (regError) {
      console.error('❌ [Registrations] Error fetching registrations:', regError);
      return c.json({ 
        success: false,
        error: 'Failed to fetch registrations',
        details: regError.message
      }, 500);
    }

    if (!registrations || registrations.length === 0) {
      console.log('✅ [Registrations] No registrations found');
      return c.json({
        success: true,
        registrations: [],
        count: 0,
      });
    }

    // Get unique course IDs
    const courseIds = [...new Set(registrations.map(r => r.course_id))];

    // Fetch courses data
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);

    if (coursesError) {
      console.error('❌ [Registrations] Error fetching courses:', coursesError);
    }

    // Create course map
    const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

    // Get unique student IDs
    const studentIds = [...new Set(registrations.map(r => r.student_id))];

    // Fetch students data
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select(`
        id,
        student_id,
        name,
        email,
        students!inner(
          level,
          major,
          gpa
        )
      `)
      .in('id', studentIds);

    if (studentsError) {
      console.error('❌ [Registrations] Error fetching students:', studentsError);
    }

    // Create student map
    const studentMap = new Map(students?.map(s => [s.id, s]) || []);

    // Combine data
    const data = registrations.map(reg => {
      const course = courseMap.get(reg.course_id);
      const student = studentMap.get(reg.student_id);
      
      return {
        ...reg,
        registration_id: reg.id,
        course: course ? {
          ...course,
          credit_hours: course.credits,
        } : null,
        student: student ? {
          full_name: student.name,
          email: student.email,
          major: student.students?.major || 'نظم المعلومات الإدارية',
          level: student.students?.level || 1,
          gpa: student.students?.gpa || null,
        } : null,
      };
    });

    console.log(`✅ [Registrations] Found ${data.length} registrations with student data`);

    return c.json({
      success: true,
      registrations: data,
      count: data.length,
    });

  } catch (error: any) {
    console.error('❌ [Registrations] Unexpected error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch registrations' 
    }, 500);
  }
});

// موافقة/رفض تسجيل (مشرف فقط)
app.put('/make-server-1573e40a/registrations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { status, supervisorId } = await c.req.json();

    console.log('✏️ [Registrations] Updating registration:', { id, status, supervisorId });

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ 
        success: false,
        error: 'Invalid status. Must be "approved" or "rejected"' 
      }, 400);
    }

    // Get supervisor user
    const { data: supervisor } = await supabase
      .from('users')
      .select('id')
      .eq('student_id', supervisorId)
      .single();

    if (!supervisor) {
      console.error('❌ [Registrations] Supervisor not found:', supervisorId);
      return c.json({ 
        success: false,
        error: 'Supervisor not found' 
      }, 404);
    }

    const { data, error } = await supabase
      .from('registrations')
      .update({
        status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [Registrations] Error updating registration:', error);
      return c.json({ 
        success: false,
        error: error.message 
      }, 500);
    }

    // Get course details separately
    const { data: courseDetails } = await supabase
      .from('courses')
      .select('*')
      .eq('id', data.course_id)
      .single();

    // Create notification (skip for now - notifications need fixing)
    const message = status === 'approved' 
      ? `تمت الموافقة على تسجيل مقرر ${courseDetails?.name_ar || 'المقرر'}`
      : `تم رفض تسجيل مقرر ${courseDetails?.name_ar || 'المقرر'}`;

    console.log('✅ [Registrations] Registration updated successfully');

    return c.json({
      success: true,
      registration: {
        ...data,
        courses: courseDetails
      },
      message: `Registration ${status} successfully`
    });

  } catch (error: any) {
    console.error('❌ [Registrations] Update error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to update registration' 
    }, 500);
  }
});

// حذف/إلغاء تسجيل مقرر (للطالب فقط - قبل الموافقة)
app.delete('/make-server-1573e40a/registrations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    console.log('🗑️ [Registrations] Deleting registration:', id);

    // Get registration details
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !registration) {
      console.error('❌ [Registrations] Registration not found:', id);
      return c.json({ 
        success: false,
        error: 'Registration not found' 
      }, 404);
    }

    // Only allow deletion of pending registrations
    if (registration.status !== 'pending') {
      console.warn('⚠️ [Registrations] Cannot delete non-pending registration');
      return c.json({ 
        success: false,
        error: `Cannot delete ${registration.status} registration. Only pending registrations can be cancelled.` 
      }, 400);
    }

    // Delete the registration
    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ [Registrations] Delete error:', deleteError);
      return c.json({ 
        success: false,
        error: deleteError.message 
      }, 500);
    }

    // Get course name for notification
    const { data: courseDetails } = await supabase
      .from('courses')
      .select('name_ar')
      .eq('id', registration.course_id)
      .single();

    console.log('✅ [Registrations] Registration deleted successfully');

    return c.json({
      success: true,
      message: 'Registration cancelled successfully',
      deletedRegistration: {
        id: registration.id,
        courseName: courseDetails?.name_ar || 'المقرر',
        status: registration.status
      }
    });

  } catch (error: any) {
    console.error('❌ [Registrations] Delete error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to cancel registration' 
    }, 500);
  }
});

// الحصول على تسجيلات الطالب المسجل دخوله (باستخدام access token)
app.get('/make-server-1573e40a/student/registrations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');

    console.log('📋 [Student] Fetching registrations for authenticated user...');

    if (!accessToken) {
      console.warn('⚠️ [Student] No access token provided');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Get user from access token
    const { data: authUser, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authUser?.user) {
      console.error('❌ [Student] Invalid or expired token:', authError?.message);
      return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }

    // Get user details from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, student_id, name, email')
      .eq('auth_id', authUser.user.id)
      .single();

    if (userError || !user) {
      console.error('❌ [Student] User not found in database');
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    console.log('✅ [Student] User authenticated:', user.student_id);

    // Get registrations for this student (using UUID)
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('❌ [Student] Error fetching registrations:', regError);
      return c.json({ 
        success: false,
        error: 'Failed to fetch registrations',
        details: regError.message
      }, 500);
    }

    if (!registrations || registrations.length === 0) {
      console.log('✅ [Student] No registrations found');
      return c.json({
        success: true,
        registrations: [],
        count: 0,
      });
    }

    // Get unique course IDs
    const courseIds = [...new Set(registrations.map(r => r.course_id))];

    // Fetch courses data
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);

    if (coursesError) {
      console.error('❌ [Student] Error fetching courses:', coursesError);
    }

    // Create course map
    const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

    // Combine data
    const data = registrations.map(reg => {
      const course = courseMap.get(reg.course_id);
      return {
        ...reg,
        course: course ? {
          ...course,
          credit_hours: course.credits, // Map credits to credit_hours for compatibility
        } : null,
      };
    });

    console.log(`✅ [Student] Found ${data.length} registrations for ${user.student_id}`);

    return c.json({
      success: true,
      registrations: data,
      count: data.length,
    });

  } catch (error: any) {
    console.error('❌ [Student] Unexpected error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to fetch registrations',
      details: error.message
    }, 500);
  }
});

// تسجيل مقرر باستخدام access token (للطالب المسجل دخوله)
app.post('/make-server-1573e40a/register-course', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const { courseId } = await c.req.json();

    console.log('📝 [Register] Course registration attempt:', courseId);
    console.log('📝 [Register] courseId type:', typeof courseId);
    console.log('📝 [Register] courseId value:', JSON.stringify(courseId));

    if (!accessToken) {
      console.warn('⚠️ [Register] No access token provided');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    if (!courseId) {
      console.error('❌ [Register] Missing course ID');
      return c.json({ 
        success: false,
        error: 'Course ID is required' 
      }, 400);
    }

    // Get user from access token
    const { data: authUser, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authUser?.user) {
      console.error('❌ [Register] Invalid or expired token:', authError?.message);
      return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }

    // Get user details from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, student_id, name, email')
      .eq('auth_id', authUser.user.id)
      .eq('active', true)
      .single();

    if (userError || !user) {
      console.error('❌ [Register] User not found in database');
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    console.log('✅ [Register] User authenticated:', user.student_id);

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('❌ [Register] Course not found. courseId:', courseId);
      console.error('❌ [Register] Course error details:', courseError?.message || 'No course data');
      console.error('❌ [Register] Full error:', JSON.stringify(courseError));
      return c.json({ 
        success: false,
        error: 'Course not found',
        details: courseError?.message || 'No course data',
        receivedId: courseId
      }, 404);
    }

    // Check if already registered for this course (any status except rejected)
    const { data: existing, error: existingError } = await supabase
      .from('registrations')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      console.warn('⚠️ [Register] Already registered');
      return c.json({ 
        success: false,
        error: 'Already registered for this course',
        existingStatus: existing.status
      }, 400);
    }

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert({
        student_id: user.id,
        course_id: courseId,
        status: 'pending',
        semester: 'Fall',
        year: 2024,
      })
      .select()
      .single();

    if (regError) {
      console.error('❌ [Register] Error creating registration:', regError);
      return c.json({ 
        success: false,
        error: 'Failed to create registration',
        details: regError.message
      }, 500);
    }

    console.log('✅ [Register] Registration created successfully:', registration.id);

    return c.json({
      success: true,
      registration: {
        ...registration,
        courses: course
      },
      message: 'Registration request sent successfully'
    });

  } catch (error: any) {
    console.error('❌ [Register] Unexpected error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to register for course',
      details: error.message
    }, 500);
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

// حذف طالب (تعطيل الحساب)
app.delete('/make-server-1573e40a/students/:id', async (c) => {
  try {
    const studentId = c.req.param('id');

    console.log('🗑️ [Server] Deleting student:', studentId);

    // البحث عن الطالب أولاً
    const { data: student, error: findError } = await supabase
      .from('users')
      .select('id, student_id, name')
      .eq('student_id', studentId)
      .single();

    if (findError || !student) {
      console.error('❌ [Server] Student not found:', studentId, findError);
      return c.json({ success: false, error: 'Student not found' }, 404);
    }

    console.log('✅ [Server] Found student:', student);

    // تعطيل الطالب بدلاً من حذفه (Soft Delete)
    const { error } = await supabase
      .from('users')
      .update({ active: false })
      .eq('student_id', studentId);

    if (error) {
      console.error('❌ Error deleting student:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log('✅ [Server] Student deleted successfully');

    return c.json({
      success: true,
      message: 'Student deleted successfully',
      deletedStudent: {
        id: student.id,
        studentId: student.student_id,
        name: student.name
      }
    });

  } catch (error: any) {
    console.error('❌ Delete student error:', error);
    return c.json({ success: false, error: 'Failed to delete student' }, 500);
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

    console.log('🗑️ [Server] Deleting supervisor:', employeeId);

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

    console.log('✅ [Server] Supervisor deleted successfully');

    return c.json({
      success: true,
      message: 'Supervisor deleted successfully',
    });

  } catch (error: any) {
    console.error('❌ Delete supervisor error:', error);
    return c.json({ error: 'Failed to delete supervisor' }, 500);
  }
});

// حذف مشرف - endpoint بديل للمدير
app.delete('/make-server-1573e40a/admin/delete-supervisor', async (c) => {
  try {
    const { userId } = await c.req.json();

    console.log('🗑️ [Admin] Deleting supervisor by user_id:', userId);

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    // Soft delete by user id
    const { error } = await supabase
      .from('users')
      .update({ active: false })
      .eq('id', userId)
      .eq('role', 'supervisor');

    if (error) {
      console.error('❌ Error deleting supervisor:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('✅ [Admin] Supervisor deleted successfully');

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

    // Get approved registrations
    const { data: approved } = await supabase
      .from('registrations')
      .select('*')
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

// الحصول على تقرير طالب معين (للمدير)
app.get('/make-server-1573e40a/admin/student-report/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');

    console.log('📊 [Admin] Fetching student report:', studentId);

    // التحقق من صلاحية المدير أو المشرف
    const { data: adminUser } = await supabase.auth.getUser(accessToken);
    if (!adminUser?.user) {
      console.warn('⚠️ [Admin] No auth user found');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { data: admin } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', adminUser.user.id)
      .single();

    if (!admin) {
      console.warn('⚠️ [Admin] User not found in database');
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    if (admin.role !== 'admin' && admin.role !== 'supervisor') {
      console.warn('⚠️ [Admin] Insufficient permissions:', admin.role);
      return c.json({ success: false, error: 'Admin or Supervisor access required' }, 403);
    }

    // Get student user
    const { data: student } = await supabase
      .from('users')
      .select(`
        *,
        students(*)
      `)
      .eq('student_id', studentId)
      .single();

    if (!student) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Get student's registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select(`
        *,
        courses(*)
      `)
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    // Get student's reports
    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .eq('student_id', student.id)
      .order('year', { ascending: false })
      .order('semester', { ascending: false });

    // Calculate statistics
    const completedCourses = registrations?.filter(r => r.status === 'approved' && r.grade) || [];
    const totalCredits = completedCourses.reduce((sum, r) => sum + (r.courses?.credits || 0), 0);
    
    let totalPoints = 0;
    completedCourses.forEach(r => {
      const gradePoints: { [key: string]: number } = {
        'A+': 5.0, 'A': 4.75, 'B+': 4.5, 'B': 4.0, 'C+': 3.5, 
        'C': 3.0, 'D+': 2.5, 'D': 2.0, 'F': 0
      };
      const points = gradePoints[r.grade || 'F'] || 0;
      totalPoints += points * (r.courses?.credits || 0);
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

    // Calculate course stats
    const approvedCourses = registrations?.filter(r => r.status === 'approved') || [];
    const pendingCourses = registrations?.filter(r => r.status === 'pending') || [];
    const rejectedCourses = registrations?.filter(r => r.status === 'rejected') || [];
    
    const approvedHours = approvedCourses.reduce((sum, r) => sum + (r.courses?.credits || 0), 0);

    console.log('✅ [Admin] Student report generated successfully');
    console.log(`📊 [Admin] Stats - Total: ${registrations?.length || 0}, Approved: ${approvedCourses.length}, Pending: ${pendingCourses.length}`);

    return c.json({
      success: true,
      student: {
        id: student.student_id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        major: student.students?.[0]?.major || 'نظم المعلومات الإدارية',
        level: student.students?.[0]?.level || 1,
        gpa: parseFloat(gpa),
        earned_hours: totalCredits,
        role: 'student',
      },
      registrations: (registrations || []).map(r => ({
        registration_id: r.id,
        course_id: r.course_id,
        status: r.status,
        registered_at: r.created_at,
        grade: r.grade || null,
        course: {
          code: r.courses?.code || '',
          name_ar: r.courses?.name_ar || '',
          name_en: r.courses?.name_en || '',
          credit_hours: r.courses?.credits || 0,
          credits: r.courses?.credits || 0,
          level: r.courses?.level || 1,
        }
      })),
      stats: {
        totalCourses: registrations?.length || 0,
        approvedCourses: approvedCourses.length,
        pendingCourses: pendingCourses.length,
        rejectedCourses: rejectedCourses.length,
        totalHours: totalCredits,
        approvedHours: approvedHours,
        semesterGPA: parseFloat(gpa),
        cumulativeGPA: parseFloat(gpa),
      },
      reports: reports || [],
      statistics: {
        totalCourses: completedCourses.length,
        totalCredits,
        gpa: parseFloat(gpa),
      },
    });

  } catch (error: any) {
    console.error('❌ [Admin] Student report error:', error);
    return c.json({ error: 'Failed to fetch student report' }, 500);
  }
});

// الحصول على تقرير طالب - endpoint بديل
app.get('/make-server-1573e40a/reports/student/:id', async (c) => {
  try {
    const studentId = c.req.param('id');
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');

    console.log('📊 Fetching student report:', studentId);

    // Get student user
    const { data: student } = await supabase
      .from('users')
      .select(`
        *,
        students(*)
      `)
      .eq('student_id', studentId)
      .single();

    if (!student) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Get student's registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select(`
        *,
        courses(*)
      `)
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    // Get student's reports
    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .eq('student_id', student.id)
      .order('year', { ascending: false })
      .order('semester', { ascending: false });

    // Calculate statistics
    const completedCourses = registrations?.filter(r => r.status === 'approved' && r.grade) || [];
    const totalCredits = completedCourses.reduce((sum, r) => sum + (r.courses?.credits || 0), 0);
    
    let totalPoints = 0;
    completedCourses.forEach(r => {
      const gradePoints: { [key: string]: number } = {
        'A+': 5.0, 'A': 4.75, 'B+': 4.5, 'B': 4.0, 'C+': 3.5, 
        'C': 3.0, 'D+': 2.5, 'D': 2.0, 'F': 0
      };
      const points = gradePoints[r.grade || 'F'] || 0;
      totalPoints += points * (r.courses?.credits || 0);
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

    console.log('✅ Student report generated successfully');

    return c.json({
      success: true,
      student: {
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        major: student.students?.[0]?.major || 'MIS',
        level: student.students?.[0]?.level || 1,
        gpa: parseFloat(gpa),
      },
      registrations: registrations || [],
      reports: reports || [],
      statistics: {
        totalCourses: completedCourses.length,
        totalCredits,
        gpa: parseFloat(gpa),
      },
    });

  } catch (error: any) {
    console.error('❌ [Admin] Student report error:', error);
    return c.json({ success: false, error: 'Failed to fetch student report' }, 500);
  }
});

// الحصول على جميع الطلاب (للمدير)
app.get('/make-server-1573e40a/admin/students', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');

    console.log('👥 [Admin] Fetching all students...');

    // التحقق من صلاحية المدير أو المشرف
    const { data: adminUser } = await supabase.auth.getUser(accessToken);
    if (!adminUser?.user) {
      console.warn('⚠️ [Admin] No auth user found');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { data: admin } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', adminUser.user.id)
      .single();

    if (!admin) {
      console.warn('⚠️ [Admin] User not found in database');
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    if (admin.role !== 'admin' && admin.role !== 'supervisor') {
      console.warn('⚠️ [Admin] Insufficient permissions:', admin.role);
      return c.json({ 
        success: false, 
        error: 'Admin or Supervisor access required'
      }, 403);
    }

    console.log('✅ [Admin] User authorized:', admin.role);

    // Get all students with their details from students table
    const { data: students, error } = await supabase
      .from('users')
      .select(`
        id,
        student_id,
        name,
        email,
        role,
        active,
        students (
          level,
          gpa,
          major,
          completed_credits,
          total_credits
        )
      `)
      .eq('role', 'student')
      .eq('active', true)
      .order('student_id');

    if (error) {
      console.error('❌ [Admin] Error fetching students:', error);
      return c.json({ success: false, error: 'Failed to fetch students', details: error.message }, 500);
    }

    // Transform data to flatten structure
    const formattedStudents = students?.map(student => ({
      id: student.student_id,
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      role: student.role,
      major: student.students?.[0]?.major || 'نظم المعلومات الإدارية',
      level: student.students?.[0]?.level || 1,
      gpa: student.students?.[0]?.gpa || 0.0,
      earned_hours: student.students?.[0]?.completed_credits || 0,
      total_hours: student.students?.[0]?.total_credits || 132,
    })) || [];

    console.log(`✅ [Admin] Found ${formattedStudents.length} students`);

    return c.json({
      success: true,
      students: formattedStudents,
      count: formattedStudents.length,
    });

  } catch (error: any) {
    console.error('❌ [Admin] Students error:', error);
    return c.json({ success: false, error: 'Failed to fetch students' }, 500);
  }
});

// الحصول على طلبات التسجيل (للمدير)
app.get('/make-server-1573e40a/admin/registration-requests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');

    console.log('📋 [Admin] Fetching registration requests...');

    // التحقق من صلاحية المدير أو المشرف
    const { data: adminUser } = await supabase.auth.getUser(accessToken);
    if (!adminUser?.user) {
      console.warn('⚠️ [Admin] No auth user found');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { data: admin } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', adminUser.user.id)
      .single();

    if (!admin) {
      console.warn('⚠️ [Admin] User not found in database');
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // السماح للمدير والمشرف بالوصول
    if (admin.role !== 'admin' && admin.role !== 'supervisor') {
      console.warn('⚠️ [Admin] Insufficient permissions:', admin.role);
      return c.json({ 
        success: false, 
        error: 'Admin or Supervisor access required',
        userRole: admin.role
      }, 403);
    }

    console.log('✅ [Admin] User authorized:', admin.role);

    // Get all pending registration requests
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('�� [Admin] Error fetching registrations:', regError);
      return c.json({ success: false, error: 'Failed to fetch registrations', details: regError.message }, 500);
    }

    if (!registrations || registrations.length === 0) {
      console.log('✅ [Admin] No pending requests found');
      return c.json({
        success: true,
        requests: [],
        count: 0,
      });
    }

    // Get unique student IDs and course IDs
    const studentIds = [...new Set(registrations.map(r => r.student_id))];
    const courseIds = [...new Set(registrations.map(r => r.course_id))];

    console.log(`📊 [Admin] Fetching data for ${studentIds.length} students and ${courseIds.length} courses`);

    // ✅ Fetch students data with students table join for level, gpa, major
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select(`
        id,
        student_id,
        name,
        email,
        students (
          level,
          gpa,
          major
        )
      `)
      .in('id', studentIds);

    if (studentsError) {
      console.error('❌ [Admin] Error fetching students:', studentsError);
    } else {
      console.log(`✅ [Admin] Fetched ${students?.length || 0} students`);
    }

    // Fetch courses data
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, code, name_ar, name_en, credits, level')
      .in('id', courseIds);

    if (coursesError) {
      console.error('❌ [Admin] Error fetching courses:', coursesError);
    } else {
      console.log(`✅ [Admin] Fetched ${courses?.length || 0} courses`);
    }

    // ✅ Create lookup maps using id (UUID)
    const studentMap = new Map(students?.map(s => [s.id, s]) || []);
    const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

    // Combine data
    const requests = registrations.map(reg => {
      const student = studentMap.get(reg.student_id);
      const course = courseMap.get(reg.course_id);

      return {
        id: reg.id,
        request_id: reg.id,  // ✅ إضافة request_id لتوافق مع Frontend
        registration_id: reg.id,  // ✅ إضافة registration_id  
        student_id: reg.student_id,
        course_id: reg.course_id,
        status: reg.status,
        created_at: reg.created_at,
        student: student ? {
          id: student.id,
          student_id: student.student_id,
          full_name: student.name,
          email: student.email,
          level: student.students?.[0]?.level || null,
          gpa: student.students?.[0]?.gpa || null,
          major: student.students?.[0]?.major || null,
        } : null,
        course: course ? {
          code: course.code,
          name_ar: course.name_ar,
          name_en: course.name_en,
          credits: course.credits,
          credit_hours: course.credits,  // ✅ إضافة credit_hours لتوافق مع Frontend
          level: course.level,
        } : null,
      };
    });

    console.log(`✅ [Admin] Found ${requests.length} pending requests`);

    return c.json({
      success: true,
      requests: requests,
      count: requests.length,
    });

  } catch (error: any) {
    console.error('❌ [Admin] Registration requests error:', error);
    return c.json({ success: false, error: 'Failed to fetch registration requests' }, 500);
  }
});

// معالجة طلب التسجيل (موافقة أو رفض) - للمدير والمشرف
app.post('/make-server-1573e40a/admin/process-registration-request', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const body = await c.req.json();
    
    // دعم كلاً من request_id و requestId للتوافق
    const request_id = body.request_id || body.requestId;
    const action = body.action;
    const note = body.note || body.rejectionReason;

    console.log('📝 [Admin] Processing registration request:', { request_id, action, note });

    // التحقق من صلاحية المدير أو المشرف
    const { data: authUser } = await supabase.auth.getUser(accessToken);
    if (!authUser?.user) {
      console.warn('⚠️ [Admin] No auth user found');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('id, student_id, name, role')
      .eq('auth_id', authUser.user.id)
      .single();

    if (!currentUser) {
      console.warn('⚠️ [Admin] User not found in database');
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // السماح للمدير والمشرف بالوصول
    if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
      console.warn('⚠️ [Admin] Insufficient permissions:', currentUser.role);
      return c.json({ 
        success: false, 
        error: 'Admin or Supervisor access required',
        userRole: currentUser.role
      }, 403);
    }

    console.log('✅ [Admin] User authorized:', currentUser.role, '-', currentUser.name);

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return c.json({ 
        success: false,
        error: 'Invalid action. Must be "approve" or "reject"' 
      }, 400);
    }

    // Get registration details
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        courses (
          id,
          code,
          name_ar,
          name_en,
          credits,
          level
        )
      `)
      .eq('id', request_id)
      .single();

    if (regError || !registration) {
      console.error('❌ [Admin] Registration not found:', request_id);
      return c.json({ 
        success: false,
        error: 'Registration request not found' 
      }, 404);
    }

    // Check if already processed
    if (registration.status !== 'pending') {
      console.warn('⚠️ [Admin] Registration already processed:', registration.status);
      return c.json({ 
        success: false,
        error: `Request already ${registration.status}`,
        currentStatus: registration.status
      }, 400);
    }

    // Update registration
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data: updated, error: updateError } = await supabase
      .from('registrations')
      .update({
        status: newStatus,
      })
      .eq('id', request_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [Admin] Error updating registration:', updateError);
      return c.json({ 
        success: false,
        error: 'Failed to update registration',
        details: updateError.message
      }, 500);
    }

    console.log(`✅ [Admin] Registration ${newStatus} by ${currentUser.name}`);

    // Get student info for notification
    const { data: student } = await supabase
      .from('users')
      .select('id, student_id, name, email')
      .eq('id', registration.student_id)
      .single();

    // Create notification for student
    if (student) {
      const notificationMessage = action === 'approve'
        ? `تمت الموافقة على تسجيل مقرر ${registration.courses?.name_ar || 'المقرر'}`
        : `تم رفض تسجيل مقرر ${registration.courses?.name_ar || 'المقرر'}`;

      await supabase
        .from('notifications')
        .insert({
          user_id: student.id,
          type: action === 'approve' ? 'approval' : 'rejection',
          title: action === 'approve' ? 'تمت الموافقة' : 'تم الرفض',
          message: notificationMessage,
          related_id: request_id,
          read: false,
        });

      console.log(`✅ [Admin] Notification sent to student: ${student.name}`);
    }

    return c.json({
      success: true,
      message: `Request ${action}d successfully`,
      registration: {
        ...updated,
        course: registration.courses,
        student: student ? {
          student_id: student.student_id,
          name: student.name,
          email: student.email,
        } : null,
      },
    });

  } catch (error: any) {
    console.error('❌ [Admin] Process request error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to process registration request',
      details: error.message
    }, 500);
  }
});

// ========================================
// CURRICULUM ENDPOINT
// ========================================

// الحصول على المنهج الدراسي
app.get('/make-server-1573e40a/curriculum', async (c) => {
  try {
    const department = c.req.query('department') || 'MIS';
    
    console.log('📚 Fetching curriculum for department:', department);

    // Get department info
    const { data: dept } = await supabase
      .from('departments')
      .select('*')
      .eq('code', department)
      .single();

    if (!dept) {
      console.error('❌ [Curriculum] Department not found:', department);
      return c.json({ success: false, error: 'Department not found' }, 404);
    }

    // Get all courses for the department
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('department_id', dept.id)
      .eq('active', true)
      .order('level')
      .order('code');

    if (error) {
      console.error('❌ [Curriculum] Error fetching courses:', error);
      return c.json({ success: false, error: 'Failed to fetch courses' }, 500);
    }

    // If no courses found
    if (!courses || courses.length === 0) {
      console.warn('⚠️ [Curriculum] No courses found for department:', department);
      return c.json({
        success: true,
        department: {
          code: dept.code,
          name_ar: dept.name_ar,
          name_en: dept.name_en,
        },
        coursesByLevel: {},
        levelSummary: [],
        totalCourses: 0,
        totalCreditHours: 0,
      });
    }

    // Group courses by level
    const coursesByLevel: { [key: number]: any[] } = {};
    const levelSummary: { [key: number]: { totalCourses: number; totalCredits: number } } = {};

    courses.forEach((course: any) => {
      const level = course.level || 1;
      if (!coursesByLevel[level]) {
        coursesByLevel[level] = [];
        levelSummary[level] = { totalCourses: 0, totalCredits: 0 };
      }
      coursesByLevel[level].push({
        ...course,
        credit_hours: course.credits, // Map credits to credit_hours for compatibility
      });
      levelSummary[level].totalCourses++;
      levelSummary[level].totalCredits += course.credits || 0;
    });

    // Calculate totals
    const totalCourses = courses.length;
    const totalCreditHours = courses.reduce((sum: number, course: any) => sum + (course.credits || 0), 0);

    console.log(`✅ Found ${totalCourses} courses with ${totalCreditHours} credit hours`);

    // Convert levelSummary object to array for frontend
    const levelSummaryArray = Object.keys(levelSummary).map(level => ({
      level: parseInt(level),
      courses: levelSummary[parseInt(level)].totalCourses,
      credits: levelSummary[parseInt(level)].totalCredits,
    }));

    return c.json({
      success: true,
      department: {
        code: dept.code,
        name_ar: dept.name_ar,
        name_en: dept.name_en,
      },
      coursesByLevel,
      levelSummary: levelSummaryArray,
      totalCourses,
      totalCreditHours,
    });

  } catch (error: any) {
    console.error('❌ [Curriculum] Unexpected error:', error);
    return c.json({ success: false, error: 'Failed to fetch curriculum' }, 500);
  }
});

// تهيئة المقررات (تحميل البيانات الأولية)
app.post('/make-server-1573e40a/init-courses', async (c) => {
  try {
    console.log('📥 Initializing courses...');

    // Check if courses already exist
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('⚠️ Courses already initialized');
      const { count } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });
      return c.json({
        success: true,
        message: 'Courses already initialized',
        created: count || 0,
      });
    }

    console.log('📚 Creating 49 courses from official MIS curriculum...');

    // Get MIS department
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('code', 'MIS')
      .single();

    if (!dept) {
      return c.json({ error: 'MIS department not found' }, 404);
    }

    const departmentId = dept.id;

    // 49 مقرراً من الخطة الرسمية
    const courses = [
      { code: 'MIS101', name_ar: 'مقدمة في نظم المعلومات', name_en: 'Introduction to Information Systems', credits: 3, level: 1, type: 'required' },
      { code: 'CS101', name_ar: 'أساسيات البرمجة', name_en: 'Programming Fundamentals', credits: 3, level: 1, type: 'required' },
      { code: 'MATH101', name_ar: 'الرياضيات للأعمال', name_en: 'Mathematics for Business', credits: 3, level: 1, type: 'required' },
      { code: 'ENGL101', name_ar: 'اللغة الإنجليزية (1)', name_en: 'English Language (1)', credits: 3, level: 1, type: 'required' },
      { code: 'ARAB101', name_ar: 'اللغة العربية', name_en: 'Arabic Language', credits: 2, level: 1, type: 'required' },
      { code: 'ISLM101', name_ar: 'الثقافة الإسلامية (1)', name_en: 'Islamic Culture (1)', credits: 2, level: 1, type: 'required' },
      { code: 'MIS102', name_ar: 'تحليل وتصميم النظم', name_en: 'Systems Analysis and Design', credits: 3, level: 2, type: 'required' },
      { code: 'CS102', name_ar: 'البرمجة الشيئية', name_en: 'Object-Oriented Programming', credits: 3, level: 2, type: 'required' },
      { code: 'STAT201', name_ar: 'الإحصاء للأعمال', name_en: 'Statistics for Business', credits: 3, level: 2, type: 'required' },
      { code: 'ACCT101', name_ar: 'مبادئ المحاسبة', name_en: 'Principles of Accounting', credits: 3, level: 2, type: 'required' },
      { code: 'ENGL102', name_ar: 'اللغة الإنجليزية (2)', name_en: 'English Language (2)', credits: 3, level: 2, type: 'required' },
      { code: 'ISLM102', name_ar: 'الثقافة الإسلامية (2)', name_en: 'Islamic Culture (2)', credits: 2, level: 2, type: 'required' },
      { code: 'MIS201', name_ar: 'قواعد البيانات', name_en: 'Database Management Systems', credits: 3, level: 3, type: 'required' },
      { code: 'MIS202', name_ar: 'الشبكات والاتصالات', name_en: 'Networks and Communications', credits: 3, level: 3, type: 'required' },
      { code: 'MIS203', name_ar: 'برمجة الويب', name_en: 'Web Programming', credits: 3, level: 3, type: 'required' },
      { code: 'MGT201', name_ar: 'مبادئ الإدارة', name_en: 'Principles of Management', credits: 3, level: 3, type: 'required' },
      { code: 'ECON201', name_ar: 'مبادئ الاقتصاد', name_en: 'Principles of Economics', credits: 3, level: 3, type: 'required' },
      { code: 'COMM201', name_ar: 'مهارات الاتصال', name_en: 'Communication Skills', credits: 2, level: 3, type: 'required' },
      { code: 'MIS301', name_ar: 'تطوير تطبيقات الأعمال', name_en: 'Business Application Development', credits: 3, level: 4, type: 'required' },
      { code: 'MIS302', name_ar: 'أمن المعلومات', name_en: 'Information Security', credits: 3, level: 4, type: 'required' },
      { code: 'MIS303', name_ar: 'إدارة المشاريع التقنية', name_en: 'IT Project Management', credits: 3, level: 4, type: 'required' },
      { code: 'MIS304', name_ar: 'تحليلات البيانات', name_en: 'Data Analytics', credits: 3, level: 4, type: 'required' },
      { code: 'FIN201', name_ar: 'الإدارة المالية', name_en: 'Financial Management', credits: 3, level: 4, type: 'required' },
      { code: 'LAW201', name_ar: 'القانون التجاري', name_en: 'Commercial Law', credits: 2, level: 4, type: 'required' },
      { code: 'MIS401', name_ar: 'نظم دعم القرار', name_en: 'Decision Support Systems', credits: 3, level: 5, type: 'required' },
      { code: 'MIS402', name_ar: 'التجارة الإلكترونية', name_en: 'E-Commerce', credits: 3, level: 5, type: 'required' },
      { code: 'MIS403', name_ar: 'نظم المعلومات الإدارية المتقدمة', name_en: 'Advanced MIS', credits: 3, level: 5, type: 'required' },
      { code: 'MIS404', name_ar: 'الحوسبة السحابية', name_en: 'Cloud Computing', credits: 3, level: 5, type: 'required' },
      { code: 'MKT301', name_ar: 'مبادئ التسويق', name_en: 'Principles of Marketing', credits: 3, level: 5, type: 'required' },
      { code: 'HRM301', name_ar: 'إدارة الموارد البشرية', name_en: 'Human Resource Management', credits: 3, level: 5, type: 'required' },
      { code: 'MIS501', name_ar: 'ذكاء الأعمال', name_en: 'Business Intelligence', credits: 3, level: 6, type: 'required' },
      { code: 'MIS502', name_ar: 'تطبيقات الهاتف المحمول', name_en: 'Mobile Applications', credits: 3, level: 6, type: 'required' },
      { code: 'MIS503', name_ar: 'إدارة قواعد البيانات المتقدمة', name_en: 'Advanced Database Management', credits: 3, level: 6, type: 'required' },
      { code: 'MIS504', name_ar: 'تدقيق نظم المعلومات', name_en: 'IS Auditing', credits: 3, level: 6, type: 'required' },
      { code: 'ENTR301', name_ar: 'ريادة الأعمال', name_en: 'Entrepreneurship', credits: 2, level: 6, type: 'required' },
      { code: 'QLTY301', name_ar: 'إدارة الجودة الشاملة', name_en: 'Total Quality Management', credits: 2, level: 6, type: 'required' },
      { code: 'MIS601', name_ar: 'الذكاء الاصطناعي للأعمال', name_en: 'AI for Business', credits: 3, level: 7, type: 'required' },
      { code: 'MIS602', name_ar: 'إدارة المعرفة', name_en: 'Knowledge Management', credits: 3, level: 7, type: 'required' },
      { code: 'MIS603', name_ar: 'نظم تخطيط موارد المؤسسات', name_en: 'Enterprise Resource Planning', credits: 3, level: 7, type: 'required' },
      { code: 'MIS604', name_ar: 'إنترنت الأشياء', name_en: 'Internet of Things', credits: 3, level: 7, type: 'elective' },
      { code: 'MIS605', name_ar: 'البيانات الضخمة', name_en: 'Big Data', credits: 3, level: 7, type: 'elective' },
      { code: 'RSCH401', name_ar: 'منهجية البحث العلمي', name_en: 'Research Methodology', credits: 2, level: 7, type: 'required' },
      { code: 'MIS701', name_ar: 'استراتيجيات نظم المعلومات', name_en: 'IS Strategy', credits: 3, level: 8, type: 'required' },
      { code: 'MIS702', name_ar: 'مشروع التخرج (1)', name_en: 'Graduation Project (1)', credits: 2, level: 8, type: 'required' },
      { code: 'MIS703', name_ar: 'الأمن السيبراني المتقدم', name_en: 'Advanced Cybersecurity', credits: 3, level: 8, type: 'elective' },
      { code: 'MIS704', name_ar: 'تحليلات البيانات المتقدمة', name_en: 'Advanced Data Analytics', credits: 3, level: 8, type: 'elective' },
      { code: 'MIS705', name_ar: 'نظم المعلومات الجغرافية', name_en: 'Geographic Information Systems', credits: 3, level: 8, type: 'elective' },
      { code: 'MIS706', name_ar: 'تطبيقات Blockchain', name_en: 'Blockchain Applications', credits: 3, level: 8, type: 'elective' },
      { code: 'COOP801', name_ar: 'التدريب التعاوني', name_en: 'Co-op Training', credits: 3, level: 8, type: 'required' },
    ];

    const coursesToInsert = courses.map(c => ({
      code: c.code,
      name_ar: c.name_ar,
      name_en: c.name_en,
      credits: c.credits,
      level: c.level,
      type: c.type,
      department_id: departmentId,
      active: true,
    }));

    const { data, error } = await supabase
      .from('courses')
      .insert(coursesToInsert)
      .select();

    if (error) {
      console.error('❌ Error inserting courses:', error);
      return c.json({ error: 'Failed to insert courses' }, 500);
    }

    console.log(`✅ Successfully created ${data.length} courses`);

    return c.json({
      success: true,
      message: 'Courses initialized successfully',
      created: data.length,
    });

  } catch (error: any) {
    console.error('❌ Init courses error:', error);
    return c.json({ error: 'Failed to initialize courses' }, 500);
  }
});

// ========================================
// SYSTEM SETUP ENDPOINTS
// ========================================

// إنشاء حساب admin
app.post('/make-server-1573e40a/setup/create-admin', async (c) => {
  try {
    console.log('🔧 Creating admin account...');
    
    const body = await c.req.json();
    const { email, password, name, studentId } = body;

    const adminEmail = email || 'admin@kku.edu.sa';
    const adminPassword = password || 'Admin@123';
    const adminName = name || 'مدير النظام';
    const adminStudentId = studentId || 'ADM000001';

    // Create admin user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      // If user already exists, try to get it
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const existing = existingUser?.users.find(u => u.email === adminEmail);
      
      if (existing) {
        console.log('⚠️ Admin user already exists in auth');
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', existing.id)
          .single();

        if (dbUser) {
          return c.json({ success: true, message: 'Admin already exists', user: dbUser });
        }

        const { data: newDbUser, error: dbError } = await supabase
          .from('users')
          .insert({
            id: existing.id,
            student_id: adminStudentId,
            email: adminEmail,
            name: adminName,
            role: 'admin',
            major: 'Administration',
            level: 1,
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ DB error:', dbError);
          throw new Error('Failed to create admin in database');
        }

        return c.json({ success: true, message: 'Admin created successfully', user: newDbUser });
      }

      throw authError;
    }

    console.log('✅ Admin auth user created:', authData.user.id);

    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        student_id: adminStudentId,
        email: adminEmail,
        name: adminName,
        role: 'admin',
        major: 'Administration',
        level: 1,
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ DB error:', dbError);
      throw new Error('Failed to create admin in database');
    }

    console.log('✅ Admin created successfully');

    return c.json({ success: true, message: 'Admin created successfully', user: dbUser });

  } catch (error: any) {
    console.error('❌ Create admin error:', error);
    return c.json({ error: error.message || 'Failed to create admin' }, 500);
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
      answer = 'المشرف الأكاديمي مسؤول عن الموافقة على طلبات التسجيل الخاصة بك. سيتم إشعارك فور موافقة أو رفض المشرف لط��باتك.';
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
// AI ASSISTANT
// ========================================

app.post('/make-server-1573e40a/ai-assistant', async (c) => {
  try {
    const body = await c.req.json();
    const { message, userInfo, courses, registrations, requests, students, language } = body;

    console.log('🤖 [AI Assistant] Received request');
    console.log('👤 [AI Assistant] User role:', userInfo?.role || 'student');
    console.log('💬 [AI Assistant] Message:', message);
    console.log('🌐 [AI Assistant] Language:', language);

    // التحقق من وجود الرسالة
    if (!message || !message.trim()) {
      return c.json({
        success: false,
        response: language === 'ar' 
          ? 'الرجاء إدخال سؤال'
          : 'Please enter a question',
        type: 'error'
      }, 400);
    }

    // بناء سياق المستخدم
    const role = userInfo?.role || 'student';
    const userName = userInfo?.name || (language === 'ar' ? 'الطالب' : 'Student');
    
    let systemContext = '';
    let userContext = '';

    // تحديد السياق بناءً على الدور
    if (role === 'admin') {
      systemContext = language === 'ar'
        ? `أنت مساعد ذكي لمدير نظام تسجيل المقررات في جامعة الملك خالد.
المدير: ${userName}
عدد الطلاب في النظام: ${students?.length || 0}

يمكنك مساعدة المدير في:
- الإحصائيات العامة للنظام
- إدارة الأقسام والمستويات
- تحليل البيانات الأكاديمية
- حل المشاكل التقنية
- إدارة الطلاب والمشرفين

أجب بشكل مهني ودقيق باللغة العربية.`
        : `You are a smart assistant for the course registration system administrator at King Khalid University.
Admin: ${userName}
Number of students: ${students?.length || 0}

You can help the admin with:
- System statistics
- Department and level management
- Academic data analysis
- Technical problem solving
- Student and supervisor management

Respond professionally and accurately in English.`;

      userContext = `المستخدم: ${userName} (مدير)
عدد الطلاب: ${students?.length || 0}
السؤال: ${message}`;

    } else if (role === 'supervisor') {
      systemContext = language === 'ar'
        ? `أنت مساعد ذكي لمشرف أكاديمي في جامعة الملك خالد.
المشرف: ${userName}
عدد طلبات التسجيل: ${requests?.length || 0}

يمكنك مساعدة المشرف في:
- مراجعة طلبات تسجيل المقررات
- الموافقة أو رفض الطلبات
- إدارة الطلاب المشرف عليهم
- تقديم التوجيه الأكاديمي
- إنشاء تقارير الطلاب

أجب بشكل مهني ودقيق باللغة العربية.`
        : `You are a smart assistant for an academic supervisor at King Khalid University.
Supervisor: ${userName}
Number of registration requests: ${requests?.length || 0}

You can help the supervisor with:
- Reviewing course registration requests
- Approving or rejecting requests
- Managing supervised students
- Providing academic guidance
- Creating student reports

Respond professionally and accurately in English.`;

      userContext = `المستخدم: ${userName} (مشرف أكاديمي)
عدد الطلبات: ${requests?.length || 0}
السؤال: ${message}`;

    } else {
      // student
      systemContext = language === 'ar'
        ? `أنت مساعد ذكي للطلاب في جامعة الملك خالد - نظام تسجيل المقررات.
الطالب: ${userName}
التخصص: ${userInfo?.major || 'نظم المعلومات الإدارية'}
المستوى: ${userInfo?.level || 1}
المعدل التراكمي: ${userInfo?.gpa?.toFixed(2) || '0.00'}
عدد المقررات المتاحة: ${courses?.length || 0}
عدد المقررات المسجلة: ${registrations?.length || 0}

يمكنك مساعدة الطالب في:
- استعراض المقررات المتاحة حسب المستوى
- التحقق من المتطلبات السابقة
- معرفة حالة التسجيلات
- حساب المعدل التراكمي
- التحقق من التعارضات الزمنية
- معرفة عدد الساعات المتبقية للتخرج

أجب بشكل ودود ودقيق باللغة العربية.`
        : `You are a smart assistant for students at King Khalid University - Course Registration System.
Student: ${userName}
Major: ${userInfo?.major || 'Management Information Systems'}
Level: ${userInfo?.level || 1}
GPA: ${userInfo?.gpa?.toFixed(2) || '0.00'}
Available courses: ${courses?.length || 0}
Registered courses: ${registrations?.length || 0}

You can help the student with:
- Browsing available courses by level
- Checking prerequisites
- Knowing registration status
- Calculating GPA
- Checking time conflicts
- Knowing remaining credit hours for graduation

Respond in a friendly and accurate manner in English.`;

      userContext = `المستخدم: ${userName} (طالب)
التخصص: ${userInfo?.major || 'MIS'}
المستوى: ${userInfo?.level || 1}
المعدل: ${userInfo?.gpa?.toFixed(2) || '0.00'}
المقررات المتاحة: ${courses?.length || 0}
المقررات المسجلة: ${registrations?.length || 0}
السؤال: ${message}`;
    }

    // محاولة استخدام OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (openaiApiKey) {
      try {
        console.log('🔑 [AI Assistant] Using OpenAI API');
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: systemContext,
              },
              {
                role: 'user',
                content: userContext,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const aiResponse = openaiData.choices[0]?.message?.content || '';
          
          console.log('✅ [AI Assistant] OpenAI response received');
          
          return c.json({
            success: true,
            response: aiResponse,
            type: 'ai',
          });
        } else {
          console.warn('⚠️ [AI Assistant] OpenAI API failed, using fallback');
        }
      } catch (openaiError) {
        console.warn('⚠️ [AI Assistant] OpenAI error:', openaiError);
      }
    } else {
      console.log('ℹ️ [AI Assistant] No OpenAI API key, using fallback');
    }

    // Fallback: ردود تلقائية ذكية بدون OpenAI
    let fallbackResponse = '';

    const lowerMessage = message.toLowerCase();

    // ردود للمدير
    if (role === 'admin') {
      if (lowerMessage.includes('طلاب') || lowerMessage.includes('students') || lowerMessage.includes('عدد')) {
        fallbackResponse = language === 'ar'
          ? `عدد الطلاب المسجلين في النظام: ${students?.length || 0} طالب.\n\nيمكنك عرض تقارير مفصلة من صفحة التقارير الأكاديمية.`
          : `Total students in the system: ${students?.length || 0}.\n\nYou can view detailed reports from the Academic Reports page.`;
      } else if (lowerMessage.includes('إحصائ') || lowerMessage.includes('statistic') || lowerMessage.includes('تقرير')) {
        fallbackResponse = language === 'ar'
          ? `📊 للوصول للإحصائيات:\n• اذهب إلى "التقارير الأكاديمية"\n• يمكنك فلترة الطلاب حسب القسم والمستوى\n• عرض التقارير الفردية أو الجماعية\n\nعدد الطلاب: ${students?.length || 0}`
          : `📊 To access statistics:\n• Go to "Academic Reports"\n• Filter students by major and level\n• View individual or group reports\n\nTotal students: ${students?.length || 0}`;
      } else {
        fallbackResponse = language === 'ar'
          ? `مرحباً ${userName}! 👋\n\nكمدير، يمكنك:\n• عرض إحصائيات النظام الكاملة\n• إدارة جميع الطلاب والمقررات\n• مراجعة طلبات التسجيل\n• إنشاء تقارير مفصلة\n\nكيف يمكنني مساعدتك؟`
          : `Hello ${userName}! 👋\n\nAs an admin, you can:\n• View complete system statistics\n• Manage all students and courses\n• Review registration requests\n• Create detailed reports\n\nHow can I help you?`;
      }
    }
    // ردود للمشرف
    else if (role === 'supervisor') {
      if (lowerMessage.includes('طلب') || lowerMessage.includes('request') || lowerMessage.includes('موافق')) {
        fallbackResponse = language === 'ar'
          ? `عدد طلبات التسجيل: ${requests?.length || 0}\n\n📋 لمراجعة الطلبات:\n• اذهب إلى "طلبات الطلاب"\n• راجع كل طلب بعناية\n• وافق أو ارفض حسب المتطلبات\n\nيمكنك الموافقة على الطلبات المطابقة للمتطلبات مباشرة.`
          : `Registration requests: ${requests?.length || 0}\n\n📋 To review requests:\n• Go to "Student Requests"\n• Review each request carefully\n• Approve or reject based on requirements\n\nYou can approve requests that meet the requirements directly.`;
      } else if (lowerMessage.includes('طلاب') || lowerMessage.includes('students') || lowerMessage.includes('تقرير')) {
        fallbackResponse = language === 'ar'
          ? `يمكنك مراجعة طلاب قسمك من خلال:\n• صفحة "طلبات الطلاب"\n• صفحة "التقارير الأكاديمية"\n\nعدد الطلبات الحالية: ${requests?.length || 0}`
          : `You can review your department students through:\n• "Student Requests" page\n• "Academic Reports" page\n\nCurrent requests: ${requests?.length || 0}`;
      } else {
        fallbackResponse = language === 'ar'
          ? `مرحباً ${userName}! 👋\n\nكمشرف أكاديمي، يمكنك:\n• مراجعة طلبات التسجيل (${requests?.length || 0} طلب)\n• الموافقة على الطلبات المناسبة\n• رفض الطلبات غير المطابقة\n• إنشاء تقارير للطلاب\n\nكيف يمكنني مساعدتك؟`
          : `Hello ${userName}! 👋\n\nAs a supervisor, you can:\n• Review registration requests (${requests?.length || 0} requests)\n• Approve suitable requests\n• Reject non-compliant requests\n• Create student reports\n\nHow can I help you?`;
      }
    }
    // ردود للطالب
    else {
      if (lowerMessage.includes('مقرر') || lowerMessage.includes('course') || lowerMessage.includes('تسجيل')) {
        const registeredCount = registrations?.filter((r: any) => r.status === 'approved')?.length || 0;
        const pendingCount = registrations?.filter((r: any) => r.status === 'pending')?.length || 0;
        
        fallbackResponse = language === 'ar'
          ? `📚 حالة التسجيل:\n• المقررات المعتمدة: ${registeredCount}\n• قيد الانتظار: ${pendingCount}\n• المستوى الحالي: ${userInfo?.level || 1}\n\nيمكنك تسجيل مقررات جديدة من صفحة "تسجيل المقررات".`
          : `📚 Registration status:\n• Approved courses: ${registeredCount}\n• Pending: ${pendingCount}\n• Current level: ${userInfo?.level || 1}\n\nYou can register new courses from the "Course Registration" page.`;
      } else if (lowerMessage.includes('معدل') || lowerMessage.includes('gpa') || lowerMessage.includes('ساعات')) {
        const approvedRegs = registrations?.filter((r: any) => r.status === 'approved') || [];
        const totalHours = approvedRegs.reduce((sum: number, r: any) => sum + (r.course?.credit_hours || 0), 0);
        
        fallbackResponse = language === 'ar'
          ? `📊 معلوماتك الأكاديمية:\n• المعدل التراكمي: ${userInfo?.gpa?.toFixed(2) || '0.00'}\n• الساعات المكتسبة: ${totalHours}\n• المستوى: ${userInfo?.level || 1}\n• التخصص: ${userInfo?.major || 'MIS'}\n\nالساعات المطلوبة للتخرج: 132 ساعة`
          : `📊 Your academic info:\n• GPA: ${userInfo?.gpa?.toFixed(2) || '0.00'}\n• Earned hours: ${totalHours}\n• Level: ${userInfo?.level || 1}\n• Major: ${userInfo?.major || 'MIS'}\n\nRequired hours for graduation: 132`;
      } else if (lowerMessage.includes('مساعد') || lowerMessage.includes('help') || lowerMessage.includes('ماذا')) {
        fallbackResponse = language === 'ar'
          ? `مرحباً ${userName}! 👋\n\nيمكنني مساعدتك في:\n• 📚 معرفة المقررات المتاحة\n• ✅ حالة التسجيلات\n• 📊 حساب المعدل والساعات\n• 📅 الجدول الدراسي\n• ⚠️ التحقق من التعارضات\n\nما الذي تريد معرفته؟`
          : `Hello ${userName}! 👋\n\nI can help you with:\n• 📚 Available courses\n• ✅ Registration status\n• 📊 GPA and credit hours\n• 📅 Class schedule\n• ⚠️ Conflict checking\n\nWhat would you like to know?`;
      } else {
        fallbackResponse = language === 'ar'
          ? `مرحباً ${userName}! 👋\n\n📚 المقررات المتاحة: ${courses?.length || 0}\n📝 المقررات المسجلة: ${registrations?.length || 0}\n📊 المعدل التراكمي: ${userInfo?.gpa?.toFixed(2) || '0.00'}\n🎓 المستوى: ${userInfo?.level || 1}\n\nيمكنك سؤالي عن المقررات، التسجيل، المعدل، أو أي شيء آخر!`
          : `Hello ${userName}! 👋\n\n📚 Available courses: ${courses?.length || 0}\n📝 Registered courses: ${registrations?.length || 0}\n📊 GPA: ${userInfo?.gpa?.toFixed(2) || '0.00'}\n🎓 Level: ${userInfo?.level || 1}\n\nYou can ask me about courses, registration, GPA, or anything else!`;
      }
    }

    console.log('✅ [AI Assistant] Fallback response sent');

    return c.json({
      success: true,
      response: fallbackResponse,
      type: 'fallback',
    });

  } catch (error: any) {
    console.error('❌ [AI Assistant] Error:', error);
    return c.json({
      success: false,
      response: language === 'ar'
        ? '😔 عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
        : '😔 Sorry, an error occurred. Please try again.',
      type: 'error',
    }, 500);
  }
});

// ========================================
// START SERVER
// ========================================

Deno.serve(app.fetch);