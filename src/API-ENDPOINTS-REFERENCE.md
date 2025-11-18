# 🔌 API Endpoints Reference - نظام تسجيل المقررات

## 📚 جدول المحتويات
1. [Authentication](#authentication)
2. [Students](#students)
3. [Registrations](#registrations)
4. [Courses](#courses)
5. [Admin/Supervisor](#adminsupervisor)
6. [Dashboard Stats](#dashboard-stats)

---

## 🔐 Authentication

### POST `/make-server-1573e40a/signup`
**الوصف:** إنشاء حساب طالب جديد

**Request Body:**
```json
{
  "studentId": "420123456",
  "email": "ahmad@kku.edu.sa",
  "password": "Test@123",
  "name": "أحمد محمد",
  "major": "Management Information Systems",
  "level": 3
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "420123456",
    "email": "ahmad@kku.edu.sa",
    "role": "student"
  },
  "message": "Account created successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `409` - Student ID already exists
- `500` - Server error

---

### GET `/make-server-1573e40a/auth/me`
**الوصف:** جلب بيانات المستخدم الحالي المسجل

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "420123456",
    "name": "أحمد محمد",
    "email": "ahmad@kku.edu.sa",
    "role": "student",
    "major": "Management Information Systems",
    "level": 3,
    "gpa": 3.85,
    "earned_hours": 45
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (no token)
- `404` - User not found
- `500` - Server error

---

## 👥 Students

### GET `/make-server-1573e40a/students`
**الوصف:** جلب جميع الطلاب النشطين

**Headers:**
```
Authorization: Bearer {publicAnonKey}
```

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": "uuid",
      "student_id": "420123456",
      "name": "أحمد محمد",
      "email": "ahmad@kku.edu.sa",
      "role": "student",
      "students": [
        {
          "major": "Management Information Systems",
          "level": 3,
          "gpa": 3.85
        }
      ]
    }
  ],
  "count": 15
}
```

---

### GET `/make-server-1573e40a/students/:id`
**الوصف:** جلب بيانات طالب محدد

**Parameters:**
- `id` (path) - student_id (مثل: 420123456)

**Response:**
```json
{
  "success": true,
  "student": {
    "id": "uuid",
    "student_id": "420123456",
    "name": "أحمد محمد",
    "email": "ahmad@kku.edu.sa",
    "students": [
      {
        "major": "Management Information Systems",
        "level": 3,
        "gpa": 3.85,
        "earned_hours": 45
      }
    ]
  }
}
```

---

### DELETE `/make-server-1573e40a/students/:id`
**الوصف:** حذف طالب نهائياً (Hard Delete)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Parameters:**
- `id` (path) - student_id

**Response:**
```json
{
  "success": true,
  "message": "Student permanently deleted with all related data",
  "deletedStudent": {
    "id": "uuid",
    "studentId": "420123456",
    "name": "أحمد محمد"
  }
}
```

**ملاحظة:** يحذف من:
1. `registrations` table
2. `notifications` table
3. `students` table
4. `users` table
5. `auth.users` (Supabase Auth)

---

## 📝 Registrations

### POST `/make-server-1573e40a/registrations`
**الوصف:** تسجيل مقرر جديد

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "course_id": "uuid-of-course",
  "semester": "1",
  "year": 2024
}
```

**Response:**
```json
{
  "success": true,
  "registration": {
    "id": "uuid",
    "student_id": "uuid",
    "course_id": "uuid",
    "status": "pending",
    "semester": "1",
    "year": 2024,
    "created_at": "2024-11-18T10:00:00Z"
  },
  "message": "Course registered successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error / Already registered
- `401` - Unauthorized
- `409` - Conflict (time, prerequisites)
- `500` - Server error

---

### GET `/make-server-1573e40a/registrations`
**الوصف:** جلب تسجيلات (مع فلاتر اختيارية)

**Query Parameters:**
- `studentId` (optional) - student_id للفلترة
- `status` (optional) - pending, approved, rejected, completed

**Example:**
```
GET /registrations?status=pending
GET /registrations?studentId=420123456
```

**Response:**
```json
{
  "success": true,
  "registrations": [
    {
      "id": "uuid",
      "registration_id": "uuid",
      "student_id": "uuid",
      "course_id": "uuid",
      "status": "pending",
      "created_at": "2024-11-18T10:00:00Z",
      "student": {
        "full_name": "أحمد محمد",
        "email": "ahmad@kku.edu.sa",
        "major": "Management Information Systems",
        "level": 3,
        "gpa": 3.85
      },
      "course": {
        "code": "BSIT102",
        "name_ar": "أساسيات البرمجة",
        "name_en": "Programming Fundamentals",
        "credits": 3,
        "level": 1
      }
    }
  ],
  "count": 5
}
```

---

### GET `/make-server-1573e40a/student/registrations`
**الوصف:** جلب تسجيلات الطالب الحالي (مصادق عليه)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "registrations": [
    {
      "id": "uuid",
      "course_id": "uuid",
      "status": "approved",
      "grade": "A",
      "grade_point": 4.75,
      "course": {
        "code": "BSIT102",
        "name_ar": "أساسيات البرمجة",
        "credits": 3
      }
    }
  ],
  "count": 10
}
```

---

### PUT `/make-server-1573e40a/registrations/:id`
**الوصف:** تحديث حالة تسجيل (للمشرف/المدير)

**Parameters:**
- `id` (path) - registration UUID

**Request Body:**
```json
{
  "status": "approved",
  "supervisorId": "supervisor_student_id"
}
```

**Response:**
```json
{
  "success": true,
  "registration": {
    "id": "uuid",
    "status": "approved",
    "courses": {
      "code": "BSIT102",
      "name_ar": "أساسيات البرمجة"
    }
  },
  "message": "Registration approved successfully"
}
```

---

### DELETE `/make-server-1573e40a/registrations/:id`
**الوصف:** إلغاء تسجيل مقرر (للطالب قبل الموافقة)

**Response:**
```json
{
  "success": true,
  "message": "Registration cancelled successfully"
}
```

---

## 📚 Courses

### GET `/make-server-1573e40a/courses`
**الوصف:** جلب جميع المقررات النشطة

**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "id": "uuid",
      "code": "BSIT102",
      "name_ar": "أساسيات البرمجة",
      "name_en": "Programming Fundamentals",
      "credits": 3,
      "level": 1,
      "active": true
    }
  ],
  "count": 49
}
```

---

### GET `/make-server-1573e40a/courses/available`
**الوصف:** جلب المقررات المتاحة للطالب الحالي

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "id": "uuid",
      "code": "BSIT201",
      "name_ar": "برمجة الويب",
      "credits": 3,
      "level": 2,
      "available": true
    }
  ],
  "count": 12
}
```

**ملاحظة:** يستثني:
- المقررات المسجلة بالفعل
- المقررات أعلى من مستوى الطالب

---

## 👨‍💼 Admin/Supervisor

### GET `/make-server-1573e40a/admin/students`
**الوصف:** جلب جميع الطلاب (للمدير/المشرف)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": "420123456",
      "student_id": "420123456",
      "name": "أحمد محمد",
      "email": "ahmad@kku.edu.sa",
      "major": "Management Information Systems",
      "level": 3,
      "gpa": 3.85,
      "earned_hours": 45,
      "role": "student"
    }
  ],
  "count": 15
}
```

---

### GET `/make-server-1573e40a/admin/registration-requests`
**الوصف:** جلب طلبات التسجيل المعلقة

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "request_id": "uuid",
      "student_id": "uuid",
      "course_id": "uuid",
      "status": "pending",
      "created_at": "2024-11-18T10:00:00Z",
      "student": {
        "full_name": "أحمد محمد",
        "email": "ahmad@kku.edu.sa",
        "major": "Management Information Systems",
        "level": 3,
        "gpa": 3.85
      },
      "course": {
        "code": "BSIT102",
        "name_ar": "أساسيات البرمجة",
        "credits": 3,
        "level": 1
      }
    }
  ],
  "count": 10
}
```

---

### POST `/make-server-1573e40a/admin/process-registration-request`
**الوصف:** موافقة أو رفض طلب تسجيل

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "request_id": "uuid",
  "action": "approve",
  "note": "optional rejection reason"
}
```

**Actions:**
- `approve` - الموافقة على الطلب
- `reject` - رفض الطلب

**Response (Success):**
```json
{
  "success": true,
  "message": "Request approved successfully",
  "registration": {
    "id": "uuid",
    "status": "approved"
  }
}
```

**Response (Already Processed):**
```json
{
  "success": false,
  "error": "Request already approved",
  "currentStatus": "approved"
}
```

**Status Codes:**
- `200` - Success
- `400` - Already processed / Invalid action
- `401` - Unauthorized
- `403` - Forbidden (not admin/supervisor)
- `404` - Request not found
- `500` - Server error

---

### GET `/make-server-1573e40a/admin/student-report/:id`
**الوصف:** جلب تقرير أكاديمي مفصل لطالب

**Headers:**
```
Authorization: Bearer {access_token}
```

**Parameters:**
- `id` (path) - student_id

**Response:**
```json
{
  "success": true,
  "student": {
    "id": "420123456",
    "student_id": "420123456",
    "name": "أحمد محمد",
    "email": "ahmad@kku.edu.sa",
    "major": "Management Information Systems",
    "level": 3,
    "gpa": 3.85,
    "earned_hours": 45,
    "role": "student"
  },
  "registrations": [
    {
      "registration_id": "uuid",
      "course_id": "uuid",
      "status": "completed",
      "grade": "A",
      "grade_point": 4.75,
      "semester": "1",
      "year": 2024,
      "course": {
        "code": "BSIT102",
        "name_ar": "أساسيات البرمجة",
        "name_en": "Programming Fundamentals",
        "credits": 3,
        "level": 1
      }
    }
  ],
  "stats": {
    "totalCourses": 15,
    "approvedCourses": 10,
    "pendingCourses": 2,
    "rejectedCourses": 1,
    "completedCourses": 12,
    "totalHours": 45,
    "approvedHours": 30,
    "completedHours": 36
  }
}
```

---

## 📊 Dashboard Stats

### GET `/make-server-1573e40a/dashboard/student`
**الوصف:** إحصائيات لوحة تحكم الطالب

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "level": 3,
    "totalCourses": 15,
    "approvedCourses": 12,
    "pendingCourses": 2,
    "rejectedCourses": 1,
    "totalCredits": 45,
    "completedCredits": 36,
    "remainingCredits": 87,
    "gpa": 3.85,
    "completionPercentage": 34.09
  }
}
```

---

### GET `/make-server-1573e40a/dashboard/supervisor`
**الوصف:** إحصائيات لوحة تحكم المشرف

**Query Parameters:**
- `supervisorId` - student_id of supervisor

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalStudents": 50,
    "pendingRequests": 15,
    "approvedRequests": 120,
    "rejectedRequests": 8
  }
}
```

---

### GET `/make-server-1573e40a/dashboard/admin`
**الوصف:** إحصائيات لوحة تحكم المدير

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalStudents": 150,
    "totalSupervisors": 10,
    "totalCourses": 49,
    "totalRegistrations": 500,
    "pendingRequests": 25,
    "approvedRequests": 400,
    "rejectedRequests": 30,
    "completedRegistrations": 450
  }
}
```

---

## 🔑 Authentication Notes

### **Access Token:**
- يُحفظ في localStorage بعد تسجيل الدخول
- يُستخدم في header: `Authorization: Bearer {token}`
- صلاحيته: حسب إعدادات Supabase (عادة 1 ساعة)

### **Public Anon Key:**
- يُستخدم لـ endpoints العامة (مثل /students, /courses)
- لا يتطلب تسجيل دخول
- محدود الصلاحيات (read-only)

### **Roles:**
- `student` - طالب عادي
- `supervisor` - مشرف أكاديمي
- `admin` - مدير النظام

---

## ⚠️ Error Codes

### **Common Status Codes:**

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error / Invalid input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry / Constraint violation |
| 500 | Internal Server Error | Server error |

### **Error Response Format:**
```json
{
  "success": false,
  "error": "User-friendly error message",
  "details": "Technical details (development only)"
}
```

---

## 🧪 Testing Examples

### **cURL Examples:**

#### **1. Sign Up:**
```bash
curl -X POST https://{projectId}.supabase.co/functions/v1/make-server-1573e40a/signup \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "420123456",
    "email": "ahmad@kku.edu.sa",
    "password": "Test@123",
    "name": "أحمد محمد",
    "major": "Management Information Systems",
    "level": 3
  }'
```

#### **2. Get Current User:**
```bash
curl -X GET https://{projectId}.supabase.co/functions/v1/make-server-1573e40a/auth/me \
  -H "Authorization: Bearer {access_token}"
```

#### **3. Register Course:**
```bash
curl -X POST https://{projectId}.supabase.co/functions/v1/make-server-1573e40a/registrations \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "uuid-of-course",
    "semester": "1",
    "year": 2024
  }'
```

#### **4. Approve Request:**
```bash
curl -X POST https://{projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/process-registration-request \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "uuid",
    "action": "approve"
  }'
```

---

## 📝 Notes

### **Best Practices:**
1. ✅ Always include `Authorization` header for protected endpoints
2. ✅ Check `success` field in response before processing
3. ✅ Handle errors gracefully with user-friendly messages
4. ✅ Log errors to console for debugging
5. ✅ Use `try-catch` blocks for all API calls

### **Common Mistakes:**
- ❌ Forgetting Authorization header
- ❌ Not checking `success` field
- ❌ Using wrong content-type
- ❌ Not handling 401 (token expired)
- ❌ Hardcoding UUIDs instead of getting them dynamically

---

## 🔗 Base URL

```
Production: https://{projectId}.supabase.co/functions/v1/make-server-1573e40a
```

Replace `{projectId}` with your Supabase project ID from `/utils/supabase/info.tsx`.

---

## 📚 Related Documentation

- [Complete Integration Guide](/✅-COMPLETE-BACKEND-DATA-INTEGRATION-FINAL.md)
- [Quick Summary](/✅-QUICK-SUMMARY.md)
- [Student Data Fix](/✅-FIX-STUDENT-DATA-COMPLETED.md)
- [Supervisor Data Fix](/✅-FIX-SUPERVISOR-STUDENT-DATA-COMPLETED.md)

---

**Last Updated:** نوفمبر 2024  
**Version:** 1.0  
**Status:** ✅ Production Ready
