import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  BookOpen, 
  Clock, 
  Users, 
  MapPin, 
  Calendar,
  Search,
  Filter,
  Check,
  X,
  Plus,
  Trash2,
  AlertCircle,
  GraduationCap,
  TrendingUp,
  Award,
  Star,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
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

export const CoursesPage: React.FC = () => {
  const { 
    language, 
    t, 
    userInfo,
    setCurrentPage
  } = useApp();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [userInfo]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('📚 [Courses] Fetching courses from SQL Database for user:', userInfo);

      // التحقق من تسجيل الدخول
      if (!userInfo || !userInfo.id) {
        console.error('🚫 Access denied: User not logged in');
        toast.error(
          language === 'ar'
            ? 'يرجى تسجيل الدخول أولاً'
            : 'Please login first'
        );
        setCurrentPage('login');
        setLoading(false);
        return;
      }

      // جلب المقررات المتاحة من SQL Database باستخدام fetchJSON مع timeout
      const result = await fetchJSON(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/courses/available?studentId=${userInfo.id}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      console.log('📚 [Courses] SQL Database response:', result);

      if (result.success && result.courses) {
        // تحويل البيانات من SQL format إلى format المكون
        const coursesData = result.courses.map((offer: any) => ({
          id: offer.courses.id,
          course_id: offer.courses.id,  // ✅ UUID (not course_id text!)
          code: offer.courses.code,
          name_ar: offer.courses.name_ar,
          name_en: offer.courses.name_en,
          nameAr: offer.courses.name_ar,
          nameEn: offer.courses.name_en,
          description_ar: offer.courses.description_ar,
          description_en: offer.courses.description_en,
          credits: offer.courses.credits,
          credit_hours: offer.courses.credits,
          level: offer.courses.level,
          category: offer.courses.category,
          prerequisites: offer.courses.prerequisites || [],
          // معلومات العرض
          offer_id: offer.id,
          semester: offer.semester,
          year: offer.year,
          section: offer.section,
          max_students: offer.max_students,
          enrolled_students: offer.enrolled_students,
          instructor: 'هيئة التدريس', // يمكن إضافة instructor_id لاحقاً
        }));
        
        console.log('✅ [Courses] Loaded', coursesData.length, 'courses from SQL');
        setCourses(coursesData);
      } else {
        console.warn('⚠️ [Courses] No courses returned from server');
        setCourses([]);
        if (result.error) {
          throw new Error(result.error);
        }
      }
    } catch (error: any) {
      console.error('❌ [Courses] Error fetching courses:', error);
      const errorMessage = getErrorMessage(
        error,
        { ar: 'فشل في تحميل المقررات', en: 'Failed to load courses' },
        language
      );
      toast.error(errorMessage);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (course: Course) => {
    if (!userInfo) {
      toast.error(
        language === 'ar'
          ? 'يرجى تسجيل الدخول أولاً'
          : 'Please login first'
      );
      return;
    }

    try {
      setRegistering(course.course_id);
      console.log('📝 Registering for course:', course.course_id);

      // الحصول على access_token من localStorage
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        toast.error(
          language === 'ar'
            ? 'يرجى تسجيل الدخول مرة أخرى'
            : 'Please login again'
        );
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/register-course`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            courseId: course.course_id,
          }),
        }
      );

      const result = await response.json();
      console.log('📝 Registration response:', result);

      if (response.ok) {
        toast.success(
          language === 'ar'
            ? `✅ تم إرسال طلب تسجيل ${course.name_ar} للمشرف الأكاديمي`
            : `✅ Registration request for ${course.name_en} sent to academic supervisor`,
          {
            duration: 5000,
            description: language === 'ar'
              ? 'سيتم إشعارك عند الموافقة على طلبك'
              : 'You will be notified when your request is approved'
          }
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error registering for course:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في التسجيل' : 'Registration failed')
      );
    } finally {
      setRegistering(null);
    }
  };

  const filteredCourses = courses.filter(course => {
    // تجاهل القيم الفارغة أو null
    if (!course || !course.code) return false;
    
    const matchesSearch = 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name_ar.includes(searchTerm);
    
    const matchesLevel = levelFilter === 'all' || course.level.toString() === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <Card className="p-16 text-center">
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#184A2C]" />
        <p className="text-muted-foreground">
          {language === 'ar' ? 'جاري تحميل المقررات...' : 'Loading courses...'}
        </p>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
            <BookOpen className="h-16 w-16 text-gray-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">
          {language === 'ar' ? 'لا توجد مقررات متاحة' : 'No Courses Available'}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {language === 'ar'
            ? 'لم يتم العثور على مقررات لمستواك الحالي. يرجى التواصل مع المشرف الأكاديمي.'
            : 'No courses found for your current level. Please contact your academic supervisor.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* زر الرجوع الواضح */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setCurrentPage('studentDashboard')}
          variant="outline"
          size="lg"
          className="group border-2 border-kku-green hover:bg-kku-green hover:text-white transition-all duration-300"
        >
          <ArrowLeft className={`h-5 w-5 group-hover:-translate-x-1 transition-transform ${language === 'ar' ? 'rotate-180' : ''}`} />
          <span className="mr-2">{language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
        </Button>
      </div>

      {/* Header */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-48 md:h-56 bg-gradient-to-br from-[#184A2C] via-emerald-700 to-emerald-900 dark:from-[#0e2818] dark:via-emerald-900 dark:to-black"></div>
        <div className="absolute inset-0 h-48 md:h-56 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <BookOpen className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
                {language === 'ar' ? 'المقررات المتاحة' : 'Available Courses'}
              </h1>
              <p className="text-white/90 text-base md:text-lg">
                {language === 'ar'
                  ? `المستوى ${userInfo?.level ?? 1} - ${courses.length} مقرر`
                  : `Level ${userInfo?.level ?? 1} - ${courses.length} courses`}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'المقررات' : 'Courses'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{courses.length}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'الساعات' : 'Hours'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">
                {courses.filter(c => c != null).reduce((sum, c) => sum + (c.credit_hours || 0), 0)}
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'المستوى' : 'Level'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{userInfo?.level || 1}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-kku-gold" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'التخصص' : 'Major'}
                </span>
              </div>
              <p className="text-xl font-bold">MIS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={language === 'ar' ? 'ابحث في المقررات...' : 'Search courses...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={language === 'ar' ? 'المستوى' : 'Level'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع المستويات' : 'All Levels'}</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
                <SelectItem key={level} value={level.toString()}>
                  {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="grid gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.course_id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 w-full">
                <div className="bg-gradient-to-br from-[#184A2C] to-emerald-700 p-3 sm:p-4 rounded-xl text-white flex-shrink-0">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs sm:text-sm font-mono">
                      {course.code}
                    </Badge>
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {course.credit_hours} {language === 'ar' ? 'ساعات' : 'hours'}
                    </Badge>
                    <Badge className="bg-[#184A2C] text-xs sm:text-sm">
                      {language === 'ar' ? `المستوى ${course.level}` : `Level ${course.level}`}
                    </Badge>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    {language === 'ar' ? course.name_ar : course.name_en}
                  </h3>

                  {(course.description_ar || course.description_en) && (
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      {language === 'ar' ? course.description_ar : course.description_en}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {course.instructor && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{course.instructor}</span>
                      </div>
                    )}
                    {course.semester && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{course.semester}</span>
                      </div>
                    )}
                    {course.prerequisites && course.prerequisites.length > 0 && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>
                          {language === 'ar'
                            ? `متطلب سابق: ${course.prerequisites.join(', ')}`
                            : `Prerequisites: ${course.prerequisites.join(', ')}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full lg:w-auto">
                <Button
                  onClick={() => handleRegister(course)}
                  disabled={registering === course.course_id}
                  className="bg-gradient-to-r from-[#184A2C] to-emerald-700 hover:from-[#0e2818] hover:to-emerald-800 w-full lg:w-auto text-sm sm:text-base"
                >
                  {registering === course.course_id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري التسجيل...' : 'Registering...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'سجل الآن' : 'Register'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'لم يتم العثور على مقررات تطابق البحث'
              : 'No courses found matching your search'}
          </p>
        </Card>
      )}
    </div>
  );
};