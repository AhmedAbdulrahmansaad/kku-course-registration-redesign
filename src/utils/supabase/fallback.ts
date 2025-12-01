/**
 * Supabase Fallback Utility
 * 
 * هذه الدالة توفر fallback تلقائي لجميع عمليات Supabase
 * إذا فشلت أي عملية، يتم استخدام localStorage تلقائياً
 */

import { supabase } from './client';

/**
 * تنفيذ عملية مع fallback تلقائي
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: () => T,
  operationName: string = 'Operation'
): Promise<T> {
  try {
    console.log(`🔄 [${operationName}] Attempting Supabase...`);
    const result = await operation();
    console.log(`✅ [${operationName}] Supabase succeeded`);
    return result;
  } catch (error: any) {
    console.warn(`⚠️ [${operationName}] Supabase failed, using fallback:`, error.message);
    const fallbackResult = fallback();
    console.log(`✅ [${operationName}] Fallback succeeded`);
    return fallbackResult;
  }
}

/**
 * محاولة تسجيل الدخول مع fallback
 */
export async function loginWithFallback(email: string, password: string) {
  return withFallback(
    async () => {
      // Try with student ID
      let loginEmail = email;
      if (!email.includes('@')) {
        const { data } = await supabase
          .from('users')
          .select('email')
          .eq('student_id', email)
          .maybeSingle();
        
        if (!data) throw new Error('Student ID not found');
        loginEmail = data.email;
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;

      const { data: userData } = await supabase
        .from('users')
        .select(`*, students(*), supervisors(*)`)
        .eq('auth_id', authData.user.id)
        .maybeSingle();

      return {
        success: true,
        user: userData,
        access_token: authData.session.access_token,
        source: 'supabase' as const,
      };
    },
    () => {
      // Fallback to localStorage
      const localUsers = JSON.parse(localStorage.getItem('kku_users') || '[]');
      const user = localUsers.find(
        (u: any) => (u.email === email || u.studentId === email) && u.password === password
      );

      if (!user) {
        throw new Error('Invalid credentials');
      }

      return {
        success: true,
        user: {
          id: user.id,
          student_id: user.studentId,
          email: user.email,
          name: user.name,
          role: user.role,
          students: user.role === 'student' ? [{
            major: user.major,
            level: user.level,
            gpa: user.gpa,
          }] : [],
        },
        access_token: `local_token_${Date.now()}`,
        source: 'localStorage' as const,
      };
    },
    'Login'
  );
}

/**
 * محاولة التسجيل مع fallback
 */
export async function signupWithFallback(formData: any) {
  return withFallback(
    async () => {
      // Check if exists
      const { data: existing } = await supabase
        .from('users')
        .select('student_id, email')
        .or(`student_id.eq.${formData.studentId},email.eq.${formData.email}`)
        .maybeSingle();

      if (existing) {
        throw new Error('User already exists');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError || !authData.user) throw authError || new Error('No user returned');

      // Get department
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', 'MIS')
        .maybeSingle();

      // Insert user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          student_id: formData.studentId,
          email: formData.email,
          name: formData.fullName,
          phone: formData.phone || '',
          role: formData.role || 'student',
          department_id: dept?.id || 1,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Insert student data
      if (formData.role === 'student') {
        await supabase.from('students').insert({
          user_id: newUser.id,
          level: formData.level ? parseInt(formData.level) : 1,
          major: formData.major || 'MIS',
          gpa: formData.gpa ? parseFloat(formData.gpa) : 0.0,
        });
      }

      return { success: true, source: 'supabase' as const };
    },
    () => {
      // Fallback to localStorage
      const localUsers = JSON.parse(localStorage.getItem('kku_users') || '[]');

      const existingUser = localUsers.find(
        (u: any) => u.email === formData.email || u.studentId === formData.studentId
      );

      if (existingUser) {
        throw new Error('User already exists');
      }

      const newUser = {
        id: Date.now(),
        studentId: formData.studentId,
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        phone: formData.phone || '',
        role: formData.role || 'student',
        major: formData.major || 'MIS',
        level: formData.level ? parseInt(formData.level) : 1,
        gpa: formData.gpa ? parseFloat(formData.gpa) : 0.0,
        createdAt: new Date().toISOString(),
      };

      localUsers.push(newUser);
      localStorage.setItem('kku_users', JSON.stringify(localUsers));

      return { success: true, source: 'localStorage' as const };
    },
    'Signup'
  );
}

/**
 * جلب الإحصائيات مع fallback
 */
export async function getStatsWithFallback() {
  return withFallback(
    async () => {
      const [students, courses, pendingReqs, approvedReqs, supervisors, admins] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'supervisor'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);

      return {
        totalStudents: students.count || 0,
        totalCourses: courses.count || 49,
        pendingRequests: pendingReqs.count || 0,
        approvedRequests: approvedReqs.count || 0,
        totalSupervisors: supervisors.count || 0,
        totalAdmins: admins.count || 0,
        source: 'supabase' as const,
      };
    },
    () => {
      const localUsers = JSON.parse(localStorage.getItem('kku_users') || '[]');
      return {
        totalStudents: localUsers.filter((u: any) => u.role === 'student').length,
        totalCourses: 49,
        pendingRequests: 0,
        approvedRequests: 0,
        totalSupervisors: localUsers.filter((u: any) => u.role === 'supervisor').length,
        totalAdmins: localUsers.filter((u: any) => u.role === 'admin').length,
        source: 'localStorage' as const,
      };
    },
    'GetStats'
  );
}
