import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User,
  Sparkles,
  BookOpen,
  Calendar,
  FileText,
  Upload,
  HelpCircle,
  Lightbulb,
  Zap,
  CheckCircle,
  XCircle,
  UserCheck,
  Users,
  BarChart3,
  Settings,
  ClipboardCheck
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  action?: 'success' | 'error' | 'info';
}

const quickQuestionsMap = {
  student: {
    ar: [
      { text: 'أضف لي مقرر نظم المعلومات', icon: BookOpen },
      { text: 'احذف لي مقرر الإحصاء', icon: XCircle },
      { text: 'اعرض لي جدولي الدراسي', icon: Calendar },
      { text: 'اذهب إلى صفحة التقارير', icon: FileText },
    ],
    en: [
      { text: 'Add MIS course for me', icon: BookOpen },
      { text: 'Delete Statistics course', icon: XCircle },
      { text: 'Show me my schedule', icon: Calendar },
      { text: 'Go to reports page', icon: FileText },
    ]
  },
  supervisor: {
    ar: [
      { text: 'عرض طلبات الطلاب المعلقة', icon: ClipboardCheck },
      { text: 'اذهب إلى صفحة الطلبات', icon: FileText },
      { text: 'عرض معلومات الطلاب', icon: Users },
      { text: 'اذهب إلى التقارير', icon: BarChart3 },
    ],
    en: [
      { text: 'Show pending student requests', icon: ClipboardCheck },
      { text: 'Go to requests page', icon: FileText },
      { text: 'Show students information', icon: Users },
      { text: 'Go to reports', icon: BarChart3 },
    ]
  },
  admin: {
    ar: [
      { text: 'عرض إحصائيات النظام', icon: BarChart3 },
      { text: 'عرض جميع الطلاب', icon: Users },
      { text: 'اذهب إلى لوحة التحكم', icon: Settings },
      { text: 'عرض تقارير المشرفين', icon: FileText },
    ],
    en: [
      { text: 'Show system statistics', icon: BarChart3 },
      { text: 'Show all students', icon: Users },
      { text: 'Go to admin dashboard', icon: Settings },
      { text: 'Show supervisor reports', icon: FileText },
    ]
  }
};

export const AssistantPage: React.FC = () => {
  const { language, setCurrentPage, registeredCourses, setRegisteredCourses, availableCourses, userInfo } = useApp();
  
  // تحديد دور المستخدم (افتراضي: طالب)
  const userRole = userInfo?.role || 'student';
  
  // الرسالة الترحيبية حسب الدور
  const getWelcomeMessage = () => {
    if (userRole === 'supervisor') {
      return language === 'ar' 
        ? '👋 مرحباً! أنا مساعدك الذكي المدعوم بالذكاء الاصطناعي الحقيقي!\n\n✨ أستطيع مساعدتك في:\n\n📋 مراجعة طلبات الطلاب\n✅ الموافقة أو رفض الطلبات\n👥 عرض معلومات الطلاب المشرف عليهم\n📊 التقارير الأكاديمية\n🔍 البحث والاستكشاف\n\nجرب سؤالاً الآن! 🚀'
        : '👋 Welcome! I am your AI-powered smart assistant!\n\n✨ I can help you with:\n\n📋 Review student requests\n✅ Approve or reject requests\n👥 View supervised students information\n📊 Academic reports\n🔍 Search and exploration\n\nTry asking now! 🚀';
    } else if (userRole === 'admin') {
      return language === 'ar' 
        ? '👋 مرحباً! أنا مساعدك الذكي المدعوم بالذكاء الاصطناعي الحقيقي!\n\n✨ أستطيع مساعدتك في:\n\n📊 عرض إحصائيات النظام الشاملة\n👥 إدارة الطلاب والمشرفين\n🏢 إدارة الأقسام والمقررات\n📈 التقارير الإدارية المتقدمة\n⚙️ إعدادات النظام\n\nجرب سؤالاً الآن! 🚀'
        : '👋 Welcome! I am your AI-powered smart assistant!\n\n✨ I can help you with:\n\n📊 View comprehensive system statistics\n👥 Manage students and supervisors\n🏢 Manage departments and courses\n📈 Advanced administrative reports\n⚙️ System settings\n\nTry asking now! 🚀';
    } else {
      return language === 'ar' 
        ? '👋 مرحباً! أنا مساعدك الذكي المدعوم بالذكاء الاصطناعي الحقيقي!\n\n✨ أستطيع مساعدتك في:\n\n📚 تسجيل المقررات والاستفسار عنها\n📅 الجداول والتقارير\n🔍 البحث والاستكشاف\n💡 الإجابة على جميع أسئلتك\n\nجرب سؤالاً الآن! 🚀'
        : '👋 Welcome! I am your AI-powered smart assistant!\n\n✨ I can help you with:\n\n📚 Course registration and inquiries\n📅 Schedules and reports\n🔍 Search and exploration\n💡 Answer all your questions\n\nTry asking now! 🚀';
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update welcome message when user role or language changes
  useEffect(() => {
    const welcomeMessage = getWelcomeMessage();
    setMessages([{
      id: '0',
      text: welcomeMessage,
      isUser: false,
      timestamp: new Date(),
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, language]);

  // Function to execute real actions
  const executeAction = (query: string): { response: string; action?: 'success' | 'error' | 'info' } => {
    const lowerQuery = query.toLowerCase().trim();

    // ===== أوامر المدير (Admin Commands) =====
    if (userRole === 'admin') {
      // عرض إحصائيات النظام
      if (lowerQuery.includes('إحصائيات') || lowerQuery.includes('statistics') || lowerQuery.includes('stats')) {
        setTimeout(() => setCurrentPage('admin-dashboard'), 1000);
        return {
          response: language === 'ar'
            ? '✅ جاري عرض إحصائيات النظام الشاملة...\n\n📊 سأنقلك إلى لوحة التحكم الآن حيث يمكنك رؤية:\n• إجمالي عدد الطلاب\n• المقررات المسجلة\n• طلبات التسجيل المعلقة\n• معدلات النجاح\n\nانتظر قليلاً... ⏳'
            : '✅ Displaying comprehensive system statistics...\n\n📊 Taking you to the admin dashboard where you can see:\n• Total number of students\n• Registered courses\n• Pending registration requests\n• Success rates\n\nPlease wait... ⏳',
          action: 'success'
        };
      }

      // عرض جميع الطلاب
      if (lowerQuery.includes('طلاب') || lowerQuery.includes('students')) {
        setTimeout(() => setCurrentPage('admin-dashboard'), 1000);
        return {
          response: language === 'ar'
            ? '✅ جاري عرض قائمة جميع الطلاب...\n\n👥 سأنقلك إلى لوحة التحكم حيث يمكنك:\n• عرض جميع الطلاب المسجلين\n• البحث عن طالب معين\n• عرض تفاصيل كل طالب\n• إدارة حسابات الطلاب\n\nانتظر قليلاً... ⏳'
            : '✅ Displaying list of all students...\n\n👥 Taking you to the admin dashboard where you can:\n• View all registered students\n• Search for specific student\n• View each student\'s details\n• Manage student accounts\n\nPlease wait... ⏳',
          action: 'success'
        };
      }

      // الذهاب إلى لوحة التحكم
      if (lowerQuery.includes('لوحة') || lowerQuery.includes('dashboard') || lowerQuery.includes('control')) {
        setTimeout(() => setCurrentPage('admin-dashboard'), 1000);
        return {
          response: language === 'ar'
            ? '✅ حسناً! جاري نقلك إلى لوحة التحكم الإدارية...\n\n🎛️ ستجد هناك جميع أدوات الإدارة والإحصائيات.\n\nانتظر قليلاً... ⏳'
            : '✅ Okay! Taking you to the admin dashboard...\n\n🎛️ You will find all management tools and statistics there.\n\nPlease wait... ⏳',
          action: 'success'
        };
      }
    }

    // ===== أوامر المشرف (Supervisor Commands) =====
    if (userRole === 'supervisor') {
      // عرض طلبات الطلاب
      if (lowerQuery.includes('طلبات') || lowerQuery.includes('requests') || lowerQuery.includes('pending')) {
        setTimeout(() => setCurrentPage('supervisor-requests'), 1000);
        return {
          response: language === 'ar'
            ? '✅ جاري عرض طلبات الطلاب المعلقة...\n\n📋 سأنقلك إلى صفحة الطلبات حيث يمكنك:\n• مراجعة جميع الطلبات المعلقة\n• الموافقة أو رفض الطلبات\n• عرض تفاصيل كل طلب\n• التواصل مع الطلاب\n\nانتظر قليلاً... ⏳'
            : '✅ Displaying pending student requests...\n\n📋 Taking you to the requests page where you can:\n• Review all pending requests\n• Approve or reject requests\n• View details of each request\n• Communicate with students\n\nPlease wait... ⏳',
          action: 'success'
        };
      }

      // عرض معلومات الطلاب
      if (lowerQuery.includes('معلومات') && (lowerQuery.includes('طلاب') || lowerQuery.includes('students'))) {
        setTimeout(() => setCurrentPage('supervisor-students'), 1000);
        return {
          response: language === 'ar'
            ? '✅ جاري عرض معلومات الطلاب المشرف عليهم...\n\n👥 سأنقلك إلى صفحة الطلاب حيث يمكنك رؤية:\n• قائمة الطلاب المشرف عليهم\n• معدلاتهم التراكمية\n• المقررات المسجلة\n• الحالة الأكاديمية\n\nانتظر قليلاً... ⏳'
            : '✅ Displaying information of supervised students...\n\n👥 Taking you to the students page where you can see:\n• List of supervised students\n• Their GPAs\n• Registered courses\n• Academic status\n\nPlease wait... ⏳',
          action: 'success'
        };
      }
    }

    // ===== أوامر الطالب (Student Commands) =====
    if (userRole === 'student' || !userRole) {
      // Add Course Actions
      if (lowerQuery.includes('أضف') || lowerQuery.includes('سجل') || lowerQuery.includes('add') || lowerQuery.includes('register')) {
        // Find course to add
        let courseToAdd = null;
        
        if (lowerQuery.includes('نظم المعلومات') || lowerQuery.includes('mis') || lowerQuery.includes('information systems')) {
          courseToAdd = availableCourses.find(c => c.code === 'MIS301');
        } else if (lowerQuery.includes('قواعد البيانات') || lowerQuery.includes('database')) {
          courseToAdd = availableCourses.find(c => c.code === 'MIS302');
        } else if (lowerQuery.includes('برمجة') || lowerQuery.includes('programming')) {
          courseToAdd = availableCourses.find(c => c.code === 'CS201');
        } else if (lowerQuery.includes('إدارة') || lowerQuery.includes('management')) {
          courseToAdd = availableCourses.find(c => c.code === 'BUS201');
        } else {
          // Add first available course
          courseToAdd = availableCourses[0];
        }

        if (courseToAdd) {
          // Check if already registered
          const alreadyRegistered = registeredCourses.some(c => c.code === courseToAdd.code);
          
          if (alreadyRegistered) {
            toast.error(language === 'ar' ? 'المقرر مسجل مسبقاً!' : 'Course already registered!');
            return {
              response: language === 'ar'
                ? `❌ المقرر "${courseToAdd.nameAr}" (${courseToAdd.code}) مسجل مسبقاً!\n\nلا يمكن تسجيل نفس المقرر مرتين.`
                : `❌ Course "${courseToAdd.nameEn}" (${courseToAdd.code}) is already registered!\n\nCannot register the same course twice.`,
              action: 'error'
            };
          }

          // Add course
          setRegisteredCourses([...registeredCourses, courseToAdd]);
          toast.success(language === 'ar' ? 'تم إضافة المقرر بنجاح!' : 'Course added successfully!');
          
          return {
            response: language === 'ar'
              ? `✅ تم بنجاح! أضفت لك المقرر:\n\n📚 ${courseToAdd.nameAr}\n📋 الرمز: ${courseToAdd.code}\n👨‍🏫 الأستاذ: ${courseToAdd.instructor}\n⏰ الوقت: ${courseToAdd.time}\n🏛️ القاعة: ${courseToAdd.room}\n⭐ الساعات: ${courseToAdd.credits}\n\nيمكنك رؤيته الآن في جدولك الدراسي! 🎉`
              : `✅ Done! I added the course for you:\n\n📚 ${courseToAdd.nameEn}\n📋 Code: ${courseToAdd.code}\n👨‍🏫 Instructor: ${courseToAdd.instructor}\n⏰ Time: ${courseToAdd.time}\n🏛️ Room: ${courseToAdd.room}\n⭐ Credits: ${courseToAdd.credits}\n\nYou can see it now in your schedule! 🎉`,
            action: 'success'
          };
        }
      }

      // Delete Course Actions
      if (lowerQuery.includes('احذف') || lowerQuery.includes('حذف') || lowerQuery.includes('delete') || lowerQuery.includes('remove')) {
        if (registeredCourses.length === 0) {
          return {
            response: language === 'ar'
              ? '❌ لا يوجد مقررات مسجلة للحذف!\n\nيجب أن تسجل مقررات أولاً.'
              : '❌ No registered courses to delete!\n\nYou need to register courses first.',
            action: 'error'
          };
        }

        // Delete first registered course
        const courseToDelete = registeredCourses[0];
        setRegisteredCourses(registeredCourses.filter(c => c.code !== courseToDelete.code));
        toast.success(language === 'ar' ? 'تم حذف المقرر بنجاح!' : 'Course deleted successfully!');
        
        return {
          response: language === 'ar'
            ? `✅ تم حذف المقرر بنجا:\n\n📚 ${courseToDelete.nameAr}\n📋 الرمز: ${courseToDelete.code}\n\nتم إزالته من جدولك الدراسي.`
            : `✅ Course deleted successfully:\n\n📚 ${courseToDelete.nameEn}\n📋 Code: ${courseToDelete.code}\n\nRemoved from your schedule.`,
          action: 'success'
        };
      }

      // Show Schedule
      if (lowerQuery.includes('جدول') || lowerQuery.includes('schedule')) {
        if (registeredCourses.length === 0) {
          return {
            response: language === 'ar'
              ? 'ℹ️ جدولك الدراسي فارغ حالياً.\n\nلم تسجل أي مقررات بعد. هل تريد تسجيل مقررات؟'
              : 'ℹ️ Your schedule is currently empty.\n\nYou have not registered any courses yet. Do you want to register courses?',
            action: 'info'
          };
        }

        setTimeout(() => setCurrentPage('schedule'), 1000);
        
        return {
          response: language === 'ar'
            ? `📅 جدولك الدراسي:\n\n${registeredCourses.map((c, i) => 
              `${i + 1}. ${c.nameAr} (${c.code})\n   ⏰ ${c.time}\n   🏛️ ${c.room}\n`
            ).join('\n')}\nسأنقلك إلى صفحة الجدول الآن... ⏳`
            : `📅 Your Schedule:\n\n${registeredCourses.map((c, i) => 
              `${i + 1}. ${c.nameEn} (${c.code})\n   ⏰ ${c.time}\n   🏛️ ${c.room}\n`
            ).join('\n')}\nTaking you to schedule page now... ⏳`,
          action: 'success'
        };
      }
    }

    // Navigate to Pages
    if (lowerQuery.includes('اذهب') || lowerQuery.includes('افتح') || lowerQuery.includes('go') || lowerQuery.includes('open')) {
      if (lowerQuery.includes('تقارير') || lowerQuery.includes('report')) {
        setTimeout(() => setCurrentPage('reports'), 1000);
        return {
          response: language === 'ar'
            ? '✅ حسناً! سأنقلك إلى صفحة التقارير الآن... ⏳'
            : '✅ Okay! Taking you to reports page now... ⏳',
          action: 'success'
        };
      }
      if (lowerQuery.includes('مستندات') || lowerQuery.includes('document')) {
        setTimeout(() => setCurrentPage('documents'), 1000);
        return {
          response: language === 'ar'
            ? '✅ حسناً! سأنقلك إلى صفحة المستندات الآن... ⏳'
            : '✅ Okay! Taking you to documents page now... ⏳',
          action: 'success'
        };
      }
      if (lowerQuery.includes('مقررات') || lowerQuery.includes('course')) {
        setTimeout(() => setCurrentPage('courses'), 1000);
        return {
          response: language === 'ar'
            ? '✅ حسناً! سأنقلك إلى صفحة المقررات المتاحة الآن... ⏳'
            : '✅ Okay! Taking you to available courses page now... ⏳',
          action: 'success'
        };
      }
    }

    // List Available Courses
    if (lowerQuery.includes('متاحة') || lowerQuery.includes('available') || lowerQuery.includes('ابحث') || lowerQuery.includes('search')) {
      return {
        response: language === 'ar'
          ? `📚 المقررات المتاحة:\n\n${availableCourses.slice(0, 5).map((c, i) => 
            `${i + 1}. ${c.nameAr} (${c.code})\n   👨‍🏫 ${c.instructor}\n   ⏰ ${c.time}\n   ⭐ ${c.credits} ساعات\n`
          ).join('\n')}\nوالمزيد... اذهب إلى صفحة المقررات لرؤية الكل!`
          : `📚 Available Courses:\n\n${availableCourses.slice(0, 5).map((c, i) => 
            `${i + 1}. ${c.nameEn} (${c.code})\n   👨‍🏫 ${c.instructor}\n   ⏰ ${c.time}\n   ⭐ ${c.credits} credits\n`
          ).join('\n')}\nAnd more... Go to courses page to see all!`,
        action: 'info'
      };
    }

    // Help
    if (lowerQuery.includes('مساعدة') || lowerQuery.includes('help')) {
      return {
        response: language === 'ar'
          ? '💡 أستطيع مساعدتك في:\n\n📚 تسجيل المقررات:\n• "أضف مقرر نظم المعلومات"\n• "احذف مقرر الإحصاء"\n\n📅 عرض المعلومات:\n• "اعرض جدولي"\n• "ما هي المقررات المتاحة؟"\n\n🔄 التنقل:\n• "اذهب إلى التقارير"\n• "افتح المستندات"\n\nجرب أي أمر الآن! 🚀'
          : '💡 I can help you with:\n\n📚 Course Registration:\n• "Add MIS course"\n• "Delete Statistics course"\n\n📅 View Information:\n• "Show my schedule"\n• "What courses are available?"\n\n🔄 Navigation:\n• "Go to reports"\n• "Open documents"\n\nTry any command now! 🚀',
        action: 'info'
      };
    }

    // Default response
    return {
      response: language === 'ar'
        ? '🤔 عذراً، لم أفهم طلبك بوضوح.\n\n💡 جرب أوامر مثل:\n• "أضف مقرر نظم المعلومات"\n• "احذف مقرر"\n• "اعرض جدولي"\n• "اذهب إلى التقارير"\n• "ما هي المقررات المتاحة؟"\n\nأو استخدم الأسئلة الشائعة! 👇'
        : '🤔 Sorry, I did not clearly understand your request.\n\n💡 Try commands like:\n• "Add MIS course"\n• "Delete course"\n• "Show my schedule"\n• "Go to reports"\n• "What courses are available?"\n\nOr use common questions! 👇',
      action: 'info'
    };
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const { response, action } = executeAction(messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        action: action
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header with Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1654366698665-e6d611a9aaa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGNsYXNzcm9vbSUyMGxlYXJuaW5nfGVufDF8fHx8MTc2Mjk2NzU1MXww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="AI Assistant"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/95 via-pink-600/95 to-purple-600/95"></div>
        </div>

        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full animate-pulse">
              <Bot className="w-16 h-16" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-300" />
            {language === 'ar' ? 'المساعد الذكي الحقيقي' : 'Real AI Assistant'}
            <Sparkles className="w-10 h-10 text-yellow-300" />
          </h1>
          
          <p className="text-2xl opacity-90 mb-6">
            {language === 'ar' 
              ? 'ينفذ أوامرك فعلياً ويساعدك في كل شيء!'
              : 'Executes your commands and helps you with everything!'}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-white/20 text-white text-sm px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تنفيذ فوري' : 'Instant Execution'}
            </Badge>
            <Badge className="bg-white/20 text-white text-sm px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'إجراءات حقيقية' : 'Real Actions'}
            </Badge>
            <Badge className="bg-white/20 text-white text-sm px-4 py-2">
              <Lightbulb className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'ذكي وفعال' : 'Smart & Efficient'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Section */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] md:h-[700px] flex flex-col shadow-2xl border-2">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">
                      {language === 'ar' ? 'مساعد KKU الحقيقي' : 'Real KKU Assistant'}
                    </h3>
                    <p className="text-sm opacity-90 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      {language === 'ar' ? 'جاهز للتنفيذ' : 'Ready to Execute'}
                    </p>
                  </div>
                </div>
                <MessageCircle className="w-8 h-8 animate-bounce" />
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6 bg-muted/30">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-3 max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                        message.isUser 
                          ? 'bg-gradient-to-br from-kku-green to-emerald-600' 
                          : message.action === 'success'
                          ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                          : message.action === 'error'
                          ? 'bg-gradient-to-br from-red-600 to-rose-600'
                          : 'bg-gradient-to-br from-purple-600 to-pink-600'
                      }`}>
                        {message.isUser ? (
                          <User className="w-5 h-5 text-white" />
                        ) : message.action === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : message.action === 'error' ? (
                          <XCircle className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`rounded-2xl px-6 py-4 shadow-lg ${
                            message.isUser
                              ? 'bg-gradient-to-br from-kku-green to-emerald-600 text-white'
                              : message.action === 'success'
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800'
                              : message.action === 'error'
                              ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-2 border-red-200 dark:border-red-800'
                              : 'bg-white dark:bg-gray-800'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 px-2">
                          {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-end gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-lg">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 border-t bg-white dark:bg-gray-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-3"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={language === 'ar' ? '💬 اكتب أمرك هنا... (مثال: أضف مقرر نظم المعلومات)' : '💬 Type your command here... (Example: Add MIS course)'}
                  className="flex-1 h-12 text-lg"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 h-12"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Quick Questions Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-2">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-600" />
              {language === 'ar' ? 'أوامر سريعة' : 'Quick Commands'}
            </h3>
            <div className="space-y-3">
              {quickQuestionsMap[userRole][language].map((q, index) => {
                const Icon = q.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 hover:bg-white dark:hover:bg-gray-800 hover:scale-105 transition-transform"
                    onClick={() => handleSendMessage(q.text)}
                  >
                    <Icon className="w-5 h-5 mr-3 text-purple-600 flex-shrink-0" />
                    <span>{q.text}</span>
                  </Button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              {language === 'ar' ? 'ما يمكنني فعله' : 'What I Can Do'}
            </h3>
            <ul className="space-y-3 text-sm">
              {userRole === 'supervisor' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'مراجعة طلبات الطلاب المعلقة'
                      : 'Review pending student requests'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'الموافقة أو رفض طلبات التسجيل'
                      : 'Approve or reject registration requests'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'عرض معلومات الطلاب المشرف عليهم'
                      : 'View supervised students information'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'التنقل بين صفحات النظام'
                      : 'Navigate between system pages'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'عرض التقارير الأكاديمية'
                      : 'View academic reports'}
                  </li>
                </>
              ) : userRole === 'admin' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'عرض إحصائيات النظام الشاملة'
                      : 'View comprehensive system statistics'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'إدارة جميع الطلاب والمشرفين'
                      : 'Manage all students and supervisors'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'مراقبة طلبات التسجيل'
                      : 'Monitor registration requests'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'إدارة الأقسام والمقررات'
                      : 'Manage departments and courses'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'الوصول لجميع التقارير الإدارية'
                      : 'Access all administrative reports'}
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'إضافة مقررات إلى جدولك فعلياً'
                      : 'Actually add courses to your schedule'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'حذف مقررات من جدولك'
                      : 'Delete courses from your schedule'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'عرض جدولك ومقرراتك'
                      : 'Show your schedule and courses'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'التنقل بين الصفحات'
                      : 'Navigate between pages'}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    {language === 'ar' 
                      ? 'البحث عن المقررات المتاحة'
                      : 'Search for available courses'}
                  </li>
                </>
              )}
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              {language === 'ar' ? 'أمثلة على الأوامر' : 'Command Examples'}
            </h3>
            <ul className="space-y-2 text-sm">
              {userRole === 'supervisor' ? (
                <>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'عرض طلبات الطلاب المعلقة' : 'Show pending student requests'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'اذهب إلى صفحة الطلبات' : 'Go to requests page'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'عرض معلومات الطلاب' : 'Show students information'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'اذهب إلى التقارير' : 'Go to reports'}
                  </li>
                </>
              ) : userRole === 'admin' ? (
                <>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'عرض إحصائيات النظام' : 'Show system statistics'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'عرض جميع الطلاب' : 'Show all students'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'اذهب إلى لوحة التحكم' : 'Go to admin dashboard'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'عرض تقارير المشرفين' : 'Show supervisor reports'}
                  </li>
                </>
              ) : (
                <>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'أضف مقرر قواعد البيانات' : 'Add database course'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'احذف المقرر الأول' : 'Delete first course'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'اعرض جدولي الدراسي' : 'Show my schedule'}
                  </li>
                  <li className="p-2 bg-white dark:bg-gray-800 rounded">
                    💬 {language === 'ar' ? 'اذهب إلى التقارير' : 'Go to reports'}
                  </li>
                </>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};