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
import { AccessAgreementPage } from './components/pages/AccessAgreementPage';
import { Toaster } from './components/ui/sonner';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Button } from './components/ui/button';

const AppContent: React.FC = () => {
  const { currentPage, setCurrentPage, language, t, isLoggedIn, userInfo } = useApp();

  // تحديد المسارات مع صلاحياتها
  const routes = {
    // صفحة التعهد (أول صفحة - إلزامية)
    accessAgreement: { component: <AccessAgreementPage />, public: true },
    
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

    // صفحات الطلاب (تحتاج تسجيل دخول)
    studentDashboard: {
      component: <StudentDashboard />,
      requireAuth: true,
      allowedRoles: ['student'],
    },
    curriculum: {
      component: <CurriculumPage />,
      requireAuth: true,
    },
    courses: {
      component: <CoursesPage />,
      requireAuth: true,
    },
    schedule: {
      component: <SchedulePage />,
      requireAuth: true,
    },
    reports: {
      component: <ReportsPage />,
      requireAuth: true,
    },
    documents: {
      component: <DocumentsPage />,
      requireAuth: true,
    },
    assistant: {
      component: <AssistantPage />,
      requireAuth: true,
    },

    // صفحات المشرف (تحتاج تسجيل دخول ودور مشرف)
    supervisorDashboard: {
      component: <SupervisorDashboard />,
      requireAuth: true,
      allowedRoles: ['supervisor', 'admin'],
    },
    requests: {
      component: <RequestsPage />,
      requireAuth: true,
      allowedRoles: ['supervisor', 'admin'],
    },

    // صفحات المدير (تحتاج تسجيل دخول ودور مدير)
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
  };

  const currentRoute = routes[currentPage as keyof typeof routes] || routes.home;

  const handleBack = () => {
    // تحديد الصفحة المناسبة للعودة إليها حسب دور المستخدم
    if (isLoggedIn && userInfo) {
      const userRole = userInfo.role || 'student';
      if (userRole === 'supervisor' || userRole === 'admin') {
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
      if (userRole === 'supervisor' || userRole === 'admin') {
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

      <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in">
        {/* Navigation Buttons */}
        {!hideLayout && currentPage !== 'home' && currentPage !== 'login' && (
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2 hover:bg-muted transition-all duration-300 hover:scale-105"
            >
              {language === 'ar' ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <ArrowLeft className="h-4 w-4" />
              )}
              {t('back')}
            </Button>

            <Button
              variant="ghost"
              onClick={handleHome}
              className="gap-2 hover:bg-muted transition-all duration-300 hover:scale-105"
            >
              <Home className="h-4 w-4" />
              {language === 'ar' ? 'الرئيسية' : 'Home'}
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