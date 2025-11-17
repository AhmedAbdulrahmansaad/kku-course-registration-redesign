import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { ALL_COURSES, getCoursesByLevel, getCourseById, type Course } from './coursesData.tsx';
import { addSupervisorNotificationEndpoints, addAdminNotificationEndpoints, createNotification } from './notificationEndpoints.tsx';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Add notification endpoints
addSupervisorNotificationEndpoints(app, supabase);
addAdminNotificationEndpoints(app, supabase);

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
    console.log('🔐 POST /login - Starting login process...');
    
    const { email, password } = await c.req.json();

    if (!email || !password) {
      console.error('❌ Missing email or password');
      return c.json({ error: 'Missing email or password' }, 400);
    }

    console.log('📧 Login attempt for:', email);

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Supabase Auth login error:', error);
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    console.log('✅ Supabase Auth successful for user:', data.user.id);

    // Get user data from KV
    const userId = await kv.get(`email:${email}`);
    if (!userId) {
      console.error('❌ User ID not found for email:', email);
      return c.json({ error: 'User data not found' }, 404);
    }

    console.log('📋 User ID from email mapping:', userId);

    const userData = await kv.get(`student:${userId}`);
    if (!userData) {
      console.error('❌ User data not found for ID:', userId);
      return c.json({ error: 'User data not found' }, 404);
    }

    console.log('✅ User data retrieved:', userData);

    // تنسيق البيانات حسب الدور
    const userRole = userData.role || 'student';
    
    let formattedUser;
    
    if (userRole === 'admin' || userRole === 'supervisor') {
      // للمشرفين والمدراء
      formattedUser = {
        full_name: userData.name || userData.full_name,
        student_id: userData.id || userData.student_id || userData.user_id,
        email: userData.email,
        role: userRole,
        department: userData.department || 'نظم المعلومات الإدارية',
        access_token: data.session.access_token,
      };
    } else {
      // للطلاب
      formattedUser = {
        full_name: userData.name || userData.full_name,
        student_id: userData.id || userData.student_id,
        email: userData.email,
        major: userData.major,
        level: userData.level,
        gpa: userData.gpa,
        role: 'student',
        access_token: data.session.access_token,
      };
    }

    console.log('✅ Login successful. User role:', userRole);
    console.log('✅ Formatted user data:', formattedUser);

    return c.json({ 
      success: true,
      session: data.session,
      user: formattedUser,
    });
  } catch (error: any) {
    console.error('❌ Error in login endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current user
app.get('/make-server-1573e40a/me', async (c) => {
  try {
    console.log('👤 GET /me - Fetching current user...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.error('❌ No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.error('❌ Invalid access token:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('✅ Auth user verified:', user.id);

    const userId = await kv.get(`auth:${user.id}`);
    if (!userId) {
      console.error('❌ User ID not found for auth:', user.id);
      return c.json({ error: 'User data not found' }, 404);
    }

    const userData = await kv.get(`student:${userId}`);
    if (!userData) {
      console.error('❌ User data not found for ID:', userId);
      return c.json({ error: 'User data not found' }, 404);
    }

    console.log('✅ User data retrieved:', userData);

    // تنسيق البيانات حسب الدور
    const userRole = userData.role || 'student';
    
    let formattedUser;
    
    if (userRole === 'admin' || userRole === 'supervisor') {
      // للمشرفين والمدراء
      formattedUser = {
        full_name: userData.name || userData.full_name,
        student_id: userData.id || userData.student_id || userData.user_id,
        email: userData.email,
        role: userRole,
        department: userData.department || 'نظم المعلومات الإدارية',
      };
    } else {
      // للطلاب
      formattedUser = {
        full_name: userData.name || userData.full_name,
        student_id: userData.id || userData.student_id,
        email: userData.email,
        major: userData.major,
        level: userData.level,
        gpa: userData.gpa,
        role: 'student',
      };
    }

    console.log('✅ Formatted user data:', formattedUser);

    return c.json({ user: formattedUser });
  } catch (error: any) {
    console.error('❌ Error in me endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({ error: 'Failed to get user data' }, 500);
  }
});

// Register for course
app.post('/make-server-1573e40a/register-course', async (c) => {
  try {
    console.log('📝 POST /register-course - Student registering for course...');
    
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
    const requestId = `req_${Date.now()}_${studentId}_${courseId}`;

    console.log('👤 Student ID:', studentId);
    console.log('📚 Course ID:', courseId);
    console.log('🆔 Registration ID:', registrationId);

    // Check if already registered
    const existing = await kv.get(`registration:${registrationId}`);
    if (existing) {
      console.log('⚠️ Already registered for this course');
      return c.json({ error: 'Already registered for this course' }, 400);
    }

    // Check if there's a pending request
    const existingRequest = await kv.get(`registration_request:${requestId}`);
    if (existingRequest && existingRequest.status === 'pending') {
      console.log('⚠️ Already have a pending request for this course');
      return c.json({ error: 'Already have a pending request for this course' }, 400);
    }

    // Create registration request (for admin/supervisor approval)
    const registrationRequest = {
      request_id: requestId,
      registration_id: registrationId,
      student_id: studentId,
      course_id: courseId,
      status: 'pending', // pending, approved, rejected
      created_at: new Date().toISOString(),
    };

    await kv.set(`registration_request:${requestId}`, registrationRequest);
    console.log('✅ Registration request created:', requestId);

    // Create registration (for student's view)
    const registration = {
      registration_id: registrationId,
      student_id: studentId,
      course_id: courseId,
      status: 'pending',
      request_id: requestId,
      created_at: new Date().toISOString(),
    };

    await kv.set(`registration:${registrationId}`, registration);

    // Add to student's registrations list
    const studentRegistrations = await kv.get(`student:${studentId}:registrations`) || [];
    studentRegistrations.push(registrationId);
    await kv.set(`student:${studentId}:registrations`, studentRegistrations);

    // Create notification for supervisor(s)
    try {
      const studentData = await kv.get(`student:${studentId}`);
      const courseData = await kv.get(`course:${courseId}`);
      
      // Get supervisor - assuming student has supervisor field
      const supervisorId = studentData?.supervisor_id || 'supervisor_default';
      
      await createNotification({
        userId: supervisorId,
        userRole: 'supervisor',
        type: 'new_request',
        titleAr: '📋 طلب تسجيل جديد',
        titleEn: '📋 New Registration Request',
        messageAr: `طلب تسجيل جديد من الطالب ${studentData?.full_name || studentId} في مقرر ${courseData?.name_ar || courseId}`,
        messageEn: `New registration request from student ${studentData?.full_name || studentId} for ${courseData?.name_en || courseId}`,
        relatedId: requestId,
      });
      console.log('✅ Notification created for supervisor');
    } catch (notifError) {
      console.error('⚠️ Failed to create supervisor notification:', notifError);
    }

    console.log('✅ Registration submitted successfully');

    return c.json({ 
      success: true, 
      message: 'Course registration submitted successfully. Waiting for supervisor approval.',
      registration,
      request_id: requestId,
    });
  } catch (error: any) {
    console.error('❌ Error in register-course endpoint:', error);
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
    
    if (!studentData || (studentData.role !== 'supervisor' && studentData.role !== 'admin')) {
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
    
    if (!studentData || (studentData.role !== 'supervisor' && studentData.role !== 'admin')) {
      return c.json({ error: 'Forbidden: Supervisor access required' }, 403);
    }

    const { registrationId, status, reason } = await c.req.json();
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

    // Get course details for notification
    const course = await kv.get(`course:${registration.course_id}`);

    // Update registration status
    registration.status = status;
    registration.reviewed_by = studentId;
    registration.reviewed_at = new Date().toISOString();
    if (reason) {
      registration.reason = reason;
    }

    await kv.set(`registration:${registrationId}`, registration);

    // ✅ Create notification for student
    const notificationId = `notif_${Date.now()}_${registration.student_id}`;
    const notification = {
      notification_id: notificationId,
      student_id: registration.student_id,
      type: status === 'approved' ? 'registration_approved' : 'registration_rejected',
      title_ar: status === 'approved' 
        ? 'تم قبول طلب التسجيل' 
        : 'تم رفض طلب التسجيل',
      title_en: status === 'approved' 
        ? 'Registration Request Approved' 
        : 'Registration Request Rejected',
      message_ar: status === 'approved'
        ? `تم قبول طلب تسجيلك في مقرر: ${course?.name_ar || registration.course_id}`
        : `تم رفض طلب تسجيلك في مقرر: ${course?.name_ar || registration.course_id}${reason ? ` - السبب: ${reason}` : ''}`,
      message_en: status === 'approved'
        ? `Your registration request for: ${course?.name_en || registration.course_id} has been approved`
        : `Your registration request for: ${course?.name_en || registration.course_id} has been rejected${reason ? ` - Reason: ${reason}` : ''}`,
      course_id: registration.course_id,
      registration_id: registrationId,
      read: false,
      created_at: new Date().toISOString(),
    };

    await kv.set(`notification:${notificationId}`, notification);

    // Add to student's notifications list
    const studentNotifications = await kv.get(`student:${registration.student_id}:notifications`) || [];
    studentNotifications.unshift(notificationId); // Add to beginning
    await kv.set(`student:${registration.student_id}:notifications`, studentNotifications);

    console.log(`✅ Registration ${status}, notification sent to student`);

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
// NOTIFICATIONS ENDPOINTS
// ===============================

// Student: Get notifications
app.get('/make-server-1573e40a/student/notifications', async (c) => {
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
    if (!studentId) {
      return c.json({ notifications: [] });
    }

    const notificationIds = await kv.get(`student:${studentId}:notifications`) || [];
    
    const notifications = [];
    for (const notifId of notificationIds) {
      const notif = await kv.get(`notification:${notifId}`);
      if (notif) {
        notifications.push(notif);
      }
    }

    return c.json({ notifications });
  } catch (error: any) {
    console.error('Error in student/notifications endpoint:', error);
    return c.json({ error: 'Failed to get notifications' }, 500);
  }
});

// Student: Mark notification as read
app.post('/make-server-1573e40a/student/notification/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { notificationId } = await c.req.json();
    if (!notificationId) {
      return c.json({ error: 'Missing notification ID' }, 400);
    }

    const notification = await kv.get(`notification:${notificationId}`);
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    notification.read = true;
    notification.read_at = new Date().toISOString();
    await kv.set(`notification:${notificationId}`, notification);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error in mark notification as read:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// Student: Mark all notifications as read
app.post('/make-server-1573e40a/student/notifications/read-all', async (c) => {
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
    if (!studentId) {
      return c.json({ success: true });
    }

    const notificationIds = await kv.get(`student:${studentId}:notifications`) || [];
    
    for (const notifId of notificationIds) {
      const notif = await kv.get(`notification:${notifId}`);
      if (notif && !notif.read) {
        notif.read = true;
        notif.read_at = new Date().toISOString();
        await kv.set(`notification:${notifId}`, notif);
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error in mark all notifications as read:', error);
    return c.json({ error: 'Failed to mark all notifications as read' }, 500);
  }
});

// ===============================
// AI ASSISTANT ENDPOINT
// ===============================

// AI Assistant - Real OpenAI Integration with Enhanced Context
app.post('/make-server-1573e40a/ai-assistant', async (c) => {
  try {
    const { message, userInfo, courses, registrations, requests, students, language } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    console.log('🤖 AI Assistant request:', message);
    console.log('👤 User role:', userInfo?.role);

    // Check if OPENAI_API_KEY is available
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      // Fallback to rule-based responses
      console.log('⚠️ No OpenAI API key, using fallback responses');
      return c.json({
        response: getFallbackResponse(message, userInfo, courses, language),
        type: 'fallback'
      });
    }

    // بناء system prompt حسب دور المستخدم
    let systemPrompt = '';
    
    if (userInfo?.role === 'student' || !userInfo?.role) {
      // نظام للطالب
      systemPrompt = `أنت مساعد ذكي متخصص لنظام تسجيل المقررات في جامعة الملك خالد - كلية إدارة الأعمال.

معلومات الطالب:
- الاسم: ${userInfo?.name || 'الطالب'}
- الرقم الجامعي: ${userInfo?.id || 'غير متوفر'}
- المستوى: ${userInfo?.level || '1'}
- التخصص: ${userInfo?.major || 'نظم المعلومات الإدارية'}
- المعدل التراكمي: ${userInfo?.gpa || 'غير محدد'}

المقررات المتاحة: ${courses?.length || 0} مقرر
المقررات المسجلة: ${registrations?.filter((r: any) => r.status === 'approved').length || 0} مقرر
الطلبات المعلقة: ${registrations?.filter((r: any) => r.status === 'pending').length || 0} طلب

يمكنك مساعدة الطالب في:
✅ الإجابة عن أسئلة حول المقررات المتاحة والمتطلبات
✅ شرح كيفية تسجيل المقررات وإلغائها
✅ توضيح المعدل التراكمي والساعات المكتسبة
✅ عرض الجدول الدراسي وأوقات المحاضرات
✅ التحقق من التعارضات في الجدول
✅ معلومات عن الخطة الدراسية (49 مقرر، 8 مستويات)
✅ أسئلة عامة عن النظام

تعليمات الرد:
- أجب باللغة ${language === 'ar' ? 'العربية' : 'الإنجليزية'} بطريقة ودية ومفيدة
- استخدم emojis لجعل الردود أكثر حيوية 🎓📚✨
- كن محدداً واستخدم البيانات المتوفرة
- إذا سأل عن مقرر معين، ابحث عنه في قائمة المقررات
- إذا سأل عن جدوله، أخبره بعدد المقررات المسجلة
- اجعل الردود قصيرة ومختصرة (3-5 جمل)`;

    } else if (userInfo?.role === 'supervisor') {
      // نظام للمشرف
      systemPrompt = `أنت مساعد ذكي متخصص لنظام تسجيل المقررات - لوحة تحكم المشرف الأكاديمي.

معلومات المشرف:
- الاسم: ${userInfo?.name || 'المشرف'}
- الدور: مشرف أكاديمي

إحصائيات:
- طلبات التسجيل المعلقة: ${requests?.filter((r: any) => r.status === 'pending').length || 0}
- الطلبات المقبولة: ${requests?.filter((r: any) => r.status === 'approved').length || 0}
- الطلبات المرفوضة: ${requests?.filter((r: any) => r.status === 'rejected').length || 0}
- إجمالي الطلبات: ${requests?.length || 0}

يمكنك مساعدة المشرف في:
✅ عرض إحصائيات الطلبات والطلاب
✅ معلومات عن الطلبات المعلقة
✅ توليد تقارير عن الأداء الأكاديمي
✅ معلومات عن القسم والتخصص
✅ إرشادات للموافقة/رفض الطلبات

تعليمات الرد:
- أجب باللغة ${language === 'ar' ? 'العربية' : 'الإنجليزية'} بطريقة مهنية
- استخدم emojis بشكل محدود 📊📋
- ركز على الإحصائيات والبيانات
- كن دقيقاً في المعلومات
- اجعل الردود واضحة ومختصرة`;

    } else if (userInfo?.role === 'admin') {
      // نظام للمدير
      systemPrompt = `أنت مساعد ذكي متخصص لنظام تسجيل المقررات - لوحة تحكم المدير.

معلومات المدير:
- الاسم: ${userInfo?.name || 'المدير'}
- الدور: مدير النظام

إحصائيات النظام:
- عدد الطلاب: ${students?.length || 0}
- عدد المقررات: ${courses?.length || 49}
- الطلبات المعلقة: ${requests?.filter((r: any) => r.status === 'pending').length || 0}
- إجمالي الطلبات: ${requests?.length || 0}

يمكنك مساعدة المدير في:
✅ عرض إحصائيات شاملة عن النظام
✅ معلومات عن الأقسام والتخصصات
✅ تحليل المشاكل والحلول المقترحة
✅ تقارير الأداء والجودة
✅ إدارة المستخدمين والصلاحيات

تعليمات الرد:
- أجب باللغة ${language === 'ar' ? 'العربية' : 'الإنجليزية'} بطريقة تنفيذية
- استخدم emojis للإحصائيات 📈📊🏢
- ركز على البيانات الكلية والتحليل
- قدم رؤى استراتيجية
- اجعل الردود شاملة وواضحة`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('❌ OpenAI API error:', await response.text());
      return c.json({
        response: getFallbackResponse(message, userInfo, courses, language),
        type: 'fallback'
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || (language === 'ar' ? 'عذراً، لم أتمكن من فهم سؤالك. هل يمكنك إعادة صياغته؟' : 'Sorry, I couldn\'t understand your question. Could you rephrase it?');

    console.log('✅ AI Response generated');

    return c.json({
      response: aiResponse,
      type: 'ai'
    });
  } catch (error: any) {
    console.error('❌ Error in AI assistant:', error);
    return c.json({ 
      response: language === 'ar' ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Sorry, an error occurred. Please try again.',
      type: 'error' 
    }, 500);
  }
});

// Fallback response function
function getFallbackResponse(message: string, userInfo: any, courses: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Greetings
  if (lowerMessage.includes('مرحبا') || lowerMessage.includes('السلام') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `👋 مرحباً ${userInfo?.fullName || 'بك'}! كيف يمكنني مساعدتك اليوم؟\n\n📚 يمكنني مساعدتك في:\n• تسجيل المقررات\n• عرض الجدول\n• الإجابة عن الأسئلة`;
  }
  
  // Course registration
  if (lowerMessage.includes('تسجيل') || lowerMessage.includes('مقرر') || lowerMessage.includes('register') || lowerMessage.includes('course')) {
    return `📚 لتسجيل مقرر:\n\n1️⃣ اذهب إلى صفحة "المقررات المتاحة"\n2️⃣ اختر المقرر المناسب لمستواك\n3️⃣ اضغط "سجل الآن"\n4️⃣ انتظر موافقة المشرف الأكاديمي\n\n💡 لديك حالياً ${userInfo?.level || 1} مستوى ومعدل ${userInfo?.gpa || 'غير محدد'}`;
  }
  
  // Available courses
  if (lowerMessage.includes('متاحة') || lowerMessage.includes('available')) {
    return `📚 المقررات المتاحة:\n\nلديك ${courses?.length || 0} مقرر متاح في مستواك الحالي (${userInfo?.level || 1}).\n\nاذهب إلى صفحة "المقررات المتاحة" لرؤية القائمة الكاملة!`;
  }
  
  // Schedule
  if (lowerMessage.includes('جدول') || lowerMessage.includes('schedule')) {
    return `📅 للاطلاع على جدولك الدراسي:\n\nاذهب إلى صفحة "الجدول الدراسي" من القائمة الجانبية.\n\nستجد هناك جميع مقرراتك المسجلة مع أوقات المحاضرات!`;
  }
  
  // GPA
  if (lowerMessage.includes('معدل') || lowerMessage.includes('gpa')) {
    return `📊 معدلك التراكمي الحالي: ${userInfo?.gpa || 'غير محدد'}\n\nللاطلاع على تفاصيل أكثر، اذهب إلى صفحة "التقارير الأكاديمية"`;
  }
  
  // Default response
  return `🤔 عذراً، لم أفهم سؤالك بالكامل.\n\nيمكنني مساعدتك في:\n• تسجيل المقررات\n• عرض الجدول\n• الاستفسار عن المعدل\n• أسئلة عامة عن النظام\n\nجرب سؤالاً آخر!`;
}

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

    console.log('🔍 Fetching courses - Level:', level, 'Department:', department);

    // Get all courses from KV
    let allCoursesKeys = await kv.getByPrefix('course:');
    console.log('📦 Found', allCoursesKeys.length, 'courses in KV');
    
    // If no courses in KV, load default courses
    if (allCoursesKeys.length === 0) {
      console.log('⚠️ No courses in KV, loading default courses...');
      console.log('📚 ALL_COURSES length:', ALL_COURSES.length);
      
      if (!ALL_COURSES || ALL_COURSES.length === 0) {
        console.error('❌ ALL_COURSES is empty or undefined!');
        return c.json({ error: 'No courses data available', courses: [] }, 200);
      }
      
      for (const course of ALL_COURSES) {
        try {
          await kv.set(`course:${course.course_id}`, course);
        } catch (err) {
          console.error('❌ Error storing course:', course.course_id, err);
        }
      }
      allCoursesKeys = await kv.getByPrefix('course:');
      console.log('✅ Loaded', allCoursesKeys.length, 'default courses to KV');
    }
    
    let courses = allCoursesKeys.map(item => item.value).filter(course => course != null);
    console.log('✅ After filtering null:', courses.length, 'courses');

    // Filter by level if specified
    if (level) {
      courses = courses.filter(course => course && course.level === parseInt(level));
      console.log(`📊 After level filter (${level}):`, courses.length, 'courses');
    }

    // Filter by department if specified
    if (department) {
      courses = courses.filter(course => course && course.department === department);
      console.log(`🏢 After department filter (${department}):`, courses.length, 'courses');
    }

    // Sort by level and code
    courses.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.code.localeCompare(b.code);
    });

    console.log('✅ Returning', courses.length, 'courses');
    return c.json({ courses });
  } catch (error: any) {
    console.error('❌ Error fetching courses:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({ error: `Failed to fetch courses: ${error.message}` }, 500);
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
    console.log('🆕 POST /admin/courses - Creating new course...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('❌ No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const studentId = await kv.get(`auth:${user.id}`);
    console.log('👤 Student ID:', studentId);
    
    const studentData = await kv.get(`student:${studentId}`);
    console.log('👤 Student data:', studentData);
    
    if (!studentData || studentData.role !== 'admin') {
      console.log('❌ User is not admin');
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const courseData = await c.req.json();
    console.log('📝 Course data received:', courseData);
    
    // Validate required fields
    if (!courseData.course_id || !courseData.code || !courseData.name_ar || !courseData.name_en || !courseData.credit_hours || !courseData.level) {
      console.log('❌ Missing required fields');
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if course already exists
    const existing = await kv.get(`course:${courseData.course_id}`);
    if (existing) {
      console.log('⚠️ Course already exists:', courseData.course_id);
      return c.json({ error: 'Course already exists' }, 400);
    }

    const newCourse: Course = {
      ...courseData,
      department: courseData.department || 'MIS',
      prerequisites: courseData.prerequisites || [],
      created_at: new Date().toISOString(),
    };

    console.log('💾 Saving course to KV:', newCourse);
    await kv.set(`course:${courseData.course_id}`, newCourse);
    
    // Verify it was saved
    const savedCourse = await kv.get(`course:${courseData.course_id}`);
    console.log('✅ Course saved and verified:', savedCourse ? 'SUCCESS' : 'FAILED');

    return c.json({
      success: true,
      message: 'Course created successfully',
      course: newCourse,
    });
  } catch (error: any) {
    console.error('❌ Error creating course:', error);
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
    
    if (!studentData || studentData.role !== 'admin') {
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
    
    if (!userData || userData.role !== 'admin') {
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
    
    if (!userData || userData.role !== 'admin') {
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
    
    if (!userData || userData.role !== 'admin') {
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
    
    if (!userData || userData.role !== 'admin') {
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
    const adminUserId = await kv.get(`auth:${user.id}`);
    const adminUserData = await kv.get(`student:${adminUserId}`);
    
    if (!adminUserData || adminUserData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Get all supervisors from KV (including admins)
    const allUsersKeys = await kv.getByPrefix('student:');
    const supervisors = allUsersKeys
      .map(item => item.value)
      .filter(user => user && (user.role === 'supervisor' || user.role === 'admin'))
      .map(user => ({
        user_id: user.id || user.user_id,
        full_name: user.name || user.full_name,
        email: user.email,
        role: user.role,
        department: user.department || 'نظم المعلومات الإدارية',
        created_at: user.created_at || new Date().toISOString(),
      }));

    console.log(`📋 Found ${supervisors.length} supervisors/admins`);

    return c.json({ supervisors });
  } catch (error: any) {
    console.error('Error fetching supervisors:', error);
    return c.json({ error: 'Failed to fetch supervisors' }, 500);
  }
});

// Admin: Add supervisor
app.post('/make-server-1573e40a/admin/add-supervisor', async (c) => {
  try {
    console.log('📝 POST /admin/add-supervisor - Starting...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.error('❌ No access token provided');
      return c.json({ error: 'Unauthorized - No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    console.log('✅ Admin authenticated:', user.id);

    // Check if user is admin
    const adminUserId = await kv.get(`auth:${user.id}`);
    if (!adminUserId) {
      console.error('❌ Admin user ID not found for auth:', user.id);
      return c.json({ error: 'Unauthorized - User not found' }, 401);
    }
    
    const adminUserData = await kv.get(`student:${adminUserId}`);
    console.log('👤 Admin user data:', adminUserData);
    
    if (!adminUserData || adminUserData.role !== 'admin') {
      console.error('❌ User is not admin. Role:', adminUserData?.role);
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { fullName, email, password, department, role } = await c.req.json();

    console.log('📝 Adding new supervisor:', { fullName, email, role: role || 'supervisor' });

    if (!fullName || !email || !password) {
      console.error('❌ Missing required fields');
      return c.json({ error: 'Missing required fields: fullName, email, password' }, 400);
    }

    if (!email.endsWith('@kku.edu.sa')) {
      console.error('❌ Invalid email domain');
      return c.json({ error: 'Must use university email (@kku.edu.sa)' }, 400);
    }

    // Check if email already exists
    const existingUserId = await kv.get(`email:${email}`);
    if (existingUserId) {
      console.error('❌ Email already registered:', email);
      return c.json({ error: 'Email already registered' }, 400);
    }

    console.log('🔐 Creating Supabase Auth user...');
    
    // Create user in Supabase Auth
    const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: role || 'supervisor',
      },
    });

    if (createUserError || !authData?.user) {
      console.error('❌ Failed to create auth user:', createUserError);
      return c.json({ error: createUserError?.message || 'Failed to create auth user' }, 400);
    }

    const authUser = authData.user;
    console.log('✅ Auth user created:', authUser.id);

    // Create supervisor/admin ID from email
    const newUserId = email.split('@')[0];
    console.log('📋 New user ID:', newUserId);

    // Prepare user data
    const supervisorData = {
      id: newUserId,
      name: fullName,
      email,
      role: role || 'supervisor', // supervisor or admin
      department: department || 'نظم المعلومات الإدارية',
      auth_id: authUser.id,
      created_at: new Date().toISOString(),
    };

    console.log('💾 Storing supervisor data in KV...');

    // Store in KV with all necessary mappings
    await kv.set(`student:${newUserId}`, supervisorData);
    await kv.set(`email:${email}`, newUserId);
    await kv.set(`auth:${authUser.id}`, newUserId);

    console.log('✅ Supervisor/Admin created successfully:', newUserId);
    console.log('✅ Full supervisor data:', supervisorData);

    return c.json({
      success: true,
      message: 'Supervisor created successfully',
      supervisor: {
        user_id: newUserId,
        full_name: fullName,
        email,
        role: role || 'supervisor',
        department: department || 'نظم المعلومات الإدارية',
        created_at: supervisorData.created_at,
      },
    });
  } catch (error: any) {
    console.error('❌ Error adding supervisor:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({ error: error.message || 'Failed to add supervisor' }, 500);
  }
});

// Admin: Delete supervisor
app.delete('/make-server-1573e40a/admin/delete-supervisor', async (c) => {
  try {
    console.log('🗑️ DELETE /admin/delete-supervisor - Starting...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.error('❌ No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('✅ Admin authenticated:', user.id);

    // Check if user is admin
    const adminUserId = await kv.get(`auth:${user.id}`);
    const adminUserData = await kv.get(`student:${adminUserId}`);
    
    if (!adminUserData || adminUserData.role !== 'admin') {
      console.error('❌ User is not admin. Role:', adminUserData?.role);
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { userId, supervisorId } = await c.req.json();
    const targetId = userId || supervisorId;
    
    if (!targetId) {
      console.error('❌ No user ID provided');
      return c.json({ error: 'User ID is required' }, 400);
    }

    console.log('🗑️ Deleting supervisor/admin:', targetId);

    // Get supervisor data
    const supervisorData = await kv.get(`student:${targetId}`);
    
    if (!supervisorData) {
      console.error('❌ Supervisor not found:', targetId);
      return c.json({ error: 'Supervisor not found' }, 404);
    }

    console.log('📋 Supervisor data:', supervisorData);

    // Prevent deleting yourself
    if (adminUserId === targetId) {
      console.error('❌ Cannot delete yourself');
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    // Delete from Supabase Auth
    if (supervisorData.auth_id) {
      try {
        console.log('🔐 Deleting from Supabase Auth:', supervisorData.auth_id);
        await supabase.auth.admin.deleteUser(supervisorData.auth_id);
        console.log('✅ Deleted from Supabase Auth');
      } catch (err) {
        console.log('⚠️ Could not delete auth user:', err);
      }
    }

    // Delete all mappings
    console.log('💾 Deleting KV mappings...');
    await kv.del(`student:${targetId}`);
    await kv.del(`email:${supervisorData.email}`);
    if (supervisorData.auth_id) {
      await kv.del(`auth:${supervisorData.auth_id}`);
    }

    console.log('✅ Supervisor deleted successfully:', targetId);

    return c.json({
      success: true,
      message: 'Supervisor deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deleting supervisor:', error);
    console.error('❌ Error stack:', error.stack);
    return c.json({ error: error.message || 'Failed to delete supervisor' }, 500);
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
      courses = coursesKeys.map(item => item.value).filter(c => c != null);
    } else {
      // If no courses in KV, load default courses first
      console.log('⚠️ No courses in KV for admin, loading default courses...');
      for (const course of ALL_COURSES) {
        await kv.set(`course:${course.course_id}`, course);
      }
      
      // Fetch again after loading
      const newCoursesKeys = await kv.getByPrefix('course:');
      courses = newCoursesKeys.map(item => item.value).filter(c => c != null);
      console.log('✅ Loaded', courses.length, 'default courses to KV for admin');
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
    const existingCourse = coursesKeys.find(item => item && item.value && item.value.code === courseData.code);
    
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
      instructor: courseData.instructor || '',
      semester: courseData.semester || '',
      course_type: courseData.course_type || 'mandatory',
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

// ===============================
// ADDITIONAL ADMIN ENDPOINTS
// ===============================

// Admin: Update student data (Full Access)
app.put('/make-server-1573e40a/admin/students/:studentId', async (c) => {
  try {
    console.log('✏️ PUT /admin/students/:studentId - Updating student data...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const adminStudentId = await kv.get(`auth:${user.id}`);
    const adminData = await kv.get(`student:${adminStudentId}`);
    
    if (!adminData || adminData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const studentId = c.req.param('studentId');
    const updates = await c.req.json();
    
    // Get existing student data
    const existingStudent = await kv.get(`student:${studentId}`);
    if (!existingStudent) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Update student data
    const updatedStudent = {
      ...existingStudent,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`student:${studentId}`, updatedStudent);
    console.log('✅ Student updated:', studentId);

    return c.json({
      success: true,
      message: 'Student updated successfully',
      student: updatedStudent,
    });
  } catch (error: any) {
    console.error('❌ Error updating student:', error);
    return c.json({ error: 'Failed to update student' }, 500);
  }
});

// Admin: Change user role (Student / Supervisor / Admin)
app.put('/make-server-1573e40a/admin/change-role', async (c) => {
  try {
    console.log('🔄 PUT /admin/change-role - Changing user role...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const adminStudentId = await kv.get(`auth:${user.id}`);
    const adminData = await kv.get(`student:${adminStudentId}`);
    
    if (!adminData || adminData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { studentId, newRole } = await c.req.json();
    
    if (!studentId || !newRole) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['student', 'supervisor', 'admin'].includes(newRole)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Get student data
    const studentData = await kv.get(`student:${studentId}`);
    if (!studentData) {
      return c.json({ error: 'Student not found' }, 404);
    }

    // Update role
    studentData.role = newRole;
    studentData.updated_at = new Date().toISOString();
    
    await kv.set(`student:${studentId}`, studentData);
    console.log(`✅ Role changed for ${studentId}: ${newRole}`);

    return c.json({
      success: true,
      message: 'Role changed successfully',
      student: studentData,
    });
  } catch (error: any) {
    console.error('❌ Error changing role:', error);
    return c.json({ error: 'Failed to change role' }, 500);
  }
});

// Admin/Supervisor: Approve/Reject registration requests
app.put('/make-server-1573e40a/admin/registration-request/:requestId', async (c) => {
  try {
    console.log('✅ PUT /admin/registration-request/:requestId - Processing request...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin or supervisor
    const userStudentId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userStudentId}`);
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'supervisor')) {
      return c.json({ error: 'Forbidden: Admin or Supervisor access required' }, 403);
    }

    const requestId = c.req.param('requestId');
    const { action, reason } = await c.req.json(); // action: 'approve' | 'reject'
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return c.json({ error: 'Invalid action' }, 400);
    }

    // Get request data
    const requestData = await kv.get(`registration_request:${requestId}`);
    if (!requestData) {
      return c.json({ error: 'Request not found' }, 404);
    }

    // Update request status
    requestData.status = action === 'approve' ? 'approved' : 'rejected';
    requestData.processed_by = userStudentId;
    requestData.processed_at = new Date().toISOString();
    if (reason) requestData.reason = reason;

    await kv.set(`registration_request:${requestId}`, requestData);
    console.log(`✅ Request ${requestId} ${action}ed`);

    // If approved, add course to student's registered courses
    if (action === 'approve') {
      const studentCourses = await kv.get(`student_courses:${requestData.student_id}`) || [];
      studentCourses.push({
        course_id: requestData.course_id,
        registered_at: new Date().toISOString(),
        semester: requestData.semester || 'current',
      });
      await kv.set(`student_courses:${requestData.student_id}`, studentCourses);
    }

    return c.json({
      success: true,
      message: `Request ${action}ed successfully`,
      request: requestData,
    });
  } catch (error: any) {
    console.error('❌ Error processing request:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
});

// Admin/Supervisor: Process registration request (Approve/Reject) - New Endpoint
app.post('/make-server-1573e40a/admin/process-registration-request', async (c) => {
  try {
    console.log('✅ POST /admin/process-registration-request - Processing request...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin or supervisor
    const userStudentId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userStudentId}`);
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'supervisor')) {
      return c.json({ error: 'Forbidden: Admin or Supervisor access required' }, 403);
    }

    const { request_id, action, note } = await c.req.json(); // action: 'approve' | 'reject'
    
    if (!request_id || !action || !['approve', 'reject'].includes(action)) {
      return c.json({ error: 'Invalid request parameters' }, 400);
    }

    console.log('📋 Request ID:', request_id);
    console.log('🔄 Action:', action);

    // Get request data
    const requestData = await kv.get(`registration_request:${request_id}`);
    if (!requestData) {
      console.error('❌ Request not found:', request_id);
      return c.json({ error: 'Request not found' }, 404);
    }

    console.log('📦 Request data:', requestData);

    // Update request status
    requestData.status = action === 'approve' ? 'approved' : 'rejected';
    requestData.processed_by = userStudentId;
    requestData.processed_at = new Date().toISOString();
    if (note) requestData.reason = note;

    await kv.set(`registration_request:${request_id}`, requestData);
    console.log(`✅ Request ${request_id} ${action}ed`);

    // Also update the registration record
    if (requestData.registration_id) {
      const registration = await kv.get(`registration:${requestData.registration_id}`);
      if (registration) {
        registration.status = action === 'approve' ? 'approved' : 'rejected';
        registration.processed_at = new Date().toISOString();
        await kv.set(`registration:${requestData.registration_id}`, registration);
        console.log('✅ Registration record updated');
      }
    }

    // If approved, add course to student's registered courses
    if (action === 'approve') {
      const studentCourses = await kv.get(`student_courses:${requestData.student_id}`) || [];
      studentCourses.push({
        course_id: requestData.course_id,
        registered_at: new Date().toISOString(),
        semester: requestData.semester || 'current',
        registration_id: requestData.registration_id,
      });
      await kv.set(`student_courses:${requestData.student_id}`, studentCourses);
      console.log('✅ Course added to student courses');
    }

    // Create notification for student
    try {
      const courseData = await kv.get(`course:${requestData.course_id}`);
      await createNotification({
        userId: requestData.student_id,
        userRole: 'student',
        type: action === 'approve' ? 'registration_approved' : 'registration_rejected',
        titleAr: action === 'approve' ? '✅ تمت الموافقة على طلب التسجيل' : '❌ تم رفض طلب التسجيل',
        titleEn: action === 'approve' ? '✅ Registration Approved' : '❌ Registration Rejected',
        messageAr: action === 'approve' 
          ? `تمت الموافقة على تسجيلك في مقرر ${courseData?.name_ar || requestData.course_id}`
          : `تم رفض طلب تسجيلك في مقرر ${courseData?.name_ar || requestData.course_id}. ${note || ''}`,
        messageEn: action === 'approve'
          ? `Your registration for ${courseData?.name_en || requestData.course_id} has been approved`
          : `Your registration request for ${courseData?.name_en || requestData.course_id} has been rejected. ${note || ''}`,
        relatedId: requestData.registration_id || request_id,
      });
      console.log('✅ Notification created for student');
    } catch (notifError) {
      console.error('⚠️ Failed to create notification:', notifError);
      // Don't fail the request if notification creation fails
    }

    return c.json({
      success: true,
      message: `Request ${action}ed successfully`,
      request: requestData,
    });
  } catch (error: any) {
    console.error('❌ Error processing request:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
});

// Admin: Get all students (Full System Access)
app.get('/make-server-1573e40a/admin/all-students', async (c) => {
  try {
    console.log('👥 GET /admin/all-students - Fetching all students...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const adminStudentId = await kv.get(`auth:${user.id}`);
    const adminData = await kv.get(`student:${adminStudentId}`);
    
    if (!adminData || adminData.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Get all students
    const allStudents = await kv.getByPrefix('student:');
    const students = allStudents.map(item => item.value).filter(s => s != null);

    console.log(`✅ Found ${students.length} students`);

    return c.json({ students });
  } catch (error: any) {
    console.error('❌ Error fetching students:', error);
    return c.json({ error: 'Failed to fetch students' }, 500);
  }
});

// Admin/Supervisor: Get all registration requests
app.get('/make-server-1573e40a/admin/registration-requests', async (c) => {
  try {
    console.log('📋 GET /admin/registration-requests - Fetching all requests...');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin or supervisor
    const userStudentId = await kv.get(`auth:${user.id}`);
    const userData = await kv.get(`student:${userStudentId}`);
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'supervisor')) {
      return c.json({ error: 'Forbidden: Admin or Supervisor access required' }, 403);
    }

    // Get all registration requests
    const allRequests = await kv.getByPrefix('registration_request:');
    let requests = allRequests.map(item => item.value).filter(r => r != null);

    // Enrich requests with student and course data
    for (let request of requests) {
      // Get student data
      const studentData = await kv.get(`student:${request.student_id}`);
      if (studentData) {
        request.student = {
          full_name: studentData.full_name,
          email: studentData.email,
          level: studentData.level,
          major: studentData.major,
        };
      }

      // Get course data
      const courseData = await kv.get(`course:${request.course_id}`);
      if (courseData) {
        request.course = {
          code: courseData.code,
          name_ar: courseData.name_ar,
          name_en: courseData.name_en,
          credit_hours: courseData.credit_hours,
          level: courseData.level,
        };
      }
    }

    // Sort by date (newest first)
    requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`✅ Found ${requests.length} registration requests with enriched data`);

    return c.json({ requests });
  } catch (error: any) {
    console.error('❌ Error fetching requests:', error);
    return c.json({ error: 'Failed to fetch requests' }, 500);
  }
});

// Get notifications for user
app.get('/make-server-1573e40a/notifications', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user ID from auth
    const userId = await kv.get(`auth:${user.id}`);
    if (!userId) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Get all notifications for this user
    const notificationsData = await kv.getByPrefix(`notification:${userId}:`);
    const notifications = notificationsData
      .map((item: any) => item.value)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`✅ Found ${notifications.length} notifications for user ${userId}`);

    return c.json({ notifications });
  } catch (error: any) {
    console.error('❌ Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Mark notification as read
app.put('/make-server-1573e40a/notifications/:notificationId/read', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('notificationId');
    
    // Get notification
    const notification = await kv.get(notificationId);
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    // Update notification
    notification.is_read = true;
    notification.read_at = new Date().toISOString();

    await kv.set(notificationId, notification);

    console.log(`✅ Notification ${notificationId} marked as read`);

    return c.json({ success: true, notification });
  } catch (error: any) {
    console.error('❌ Error marking notification as read:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// Get unread notifications count
app.get('/make-server-1573e40a/notifications/unread/count', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const accessToken = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user ID from auth
    const userId = await kv.get(`auth:${user.id}`);
    if (!userId) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Get all notifications for this user
    const notificationsData = await kv.getByPrefix(`notification:${userId}:`);
    const unreadCount = notificationsData.filter((item: any) => !item.value.is_read).length;

    console.log(`✅ User ${userId} has ${unreadCount} unread notifications`);

    return c.json({ count: unreadCount });
  } catch (error: any) {
    console.error('❌ Error fetching unread count:', error);
    return c.json({ error: 'Failed to fetch unread count' }, 500);
  }
});

Deno.serve(app.fetch);