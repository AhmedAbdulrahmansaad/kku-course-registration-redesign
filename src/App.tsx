import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { AIAssistant } from './components/AIAssistant';
import { RouteGuard } from './components/RouteGuard';
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { ProjectPage } from './components/pages/ProjectPage';
import { ProjectPhasesPage } from './components/pages/ProjectPhasesPage';
import { DesignMethodologyPage } from './components/pages/DesignMethodologyPage';
import { NewsPage } from './components/pages/NewsPage';
import { ContactPage } from './components/pages/ContactPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { SearchPage } from './components/pages/SearchPage';
import { CoursesPage } from './components/pages/CoursesPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { ReportsPage } from './components/pages/ReportsPage';
import { DocumentsPage } from './components/pages/DocumentsPage';
import { LoginPage } from './components/pages/LoginPage';
import { SignUpPage } from './components/pages/SignUpPage';
import { TestingPage } from './components/pages/TestingPage';
import { RequestsPage } from './components/pages/RequestsPage';
import { StudentDashboard } from './components/pages/StudentDashboard';
import { CurriculumPage } from './components/pages/CurriculumPage';
import { SupervisorDashboard } from './components/pages/SupervisorDashboard';
import { AssistantPage } from './components/pages/AssistantPage';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { ManageCoursesPage } from './components/pages/ManageCoursesPage';
import { ManageStudentsPage } from './components/pages/ManageStudentsPage';
import { ManageSupervisorsPage } from './components/pages/ManageSupervisorsPage';
import { SystemSettingsPage } from './components/pages/SystemSettingsPage';
import { SystemToolsPage } from './components/pages/SystemToolsPage';
import { MessagesPage } from './components/pages/MessagesPage';
import { AnnouncementsPage } from './components/pages/AnnouncementsPage';
import { AccessAgreementPage } from './components/pages/AccessAgreementPage';
import { TranscriptPage } from './components/pages/TranscriptPage';
import { SystemSetupPage } from './components/pages/SystemSetupPage';
import { Toaster } from './components/ui/sonner';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Button } from './components/ui/button';

const AppContent: React.FC = () => {
  const { currentPage, setCurrentPage, language, t, isLoggedIn, userInfo } = useApp();

  // تحديد المسارات مع صلاحياتها
  const routes = {
    // صفحة التعهد (أول صفحة - إزامية)
    accessAgreement: { component: <AccessAgreementPage />, public: true },
    
    // صفحة إعداد النظام (عامة - للتهيئة الأولية)
    systemSetup: { component: <SystemSetupPage />, public: true },
    
    // صفحات عامة (لا تحتاج تسجيل دخول)
    home: { component: <HomePage />, public: true },
    about: { component: <AboutPage />, public: true },
    project: { component: <ProjectPage />, public: true },
    projectPhases: { component: <ProjectPhasesPage />, public: true },
    designMethodology: { component: <DesignMethodologyPage />, public: true },
    news: { component: <NewsPage />, public: true },
    contact: { component: <ContactPage />, public: true },
    privacy: { component: <PrivacyPage />, public: true },
    search: { component: <SearchPage />, public: true },
    testing: { component: <TestingPage />, public: true },
    login: { component: <LoginPage />, public: true },
    signup: { component: <SignUpPage />, public: true },

    // ============================================
    // 🎓 صفحات الطالب فقط
    // ============================================
    studentDashboard: {
      component: <StudentDashboard />,
      requireAuth: true,
      allowedRoles: ['student'],
    },
    courses: {
      component: <CoursesPage />,
      requireAuth: true,
      allowedRoles: ['student', 'admin'], // السماح للمدير بالوصول
    },
    schedule: {
      component: <SchedulePage />,
      requireAuth: true,
      allowedRoles: ['student', 'admin'], // السماح للمدير بالوصول
    },
    reports: {
      component: <ReportsPage />,
      requireAuth: true,
      allowedRoles: ['student', 'admin'], // السماح للمدير بالوصول
    },
    curriculum: {
      component: <CurriculumPage />,
      requireAuth: true,
      allowedRoles: ['student', 'admin'], // السماح للمدير بالوصول
    },
    assistant: {
      component: <AssistantPage />,
      requireAuth: true,
      allowedRoles: ['student', 'admin', 'supervisor'], // السماح للجميع بالوصول
    },

    // ============================================
    // 👨‍🏫 صفحات المشرف فقط
    // ============================================
    supervisorDashboard: {
      component: <SupervisorDashboard />,
      requireAuth: true,
      allowedRoles: ['supervisor'],
    },
    requests: {
      component: <RequestsPage />,
      requireAuth: true,
      allowedRoles: ['supervisor', 'admin'],
    },

    // ============================================
    // 👨‍💼 صفحات المدير فقط
    // ============================================
    adminDashboard: {
      component: <AdminDashboard />,
      requireAuth: true,
      allowedRoles: ['admin'],
    },
    manageCourses: {
      component: <ManageCoursesPage />,
      requireAuth: true,
      allowedRoles: ['admin'],
    },
    manageStudents: {
      component: <ManageStudentsPage />,
      requireAuth: true,
      allowedRoles: ['admin'],
    },
    manageSupervisors: {
      component: <ManageSupervisorsPage />,
      requireAuth: true,
      allowedRoles: ['admin'],
    },
    systemSettings: {
      component: <SystemSettingsPage />,
      requireAuth: true,
      allowedRoles: ['admin'],
    },
    systemTools: {
      component: <SystemToolsPage />,
      requireAuth: true,
      allowedRoles: ['admin'],
    },
    messages: {
      component: <MessagesPage />,
      requireAuth: true,
      allowedRoles: ['admin'],
    },
    announcements: {
      component: <AnnouncementsPage />,
      requireAuth: true,
      allowedRoles: ['admin'],
    },
    documents: {
      component: <DocumentsPage />,
      requireAuth: true,
      allowedRoles: ['student', 'admin'], // السماح للطلاب والمدير
    },
    transcript: {
      component: <TranscriptPage />,
      requireAuth: true,
      allowedRoles: ['student', 'admin'], // السماح للطلاب والمدير
    },
  };

  // التحقق من صلاحيات الوصول للصفحة الحالية
  React.useEffect(() => {
    if (!isLoggedIn || !userInfo) return;

    const currentRoute = routes[currentPage as keyof typeof routes];
    if (!currentRoute || currentRoute.public) return;

    // التحقق من الصلاحيات
    const userRole = userInfo.role || 'student';
    if (currentRoute.allowedRoles && currentRoute.allowedRoles.length > 0) {
      if (!currentRoute.allowedRoles.includes(userRole as any)) {
        // توجيه المستخدم للصفحة المناسبة
        if (userRole === 'admin') {
          setCurrentPage('adminDashboard');
        } else if (userRole === 'supervisor') {
          setCurrentPage('supervisorDashboard');
        } else {
          setCurrentPage('studentDashboard');
        }
      }
    }
  }, [currentPage, isLoggedIn, userInfo, setCurrentPage]);

  const currentRoute = routes[currentPage as keyof typeof routes] || routes.home;

  const handleBack = () => {
    // تحديد الصفحة المناسبة للعودة إليها حسب دور المستخدم
    if (isLoggedIn && userInfo) {
      const userRole = userInfo.role || 'student';
      if (userRole === 'admin') {
        setCurrentPage('adminDashboard');
      } else if (userRole === 'supervisor') {
        setCurrentPage('supervisorDashboard');
      } else {
        setCurrentPage('studentDashboard');
      }
    } else {
      setCurrentPage('home');
    }
  };

  const handleHome = () => {
    if (isLoggedIn && userInfo) {
      const userRole = userInfo.role || 'student';
      if (userRole === 'admin') {
        setCurrentPage('adminDashboard');
      } else if (userRole === 'supervisor') {
        setCurrentPage('supervisorDashboard');
      } else {
        setCurrentPage('studentDashboard');
      }
    } else {
      setCurrentPage('home');
    }
  };

  // إخفاء Header/Navigation/Footer في بعض الصفحات
  const hideLayout = currentPage === 'accessAgreement';

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      {!hideLayout && <Header />}
      {!hideLayout && <Navigation />}

      <main className="flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8 animate-fade-in">
        {/* Navigation Buttons */}
        {!hideLayout && currentPage !== 'home' && currentPage !== 'login' && (
          <div className="flex items-center gap-2 mb-4 sm:mb-6 flex-wrap">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-1 sm:gap-2 hover:bg-muted transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
              size="sm"
            >
              {language === 'ar' ? (
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">{t('back')}</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleHome}
              className="gap-1 sm:gap-2 hover:bg-muted transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
              size="sm"
            >
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('home')}</span>
            </Button>
          </div>
        )}

        {/* Page Content with Route Guard */}
        {currentRoute.public ? (
          currentRoute.component
        ) : (
          <RouteGuard
            requireAuth={currentRoute.requireAuth}
            allowedRoles={currentRoute.allowedRoles}
            redirectTo="login"
          >
            {currentRoute.component}
          </RouteGuard>
        )}
      </main>

      {!hideLayout && <Footer />}
      {!hideLayout && <AIAssistant />}
      <Toaster />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}