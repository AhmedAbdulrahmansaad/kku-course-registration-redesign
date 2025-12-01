# 📦 ملفات Edge Function المطلوبة للنشر

## 📂 الملفات التي يجب نشرها:

عند نشر Edge Function، تأكد من نسخ **جميع** هذه الملفات:

### 📁 /supabase/functions/server/

```
✅ index.tsx          (الملف الرئيسي - مطلوب)
✅ aiAssistant.tsx    (المساعد الذكي)
✅ aiFallback.tsx     (نسخة احتياطية للمساعد)
✅ coursesData.tsx    (بيانات المقررات)
✅ kv_store.tsx       (التخزين - محمي - لا تعدله)
```

---

## 🏗️ هيكل الملفات الصحيح:

```
supabase/
  functions/
    make-server-1573e40a/
      index.ts              ← الملف الرئيسي (سيُنشأ تلقائياً)
      aiAssistant.tsx
      aiFallback.tsx
      coursesData.tsx
      kv_store.tsx
```

---

## 📋 خطوات النشر اليدوي:

### الطريقة الموصى بها: نسخ جميع الملفات

#### 1. إنشاء مجلد مؤقت:
```
temp_deploy/
  index.ts
  aiAssistant.tsx
  aiFallback.tsx
  coursesData.tsx
  kv_store.tsx
```

#### 2. انسخ محتوى index.tsx إلى index.ts
(غيّر الامتداد من `.tsx` إلى `.ts`)

#### 3. انسخ باقي الملفات كما هي

#### 4. ارفع جميع الملفات إلى Supabase

---

## 🎯 النشر السريع عبر Dashboard:

### الخيار الأفضل: نشر الملف الرئيسي فقط

في Supabase Dashboard:

1. **Edge Functions** → **Create Function** → `make-server-1573e40a`

2. انسخ **محتوى index.tsx الكامل** والصقه

3. اضغط **Deploy**

**ملاحظة:** الملفات الأخرى (aiAssistant.tsx, etc.) يتم استيرادها من نفس المجلد

---

## 🔍 التحقق من النشر الناجح:

### 1. اختبار Health Check:

**URL:**
```
https://kcbxyonombsqamwsmmqz.supabase.co/functions/v1/make-server-1573e40a/health
```

**المتوقع:**
```json
{
  "status": "ok",
  "message": "KKU Course Registration System - SQL Database",
  "database": "PostgreSQL via Supabase"
}
```

### 2. عرض Logs:

في Supabase Dashboard:
- **Edge Functions** → `make-server-1573e40a` → **Logs**
- يجب أن تشاهد:
  ```
  GET /make-server-1573e40a/health 200
  ```

---

## ⚠️ مشاكل شائعة:

### ❌ "Module not found"
**الحل:** تأكد من استيراد الملفات بالمسار الصحيح:
```typescript
import { handleAIAssistant } from './aiAssistant.tsx';
import * as kv from './kv_store.tsx';
```

### ❌ "Invalid environment variable"
**الحل:** أضف Environment Variables في Settings

### ❌ "CORS error"
**الحل:** الكود يحتوي بالفعل على CORS - تأكد من النشر الصحيح

---

## 📝 ملخص الخطوات:

1. ✅ اذهب إلى Edge Functions في Dashboard
2. ✅ أنشئ Function باسم: `make-server-1573e40a`
3. ✅ انسخ محتوى `/supabase/functions/server/index.tsx`
4. ✅ الصقه في المحرر
5. ✅ اضغط Deploy
6. ✅ أضف Environment Variables
7. ✅ اختبر عبر Health Check URL

---

**الآن جرب النشر!** 🚀
