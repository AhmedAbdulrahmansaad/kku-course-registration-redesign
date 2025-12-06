import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleAIAssistant } from './aiAssistant.ts';
import * as kv from './kv_store.ts';

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
      supervisors(*)
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
// PUBLIC CLEANUP ENDPOINT (للمستخدمين الذين يواجهون مشكلة)
// ========================================

// 🧹 تنظيف مستخدم يتيم محدد بالبريد الإلكتروني (عام - بدون مصادقة)
app.post('/make-server-1573e40a/public/cleanup-orphaned-user', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    console.log('🧹 [Public Cleanup] Attempting to clean orphaned user:', email);

    // 1. التحقق مما إذا كان المستخدم موجود في Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === email);
    
    if (!authUser) {
      console.log('ℹ️ [Public Cleanup] User not found in Auth');
      return c.json({
        success: true,
        message: 'User not found in Auth - nothing to clean',
        cleaned: false,
      });
    }

    // 2. التحقق مما إذا كان المستخدم موجود في DB
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', authUser.id)
      .maybeSingle();
    
    if (dbUser) {
      console.log('ℹ️ [Public Cleanup] User is not orphaned - exists in both Auth and DB');
      return c.json({
        success: true,
        message: 'User is not orphaned - account is complete',
        cleaned: false,
      });
    }

    // 3. المستخدم يتيم - حذفه من Auth
    console.log('🗑️ [Public Cleanup] Deleting orphaned user from Auth:', authUser.id);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
    
    if (deleteError) {
      console.error('❌ [Public Cleanup] Failed to delete user:', deleteError);
      return c.json({ 
        error: 'Failed to delete orphaned user',
        details: deleteError.message 
      }, 500);
    }

    console.log('✅ [Public Cleanup] Successfully deleted orphaned user');
    
    return c.json({
      success: true,
      message: 'Orphaned user cleaned successfully. You can now register again.',
      cleaned: true,
    });

  } catch (error: any) {
    console.error('❌ [Public Cleanup] Error:', error);
    return c.json({ error: 'Cleanup failed: ' + error.message }, 500);
  }
});

// 🧹 تنظيف جميع المستخدمين اليتامى (عام - للطوارئ)
app.post('/make-server-1573e40a/public/cleanup-all-orphaned-users', async (c) => {
  try {
    console.log('🧹 [Public Cleanup All] Starting cleanup of all orphaned users...');

    // 1. جلب جميع المستخدمين من Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ [Public Cleanup All] Failed to list auth users:', authError);
      return c.json({ error: 'Failed to list auth users' }, 500);
    }

    console.log(`ℹ️ [Public Cleanup All] Found ${authUsers?.users?.length || 0} users in Auth`);

    // 2. جلب جميع المستخدمين من قاعدة البيانات
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('auth_id, email, student_id');
    
    if (dbError) {
      console.error('❌ [Public Cleanup All] Failed to list DB users:', dbError);
      return c.json({ error: 'Failed to list database users' }, 500);
    }

    console.log(`ℹ️ [Public Cleanup All] Found ${dbUsers?.length || 0} users in Database`);

    // 3. تحديد المستخدمين اليتامى
    const dbAuthIds = new Set(dbUsers?.map(u => u.auth_id) || []);
    const orphanedUsers = authUsers?.users?.filter(authUser => !dbAuthIds.has(authUser.id)) || [];

    console.log(`🔍 [Public Cleanup All] Found ${orphanedUsers.length} orphaned users`);

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
          console.error(`❌ [Public Cleanup All] Failed to delete ${orphan.email}:`, deleteError);
          cleanupResults.push({
            email: orphan.email,
            status: 'failed',
            error: deleteError.message,
          });
          failCount++;
        } else {
          console.log(`✅ [Public Cleanup All] Deleted ${orphan.email}`);
          cleanupResults.push({
            email: orphan.email,
            status: 'deleted',
          });
          successCount++;
        }
        
        // انتظار قليل بين كل عملية حذف
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        console.error(`❌ [Public Cleanup All] Exception deleting ${orphan.email}:`, err);
        failCount++;
      }
    }

    console.log(`✅ [Public Cleanup All] Cleanup complete - Success: ${successCount}, Failed: ${failCount}`);

    return c.json({
      success: true,
      message: `Cleaned up ${successCount} orphaned users`,
      cleaned: successCount,
      failed: failCount,
      results: cleanupResults,
    });

  } catch (error: any) {
    console.error('❌ [Public Cleanup All] Error:', error);
    return c.json({ error: 'Cleanup failed: ' + error.message }, 500);
  }
});

// ========================================
// AUTHENTICATION ENDPOINTS
// ========================================

// تسجيل دخول
app.post('/make-server-1573e40a/auth/login', async (c) => {
  try {
    const { identifier, password, language } = await c.req.json();
    
    console.log('🔐 Login attempt:', identifier);

    // محاولة تسجيل الدخول باستخدام Supabase Auth
    let email = identifier;
    
    // إذا كان الـ identifier رقم جامعي/وظيفي، نحصل على الإيميل من قاعدة البيانات
    if (!identifier.includes('@')) {
      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('student_id', identifier)
        .maybeSingle();
      
      if (error || !user) {
        console.error('❌ Student ID not found:', identifier);
        return c.json({ 
          error: 'الرقم الجامعي غير موجود. يرجى التحقق من الرقم أو التسجيل أولاً',
          error_en: 'Student ID not found. Please check the ID or register first',
          code: 'STUDENT_ID_NOT_FOUND'
        }, 401);
      }
      
      email = user.email;
      console.log('✅ Found user email for student ID:', identifier);
    }

    // تسجيل الدخول
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error);
      
      // رسالة خطأ واضحة مع نصيحة
      return c.json({ 
        error: '❌ بيانات الدخول غير صحيحة',
        error_en: '❌ Invalid login credentials',
        hint: language === 'ar' 
          ? '💡 تأكد من:\n✓ البريد الإلكتروني صحيح\n✓ كلمة المرور صحيحة\n✓ أنك سجلت حساباً من قبل\n\n📌 إذا لم تسجل بعد، اضغط على "إنشاء حساب جديد"'
          : '💡 Make sure:\n✓ Email is correct\n✓ Password is correct\n✓ You have registered before\n\n📌 If not registered yet, click "Create New Account"',
        hint_en: '💡 Make sure:\n✓ Email is correct\n✓ Password is correct\n✓ You have registered before\n\n📌 If not registered yet, click "Create New Account"',
        code: 'INVALID_CREDENTIALS'
      }, 401);
    }

    // الحصول على معلومات المستخدم من قاعدة البيانات
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        students(*),
        supervisors(*)
      `)
      .eq('auth_id', data.user.id)
      .maybeSingle();

    if (userError || !userData) {
      console.error('❌ User data error:', userError);
      console.log('⚠️ Orphaned user detected - exists in Auth but not in users table');
      
      // مستخدم يتيم - موجود في Auth لكن ليس في جدول users
      // نحذفه من Auth ليتمكن من التسجيل من جديد
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('🗑️ Orphaned user deleted from Auth');
      } catch (deleteError) {
        console.error('❌ Failed to delete orphaned user:', deleteError);
      }
      
      return c.json({ 
        error: 'حسابك غير مكتمل. يرجى:\n1. التسجيل من جديد\n2. أو التواصل مع الإدارة',
        error_en: 'Your account is incomplete. Please:\n1. Register again\n2. Or contact admin',
        code: 'ORPHANED_ACCOUNT'
      }, 404);
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
    const bodyData = await c.req.json();
    const { studentId, email, password, name, phone, role, level, major, gpa } = bodyData;

    console.log('📝 [Signup] Full request body received:', bodyData);
    console.log('📝 [Signup] Parsed values:', { studentId, email, role, level, major, gpa, levelType: typeof level, majorType: typeof major });

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

    // ✅ محاولة إنشاء حساب في Supabase Auth مع retry logic صحيح
    let finalAuthData;
    
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
      
      if (authError.message?.includes('already been registered') || authError.code === 'email_exists') {
        // محاولة أخيرة لحذف المستخدم اليتيم
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const existingAuthUser = authUsers?.users?.find(u => u.email === email);
          
          if (existingAuthUser) {
            console.log('🗑️ Attempting final cleanup of orphaned user:', existingAuthUser.id);
            await supabase.auth.admin.deleteUser(existingAuthUser.id);
            
            // انتظار 2 ثانية ثم المحاولة مرة أخرى
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // محاولة ثانية لإنشاء المستخدم
            const { data: retryAuthData, error: retryAuthError } = await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { student_id: studentId, name },
            });
            
            if (!retryAuthError && retryAuthData?.user) {
              console.log('✅ User created successfully on retry');
              // ✅ نحفظ البيانات ونستمر - لا نعود!
              finalAuthData = retryAuthData;
            } else {
              throw new Error('Retry failed after cleanup');
            }
          } else {
            throw new Error('Orphaned user not found for cleanup');
          }
        } catch (cleanupError) {
          console.error('❌ Cleanup attempt failed:', cleanupError);
          // ⚠️ فقط إذا فشل الـ cleanup وليس لدينا finalAuthData نرجع error
          if (!finalAuthData) {
            return c.json({ 
              error: 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى:\n1. استخدام بريد آخر\n2. أو الذهاب لصفحة "أدوات النظام" لحذف الحساب القديم\n3. أو التواصل مع الإدارة',
              error_en: 'This email is already registered. Please:\n1. Use a different email\n2. Or go to "System Tools" page to delete old account\n3. Or contact admin',
              code: 'EMAIL_EXISTS'
            }, 400);
          }
        }
      }
      
      // ⚠️ فقط إذا لم نحصل على finalAuthData نرجع error
      if (!finalAuthData) {
        return c.json({ error: authError.message }, 400);
      }
    } else {
      // ✅ نجحت المحاولة الأولى
      finalAuthData = authData;
    }

    if (!finalAuthData?.user) {
      return c.json({ error: 'Failed to create auth user' }, 500);
    }

    console.log('✅ [Signup] Auth user created successfully:', finalAuthData.user.id);

    // إنشاء سجل في جدول users
    const userInsertData = {
      auth_id: finalAuthData.user.id,
      student_id: studentId,
      email,
      name,
      phone,
      role: role || 'student',
      active: true,
    };
    
    console.log('📊 [Signup] Inserting into users table:', userInsertData);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(userInsertData)
      .select()
      .single();

    if (userError) {
      console.error('❌ User creation error:', userError);
      // حذف المستخدم من Auth إذا فشل إنشاء السجل في users
      await supabase.auth.admin.deleteUser(finalAuthData.user.id);
      return c.json({ error: 'Failed to create user record: ' + userError.message }, 500);
    }

    console.log('✅ [Signup] User record created in DB:', { userId: userData.id, authId: userData.auth_id, role: userData.role });

    // ✅ إذا كان طالب، إنشاء سجل في جدول students
    if (role === 'student' || !role) {
      console.log('🎓 [Signup] Creating student record...');
      
      // ✅ التحقق من أن البيانات الإلزامية موجودة للطلاب
      if (!level || !major) {
        console.error('❌ [Signup] Missing required student data:', { level, major, levelType: typeof level, majorType: typeof major });
        // حذف المستخدم من Auth و users إذا كانت البيانات ناقصة
        await supabase.from('users').delete().eq('id', userData.id);
        await supabase.auth.admin.deleteUser(finalAuthData.user.id);
        return c.json({ 
          error: 'بيانات الطالب غير مكتملة. يرجى التأكد من اختيار التخصص والمستوى الدراسي',
          error_en: 'Student data incomplete. Please ensure major and level are selected',
          code: 'MISSING_STUDENT_DATA'
        }, 400);
      }

      const studentInsertData = {
        user_id: userData.id,
        level: parseInt(level), // ✅ التحويل إلى رقم صريح
        gpa: gpa ? parseFloat(gpa) : 0.0,
        total_credits: 0,
        completed_credits: 0,
        major: major, // ✅ استخدام القيمة المرسلة بدون fallback
        status: 'active',
        enrollment_year: new Date().getFullYear(),
      };
      
      console.log('📊 [Signup] Inserting into students table:', studentInsertData);
      
      const { error: studentError } = await supabase
        .from('students')
        .insert(studentInsertData);

      if (studentError) {
        console.error('❌ [Signup] Student creation error:', studentError, studentError.details);
        // حذف user و auth إذا فشل
        await supabase.from('users').delete().eq('id', userData.id);
        await supabase.auth.admin.deleteUser(finalAuthData.user.id);
        return c.json({ error: 'Failed to create student record: ' + studentError.message }, 500);
      }

      console.log('✅ [Signup] Student record created successfully in DB with data:', { userId: userData.id, level, major, gpa });
    }

    // ✅ إذا كان مشرف، إنشاء سجل في جدول supervisors
    if (role === 'supervisor') {
      console.log('👨‍🏫 [Signup] Creating supervisor record...');
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
        await supabase.auth.admin.deleteUser(finalAuthData.user.id);
        return c.json({ error: 'Failed to create supervisor record: ' + supervisorError.message }, 500);
      }

      console.log('✅ [Signup] Supervisor record created successfully');
    }

    // ✅ المدير لا يحتاج جدول منفصل - كل البيانات في جدول users
    if (role === 'admin') {
      console.log('✅ [Signup] Admin user created (no separate table needed)');
    }

    console.log('✅✅✅ [Signup] SIGNUP COMPLETED SUCCESSFULLY!');
    console.log('📊 [Signup] Final Summary:', {
      authId: finalAuthData.user.id,
      userId: userData.id,
      studentId: studentId,
      email: email,
      name: name,
      role: role || 'student',
      level: level,
      major: major,
      gpa: gpa,
    });

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
        supervisors(*)
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

// حفظ بيانات الاتفاقية (للضيوف قبل التسجيل)
app.post('/make-server-1573e40a/agreements', async (c) => {
  try {
    const { fullName, ipAddress, userAgent, timestamp, language } = await c.req.json();
    
    console.log('📋 Saving guest agreement:', { fullName, ipAddress, language });

    // حفظ في KV Store
    const agreementKey = `agreement_${Date.now()}_${fullName.replace(/\s+/g, '_')}`;
    const agreementData = {
      fullName,
      ipAddress,
      userAgent,
      timestamp,
      language,
      acceptedAt: new Date().toISOString(),
    };

    try {
      await kv.set(agreementKey, agreementData);
      console.log('✅ Agreement saved to KV store');
    } catch (kvError) {
      console.error('⚠️ Failed to save to KV store:', kvError);
      // نستمر حتى لو فشل الحفظ - الاتفاقية محفوظة في Frontend
    }

    return c.json({
      success: true,
      message: 'Agreement accepted successfully',
    });

  } catch (error: any) {
    console.error('❌ Agreement save error:', error);
    // نرجع success حتى لو فشل - الاتفاقية محفوظة في Frontend
    return c.json({
      success: true,
      message: 'Agreement accepted (saved locally)',
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