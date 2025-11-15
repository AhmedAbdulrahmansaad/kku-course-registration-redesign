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
  Star
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export const CoursesPage: React.FC = () => {
  const { language, t, availableCourses, registeredCourses, setRegisteredCourses } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.nameAr.includes(searchTerm);
    const matchesDepartment = departmentFilter === 'all' || course.department === departmentFilter;
    const matchesLevel = levelFilter === 'all' || course.level.toString() === levelFilter;
    
    return matchesSearch && matchesDepartment && matchesLevel;
  });

  const totalCredits = registeredCourses.reduce((sum, course) => sum + course.credits, 0);

  // Count MIS courses
  const misCourses = filteredCourses.filter(c => c.department === 'MIS');
  const totalMISCourses = availableCourses.filter(c => c.department === 'MIS').length;

  const handleRegister = (course: typeof availableCourses[0]) => {
    if (course.enrolled >= course.capacity) {
      toast.error(
        language === 'ar' 
          ? 'عذراً، هذا المقرر ممتلئ' 
          : 'Sorry, this course is full'
      );
      return;
    }

    if (registeredCourses.find(c => c.id === course.id)) {
      toast.error(
        language === 'ar' 
          ? 'أنت مسجل في هذا المقرر بالفعل' 
          : 'You are already registered in this course'
      );
      return;
    }

    if (totalCredits + course.credits > 18) {
      toast.error(
        language === 'ar' 
          ? 'لا يمكنك تسجيل أكثر من 18 ساعة معتمدة' 
          : 'You cannot register more than 18 credit hours'
      );
      return;
    }

    setRegisteredCourses([...registeredCourses, course]);
    toast.success(
      language === 'ar' 
        ? `تم تسجيل ${course.nameAr} بنجاح` 
        : `Successfully registered ${course.nameEn}`
    );
  };

  const handleUnregister = (courseId: string) => {
    const course = registeredCourses.find(c => c.id === courseId);
    setRegisteredCourses(registeredCourses.filter(c => c.id !== courseId));
    toast.success(
      language === 'ar' 
        ? `تم حذف ${course?.nameAr} من جدولك` 
        : `Removed ${course?.nameEn} from your schedule`
    );
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Enhanced Hero Header with Gradient Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-8">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1542725752-e9f7259b3881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMHN0dWR5JTIwZWR1Y2F0aW9ufGVufDF8fHx8MTc2Mjk3NTU1Nnww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Courses"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#184A2C]/98 via-emerald-700/95 to-[#D4AF37]/90"></div>
        </div>

        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full shadow-2xl animate-bounce-slow border-4 border-white/30">
              <GraduationCap className="w-16 h-16" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl">
            {language === 'ar' ? 'تسجيل المقررات' : 'Course Registration'}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-95 mb-6 max-w-3xl mx-auto drop-shadow-lg">
            {language === 'ar' 
              ? 'اختر المقررات المناسبة لخطتك الدراسية' 
              : 'Choose courses suitable for your study plan'}
          </p>

          {/* Stats Cards */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span className="font-bold">{availableCourses.length}</span>
                <span>{language === 'ar' ? 'مقرر متاح' : 'Available Courses'}</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <span className="font-bold">{totalMISCourses}</span>
                <span>{language === 'ar' ? 'مقرر نظم معلومات' : 'MIS Courses'}</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-bold">8</span>
                <span>{language === 'ar' ? 'مستويات' : 'Levels'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registered Courses Summary - Enhanced */}
      {registeredCourses.length > 0 && (
        <Card className="p-8 bg-gradient-to-br from-[#184A2C]/10 via-emerald-50/50 to-[#D4AF37]/10 dark:from-primary/20 dark:to-secondary/20 border-2 border-[#184A2C]/30 dark:border-primary/30 animate-scale-in shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-[#184A2C] to-[#D4AF37] bg-clip-text text-transparent mb-3 flex items-center gap-3">
                <Star className="h-8 w-8 text-[#D4AF37] fill-[#D4AF37]" />
                {language === 'ar' ? 'المقررات المسجلة' : 'Registered Courses'}
              </h3>
              <div className="flex flex-wrap gap-6 text-base">
                <span className="flex items-center gap-2 bg-white dark:bg-card px-4 py-2 rounded-xl shadow-md">
                  <BookOpen className="h-5 w-5 text-[#D4AF37]" />
                  <span className="font-bold text-[#184A2C] dark:text-primary">{registeredCourses.length}</span>
                  {language === 'ar' ? 'مقرر' : 'courses'}
                </span>
                <span className="flex items-center gap-2 bg-white dark:bg-card px-4 py-2 rounded-xl shadow-md">
                  <Clock className="h-5 w-5 text-[#D4AF37]" />
                  <span className="font-bold text-[#184A2C] dark:text-primary">{totalCredits}</span>
                  {language === 'ar' ? 'ساعة معتمدة' : 'credit hours'}
                </span>
                <span className="flex items-center gap-2 bg-white dark:bg-card px-4 py-2 rounded-xl shadow-md">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold">{Math.round((totalCredits / 18) * 100)}%</span>
                  {language === 'ar' ? 'من الحد الأقصى' : 'of max load'}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setRegisteredCourses([]);
                toast.success(language === 'ar' ? 'تم حذف جميع المقررات' : 'All courses removed');
              }}
              className="border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-600 shadow-lg h-12 px-6"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'حذف الكل' : 'Clear All'}
            </Button>
          </div>

          {/* Registered Courses Grid - Enhanced */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registeredCourses.map((course, index) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-in-right border-l-4 border-[#184A2C] dark:border-primary"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-bold text-[#184A2C] dark:text-primary text-lg">
                      {course.code}
                    </span>
                    <Badge variant="secondary" className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30">
                      {course.credits} {language === 'ar' ? 'س' : 'CH'}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {language === 'ar' ? course.nameAr : course.nameEn}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnregister(course.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Enhanced Search and Filters */}
      <Card className="p-6 animate-fade-in shadow-xl border-2 border-gray-200 dark:border-gray-700" style={{ animationDelay: '0.1s' }}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
            <Input
              placeholder={language === 'ar' ? '🔍 ابحث عن مقرر...' : '🔍 Search for a course...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} h-12 text-base border-2 focus:border-[#184A2C] dark:focus:border-primary`}
            />
          </div>
          
          <div className="flex gap-4 flex-wrap lg:flex-nowrap">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full lg:w-[200px] h-12 border-2">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={language === 'ar' ? 'القسم' : 'Department'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع الأقسام' : 'All Departments'}</SelectItem>
                <SelectItem value="MIS">
                  <span className="font-bold text-[#184A2C]">
                    {language === 'ar' ? '🎯 نظم المعلومات الإدارية (MIS)' : '🎯 MIS'}
                  </span>
                </SelectItem>
                <SelectItem value="CS">{language === 'ar' ? '💻 علوم الحاسب' : '💻 Computer Science'}</SelectItem>
                <SelectItem value="Business">{language === 'ar' ? '💼 إدارة الأعمال' : '💼 Business'}</SelectItem>
                <SelectItem value="Math">{language === 'ar' ? '📊 رياضيات' : '📊 Mathematics'}</SelectItem>
                <SelectItem value="Language">{language === 'ar' ? '🌐 لغات' : '🌐 Languages'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full lg:w-[180px] h-12 border-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                <SelectValue placeholder={language === 'ar' ? 'المستوى' : 'Level'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع المستويات' : 'All Levels'}</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">
              {language === 'ar' 
                ? `عرض ${filteredCourses.length} من ${availableCourses.length} مقرر`
                : `Showing ${filteredCourses.length} of ${availableCourses.length} courses`
              }
            </span>
          </div>
          {(searchTerm || departmentFilter !== 'all' || levelFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setLevelFilter('all');
              }}
              className="text-[#184A2C] dark:text-primary hover:bg-[#184A2C]/10"
            >
              <X className="h-4 w-4 mr-1" />
              {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
          )}
        </div>
      </Card>

      {/* Available Courses Grid - ULTRA ENHANCED */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const isRegistered = registeredCourses.some(c => c.id === course.id);
            const isFull = course.enrolled >= course.capacity;
            const availabilityPercentage = Math.round((course.enrolled / course.capacity) * 100);
            const isMIS = course.department === 'MIS';
            
            return (
              <Card
                key={course.id}
                className={`p-6 hover-lift glass-effect animate-scale-in overflow-hidden relative group transition-all duration-300 ${
                  isMIS ? 'border-2 border-[#184A2C]/40 dark:border-primary/40 shadow-xl' : 'border-2 border-gray-200 dark:border-gray-700'
                } ${isRegistered ? 'ring-2 ring-emerald-500 shadow-2xl' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* MIS Badge */}
                {isMIS && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-[#184A2C] to-emerald-700 text-white border-0 px-3 py-1 shadow-lg">
                      <Award className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'نظم معلومات' : 'MIS'}
                    </Badge>
                  </div>
                )}

                {/* Decorative Background */}
                <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${
                  isMIS ? 'bg-[#184A2C]' : 'bg-blue-500'
                }`} />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#D4AF37] rounded-full blur-3xl opacity-5" />
                
                <div className="relative z-10">
                  {/* Course Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-xl font-mono font-bold ${
                            isMIS ? 'text-[#184A2C] dark:text-primary' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {course.code}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {language === 'ar' ? `مستوى ${course.level}` : `L${course.level}`}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg text-foreground leading-tight line-clamp-2">
                          {language === 'ar' ? course.nameAr : course.nameEn}
                        </p>
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#D4AF37]" />
                        <span className="font-medium">{course.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{course.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>{course.room}</span>
                      </div>
                    </div>
                  </div>

                  {/* Credits and Availability */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-[#184A2C]/10 to-[#D4AF37]/10 dark:from-primary/10 dark:to-secondary/10 px-3 py-2 rounded-lg border border-[#184A2C]/20">
                      <BookOpen className="h-4 w-4 text-[#184A2C] dark:text-primary" />
                      <span className="font-bold text-[#184A2C] dark:text-primary">
                        {course.credits} {language === 'ar' ? 'ساعة' : 'CH'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      isFull ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
                      availabilityPercentage > 80 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900' :
                      'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                    }`}>
                      <Users className={`h-4 w-4 ${
                        isFull ? 'text-red-600' :
                        availabilityPercentage > 80 ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                      <span className="text-xs font-medium">
                        {course.enrolled}/{course.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Availability Bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFull ? 'bg-red-500' :
                          availabilityPercentage > 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${availabilityPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'ar' 
                        ? `${100 - availabilityPercentage}% متاح`
                        : `${100 - availabilityPercentage}% available`
                      }
                    </p>
                  </div>

                  {/* Register Button */}
                  <Button
                    onClick={() => handleRegister(course)}
                    disabled={isRegistered || isFull}
                    className={`w-full h-11 font-bold text-base transition-all duration-300 ${
                      isRegistered
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : isFull
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : isMIS
                        ? 'bg-gradient-to-r from-[#184A2C] to-emerald-700 hover:from-[#184A2C]/90 hover:to-emerald-700/90 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isRegistered ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        {language === 'ar' ? 'مسجل ✓' : 'Registered ✓'}
                      </>
                    ) : isFull ? (
                      <>
                        <AlertCircle className="h-5 w-5 mr-2" />
                        {language === 'ar' ? 'ممتلئ' : 'Full'}
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        {language === 'ar' ? 'سجل الآن' : 'Register Now'}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-16 text-center animate-scale-in">
          <div className="max-w-md mx-auto">
            <div className="mb-6 flex justify-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full">
                <BookOpen className="h-20 w-20 text-gray-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 text-foreground">
              {language === 'ar' ? 'لا توجد مقررات' : 'No Courses Found'}
            </h3>
            <p className="text-muted-foreground text-lg mb-6">
              {language === 'ar'
                ? 'جرب تغيير معايير البحث أو الفلترة'
                : 'Try changing your search or filter criteria'}
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setLevelFilter('all');
              }}
              className="bg-gradient-to-r from-[#184A2C] to-emerald-700 text-white hover:from-[#184A2C]/90 hover:to-emerald-700/90"
            >
              {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
