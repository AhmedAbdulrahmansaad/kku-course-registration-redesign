import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Moon, Sun, Globe, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { KKULogoSVG } from './KKULogoSVG';
import { toast } from 'sonner@2.0.3';
import { UnifiedNotificationsDropdown } from './UnifiedNotificationsDropdown';

export const Header: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    theme, 
    setTheme, 
    isLoggedIn, 
    userInfo, 
    setIsLoggedIn, 
    setUserInfo, 
    setCurrentPage
  } = useApp();

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
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
            <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
              <KKULogoSVG size={window.innerWidth < 640 ? 35 : 45} />
            </div>
            <div className="text-white min-w-0">
              <h1 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl truncate">
                {language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University'}
              </h1>
              <p className="text-xs sm:text-sm opacity-90 truncate hidden xs:block">
                {language === 'ar' ? 'نظام التسجيل المطور' : 'Advanced Registration System'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* User Info (if logged in) - Hidden on mobile, visible on md+ */}
            {isLoggedIn && userInfo && (
              <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-white/20">
                <User className="h-4 w-4 text-white flex-shrink-0" />
                <div className="text-white text-xs sm:text-sm min-w-0">
                  <p className="font-semibold truncate max-w-[120px]">{userInfo.name}</p>
                  <p className="text-xs opacity-75 truncate">
                    {userInfo.role === 'student' ? (
                      <>
                        {language === 'ar' ? 'طالب' : 'Student'}
                        {userInfo.id && ` - ${userInfo.id}`}
                      </>
                    ) : userInfo.role === 'supervisor' ? (
                      language === 'ar' ? 'مشرف أكاديمي' : 'Academic Supervisor'
                    ) : (
                      language === 'ar' ? 'مدير النظام' : 'System Admin'
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="gap-1 sm:gap-2 text-white hover:bg-white/20 hover:text-white px-2 sm:px-3"
            >
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-xs sm:text-sm">{language === 'ar' ? 'En' : 'عر'}</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="text-white hover:bg-white/20 hover:text-white px-2 sm:px-3"
            >
              {theme === 'light' ? (
                <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>

            {/* Notifications - For all logged in users */}
            {isLoggedIn && (
              <UnifiedNotificationsDropdown />
            )}

            {/* Logout Button (if logged in) */}
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1 sm:gap-2 text-white hover:bg-red-500/20 hover:text-white border border-white/20 px-2 sm:px-3"
                title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-xs sm:text-sm">
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