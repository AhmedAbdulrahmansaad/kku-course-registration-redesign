import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { createClient } from '../../utils/supabase/client';
import { News } from '../../types';
import { Calendar, Newspaper, Filter, Tag, TrendingUp, Bell, AlertCircle, Rocket } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const defaultNews: News[] = [
  {
    news_id: '1',
    title: 'Registration Period Opens',
    title_ar: 'افتتاح فترة التسجيل',
    content: 'The registration period for the Spring 2025 semester is now open. Students can register for courses starting today.',
    content_ar: 'فترة التسجيل للفصل الدراسي ربيع 2025 مفتوحة الآن. يمكن للطلاب التسجيل في المقررات ابتداءً من اليوم.',
    created_at: new Date().toISOString(),
    category: 'Registration',
  },
  {
    news_id: '2',
    title: 'New System Features',
    title_ar: 'ميزات جديدة في النظام',
    content: 'We have added new features to improve your experience including AI assistant and dark mode support.',
    content_ar: 'أضفنا ميزات جديدة لتحسين تجربتك بما في ذلك المساعد الذكي ودعم الوضع الليلي.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    category: 'System Update',
  },
  {
    news_id: '3',
    title: 'Academic Advising Available',
    title_ar: 'الإرشاد الأكاديمي متاح',
    content: 'Academic advisors are available for consultation. Please contact your advisor to discuss your course selection.',
    content_ar: 'المشرفون الأكاديميون متاحون للاستشارة. يرجى الاتصال بمشرفك لمناقشة اختيارك للمقررات.',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    category: 'Advisory Notice',
  },
  {
    news_id: '4',
    title: 'System Maintenance Notice',
    title_ar: 'إشعار صيانة النظام',
    content: 'The system will undergo scheduled maintenance on Friday from 2 AM to 4 AM. Please plan accordingly.',
    content_ar: 'سيخضع النظام لصيانة مجدولة يوم الجمعة من الساعة 2 صباحاً حتى 4 صباحاً. يرجى التخطيط وفقاً لذلك.',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    category: 'System Update',
  },
  {
    news_id: '5',
    title: 'Drop/Add Period Extended',
    title_ar: 'تمديد فترة الحذف والإضافة',
    content: 'The drop/add period has been extended by one week. Students now have until next Friday to make changes.',
    content_ar: 'تم تمديد فترة الحذف والإضافة لمدة أسبوع إضافي. لدى الطلاب الآن حتى الجمعة القادمة لإجراء التغييرات.',
    created_at: new Date(Date.now() - 345600000).toISOString(),
    category: 'Registration',
  },
];

// Helper function to format date
const formatDate = (dateString: string, language: 'ar' | 'en' = 'ar'): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (language === 'ar') {
    if (diffDays === 0) {
      return 'اليوم';
    } else if (diffDays === 1) {
      return 'أمس';
    } else if (diffDays < 7) {
      return `منذ ${diffDays} أيام`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
    } else {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } else {
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }
};

// Category colors and icons
const categoryConfig = {
  'Registration': {
    color: 'bg-emerald-500',
    icon: Rocket,
    labelAr: 'التسجيل',
    labelEn: 'Registration',
  },
  'System Update': {
    color: 'bg-blue-500',
    icon: TrendingUp,
    labelAr: 'تحديث النظام',
    labelEn: 'System Update',
  },
  'Advisory Notice': {
    color: 'bg-amber-500',
    icon: Bell,
    labelAr: 'إشعار إرشادي',
    labelEn: 'Advisory Notice',
  },
};

export const NewsPage: React.FC = () => {
  const { language, t } = useApp();
  const [news, setNews] = useState<News[]>(defaultNews);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState(3);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setNews(data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Filter news by category
  const filteredNews = categoryFilter === 'all' 
    ? news 
    : news.filter(item => item.category === categoryFilter);

  // Display limited news
  const displayedNews = filteredNews.slice(0, displayCount);
  const hasMore = displayedNews.length < filteredNews.length;

  return (
    <div className="space-y-8 pb-8">
      {/* Enhanced Hero Header with Gradient Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-12">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1752223869508-c0e344a6859d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXdzcGFwZXIlMjBtZWRpYSUyMG5ld3N8ZW58MXx8fHwxNzYyOTc4MzE2fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="News"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/98 via-orange-600/95 to-red-600/90"></div>
        </div>

        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full animate-pulse-soft border-4 border-white/30 shadow-2xl">
              <Newspaper className="h-16 w-16" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-2xl">
            {language === 'ar' ? 'الأخبار والإعلانات' : 'News and Announcements'}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-95 max-w-3xl mx-auto drop-shadow-lg">
            {language === 'ar'
              ? 'آخر الأخبار والتحديثات حول النظام وفترات التسجيل'
              : 'Latest news and updates about the system and registration periods'}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                <span className="font-bold">{news.length}</span>
                <span>{language === 'ar' ? 'خبر' : 'News'}</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <span className="font-bold">3</span>
                <span>{language === 'ar' ? 'تصنيفات' : 'Categories'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <Card className="p-6 animate-fade-in shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-[#184A2C] dark:text-primary" />
            <h3 className="text-lg font-bold">
              {language === 'ar' ? 'تصنيف الأخبار' : 'News Categories'}
            </h3>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[280px] h-12 border-2">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue placeholder={language === 'ar' ? 'جميع التصنيفات' : 'All Categories'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'ar' ? '📰 جميع التصني��ات' : '📰 All Categories'}
              </SelectItem>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span>{language === 'ar' ? config.labelAr : config.labelEn}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Newspaper className="h-4 w-4" />
            <span className="font-medium">
              {language === 'ar' 
                ? `عرض ${displayedNews.length} من ${filteredNews.length} خبر`
                : `Showing ${displayedNews.length} of ${filteredNews.length} news`
              }
            </span>
          </div>
          {categoryFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoryFilter('all')}
              className="text-[#184A2C] dark:text-primary hover:bg-[#184A2C]/10"
            >
              {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
          )}
        </div>
      </Card>

      {/* News Items - Enhanced */}
      <div className="space-y-6">
        {displayedNews.map((item, index) => {
          const category = item.category || 'System Update';
          const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig['System Update'];
          const Icon = config.icon;

          return (
            <Card
              key={item.news_id}
              className="p-6 md:p-8 hover-lift glass-effect animate-scale-in overflow-hidden relative group border-2 border-gray-200 dark:border-gray-700 hover:border-[#184A2C] dark:hover:border-primary transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#184A2C]/5 dark:bg-primary/5 rounded-full blur-2xl" />
              
              <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg animate-float`} style={{ animationDelay: `${index * 0.3}s` }}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Category Badge */}
                  <Badge className={`${config.color} text-white border-0 mb-3`}>
                    {language === 'ar' ? config.labelAr : config.labelEn}
                  </Badge>

                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 gradient-text">
                    {language === 'ar' ? item.title_ar : item.title}
                  </h3>

                  {/* Date */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#184A2C]/10 dark:bg-primary/10 rounded-full">
                      <Calendar className="h-4 w-4 text-[#D4AF37]" />
                      <span className="font-medium">{formatDate(item.created_at, language)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                    {language === 'ar' ? item.content_ar : item.content}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* View More Button */}
      {hasMore && (
        <div className="flex justify-center animate-fade-in">
          <Button
            onClick={() => setDisplayCount(prev => prev + 3)}
            className="bg-gradient-to-r from-[#184A2C] to-emerald-700 hover:from-[#184A2C]/90 hover:to-emerald-700/90 text-white shadow-xl hover:shadow-2xl h-14 px-8 text-lg font-bold"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            {language === 'ar' ? '📰 عرض المزيد من الأخبار' : '📰 View More News'}
          </Button>
        </div>
      )}

      {/* Archive Button */}
      {!hasMore && filteredNews.length > 3 && (
        <Card className="p-6 text-center animate-scale-in bg-gradient-to-br from-[#184A2C]/5 to-[#D4AF37]/5">
          <Newspaper className="h-12 w-12 text-[#184A2C] dark:text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 gradient-text">
            {language === 'ar' ? '✅ لقد شاهدت جميع الأخبار' : '✅ You\'ve viewed all news'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'ar' 
              ? 'تحقق لاحقاً من التحديثات الجديدة' 
              : 'Check back later for new updates'}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setDisplayCount(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="border-2 border-[#184A2C] text-[#184A2C] hover:bg-[#184A2C]/10"
          >
            {language === 'ar' ? '⬆️ العودة للأعلى' : '⬆️ Back to Top'}
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {filteredNews.length === 0 && (
        <Card className="p-16 text-center animate-scale-in">
          <div className="max-w-md mx-auto">
            <div className="mb-6 flex justify-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full">
                <AlertCircle className="h-20 w-20 text-gray-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 gradient-text">
              {language === 'ar' ? 'لا توجد أخبار في هذا التصنيف' : 'No news in this category'}
            </h3>
            <p className="text-muted-foreground text-lg mb-6">
              {language === 'ar'
                ? 'جرب تصنيفاً آخر أو عرض جميع الأخبار'
                : 'Try another category or view all news'}
            </p>
            <Button
              onClick={() => setCategoryFilter('all')}
              className="bg-gradient-to-r from-[#184A2C] to-emerald-700 text-white hover:from-[#184A2C]/90 hover:to-emerald-700/90"
            >
              {language === 'ar' ? 'عرض جميع الأخبار' : 'View All News'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};