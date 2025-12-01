// 🚀 Edge Function - نسخة مبسطة للنشر السريع
// انسخ هذا الملف كاملاً والصقه في Supabase Dashboard

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
    message: 'KKU Course Registration System - Working!',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// SIGNUP
// ========================================
app.post('/make-server-1573e40a/auth/signup', async (c) => {
  try {
    const { studentId, email, password, name, phone, role, level, major, gpa } = await c.req.json();

    console.log('📝 Signup request:', { studentId, email, role, level, major });

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`student_id.eq.${studentId},email.eq.${email}`)
      .maybeSingle();

    if (existingUser) {
      return c.json({ error: 'Student ID or email already exists' }, 400);
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { student_id: studentId, name },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Create user in database
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
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error('User error:', userError);
      return c.json({ error: userError.message }, 500);
    }

    // Create student record if role is student
    if (role === 'student' || !role) {
      if (!level || !major) {
        await supabase.from('users').delete().eq('id', userData.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return c.json({ error: 'Major and level are required for students' }, 400);
      }

      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: userData.id,
          level: parseInt(level),
          gpa: gpa ? parseFloat(gpa) : 0.0,
          total_credits: 0,
          completed_credits: 0,
          major: major,
          status: 'active',
          enrollment_year: new Date().getFullYear(),
        });

      if (studentError) {
        await supabase.from('users').delete().eq('id', userData.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error('Student error:', studentError);
        return c.json({ error: studentError.message }, 500);
      }
    }

    // Create supervisor record if role is supervisor
    if (role === 'supervisor') {
      const { error: supervisorError } = await supabase
        .from('supervisors')
        .insert({
          user_id: userData.id,
          department: 'Management Information Systems',
          specialization: major || 'Information Systems',
        });

      if (supervisorError) {
        await supabase.from('users').delete().eq('id', userData.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.error('Supervisor error:', supervisorError);
        return c.json({ error: supervisorError.message }, 500);
      }
    }

    console.log('✅ Signup successful:', userData.id);

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

// ========================================
// LOGIN
// ========================================
app.post('/make-server-1573e40a/auth/login', async (c) => {
  try {
    const { identifier, password } = await c.req.json();
    
    console.log('🔐 Login attempt:', identifier);

    let email = identifier;
    
    // If identifier is student ID, get email from database
    if (!identifier.includes('@')) {
      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('student_id', identifier)
        .maybeSingle();
      
      if (error || !user) {
        return c.json({ error: 'Student ID not found' }, 401);
      }
      
      email = user.email;
    }

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Get user data from database
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
      return c.json({ error: 'User not found' }, 404);
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

// ========================================
// GET COURSES
// ========================================
app.get('/make-server-1573e40a/courses', async (c) => {
  try {
    const level = c.req.query('level');

    let query = supabase
      .from('courses')
      .select('*')
      .eq('active', true);

    if (level) {
      query = query.eq('level', parseInt(level));
    }

    const { data, error } = await query.order('level').order('code');

    if (error) {
      console.error('❌ Error fetching courses:', error);
      return c.json({ error: 'Failed to fetch courses' }, 500);
    }

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

// Start server
Deno.serve(app.fetch);
