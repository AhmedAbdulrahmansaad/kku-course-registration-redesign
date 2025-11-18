# 🔍 Debugging Current Errors

## 🐛 الأخطاء الحالية

```
❌ [Register] Course not found: MGT101
❌ [Register] Course not found: CIS101
❌ Login error: Invalid login credentials
```

---

## 🔍 Investigation Steps

### 1️⃣ Course Registration Error

#### المشكلة:
```
❌ [Register] Course not found: MGT101
```

#### التحليل المبدئي:
```typescript
// Server يبحث:
SELECT * FROM courses WHERE id = 'MGT101'

// السؤال:
// هل courseId الذي يصل للـ server هو UUID أم text؟
```

#### الكود الحالي في CoursesPage.tsx:
```typescript
const coursesData = result.courses.map((offer: any) => ({
  id: offer.courses.id,
  course_id: offer.courses.id,  // ✅ Should be UUID
  code: offer.courses.code,
  ...
}));

// عند التسجيل:
body: JSON.stringify({
  courseId: course.course_id,  // يجب أن يكون UUID
})
```

#### التحقق من Database Schema:

```sql
-- courses table:
CREATE TABLE courses (
  id            uuid PRIMARY KEY,      -- Real UUID
  course_id     text,                  -- Legacy text (MGT101)
  code          text NOT NULL,         -- Display code (MGT101)
  name_ar       text,
  name_en       text,
  ...
);
```

#### السيناريوهات المحتملة:

**Scenario A: Frontend sends text (MGT101)**
```
1. course.course_id = "MGT101"  ❌
2. Server receives: courseId = "MGT101"
3. Query: WHERE id = 'MGT101'  ❌
4. Error: invalid input syntax for type uuid
```

**Scenario B: Frontend sends UUID**
```
1. course.course_id = "uuid-abc-123"  ✅
2. Server receives: courseId = "uuid-abc-123"
3. Query: WHERE id = 'uuid-abc-123'  ✅
4. But course not found in database?  🤔
```

**Scenario C: Database empty**
```
1. course.course_id = "uuid-abc-123"  ✅
2. Server receives: courseId = "uuid-abc-123"
3. Query: WHERE id = 'uuid-abc-123'  ✅
4. No rows returned from database  ❌
```

#### Debugging Added:

```typescript
// في /supabase/functions/server/index.tsx
console.log('📝 [Register] Course registration attempt:', courseId);
console.log('📝 [Register] courseId type:', typeof courseId);
console.log('📝 [Register] courseId value:', JSON.stringify(courseId));

// عند البحث عن المقرر:
if (courseError || !course) {
  console.error('❌ [Register] Course not found. courseId:', courseId);
  console.error('❌ [Register] Course error details:', courseError?.message);
  console.error('❌ [Register] Full error:', JSON.stringify(courseError));
  return c.json({ 
    success: false,
    error: 'Course not found',
    details: courseError?.message || 'No course data',
    receivedId: courseId
  }, 404);
}
```

#### الخطوات التالية:
1. ✅ تشغيل التطبيق ومحاولة التسجيل في مقرر
2. ✅ فحص الـ console logs
3. ✅ التحقق من نوع courseId (UUID vs text)
4. ✅ التحقق من وجود المقررات في الـ database
5. ✅ إصلاح المشكلة بناءً على النتائج

---

### 2️⃣ Login Error

#### المشكلة:
```
❌ Login error: Invalid login credentials
```

#### التحليل:

```typescript
// Login flow:
1. User enters: identifier (student_id or email)
2. If identifier is student_id (no @):
   - Lookup email from users table
   - WHERE student_id = identifier AND active = true
3. Call Supabase Auth:
   - signInWithPassword({ email, password })
4. If success:
   - Get user data from users table
   - Return session + access_token
```

#### السيناريوهات المحتملة:

**Scenario A: User not in database**
```sql
SELECT email FROM users 
WHERE student_id = '443810037' 
AND active = true

-- Result: No rows
-- Error: "بيانات الدخول غير صحيحة"
```

**Scenario B: Wrong password**
```typescript
supabase.auth.signInWithPassword({
  email: 'student@kku.edu.sa',
  password: 'wrong-password'  ❌
})

// Result: Invalid login credentials
```

**Scenario C: Email not confirmed**
```typescript
supabase.auth.signInWithPassword({
  email: 'student@kku.edu.sa',
  password: 'correct-password'
})

// Result: Email not confirmed
```

**Scenario D: Auth user exists but not in users table**
```typescript
1. Supabase Auth: ✅ Login successful
2. Query users table:
   SELECT * FROM users WHERE auth_id = '...'
   Result: No rows  ❌
3. Error: User data not found
```

#### Debugging Added:

```typescript
// في /supabase/functions/server/index.tsx
console.log('🔐 Login attempt:', identifier);

// عند البحث عن email:
if (error || !user) {
  console.log('❌ User not found:', identifier);
  return c.json({ error: 'بيانات الدخول غير صحيحة' }, 401);
}

// عند محاولة تسجيل الدخول:
console.log('🔐 Attempting Supabase auth with email:', email);

// إذا فشل تسجيل الدخول:
if (error) {
  console.error('❌ Login error:', error.message);
  console.error('❌ Login error details:', JSON.stringify(error));
  return c.json({ 
    error: 'بيانات الدخول غير صحيحة',
    details: error.message 
  }, 401);
}

// إذا نجح تسجيل الدخول:
console.log('✅ Supabase auth successful, user ID:', data.user.id);
```

#### الخطوات التالية:
1. ✅ تشغيل التطبيق ومحاولة تسجيل الدخول
2. ✅ فحص الـ console logs
3. ✅ التحقق من:
   - هل المستخدم موجود في users table؟
   - هل الـ email صحيح؟
   - هل الـ password صحيح؟
   - هل الـ email confirmed؟
   - هل auth_id مرتبط بشكل صحيح؟
4. ✅ إصلاح المشكلة بناءً على النتائج

---

## 🔍 Checklist للتحقق

### Database Health Check:

```sql
-- 1. Check if courses exist
SELECT COUNT(*) FROM courses;

-- 2. Check sample course
SELECT id, course_id, code, name_ar 
FROM courses 
LIMIT 5;

-- 3. Check if users exist
SELECT COUNT(*) FROM users WHERE active = true;

-- 4. Check sample user
SELECT id, student_id, email, role, active 
FROM users 
WHERE role = 'student' 
LIMIT 5;

-- 5. Check auth linkage
SELECT 
  u.id,
  u.student_id,
  u.email,
  u.auth_id,
  CASE 
    WHEN u.auth_id IS NULL THEN '❌ No auth_id'
    ELSE '✅ Has auth_id'
  END as auth_status
FROM users u
WHERE u.role = 'student'
LIMIT 5;
```

### Data Integrity Check:

```sql
-- 1. Check for courses with invalid IDs
SELECT 
  id,
  course_id,
  code,
  CASE 
    WHEN id IS NULL THEN '❌ NULL id'
    WHEN course_id IS NULL THEN '⚠️ NULL course_id'
    ELSE '✅ OK'
  END as status
FROM courses;

-- 2. Check for users without auth_id
SELECT 
  id,
  student_id,
  email,
  auth_id,
  active
FROM users
WHERE auth_id IS NULL
AND active = true;

-- 3. Check registrations integrity
SELECT 
  r.id,
  r.student_id,
  r.course_id,
  r.status,
  CASE 
    WHEN s.id IS NULL THEN '❌ Invalid student_id'
    WHEN c.id IS NULL THEN '❌ Invalid course_id'
    ELSE '✅ OK'
  END as integrity
FROM registrations r
LEFT JOIN users s ON r.student_id = s.id
LEFT JOIN courses c ON r.course_id = c.id;
```

---

## 🎯 Possible Root Causes

### Course Registration:

| Issue | Probability | Fix |
|-------|-------------|-----|
| Frontend sends text (MGT101) | 🟡 Medium | Fix mapping in CoursesPage.tsx |
| Database courses empty | 🔴 High | Run seed script |
| Invalid UUID format | 🟢 Low | Validate UUID |
| Wrong field mapping | 🟡 Medium | Check offer.courses.id |

### Login:

| Issue | Probability | Fix |
|-------|-------------|-----|
| User not in database | 🔴 High | Run signup script |
| Wrong password | 🟡 Medium | Reset password |
| Email not confirmed | 🟡 Medium | Auto-confirm in signup |
| Missing auth_id | 🟡 Medium | Re-signup user |
| User inactive | 🟢 Low | Set active = true |

---

## 🛠️ Quick Fixes

### Fix 1: Re-seed Database

```bash
# في Supabase Dashboard → SQL Editor
# Run the seed script to populate courses and users
```

### Fix 2: Confirm Test User

```sql
-- في Supabase Dashboard → SQL Editor
-- إنشاء طالب تجريبي
INSERT INTO users (
  id, 
  student_id, 
  email, 
  name, 
  role, 
  major, 
  level, 
  active
) VALUES (
  gen_random_uuid(),
  '443810037',
  'student@kku.edu.sa',
  'طالب تجريبي',
  'student',
  'MIS',
  1,
  true
);

-- ثم تسجيل المستخدم في Supabase Auth
-- (يجب أن يتم من خلال signup endpoint)
```

### Fix 3: Check Course Data

```sql
-- التحقق من أن المقررات لها UUIDs صحيحة
SELECT 
  id,
  course_id,
  code,
  name_ar,
  pg_typeof(id) as id_type
FROM courses
LIMIT 5;

-- Expected:
-- id_type should be 'uuid'
-- id should be like '12345678-1234-1234-1234-123456789abc'
-- course_id should be text like 'MGT101'
```

---

## 📋 Next Steps

### Immediate:

1. ✅ Run the app and try to register for a course
2. ✅ Check browser console for frontend logs
3. ✅ Check Supabase Functions logs for server logs
4. ✅ Look for the new detailed logs we added
5. ✅ Identify the exact issue based on logs

### Based on Logs:

**If courseId is text (MGT101):**
- ❌ Problem: Frontend mapping is wrong
- ✅ Fix: Already done (course_id: offer.courses.id)
- 🔍 Need to verify: Is the fix deployed?

**If courseId is UUID but course not found:**
- ❌ Problem: Database might be empty
- ✅ Fix: Run seed script
- 🔍 Check: SELECT COUNT(*) FROM courses;

**If login fails with "User not found":**
- ❌ Problem: User not in database
- ✅ Fix: Run signup for test user
- 🔍 Check: SELECT * FROM users WHERE student_id = '443810037';

**If login fails with "Invalid credentials":**
- ❌ Problem: Wrong password or email
- ✅ Fix: Reset password or re-signup
- 🔍 Check: Try with correct credentials

---

## 🎯 Expected Logs

### Successful Course Registration:

```
📝 [Register] Course registration attempt: 12345678-1234-1234-1234-123456789abc
📝 [Register] courseId type: string
📝 [Register] courseId value: "12345678-1234-1234-1234-123456789abc"
✅ [Register] User authenticated: 443810037
✅ [Register] Registration created successfully: reg-uuid-new
```

### Failed Course Registration (text):

```
📝 [Register] Course registration attempt: MGT101
📝 [Register] courseId type: string
📝 [Register] courseId value: "MGT101"
❌ [Register] Course not found. courseId: MGT101
❌ [Register] Course error details: invalid input syntax for type uuid: "MGT101"
```

### Failed Course Registration (empty DB):

```
📝 [Register] Course registration attempt: 12345678-1234-1234-1234-123456789abc
📝 [Register] courseId type: string
📝 [Register] courseId value: "12345678-1234-1234-1234-123456789abc"
❌ [Register] Course not found. courseId: 12345678-1234-1234-1234-123456789abc
❌ [Register] Course error details: No course data
```

### Successful Login:

```
🔐 Login attempt: 443810037
🔐 Attempting Supabase auth with email: student@kku.edu.sa
✅ Supabase auth successful, user ID: auth-uuid-abc
✅ Login successful: 443810037 - student
```

### Failed Login (user not found):

```
🔐 Login attempt: 443810037
❌ User not found: 443810037
```

### Failed Login (wrong password):

```
🔐 Login attempt: 443810037
🔐 Attempting Supabase auth with email: student@kku.edu.sa
❌ Login error: Invalid login credentials
❌ Login error details: {"message":"Invalid login credentials","status":400}
```

---

## 🚀 Action Plan

1. **تشغيل التطبيق** وتجربة كلا الـ features
2. **فحص الـ logs** في browser console و Supabase Functions
3. **تحديد السبب الدقيق** من الـ logs المفصلة
4. **تطبيق الإصلاح المناسب** بناءً على السبب
5. **اختبار النتيجة** للتأكد من الإصلاح

---

**Status:** 🔍 Investigation في انتظار النتائج  
**Date:** 18 نوفمبر 2025  
**Enhanced Logging:** ✅ Added  
**Ready for Testing:** ✅ Yes  

**الرجاء تجربة التطبيق الآن وإعطائي الـ console logs الكاملة! 📊**
