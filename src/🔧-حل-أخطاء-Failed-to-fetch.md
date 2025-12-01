# 🔧 حل أخطاء Failed to fetch

## 📍 الأخطاء الحالية:

```
❌ Failed to fetch
⚠️ Backend unavailable, falling back to localStorage
🚫 Access denied: User not logged in
```

---

## 🎯 السبب الرئيسي:

**Edge Function غير منشور في Supabase!**

النظام يحاول الاتصال بـ:
```
https://kcbxyonombsqamwsmmqz.supabase.co/functions/v1/make-server-1573e40a/...
```

لكن Edge Function غير موجود أو غير منشور.

---

## ✅ الحل الكامل (5 دقائق):

### الخطوة 1️⃣: تأكد من نشر Edge Function

#### افتح Supabase:
```
1. https://supabase.com/dashboard
2. افتح المشروع
3. اذهب لـ Edge Functions
```

#### تحقق:
```
هل يوجد function اسمه "server"؟

✅ نعم → انتقل للخطوة 2
❌ لا → أنشئه الآن (اتبع الخطوات أدناه)
```

---

### الخطوة 2️⃣: إنشاء/تحديث Edge Function

#### في Supabase Edge Functions:

```
1. اضغط "Create function" (إذا لم يكن موجود)
2. Function name: server
3. اختر "Via Editor"
4. اضغط Create
```

#### انسخ الكود:

```
1. في هذا المشروع، افتح: 🚀-COPY-THIS-TO-SUPABASE.ts
2. حدد كل الكود (Ctrl+A)
3. انسخه (Ctrl+C)
4. ارجع لـ Supabase Function Editor
5. احذف الكود القديم
6. الصق الكود الجديد (Ctrl+V)
```

---

### الخطوة 3️⃣: إضافة Environment Variables

#### في Function → Secrets:

```
أضف هذين المتغيرين بالضبط:
```

**المتغير 1:**
```
Name: SUPABASE_URL
Value: https://kcbxyonombsqamwsmmqz.supabase.co
```

**المتغير 2:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnh5b25vbWJzcWFtd3NtbXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM3MDc5MywiZXhwIjoyMDc5OTQ2NzkzfQ.5cgLm3CjLP0NzGE6riqoZTtABW1wljEEJ7iH0XAeJR0
```

---

### الخطوة 4️⃣: Deploy

```
1. اضغط "Deploy" أو "Save and Deploy"
2. انتظر حتى ترى: ✅ Deployment successful
3. تأكد من أن الحالة: 🟢 Active
```

---

### الخطوة 5️⃣: اختبار الاتصال

#### افتح Console (F12):

```javascript
// اختبار Health Check
fetch('https://kcbxyonombsqamwsmmqz.supabase.co/functions/v1/make-server-1573e40a/health')
  .then(r => r.json())
  .then(data => {
    console.log('🏥 Health Check:', data);
    if (data.status === 'ok') {
      console.log('✅ Edge Function يعمل!');
    } else {
      console.log('❌ مشكلة في Edge Function');
    }
  })
  .catch(err => {
    console.error('❌ لا يمكن الوصول لـ Edge Function:', err);
    console.log('تأكد من نشر Function');
  });
```

**النتيجة المتوقعة:**
```json
{
  "status": "ok",
  "message": "KKU Course Registration System - Connected to PostgreSQL",
  "env": { "hasUrl": true, "hasKey": true }
}
✅ Edge Function يعمل!
```

---

### الخطوة 6️⃣: أعد تحميل النظام

```
1. أغلق النظام
2. أعد فتحه (Preview)
3. افتح Console (F12)
4. جرب إنشاء حساب
```

**يجب أن ترى:**
```
✅ [Signup] SQL Database signup successful
```

**بدلاً من:**
```
❌ Backend unavailable, falling back to localStorage
```

---

## 🔍 استكشاف الأخطاء

### خطأ: 404 Not Found

**السبب:** Function غير موجود أو الاسم خاطئ

**الحل:**
```
1. تأكد من اسم Function: server (بالضبط)
2. تأكد من أنه منشور (Status: Active)
3. URL يجب أن يكون:
   https://kcbxyonombsqamwsmmqz.supabase.co/functions/v1/make-server-1573e40a/...
```

---

### خطأ: 500 Internal Server Error

**السبب:** Environment Variables خاطئة

**الحل:**
```
1. اذهب لـ Function → Secrets
2. تأكد من وجود:
   ✅ SUPABASE_URL
   ✅ SUPABASE_SERVICE_ROLE_KEY
3. تأكد من القيم الصحيحة (انظر الخطوة 3)
4. أعد Deploy
```

---

### خطأ: CORS Policy

**السبب:** CORS headers غير موجودة في الكود

**الحل:**
```
تأكد من نسخ الكود كاملاً من: 🚀-COPY-THIS-TO-SUPABASE.ts
الكود يحتوي CORS headers في البداية:

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '...',
}
```

---

### خطأ: "relation does not exist"

**السبب:** الجداول غير موجودة

**الحل:**
```
1. في Supabase → SQL Editor
2. نفذ: database_clean_install.sql
3. نفذ: 🔥-INSERT-ALL-DATA.sql
```

---

## ✅ التحقق النهائي

بعد نشر Edge Function، افتح Console (F12) وجرب:

### اختبار 1: Health Check
```javascript
fetch('https://kcbxyonombsqamwsmmqz.supabase.co/functions/v1/make-server-1573e40a/health')
  .then(r => r.json())
  .then(console.log);
```
**✅ يجب أن ترى:** `status: "ok"`

### اختبار 2: Courses
```javascript
fetch('https://kcbxyonombsqamwsmmqz.supabase.co/functions/v1/make-server-1573e40a/courses')
  .then(r => r.json())
  .then(data => console.log('المقررات:', data.count));
```
**✅ يجب أن ترى:** `count: 49`

### اختبار 3: Signup
```
1. افتح النظام
2. إنشاء حساب جديد
3. شاهد Console
```
**✅ يجب أن ترى:** `✅ SQL Database signup successful`

---

## 🎯 ملخص الحل

```
المشكلة: Failed to fetch
السبب: Edge Function غير منشور
الحل:
  1. ✅ نشر Edge Function في Supabase
  2. ✅ الاسم: server
  3. ✅ الكود من: 🚀-COPY-THIS-TO-SUPABASE.ts
  4. ✅ Environment Variables مضافة
  5. ✅ Deploy
  6. ✅ اختبار

النتيجة: النظام يتصل بقاعدة البيانات ✅
```

---

## 📞 إذا استمرت المشكلة

أرسل لي screenshot من:
1. Supabase Edge Functions page (يظهر Function واسمه وحالته)
2. Supabase Function Secrets (يظهر أسماء المتغيرات فقط - بدون القيم)
3. Console في المتصفح عند محاولة إنشاء حساب

---

**ابدأ من الخطوة 1 الآن! 🚀**
