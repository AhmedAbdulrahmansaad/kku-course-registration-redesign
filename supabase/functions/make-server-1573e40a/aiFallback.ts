// Enhanced Fallback response function for AI Assistant
export function getFallbackResponse(message: string, userInfo: any, courses: any[], language: string = 'ar'): string {
  const lowerMessage = message.toLowerCase();
  const isArabic = language === 'ar';
  
  // التحيات
  if (lowerMessage.includes('مرحبا') || lowerMessage.includes('السلام') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    if (userInfo?.role === 'supervisor') {
      return isArabic 
        ? `👋 مرحباً ${userInfo?.name || 'دكتور'}! كيف يمكنني مساعدتك في إدارة طلبات الطلاب اليوم؟\n\n📋 يمكنني مساعدتك في:\n• عرض الطلبات المعلقة\n• إحصائيات القسم\n• توليد التقارير`
        : `👋 Hello ${userInfo?.name || 'Dr.'}! How can I help you manage student requests today?\n\n📋 I can help you with:\n• View pending requests\n• Department statistics\n• Generate reports`;
    } else if (userInfo?.role === 'admin') {
      return isArabic
        ? `👋 مرحباً ${userInfo?.name || 'سيدي'}! كيف يمكنني مساعدتك في إدارة النظام اليوم؟\n\n🏢 يمكنني مساعدتك في:\n• الإحصائيات الشاملة\n• إدارة الأقسام\n• تحليل المشاكل`
        : `👋 Hello ${userInfo?.name || 'Sir'}! How can I help you manage the system today?\n\n🏢 I can help you with:\n• Comprehensive statistics\n• Department management\n• Problem analysis`;
    } else {
      return isArabic
        ? `👋 مرحباً ${userInfo?.name || 'بك'}! كيف يمكنني مساعدتك اليوم؟\n\n📚 يمكنني مساعدتك في:\n• تسجيل المقررات\n• عرض الجدول\n• الإجابة عن الأسئلة`
        : `👋 Hello ${userInfo?.name || ''}! How can I help you today?\n\n📚 I can help you with:\n• Course registration\n• View schedule\n• Answer questions`;
    }
  }
  
  // للطلاب - تسجيل المقررات
  if ((lowerMessage.includes('تسجيل') || lowerMessage.includes('مقرر') || lowerMessage.includes('register') || lowerMessage.includes('course')) && userInfo?.role !== 'supervisor' && userInfo?.role !== 'admin') {
    return isArabic
      ? `📚 لتسجيل مقرر:\n\n1️⃣ اذهب إلى \"المقررات المتاحة\"\n2️⃣ اختر المقرر المناسب لمستواك (${userInfo?.level || 1})\n3️⃣ اضغط \"سجل الآن\"\n4️⃣ انتظر موافقة المشرف الأكاديمي\n\n💡 معدلك الحالي: ${userInfo?.gpa || 'غير محدد'}`
      : `📚 To register for a course:\n\n1️⃣ Go to \"Available Courses\"\n2️⃣ Choose a course for your level (${userInfo?.level || 1})\n3️⃣ Click \"Register Now\"\n4️⃣ Wait for supervisor approval\n\n💡 Your GPA: ${userInfo?.gpa || 'Not set'}`;
  }
  
  // المقررات المتاحة
  if (lowerMessage.includes('متاحة') || lowerMessage.includes('available')) {
    return isArabic
      ? `📚 المقررات المتاحة:\n\nلديك ${courses?.length || 0} مقرر متاح في مستواك الحالي (المستوى ${userInfo?.level || 1}).\n\n✨ اذهب إلى صفحة \"المقررات المتاحة\" لرؤية القائمة الكاملة!`
      : `📚 Available courses:\n\nYou have ${courses?.length || 0} courses available for your current level (Level ${userInfo?.level || 1}).\n\n✨ Go to \"Available Courses\" page to see the full list!`;
  }
  
  // الجدول الدراسي
  if (lowerMessage.includes('جدول') || lowerMessage.includes('schedule')) {
    return isArabic
      ? `📅 للاطلاع على جدولك الدراسي:\n\n✅ اذهب إلى \"الجدول الدراسي\" من القائمة\n✅ ستجد جميع مقرراتك المسجلة مع أوقات المحاضرات والأساتذة\n\n💡 يمكنك تحميل الجدول PDF أو طباعته!`
      : `📅 To view your schedule:\n\n✅ Go to \"Class Schedule\" from menu\n✅ You'll find all your registered courses with times and professors\n\n💡 You can download PDF or print it!`;
  }
  
  // المعدل التراكمي
  if (lowerMessage.includes('معدل') || lowerMessage.includes('gpa')) {
    return isArabic
      ? `📊 معدلك التراكمي الحالي: ${userInfo?.gpa || 'غير محدد'}\n\n✨ للاطلاع على تفاصيل أكثر:\n• اذهب إلى \"السجل الأكاديمي\"\n• شاهد جميع درجاتك وتقديراتك`
      : `📊 Your current GPA: ${userInfo?.gpa || 'Not set'}\n\n✨ For more details:\n• Go to \"Academic Transcript\"\n• See all your grades and scores`;
  }
  
  // للمشرفين - الطلبات
  if ((lowerMessage.includes('طلبات') || lowerMessage.includes('requests')) && userInfo?.role === 'supervisor') {
    return isArabic
      ? `📋 إدارة طلبات الطلاب:\n\n✅ اذهب إلى \"طلبات الطلاب\"\n✅ يمكنك الموافقة أو الرفض\n✅ عرض تفاصيل كل طالب\n\n💡 تحقق من عدم وجود تعارضات!`
      : `📋 Manage student requests:\n\n✅ Go to \"Student Requests\"\n✅ You can approve or reject\n✅ View each student's details\n\n💡 Check for conflicts!`;
  }
  
  // للمدير - الإحصائيات
  if ((lowerMessage.includes('إحصائيات') || lowerMessage.includes('statistics')) && userInfo?.role === 'admin') {
    return isArabic
      ? `📈 إحصائيات النظام:\n\n✅ اذهب إلى \"لوحة تحكم المدير\"\n✅ إحصائيات شاملة عن الطلاب والمقررات\n\n💡 يمكنك تصدير التقارير!`
      : `📈 System statistics:\n\n✅ Go to \"Admin Dashboard\"\n✅ Comprehensive statistics about students and courses\n\n💡 You can export reports!`;
  }
  
  // رد افتراضي
  return isArabic
    ? `🤔 عذراً، لم أفهم سؤالك بالكامل.\n\n${userInfo?.role === 'supervisor' 
        ? '📋 يمكنني مساعدتك في:\n• طلبات الطلاب\n• التقارير\n• إدارة القسم'
        : userInfo?.role === 'admin'
        ? '🏢 يمكنني مساعدتك في:\n• الإحصائيات\n• الأقسام\n• المشاكل'
        : '📚 يمكنني مساعدتك في:\n• تسجيل المقررات\n• عرض الجدول\n• المعدل والساعات'
      }\n\n💡 جرب سؤالاً آخر!`
    : `🤔 Sorry, I didn't fully understand your question.\n\n${userInfo?.role === 'supervisor' 
        ? '📋 I can help you with:\n• Student requests\n• Reports\n• Department management'
        : userInfo?.role === 'admin'
        ? '🏢 I can help you with:\n• Statistics\n• Departments\n• Issues'
        : '📚 I can help you with:\n• Course registration\n• View schedule\n• GPA and hours'
      }\n\n💡 Try another question!`;
}
