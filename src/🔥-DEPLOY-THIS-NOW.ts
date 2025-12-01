// 🔥 نسخ هذا الملف كاملاً ولصقه في Supabase Edge Function
// اسم Function: make-server-1573e40a

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/make-server-1573e40a', '')

  console.log('📍 Request:', req.method, path)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ========================================
    // HEALTH CHECK
    // ========================================
    if (path === '/health') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          message: 'KKU Course Registration System - Connected to PostgreSQL',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // SIGNUP
    // ========================================
    if (path === '/auth/signup' && req.method === 'POST') {
      const body = await req.json()
      const { studentId, email, password, name, phone, role, level, major, gpa } = body

      console.log('📝 Signup:', email)

      // التحقق من عدم وجود المستخدم
      const { data: existing } = await supabase
        .from('users')
        .select('student_id')
        .or(`student_id.eq.${studentId},email.eq.${email}`)
        .maybeSingle()

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'الرقم الجامعي أو البريد الإلكتروني مسجل مسبقاً' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // إنشاء حساب في Auth
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

      // جلب department_id
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', 'MIS')
        .single()

      // إدراج في جدول users
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

      // إدراج في جدول students
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

      console.log('🔐 Login:', identifier)

      let email = identifier

      // إذا كان رقم جامعي، نحصل على الإيميل
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

      // تسجيل دخول
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return new Response(
          JSON.stringify({ error: 'بيانات الدخول غير صحيحة' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // جلب بيانات المستخدم
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

      console.log(`✅ Found ${data.length} courses`)

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

      // جلب مستوى الطالب
      const { data: user } = await supabase
        .from('users')
        .select(`*, students(*)`)
        .eq('id', parseInt(studentId))
        .single()

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Student not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const studentLevel = user.students?.[0]?.level || 1

      // جلب المقررات
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('active', true)
        .lte('level', studentLevel)
        .order('level')
        .order('code')

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const formatted = courses.map(c => ({
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
      }))

      console.log(`✅ Found ${formatted.length} available courses for level ${studentLevel}`)

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
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: authUser } = await supabase.auth.getUser(token)

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

      console.log('📝 Register course:', user.id, courseId)

      // التحقق من التسجيل المكرر
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

      // إنشاء التسجيل
      const { data: enrollment, error } = await supabase
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

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Registration success:', enrollment.id)

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
    // NOT FOUND
    // ========================================
    return new Response(
      JSON.stringify({ error: 'Endpoint not found', path }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
