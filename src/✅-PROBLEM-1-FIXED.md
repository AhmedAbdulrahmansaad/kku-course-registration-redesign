# ✅ إصلاح المشكلة الأولى: التخصص والمستوى لا يُحفظ بشكل صحيح

## 📋 المشكلة
عند إنشاء حساب جديد (طالب/مشرف/مدير):
- اختيار التخصص لا يُحفظ في جدول `users` أو `students`
- يظهر دائماً "نظم المعلومات الإدارية - MIS" فقط
- اختيار المستوى لا يُحفظ ويظهر دائماً "المستوى 1"

## 🔍 السبب الجذري
في ملف `/supabase/functions/server/index.tsx` كان الكود يحدد `department_id` بناءً على قيمة ثابتة `'MIS'` فقط، بدلاً من استخدام التخصص الذي اختاره المستخدم.

```typescript
// ❌ الكود القديم (خاطئ)
const { data: dept } = await supabase
  .from('departments')
  .select('id')
  .eq('code', 'MIS')  // ← ثابت دائماً على MIS
  .single();
```

## ✅ الحل المطبق

### 1. تحديث endpoint التسجيل (signup)

تم إضافة mapping لتحويل اسم التخصص الكامل إلى department code:

```typescript
// ✅ الكود الجديد (صحيح)
let departmentCode = 'MIS'; // القيمة الافتراضية

if (major) {
  // Mapping من major إلى department code
  const majorToDeptMap: { [key: string]: string } = {
    'Management Information Systems': 'MIS',
    'Business Administration': 'BA',
    'Accounting': 'ACC',
    'Marketing': 'MKT',
    'Finance': 'FIN',
  };
  
  departmentCode = majorToDeptMap[major] || 'MIS';
}

console.log(`📚 [Signup] Using department code: ${departmentCode} for major: ${major}`);

// الحصول على department_id بناءً على departmentCode الصحيح
const { data: dept } = await supabase
  .from('departments')
  .select('id')
  .eq('code', departmentCode)  // ← يستخدم التخصص الفعلي
  .single();
```

### 2. تحديث إدخال بيانات الطالب

تم تحديث قيمة `major` المخزنة في جدول `students` لتكون الاسم الكامل:

```typescript
const { error: studentError } = await supabase
  .from('students')
  .insert({
    user_id: userData.id,
    level: level ? parseInt(level) : 1, // ✅ المستوى من المدخلات
    gpa: gpa ? parseFloat(gpa) : 0.0,
    total_credits: 0,
    completed_credits: 0,
    major: major || 'Management Information Systems', // ✅ الاسم الكامل
    status: 'active',
    enrollment_year: new Date().getFullYear(),
    expected_graduation_year: new Date().getFullYear() + 4,
  });
```

## 📊 التخصصات المدعومة

| التخصص (العربي) | التخصص (English) | Department Code |
|-----------------|-------------------|-----------------|
| نظم المعلومات الإدارية | Management Information Systems | MIS |
| إدارة الأعمال | Business Administration | BA |
| المحاسبة | Accounting | ACC |
| التسويق | Marketing | MKT |
| المالية | Finance | FIN |

## 🔄 تدفق البيانات

### عند التسجيل (SignUp):
1. المستخدم يختار التخصص من القائمة (مثلاً: "Business Administration")
2. المستخدم يختار المستوى (مثلاً: "3")
3. يتم إرسال البيانات إلى `/auth/signup`:
   ```json
   {
     "major": "Business Administration",
     "level": "3"
   }
   ```
4. الـ Backend يحول التخصص إلى department_code: "BA"
5. يتم البحث في جدول `departments` عن department_id للـ BA
6. يتم حفظ:
   - في جدول `users`: department_id (UUID)
   - في جدول `students`: major: "Business Administration", level: 3

### عند تسجيل الدخول (Login):
1. يتم جلب بيانات المستخدم من SQL:
   ```sql
   SELECT *, students(*) FROM users WHERE auth_id = ...
   ```
2. يتم استخراج:
   - `major` من `user.students[0].major`
   - `level` من `user.students[0].level`
3. يتم حفظها في localStorage وعرضها في Dashboard

## ✅ النتيجة

الآن عند إنشاء حساب جديد:
- ✅ التخصص يُحفظ بشكل صحيح في `users.department_id` و `students.major`
- ✅ المستوى يُحفظ بشكل صحيح في `students.level`
- ✅ البيانات تظهر بشكل صحيح في Dashboard الطالب
- ✅ البيانات تظهر بشكل صحيح للمشرف والمدير

## 🧪 اختبار الإصلاح

### خطوات الاختبار:
1. انتقل إلى صفحة التسجيل
2. اختر "طالب" كنوع الحساب
3. املأ البيانات:
   - الاسم: "أحمد محمد"
   - البريد: "ahmad@kku.edu.sa"
   - الرقم الجامعي: "442012345"
   - **التخصص: "Accounting"** ← اختر تخصص غير MIS
   - **المستوى: "3"** ← اختر مستوى غير 1
4. أنشئ الحساب وسجل دخول
5. افتح Dashboard الطالب
6. تحقق من:
   - يجب أن يظهر "المستوى 3" (وليس 1)
   - يجب أن يظهر التخصص الصحيح (Accounting)

### التحقق من قاعدة البيانات:
```sql
-- عرض بيانات الطالب
SELECT 
  u.name, 
  u.student_id, 
  u.email,
  d.name_en as department,
  s.major,
  s.level,
  s.gpa
FROM users u
LEFT JOIN students s ON s.user_id = u.id
LEFT JOIN departments d ON d.id = u.department_id
WHERE u.email = 'ahmad@kku.edu.sa';
```

النتيجة المتوقعة:
| name | student_id | email | department | major | level | gpa |
|------|------------|-------|------------|-------|-------|-----|
| أحمد محمد | 442012345 | ahmad@kku.edu.sa | Accounting | Accounting | 3 | 0.00 |

## 📝 الملفات المعدلة
- `/supabase/functions/server/index.tsx` (endpoint: `/auth/signup`)

## ⚠️ ملاحظات مهمة
- يجب التأكد من وجود جميع التخصصات في جدول `departments` مع الأكواد الصحيحة
- إذا كان التخصص غير موجود في `majorToDeptMap`، سيتم استخدام 'MIS' كقيمة افتراضية
- البيانات الآن تُخزن بشكل كامل في PostgreSQL وليس في KV Store
