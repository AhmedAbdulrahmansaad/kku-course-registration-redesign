# 📚 دليل استخدام fetchWithTimeout - للمطورين

## نظرة عامة

`fetchWithTimeout` هو utility قوي يوفر fetch مع timeout تلقائي ومعالجة أخطاء شاملة، مصمم خصيصاً لنظام تسجيل المقررات بجامعة الملك خالد.

---

## 📦 الاستيراد

```typescript
import { 
  fetchWithTimeout,
  fetchJSON,
  fetchWithRetry,
  createAuthFetchOptions,
  getErrorMessage
} from '../../utils/fetchWithTimeout';
```

---

## 🔧 الدوال المتاحة

### 1️⃣ fetchJSON() - الأكثر استخداماً ⭐

**الاستخدام الأساسي:**
```typescript
const result = await fetchJSON(
  `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/courses`,
  {
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
    timeout: 10000, // 10 seconds (اختياري)
  }
);
```

**مع المصادقة:**
```typescript
const accessToken = localStorage.getItem('access_token');
const result = await fetchJSON(
  `${API_URL}/student/registrations`,
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

**المميزات:**
- ✅ Timeout تلقائي (10 ثوانٍ افتراضياً)
- ✅ تحليل JSON تلقائي
- ✅ معالجة أخطاء شاملة
- ✅ رسائل خطأ واضحة

---

### 2️⃣ fetchWithTimeout() - للاستخدامات المتقدمة

**الاستخدام:**
```typescript
const response = await fetchWithTimeout(
  'https://api.example.com/data',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: 'value' }),
    timeout: 5000, // 5 seconds
  }
);

const data = await response.json();
```

**متى تستخدمه:**
- عندما تحتاج Response object كامل
- عندما تحتاج معالجة خاصة للـ response
- عند رفع ملفات أو بيانات ثنائية

---

### 3️⃣ fetchWithRetry() - إعادة محاولة ذكية

**الاستخدام:**
```typescript
const response = await fetchWithRetry(
  'https://api.example.com/data',
  {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  },
  2 // عدد المحاولات (افتراضي: 2)
);
```

**آلية العمل:**
```
محاولة 1 → فشل → انتظار 1 ثانية
محاولة 2 → فشل → انتظار 2 ثانية
محاولة 3 → نجاح أو فشل نهائي
```

**متى تستخدمه:**
- عند الاتصالات غير المستقرة
- عند الطلبات الحساسة
- عند رفع ملفات كبيرة

---

### 4️⃣ createAuthFetchOptions() - تبسيط المصادقة

**الاستخدام:**
```typescript
const accessToken = localStorage.getItem('access_token');
const options = createAuthFetchOptions(accessToken, {
  method: 'POST',
  body: JSON.stringify({ courseId: '123' }),
});

const response = await fetch(url, options);
```

**النتيجة:**
```typescript
{
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: '{"courseId":"123"}'
}
```

---

### 5️⃣ getErrorMessage() - رسائل خطأ موحدة

**الاستخدام:**
```typescript
try {
  const result = await fetchJSON(url);
} catch (error: any) {
  const errorMessage = getErrorMessage(
    error,
    { 
      ar: 'فشل في تحميل البيانات', 
      en: 'Failed to load data' 
    },
    language // 'ar' أو 'en'
  );
  toast.error(errorMessage);
}
```

**الترجمات التلقائية:**
```typescript
// Timeout
'ar': 'انتهى وقت الاتصال - يرجى المحاولة مرة أخرى'
'en': 'Connection timeout - Please try again'

// 401
'ar': 'جلسة منتهية - يرجى تسجيل الدخول مرة أخرى'
'en': 'Session expired - Please login again'

// 404
'ar': 'البيانات المطلوبة غير موجودة'
'en': 'Requested data not found'

// 500
'ar': 'خطأ في الخادم - يرجى المحاولة لاحقاً'
'en': 'Server error - Please try later'
```

---

## 💡 أمثلة عملية

### مثال 1: جلب المقررات المتاحة ✅

```typescript
const fetchCourses = async () => {
  try {
    setLoading(true);
    
    const result = await fetchJSON(
      `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/courses/available?studentId=${userInfo.id}`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        timeout: 10000, // 10 seconds
      }
    );

    if (result.success && result.courses) {
      setCourses(result.courses);
    } else {
      setCourses([]);
    }
  } catch (error: any) {
    const errorMessage = getErrorMessage(
      error,
      { ar: 'فشل في تحميل المقررات', en: 'Failed to load courses' },
      language
    );
    toast.error(errorMessage);
    setCourses([]);
  } finally {
    setLoading(false);
  }
};
```

---

### مثال 2: تسجيل مقرر جديد ✅

```typescript
const handleRegister = async (courseId: string) => {
  try {
    setRegistering(true);
    
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      toast.error(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login');
      return;
    }

    const result = await fetchJSON(
      `${API_URL}/registrations`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
        timeout: 15000, // 15 seconds للعمليات الكتابية
      }
    );

    if (result.success) {
      toast.success(language === 'ar' ? 'تم التسجيل بنجاح' : 'Registration successful');
    } else {
      throw new Error(result.error || 'Registration failed');
    }
  } catch (error: any) {
    const errorMessage = getErrorMessage(
      error,
      { ar: 'فشل في التسجيل', en: 'Registration failed' },
      language
    );
    toast.error(errorMessage);
  } finally {
    setRegistering(false);
  }
};
```

---

### مثال 3: جلب البيانات مع إعادة محاولة ✅

```typescript
const fetchImportantData = async () => {
  try {
    setLoading(true);
    
    const response = await fetchWithRetry(
      `${API_URL}/critical-data`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 8000, // 8 seconds per attempt
      },
      3 // 3 attempts total
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    setData(data);
  } catch (error: any) {
    console.error('Failed after 3 attempts:', error);
    toast.error('فشل تحميل البيانات بعد عدة محاولات');
  } finally {
    setLoading(false);
  }
};
```

---

### مثال 4: رفع ملف ✅

```typescript
const uploadFile = async (file: File) => {
  try {
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchWithTimeout(
      `${API_URL}/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
        timeout: 30000, // 30 seconds للملفات الكبيرة
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    toast.success('تم رفع الملف بنجاح');
    return result;
  } catch (error: any) {
    const errorMessage = getErrorMessage(
      error,
      { ar: 'فشل رفع الملف', en: 'File upload failed' },
      language
    );
    toast.error(errorMessage);
  } finally {
    setUploading(false);
  }
};
```

---

## ⚙️ إعدادات Timeout الموصى بها

```typescript
// جلب بيانات عادية (GET)
timeout: 10000, // 10 seconds

// عمليات كتابة (POST, PUT)
timeout: 15000, // 15 seconds

// رفع ملفات
timeout: 30000, // 30 seconds

// عمليات حساسة مع retry
timeout: 8000,  // 8 seconds × 3 attempts = 24 seconds total
```

---

## 🎯 أفضل الممارسات

### ✅ افعل
```typescript
// 1. استخدم fetchJSON للطلبات العادية
const data = await fetchJSON(url, options);

// 2. أضف timeout مناسب
timeout: 10000,

// 3. استخدم getErrorMessage للرسائل
const errorMessage = getErrorMessage(error, defaultMessages, language);

// 4. معالجة الأخطاء دائماً
try { ... } catch (error) { ... } finally { ... }

// 5. إضافة timeout عام للصفحة
const loadingTimeout = setTimeout(() => {
  if (loading) setLoading(false);
}, 15000);
```

### ❌ لا تفعل
```typescript
// 1. لا تستخدم fetch() بدون timeout
const response = await fetch(url); // ❌

// 2. لا تترك رسائل الخطأ غير مترجمة
toast.error(error.message); // ❌

// 3. لا تنسى معالجة الأخطاء
const data = await fetchJSON(url); // ❌ بدون try/catch

// 4. لا تستخدم timeout طويل جداً
timeout: 60000, // ❌ دقيقة كاملة!

// 5. لا تنسى تنظيف timeout
// ❌ بدون clearTimeout في cleanup
```

---

## 🔍 معالجة الأخطاء المتقدمة

### معالجة أخطاء محددة
```typescript
try {
  const result = await fetchJSON(url, options);
} catch (error: any) {
  if (error.message?.includes('timeout')) {
    // معالجة خاصة للـ timeout
    toast.warning('الاتصال بطيء - جاري إعادة المحاولة...');
    // retry logic...
  } else if (error.message?.includes('401')) {
    // جلسة منتهية
    localStorage.removeItem('access_token');
    setCurrentPage('login');
  } else if (error.message?.includes('404')) {
    // بيانات غير موجودة
    setData([]);
    toast.info('لا توجد بيانات');
  } else {
    // خطأ عام
    const errorMessage = getErrorMessage(error, defaultMessages, language);
    toast.error(errorMessage);
  }
}
```

---

## 📊 Timeout في الصفحات

### مثال كامل لصفحة
```typescript
export const MyPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    // 1. Timeout عام للصفحة (احتياطي)
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Loading timeout - forcing stop');
        setLoading(false);
        toast.error(
          language === 'ar'
            ? 'انتهى وقت التحميل - يرجى المحاولة مرة أخرى'
            : 'Loading timeout - Please try again'
        );
      }
    }, 15000); // 15 seconds

    // 2. جلب البيانات
    fetchData();

    // 3. تنظيف
    return () => clearTimeout(loadingTimeout);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // fetchJSON لديه timeout خاص به (10 ثوانٍ)
      const result = await fetchJSON(url, {
        headers: { ... },
        timeout: 10000,
      });

      setData(result.data);
    } catch (error: any) {
      const errorMessage = getErrorMessage(
        error,
        { ar: 'فشل التحميل', en: 'Loading failed' },
        language
      );
      toast.error(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return <DataView data={data} />;
};
```

---

## 🎨 أمثلة UI للحالات المختلفة

### حالة التحميل
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-kku-green mx-auto" />
        <p className="text-lg text-muted-foreground">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
}
```

### حالة فارغة
```typescript
if (data.length === 0) {
  return (
    <Card className="p-12 text-center">
      <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-2">
        {language === 'ar' ? 'لا توجد بيانات' : 'No Data'}
      </h3>
      <p className="text-muted-foreground mb-6">
        {language === 'ar'
          ? 'لم يتم العثور على أي بيانات'
          : 'No data found'}
      </p>
      <Button onClick={fetchData}>
        {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
      </Button>
    </Card>
  );
}
```

### حالة خطأ
```typescript
if (error) {
  return (
    <Card className="p-12 text-center border-destructive">
      <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-2 text-destructive">
        {language === 'ar' ? 'حدث خطأ' : 'Error Occurred'}
      </h3>
      <p className="text-muted-foreground mb-6">{error}</p>
      <div className="flex gap-4 justify-center">
        <Button onClick={fetchData}>
          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </Button>
        <Button variant="outline" onClick={() => setCurrentPage('home')}>
          {language === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
        </Button>
      </div>
    </Card>
  );
}
```

---

## 📝 قائمة مرجعية للمطورين

عند إضافة صفحة أو feature جديد:

```
✅ استخدم fetchJSON بدلاً من fetch
✅ أضف timeout مناسب (10-15 ثانية)
✅ أضف timeout عام للصفحة (15 ثانية)
✅ استخدم getErrorMessage للرسائل
✅ معالجة try/catch/finally كاملة
✅ عرض loading state
✅ عرض empty state
✅ عرض error state
✅ إضافة cleanup في useEffect
✅ اختبار timeout
✅ اختبار الأخطاء المختلفة
```

---

## 🚀 الخلاصة

`fetchWithTimeout` يوفر:
- ✅ Timeout تلقائي لمنع التعليق
- ✅ معالجة أخطاء شاملة
- ✅ رسائل مترجمة جاهزة
- ✅ إعادة محاولة ذكية
- ✅ واجهة سهلة الاستخدام

**استخدمه في جميع طلبات API لضمان تجربة مستخدم ممتازة!**

---

**تاريخ التحديث:** 18 نوفمبر 2025  
**الإصدار:** 1.0.0
