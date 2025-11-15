# دليل المصادقة | Authentication Guide

## نظام المصادقة الحقيقي مع Supabase Auth
## Real Authentication System with Supabase Auth

---

## 🔐 نظرة عامة | Overview

تم تطوير نظام مصادقة حقيقي ومتكامل باستخدام **Supabase Auth** يوفر:
- ✅ تسجيل دخول آمن
- ✅ إنشاء حسابات جديدة
- ✅ إدارة الجلسات (Sessions)
- ✅ حماية البيانات
- ✅ تشفير كلمات المرور

---

## 📋 البنية التقنية | Technical Architecture

### Frontend → Server → Supabase Auth

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Frontend  │ ───▶ │ Edge Function│ ───▶ │ Supabase Auth   │
│   (React)   │ ◀─── │   (Hono)     │ ◀─── │  (PostgreSQL)   │
└─────────────┘      └──────────────┘      └─────────────────┘
```

---

## 🚀 كيفية الاستخدام | How to Use

### 1️⃣ إنشاء حساب جديد | Create New Account

#### واجهة المستخدم | User Interface

**المسار:** `/signup` أو من صفحة تسجيل الدخول → "إنشاء حساب"

**الخطوات:**
1. افتح صفحة إنشاء الحساب
2. املأ جميع الحقول المطلوبة:
   - الرقم الجامعي: `4xxxxxxxx`
   - الاسم الكامل: `اسم الطالب الكامل`
   - البريد الإلكتروني: `student@kku.edu.sa`
   - رقم الجوال: `05xxxxxxxx` (اختياري)
   - التخصص: اختر من القائمة
   - كلمة المرور: 6 أحرف على الأقل
   - تأكيد كلمة المرور
3. وافق على الشروط والأحكام
4. اضغط "إنشاء الحساب"

#### API Endpoint

```typescript
POST https://{projectId}.supabase.co/functions/v1/make-server-1573e40a/signup

Headers:
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {publicAnonKey}"
}

Body:
{
  "email": "student@kku.edu.sa",
  "password": "mypassword123",
  "userData": {
    "student_id": "432100001",
    "full_name": "أحمد محمد علي",
    "phone": "0501234567",
    "major": "information-systems",
    "academic_year": "2025-2026"
  }
}

Response Success (200):
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "student@kku.edu.sa",
    "user_metadata": {
      "student_id": "432100001",
      "full_name": "أحمد محمد علي",
      "phone": "0501234567",
      "major": "information-systems",
      "academic_year": "2025-2026"
    }
  }
}

Response Error (400/500):
{
  "error": "Error message"
}
```

#### Server Code

```typescript
// /supabase/functions/server/index.tsx

app.post('/make-server-1573e40a/signup', async (c) => {
  try {
    const { email, password, userData } = await c.req.json();

    if (!email || !password || !userData) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        student_id: userData.student_id,
        full_name: userData.full_name,
        phone: userData.phone,
        major: userData.major,
        academic_year: userData.academic_year,
      },
      // Automatically confirm email
      email_confirm: true
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      success: true, 
      message: 'Account created successfully',
      user: data.user 
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});
```

---

### 2️⃣ تسجيل الدخول | Login

#### واجهة المستخدم | User Interface

**المسار:** `/login`

**الخطوات:**
1. افتح صفحة تسجيل الدخول
2. أدخل البريد الإلكتروني الجامعي
3. أدخل كلمة المرور
4. (اختياري) فعّل "تذكرني"
5. اضغط "تسجيل الدخول"

#### API Endpoint

```typescript
POST https://{projectId}.supabase.co/functions/v1/make-server-1573e40a/login

Headers:
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {publicAnonKey}"
}

Body:
{
  "email": "student@kku.edu.sa",
  "password": "mypassword123"
}

Response Success (200):
{
  "success": true,
  "message": "Login successful",
  "session": {
    "access_token": "eyJhbGciOiJI...",
    "refresh_token": "refresh_token_here",
    "expires_in": 3600,
    "token_type": "bearer"
  },
  "user": {
    "id": "uuid",
    "email": "student@kku.edu.sa",
    "user_metadata": {
      "student_id": "432100001",
      "full_name": "أحمد محمد علي",
      ...
    }
  }
}

Response Error (401/500):
{
  "error": "Invalid credentials"
}
```

#### Server Code

```typescript
// /supabase/functions/server/index.tsx

app.post('/make-server-1573e40a/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    // Create Supabase client with ANON key for auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({ 
      success: true, 
      message: 'Login successful',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});
```

---

### 3️⃣ إدارة الجلسات | Session Management

#### حفظ الجلسة في Frontend

```typescript
// /components/pages/LoginPage.tsx

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, password }),
    }
  );

  const result = await response.json();

  if (result.session) {
    // حفظ الجلسة في localStorage
    localStorage.setItem('supabase_session', JSON.stringify(result.session));
    localStorage.setItem('user_data', JSON.stringify(result.user));
  }

  // الانتقال إلى صفحة المقررات
  setCurrentPage('courses');
};
```

#### التحقق من الجلسة

```typescript
// التحقق من وجود جلسة نشطة
const checkSession = () => {
  const session = localStorage.getItem('supabase_session');
  const userData = localStorage.getItem('user_data');
  
  if (session && userData) {
    return {
      isAuthenticated: true,
      session: JSON.parse(session),
      user: JSON.parse(userData)
    };
  }
  
  return {
    isAuthenticated: false,
    session: null,
    user: null
  };
};
```

#### تسجيل الخروج

```typescript
const handleLogout = () => {
  // مسح الجلسة من localStorage
  localStorage.removeItem('supabase_session');
  localStorage.removeItem('user_data');
  
  // الانتقال إلى صفحة تسجيل الدخول
  setCurrentPage('login');
  
  toast.success(
    language === 'ar' 
      ? 'تم تسجيل الخروج بنجاح' 
      : 'Logged out successfully'
  );
};
```

---

## 🔒 الأمان | Security

### 1. تشفير كلمات المرور
- يتم تشفير كلمات المرور تلقائياً بواسطة Supabase Auth
- لا يتم تخزين كلمات المرور بشكل نصي

### 2. حماية API Keys
```typescript
// ✅ CORRECT - في Backend فقط
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // ⚠️ لا تستخدم في Frontend
);

// ✅ CORRECT - في Frontend
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${publicAnonKey}`  // ✅ آمن للاستخدام
  }
});
```

### 3. التحقق من صحة البيانات
```typescript
// Frontend Validation
if (!email || !password) {
  toast.error('Please fill all required fields');
  return;
}

if (password.length < 6) {
  toast.error('Password must be at least 6 characters');
  return;
}

// Server Validation
if (!email || !password || !userData) {
  return c.json({ error: 'Missing required fields' }, 400);
}
```

---

## 📊 بيانات المستخدم | User Data

### Structure في Supabase Auth

```typescript
{
  "id": "uuid",
  "email": "student@kku.edu.sa",
  "email_confirmed_at": "2025-01-01T00:00:00Z",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "user_metadata": {
    "student_id": "432100001",
    "full_name": "أحمد محمد علي",
    "phone": "0501234567",
    "major": "information-systems",
    "academic_year": "2025-2026"
  },
  "app_metadata": {
    "provider": "email"
  }
}
```

### الوصول إلى البيانات

```typescript
// في Frontend بعد تسجيل الدخول
const userData = JSON.parse(localStorage.getItem('user_data'));

const studentId = userData.user_metadata.student_id;
const fullName = userData.user_metadata.full_name;
const major = userData.user_metadata.major;
```

---

## 🎯 التخصصات المتاحة | Available Majors

```typescript
const majors = [
  {
    value: 'information-systems',
    label_ar: 'نظم المعلومات',
    label_en: 'Information Systems'
  },
  {
    value: 'computer-science',
    label_ar: 'علوم الحاسب',
    label_en: 'Computer Science'
  },
  {
    value: 'information-technology',
    label_ar: 'تقنية المعلومات',
    label_en: 'Information Technology'
  },
  {
    value: 'software-engineering',
    label_ar: 'هندسة البرمجيات',
    label_en: 'Software Engineering'
  },
  {
    value: 'cybersecurity',
    label_ar: 'الأمن السيبراني',
    label_en: 'Cybersecurity'
  }
];
```

---

## ⚠️ معالجة الأخطاء | Error Handling

### أخطاء شائعة | Common Errors

#### 1. البريد الإلكتروني مستخدم بالفعل
```typescript
{
  "error": "User already registered"
}
```

#### 2. كلمة مرور خاطئة
```typescript
{
  "error": "Invalid login credentials"
}
```

#### 3. حقول مفقودة
```typescript
{
  "error": "Missing required fields"
}
```

#### 4. كلمة مرور ضعيفة
```typescript
{
  "error": "Password should be at least 6 characters"
}
```

### معالجة الأخطاء في Frontend

```typescript
try {
  const response = await fetch(url, options);
  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  // Success
  toast.success('تم بنجاح');
} catch (error: any) {
  console.error('Authentication error:', error);
  
  const errorMessage = error.message || 'An error occurred';
  
  toast.error(
    language === 'ar' 
      ? `خطأ: ${errorMessage}` 
      : `Error: ${errorMessage}`
  );
}
```

---

## 🧪 اختبار النظام | Testing

### سيناريو 1: إنشاء حساب جديد

```bash
# Request
curl -X POST \
  'https://{projectId}.supabase.co/functions/v1/make-server-1573e40a/signup' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {publicAnonKey}' \
  -d '{
    "email": "test@kku.edu.sa",
    "password": "test123456",
    "userData": {
      "student_id": "432100999",
      "full_name": "طالب تجريبي",
      "phone": "0501234567",
      "major": "information-systems",
      "academic_year": "2025-2026"
    }
  }'
```

### سيناريو 2: تسجيل الدخول

```bash
# Request
curl -X POST \
  'https://{projectId}.supabase.co/functions/v1/make-server-1573e40a/login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer {publicAnonKey}' \
  -d '{
    "email": "test@kku.edu.sa",
    "password": "test123456"
  }'
```

---

## 📚 المصادر | Resources

### Supabase Auth Documentation
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

### Best Practices
- استخدم HTTPS دائماً
- لا تخزن كلمات المرور في Frontend
- استخدم environment variables للـ API keys
- تحقق من صحة البيانات في Frontend و Backend
- استخدم رسائل خطأ واضحة ومفيدة

---

## ✅ الخلاصة | Summary

تم تطوير نظام مصادقة متكامل وآمن يوفر:

✅ **إنشاء حسابات جديدة** مع جميع بيانات الطالب  
✅ **تسجيل دخول آمن** مع Supabase Auth  
✅ **إدارة جلسات** فعالة  
✅ **حماية بيانات** عالية المستوى  
✅ **تجربة مستخدم** ممتازة  
✅ **معالجة أخطاء** شاملة  
✅ **دعم لغتين** (عربي/إنجليزي)  

---

**نظام المصادقة - جامعة الملك خالد**  
**العام الأكاديمي 2025-2026**  
**Authentication System - King Khalid University**  
**Academic Year 2025-2026**
