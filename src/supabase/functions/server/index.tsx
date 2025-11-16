import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { ALL_COURSES, getCoursesByLevel, getCourseById, type Course } from './coursesData.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Health check
app.get('/make-server-1573e40a/health', (c) => {
  return c.json({ status: 'ok', message: 'KKU Course Registration System Server' });
});

// Log access agreement
app.post('/make-server-1573e40a/log-access', async (c) => {
  try {
    const body = await c.req.json();
    const { fullName, ipAddress, userAgent, timestamp, language } = body;

    const accessLog = {
      full_name: fullName,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp,
      language,
      created_at: new Date().toISOString(),
    };

    // Store in KV
    const logId = `access_log:${Date.now()}:${fullName}`;
    await kv.set(logId, accessLog);

    return c.json({ success: true, message: 'Access logged successfully' });
  } catch (error: any) {
    console.error('Error logging access:', error);
    return c.json({ error: 'Failed to log access' }, 500);
  }
});

// Signup route
app.post('/make-server-1573e40a/signup', async (c) => {
  try {
    const { fullName, studentId, email, password, gpa, major, level, role } = await c.req.json();

    console.log('📝 إنشاء حساب جديد:', { email, role });

    // التحقق من البيانات الأساسية
    if (!fullName || !email || !password || !role) {
      return c.json({ error: 'Missing required fields: fullName, email, password, role' }, 400);
    }

    // ✅ إذا كان الدور "طالب"، نتحقق من الحقول الإضافية
    if (role === 'student') {
      if (!studentId || !major || !level) {
        return c.json({ error: 'Students must provide studentId, major, and level' }, 400);
      }
    }

    // تحقق من البريد الإلكتروني
    if (!email.endsWith('@kku.edu.sa')) {
      return c.json({ error: 'Must use university email (@kku.edu.sa)' }, 400);
    }

    // ✅ إذا كان الدور "طالب"، نتحقق من الرقم الجامعي
    if (role === 'student') {
      // Check if student ID already exists
      const existingStudent = await kv.get(`student:${studentId}`);
      if (existingStudent) {
        console.log('⚠️ الرقم الجامعي موجود مسبقاً، سيتم استبدال البيانات');
        
        // احذف mapping القديم للبريد
        if (existingStudent.email && existingStudent.email !== email) {
          await kv.del(`email:${existingStudent.email}`);
        }
        
        // احذف mapping القديم للـ auth
        if (existingStudent.auth_id) {
          await kv.del(`auth:${existingStudent.auth_id}`);
          
          // حاول حذف المستخدم القديم من Supabase Auth
          try {
            await supabase.auth.admin.deleteUser(existingStudent.auth_id);
          } catch (err) {
            console.log('Could not delete old auth user:', err);
          }
        }
      }
    }

    // Check if email already exists
    const existingEmail = await kv.get(`email:${email}`);
    if (existingEmail) {
      console.log('⚠️ البريد موجود مسبقاً');
      return c.json({ error: 'Email already registered' }, 400);
    }

    // إنشاء معرف فريد للمستخدم
    const userId = role === 'student' ? studentId : `${role}-${Date.now()}`;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server
      user_metadata: {
        full_name: fullName,
        role: role || 'student',
        ...(role === 'student' && {
          student_id: studentId,
          major,
          level,
        }),
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: authError.message }, 500);
    }

    console.log('✅ تم إنشاء مستخدم Auth:', authData.user.id);

    // ✅ Store user data in KV (حسب الدور)
    const userData: any = {
      user_id: userId,
      full_name: fullName,
      email,
      role: role || 'student',
      auth_id: authData.user.id,
      created_at: new Date().toISOString(),
    };

    // ✅ إذا كان الدور "طالب"، نضيف البيانات الإضافية
    if (role === 'student') {
      userData.student_id = studentId;
      userData.major = major;
      userData.level = parseInt(level);
      userData.gpa = gpa ? parseFloat(gpa) : null;
    }

    await kv.set(`student:${userId}`, userData);
    await kv.set(`email:${email}`, userId);
    await kv.set(`auth:${authData.user.id}`, userId);

    console.log('✅ تم حفظ بيانات المستخدم في KV');

    return c.json({ 
      success: true, 
      message: 'Account created successfully',
      userId,
      role,
    });
  } catch (error: any) {
    console.error('❌ Error in signup endpoint:', error);
    return c.json({ error: error.message || 'Failed to create account' }, 500);
  }
});

// Login route
app.post('/make-server-1573e40a/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Get student data
    const studentId = await kv.get(`email:${email}`);
    if (!studentId) {
      return c.json({ error: 'Student data not found' }, 404);
    }

    const studentData = await kv.get(`student:${studentId}`);

    return c.json({ 
      success: true,
      session: data.session,
      user: {
        ...studentData,
        access_token: data.session.access_token,
      },
    });
  } catch (error: any) {
    console.error('Error in login endpoint:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current user
app.get('/make-server-1573e40a/me', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const studentId = await kv.get(`auth:${user.id}`);
    if (!studentId) {
      return c.json({ error: 'Student data not found' }, 404);
    }

    const studentData = await kv.get(`student:${studentId}`);

    return c.json({ user: studentData });
  } catch (error: any) {
    console.error('Error in me endpoint:', error);
    return c.json({ error: 'Failed to get user data' }, 500);
  }
});

// Register for course
app.post('/make-server-1573e40a/register-course', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { courseId } = await c.req.json();
    if (!courseId) {
      return c.json({ error: 'Missing course ID' }, 400);
    }

    const studentId = await kv.get(`auth:${user.id}`);
    const registrationId = `${studentId}:${courseId}`;

    // Check if already registered
    const existing = await kv.get(`registration:${registrationId}`);
    if (existing) {
      return c.json({ error: 'Already registered for this course' }, 400);
    }

    // Create registration
    const registration = {
      registration_id: registrationId,
      student_id: studentId,
      course_id: courseId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await kv.set(`registration:${registrationId}`, registration);

    // Add to student's registrations list
    const studentRegistrations = await kv.get(`student:${studentId}:registrations`) || [];
    studentRegistrations.push(registrationId);
    await kv.set(`student:${studentId}:registrations`, studentRegistrations);

    return c.json({ 
      success: true, 
      message: 'Course registration submitted',
      registration,
    });
  } catch (error: any) {
    console.error('Error in register-course endpoint:', error);
    return c.json({ error: 'Failed to register for course' }, 500);
  }
});

// Get student registrations
app.get('/make-server-1573e40a/my-registrations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const studentId = await kv.get(`auth:${user.id}`);
    const registrationIds = await kv.get(`student:${studentId}:registrations`) || [];

    const registrations = [];
    for (const regId of registrationIds) {
      const reg = await kv.get(`registration:${regId}`);
      if (reg) {
        // Get course details
        const course = await kv.get(`course:${reg.course_id}`);
        registrations.push({
          ...reg,
          course: course || null,
        });
      }
    }

    return c.json({ registrations });
  } catch (error: any) {
    console.error('Error in my-registrations endpoint:', error);
    return c.json({ error: 'Failed to get registrations' }, 500);
  }
});

// Get student registrations with full details (for dashboard)
app.get('/make-server-1573e40a/student/registrations', async (c) => {
  try {
    console.log('📚 Getting student registrations...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.error('❌ No access token provided');
      return c.json({ error: 'Unauthorized: No access token' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }

    console.log('✅ User authenticated:', user.id);

    // Get student ID from auth mapping
    const studentId = await kv.get(`auth:${user.id}`);
    if (!studentId) {
      console.error('❌ No student ID found for user:', user.id);
      // إذا لم يوجد mapping، أرجع قائمة فارغة بدلاً من خطأ
      return c.json({ registrations: [] });
    }

    console.log('✅ Student ID:', studentId);

    // Get registration IDs
    const registrationIds = await kv.get(`student:${studentId}:registrations`) || [];
    console.log('📝 Registration IDs:', registrationIds);

    const registrations = [];
    for (const regId of registrationIds) {
      const reg = await kv.get(`registration:${regId}`);
      if (reg) {
        // Get course details
        const course = await kv.get(`course:${reg.course_id}`);
        registrations.push({
          ...reg,
          course: course || null,
        });
      }
    }

    console.log('✅ Found', registrations.length, 'registrations');
    return c.json({ registrations });
  } catch (error: any) {
    console.error('❌ Error in student/registrations endpoint:', error);
    return c.json({ error: `Failed to get registrations: ${error.message}` }, 500);
  }
});

// Supervisor: Get all pending registrations
app.get('/make-server-1573e40a/supervisor/pending-registrations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is supervisor
    const studentId = await kv.get(`auth:${user.id}`);
    const studentData = await kv.get(`student:${studentId}`);
    
    if (studentData.role !== 'supervisor' && studentData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Supervisor access required' }, 403);
    }

    // Get all registrations
    const allKeys = await kv.getByPrefix('registration:');
    const pendingRegistrations = [];

    for (const { value } of allKeys) {
      if (value.status === 'pending') {
        // Get student data
        const student = await kv.get(`student:${value.student_id}`);
        pendingRegistrations.push({
          ...value,
          student: student,
        });
      }
    }

    return c.json({ registrations: pendingRegistrations });
  } catch (error: any) {
    console.error('Error in pending-registrations endpoint:', error);
    return c.json({ error: 'Failed to get pending registrations' }, 500);
  }
});

// Supervisor: Approve/Reject registration
app.post('/make-server-1573e40a/supervisor/approve-registration', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is supervisor
    const studentId = await kv.get(`auth:${user.id}`);
    const studentData = await kv.get(`student:${studentId}`);
    
    if (studentData.role !== 'supervisor' && studentData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Supervisor access required' }, 403);
    }

    const { registrationId, status } = await c.req.json();
    if (!registrationId || !status) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (status !== 'approved' && status !== 'rejected') {
      return c.json({ error: 'Invalid status' }, 400);
    }

    const registration = await kv.get(`registration:${registrationId}`);
    if (!registration) {
      return c.json({ error: 'Registration not found' }, 404);
    }

    registration.status = status;
    registration.reviewed_by = studentId;
    registration.reviewed_at = new Date().toISOString();

    await kv.set(`registration:${registrationId}`, registration);

    return c.json({ 
      success: true, 
      message: `Registration ${status}`,
      registration,
    });
  } catch (error: any) {
    console.error('Error in approve-registration endpoint:', error);
    return c.json({ error: 'Failed to update registration' }, 500);
  }
});

// Contact form submission
app.post('/make-server-1573e40a/contact', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const contactId = `contact:${Date.now()}`;
    await kv.set(contactId, {
      name,
      email,
      subject,
      message,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return c.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error in contact endpoint:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// ===============================
// COURSES MANAGEMENT ENDPOINTS
// ===============================

// Initialize courses in database
app.post('/make-server-1573e40a/init-courses', async (c) => {
  try {
    console.log('📚 Initializing courses database...');
    
    let createdCount = 0;
    let skippedCount = 0;

    for (const course of ALL_COURSES) {
      const existing = await kv.get(`course:${course.course_id}`);
      if (!existing) {
        await kv.set(`course:${course.course_id}`, course);
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Courses initialized: ${createdCount} created, ${skippedCount} skipped`);

    return c.json({
      success: true,
      message: 'Courses initialized successfully',
      created: createdCount,
      skipped: skippedCount,
      total: ALL_COURSES.length,
    });
  } catch (error: any) {
    console.error('Error initializing courses:', error);
    return c.json({ error: 'Failed to initialize courses' }, 500);
  }
});

// Get all courses
app.get('/make-server-1573e40a/courses', async (c) => {
  try {
    const level = c.req.query('level');
    const department = c.req.query('department');

    // Get all courses from KV
    const allCoursesKeys = await kv.getByPrefix('course:');
    let courses = allCoursesKeys.map(item => item.value).filter(course => course != null);

    // Filter by level if specified
    if (level) {
      courses = courses.filter(course => course && course.level === parseInt(level));
    }

    // Filter by department if specified
    if (department) {
      courses = courses.filter(course => course && course.department === department);
    }

    // Sort by level and code
    courses.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.code.localeCompare(b.code);
    });

    return c.json({ courses });
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }
});

// Get course by ID
app.get('/make-server-1573e40a/courses/:courseId', async (c) => {
  try {
    const courseId = c.req.param('courseId');
    const course = await kv.get(`course:${courseId}`);

    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    return c.json({ course });
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return c.json({ error: 'Failed to fetch course' }, 500);
  }
});

// Admin: Create new course
app.post('/make-server-1573e40a/admin/courses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const studentId = await kv.get(`auth:${user.id}`);
    const studentData = await kv.get(`student:${studentId}`);
    
    if (studentData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const courseData = await c.req.json();
    
    // Validate required fields
    if (!courseData.course_id || !courseData.code || !courseData.name_ar || !courseData.name_en || !courseData.credit_hours || !courseData.level) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if course already exists
    const existing = await kv.get(`course:${courseData.course_id}`);
    if (existing) {
      return c.json({ error: 'Course already exists' }, 400);
    }

    const newCourse: Course = {
      ...courseData,
      department: courseData.department || 'MIS',
      prerequisites: courseData.prerequisites || [],
      created_at: new Date().toISOString(),
    };

    await kv.set(`course:${courseData.course_id}`, newCourse);

    return c.json({
      success: true,
      message: 'Course created successfully',
      course: newCourse,
    });
  } catch (error: any) {
    console.error('Error creating course:', error);
    return c.json({ error: 'Failed to create course' }, 500);
  }
});

// Admin: Update course
app.put('/make-server-1573e40a/admin/courses/:courseId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const studentId = await kv.get(`auth:${user.id}`);
    const studentData = await kv.get(`student:${studentId}`);
    
    if (studentData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const courseId = c.req.param('courseId');
    const course = await kv.get(`course:${courseId}`);

    if (!course) {
      return c.json({ error: 'Course not found' }, 404);
    }

    const updates = await c.req.json();
    const updatedCourse = {
      ...course,
      ...updates,
      course_id: courseId, // Don't allow changing ID
      updated_at: new Date().toISOString(),
    };

    await kv.set(`course:${courseId}`, updatedCourse);

    return c.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error: any) {
    console.error('Error updating course:', error);
    return c.json({ error: 'Failed to update course' }, 500);
  }
});

// Admin: Delete course
app.delete('/make-server-1573e40a/admin/delete-course', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { courseId } = await c.req.json();
    
    if (!courseId) {
      return c.json({ error: 'Course ID is required' }, 400);
    }

    // Get course data
    const courseData = await kv.get(`course:${courseId}`);
    
    if (!courseData) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Delete course
    await kv.del(`course:${courseId}`);

    return c.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return c.json({ error: 'Failed to delete course' }, 500);
  }
});

// Admin: Get system statistics
app.get('/make-server-1573e40a/admin/stats', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Get all users
    const allUsersKeys = await kv.getByPrefix('student:');
    const allUsers = allUsersKeys.map(item => item.value).filter(u => u != null);
    
    // Count by role
    const totalStudents = allUsers.filter(u => u.role === 'student').length;
    const totalSupervisors = allUsers.filter(u => u.role === 'supervisor').length;
    const totalAdmins = allUsers.filter(u => u.role === 'admin').length;
    
    // Get all courses
    const coursesKeys = await kv.getByPrefix('course:');
    const totalCourses = coursesKeys.length;
    
    // Get all registrations
    const registrationsKeys = await kv.getByPrefix('registration:');
    const allRegistrations = registrationsKeys.map(item => item.value).filter(r => r != null);
    const pendingRequests = allRegistrations.filter(r => r.status === 'pending').length;
    const approvedRequests = allRegistrations.filter(r => r.status === 'approved').length;
    const rejectedRequests = allRegistrations.filter(r => r.status === 'rejected').length;

    return c.json({
      stats: {
        totalStudents,
        totalSupervisors,
        totalAdmins,
        totalCourses,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
      }
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Get curriculum (all levels overview)
app.get('/make-server-1573e40a/curriculum', async (c) => {
  try {
    const department = c.req.query('department') || 'MIS';

    // Get all courses
    const allCoursesKeys = await kv.getByPrefix('course:');
    const allCourses = allCoursesKeys.map(item => item.value).filter(course => course != null);

    // Filter by department
    const departmentCourses = allCourses.filter(course => course && course.department === department);

    // Group by level
    const curriculum: Record<number, any[]> = {};
    departmentCourses.forEach(course => {
      if (course && course.level) {
        if (!curriculum[course.level]) {
          curriculum[course.level] = [];
        }
        curriculum[course.level].push(course);
      }
    });

    // Sort courses within each level
    Object.keys(curriculum).forEach(level => {
      curriculum[parseInt(level)].sort((a, b) => a.code.localeCompare(b.code));
    });

    // Calculate totals per level
    const levelSummary = Object.keys(curriculum).map(level => ({
      level: parseInt(level),
      courses: curriculum[parseInt(level)].length,
      credit_hours: curriculum[parseInt(level)].reduce((sum, course) => sum + (course.credit_hours || 0), 0),
    }));

    return c.json({
      department,
      curriculum,
      levelSummary,
      totalCourses: departmentCourses.length,
      totalCreditHours: departmentCourses.reduce((sum, course) => sum + (course.credit_hours || 0), 0),
    });
  } catch (error: any) {
    console.error('Error fetching curriculum:', error);
    return c.json({ error: 'Failed to fetch curriculum' }, 500);
  }
});

// ===============================
// DEMO ACCOUNTS ENDPOINT
// ===============================

// Create demo accounts for testing
app.post('/make-server-1573e40a/create-demo-accounts', async (c) => {
  try {
    console.log('🧪 Creating demo accounts...');

    const demoAccounts = [
      {
        fullName: 'أحمد محمد الغامدي',
        studentId: '442012345',
        email: 'ahmad.alghamdi@kku.edu.sa',
        password: 'Demo@2024',
        major: 'Management Information Systems',
        level: 6,
        gpa: 4.25,
        role: 'student',
      },
      {
        fullName: 'فاطمة علي القحطاني',
        studentId: '442012346',
        email: 'fatimah.alqahtani@kku.edu.sa',
        password: 'Demo@2024',
        major: 'Management Information Systems',
        level: 5,
        gpa: 4.75,
        role: 'student',
      },
      {
        fullName: 'د. محمد رشيد العمري',
        email: 'mohammed.rasheed@kku.edu.sa',
        password: 'Super@2024',
        role: 'supervisor',
      },
      {
        fullName: 'د. عبدالعزيز الزهراني',
        email: 'abdulaziz.alzahrani@kku.edu.sa',
        password: 'Admin@2024',
        role: 'admin',
      },
    ];

    const results = [];

    for (const accountData of demoAccounts) {
      try {
        // Check if user already exists
        const existingEmail = await kv.get(`email:${accountData.email}`);
        
        if (existingEmail) {
          console.log(`⚠️ User already exists: ${accountData.email}`);
          results.push({
            email: accountData.email,
            status: 'already_exists',
            message: 'User already exists',
          });
          continue;
        }

        // Check student ID for students
        if (accountData.role === 'student' && accountData.studentId) {
          const existingStudent = await kv.get(`student:${accountData.studentId}`);
          if (existingStudent) {
            // Delete old user if exists
            if (existingStudent.email && existingStudent.email !== accountData.email) {
              await kv.del(`email:${existingStudent.email}`);
            }
            if (existingStudent.auth_id) {
              await kv.del(`auth:${existingStudent.auth_id}`);
              try {
                await supabase.auth.admin.deleteUser(existingStudent.auth_id);
              } catch (err) {
                console.log('Could not delete old auth user:', err);
              }
            }
          }
        }

        // Create user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: accountData.email,
          password: accountData.password,
          email_confirm: true,
          user_metadata: {
            full_name: accountData.fullName,
            role: accountData.role,
            ...(accountData.role === 'student' && {
              student_id: accountData.studentId,
              major: accountData.major,
              level: accountData.level,
            }),
          },
        });

        if (authError) {
          console.error(`❌ Auth error for ${accountData.email}:`, authError);
          results.push({
            email: accountData.email,
            status: 'error',
            message: authError.message,
          });
          continue;
        }

        console.log(`✅ Auth user created: ${authData.user.id}`);

        // Store user data in KV
        const userId = accountData.role === 'student' ? accountData.studentId! : `${accountData.role}-${Date.now()}`;
        const userData: any = {
          user_id: userId,
          full_name: accountData.fullName,
          email: accountData.email,
          role: accountData.role,
          auth_id: authData.user.id,
          created_at: new Date().toISOString(),
        };

        if (accountData.role === 'student') {
          userData.student_id = accountData.studentId;
          userData.major = accountData.major;
          userData.level = accountData.level;
          userData.gpa = accountData.gpa;
        }

        await kv.set(`student:${userId}`, userData);
        await kv.set(`email:${accountData.email}`, userId);
        await kv.set(`auth:${authData.user.id}`, userId);

        console.log(`✅ User data saved: ${accountData.email}`);

        results.push({
          email: accountData.email,
          role: accountData.role,
          status: 'created',
          message: 'Account created successfully',
          credentials: {
            email: accountData.email,
            password: accountData.password,
          },
        });
      } catch (error: any) {
        console.error(`❌ Error creating account ${accountData.email}:`, error);
        results.push({
          email: accountData.email,
          status: 'error',
          message: error.message,
        });
      }
    }

    return c.json({
      success: true,
      message: 'Demo accounts creation completed',
      results,
    });
  } catch (error: any) {
    console.error('❌ Error in create-demo-accounts endpoint:', error);
    return c.json({ error: error.message || 'Failed to create demo accounts' }, 500);
  }
});

// ===============================
// ADMIN ENDPOINTS
// ===============================

// Admin: Get all students
app.get('/make-server-1573e40a/admin/students', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Get all students from KV
    const allUsersKeys = await kv.getByPrefix('student:');
    const students = allUsersKeys
      .map(item => item.value)
      .filter(user => user && user.role === 'student');

    return c.json({ students });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return c.json({ error: 'Failed to fetch students' }, 500);
  }
});

// Admin: Delete student
app.delete('/make-server-1573e40a/admin/delete-student', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { studentId } = await c.req.json();
    
    if (!studentId) {
      return c.json({ error: 'Student ID is required' }, 400);
    }

    // Get student data
    const studentData = await kv.get(`student:${studentId}`);
    
    if (!studentData) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Delete from Supabase Auth
    if (studentData.auth_id) {
      try {
        await supabase.auth.admin.deleteUser(studentData.auth_id);
      } catch (err) {
        console.log('Could not delete auth user:', err);
      }
    }

    // Delete all student registrations
    const registrationIds = await kv.get(`student:${studentId}:registrations`) || [];
    for (const regId of registrationIds) {
      await kv.del(`registration:${regId}`);
    }
    await kv.del(`student:${studentId}:registrations`);

    // Delete mappings
    await kv.del(`student:${studentId}`);
    await kv.del(`email:${studentData.email}`);
    if (studentData.auth_id) {
      await kv.del(`auth:${studentData.auth_id}`);
    }

    return c.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return c.json({ error: 'Failed to delete student' }, 500);
  }
});

// Admin: Get all supervisors
app.get('/make-server-1573e40a/admin/supervisors', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Get all supervisors from KV
    const allUsersKeys = await kv.getByPrefix('student:');
    const supervisors = allUsersKeys
      .map(item => item.value)
      .filter(user => user && user.role === 'supervisor');

    return c.json({ supervisors });
  } catch (error: any) {
    console.error('Error fetching supervisors:', error);
    return c.json({ error: 'Failed to fetch supervisors' }, 500);
  }
});

// Admin: Delete supervisor
app.delete('/make-server-1573e40a/admin/delete-supervisor', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { supervisorId } = await c.req.json();
    
    if (!supervisorId) {
      return c.json({ error: 'Supervisor ID is required' }, 400);
    }

    // Get supervisor data
    const supervisorData = await kv.get(`student:${supervisorId}`);
    
    if (!supervisorData) {
      return c.json({ error: 'Supervisor not found' }, 404);
    }

    // Delete from Supabase Auth
    if (supervisorData.auth_id) {
      try {
        await supabase.auth.admin.deleteUser(supervisorData.auth_id);
      } catch (err) {
        console.log('Could not delete auth user:', err);
      }
    }

    // Delete mappings
    await kv.del(`student:${supervisorId}`);
    await kv.del(`email:${supervisorData.email}`);
    if (supervisorData.auth_id) {
      await kv.del(`auth:${supervisorData.auth_id}`);
    }

    return c.json({
      success: true,
      message: 'Supervisor deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting supervisor:', error);
    return c.json({ error: 'Failed to delete supervisor' }, 500);
  }
});

// ===============================
// ADMIN COURSES ENDPOINTS
// ===============================

// Admin: Get all courses
app.get('/make-server-1573e40a/admin/courses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Get all courses from KV or return default courses
    const coursesKeys = await kv.getByPrefix('course:');
    
    let courses = [];
    if (coursesKeys && coursesKeys.length > 0) {
      courses = coursesKeys.map(item => item.value);
    } else {
      // If no courses in KV, use default courses from coursesData.tsx
      courses = ALL_COURSES.map(course => ({
        course_id: course.id,
        code: course.code,
        name_ar: course.name_ar,
        name_en: course.name_en,
        credit_hours: course.credit_hours,
        level: course.level,
        department: course.department || 'MIS',
        description_ar: course.description_ar || '',
        description_en: course.description_en || '',
        prerequisites: course.prerequisites || [],
        created_at: new Date().toISOString(),
      }));
      
      // Save default courses to KV
      for (const course of courses) {
        await kv.set(`course:${course.course_id}`, course);
      }
    }

    return c.json({ courses });
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }
});

// Admin: Add course
app.post('/make-server-1573e40a/admin/add-course', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const courseData = await c.req.json();
    
    // Validate required fields
    if (!courseData.code || !courseData.name_ar || !courseData.name_en || !courseData.credit_hours || !courseData.level) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if course code already exists
    const coursesKeys = await kv.getByPrefix('course:');
    const existingCourse = coursesKeys.find(item => item.value.code === courseData.code);
    
    if (existingCourse) {
      return c.json({ error: 'Course code already exists' }, 400);
    }

    // Create new course
    const courseId = `course-${Date.now()}`;
    const newCourse = {
      course_id: courseId,
      code: courseData.code,
      name_ar: courseData.name_ar,
      name_en: courseData.name_en,
      credit_hours: parseInt(courseData.credit_hours),
      level: parseInt(courseData.level),
      department: courseData.department || 'MIS',
      description_ar: courseData.description_ar || '',
      description_en: courseData.description_en || '',
      prerequisites: courseData.prerequisites || [],
      created_at: new Date().toISOString(),
    };

    await kv.set(`course:${courseId}`, newCourse);

    return c.json({
      success: true,
      message: 'Course added successfully',
      course: newCourse,
    });
  } catch (error: any) {
    console.error('Error adding course:', error);
    return c.json({ error: 'Failed to add course' }, 500);
  }
});

// Admin: Update course
app.put('/make-server-1573e40a/admin/update-course', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userId}`);
    
    if (userData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { courseId, ...updateData } = await c.req.json();
    
    if (!courseId) {
      return c.json({ error: 'Course ID is required' }, 400);
    }

    // Get existing course
    const existingCourse = await kv.get(`course:${courseId}`);
    
    if (!existingCourse) {
      return c.json({ error: 'Course not found' }, 404);
    }

    // Update course
    const updatedCourse = {
      ...existingCourse,
      ...updateData,
      course_id: courseId, // Prevent ID change
      updated_at: new Date().toISOString(),
    };

    await kv.set(`course:${courseId}`, updatedCourse);

    return c.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error: any) {
    console.error('Error updating course:', error);
    return c.json({ error: 'Failed to update course' }, 500);
  }
});

Deno.serve(app.fetch);