import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Settings,
  Users,
  BookOpen,
  FileText,
  Bell,
  BarChart3,
  Shield,
  Calendar,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Database,
  Activity,
  PieChart
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  pendingRequests: number;
  approvedRequests: number;
  totalSupervisors: number;
  totalAdmins: number;
}

export const AdminDashboard: React.FC = () => {
  const { language, setCurrentPage, userInfo } = useApp();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 49,
    pendingRequests: 0,
    approvedRequests: 0,
    totalSupervisors: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('📊 [AdminDashboard] Fetching stats from SQL Database...');

      // جلب إحصائيات النظام من SQL Database
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/dashboard/admin`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [AdminDashboard] SQL Database stats:', result.stats);
        setStats(result.stats);
      } else {
        console.error('❌ [AdminDashboard] Failed to fetch stats');
      }
    } catch (error: any) {
      console.error('❌ [AdminDashboard] Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      id: 'manageCourses',
      title: language === 'ar' ? 'إدارة المقررات' : 'Manage Courses',
      description: language === 'ar' ? 'إضافة وتعديل وحذف المقررات الدراسية' : 'Add, edit, and delete courses',
      icon: BookOpen,
      color: 'from-blue-600 to-blue-700',
      page: 'manageCourses'
    },
    {
      id: 'manageStudents',
      title: language === 'ar' ? 'إدارة الطلاب' : 'Manage Students',
      description: language === 'ar' ? 'عرض وإدارة حسابات الطلاب' : 'View and manage student accounts',
      icon: Users,
      color: 'from-green-600 to-green-700',
      page: 'manageStudents'
    },
    {
      id: 'manageSupervisors',
      title: language === 'ar' ? 'إدارة المشرفين' : 'Manage Supervisors',
      description: language === 'ar' ? 'إضافة وإدارة المشرفين الأكاديميين' : 'Add and manage academic supervisors',
      icon: GraduationCap,
      color: 'from-purple-600 to-purple-700',
      page: 'manageSupervisors'
    },
    {
      id: 'requests',
      title: language === 'ar' ? 'طلبات التسجيل' : 'Registration Requests',
      description: language === 'ar' ? 'مراجعة وموافقة طلبات التسجيل' : 'Review and approve registration requests',
      icon: FileText,
      color: 'from-orange-600 to-orange-700',
      page: 'requests'
    },
    {
      id: 'curriculum',
      title: language === 'ar' ? 'الخطط الدراسية' : 'Curriculum Plans',
      description: language === 'ar' ? 'إدارة الخطط الدراسية للأقسام' : 'Manage department curriculum plans',
      icon: Layers,
      color: 'from-teal-600 to-teal-700',
      page: 'curriculum'
    },
    {
      id: 'reports',
      title: language === 'ar' ? 'التقارير' : 'Reports',
      description: language === 'ar' ? 'عرض التقارير والإحصائيات' : 'View reports and analytics',
      icon: BarChart3,
      color: 'from-pink-600 to-pink-700',
      page: 'reports'
    },
    {
      id: 'announcements',
      title: language === 'ar' ? 'الإعلانات' : 'Announcements',
      description: language === 'ar' ? 'إدارة إعلانات النظام' : 'Manage system announcements',
      icon: Bell,
      color: 'from-yellow-600 to-yellow-700',
      page: 'announcements'
    },
    {
      id: 'messages',
      title: language === 'ar' ? 'الرسائل' : 'Messages',
      description: language === 'ar' ? 'التواصل مع الطلاب والمشرفين' : 'Communicate with students and supervisors',
      icon: MessageSquare,
      color: 'from-indigo-600 to-indigo-700',
      page: 'messages'
    },
    {
      id: 'assistant',
      title: language === 'ar' ? 'المساعد الذكي' : 'AI Assistant',
      description: language === 'ar' ? 'المساعد الذكي التفاعلي' : 'Interactive AI Assistant',
      icon: MessageSquare,
      color: 'from-cyan-600 to-cyan-700',
      page: 'assistant'
    },
    {
      id: 'settings',
      title: language === 'ar' ? 'إعدادات النظام' : 'System Settings',
      description: language === 'ar' ? 'إعدادات وتكوينات النظام' : 'System settings and configurations',
      icon: Settings,
      color: 'from-gray-600 to-gray-700',
      page: 'systemSettings'
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#184A2C] via-emerald-700 to-[#D4AF37]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
        
        <div className="relative z-10 text-white py-12 md:py-16">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full shadow-2xl border-4 border-white/30">
              <Shield className="w-16 h-16" />
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-2xl">
                {language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}
              </h1>
              <p className="text-xl md:text-2xl opacity-95 drop-shadow-lg">
                {language === 'ar' 
                  ? `مرحباً ${userInfo?.full_name || 'المدير'}` 
                  : `Welcome ${userInfo?.full_name || 'Admin'}`}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-[#D4AF37]" />
                <span className="text-sm opacity-90">
                  {language === 'ar' ? 'الطلاب' : 'Students'}
                </span>
              </div>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-[#D4AF37]" />
                <span className="text-sm opacity-90">
                  {language === 'ar' ? 'المقررات' : 'Courses'}
                </span>
              </div>
              <p className="text-3xl font-bold">{stats.totalCourses}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6 text-yellow-300" />
                <span className="text-sm opacity-90">
                  {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
                </span>
              </div>
              <p className="text-3xl font-bold">{stats.pendingRequests}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-300" />
                <span className="text-sm opacity-90">
                  {language === 'ar' ? 'موافق عليه' : 'Approved'}
                </span>
              </div>
              <p className="text-3xl font-bold">{stats.approvedRequests}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-6 w-6 text-[#D4AF37]" />
                <span className="text-sm opacity-90">
                  {language === 'ar' ? 'المشرفين' : 'Supervisors'}
                </span>
              </div>
              <p className="text-3xl font-bold">{stats.totalSupervisors}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-6 w-6 text-[#D4AF37]" />
                <span className="text-sm opacity-90">
                  {language === 'ar' ? 'المدراء' : 'Admins'}
                </span>
              </div>
              <p className="text-3xl font-bold">{stats.totalAdmins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setCurrentPage(section.page as any)}
            >
              <div className={`h-2 bg-gradient-to-r ${section.color}`}></div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`bg-gradient-to-br ${section.color} p-4 rounded-xl text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#184A2C]">
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">
          {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => setCurrentPage('manageCourses')}
            className="h-auto py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span>{language === 'ar' ? 'إضافة مقرر' : 'Add Course'}</span>
            </div>
          </Button>

          <Button
            onClick={() => setCurrentPage('manageStudents')}
            className="h-auto py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="h-6 w-6" />
              <span>{language === 'ar' ? 'إدارة الطلاب' : 'Manage Students'}</span>
            </div>
          </Button>

          <Button
            onClick={() => setCurrentPage('requests')}
            className="h-auto py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
          >
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>{language === 'ar' ? 'طلبات التسجيل' : 'Requests'}</span>
            </div>
          </Button>

          <Button
            onClick={() => setCurrentPage('reports')}
            className="h-auto py-4 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800"
          >
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
            </div>
          </Button>
        </div>
      </Card>

      {/* System Status */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Activity className="h-6 w-6 text-green-500" />
          {language === 'ar' ? 'حالة النظام' : 'System Status'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium">{language === 'ar' ? 'الخادم' : 'Server'}</p>
              <p className="text-sm text-green-600">{language === 'ar' ? 'متصل' : 'Online'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Database className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</p>
              <p className="text-sm text-green-600">{language === 'ar' ? 'نشط' : 'Active'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Activity className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium">{language === 'ar' ? 'الأداء' : 'Performance'}</p>
              <p className="text-sm text-green-600">{language === 'ar' ? 'ممتاز' : 'Excellent'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};