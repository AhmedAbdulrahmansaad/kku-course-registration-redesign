import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

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

// Signup route - Create new user account
app.post('/make-server-1573e40a/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { fullName, studentId, email, password, gpa, major, level, role } = body;

    // Validation
    if (!fullName || !studentId || !email || !password || !major || !level) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Validate student ID format (9 digits)
    if (!/^\d{9}$/.test(studentId)) {
      return c.json({ error: 'Invalid student ID format' }, 400);
    }

    // Validate email domain
    if (!email.endsWith('@kku.edu.sa')) {
      return c.json({ error: 'Must use university email (@kku.edu.sa)' }, 400);
    }

    // Check if student ID already exists
    const existingStudent = await kv.get(`student:${studentId}`);
    if (existingStudent) {
      // إذا كان الحساب موجود، احذف البيانات القديمة أولاً
      console.log('Student ID already exists, removing old data...');
      
      // احذف البيانات القديمة من KV
      await kv.del(`student:${studentId}`);
      
      // احذف mapping القديم للبريد إذا كان مختلف
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

    // Check if email already exists
    const existingEmail = await kv.get(`email:${email}`);
    if (existingEmail) {
      // إذا كان البريد موجود، احذف البيانات القديمة
      console.log('Email already exists, removing old data...');
      
      // احذف الحساب القديم المرتبط بهذا البريد
      const oldStudentData = await kv.get(`student:${existingEmail}`);
      if (oldStudentData) {
        await kv.del(`student:${existingEmail}`);
        if (oldStudentData.auth_id) {
          await kv.del(`auth:${oldStudentData.auth_id}`);
          try {
            await supabase.auth.admin.deleteUser(oldStudentData.auth_id);
          } catch (err) {
            console.log('Could not delete old auth user:', err);
          }
        }
      }
      
      await kv.del(`email:${email}`);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server
      user_metadata: {
        full_name: fullName,
        student_id: studentId,
        major,
        level,
        role: role || 'student',
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return c.json({ error: authError.message }, 500);
    }

    // Store student data in KV
    const studentData = {
      student_id: studentId,
      full_name: fullName,
      email,
      major,
      level: parseInt(level),
      gpa: gpa ? parseFloat(gpa) : null,
      role: role || 'student',
      auth_id: authData.user.id,
      created_at: new Date().toISOString(),
    };

    await kv.set(`student:${studentId}`, studentData);
    await kv.set(`email:${email}`, studentId);
    await kv.set(`auth:${authData.user.id}`, studentId);

    return c.json({ 
      success: true, 
      message: 'Account created successfully',
      studentId,
    });
  } catch (error: any) {
    console.error('Error in signup endpoint:', error);
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
        registrations.push(reg);
      }
    }

    return c.json({ registrations });
  } catch (error: any) {
    console.error('Error in my-registrations endpoint:', error);
    return c.json({ error: 'Failed to get registrations' }, 500);
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

// Create demo accounts for testing (Development only!)
app.post('/make-server-1573e40a/create-demo-accounts', async (c) => {
  try {
    console.log('🔧 Creating demo accounts for RBAC testing...');

    const demoAccounts = [
      {
        fullName: 'طالب تجريبي',
        studentId: '442012345',
        email: 'student@kku.edu.sa',
        password: 'Student@123',
        major: 'نظم المعلومات الإدارية',
        level: 3,
        gpa: 4.5,
        role: 'student',
      },
      {
        fullName: 'مشرف أكاديمي تجريبي',
        studentId: '442999001',
        email: 'supervisor@kku.edu.sa',
        password: 'Supervisor@123',
        major: 'نظم المعلومات الإدارية',
        level: 8,
        gpa: null,
        role: 'supervisor',
      },
      {
        fullName: 'مدير النظام',
        studentId: '442999999',
        email: 'admin@kku.edu.sa',
        password: 'Admin@123',
        major: 'نظم المعلومات الإدارية',
        level: 8,
        gpa: null,
        role: 'admin',
      },
    ];

    const results = [];

    for (const account of demoAccounts) {
      try {
        // Delete existing data if any
        const existingStudent = await kv.get(`student:${account.studentId}`);
        if (existingStudent) {
          await kv.del(`student:${account.studentId}`);
          if (existingStudent.email) {
            await kv.del(`email:${existingStudent.email}`);
          }
          if (existingStudent.auth_id) {
            await kv.del(`auth:${existingStudent.auth_id}`);
            try {
              await supabase.auth.admin.deleteUser(existingStudent.auth_id);
            } catch (err) {
              console.log('Could not delete old user:', err);
            }
          }
        }

        // Create new user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            full_name: account.fullName,
            student_id: account.studentId,
            major: account.major,
            level: account.level,
            role: account.role,
          },
        });

        if (authError) {
          console.error(`Failed to create ${account.role}:`, authError);
          results.push({
            role: account.role,
            email: account.email,
            success: false,
            error: authError.message,
          });
          continue;
        }

        // Store in KV
        const studentData = {
          student_id: account.studentId,
          full_name: account.fullName,
          email: account.email,
          major: account.major,
          level: account.level,
          gpa: account.gpa,
          role: account.role,
          auth_id: authData.user.id,
          created_at: new Date().toISOString(),
        };

        await kv.set(`student:${account.studentId}`, studentData);
        await kv.set(`email:${account.email}`, account.studentId);
        await kv.set(`auth:${authData.user.id}`, account.studentId);

        results.push({
          role: account.role,
          email: account.email,
          password: account.password,
          studentId: account.studentId,
          success: true,
        });

        console.log(`✅ Created ${account.role}: ${account.email}`);
      } catch (error: any) {
        console.error(`Error creating ${account.role}:`, error);
        results.push({
          role: account.role,
          email: account.email,
          success: false,
          error: error.message,
        });
      }
    }

    return c.json({
      success: true,
      message: 'Demo accounts created',
      accounts: results,
    });
  } catch (error: any) {
    console.error('Error creating demo accounts:', error);
    return c.json({ error: 'Failed to create demo accounts' }, 500);
  }
});

Deno.serve(app.fetch);