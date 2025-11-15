import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Moon, Sun, Globe, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { KKULogoSVG } from './KKULogoSVG';
import { toast } from 'sonner@2.0.3';

export const Header: React.FC = () => {
  const { language, setLanguage, theme, setTheme, isLoggedIn, userInfo, setIsLoggedIn, setUserInfo, setCurrentPage } = useApp();

  const handleLogout = () => {
    // Clear all user data
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('access_token');
    localStorage.removeItem('agreementAccepted');
    
    setIsLoggedIn(false);
    setUserInfo(null);
    
    toast.success(
      language === 'ar' 
        ? '👋 تم تسجيل الخروج بنجاح' 
        : '👋 Logged out successfully'
    );
    
    // Redirect to access agreement page
    setTimeout(() => {
      setCurrentPage('accessAgreement');
    }, 500);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-kku-green to-emerald-700 dark:from-kku-green dark:to-emerald-800 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-md">
              <KKULogoSVG size={45} />
            </div>
            <div className="text-white">
              <h1 className="font-bold text-lg md:text-xl">
                {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
              </h1>
              <p className="text-xs md:text-sm opacity-90">
                {language === 'ar' ? 'نظام التسجيل المطور' : 'Advanced Registration System'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* User Info (if logged in) */}
            {isLoggedIn && userInfo && (
              <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                <User className="h-4 w-4 text-white" />
                <div className="text-white text-sm">
                  <p className="font-semibold">{userInfo.name}</p>
                  <p className="text-xs opacity-75">
                    {userInfo.role === 'student' ? (language === 'ar' ? 'طالب' : 'Student') :
                     userInfo.role === 'supervisor' ? (language === 'ar' ? 'مشرف' : 'Supervisor') :
                     (language === 'ar' ? 'مدير' : 'Admin')}
                  </p>
                </div>
              </div>
            )}

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="gap-2 text-white hover:bg-white/20 hover:text-white"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'English' : 'العربية'}</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Logout Button (if logged in) */}
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-white hover:bg-red-500/20 hover:text-white border border-white/20"
                title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === 'ar' ? 'خروج' : 'Logout'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};