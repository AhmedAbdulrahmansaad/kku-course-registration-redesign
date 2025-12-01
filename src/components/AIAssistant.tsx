import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'ai' | 'fallback' | 'error';
}

export const AIAssistant: React.FC = () => {
  const { language, currentPage, userInfo } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: language === 'ar' 
        ? `👋 مرحباً ${userInfo?.name || ''}! أنا المساعد الذكي لجامعة الملك خالد.\n\n✨ يمكنني مساعدتك في:\n${userInfo?.role === 'supervisor' 
          ? '• 📋 طلبات الطلاب\n• 📊 التقارير\n• 🎓 إدارة القسم'
          : userInfo?.role === 'admin'
          ? '• 📈 الإحصائيات\n• 🏢 الأقسام\n• ⚠️ المشاكل والحلول'
          : '• 📚 المقررات والتسجيل\n• 📅 الجدول الدراسي\n• 📊 المعدل والساعات\n• 🔍 التعارضات'
        }\n\nاسألني أي شيء! 🤔`
        : `👋 Hello ${userInfo?.name || ''}! I'm the King Khalid University Smart Assistant.\n\n✨ I can help you with:\n${userInfo?.role === 'supervisor' 
          ? '• 📋 Student requests\n• 📊 Reports\n• 🎓 Department management'
          : userInfo?.role === 'admin'
          ? '• 📈 Statistics\n• 🏢 Departments\n• ⚠️ Issues and solutions'
          : '• 📚 Courses and registration\n• 📅 Class schedule\n• 📊 GPA and hours\n• 🔍 Conflicts'
        }\n\nAsk me anything! 🤔`,
      isUser: false,
      timestamp: new Date(),
      type: 'ai',
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

  // Update greeting when user info changes
  useEffect(() => {
    if (userInfo && messages.length === 1) {
      setMessages([{
        id: '0',
        text: language === 'ar' 
          ? `👋 مرحباً ${userInfo.name}! أنا المساعد الذكي لجامعة الملك خالد.\n\n✨ يمكنني مساعدتك في:\n${userInfo.role === 'supervisor' 
            ? '• 📋 طلبات الطلاب\n• 📊 التقارير\n• 🎓 إدارة القسم'
            : userInfo.role === 'admin'
            ? '• 📈 الإحصائيات\n• 🏢 الأقسام\n• ⚠️ المشاكل والحلول'
            : '• 📚 المقررات والتسجيل\n• 📅 الجدول الدراسي\n• 📊 المعدل والساعات\n• 🔍 التعارضات'
          }\n\nاسألني أي شيء! 🤔`
          : `👋 Hello ${userInfo.name}! I'm the King Khalid University Smart Assistant.\n\n✨ I can help you with:\n${userInfo.role === 'supervisor' 
            ? '• 📋 Student requests\n• 📊 Reports\n• 🎓 Department management'
            : userInfo.role === 'admin'
            ? '• 📈 Statistics\n• 🏢 Departments\n• ⚠️ Issues and solutions'
            : '• 📚 Courses and registration\n• 📅 Class schedule\n• 📊 GPA and hours\n• 🔍 Conflicts'
          }\n\nAsk me anything! 🤔`,
        isUser: false,
        timestamp: new Date(),
        type: 'ai',
      }]);
    }
  }, [userInfo, language]);

  const getAIResponse = async (query: string): Promise<{ response: string; type: 'ai' | 'fallback' | 'error' }> => {
    try {
      // جلب بيانات المستخدم الحالية
      let contextData: any = {
        userInfo: {
          name: userInfo?.name,
          id: userInfo?.id,
          role: userInfo?.role || 'student',
          level: userInfo?.level,
          major: userInfo?.major,
          gpa: userInfo?.gpa,
          access_token: userInfo?.access_token,
        },
      };

      // جلب المقررات إذا كان طالب
      if (userInfo?.role === 'student' || !userInfo?.role) {
        try {
          const coursesResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/courses/all`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            }
          );
          
          if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            contextData.courses = coursesData.courses;
          }
        } catch (err) {
          // Silent fail - courses are optional
        }

        // جلب المقررات المسجلة
        try {
          const registrationsResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/registrations`,
            {
              headers: {
                'Authorization': `Bearer ${userInfo?.access_token || publicAnonKey}`,
              },
            }
          );
          
          if (registrationsResponse.ok) {
            const registrationsData = await registrationsResponse.json();
            contextData.registrations = registrationsData.registrations;
          }
        } catch (err) {
          // Silent fail - registrations are optional
        }
      }

      // جلب بيانات المشرف
      if (userInfo?.role === 'supervisor') {
        try {
          const requestsResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/supervisor/requests`,
            {
              headers: {
                'Authorization': `Bearer ${userInfo?.access_token || publicAnonKey}`,
              },
            }
          );
          
          if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json();
            contextData.requests = requestsData.requests;
          }
        } catch (err) {
          // Silent fail - requests are optional
        }
      }

      // جلب بيانات المدير
      if (userInfo?.role === 'admin') {
        try {
          // جلب إحصائيات الطلاب
          const studentsResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/students`,
            {
              headers: {
                'Authorization': `Bearer ${userInfo?.access_token || publicAnonKey}`,
              },
            }
          );
          
          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            contextData.students = studentsData.students;
          }
        } catch (err) {
          // Silent fail - students are optional
        }
      }

      // إرسال الطلب للسيرفر
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            message: query,
            userInfo: contextData.userInfo,
            courses: contextData.courses,
            registrations: contextData.registrations,
            requests: contextData.requests,
            students: contextData.students,
            language: language,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      return {
        response: data.response,
        type: data.type,
      };
    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        response: language === 'ar'
          ? '😔 عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'
          : '😔 Sorry, a connection error occurred. Please try again.',
        type: 'error',
      };
    }
  };

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const { response, type } = await getAIResponse(text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        type,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: language === 'ar'
          ? '😔 عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
          : '😔 Sorry, an error occurred. Please try again.',
        isUser: false,
        timestamp: new Date(),
        type: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // إخفاء الزر العائم إذا كان المستخدم في صفحة المساعد الذكي
  if (currentPage === 'assistant') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50" dir="ltr">
      {/* نافذة المحادثة */}
      {isOpen && (
        <Card className="w-80 md:w-96 mb-4 p-4 shadow-2xl animate-fade-in border-2 border-kku-green/20 dark:border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-kku-green to-kku-gold p-2 rounded-full relative">
                <Bot className="h-5 w-5 text-white" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">
                    {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
                  </h3>
                  <Sparkles className="h-3 w-3 text-kku-gold" />
                </div>
                <p className="text-xs text-green-500">
                  {language === 'ar' ? 'متصل الآن' : 'Online now'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <ScrollArea className="h-80 mb-4 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {!message.isUser && (
                      <div className="bg-gradient-to-br from-kku-green to-kku-gold p-1.5 rounded-full flex-shrink-0 mt-1">
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        message.isUser
                          ? 'bg-kku-green text-white dark:bg-primary'
                          : message.type === 'error'
                          ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      {!message.isUser && message.type === 'ai' && (
                        <Badge 
                          variant="secondary" 
                          className="mt-2 text-xs bg-kku-gold/20 text-kku-gold border-none"
                        >
                          <Sparkles className="h-2 w-2 mr-1" />
                          {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI Powered'}
                        </Badge>
                      )}
                      {!message.isUser && message.type === 'fallback' && (
                        <Badge 
                          variant="outline" 
                          className="mt-2 text-xs"
                        >
                          {language === 'ar' ? 'رد تلقائي' : 'Auto Response'}
                        </Badge>
                      )}
                    </div>
                    
                    {message.isUser && (
                      <div className="bg-kku-green/20 p-1.5 rounded-full flex-shrink-0 mt-1">
                        <User className="h-3 w-3 text-kku-green dark:text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="bg-gradient-to-br from-kku-green to-kku-gold p-1.5 rounded-full">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-muted px-4 py-2 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-kku-green dark:bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-kku-green dark:bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-kku-green dark:bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question...'}
              disabled={isTyping}
              className="flex-1"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-kku-green hover:bg-kku-green/90 dark:bg-primary dark:hover:bg-primary/90"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            {language === 'ar' 
              ? '💡 يمكنني مساعدتك في أي استفسار أكاديمي'
              : '💡 I can help with any academic inquiry'
            }
          </p>
        </Card>
      )}

      {/* زر فتح المحادثة */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-kku-green to-kku-gold hover:scale-110 transition-transform duration-300 border-2 border-white dark:border-gray-800"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            <Sparkles className="h-3 w-3 text-white absolute -top-1 -right-1 animate-pulse" />
          </div>
        )}
      </Button>
    </div>
  );
};