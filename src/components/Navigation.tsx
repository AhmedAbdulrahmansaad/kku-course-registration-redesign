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
  UserCog
} from 'lucide-react';

const navItems = [
  { id: 'home', icon: Home, labelKey: 'home', public: true },
  { id: 'login', icon: LogIn, labelKey: 'login', public: true, hideWhenLoggedIn: true },
  { id: 'courses', icon: BookOpen, labelKey: 'courses', requireAuth: true },
  { id: 'schedule', icon: Calendar, labelKey: 'schedule', requireAuth: true },
  { id: 'reports', icon: BarChart3, labelKey: 'reports', requireAuth: true },
  { id: 'documents', icon: Upload, labelKey: 'documents', requireAuth: true },
  { id: 'assistant', icon: MessageCircle, labelKey: 'aiAssistant', requireAuth: true },
  { id: 'supervisorDashboard', icon: UserCog, labelKey: 'supervisorDashboard', requireAuth: true, allowedRoles: ['supervisor', 'admin'] },
  { id: 'about', icon: Info, labelKey: 'about', public: true },
  { id: 'project', icon: FolderKanban, labelKey: 'project', public: true },
  { id: 'projectPhases', icon: Rocket, labelKey: 'projectPhases', public: true },
  { id: 'designMethodology', icon: Layers, labelKey: 'designMethodology', public: true },
  { id: 'testing', icon: TestTube2, labelKey: 'testing', public: true },
  { id: 'howToRedesign', icon: Palette, labelKey: 'howToRedesign', public: true },
  { id: 'news', icon: Newspaper, labelKey: 'news', public: true },
  { id: 'contact', icon: Mail, labelKey: 'contact', public: true },
  { id: 'responsive', icon: Monitor, labelKey: 'responsive', public: true },
  { id: 'accessibility', icon: Accessibility, labelKey: 'accessibility', public: true },
  { id: 'privacy', icon: Shield, labelKey: 'privacy', public: true },
  { id: 'search', icon: Search, labelKey: 'search', public: true },
];

export const Navigation: React.FC = () => {
  const { currentPage, setCurrentPage, t, isLoggedIn, userInfo } = useApp();

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

  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-thin">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-kku-green to-kku-green/90 text-white dark:from-primary dark:to-primary/90 shadow-md scale-105'
                    : 'hover:bg-muted text-foreground hover:scale-105'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};