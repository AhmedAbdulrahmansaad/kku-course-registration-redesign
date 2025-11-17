import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search as SearchIcon, FileText, Newspaper, BookOpen, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface SearchResult {
  id: string;
  type: 'course' | 'news' | 'page';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  link?: string;
}

// الصفحات الثابتة التي يمكن البحث فيها
const staticPages: SearchResult[] = [
  {
    id: 'about',
    type: 'page',
    title: 'About the Project',
    titleAr: 'عن المشروع',
    description: 'Learn about the redesign project and methodology',
    descriptionAr: 'تعرف على مشروع إعادة التصميم والمنهجية',
    link: 'project',
  },
  {
    id: 'curriculum',
    type: 'page',
    title: 'Curriculum',
    titleAr: 'الخطة الدراسية',
    description: 'View the complete curriculum for Management Information Systems',
    descriptionAr: 'عرض الخطة الدراسية الكاملة لنظم المعلومات الإدارية',
    link: 'curriculum',
  },
  {
    id: 'schedule',
    type: 'page',
    title: 'Course Schedule',
    titleAr: 'الجدول الدراسي',
    description: 'View your course schedule for the current semester',
    descriptionAr: 'عرض جدولك الدراسي للفصل الحالي',
    link: 'schedule',
  },
  {
    id: 'reports',
    type: 'page',
    title: 'Academic Reports',
    titleAr: 'التقارير الأكاديمية',
    description: 'View and download your academic reports',
    descriptionAr: 'عرض وتنزيل تقاريرك الأكاديمية',
    link: 'reports',
  },
  {
    id: 'assistant',
    type: 'page',
    title: 'AI Assistant',
    titleAr: 'المساعد الذكي',
    description: 'Get help from our AI assistant',
    descriptionAr: 'احصل على المساعدة من المساعد الذكي',
    link: 'assistant',
  },
  {
    id: 'privacy',
    type: 'page',
    title: 'Privacy Policy',
    titleAr: 'سياسة الخصوصية',
    description: 'Read our privacy policy',
    descriptionAr: 'اقرأ سياسة الخصوصية',
    link: 'privacy',
  },
  {
    id: 'accessibility',
    type: 'page',
    title: 'Accessibility',
    titleAr: 'إمكانية الوصول',
    description: 'Learn about accessibility features',
    descriptionAr: 'تعرف على ميزات إمكانية الوصول',
    link: 'accessibility',
  },
  {
    id: 'contact',
    type: 'page',
    title: 'Contact Us',
    titleAr: 'اتصل بنا',
    description: 'Get in touch with us',
    descriptionAr: 'تواصل معنا',
    link: 'contact',
  },
];

export const SearchPage: React.FC = () => {
  const { language, t, setCurrentPage } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/courses?department=MIS`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        return;
      }

      const result = await response.json();
      if (result.courses) {
        setCourses(result.courses || []);
      } else {
        console.error('❌ No courses in response:', result);
      }
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const searchTerm = query.toLowerCase().trim();

    try {
      // البحث في المقررات
      const courseResults: SearchResult[] = courses
        .filter((course) => {
          return (
            course.code?.toLowerCase().includes(searchTerm) ||
            course.name_ar?.includes(query) ||
            course.name_en?.toLowerCase().includes(searchTerm) ||
            course.description_ar?.includes(query) ||
            course.description_en?.toLowerCase().includes(searchTerm)
          );
        })
        .map((course) => ({
          id: course.course_id,
          type: 'course' as const,
          title: course.name_en || 'Course',
          titleAr: course.name_ar || 'مقرر',
          description: course.description_en || `${course.code} - Level ${course.level}`,
          descriptionAr: course.description_ar || `${course.code} - المستوى ${course.level}`,
          link: 'courses',
        }));

      // البحث في الصفحات الثابتة
      const pageResults: SearchResult[] = staticPages.filter((page) => {
        return (
          page.title.toLowerCase().includes(searchTerm) ||
          page.titleAr.includes(query) ||
          page.description.toLowerCase().includes(searchTerm) ||
          page.descriptionAr.includes(query)
        );
      });

      // دمج النتائج
      const allResults = [...courseResults, ...pageResults];

      setResults(allResults);
      setSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course':
        return BookOpen;
      case 'news':
        return Newspaper;
      case 'page':
        return FileText;
      default:
        return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      course: { ar: 'مقرر', en: 'Course' },
      news: { ar: 'خبر', en: 'News' },
      page: { ar: 'صفحة', en: 'Page' },
    };
    return language === 'ar' ? labels[type as keyof typeof labels].ar : labels[type as keyof typeof labels].en;
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.link) {
      setCurrentPage(result.link);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SearchIcon className="h-10 w-10 text-kku-green dark:text-primary" />
          <h1 className="text-4xl font-bold gradient-text">
            {t('search')}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          {language === 'ar'
            ? 'ابحث عن المقررات والأخبار والمحتوى'
            : 'Search for courses, news, and content'}
        </p>
      </div>

      {/* Search Input */}
      <Card className="p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={
              language === 'ar'
                ? 'ابحث عن مقرر، خبر، أو صفحة...'
                : 'Search for a course, news, or page...'
            }
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={handleSearch}
            className="bg-kku-green hover:bg-kku-green/90 dark:bg-primary min-w-[120px]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
              </>
            ) : (
              <>
                <SearchIcon className="h-4 w-4 me-2" />
                {t('search')}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-kku-green dark:text-primary">
              {language === 'ar' ? 'نتائج البحث' : 'Search Results'}
            </h2>
            <span className="text-muted-foreground">
              {results.length}{' '}
              {language === 'ar'
                ? results.length === 1
                  ? 'نتيجة'
                  : 'نتائج'
                : results.length === 1
                ? 'result'
                : 'results'}
            </span>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => {
                const Icon = getIcon(result.type);
                return (
                  <Card
                    key={result.id}
                    className="p-6 hover:shadow-lg hover:border-kku-green/30 transition-all cursor-pointer animate-scale-in hover-lift"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-kku-green/10 to-kku-gold/10 dark:bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-kku-green dark:text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-kku-gold/20 to-kku-gold/30 text-kku-gold font-medium">
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-kku-green dark:text-primary">
                          {language === 'ar' ? result.titleAr : result.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-2">
                          {language === 'ar' ? result.descriptionAr : result.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar' ? 'لا توجد نتائج' : 'No Results Found'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? 'لم نعثر على أي نتائج مطابقة لبحثك. حاول استخدام كلمات مفتاحية أخرى.'
                  : 'We couldn\'t find any results matching your search. Try using different keywords.'}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Suggestions */}
      {!searched && (
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-bold mb-6 text-kku-green dark:text-primary">
            {language === 'ar' ? 'اقتراحات البحث' : 'Search Suggestions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { ar: 'نظم المعلومات', en: 'Information Systems' },
              { ar: 'التسجيل', en: 'Registration' },
              { ar: 'المقررات', en: 'Courses' },
              { ar: 'الجدول الدراسي', en: 'Schedule' },
              { ar: 'المشرف الأكاديمي', en: 'Academic Advisor' },
              { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
              { ar: 'قواعد البيانات', en: 'Database' },
              { ar: 'البرمجة', en: 'Programming' },
              { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
            ].map((suggestion, index) => (
              <Card
                key={index}
                className="p-4 hover:shadow-lg hover:border-kku-green/30 transition-all cursor-pointer hover-lift animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  setQuery(language === 'ar' ? suggestion.ar : suggestion.en);
                  setTimeout(() => handleSearch(), 100);
                }}
              >
                <div className="flex items-center gap-3">
                  <SearchIcon className="h-4 w-4 text-kku-gold" />
                  <span className="font-medium">{language === 'ar' ? suggestion.ar : suggestion.en}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};