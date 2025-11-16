import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Shield, Lock, AlertTriangle, LogIn } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePledge?: boolean;
  allowedRoles?: ('student' | 'supervisor' | 'admin')[];
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = false,
  requirePledge = false,
  allowedRoles = [],
  redirectTo,
}) => {
  const { isLoggedIn, userInfo, hasPledgeAccepted, setCurrentPage, language } = useApp();

  useEffect(() => {
    // إذا كانت الصفحة تتطلب تسجيل دخول والمستخدم غير مسجل
    if (requireAuth && !isLoggedIn) {
      console.warn('🚫 Access denied: User not logged in');
      if (redirectTo) {
        setCurrentPage(redirectTo);
      }
    }

    // إذا كانت الصفحة تتطلب قبول التعهد والمستخدم لم يقبله
    if (requirePledge && !hasPledgeAccepted) {
      console.warn('🚫 Access denied: Pledge not accepted');
      setCurrentPage('pledge');
    }

    // إذا كانت الصفحة لديها أدوار محددة والمستخدم ليس لديه الصلاحية
    if (allowedRoles.length > 0 && isLoggedIn && userInfo) {
      const userRole = userInfo.role || 'student';
      if (!allowedRoles.includes(userRole as any)) {
        console.warn(`🚫 Access denied: User role "${userRole}" not allowed. Allowed roles:`, allowedRoles);
        // إعادة توجيه حسب الدور
        if (userRole === 'student') {
          setCurrentPage('studentDashboard');
        } else if (userRole === 'supervisor') {
          setCurrentPage('supervisorDashboard');
        } else if (userRole === 'admin') {
          setCurrentPage('home');
        } else {
          setCurrentPage('home');
        }
      }
    }
  }, [isLoggedIn, userInfo, hasPledgeAccepted, requireAuth, requirePledge, allowedRoles]);

  // إذا كانت الصفحة تتطلب تسجيل دخول والمستخدم غير مسجل
  if (requireAuth && !isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Lock className="h-16 w-16 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'الوصول محظور' : 'Access Denied'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'يجب عليك تسجيل الدخول للوصول إلى هذه الصفحة'
                : 'You must be logged in to access this page'}
            </p>
          </div>

          <Button
            onClick={() => setCurrentPage('login')}
            className="w-full bg-gradient-to-r from-[#184A2C] to-emerald-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </Card>
      </div>
    );
  }

  // إذا كانت الصفحة تتطلب قبول التعهد والمستخدم لم يقبله
  if (requirePledge && !hasPledgeAccepted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <AlertTriangle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'يجب قبول التعهد' : 'Pledge Required'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'يجب عليك قراءة وقبول تعهد الاستخدام للوصول إلى النظام'
                : 'You must read and accept the usage pledge to access the system'}
            </p>
          </div>

          <Button
            onClick={() => setCurrentPage('pledge')}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'قراءة التعهد' : 'Read Pledge'}
          </Button>
        </Card>
      </div>
    );
  }

  // إذا كانت الصفحة لديها أدوار محددة والمستخدم ليس لديه الصلاحية
  if (allowedRoles.length > 0 && isLoggedIn && userInfo) {
    const userRole = userInfo.role || 'student';
    if (!allowedRoles.includes(userRole as any)) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Shield className="h-16 w-16 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? 'غير مصرح' : 'Unauthorized'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? `دورك الحالي (${userRole}) لا يسمح بالوصول إلى هذه الصفحة`
                  : `Your current role (${userRole}) does not have access to this page`}
              </p>
            </div>

            <Button
              onClick={() => {
                if (userRole === 'student') {
                  setCurrentPage('studentDashboard');
                } else if (userRole === 'supervisor') {
                  setCurrentPage('supervisorDashboard');
                } else {
                  setCurrentPage('home');
                }
              }}
              className="w-full bg-gradient-to-r from-[#184A2C] to-emerald-700"
            >
              {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
            </Button>
          </Card>
        </div>
      );
    }
  }

  // إذا اجتاز جميع الفحوصات، اعرض المحتوى
  return <>{children}</>;
};
