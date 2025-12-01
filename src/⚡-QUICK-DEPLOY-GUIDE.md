# ⚡ دليل النشر السريع - Edge Function

## ❌ المشكلة:
```
TypeError: Failed to fetch
```
**السبب:** Edge Function غير منشورة في Supabase الجديد!

---

## ✅ الحل الأسرع (5 دقائق):

### الخطوة 1: افتح Supabase Dashboard
1. اذهب إلى: https://supabase.com/dashboard
2. افتح مشروعك: `kcbxyonombsqamwsmmqz`

### الخطوة 2: اذهب إلى Edge Functions
من القائمة الجانبية اليسرى، اضغط:
```
Edge Functions
```

### الخطوة 3: أنشئ Function جديدة
1. اضغط **"Create a new function"**
2. في **Function name**، اكتب بالضبط:
   ```
   make-server-1573e40a
   ```
3. اضغط **"Create function"**

### الخطوة 4: ارفع الكود
بعد إنشاء Function:

**الطريقة الأسهل - رفع ملف واحد:**
1. اضغط **"Deploy"** أو **"Edit"**
2. سيفتح محرر الكود
3. **احذف الكود الموجود** (إن وجد)
4. **انسخ محتوى** الملف `/supabase/functions/server/index.tsx` من هنا
5. **الصقه** في المحرر
6. اضغط **"Deploy"** أو **"Save and deploy"**

### الخطوة 5: أضف Environment Variables
**مهم جداً!**

1. في نفس صفحة Edge Functions، اضغط **"⚙️ Settings"**
2. اذهب إلى قسم **"Environment Variables"**
3. أضف هذه المتغيرات:

#### أ. SUPABASE_URL
```
https://kcbxyonombsqamwsmmqz.supabase.co
```

#### ب. SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnh5b25vbWJzcWFtd3NtbXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzA3OTMsImV4cCI6MjA3OTk0Njc5M30.IR1b_sKmNZnPHSx_EBTI0G5ouARblxMepr24nOxq8iM
```

#### ج. SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjYnh5b25vbWJzcWFtd3NtbXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM3MDc5MywiZXhwIjoyMDc5OTQ2NzkzfQ.5cgLm3CjLP0NzGE6riqoZTtABW1wljEEJ7iH0XAeJR0
```

4. اضغط **"Add"** أو **"Save"** لكل متغير

---

## 🧪 اختبار النشر:

### في المتصفح، افتح:
```
https://kcbxyonombsqamwsmmqz.supabase.co/functions/v1/make-server-1573e40a/health
```

### يجب أن تشاهد:
```json
{
  "status": "ok",
  "message": "KKU Course Registration System - SQL Database",
  "database": "PostgreSQL via Supabase"
}
```

✅ **إذا شاهدت هذه الرسالة، النشر نجح!**

---

## 🎯 بعد النشر:

جرب إنشاء حساب في التطبيق:
- يجب أن يعمل **بدون** خطأ "Failed to fetch"
- يجب أن يُنشأ الحساب بنجاح

---

## 🆘 إذا واجهت مشاكل:

### خطأ: "Function not found"
- تأكد من اسم Function: `make-server-1573e40a`
- تأكد من النشر (Deploy)

### خطأ: "Internal Server Error"
- افتح **Logs** في صفحة Edge Function
- شاهد الخطأ التفصيلي
- غالباً السبب: Environment Variables ناقصة

### خطأ: "Invalid JWT"
- تأكد من Environment Variables صحيحة
- تأكد من نسخ Keys كاملة (بدون مسافات)

---

## 📸 لقطات الشاشة للمساعدة:

### 1. إنشاء Function:
```
Edge Functions → Create a new function
Name: make-server-1573e40a
```

### 2. Deploy:
```
Click "Deploy" → Paste code → Save
```

### 3. Environment Variables:
```
Settings → Environment Variables → Add
```

---

## ⏱️ الوقت المتوقع:
- إنشاء Function: 1 دقيقة
- نسخ الكود: 1 دقيقة
- Deploy: 1 دقيقة
- إضافة Environment Variables: 2 دقيقة
- **المجموع: 5 دقائق**

---

**ابدأ الآن!** 🚀

بعد النشر، أخبرني بالنتيجة!
