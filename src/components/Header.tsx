import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Moon, Sun, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { KKULogoSVG } from './KKULogoSVG';

export const Header: React.FC = () => {
  const { language, setLanguage, theme, setTheme } = useApp();

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
          </div>
        </div>
      </div>
    </header>
  );
};
