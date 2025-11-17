import React from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  Home, 
  Info, 
  FolderKanban, 
  Palette, 
  Newspaper, 
  Mail, 
  Monitor, 
  Accessibility, 
  Shield, 
  Search,
  BookOpen,
  Calendar,
  FileText,
  LogIn,
  TestTube2,
  Upload,
  BarChart3,
  MessageCircle,
  Rocket,
  Layers,
  UserCog,
  GraduationCap,
  Settings,
  Users,
  Bell,
  ClipboardList,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';

const navItems = [
  // صفحات عامة (قبل تسجيل الدخول)
  { id: 'home', icon: Home, labelKey: 'home', public: true },
  { id: 'login', icon: LogIn, labelKey: 'login', public: true, hideWhenLoggedIn: true },
  { id: 'about', icon: Info, labelKey: 'about', public: true },
  { id: 'project', icon: FolderKanban, labelKey: 'project', public: true },
  { id: 'projectPhases', icon: Rocket, labelKey: 'projectPhases', public: true },
  { id: 'designMethodology', icon: Layers, labelKey: 'designMethodology', public: true },
  { id: 'testing', icon: TestTube2, labelKey: 'testing', public: true },
  { id: 'news', icon: Newspaper, labelKey: 'news', public: true },
  { id: 'contact', icon: Mail, labelKey: 'contact', public: true },
  { id: 'privacy', icon: Shield, labelKey: 'privacy', public: true },
  { id: 'search', icon: Search, labelKey: 'search', public: true },
  
  // ============================================
  // 🎓 صفحات الطالب فقط
  // ============================================
  { id: 'studentDashboard', icon: Home, labelKey: 'studentDashboard', requireAuth: true, allowedRoles: ['student'] },
  { id: 'courses', icon: BookOpen, labelKey: 'courses', requireAuth: true, allowedRoles: ['student'] },
  { id: 'schedule', icon: Calendar, labelKey: 'schedule', requireAuth: true, allowedRoles: ['student'] },
  { id: 'reports', icon: BarChart3, labelKey: 'reports', requireAuth: true, allowedRoles: ['student', 'admin'] }, // السماح للمدير
  { id: 'transcript', icon: GraduationCap, labelKey: 'transcript', requireAuth: true, allowedRoles: ['student', 'admin'] }, // السجل الأكاديمي
  { id: 'curriculum', icon: Layers, labelKey: 'curriculum', requireAuth: true, allowedRoles: ['student', 'admin'] }, // السماح للمدير
  { id: 'assistant', icon: MessageCircle, labelKey: 'aiAssistant', requireAuth: true, allowedRoles: ['student', 'admin'] }, // السماح للمدير
  
  // ============================================
  // 👨‍🏫 صفحات المشرف فقط
  // ============================================
  { id: 'supervisorDashboard', icon: BarChart3, labelKey: 'supervisorDashboard', requireAuth: true, allowedRoles: ['supervisor'] },
  { id: 'requests', icon: FileText, labelKey: 'requests', requireAuth: true, allowedRoles: ['supervisor', 'admin'] },
  
  // ============================================
  // 👨‍💼 صفحات المدير فقط
  // ============================================
  { id: 'adminDashboard', icon: Shield, labelKey: 'adminDashboard', requireAuth: true, allowedRoles: ['admin'] },
  { id: 'manageCourses', icon: BookOpen, labelKey: 'manageCourses', requireAuth: true, allowedRoles: ['admin'] },
  { id: 'manageStudents', icon: UserCog, labelKey: 'manageStudents', requireAuth: true, allowedRoles: ['admin'] },
  { id: 'manageSupervisors', icon: GraduationCap, labelKey: 'manageSupervisors', requireAuth: true, allowedRoles: ['admin'] },
  { id: 'announcements', icon: Bell, labelKey: 'announcements', requireAuth: true, allowedRoles: ['admin'] },
  { id: 'messages', icon: MessageCircle, labelKey: 'messages', requireAuth: true, allowedRoles: ['admin'] },
  { id: 'documents', icon: FileText, labelKey: 'documents', requireAuth: true, allowedRoles: ['admin'] },
  { id: 'systemSettings', icon: Settings, labelKey: 'systemSettings', requireAuth: true, allowedRoles: ['admin'] },
];

export const Navigation: React.FC = () => {
  const { currentPage, setCurrentPage, t, isLoggedIn, userInfo, language } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Filter navigation items based on user role and login status
  const visibleItems = navItems.filter(item => {
    // Hide login button if user is logged in
    if (item.hideWhenLoggedIn && isLoggedIn) {
      return false;
    }

    // Show public items
    if (item.public && !item.requireAuth) {
      return true;
    }

    // For items requiring auth
    if (item.requireAuth) {
      // User must be logged in
      if (!isLoggedIn) {
        return false;
      }

      // Check role-specific access
      if (item.allowedRoles && item.allowedRoles.length > 0) {
        const userRole = userInfo?.role || 'student';
        return item.allowedRoles.includes(userRole);
      }

      return true;
    }

    return true;
  });

  const handleNavClick = (itemId: string) => {
    setCurrentPage(itemId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation - Hidden on Mobile */}
      <nav className="hidden md:block border-b bg-card/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-thin">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 text-xs sm:text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-kku-green to-kku-green/90 text-white dark:from-primary dark:to-primary/90 shadow-md scale-105'
                      : 'hover:bg-muted text-foreground hover:scale-105'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="font-medium hidden lg:inline">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Visible on Mobile Only */}
      <div className="md:hidden border-b bg-card/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-between py-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-sm">
                    {language === 'ar' ? 'القائمة' : 'Menu'}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side={language === 'ar' ? 'right' : 'left'} 
                className="w-[280px] sm:w-[320px]"
              >
                <SheetHeader>
                  <SheetTitle className="text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                  <div className="flex flex-col gap-2 pr-4">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-right w-full ${
                            isActive
                              ? 'bg-gradient-to-r from-kku-green to-kku-green/90 text-white dark:from-primary dark:to-primary/90 shadow-md'
                              : 'hover:bg-muted text-foreground'
                          }`}
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium text-sm">{t(item.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Current Page Indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {visibleItems.find(item => item.id === currentPage) && (
                <>
                  {React.createElement(
                    visibleItems.find(item => item.id === currentPage)!.icon,
                    { className: 'h-4 w-4' }
                  )}
                  <span className="truncate max-w-[150px]">
                    {t(visibleItems.find(item => item.id === currentPage)!.labelKey)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};