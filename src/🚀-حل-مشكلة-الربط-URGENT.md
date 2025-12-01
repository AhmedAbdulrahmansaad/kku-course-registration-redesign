# 🚀 حل مشكلة الربط بين النظام و Supabase - URGENT

## ⚠️ المشكلة المحددة:
✅ الجداول موجودة في Supabase (courses, users, students, etc.)  
❌ النظام لا يصل إليها  
❌ Edge Function غير منشور  

---

## 🔥 الحل السريع (3 خطوات فقط)

### الخطوة 1️⃣: نشر Edge Function

```bash
# في Terminal
cd supabase/functions
supabase functions deploy server --no-verify-jwt
```

**أو يدوياً في Supabase Dashboard:**
1. اذهب إلى: https://supabase.com/dashboard/project/YOUR_PROJECT/functions
2. اضغط "Deploy new function"
3. الاسم: `server`
4. انسخ كل محتويات `/supabase/functions/server/index.tsx`
5. الصق في Function Editor
6. اضغط "Deploy"

---

### الخطوة 2️⃣: إضافة Environment Variables في Edge Function

في Supabase Dashboard → Edge Functions → server → Settings:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**للحصول على الـ Keys:**
1. اذهب إلى: Settings → API
2. انسخ:
   - `URL` → SUPABASE_URL
   - `service_role` secret → SUPABASE_SERVICE_ROLE_KEY

---

### الخطوة 3️⃣: اختبار الاتصال

افتح Console في المتصفح (F12) وجرب:

```javascript
// اختبار Health Check
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-1573e40a/health')
  .then(r => r.json())
  .then(console.log);

// يجب أن يرجع:
// {
//   status: "ok",
//   message: "KKU Course Registration System - SQL Database",
//   database: "PostgreSQL via Supabase"
// }
```

---

## 📋 إذا لم ينجح الحل أعلاه، جرب هذا البديل

### البديل: نشر Function مبسط للاختبار

1. في Supabase Dashboard → Edge Functions → New Function
2. الاسم: `make-server-1573e40a`
3. انسخ والصق هذا الكود:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Health check
    if (path === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', message: 'Connected to Supabase' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get courses
    if (path === '/courses') {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('active', true)
        .order('level')
        .order('code')

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, courses: data, count: data.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

4. Deploy
5. اختبر: `https://YOUR_PROJECT.supabase.co/functions/v1/make-server-1573e40a/health`

---

## 🔍 فحص الاتصال الحالي

### في Supabase Dashboard:

1. **اذهب إلى**: Edge Functions
2. **تحقق من**: هل يوجد function باسم `server` أو `make-server-1573e40a`؟
3. **إذا لا**: يجب نشره (الخطوة 1 أعلاه)
4. **إذا نعم**: تحقق من Logs للأخطاء

### في المتصفح:

1. افتح النظام
2. افتح Console (F12)
3. حاول إنشاء حساب أو عرض المقررات
4. **راقب**: Network Tab
5. **ابحث عن**: طلبات لـ `supabase.co/functions/v1/`

**إذا رأيت:**
- ✅ Status 200 → الاتصال يعمل
- ❌ Status 404 → Function غير موجود
- ❌ Status 500 → خطأ في Function
- ❌ CORS error → مشكلة CORS

---

## 🛠️ استكشاف الأخطاء

### خطأ: "Function not found"
**الحل:** Edge Function غير منشور - اتبع الخطوة 1

### خطأ: "CORS policy"
**الحل:** أضف CORS headers في Function:
```typescript
app.use('*', cors())
```

### خطأ: "Unauthorized"
**الحل:** تأكد من Environment Variables في Edge Function

### خطأ: "relation does not exist"
**الحل:** نفذ SQL scripts:
```sql
-- في Supabase SQL Editor
-- نفذ: /database_clean_install.sql
-- ثم: /🔥-INSERT-ALL-DATA.sql
```

---

## ✅ قائمة التحقق

- [ ] الجداول موجودة في Supabase (✅ أنت قلت نعم)
- [ ] البيانات موجودة في الجداول (49 مقرر)
- [ ] Edge Function منشور
- [ ] Environment Variables مضافة في Function
- [ ] CORS مفعل في Function
- [ ] اختبار Health Check ينجح
- [ ] النظام يستطيع جلب المقررات

---

## 🎯 الخطوة التالية بعد النشر

بعد نشر Edge Function بنجاح:

1. افتح النظام
2. اذهب إلى صفحة "إنشاء حساب جديد"
3. أنشئ حساب اختبار:
   - الرقم الجامعي: 442200001
   - البريد: test@kku.edu.sa
   - كلمة المرور: Test123!
   - الاسم: طالب اختبار
   - المستوى: 1
   - التخصص: MIS

4. تحقق من Supabase:
   - Table Editor → users
   - يجب أن ترى المستخدم الجديد!
   - Table Editor → students
   - يجب أن ترى بيانات الطالب!

5. سجل دخول وجرب تسجيل مقرر

---

## 📞 إذا ما زالت المشكلة موجودة

أرسل لي:
1. Screenshot من Edge Functions في Supabase
2. Screenshot من Console (F12) عند محاولة فتح صفحة المقررات
3. Screenshot من Network Tab

**وسأحلها فوراً!**

---

**آخر تحديث:** 30 نوفمبر 2024  
**الحالة:** ⚠️ يحتاج نشر Edge Function
