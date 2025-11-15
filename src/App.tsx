import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { AIAssistant } from './components/AIAssistant';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { ProjectPage } from './components/pages/ProjectPage';
import { ProjectPhasesPage } from './components/pages/ProjectPhasesPage';
import { DesignMethodologyPage } from './components/pages/DesignMethodologyPage';
import { HowToRedesignPage } from './components/pages/HowToRedesignPage';
import { NewsPage } from './components/pages/NewsPage';
import { ContactPage } from './components/pages/ContactPage';
import { ResponsivePage } from './components/pages/ResponsivePage';
import { AccessibilityPage } from './components/pages/AccessibilityPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { SearchPage } from './components/pages/SearchPage';
import { LoginPage } from './components/pages/LoginPage';
import { CoursesPage } from './components/pages/CoursesPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { SignUpPage } from './components/pages/SignUpPage';
import { TestingPage } from './components/pages/TestingPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { DocumentsPage } from './components/pages/DocumentsPage';
import { AssistantPage } from './components/pages/AssistantPage';
import { SupervisorDashboard } from './components/pages/SupervisorDashboard';
import { AccessAgreementPage } from './components/pages/AccessAgreementPage';
import { Toaster } from './components/ui/sonner';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './components/ui/button';

const AppContent: React.FC = () => {
  const { currentPage, setCurrentPage, language, t } = useApp();

  const pages: Record<string, React.ReactNode> = {
    home: <HomePage />,
    about: <AboutPage />,
    project: <ProjectPage />,
    projectPhases: <ProjectPhasesPage />,
    designMethodology: <DesignMethodologyPage />,
    howToRedesign: <HowToRedesignPage />,
    news: <NewsPage />,
    contact: <ContactPage />,
    responsive: <ResponsivePage />,
    accessibility: <AccessibilityPage />,
    privacy: <PrivacyPage />,
    search: <SearchPage />,
    login: <LoginPage />,
    signup: <SignUpPage />,
    testing: <TestingPage />,
    accessAgreement: <AccessAgreementPage />,
    
    // Protected pages - require login
    courses: (
      <ProtectedRoute requireAuth={true}>
        <CoursesPage />
      </ProtectedRoute>
    ),
    schedule: (
      <ProtectedRoute requireAuth={true}>
        <SchedulePage />
      </ProtectedRoute>
    ),
    reports: (
      <ProtectedRoute requireAuth={true}>
        <ReportsPage />
      </ProtectedRoute>
    ),
    documents: (
      <ProtectedRoute requireAuth={true}>
        <DocumentsPage />
      </ProtectedRoute>
    ),
    assistant: (
      <ProtectedRoute requireAuth={true}>
        <AssistantPage />
      </ProtectedRoute>
    ),
    
    // Supervisor-only page
    supervisorDashboard: (
      <ProtectedRoute requireAuth={true} allowedRoles={['supervisor', 'admin']}>
        <SupervisorDashboard />
      </ProtectedRoute>
    ),
  };

  const handleBack = () => {
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* إخفاء Header/Navigation/Footer في صفحة التعهد */}
      {currentPage !== 'accessAgreement' && <Header />}
      {currentPage !== 'accessAgreement' && <Navigation />}

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        {currentPage !== 'home' && currentPage !== 'login' && currentPage !== 'accessAgreement' && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 gap-2"
          >
            {language === 'ar' ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
            {t('back')}
          </Button>
        )}

        {/* Page Content */}
        {pages[currentPage] || pages.home}
      </main>

      {currentPage !== 'accessAgreement' && <Footer />}
      {currentPage !== 'accessAgreement' && <AIAssistant />}
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