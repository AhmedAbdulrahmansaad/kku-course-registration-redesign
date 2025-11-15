import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Mail, Phone, Globe, GraduationCap, Award, Users } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, t, setCurrentPage } = useApp();

  return (
    <footer className="mt-auto border-t bg-gradient-to-br from-kku-green/5 via-transparent to-kku-gold/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-kku-green rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-kku-gold rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* University Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-kku-green to-kku-gold rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg gradient-text">
                {t('university')}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'ar' 
                ? 'نظام تسجيل المقررات المطور - مشروع تخرج متميز 2025-2026'
                : 'Advanced Course Registration System - Outstanding Graduation Project 2025-2026'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage('about')}
                className="text-xs px-3 py-1 bg-kku-green/10 hover:bg-kku-green/20 dark:bg-primary/10 dark:hover:bg-primary/20 rounded-full text-kku-green dark:text-primary transition-colors"
              >
                {language === 'ar' ? 'عن المشروع' : 'About'}
              </button>
              <button
                onClick={() => setCurrentPage('project')}
                className="text-xs px-3 py-1 bg-kku-gold/10 hover:bg-kku-gold/20 rounded-full text-kku-gold transition-colors"
              >
                {language === 'ar' ? 'المراحل' : 'Phases'}
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-5 w-5 text-kku-gold" />
              <h3 className="font-bold text-kku-green dark:text-primary">
                {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => setCurrentPage('courses')}
                className="block hover:text-kku-green dark:hover:text-primary transition-colors"
              >
                {language === 'ar' ? '📚 تسجيل المقررات' : '📚 Course Registration'}
              </button>
              <button
                onClick={() => setCurrentPage('schedule')}
                className="block hover:text-kku-green dark:hover:text-primary transition-colors"
              >
                {language === 'ar' ? '📅 الجدول الدراسي' : '📅 Course Schedule'}
              </button>
              <button
                onClick={() => setCurrentPage('news')}
                className="block hover:text-kku-green dark:hover:text-primary transition-colors"
              >
                {language === 'ar' ? '📰 الأخبار' : '📰 News'}
              </button>
              <button
                onClick={() => setCurrentPage('contact')}
                className="block hover:text-kku-green dark:hover:text-primary transition-colors"
              >
                {language === 'ar' ? '📧 اتصل بنا' : '📧 Contact Us'}
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-kku-gold" />
              <h3 className="font-bold text-kku-green dark:text-primary">
                {t('contact')}
              </h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4 text-kku-gold" />
                <a href="mailto:sraj3225@gmail.com" className="hover:underline">
                  sraj3225@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-4 w-4 text-kku-gold" />
                <a href="tel:+966502232978" className="hover:underline" dir="ltr">
                  +966 50 223 2978
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-4 w-4 text-kku-gold" />
                <a 
                  href="https://www.kku.edu.sa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  www.kku.edu.sa
                </a>
              </div>
            </div>
          </div>

          {/* Supervisor */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-kku-gold" />
              <h3 className="font-bold text-kku-green dark:text-primary">
                {t('supervisor')}
              </h3>
            </div>
            <div className="space-y-2">
              <p className="font-medium">
                {language === 'ar' ? 'د. محمد رشيد' : 'Dr. Mohammed Rashid'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'كلية إدارة الأعمال'
                  : 'College of Business'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'قسم المعلوماتية الإدارية'
                  : 'Department of Business Informatics'}
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-start">
              {language === 'ar' 
                ? `جامعة الملك خالد © 2025-2026 – ${t('allRightsReserved')}`
                : `King Khalid University © 2025-2026 – ${t('allRightsReserved')}`}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{language === 'ar' ? 'صنع بـ' : 'Made with'}</span>
              <span className="text-red-500 animate-pulse-soft">❤️</span>
              <span>{language === 'ar' ? 'في جامعة الملك خالد' : 'at King Khalid University'}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};