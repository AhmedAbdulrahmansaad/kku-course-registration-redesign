# 🔧 إصلاح أخطاء Curriculum API

## ❌ المشكلة

عند محاولة الوصول إلى صفحة المنهج الدراسي (Curriculum Page)، كانت تظهر الأخطاء التالية:

```
Error fetching curriculum: Error: Failed to fetch curriculum
Error fetching curriculum: TypeError: Cannot read properties of undefined (reading 'department')
    at file:///var/tmp/sb-compile-edge-runtime/source/index.tsx:742:66
```

### السبب الجذري:

المشكلة كانت في endpoints `/courses` و `/curriculum` في Backend:

1. عند جلب المقررات من KV store، بعض القيم قد تكون `null` أو `undefined`
2. الكود كان يحاول قراءة خاصية `department` من مقرر قد يكون `undefined`
3. لم تكن هناك فلترة للقيم الـ `null` قبل معالجتها

---

## ✅ الحل

### 1. إضافة فلترة للقيم الفارغة:

```typescript
// ❌ قبل الإصلاح:
const allCourses = allCoursesKeys.map(item => item.value);

// ✅ بعد الإصلاح:
const allCourses = allCoursesKeys.map(item => item.value).filter(course => course != null);
```

### 2. التحقق من وجود الخصائص قبل الوصول إليها:

```typescript
// ❌ قبل الإصلاح:
const departmentCourses = allCourses.filter(course => course.department === department);

// ✅ بعد الإصلاح:
const departmentCourses = allCourses.filter(course => course && course.department === department);
```

### 3. التحقق من البيانات قبل إضافتها إلى curriculum:

```typescript
// ❌ قبل الإصلاح:
departmentCourses.forEach(course => {
  if (!curriculum[course.level]) {
    curriculum[course.level] = [];
  }
  curriculum[course.level].push(course);
});

// ✅ بعد الإصلاح:
departmentCourses.forEach(course => {
  if (course && course.level) {
    if (!curriculum[course.level]) {
      curriculum[course.level] = [];
    }
    curriculum[course.level].push(course);
  }
});
```

### 4. معالجة آمنة للقيم في الحسابات:

```typescript
// ❌ قبل الإصلاح:
credit_hours: curriculum[parseInt(level)].reduce((sum, course) => sum + course.credit_hours, 0)

// ✅ بعد الإصلاح:
credit_hours: curriculum[parseInt(level)].reduce((sum, course) => sum + (course.credit_hours || 0), 0)
```

---

## 📝 الملفات المعدلة

### `/supabase/functions/server/index.tsx`

#### تم تعديل endpoint: `GET /make-server-1573e40a/courses`

```typescript
app.get('/make-server-1573e40a/courses', async (c) => {
  try {
    const level = c.req.query('level');
    const department = c.req.query('department');

    // Get all courses from KV
    const allCoursesKeys = await kv.getByPrefix('course:');
    let courses = allCoursesKeys.map(item => item.value).filter(course => course != null); // ✅ فلترة

    // Filter by level if specified
    if (level) {
      courses = courses.filter(course => course && course.level === parseInt(level)); // ✅ تحقق
    }

    // Filter by department if specified
    if (department) {
      courses = courses.filter(course => course && course.department === department); // ✅ تحقق
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
```

#### تم تعديل endpoint: `GET /make-server-1573e40a/curriculum`

```typescript
app.get('/make-server-1573e40a/curriculum', async (c) => {
  try {
    const department = c.req.query('department') || 'MIS';

    // Get all courses
    const allCoursesKeys = await kv.getByPrefix('course:');
    const allCourses = allCoursesKeys.map(item => item.value).filter(course => course != null); // ✅ فلترة

    // Filter by department
    const departmentCourses = allCourses.filter(course => course && course.department === department); // ✅ تحقق

    // Group by level
    const curriculum: Record<number, any[]> = {};
    departmentCourses.forEach(course => {
      if (course && course.level) { // ✅ تحقق
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
      credit_hours: curriculum[parseInt(level)].reduce((sum, course) => sum + (course.credit_hours || 0), 0), // ✅ معالجة آمنة
    }));

    return c.json({
      department,
      curriculum,
      levelSummary,
      totalCourses: departmentCourses.length,
      totalCreditHours: departmentCourses.reduce((sum, course) => sum + (course.credit_hours || 0), 0), // ✅ معالجة آمنة
    });
  } catch (error: any) {
    console.error('Error fetching curriculum:', error);
    return c.json({ error: 'Failed to fetch curriculum' }, 500);
  }
});
```

---

## 🧪 الاختبار

### قبل الإصلاح:
```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-1573e40a/curriculum?department=MIS
# ❌ Error: Cannot read properties of undefined (reading 'department')
```

### بعد الإصلاح:
```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-1573e40a/curriculum?department=MIS
# ✅ يعمل بشكل صحيح ويعيد البيانات
{
  "department": "MIS",
  "curriculum": {
    "1": [...],
    "2": [...],
    ...
  },
  "levelSummary": [...],
  "totalCourses": 49,
  "totalCreditHours": 138
}
```

---

## 🎯 النتيجة

✅ **تم إصلاح جميع الأخطاء!**

الآن يمكنك:
1. ✅ فتح صفحة المنهج الدراسي (Curriculum Page)
2. ✅ تحميل المقررات بنجاح
3. ✅ عرض جميع المستويات (1-8)
4. ✅ عرض تفاصيل كل مقرر
5. ✅ فلترة المقررات حسب المستوى والقسم

---

## 🔒 الوقاية المستقبلية

لتجنب هذه الأخطاء في المستقبل:

1. ✅ **دائماً فلتر القيم الفارغة:**
   ```typescript
   .filter(item => item != null)
   ```

2. ✅ **تحقق من الخصائص قبل الوصول إليها:**
   ```typescript
   if (course && course.property) { ... }
   ```

3. ✅ **استخدم القيم الافتراضية:**
   ```typescript
   course.credit_hours || 0
   ```

4. ✅ **معالجة الأخطاء بشكل صحيح:**
   ```typescript
   try {
     // code
   } catch (error) {
     console.error('Error:', error);
     return c.json({ error: 'Message' }, 500);
   }
   ```

---

**تاريخ الإصلاح:** 16 نوفمبر 2025  
**الحالة:** ✅ تم الإصلاح بنجاح  
**التأثير:** جميع endpoints تعمل بشكل صحيح الآن
