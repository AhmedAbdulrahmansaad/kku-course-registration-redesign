import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Shield, AlertCircle } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { userInfo, language } = useApp();

  const userRole = userInfo?.role || 'student';

  // تحقق من الدور
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {language === 'ar' ? 'غير مصرح بالوصول' : 'Access Denied'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.'
                : 'Sorry, you do not have permission to access this page.'}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'ar'
                ? `دورك الحالي: ${
                    userRole === 'student' ? 'طالب' :
                    userRole === 'supervisor' ? 'مشرف أكاديمي' :
                    'مدير النظام'
                  }`
                : `Your current role: ${
                    userRole === 'student' ? 'Student' :
                    userRole === 'supervisor' ? 'Academic Supervisor' :
                    'System Admin'
                  }`
              }
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
