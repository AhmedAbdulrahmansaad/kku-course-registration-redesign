import { createClient } from 'jsr:@supabase/supabase-js@2';

// ========================================
// AI ASSISTANT WITH REAL DATABASE CONNECTION
// ========================================

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to get user from auth token
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

// دالة لجلب بيانات الطالب الكاملة
async function getStudentData(studentId: number) {
  try {
    // جلب بيانات الطالب الأساسية
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!student) return null;

    // جلب المقررات المسجلة
    const { data: registrations } = await supabase
      .from('registrations')
      .select(`
        *,
        courses (
          id,
          code,
          name_ar,
          name_en,
          credits,
          level,
          semester,
          department
        )
      `)
      .eq('student_id', studentId);

    // تصنيف المقررات حسب الحالة
    const approvedCourses = registrations?.filter(r => r.status === 'approved') || [];
    const pendingCourses = registrations?.filter(r => r.status === 'pending') || [];
    const rejectedCourses = registrations?.filter(r => r.status === 'rejected') || [];

    // حساب الساعات
    const registeredCredits = approvedCourses.reduce((sum, r) => sum + (r.courses?.credits || 0), 0);
    const completedCredits = student.completed_credits || 0;
    const remainingCredits = 140 - completedCredits; // إجمالي الساعات للتخرج 140

    // جلب المقررات المتاحة حسب مستوى الطالب
    const { data: availableCourses } = await supabase
      .from('courses')
      .select('*')
      .lte('level', student.level || 1)
      .eq('active', true)
      .order('level', { ascending: true });

    return {
      student,
      registrations: {
        all: registrations || [],
        approved: approvedCourses,
        pending: pendingCourses,
        rejected: rejectedCourses,
        count: {
          total: registrations?.length || 0,
          approved: approvedCourses.length,
          pending: pendingCourses.length,
          rejected: rejectedCourses.length
        }
      },
      credits: {
        completed: completedCredits,
        registered: registeredCredits,
        remaining: remainingCredits,
        total: 140
      },
      availableCourses: availableCourses || []
    };
  } catch (error) {
    console.error('❌ Error fetching student data:', error);
    return null;
  }
}

// دالة لجلب بيانات المشرف الكاملة
async function getSupervisorData(supervisorId: number) {
  try {
    // جلب بيانات المشرف الأساسية
    const { data: supervisor } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', supervisorId)
      .single();

    if (!supervisor) return null;

    // جلب طلبات التسجيل المعلقة
    const { data: pendingRequests } = await supabase
      .from('registrations')
      .select(`
        *,
        students (
          id,
          student_id,
          major,
          level,
          gpa,
          users (name, email)
        ),
        courses (
          id,
          code,
          name_ar,
          name_en,
          credits,
          level
        )
      `)
      .eq('supervisor_id', supervisorId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    // جلب جميع طلبات التسجيل
    const { data: allRequests } = await supabase
      .from('registrations')
      .select('id, status')
      .eq('supervisor_id', supervisorId);

    // جلب الطلاب المشرف عليهم
    const { data: supervisedStudents } = await supabase
      .from('students')
      .select(`
        *,
        users (name, email)
      `)
      .eq('supervisor_id', supervisorId);

    return {
      supervisor,
      requests: {
        pending: pendingRequests || [],
        all: allRequests || [],
        count: {
          total: allRequests?.length || 0,
          pending: pendingRequests?.length || 0,
          approved: allRequests?.filter(r => r.status === 'approved').length || 0,
          rejected: allRequests?.filter(r => r.status === 'rejected').length || 0
        }
      },
      students: supervisedStudents || []
    };
  } catch (error) {
    console.error('❌ Error fetching supervisor data:', error);
    return null;
  }
}

// دالة لجلب إحصائيات المدير الكاملة
async function getAdminStats() {
  try {
    // جلب جميع الطلاب
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, major, level, gpa, completed_credits');

    // جلب جميع المقررات
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, code, name_ar, name_en, active, credits, level');

    // جلب جميع التسجيلات
    const { data: allRegistrations } = await supabase
      .from('registrations')
      .select('id, status, created_at');

    // جلب جميع المشرفين
    const { data: allSupervisors } = await supabase
      .from('supervisors')
      .select('id, department');

    // جلب جميع المستخدمين
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, role, active');

    // حساب الإحصائيات
    const stats = {
      students: {
        total: allStudents?.length || 0,
        byMajor: {} as Record<string, number>,
        byLevel: {} as Record<string, number>,
        averageGPA: 0
      },
      courses: {
        total: allCourses?.length || 0,
        active: allCourses?.filter(c => c.active).length || 0,
        inactive: allCourses?.filter(c => !c.active).length || 0,
        byLevel: {} as Record<string, number>
      },
      registrations: {
        total: allRegistrations?.length || 0,
        pending: allRegistrations?.filter(r => r.status === 'pending').length || 0,
        approved: allRegistrations?.filter(r => r.status === 'approved').length || 0,
        rejected: allRegistrations?.filter(r => r.status === 'rejected').length || 0
      },
      supervisors: {
        total: allSupervisors?.length || 0,
        byDepartment: {} as Record<string, number>
      },
      users: {
        total: allUsers?.length || 0,
        active: allUsers?.filter(u => u.active).length || 0,
        inactive: allUsers?.filter(u => !u.active).length || 0,
        students: allUsers?.filter(u => u.role === 'student').length || 0,
        supervisors: allUsers?.filter(u => u.role === 'supervisor').length || 0,
        admins: allUsers?.filter(u => u.role === 'admin').length || 0
      }
    };

    // تجميع الطلاب حسب التخصص
    allStudents?.forEach(s => {
      const major = s.major || 'غير محدد';
      stats.students.byMajor[major] = (stats.students.byMajor[major] || 0) + 1;
    });

    // تجميع الطلاب حسب المستوى
    allStudents?.forEach(s => {
      const level = `${s.level || 1}`;
      stats.students.byLevel[level] = (stats.students.byLevel[level] || 0) + 1;
    });

    // حساب متوسط المعدل التراكمي
    const totalGPA = allStudents?.reduce((sum, s) => sum + (s.gpa || 0), 0) || 0;
    stats.students.averageGPA = allStudents?.length ? totalGPA / allStudents.length : 0;

    // تجميع المقررات حسب المستوى
    allCourses?.forEach(c => {
      const level = `${c.level || 1}`;
      stats.courses.byLevel[level] = (stats.courses.byLevel[level] || 0) + 1;
    });

    // تجميع المشرفين حسب القسم
    allSupervisors?.forEach(s => {
      const dept = s.department || 'غير محدد';
      stats.supervisors.byDepartment[dept] = (stats.supervisors.byDepartment[dept] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    return null;
  }
}

// دالة لإنشاء سياق المساعد الذكي حسب الدور
export function buildAIContext(role: string, userName: string, data: any, language: string) {
  if (role === 'admin') {
    const stats = data || {};
    return {
      system: language === 'ar'
        ? `أنت مساعد ذكي لمدير نظام تسجيل المقررات في جامعة الملك خالد - كلية إدارة الأعمال - قسم نظم المعلومات الإدارية.

المدير: ${userName}

📊 إحصائيات النظام الحقيقية من قاعدة البيانات:

👥 الطلاب:
• إجمالي الطلاب: ${stats.students?.total || 0}
• متوسط المعدل التراكمي: ${stats.students?.averageGPA?.toFixed(2) || '0.00'}
• توزيع حسب التخصص: ${Object.entries(stats.students?.byMajor || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
• توزيع حسب المستوى: ${Object.entries(stats.students?.byLevel || {}).map(([k, v]) => `المستوى ${k}: ${v}`).join(', ')}

📚 المقررات:
• إجمالي المقررات: ${stats.courses?.total || 0}
• المقررات النشطة: ${stats.courses?.active || 0}
• المقررات غير النشطة: ${stats.courses?.inactive || 0}

📝 التسجيلات:
• إجمالي التسجيلات: ${stats.registrations?.total || 0}
• المعتمدة: ${stats.registrations?.approved || 0}
• المعلقة: ${stats.registrations?.pending || 0}
• المرفوضة: ${stats.registrations?.rejected || 0}

👨‍🏫 المشرفين:
• إجمالي المشرفين: ${stats.supervisors?.total || 0}
• توزيع حسب القسم: ${Object.entries(stats.supervisors?.byDepartment || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}

👤 المستخدمين:
• إجمالي المستخدمين: ${stats.users?.total || 0}
• النشطون: ${stats.users?.active || 0}
• غير النشطين: ${stats.users?.inactive || 0}

استخدم هذه الأرقام الحقيقية عند الإجابة على أسئلة المدير.
يمكنك مساعدة المدير في:
- عرض الإحصائيات التفصيلية
- تحليل البيانات الأكاديمية
- اكتشاف الأنماط والاتجاهات
- تقديم توصيات لتحسين النظام
- الإجابة عن الأسئلة الإدارية

أجب بشكل مهني ودقيق باللغة العربية مع استخدام الأرقام الحقيقية.`
        : `You are a smart assistant for the course registration system administrator at King Khalid University.

Admin: ${userName}

📊 Real System Statistics from Database:

👥 Students:
• Total: ${stats.students?.total || 0}
• Average GPA: ${stats.students?.averageGPA?.toFixed(2) || '0.00'}
• By Major: ${Object.entries(stats.students?.byMajor || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
• By Level: ${Object.entries(stats.students?.byLevel || {}).map(([k, v]) => `Level ${k}: ${v}`).join(', ')}

📚 Courses:
• Total: ${stats.courses?.total || 0}
• Active: ${stats.courses?.active || 0}
• Inactive: ${stats.courses?.inactive || 0}

📝 Registrations:
• Total: ${stats.registrations?.total || 0}
• Approved: ${stats.registrations?.approved || 0}
• Pending: ${stats.registrations?.pending || 0}
• Rejected: ${stats.registrations?.rejected || 0}

👨‍🏫 Supervisors:
• Total: ${stats.supervisors?.total || 0}

Use these real numbers when answering admin questions.
Respond professionally and accurately in English.`,
      user: ''
    };
  }

  if (role === 'supervisor') {
    const supData = data || {};
    return {
      system: language === 'ar'
        ? `أنت مساعد ذكي لمشرف أكاديمي في جامعة الملك خالد - قسم ${supData.supervisor?.department || 'نظم المعلومات الإدارية'}.

المشرف: ${userName}

📊 معلومات الإشراف الحقيقية من قاعدة البيانات:

👥 الطلاب المشرف عليهم: ${supData.students?.length || 0}

📝 طلبات التسجيل:
• إجمالي الطلبات: ${supData.requests?.count?.total || 0}
• المعلقة: ${supData.requests?.count?.pending || 0}
• المعتمدة: ${supData.requests?.count?.approved || 0}
• المرفوضة: ${supData.requests?.count?.rejected || 0}

${supData.requests?.pending?.length > 0 ? `
📋 الطلبات المعلقة:
${supData.requests.pending.slice(0, 5).map((req: any, idx: number) => `
${idx + 1}. الطالب: ${req.students?.users?.name || 'غير معروف'} (${req.students?.student_id})
   المقرر: ${req.courses?.name_ar || req.courses?.code}
   الرمز: ${req.courses?.code}
   الساعات: ${req.courses?.credits}
   المستوى: ${req.courses?.level}
   تاريخ الطلب: ${new Date(req.created_at).toLocaleDateString('ar-SA')}
`).join('\n')}
` : ''}

استخدم هذه المعلومات الحقيقية عند الإجابة.
يمكنك مساعدة المشرف في:
- مراجعة الطلبات المعلقة بالتفصيل
- تقديم توصيات بالموافقة أو الرفض
- عرض معلومات الطلاب المشرف عليهم
- تحليل أداء الطلاب

أجب بشكل مهني ودقيق باللغة العربية.`
        : `You are a smart assistant for an academic supervisor at King Khalid University.

Supervisor: ${userName}

📊 Real Supervision Information from Database:

👥 Supervised Students: ${supData.students?.length || 0}

📝 Registration Requests:
• Total: ${supData.requests?.count?.total || 0}
• Pending: ${supData.requests?.count?.pending || 0}
• Approved: ${supData.requests?.count?.approved || 0}
• Rejected: ${supData.requests?.count?.rejected || 0}

Use this real information when answering.
Respond professionally and accurately in English.`,
      user: ''
    };
  }

  // Student
  const studentData = data || {};
  return {
    system: language === 'ar'
      ? `أنت مساعد ذكي متطور للطلاب في جامعة الملك خالد - كلية إدارة الأعمال - قسم نظم المعلومات الإدارية.

🎓 معلومات الطالب:
• الاسم: ${userName}
• الرقم الجامعي: ${studentData.student?.student_id || 'غير متوفر'}
• التخصص: ${studentData.student?.major || 'نظم المعلومات الإدارية'}
• المستوى: ${studentData.student?.level || 1}
• المعدل التراكمي: ${studentData.student?.gpa?.toFixed(2) || '0.00'}

⭐ الساعات الدراسية:
• الساعات المكتملة: ${studentData.credits?.completed || 0} ساعة
• الساعات المسجلة حالياً: ${studentData.credits?.registered || 0} ساعة
• الساعات المتبقية للتخرج: ${studentData.credits?.remaining || 140} ساعة
• إجمالي الساعات للتخرج: 140 ساعة

📚 حالة المقررات:
• المقررات المعتمدة: ${studentData.registrations?.count?.approved || 0}
• المقررات المعلقة: ${studentData.registrations?.count?.pending || 0}
• المقررات المرفوضة: ${studentData.registrations?.count?.rejected || 0}
• المقررات المتاحة: ${studentData.availableCourses?.length || 0}

${studentData.registrations?.approved?.length > 0 ? `
✅ المقررات المعتمدة:
${studentData.registrations.approved.map((reg: any, idx: number) => `${idx + 1}. ${reg.courses?.name_ar || reg.courses?.code} (${reg.courses?.credits} ساعات)`).join('\n')}
` : ''}

📖 معلومات البرنامج الأكاديمي:
• البرنامج يحتوي على 49 مقرراً موزعة على 8 مستويات
• إجمالي الساعات المطلوبة: 140 ساعة معتمدة
• مقررات إجبارية + مقررات اختيارية
• المقررات تشمل: نظم معلومات، برمجة، قواعد بيانات، شبكات، أمن معلومات، تحليل نظم

🎯 التخصصات المتاحة في كلية إدارة الأعمال (22 تخصصاً):
1. نظم المعلومات الإدارية (MIS)
2. نظم المعلومات - علم البيانات (MIS Data Science)
3. نظم المعلومات - الأمن السيبراني (MIS Cybersecurity)
4. إدارة الأعمال (Business Administration)
5. إدارة الأعمال - ريادة الأعمال (Entrepreneurship)
6. المحاسبة (Accounting)
7. التمويل والاستثمار (Finance & Investment)
8. التسويق (Marketing)
9. التسويق الرقمي (Digital Marketing)
10. الموارد البشرية (HR)
11. الاقتصاد (Economics)
12. إدارة سلاسل الإمداد (Supply Chain)
13. الإدارة الصحية (Health Management)
14. إدارة الفعاليات (Event Management)
15. إدارة المشاريع (Project Management)
16. نظم المعلومات الصحية (Health Information Systems)
17. التجارة الإلكترونية (E-Commerce)
18. الإدارة المالية (Financial Management)
19. التأمين وإدارة المخاطر (Insurance & Risk)
20. الإدارة الرياضية (Sports Management)
21. إدارة الأعمال الدولية (International Business)
22. القانون التجاري (Commercial Law)

💡 قدراتك كمساعد ذكي:
1. حساب الساعات المتبقية والمعدل التراكمي بدقة
2. اقتراح مقررات مناسبة حسب المستوى والتخصص
3. شرح متطلبات التخرج والخطة الدراسية
4. تقديم نصائح أكاديمية مخصصة
5. الإجابة على أسئلة حول النظام والإجراءات
6. مساعدة في التخطيط الأكاديمي والمسار الدراسي
7. تحليل الأداء الأكاديمي وتقديم توصيات

📋 أمثلة على المقررات الأساسية:
• المستوى 1: المهارات اللغوية، الثقافة الإسلامية، مقدمة في الحاسب، مبادئ الإدارة
• المستوى 2: مقدمة في نظم المعلومات، تحليل النظم، البرمجة، الإحصاء
• المستوى 3: قواعد البيانات، الشبكات، إدارة المشاريع، التجارة الإلكترونية
• المستوى 4-8: مقررات تخصصية متقدمة في نظم المعلومات

⚠️ ملاحظات مهمة:
• استخدم فقط الأرقام الحقيقية من البيانات أعلاه
• لا تخترع معلومات أو أرقام غير موجودة
• كن دقيقاً في الحسابات الأكاديمية
• قدم نصائح عملية ومفيدة للطالب
• ركز على مساعدة الطالب في تحقيق أهدافه الأكاديمية

أسلوب الإجابة:
• كن ودوداً ومشجعاً ومحترفاً
• اجعل الإجابات واضحة ومباشرة
• استخدم الأيقونات التعبيرية بشكل مناسب
• قدم أمثلة عملية عند الحاجة
• اختتم بتشجيع أو نصيحة إيجابية`
      : `You are an advanced smart assistant for students at King Khalid University - College of Business Administration - MIS Department.

🎓 Student Information:
• Name: ${userName}
• Student ID: ${studentData.student?.student_id || 'Not available'}
• Major: ${studentData.student?.major || 'MIS'}
• Level: ${studentData.student?.level || 1}
• GPA: ${studentData.student?.gpa?.toFixed(2) || '0.00'}

⭐ Credit Hours:
• Completed Hours: ${studentData.credits?.completed || 0} hours
• Currently Registered: ${studentData.credits?.registered || 0} hours
• Remaining for Graduation: ${studentData.credits?.remaining || 140} hours
• Total Required: 140 hours

📚 Course Status:
• Approved Courses: ${studentData.registrations?.count?.approved || 0}
• Pending Courses: ${studentData.registrations?.count?.pending || 0}
• Rejected Courses: ${studentData.registrations?.count?.rejected || 0}
• Available Courses: ${studentData.availableCourses?.length || 0}

${studentData.registrations?.approved?.length > 0 ? `
✅ Approved Courses:
${studentData.registrations.approved.map((reg: any, idx: number) => `${idx + 1}. ${reg.courses?.name_en || reg.courses?.code} (${reg.courses?.credits} credits)`).join('\n')}
` : ''}

📖 Academic Program Information:
• Program contains 49 courses distributed across 8 levels
• Total required hours: 140 credit hours
• Mandatory courses + Elective courses
• Courses include: Information Systems, Programming, Databases, Networks, Security, Systems Analysis

🎯 Available Majors in College of Business (22 Majors):
1. Management Information Systems (MIS)
2. MIS - Data Science
3. MIS - Cybersecurity
4. Business Administration
5. Entrepreneurship
6. Accounting
7. Finance & Investment
8. Marketing
9. Digital Marketing
10. Human Resources
11. Economics
12. Supply Chain Management
13. Health Management
14. Event Management
15. Project Management
16. Health Information Systems
17. E-Commerce
18. Financial Management
19. Insurance & Risk Management
20. Sports Management
21. International Business
22. Commercial Law

💡 Your Capabilities:
1. Calculate remaining hours and GPA accurately
2. Suggest suitable courses based on level and major
3. Explain graduation requirements and study plan
4. Provide personalized academic advice
5. Answer questions about system and procedures
6. Help with academic planning and career path
7. Analyze academic performance and provide recommendations

📋 Core Course Examples:
• Level 1: Language Skills, Islamic Culture, Intro to Computing, Management Principles
• Level 2: Intro to MIS, Systems Analysis, Programming, Statistics
• Level 3: Databases, Networks, Project Management, E-Commerce
• Levels 4-8: Advanced specialized courses in Information Systems

⚠️ Important Notes:
• Use only real numbers from the data above
• Don't make up information or numbers
• Be precise in academic calculations
• Provide practical and helpful advice
• Focus on helping students achieve their academic goals

Response Style:
• Be friendly, encouraging, and professional
• Make answers clear and direct
• Use emojis appropriately
• Provide practical examples when needed
• End with encouragement or positive advice`,
    user: ''
  };
}

// دالة المعالجة الرئيسية للمساعد الذكي
export async function handleAIAssistant(authHeader: string | undefined, message: string, language: string) {
  try {
    // جلب بيانات المستخدم من التوكن
    const user = await getUserFromToken(authHeader);
    
    if (!user) {
      return {
        success: false,
        response: language === 'ar' 
          ? 'يرجى تسجيل الدخول أولاً'
          : 'Please login first',
        type: 'error'
      };
    }

    const role = user.role || 'student';
    const userName = user.name || (language === 'ar' ? 'المستخدم' : 'User');

    console.log('🤖 [AI Assistant] Processing for role:', role, 'user:', userName);

    // جلب البيانات حسب الدور
    let contextData: any = null;

    if (role === 'student') {
      const studentId = user.students?.[0]?.id;
      if (studentId) {
        contextData = await getStudentData(studentId);
        console.log('📊 [AI Assistant] Student data loaded:', {
          credits: contextData?.credits,
          courses: contextData?.registrations?.count
        });
      }
    } else if (role === 'supervisor') {
      const supervisorId = user.supervisors?.[0]?.id;
      if (supervisorId) {
        contextData = await getSupervisorData(supervisorId);
        console.log('📊 [AI Assistant] Supervisor data loaded:', {
          students: contextData?.students?.length,
          requests: contextData?.requests?.count
        });
      }
    } else if (role === 'admin') {
      contextData = await getAdminStats();
      console.log('📊 [AI Assistant] Admin stats loaded:', contextData?.students?.total);
    }

    // بناء السياق
    const context = buildAIContext(role, userName, contextData, language);

    // محاولة استخدام OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (openaiApiKey) {
      try {
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
                content: context.system,
              },
              {
                role: 'user',
                content: `${context.user}\n\nالسؤال: ${message}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 600,
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const aiResponse = openaiData.choices[0]?.message?.content || '';
          
          console.log('✅ [AI Assistant] OpenAI response received');
          
          return {
            success: true,
            response: aiResponse,
            type: 'ai',
          };
        }
      } catch (error) {
        console.warn('⚠️ [AI Assistant] OpenAI error:', error);
      }
    }

    // Fallback responses
    return generateFallbackResponse(role, userName, message, language, contextData);

  } catch (error) {
    console.error('❌ [AI Assistant] Error:', error);
    return {
      success: false,
      response: language === 'ar'
        ? '😔 عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
        : '😔 Sorry, an error occurred. Please try again.',
      type: 'error'
    };
  }
}

// دالة لإنشاء ردود تلقائية ذكية
function generateFallbackResponse(role: string, userName: string, message: string, language: string, data: any) {
  const lowerMessage = message.toLowerCase();

  if (role === 'admin') {
    const stats = data || {};
    if (lowerMessage.includes('طلاب') || lowerMessage.includes('students') || lowerMessage.includes('عدد')) {
      return {
        success: true,
        response: language === 'ar'
          ? `📊 إحصائيات الطلاب:\n\n• إجمالي الطلاب: ${stats.students?.total || 0}\n• متوسط المعدل: ${stats.students?.averageGPA?.toFixed(2) || '0.00'}\n• الطلاب النشطون: ${stats.users?.active || 0}\n\nيمكنك عرض تقارير مفصلة من لوحة التحكم.`
          : `📊 Student Statistics:\n\n• Total Students: ${stats.students?.total || 0}\n• Average GPA: ${stats.students?.averageGPA?.toFixed(2) || '0.00'}\n• Active Students: ${stats.users?.active || 0}\n\nYou can view detailed reports from the dashboard.`,
        type: 'fallback'
      };
    }
    return {
      success: true,
      response: language === 'ar'
        ? `مرحباً ${userName}! 👋\n\n📊 إحصائيات النظام:\n• الطلاب: ${stats.students?.total || 0}\n• المقررات: ${stats.courses?.total || 0}\n• التسجيلات: ${stats.registrations?.total || 0}\n• المشرفين: ${stats.supervisors?.total || 0}\n\nكيف يمكنني مساعدتك؟`
        : `Hello ${userName}! 👋\n\n📊 System Stats:\n• Students: ${stats.students?.total || 0}\n• Courses: ${stats.courses?.total || 0}\n• Registrations: ${stats.registrations?.total || 0}\n• Supervisors: ${stats.supervisors?.total || 0}\n\nHow can I help you?`,
      type: 'fallback'
    };
  }

  if (role === 'supervisor') {
    const supData = data || {};
    if (lowerMessage.includes('طلب') || lowerMessage.includes('request')) {
      return {
        success: true,
        response: language === 'ar'
          ? `📋 طلبات التسجيل:\n\n• المعلقة: ${supData.requests?.count?.pending || 0}\n• المعتمدة: ${supData.requests?.count?.approved || 0}\n• المرفوضة: ${supData.requests?.count?.rejected || 0}\n\nيمكنك مراجعة الطلبات من صفحة "طلبات الطلاب".`
          : `📋 Registration Requests:\n\n• Pending: ${supData.requests?.count?.pending || 0}\n• Approved: ${supData.requests?.count?.approved || 0}\n• Rejected: ${supData.requests?.count?.rejected || 0}\n\nYou can review requests from "Student Requests" page.`,
        type: 'fallback'
      };
    }
    return {
      success: true,
      response: language === 'ar'
        ? `مرحباً ${userName}! 👋\n\n📊 معلومات الإشراف:\n• الطلاب: ${supData.students?.length || 0}\n• الطلبات المعلقة: ${supData.requests?.count?.pending || 0}\n\nكيف يمكنني مساعدتك؟`
        : `Hello ${userName}! 👋\n\n📊 Supervision Info:\n• Students: ${supData.students?.length || 0}\n• Pending Requests: ${supData.requests?.count?.pending || 0}\n\nHow can I help you?`,
      type: 'fallback'
    };
  }

  // Student
  const studentData = data || {};
  if (lowerMessage.includes('ساعات') || lowerMessage.includes('hours') || lowerMessage.includes('متبق')) {
    return {
      success: true,
      response: language === 'ar'
        ? `⭐ معلومات الساعات:\n\n• الساعات المكتملة: ${studentData.credits?.completed || 0} ساعة\n• الساعات المسجلة حالياً: ${studentData.credits?.registered || 0} ساعة\n• الساعات المتبقية للتخرج: ${studentData.credits?.remaining || 140} ساعة\n\nإجمالي الساعات المطلوبة: ${studentData.credits?.total || 140} ساعة 🎓`
        : `⭐ Credits Information:\n\n• Completed: ${studentData.credits?.completed || 0} hours\n• Currently Registered: ${studentData.credits?.registered || 0} hours\n• Remaining for Graduation: ${studentData.credits?.remaining || 140} hours\n\nTotal Required: ${studentData.credits?.total || 140} hours 🎓`,
      type: 'fallback'
    };
  }

  return {
    success: true,
    response: language === 'ar'
      ? `مرحباً ${userName}! 👋\n\n📊 معلوماتك الأكاديمية:\n• المعدل: ${studentData.student?.gpa?.toFixed(2) || '0.00'}\n• المستوى: ${studentData.student?.level || 1}\n• الساعات المكتملة: ${studentData.credits?.completed || 0}\n• الساعات المتبقية: ${studentData.credits?.remaining || 140}\n\nكيف يمكنني مساعدتك؟`
      : `Hello ${userName}! 👋\n\n📊 Your Academic Info:\n• GPA: ${studentData.student?.gpa?.toFixed(2) || '0.00'}\n• Level: ${studentData.student?.level || 1}\n• Completed Credits: ${studentData.credits?.completed || 0}\n• Remaining Credits: ${studentData.credits?.remaining || 140}\n\nHow can I help you?`,
    type: 'fallback'
  };
}