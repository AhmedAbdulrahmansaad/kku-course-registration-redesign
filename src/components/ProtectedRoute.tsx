import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner@2.0.3';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ('student' | 'supervisor' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  allowedRoles = ['student', 'supervisor', 'admin']
}) => {
  const { isLoggedIn, userInfo, language, setCurrentPage } = useApp();

  useEffect(() => {
    // Check if authentication is required
    if (requireAuth && !isLoggedIn) {
      toast.error(
        language === 'ar' 
          ? '⚠️ يجب تسجيل الدخول أولاً' 
          : '⚠️ Please login first'
      );
      setCurrentPage('login');
      return;
    }

    // Check if user has required role
    if (requireAuth && isLoggedIn && userInfo) {
      if (!allowedRoles.includes(userInfo.role as any)) {
        toast.error(
          language === 'ar' 
            ? '🚫 ليس لديك صلاحية للوصول لهذه الصفحة' 
            : '🚫 You don\'t have permission to access this page'
        );
        setCurrentPage('home');
        return;
      }
    }
  }, [requireAuth, isLoggedIn, userInfo, allowedRoles, language, setCurrentPage]);

  // If not logged in and auth required, show login prompt
  if (requireAuth && !isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className="inline-flex p-4 bg-yellow-500/10 rounded-full">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'يجب تسجيل الدخول للوصول لهذه الصفحة' 
                : 'You need to login to access this page'}
            </p>
          </div>
          <Button 
            onClick={() => setCurrentPage('login')}
            className="w-full bg-kku-green hover:bg-kku-green/90"
          >
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </Card>
      </div>
    );
  }

  // If logged in but wrong role, show access denied
  if (requireAuth && isLoggedIn && userInfo && !allowedRoles.includes(userInfo.role as any)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className="inline-flex p-4 bg-red-500/10 rounded-full">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {language === 'ar' ? 'الوصول محظور' : 'Access Denied'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'ليس لديك الصلاحية للوصول لهذه الصفحة' 
                : 'You don\'t have permission to access this page'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {language === 'ar' 
                ? `الصفحة متاحة لـ: ${allowedRoles.map(r => 
                    r === 'student' ? 'الطلاب' : 
                    r === 'supervisor' ? 'المشرفين' : 'المدراء'
                  ).join('، ')}` 
                : `Available for: ${allowedRoles.join(', ')}`}
            </p>
          </div>
          <Button 
            onClick={() => setCurrentPage('home')}
            variant="outline"
            className="w-full"
          >
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};
