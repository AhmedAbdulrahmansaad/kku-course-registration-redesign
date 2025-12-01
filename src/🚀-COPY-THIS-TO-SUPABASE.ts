// 🚀 انسخ هذا الكود كاملاً والصقه في Supabase Edge Function
// اسم Function في Supabase يجب أن يكون: server

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  let path = url.pathname
  
  // Remove /make-server-1573e40a prefix if exists
  path = path.replace('/make-server-1573e40a', '')

  console.log('📍 Request:', req.method, path)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // ========================================
    // HEALTH CHECK
    // ========================================
    if (path === '/health') {
      console.log('✅ Health check')
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          message: 'KKU Course Registration System - Connected to PostgreSQL',
          timestamp: new Date().toISOString(),
          env: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // SIGNUP
    // ========================================
    if (path === '/auth/signup' && req.method === 'POST') {
      const body = await req.json()
      console.log('📝 Signup request:', body.email)

      const { studentId, email, password, name, phone, role, level, major, gpa } = body

      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('student_id')
        .or(`student_id.eq.${studentId},email.eq.${email}`)
        .maybeSingle()

      if (existing) {
        console.log('❌ User already exists')
        return new Response(
          JSON.stringify({ error: 'الرقم الجامعي أو البريد الإلكتروني مسجل مسبقاً' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (authError) {
        console.error('❌ Auth error:', authError)
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get department
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', 'MIS')
        .single()

      // Insert user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          student_id: studentId,
          email: email,
          name: name,
          phone: phone || '',
          role: role || 'student',
          department_id: dept?.id || 1,
        })
        .select()
        .single()

      if (userError) {
        console.error('❌ User insert error:', userError)
        await supabase.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({ error: userError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Insert student
      if (role === 'student') {
        await supabase.from('students').insert({
          user_id: newUser.id,
          level: parseInt(level) || 1,
          major: major || 'MIS',
          gpa: parseFloat(gpa) || 0.0,
        })
      }

      console.log('✅ Signup success:', newUser.student_id)

      return new Response(
        JSON.stringify({
          success: true,
          user: newUser,
          message: 'تم إنشاء الحساب بنجاح'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // LOGIN
    // ========================================
    if (path === '/auth/login' && req.method === 'POST') {
      const { identifier, password } = await req.json()
      console.log('🔐 Login attempt:', identifier)

      let email = identifier

      // If student ID, get email
      if (!identifier.includes('@')) {
        const { data: user } = await supabase
          .from('users')
          .select('email')
          .eq('student_id', identifier)
          .maybeSingle()

        if (!user) {
          return new Response(
            JSON.stringify({ error: 'الرقم الجامعي غير موجود' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        email = user.email
      }

      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Login error:', error)
        return new Response(
          JSON.stringify({ error: 'بيانات الدخول غير صحيحة' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select(`*, students(*), supervisors(*)`)
        .eq('auth_id', data.user.id)
        .maybeSingle()

      console.log('✅ Login success:', userData?.student_id)

      return new Response(
        JSON.stringify({
          success: true,
          user: userData,
          session: data.session,
          access_token: data.session.access_token,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // GET COURSES
    // ========================================
    if (path === '/courses' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('active', true)
        .order('level')
        .order('code')

      if (error) {
        console.error('❌ Courses error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`✅ Courses found: ${data.length}`)

      return new Response(
        JSON.stringify({ success: true, courses: data, count: data.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // GET AVAILABLE COURSES
    // ========================================
    if (path === '/courses/available' && req.method === 'GET') {
      const studentId = url.searchParams.get('studentId')

      if (!studentId) {
        return new Response(
          JSON.stringify({ error: 'Student ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get student level
      const { data: user } = await supabase
        .from('users')
        .select(`*, students(*)`)
        .eq('id', parseInt(studentId))
        .single()

      const studentLevel = user?.students?.[0]?.level || 1

      // Get courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('active', true)
        .lte('level', studentLevel)
        .order('level')
        .order('code')

      const formatted = courses?.map(c => ({
        course_id: c.id.toString(),
        id: c.id,
        code: c.code,
        name_ar: c.name_ar,
        name_en: c.name_en,
        credit_hours: c.credits,
        credits: c.credits,
        level: c.level,
        department: 'MIS',
        description_ar: c.description_ar,
        description_en: c.description_en,
        prerequisites: c.prerequisite_codes || [],
      })) || []

      return new Response(
        JSON.stringify({ success: true, courses: formatted, count: formatted.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // REGISTER COURSE
    // ========================================
    if (path === '/register-course' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      const { data: authUser } = await supabase.auth.getUser(token || '')

      if (!authUser.user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.user.id)
        .single()

      const { courseId, semester, year } = await req.json()

      // Check duplicate
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'أنت مسجل بالفعل في هذا المقرر' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          semester: semester || 'Fall 2024',
          year: year || 2024,
          status: 'pending',
          registered_at: new Date().toISOString(),
        })
        .select()
        .single()

      return new Response(
        JSON.stringify({
          success: true,
          message: 'تم التسجيل بنجاح. في انتظار موافقة المشرف',
          enrollment
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // ADMIN DASHBOARD STATS
    // ========================================
    if (path === '/dashboard/admin' && req.method === 'GET') {
      console.log('📊 Admin dashboard stats request')

      // Count total students
      const { count: totalStudents } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

      // Count total courses
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      // Count pending requests
      const { count: pendingRequests } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Count approved requests
      const { count: approvedRequests } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      // Count supervisors
      const { count: totalSupervisors } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'supervisor')

      // Count admins
      const { count: totalAdmins } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      const stats = {
        totalStudents: totalStudents || 0,
        totalCourses: totalCourses || 49,
        pendingRequests: pendingRequests || 0,
        approvedRequests: approvedRequests || 0,
        totalSupervisors: totalSupervisors || 0,
        totalAdmins: totalAdmins || 0,
      }

      console.log('✅ Admin stats:', stats)

      return new Response(
        JSON.stringify({ success: true, stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Not found
    return new Response(
      JSON.stringify({ error: 'Endpoint not found', path }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Server error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})