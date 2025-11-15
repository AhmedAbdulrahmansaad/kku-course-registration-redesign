import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Loader2, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAgreement?: boolean;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAgreement = true,
  allowedRoles = [],
}) => {
  const { setCurrentPage, isLoggedIn, userInfo, language } = useApp();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // 1️⃣ التحقق من قبول التعهد
      const agreementAccepted = localStorage.getItem('agreementAccepted');
      
      if (requireAgreement && agreementAccepted !== 'true') {
        console.log('❌ Access Agreement not accepted - Redirecting...');
        setCurrentPage('accessAgreement');
        setIsChecking(false);
        setIsAuthorized(false);
        return;
      }

      // 2️⃣ التحقق من تسجيل الدخول
      if (requireAuth && !isLoggedIn) {
        console.log('❌ User not logged in - Redirecting to login...');
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        setCurrentPage('login');
        setIsChecking(false);
        setIsAuthorized(false);
        return;
      }

      // 3️⃣ التحقق من الأدوار (Role-Based Access Control)
      if (allowedRoles.length > 0 && userInfo) {
        const userRole = userInfo.role || 'student';
        if (!allowedRoles.includes(userRole)) {
          console.log(`❌ User role "${userRole}" not authorized - Required roles:`, allowedRoles);
          setCurrentPage('home');
          setIsChecking(false);
          setIsAuthorized(false);
          return;
        }
      }

      // ✅ كل الفحوصات نجحت
      console.log('✅ Access granted');
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAccess();
  }, [requireAuth, requireAgreement, allowedRoles, isLoggedIn, userInfo, setCurrentPage]);

  // شاشة التحميل أثناء الفحص
  if (isChecking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-kku-green mb-4" />
        <p className="text-lg text-muted-foreground">
          {language === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Checking permissions...'}
        </p>
      </div>
    );
  }

  // إذا لم يكن مصرح له
  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {language === 'ar' ? 'غير مصرح لك بالدخول' : 'Access Denied'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'جاري تحويلك إلى الصفحة المناسبة...' 
            : 'Redirecting to appropriate page...'}
        </p>
      </div>
    );
  }

  // ✅ مصرح له - عرض المحتوى
  return <>{children}</>;
};
