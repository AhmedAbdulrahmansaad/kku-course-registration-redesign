import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleAIAssistant } from './aiAssistant.tsx';

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

    console.log('📝 Signup attempt:', { studentId, email, role, level, major, gpa });

    // ✅ التحقق من عدم وجود المستخدم في جدول users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, auth_id')
      .or(`student_id.eq.${studentId},email.eq.${email}`)
      .maybeSingle();

    if (existingUser) {
      console.error('❌ User already exists in database:', existingUser);
      return c.json({ error: 'Student ID or email already exists' }, 400);
    }

    // ✅ التحقق من Auth - محاولة العثور على المستخدم اليتيم
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const orphanedAuthUser = authUsers?.users?.find(u => u.email === email);
    
    if (orphanedAuthUser) {
      // التحقق مما إذا كان يتيماً (موجود في Auth لكن ليس في users)
      const { data: linkedUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', orphanedAuthUser.id)
        .maybeSingle();
      
      if (!linkedUser) {
        console.log('🗑️ Found orphaned auth user, deleting:', orphanedAuthUser.id);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(orphanedAuthUser.id);
        
        if (deleteError) {
          console.error('❌ Failed to delete orphaned user:', deleteError);
          return c.json({ 
            error: 'This email has an orphaned account. Please contact admin to clean it up.',
            code: 'ORPHANED_ACCOUNT'
          }, 400);
        }
        
        console.log('✅ Orphaned user deleted successfully');
        // انتظار قليلاً للتأكد من اكتمال الحذف
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // محاولة إنشاء حساب في Supabase Auth
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
      
      if (authError.message?.includes('already been registered')) {
        return c.json({ 
          error: 'This email is already registered. Please use the cleanup tool or contact admin.',
          code: 'EMAIL_EXISTS'
        }, 400);
      }
      
      return c.json({ error: authError.message }, 400);
    }

    if (!authData?.user) {
      return c.json({ error: 'Failed to create auth user' }, 500);
    }

    console.log('✅ Auth user created:', authData.user.id);

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
      // حذف المستخدم من Auth إذا فشل إنشاء السجل في users
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: 'Failed to create user record: ' + userError.message }, 500);
    }

    console.log('✅ User record created:', userData.id);

    // ✅ إذا كان طالب، إنشاء سجل في جدول students
    if (role === 'student' || !role) {
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
        // حذف user و auth إذا فشل
        await supabase.from('users').delete().eq('id', userData.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return c.json({ error: 'Failed to create student record: ' + studentError.message }, 500);
      }

      console.log('✅ Student record created');
    }

    // ✅ إذا كان مشرف، إنشاء سجل في جدول supervisors
    if (role === 'supervisor') {
      const { error: supervisorError } = await supabase
        .from('supervisors')
        .insert({
          user_id: userData.id,
          department: 'Management Information Systems',
          specialization: major || 'Information Systems',
        });

      if (supervisorError) {
        console.error('❌ Supervisor creation error:', supervisorError);
        await supabase.from('users').delete().eq('id', userData.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return c.json({ error: 'Failed to create supervisor record: ' + supervisorError.message }, 500);
      }

      console.log('✅ Supervisor record created');
    }

    // ✅ إذا كان مدير، إنشاء سجل في جدول admins
    if (role === 'admin') {
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: userData.id,
          department: 'Management Information Systems',
        });

      if (adminError) {
        console.error('❌ Admin creation error:', adminError);
        await supabase.from('users').delete().eq('id', userData.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return c.json({ error: 'Failed to create admin record: ' + adminError.message }, 500);
      }

      console.log('✅ Admin record created');
    }

    console.log('✅✅✅ Signup completed successfully for:', studentId);

    return c.json({
      success: true,
      message: 'Account created successfully',
      user: userData,
    });

  } catch (error: any) {
    console.error('❌ Signup error:', error);
    return c.json({ error: 'Signup failed: ' + error.message }, 500);
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

// جلب بيانات المستخدم الحالي (من الـ token)
app.get('/make-server-1573e40a/auth/me', async (c) => {
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
    console.error('❌ Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// حفظ موافقة الاتفاقية
app.post('/make-server-1573e40a/auth/agreement', async (c) => {
  try {
    const { accepted } = await c.req.json();
    const user = await getUserFromToken(c.req.header('Authorization'));
    
    if (!user) {
      // إذا لم يكن هناك مستخدم مسجل دخول، نحفظ في localStorage فقط
      console.log('ℹ️ No authenticated user, saving agreement locally only');
      return c.json({
        success: true,
        message: 'Agreement saved locally',
      });
    }

    console.log('📋 Saving agreement for user:', user.id, 'Accepted:', accepted);

    // تحديث حالة الموافقة في قاعدة البيانات
    const { error } = await supabase
      .from('users')
      .update({
        agreement_accepted: accepted,
        agreement_accepted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('❌ Agreement save error:', error);
      // نرجع نجاح حتى لو فشل الحفظ في DB (محفوظ في localStorage)
      return c.json({
        success: true,
        message: 'Agreement saved locally (DB save failed)',
      });
    }

    console.log('✅ Agreement saved successfully');

    return c.json({
      success: true,
      message: 'Agreement saved successfully',
    });

  } catch (error: any) {
    console.error('❌ Agreement error:', error);
    // نرجع نجاح حتى لو حدث خطأ (محفوظ في localStorage)
    return c.json({
      success: true,
      message: 'Agreement saved locally',
    });
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

// ========================================
// STUDENT ENDPOINTS
// ========================================

// جلب تسجيلات الطالب في المقررات
app.get('/make-server-1573e40a/student/registrations', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('📚 [Registrations] Fetching for user:', user.id);

    // جلب التسجيلات من قاعدة البيانات
    // ملاحظة: جدول enrollments قد لا يكون موجوداً بعد
    // لذلك سنرجع array فارغ مؤقتاً
    const registrations: any[] = [];

    console.log('✅ [Registrations] Found:', registrations.length);

    return c.json({
      success: true,
      registrations,
      count: registrations.length,
    });

  } catch (error: any) {
    console.error('❌ [Registrations] Error:', error);
    return c.json({ error: 'Failed to fetch registrations' }, 500);
  }
});

// جلب إحصائيات الطالب
app.get('/make-server-1573e40a/dashboard/student/:studentId', async (c) => {
  try {
    const studentId = c.req.param('studentId');
    
    console.log('📊 [Dashboard Stats] Fetching for student:', studentId);

    const user = await getUserFromToken(c.req.header('Authorization'));
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // جلب بيانات الطالب
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // حساب الإحصائيات
    const stats = {
      total_credits: studentData?.total_credits || 0,
      completed_credits: studentData?.completed_credits || 0,
      gpa: studentData?.gpa || 0,
      level: studentData?.level || 1,
      status: studentData?.status || 'active',
      enrollment_year: studentData?.enrollment_year || new Date().getFullYear(),
    };

    console.log('✅ [Dashboard Stats] Stats:', stats);

    return c.json({
      success: true,
      stats,
    });

  } catch (error: any) {
    console.error('❌ [Dashboard Stats] Error:', error);
    return c.json({ error: 'Failed to fetch statistics' }, 500);
  }
});

// ========================================
// ADMIN ENDPOINTS - CLEANUP TOOLS
// ========================================

// 🧹 تنظيف المستخدمين اليتامى (Admin فقط)
app.post('/make-server-1573e40a/admin/cleanup-orphaned-users', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    console.log('🧹 [Cleanup] Starting orphaned users cleanup...');

    // 1. جلب جميع المستخدمين من Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ [Cleanup] Failed to list auth users:', authError);
      return c.json({ error: 'Failed to list auth users' }, 500);
    }

    console.log(`ℹ️ [Cleanup] Found ${authUsers?.users?.length || 0} users in Auth`);

    // 2. جلب جميع المستخدمين من قاعدة البيانات
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('auth_id, email, student_id');
    
    if (dbError) {
      console.error('❌ [Cleanup] Failed to list DB users:', dbError);
      return c.json({ error: 'Failed to list database users' }, 500);
    }

    console.log(`ℹ️ [Cleanup] Found ${dbUsers?.length || 0} users in Database`);

    // 3. تحديد المستخدمين اليتامى
    const dbAuthIds = new Set(dbUsers?.map(u => u.auth_id) || []);
    const orphanedUsers = authUsers?.users?.filter(authUser => !dbAuthIds.has(authUser.id)) || [];

    console.log(`🔍 [Cleanup] Found ${orphanedUsers.length} orphaned users`);

    if (orphanedUsers.length === 0) {
      return c.json({
        success: true,
        message: 'No orphaned users found',
        cleaned: 0,
        orphanedUsers: [],
      });
    }

    // 4. حذف المستخدمين اليتامى
    const cleanupResults = [];
    let successCount = 0;
    let failCount = 0;

    for (const orphan of orphanedUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(orphan.id);
        
        if (deleteError) {
          console.error(`❌ [Cleanup] Failed to delete ${orphan.email}:`, deleteError);
          cleanupResults.push({
            email: orphan.email,
            id: orphan.id,
            status: 'failed',
            error: deleteError.message,
          });
          failCount++;
        } else {
          console.log(`✅ [Cleanup] Deleted ${orphan.email}`);
          cleanupResults.push({
            email: orphan.email,
            id: orphan.id,
            status: 'deleted',
          });
          successCount++;
        }
      } catch (err: any) {
        console.error(`❌ [Cleanup] Exception deleting ${orphan.email}:`, err);
        cleanupResults.push({
          email: orphan.email,
          id: orphan.id,
          status: 'failed',
          error: err.message,
        });
        failCount++;
      }
    }

    console.log(`✅ [Cleanup] Cleanup complete - Success: ${successCount}, Failed: ${failCount}`);

    return c.json({
      success: true,
      message: `Cleaned up ${successCount} orphaned users`,
      cleaned: successCount,
      failed: failCount,
      results: cleanupResults,
    });

  } catch (error: any) {
    console.error('❌ [Cleanup] Error:', error);
    return c.json({ error: 'Cleanup failed: ' + error.message }, 500);
  }
});

// 🔍 عرض المستخدمين اليتامى بدون حذف (Admin فقط)
app.get('/make-server-1573e40a/admin/list-orphaned-users', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    console.log('🔍 [List Orphans] Checking for orphaned users...');

    // جلب المستخدمين من Auth والـ DB
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const { data: dbUsers } = await supabase
      .from('users')
      .select('auth_id, email, student_id');

    const dbAuthIds = new Set(dbUsers?.map(u => u.auth_id) || []);
    const orphanedUsers = authUsers?.users?.filter(authUser => !dbAuthIds.has(authUser.id)) || [];

    console.log(`🔍 [List Orphans] Found ${orphanedUsers.length} orphaned users`);

    return c.json({
      success: true,
      count: orphanedUsers.length,
      orphanedUsers: orphanedUsers.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      })),
    });

  } catch (error: any) {
    console.error('❌ [List Orphans] Error:', error);
    return c.json({ error: 'Failed to list orphaned users' }, 500);
  }
});

// ========================================
// AI ASSISTANT ENDPOINT
// ========================================

app.post('/make-server-1573e40a/ai-assistant', handleAIAssistant);

// ========================================
// START SERVER
// ========================================

Deno.serve(app.fetch);