import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const knowledgeBase: Record<string, { ar: string; en: string }> = {
  'greeting': {
    ar: '👋 مرحباً! أنا مساعد جامعة الملك خالد الذكي. أنا هنا لمساعدتك في جميع استفساراتك الأكاديمية. كيف يمكنني مساعدتك اليوم؟',
    en: '👋 Hello! I am King Khalid University Smart Assistant. I am here to help you with all your academic inquiries. How can I help you today?'
  },
  'مرحبا': {
    ar: '👋 أهلاً وسهلاً! كيف يمكنني مساعدتك اليوم؟',
    en: '👋 Welcome! How can I help you today?'
  },
  'hello': {
    ar: '👋 أهلاً وسهلاً! كيف يمكنني مساعدتك اليوم؟',
    en: '👋 Welcome! How can I help you today?'
  },
  'add course': {
    ar: '📚 لإضافة مقرر:\n\n1️⃣ اذهب إلى صفحة "المقررات المتاحة"\n2️⃣ اختر التخصص والمستوى\n3️⃣ اضغط على زر "سجل الآن" بجانب المقرر\n4️⃣ أرسل طلب التسجيل للمشرف الأكاديمي\n5️⃣ انتظر الموافقة من المشرف\n\n💡 تأكد من:\n• عدم وجود تعارض في الجدول\n• استيفاء المتطلبات الأساسية\n• عدم تجاوز 18 ساعة معتمدة',
    en: '📚 To add a course:\n\n1️⃣ Go to "Available Courses" page\n2️⃣ Select your major and level\n3️⃣ Click "Register Now" button next to the course\n4️⃣ Submit registration request to academic supervisor\n5️⃣ Wait for supervisor approval\n\n💡 Make sure:\n• No schedule conflict\n• Prerequisites met\n• Not exceeding 18 credit hours'
  },
  'كيف أضيف مقرر': {
    ar: '📚 لإضافة مقرر:\n\n1️⃣ اذهب إلى صفحة "المقررات المتاحة"\n2️⃣ اختر التخصص والمستوى\n3️⃣ اضغط على زر "سجل الآن" بجانب المقرر\n4️⃣ أرسل طلب التسجيل للمشرف الأكاديمي\n5️⃣ انتظر الموافقة من المشرف\n\n💡 تأكد من:\n• عدم وجود تعارض في الجدول\n• استيفاء المتطلبات الأساسية\n• عدم تجاوز 18 ساعة معتمدة',
    en: '📚 To add a course:\n\n1️⃣ Go to "Available Courses" page\n2️⃣ Select your major and level\n3️⃣ Click "Register Now" button next to the course\n4️⃣ Submit registration request to academic supervisor\n5️⃣ Wait for supervisor approval\n\n💡 Make sure:\n• No schedule conflict\n• Prerequisites met\n• Not exceeding 18 credit hours'
  },
  'كيف أسجل مقرر': {
    ar: '📚 لتسجيل مقرر:\n\n1️⃣ اذهب إلى صفحة "المقررات المتاحة"\n2️⃣ اضغط "سجل الآن" على المقرر\n3️⃣ سيتم إرسال طلبك للمشرف الأكاديمي (د. محمد رشيد)\n4️⃣ ستظهر الحالة "قيد الانتظار" حتى الموافقة\n5️⃣ ستستلم إشعار عند الموافقة أو الرفض',
    en: '📚 To register for a course:\n\n1️⃣ Go to "Available Courses" page\n2️⃣ Click "Register Now" on the course\n3️⃣ Your request will be sent to academic supervisor (Dr. Mohammed Rashid)\n4️⃣ Status will show "Pending" until approval\n5️⃣ You will receive notification upon approval or rejection'
  },
  'delete course': {
    ar: '🗑️ لحذف مقرر:\n\n1️⃣ اذهب إلى "المقررات المسجلة"\n2️⃣ اضغط على أيقونة سلة المهملات بجانب المقرر\n3️⃣ أكد عملية الحذف\n\n⚠️ ملاحظات مه��ة:\n• يجب أن يكون الحذف خلال فترة الحذف والإضافة\n• قد تحتاج موافقة المشرف الأكاديمي\n• تأكد من أن المقرر ليس متطلب سابق لمقرر آخر',
    en: '🗑️ To delete a course:\n\n1️⃣ Go to "Registered Courses"\n2️⃣ Click the trash icon next to the course\n3️⃣ Confirm deletion\n\n⚠️ Important notes:\n• Deletion must be during add/drop period\n• May require academic supervisor approval\n• Make sure course is not a prerequisite for another course'
  },
  'كيف أحذف مقرر': {
    ar: '🗑️ لحذف مقرر:\n\n1️⃣ اذهب إلى "المقررات المسجلة"\n2️⃣ اضغط على أيقونة سلة المهملات\n3️⃣ أكد الحذف\n\n⚠️ الحذف يجب أن يكون خلال الفترة المحددة',
    en: '🗑️ To delete a course:\n\n1️⃣ Go to "Registered Courses"\n2️⃣ Click trash icon\n3️⃣ Confirm deletion\n\n⚠️ Deletion must be during designated period'
  },
  'view schedule': {
    ar: '📅 لعرض جدولك الدراسي:\n\n1️⃣ اذهب إلى "الجدول الدراسي" من القائمة\n2️⃣ ستجد جميع المقررات المسجلة مع:\n   • الأوقات\n   • القاعات\n   • أسماء الأساتذة\n3️⃣ يمكنك:\n   ✅ تحميل الجدول كـ PDF\n   ✅ طباعة الجدول\n   ✅ عرض على الجوال',
    en: '📅 To view your schedule:\n\n1️⃣ Go to "My Schedule" from menu\n2️⃣ You will find all registered courses with:\n   • Times\n   • Rooms\n   • Instructor names\n3️⃣ You can:\n   ✅ Download schedule as PDF\n   ✅ Print schedule\n   ✅ View on mobile'
  },
  'كيف أعرف جدولي': {
    ar: '📅 لعرض جدولك:\n\n1️⃣ من القائمة الجانبية، اختر "الجدول الدراسي"\n2️⃣ سترى جدول أسبوعي كامل\n3️⃣ يمكنك تحميله PDF أو طباعته',
    en: '📅 To view your schedule:\n\n1️⃣ From sidebar, choose "My Schedule"\n2️⃣ You will see complete weekly schedule\n3️⃣ You can download PDF or print it'
  },
  'كيف أعرف معدلي': {
    ar: '📊 لمعرفة معدلك التراكمي:\n\n1️⃣ اذهب إلى "تقاريري الأكاديمية"\n2️⃣ ستجد المعدل التراكمي مباشرة في الأعلى\n3️⃣ يمكنك أيضاً مشاهدة:\n   • معدل كل فصل\n   • توزيع الدرجات\n   • التقدم الدراسي\n\n💡 المعدل يُحسب تلقائياً بعد نهاية كل فصل',
    en: '📊 To check your GPA:\n\n1️⃣ Go to "My Academic Reports"\n2️⃣ You will find cumulative GPA at the top\n3️⃣ You can also see:\n   • GPA per semester\n   • Grade distribution\n   • Academic progress\n\n💡 GPA is calculated automatically after each semester'
  },
  'تقارير': {
    ar: '📈 للوصول إلى التقارير الأكاديمية:\n\n1️⃣ اذهب إلى "تقاريري الأكاديمية"\n2️⃣ اختر نوع التقرير:\n   • التقرير الأكاديمي الشامل\n   • تقرير الأداء\n   • تقرير المقررات\n3️⃣ يمكنك:\n   📄 تحميل كـ PDF\n   📝 تحميل كـ Word\n   🖨️ طباعة مباشرة\n\n✅ جميع التقارير محدثة آلياً من قاعدة البيانات',
    en: '📈 To access academic reports:\n\n1️⃣ Go to "My Academic Reports"\n2️⃣ Choose report type:\n   • Comprehensive Academic Report\n   • Performance Report\n   • Courses Report\n3️⃣ You can:\n   📄 Download as PDF\n   📝 Download as Word\n   🖨️ Print directly\n\n✅ All reports are auto-updated from database'
  },
  'reports': {
    ar: '📈 للوصول إلى التقارير:\n\n1️⃣ "تقاريري الأكاديمية" من القائمة\n2️⃣ اختر التقرير المطلوب\n3️⃣ حمّل PDF أو Word أو اطبع',
    en: '📈 To access reports:\n\n1️⃣ "My Academic Reports" from menu\n2️⃣ Choose desired report\n3️⃣ Download PDF or Word or print'
  },
  'تواصل مع المشرف': {
    ar: '👨‍🏫 للتواصل مع المشرف الأكاديمي (د. محمد رشيد):\n\n1️⃣ اذهب إلى صفحة "اتصل بنا"\n2️⃣ اختر "استشارة أكاديمية" كموضوع\n3️⃣ اكتب رسالتك بوضوح\n4️⃣ اضغط "إرسال"\n\n📧 البريد الإلكتروني: m.rashid@kku.edu.sa\n📞 رقم التواصل: سيتم الرد خلال 24 ساعة',
    en: '👨‍🏫 To contact academic supervisor (Dr. Mohammed Rashid):\n\n1️⃣ Go to "Contact Us" page\n2️⃣ Choose "Academic Consultation" as subject\n3️⃣ Write your message clearly\n4️⃣ Click "Send"\n\n📧 Email: m.rashid@kku.edu.sa\n📞 Contact: Response within 24 hours'
  },
  'رفع ملفات': {
    ar: '📁 لرفع المستندات:\n\n1️⃣ اذهب إلى "إدارة المستندات"\n2️⃣ اسحب وأفلت الملف أو اضغط "اختر ملف"\n3️⃣ انتظر اكتمال الرفع\n\n✅ الصيغ المدعومة: JPG, PNG, PDF\n⚠️ الحد الأقصى: 5MB لكل ملف',
    en: '📁 To upload documents:\n\n1️⃣ Go to "Documents Management"\n2️⃣ Drag and drop file or click "Choose File"\n3️⃣ Wait for upload completion\n\n✅ Supported formats: JPG, PNG, PDF\n⚠️ Max size: 5MB per file'
  },
  'upload files': {
    ar: '📁 لرفع الملفات:\n\n1️⃣ "إدارة المستندات"\n2️⃣ اسحب الملف أو اختره\n3️⃣ انتظر التحميل\n\n✅ JPG, PNG, PDF (حد أقصى 5MB)',
    en: '📁 To upload files:\n\n1️⃣ "Documents Management"\n2️⃣ Drag file or choose it\n3️⃣ Wait for upload\n\n✅ JPG, PNG, PDF (max 5MB)'
  },
  'مقررات قسمي': {
    ar: '🎓 مقررات قسم نظم المعلومات الإدارية:\n\n• المستوى 1-2: مقررات عامة وتأسيسية\n• المستوى 3-4: مقررات التخصص الأساسية\n• المستوى 5-6: مقررات متقدمة\n• المستوى 7-8: مشاريع وتدريب ميداني\n\n📚 إجمالي: 49 مقرر (132 ساعة)\n\nللتفاصيل الكاملة، اذهب إلى "المقررات المتاحة"',
    en: '🎓 MIS Department Courses:\n\n• Level 1-2: General and foundational courses\n• Level 3-4: Core major courses\n• Level 5-6: Advanced courses\n• Level 7-8: Projects and field training\n\n📚 Total: 49 courses (132 hours)\n\nFor full details, go to "Available Courses"'
  },
};

export const AIAssistant: React.FC = () => {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: language === 'ar' 
        ? 'مرحباً! كيف يمكنني مساعدتك اليوم؟'
        : 'Hello! How can I help you today?',
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

  const getResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase().trim();
    
    for (const [key, value] of Object.entries(knowledgeBase)) {
      if (lowerQuery.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerQuery)) {
        return value[language];
      }
    }

    return language === 'ar'
      ? 'عذراً، لم أفهم سؤالك. يمكنني مساعدتك في:\n- إضافة وحذف المقررات\n- عرض الجدول والتقارير\n- رفع المستندات'
      : "Sorry, I didn't understand your question. I can help you with:\n- Adding and removing courses\n- Viewing schedule and reports\n- Uploading documents";
  };

  const handleSendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-50 h-14 w-14 rounded-full shadow-lg bg-kku-green hover:bg-kku-green/90`}
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed bottom-24 ${language === 'ar' ? 'left-6' : 'right-6'} z-50 w-96 h-[500px] shadow-xl flex flex-col`}>
          {/* Header */}
          <div className="bg-kku-green text-white p-4 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6" />
              <div>
                <h3 className="font-bold">
                  {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
                </h3>
                <p className="text-xs opacity-90">
                  {language === 'ar' ? 'متصل الآن' : 'Online Now'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.isUser ? 'bg-kku-green' : 'bg-muted'
                    }`}>
                      {message.isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.isUser
                            ? 'bg-kku-green text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 px-2">
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
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-kku-green rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-kku-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-kku-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب سؤالك...' : 'Type your question...'}
                className="flex-1"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="bg-kku-green hover:bg-kku-green/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
};