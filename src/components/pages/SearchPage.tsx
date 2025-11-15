import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search as SearchIcon, FileText, Newspaper, BookOpen } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface SearchResult {
  id: string;
  type: 'course' | 'news' | 'page';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'course',
    title: 'Management Information Systems',
    titleAr: 'نظم المعلومات الإدارية',
    description: 'Introduction to MIS concepts and applications',
    descriptionAr: 'مقدمة في مفاهيم وتطبيقات نظم المعلومات الإدارية',
  },
  {
    id: '2',
    type: 'course',
    title: 'Database Systems',
    titleAr: 'نظم قواعد البيانات',
    description: 'Design and implementation of database systems',
    descriptionAr: 'تصميم وتنفيذ أنظمة قواعد البيانات',
  },
  {
    id: '3',
    type: 'news',
    title: 'Registration Period Opens',
    titleAr: 'افتتاح فترة التسجيل',
    description: 'The registration period for Spring 2025 is now open',
    descriptionAr: 'فترة التسجيل للفصل الدراسي ربيع 2025 مفتوحة الآن',
  },
  {
    id: '4',
    type: 'page',
    title: 'How to Redesign',
    titleAr: 'منهجية التصميم',
    description: 'Learn about our redesign methodology and process',
    descriptionAr: 'تعرف على منهجية وعملية إعادة التصميم',
  },
];

export const SearchPage: React.FC = () => {
  const { language, t } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const filtered = mockResults.filter((item) => {
      const searchTerm = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchTerm) ||
        item.titleAr.includes(query) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.descriptionAr.includes(query)
      );
    });

    setResults(filtered);
    setSearched(true);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <SearchIcon className="h-10 w-10 text-kku-green dark:text-primary" />
          <h1 className="text-4xl font-bold text-kku-green dark:text-primary">
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
      <Card className="p-6">
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
          />
          <Button
            onClick={handleSearch}
            className="bg-kku-green hover:bg-kku-green/90 dark:bg-primary"
          >
            <SearchIcon className="h-4 w-4 me-2" />
            {t('search')}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
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
                    className="p-6 hover:shadow-lg transition-all cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-kku-green/10 dark:bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-kku-green dark:text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-kku-gold/20 text-kku-gold">
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          {language === 'ar' ? result.titleAr : result.title}
                        </h3>
                        <p className="text-muted-foreground">
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
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {language === 'ar' ? 'لا توجد نتائج' : 'No Results Found'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? 'لم نعثر على أي نتائج مطابقة لبحثك'
                  : 'We couldn\'t find any results matching your search'}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Suggestions */}
      {!searched && (
        <section>
          <h2 className="text-2xl font-bold mb-6">
            {language === 'ar' ? 'اقتراحات البحث' : 'Search Suggestions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { ar: 'نظم المعلومات', en: 'Information Systems' },
              { ar: 'التسجيل', en: 'Registration' },
              { ar: 'المقررات', en: 'Courses' },
              { ar: 'الجدول الدراسي', en: 'Schedule' },
              { ar: 'المشرف الأكاديمي', en: 'Academic Advisor' },
              { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
            ].map((suggestion, index) => (
              <Card
                key={index}
                className="p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  setQuery(language === 'ar' ? suggestion.ar : suggestion.en);
                }}
              >
                <div className="flex items-center gap-3">
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{language === 'ar' ? suggestion.ar : suggestion.en}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};