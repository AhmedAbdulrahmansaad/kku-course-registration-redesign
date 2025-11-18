import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Award,
  Target,
  BookMarked,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { KKULogoSVG } from '../KKULogoSVG';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { fetchJSON, getErrorMessage } from '../../utils/fetchWithTimeout';

interface Course {
  course_id: string;
  code: string;
  name_ar: string;
  name_en: string;
  credit_hours: number;
  level: number;
  department: string;
  description_ar?: string;
  description_en?: string;
  prerequisites?: string[];
  semester?: string;
  instructor?: string;
}

interface CurriculumData {
  department: string;
  curriculum: Record<number, Course[]>;
  levelSummary: Array<{
    level: number;
    courses: number;
    credits: number;
  }>;
  totalCourses: number;
  totalCreditHours: number;
}

export const CurriculumPage: React.FC = () => {
  const { language } = useApp();
  const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1])); // Level 1 open by default
  const [initializingCourses, setInitializingCourses] = useState(false);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      console.log('🔍 [Curriculum] Fetching curriculum from backend...');
      
      const result = await fetchJSON(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/curriculum?department=MIS`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      console.log('📚 [Curriculum] Response:', result);

      if (result.success) {
        // Map coursesByLevel to curriculum for compatibility
        const mappedData = {
          department: result.department?.code || 'MIS',
          curriculum: result.coursesByLevel || {},
          levelSummary: result.levelSummary || [],
          totalCourses: result.totalCourses || 0,
          totalCreditHours: result.totalCreditHours || 0,
        };
        setCurriculumData(mappedData);
        console.log('✅ [Curriculum] Loaded successfully:', mappedData.totalCourses, 'courses');
      } else {
        console.warn('⚠️ [Curriculum] No curriculum data returned');
        setCurriculumData(null);
        if (result.error) {
          throw new Error(result.error);
        }
      }
    } catch (error: any) {
      console.error('❌ [Curriculum] Error fetching curriculum:', error);
      const errorMessage = getErrorMessage(
        error,
        { ar: 'فشل في تحميل المنهج الدراسي', en: 'Failed to load curriculum' },
        language
      );
      toast.error(errorMessage);
      setCurriculumData(null);
    } finally {
      setLoading(false);
    }
  };

  const initializeCourses = async () => {
    try {
      setInitializingCourses(true);
      console.log('📥 [Curriculum] Initializing courses...');
      
      const result = await fetchJSON(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/init-courses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          timeout: 30000, // 30 seconds for initialization
        }
      );

      console.log('📚 [Curriculum] Init courses response:', result);

      if (result.success || result.created) {
        toast.success(
          language === 'ar'
            ? `✅ تم تحميل ${result.created || result.totalCourses || 0} مقرر بنجاح`
            : `✅ Successfully loaded ${result.created || result.totalCourses || 0} courses`
        );
        console.log('✅ [Curriculum] Courses initialized:', result);
        // Reload curriculum
        await fetchCurriculum();
      } else {
        console.error('❌ [Curriculum] Error response:', result);
        throw new Error(result.error || 'Failed to initialize courses');
      }
    } catch (error: any) {
      console.error('❌ [Curriculum] Error initializing courses:', error);
      const errorMessage = getErrorMessage(
        error,
        { ar: 'فشل في تحميل المقررات', en: 'Failed to initialize courses' },
        language
      );
      toast.error(errorMessage);
    } finally {
      setInitializingCourses(false);
    }
  };

  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  const getLevelName = (level: number): string => {
    if (language === 'ar') {
      return `المستوى ${level}`;
    }
    return `Level ${level}`;
  };

  const getLevelColor = (level: number): string => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-red-500 to-red-600',
      'from-orange-500 to-orange-600',
      'from-yellow-500 to-yellow-600',
      'from-green-500 to-green-600',
      'from-emerald-500 to-emerald-600',
    ];
    return colors[(level - 1) % colors.length];
  };

  if (loading) {
    return (
      <Card className="p-16 text-center">
        <div className="spinner h-12 w-12 mx-auto mb-4" />
        <p className="text-muted-foreground">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </Card>
    );
  }

  // If no curriculum data, show initialization button
  if (!curriculumData || curriculumData.totalCourses === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
              <BookOpen className="h-16 w-16 text-gray-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {language === 'ar' ? 'المقررات غير محملة' : 'Courses Not Loaded'}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {language === 'ar'
              ? 'يبدو أن قاعدة البيانات فارغة. انقر على الزر أدناه لتحميل جميع مقررات تخصص نظم المعلومات الإدارية.'
              : 'It seems the database is empty. Click the button below to load all MIS courses.'}
          </p>
          <Button
            size="lg"
            onClick={initializeCourses}
            disabled={initializingCourses}
            className="bg-[#184A2C] hover:bg-[#0e2818]"
          >
            {initializingCourses ? (
              <>
                <div className="spinner h-4 w-4 mr-2" />
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تحميل المقررات' : 'Load Courses'}
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-64 md:h-72 bg-gradient-to-br from-[#184A2C] via-emerald-700 to-emerald-900 dark:from-[#0e2818] dark:via-emerald-900 dark:to-black"></div>
        <div className="absolute inset-0 h-64 md:h-72 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6 text-center md:text-left">
            <div className="bg-white p-2 md:p-3 rounded-2xl shadow-xl">
              <KKULogoSVG size={50} className="md:w-[60px] md:h-[60px]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold drop-shadow-2xl">
                {language === 'ar' ? 'المنهج الدراسي' : 'Study Curriculum'}
              </h1>
              <p className="text-lg md:text-xl opacity-90 mt-1">
                {language === 'ar'
                  ? 'تخصص نظم المعلومات الإدارية'
                  : 'Management Information Systems'}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'المقررات' : 'Courses'}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{curriculumData?.totalCourses || 0}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'الساعات' : 'Hours'}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{curriculumData?.totalCreditHours || 0}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'المستويات' : 'Levels'}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">8</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 md:h-5 md:w-5 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'التخصص' : 'Major'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">MIS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Summary */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-[#184A2C]" />
          {language === 'ar' ? 'ملخص المستويات' : 'Levels Summary'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {curriculumData.levelSummary
            .sort((a, b) => a.level - b.level)
            .map((summary) => (
              <div
                key={summary.level}
                className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => toggleLevel(summary.level)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{getLevelName(summary.level)}</span>
                  <Badge variant="secondary">{summary.courses}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {summary.credits}{' '}
                  {language === 'ar' ? 'ساعة' : summary.credits === 1 ? 'hour' : 'hours'}
                </p>
              </div>
            ))}
        </div>
      </Card>

      {/* Curriculum by Level */}
      <div className="space-y-4">
        {Object.keys(curriculumData.curriculum)
          .map(Number)
          .sort((a, b) => a - b)
          .map((level) => {
            const courses = curriculumData.curriculum[level];
            const isExpanded = expandedLevels.has(level);
            const levelSummary = curriculumData.levelSummary.find((s) => s.level === level);

            return (
              <Card key={level} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleLevel(level)}>
                  <CollapsibleTrigger asChild>
                    <div
                      className={`p-6 cursor-pointer bg-gradient-to-r ${getLevelColor(
                        level
                      )} text-white hover:opacity-90 transition-opacity`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 p-3 rounded-xl">
                            <GraduationCap className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">{getLevelName(level)}</h3>
                            <p className="text-white/90">
                              {levelSummary?.courses}{' '}
                              {language === 'ar'
                                ? 'مقرر'
                                : levelSummary?.courses === 1
                                ? 'course'
                                : 'courses'}{' '}
                              • {levelSummary?.credits}{' '}
                              {language === 'ar' ? 'ساعة' : 'hours'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-6 w-6" />
                          ) : (
                            <ChevronDown className="h-6 w-6" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-6 space-y-4">
                      {courses.map((course, index) => (
                        <div
                          key={course.course_id}
                          className="p-4 bg-muted/30 rounded-lg border-l-4 border-l-[#184A2C] hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="bg-[#184A2C] text-white p-3 rounded-lg flex-shrink-0">
                                <BookMarked className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge variant="secondary" className="text-sm">
                                    {course.code}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {course.credit_hours}{' '}
                                    {language === 'ar' ? 'ساعات' : 'hours'}
                                  </Badge>
                                </div>
                                <h4 className="font-bold text-lg mb-1">
                                  {language === 'ar' ? course.name_ar : course.name_en}
                                </h4>
                                {(course.description_ar || course.description_en) && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {language === 'ar'
                                      ? course.description_ar
                                      : course.description_en}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  {course.instructor && (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4" />
                                      {course.instructor}
                                    </span>
                                  )}
                                  {course.semester && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {course.semester}
                                    </span>
                                  )}
                                  {course.prerequisites && course.prerequisites.length > 0 && (
                                    <span className="flex items-center gap-1 text-orange-600">
                                      <AlertCircle className="h-4 w-4" />
                                      {language === 'ar'
                                        ? `متطلب سابق: ${course.prerequisites.join(', ')}`
                                        : `Prerequisites: ${course.prerequisites.join(', ')}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-3xl font-bold text-[#184A2C]">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
      </div>

      {/* Footer Info */}
      <Card className="p-6 bg-gradient-to-br from-[#184A2C] to-emerald-800 text-white">
        <div className="flex items-center gap-4">
          <Award className="h-12 w-12 text-kku-gold flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold mb-2">
              {language === 'ar' ? 'معلومات البرنامج' : 'Program Information'}
            </h3>
            <p className="opacity-90">
              {language === 'ar'
                ? `برنامج بكالوريوس نظم المعلومات الإدارية يتكون من ${curriculumData.totalCourses} مقرراً دراسياً بإجمالي ${curriculumData.totalCreditHours} ساعة معتمدة موزعة على ${Object.keys(curriculumData.curriculum).length} مستويات دراسية.`
                : `The Bachelor's program in Management Information Systems consists of ${curriculumData.totalCourses} courses totaling ${curriculumData.totalCreditHours} credit hours distributed across ${Object.keys(curriculumData.curriculum).length} academic levels.`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};