import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  BookOpen, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  Loader2,
  AlertCircle,
  GraduationCap,
  Clock,
  Award,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { PREDEFINED_COURSES, type PredefinedCourse } from './predefinedCourses';
import { Checkbox } from '../ui/checkbox';

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
  course_type?: 'mandatory' | 'elective'; // إجباري أو اختياري
}

export const ManageCoursesPage: React.FC = () => {
  const { language } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQuickAddDialogOpen, setIsQuickAddDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCoursesForQuickAdd, setSelectedCoursesForQuickAdd] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    code: '',
    name_ar: '',
    name_en: '',
    credit_hours: 3,
    level: 1,
    department: 'MIS',
    description_ar: '',
    description_en: '',
    prerequisites: '',
    semester: '',
    instructor: '',
    course_type: 'mandatory' as 'mandatory' | 'elective',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [ManageCourses] Fetching courses from SQL Database...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/courses`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('📚 [ManageCourses] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ManageCourses] Server response error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📚 [ManageCourses] SQL Database response:', result);

      if (result.success && result.courses) {
        console.log('✅ [ManageCourses] Loaded', result.courses.length, 'courses from SQL');
        setCourses(result.courses);
      } else {
        throw new Error(result.error || 'Failed to load courses');
      }
    } catch (error: any) {
      console.error('❌ [ManageCourses] Error fetching courses:', error);
      toast.error(
        language === 'ar' 
          ? `فشل في تحميل المقررات: ${error.message}` 
          : `Failed to load courses: ${error.message}`
      );
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeCourses = async () => {
    try {
      setSaving(true);
      console.log('📥 [ManageCourses] Initializing courses...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/init-courses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('📡 [ManageCourses] Init response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ManageCourses] Init error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [ManageCourses] Init result:', result);

      if (result.success) {
        toast.success(
          language === 'ar'
            ? `✅ تم تحميل ${result.created} مقرر بنجاح`
            : `✅ Successfully loaded ${result.created} courses`
        );
        await fetchCourses();
      } else {
        throw new Error(result.error || 'Failed to initialize courses');
      }
    } catch (error: any) {
      console.error('❌ [ManageCourses] Error initializing courses:', error);
      toast.error(
        language === 'ar'
          ? `فشل في تحميل المقررات الأولية: ${error.message}`
          : `Failed to initialize courses: ${error.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddCourse = async () => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('access_token');

      // التحقق من البيانات
      if (!formData.code || !formData.name_ar || !formData.name_en) {
        toast.error(
          language === 'ar'
            ? 'يرجى ملء جميع الحقول المطلوبة'
            : 'Please fill all required fields'
        );
        return;
      }

      // التحقق من عدم تكرار رمز المقرر
      if (courses.some(c => c.code === formData.code)) {
        toast.error(
          language === 'ar'
            ? 'رمز المقرر موجود مسبقاً'
            : 'Course code already exists'
        );
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/add-course`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...formData,
            prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map(p => p.trim()) : [],
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          language === 'ar'
            ? '✅ تم إضافة المقرر بنجاح'
            : '✅ Course added successfully'
        );
        
        // إضافة المقرر الجديد مباشرة إلى القائمة
        if (result.course) {
          setCourses(prevCourses => [...prevCourses, result.course]);
        }
        
        setIsAddDialogOpen(false);
        resetForm();
        // إعادة تحميل المقررات للتأكد من التزامن
        await fetchCourses();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error adding course:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في إضافة المقرر' : 'Failed to add course')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditCourse = async () => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('access_token');

      if (!selectedCourse) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/update-course`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            courseId: selectedCourse.course_id,
            ...formData,
            prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map(p => p.trim()) : [],
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          language === 'ar'
            ? '✅ تم تحديث المقرر بنجاح'
            : '✅ Course updated successfully'
        );
        setIsEditDialogOpen(false);
        setSelectedCourse(null);
        resetForm();
        fetchCourses();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في تحديث المقرر' : 'Failed to update course')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('access_token');

      if (!selectedCourse) return;

      console.log('🗑️ [ManageCourses] Deleting course:', selectedCourse.course_id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/courses/${selectedCourse.course_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      console.log('🗑️ [ManageCourses] Delete response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ManageCourses] Delete error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [ManageCourses] Course deleted:', result);

      if (result.success) {
        toast.success(
          language === 'ar'
            ? '✅ تم حذف المقرر بنجاح'
            : '✅ Course deleted successfully'
        );
        setIsDeleteDialogOpen(false);
        setSelectedCourse(null);
        fetchCourses();
      } else {
        throw new Error(result.error || 'Failed to delete course');
      }
    } catch (error: any) {
      console.error('❌ [ManageCourses] Error deleting course:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في حذف المقرر' : 'Failed to delete course')
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      code: course.code,
      name_ar: course.name_ar,
      name_en: course.name_en,
      credit_hours: course.credit_hours,
      level: course.level,
      department: course.department,
      description_ar: course.description_ar || '',
      description_en: course.description_en || '',
      prerequisites: course.prerequisites?.join(', ') || '',
      semester: course.semester || '',
      instructor: course.instructor || '',
      course_type: course.course_type || 'mandatory',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name_ar: '',
      name_en: '',
      credit_hours: 3,
      level: 1,
      department: 'MIS',
      description_ar: '',
      description_en: '',
      prerequisites: '',
      semester: '',
      instructor: '',
      course_type: 'mandatory',
    });
  };

  // Quick add from predefined courses
  const handleQuickAddCourses = async () => {
    if (selectedCoursesForQuickAdd.length === 0) {
      toast.error(
        language === 'ar'
          ? 'يرجى اختيار مقرر واحد على الأقل'
          : 'Please select at least one course'
      );
      return;
    }

    try {
      setSaving(true);
      const accessToken = localStorage.getItem('access_token');
      let successCount = 0;
      let failedCount = 0;

      for (const courseCode of selectedCoursesForQuickAdd) {
        const predefinedCourse = PREDEFINED_COURSES.find(c => c && c.code === courseCode);
        if (!predefinedCourse) continue;

        // Check if course already exists
        if (courses.some(c => c && c.code === predefinedCourse.code)) {
          failedCount++;
          continue;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/add-course`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(predefinedCourse),
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          language === 'ar'
            ? `✅ تم إضافة ${successCount} مقرر بنجاح`
            : `✅ Successfully added ${successCount} courses`
        );
      }

      if (failedCount > 0) {
        toast.error(
          language === 'ar'
            ? `⚠️ فشل في إضافة ${failedCount} مقرر`
            : `⚠️ Failed to add ${failedCount} courses`
        );
      }

      setIsQuickAddDialogOpen(false);
      setSelectedCoursesForQuickAdd([]);
      fetchCourses();
    } catch (error: any) {
      console.error('Error adding courses:', error);
      toast.error(
        language === 'ar' ? 'فشل في إضافة المقررات' : 'Failed to add courses'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleCourseSelection = (courseCode: string) => {
    setSelectedCoursesForQuickAdd(prev =>
      prev.includes(courseCode)
        ? prev.filter(code => code !== courseCode)
        : [...prev, courseCode]
    );
  };

  const selectAllCourses = () => {
    setSelectedCoursesForQuickAdd(PREDEFINED_COURSES.map(c => c.code));
  };

  const deselectAllCourses = () => {
    setSelectedCoursesForQuickAdd([]);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-48 md:h-56 bg-gradient-to-br from-[#184A2C] via-blue-700 to-blue-900 dark:from-[#0e2818] dark:via-blue-900 dark:to-black"></div>
        <div className="absolute inset-0 h-48 md:h-56 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
                  {language === 'ar' ? 'إدارة المقررات' : 'Manage Courses'}
                </h1>
                <p className="text-white/90 text-base md:text-lg">
                  {language === 'ar'
                    ? `${courses.length} مقرر دراسي`
                    : `${courses.length} courses`}
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-[#D4AF37] text-black font-bold"
            >
              <Plus className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'إضافة مقرر جديد' : 'Add New Course'}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-[#D4AF37] text-black font-bold"
            >
              <Plus className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'إضافة يدوي' : 'Manual Add'}
            </Button>
            
            <Button
              onClick={() => setIsQuickAddDialogOpen(true)}
              variant="outline"
              className="border-[#184A2C] text-[#184A2C] hover:bg-[#184A2C] hover:text-white font-bold"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'إضافة من القائمة' : 'Add from List'}
            </Button>

            {courses.length === 0 && (
              <Button
                onClick={initializeCourses}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <GraduationCap className="h-5 w-5 mr-2" />
                )}
                {language === 'ar' ? 'تحميل 49 مقرر' : 'Load 49 Courses'}
              </Button>
            )}

            <Button
              onClick={fetchCourses}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'إجمالي المقررات' : 'Total Courses'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{courses.length}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'إجمالي الساعات' : 'Total Hours'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">
                {courses.filter(c => c != null).reduce((sum, c) => sum + (c.credit_hours || 0), 0)}
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'المستويات' : 'Levels'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">8</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-[#D4AF37]" />
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
        {filteredCourses.map((course, index) => (
          <Card key={course.course_id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 w-full">
                <div className="bg-gradient-to-br from-[#184A2C] to-blue-700 p-3 sm:p-4 rounded-xl text-white flex-shrink-0">
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
                    {course.course_type && (
                      <Badge 
                        className={
                          course.course_type === 'mandatory' 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs sm:text-sm' 
                            : 'bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black text-xs sm:text-sm'
                        }
                      >
                        {course.course_type === 'mandatory'
                          ? (language === 'ar' ? 'إجباري' : 'Mandatory')
                          : (language === 'ar' ? 'اختياري' : 'Elective')}
                      </Badge>
                    )}
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
                        <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{course.instructor}</span>
                      </div>
                    )}
                    {course.semester && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
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

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                <Button
                  onClick={() => openEditDialog(course)}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full lg:w-auto text-xs sm:text-sm"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  onClick={() => openDeleteDialog(course)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-600 hover:bg-red-50 w-full lg:w-auto text-xs sm:text-sm"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {language === 'ar' ? 'حذف' : 'Delete'}
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

      {/* Add Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-green-600" />
              {language === 'ar' ? 'إضافة مقرر جديد' : 'Add New Course'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'أدخل تفاصيل المقرر الجديد أدناه'
                : 'Enter the new course details below'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'رمز المقرر *' : 'Course Code *'}</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="MIS101"
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الساعات المعتمدة *' : 'Credit Hours *'}</Label>
                <Input
                  type="number"
                  value={formData.credit_hours}
                  onChange={(e) => setFormData({ ...formData, credit_hours: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'الاسم بالعربية *' : 'Arabic Name *'}</Label>
              <Input
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الاسم بالإنجليزية *' : 'English Name *'}</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'المستوى *' : 'Level *'}</Label>
                <Select value={formData.level.toString()} onValueChange={(v) => setFormData({ ...formData, level: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'نوع المقرر *' : 'Course Type *'}</Label>
                <Select value={formData.course_type} onValueChange={(v: 'mandatory' | 'elective') => setFormData({ ...formData, course_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandatory">
                      {language === 'ar' ? 'إجباري' : 'Mandatory'}
                    </SelectItem>
                    <SelectItem value="elective">
                      {language === 'ar' ? 'اختياري' : 'Elective'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'اسم الدكتور' : 'Instructor'}</Label>
                <Input
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الفصل الدراسي' : 'Semester'}</Label>
                <Input
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder={language === 'ar' ? 'الفصل الأول' : 'Fall Semester'}
                />
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'الوصف بالعربية' : 'Arabic Description'}</Label>
              <Textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الوصف بالإنجليزية' : 'English Description'}</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'المتطلبات السابقة (مفصولة بفواصل)' : 'Prerequisites (comma-separated)'}</Label>
              <Input
                value={formData.prerequisites}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                placeholder="MIS100, MIS101"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleAddCourse}
              disabled={saving}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog - نفس المحتوى تقريباً */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-6 w-6 text-blue-600" />
              {language === 'ar' ? 'تعديل المقرر' : 'Edit Course'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'قم بتحديث تفاصيل المقرر أدناه'
                : 'Update the course details below'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'رمز المقرر *' : 'Course Code *'}</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الساعات المعتمدة *' : 'Credit Hours *'}</Label>
                <Input
                  type="number"
                  value={formData.credit_hours}
                  onChange={(e) => setFormData({ ...formData, credit_hours: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'الاسم بالعربية *' : 'Arabic Name *'}</Label>
              <Input
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الاسم بالإنجليزية *' : 'English Name *'}</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'المستوى *' : 'Level *'}</Label>
                <Select value={formData.level.toString()} onValueChange={(v) => setFormData({ ...formData, level: parseInt(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        {language === 'ar' ? `المستوى ${level}` : `Level ${level}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'ar' ? 'نوع المقرر *' : 'Course Type *'}</Label>
                <Select value={formData.course_type} onValueChange={(v: 'mandatory' | 'elective') => setFormData({ ...formData, course_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandatory">
                      {language === 'ar' ? 'إجباري' : 'Mandatory'}
                    </SelectItem>
                    <SelectItem value="elective">
                      {language === 'ar' ? 'اختياري' : 'Elective'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'اسم الدكتور' : 'Instructor'}</Label>
                <Input
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الفصل الدراسي' : 'Semester'}</Label>
                <Input
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder={language === 'ar' ? 'الفصل الأول' : 'Fall Semester'}
                />
              </div>
            </div>

            <div>
              <Label>{language === 'ar' ? 'الوصف بالعربية' : 'Arabic Description'}</Label>
              <Textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الوصف بالإنجليزية' : 'English Description'}</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'المتطلبات السابقة (مفصولة بفواصل)' : 'Prerequisites (comma-separated)'}</Label>
              <Input
                value={formData.prerequisites}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                placeholder="MIS100, MIS101"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleEditCourse}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تحديث' : 'Update'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'هل أنت متأكد من حذف هذا المقرر؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this course? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {selectedCourse && (
            <div className="py-4">
              <p className="font-medium">
                {language === 'ar' ? selectedCourse.name_ar : selectedCourse.name_en}
              </p>
              <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleDeleteCourse}
              disabled={saving}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الحذف...' : 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog open={isQuickAddDialogOpen} onOpenChange={setIsQuickAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-[#D4AF37]" />
              {language === 'ar' ? 'إضافة من القائمة' : 'Add from List'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'اختر المقررات التي تريد إضافتها من القائمة أدناه'
                : 'Select the courses you want to add from the list below'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? `تم تحديد ${selectedCoursesForQuickAdd.length} من ${PREDEFINED_COURSES.length} مقرر`
                  : `Selected ${selectedCoursesForQuickAdd.length} of ${PREDEFINED_COURSES.length} courses`
                }
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={selectAllCourses}
                  variant="outline"
                  size="sm"
                >
                  {language === 'ar' ? 'تحديد الكل' : 'Select All'}
                </Button>
                <Button
                  onClick={deselectAllCourses}
                  variant="outline"
                  size="sm"
                >
                  {language === 'ar' ? 'إلغا الكل' : 'Deselect All'}
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
              {PREDEFINED_COURSES.map((course) => {
                const isAlreadyAdded = courses.some(c => c && c.code === course.code);
                return (
                  <div 
                    key={course.code} 
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      isAlreadyAdded 
                        ? 'bg-gray-50 opacity-60 cursor-not-allowed' 
                        : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => !isAlreadyAdded && toggleCourseSelection(course.code)}
                  >
                    <Checkbox
                      checked={selectedCoursesForQuickAdd.includes(course.code)}
                      onCheckedChange={() => !isAlreadyAdded && toggleCourseSelection(course.code)}
                      disabled={isAlreadyAdded}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {course.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {language === 'ar' ? `المستوى ${course.level}` : `Level ${course.level}`}
                        </Badge>
                        <Badge 
                          className={
                            course.course_type === 'mandatory' 
                              ? 'bg-blue-600 text-white text-xs' 
                              : 'bg-[#D4AF37] text-black text-xs'
                          }
                        >
                          {course.course_type === 'mandatory'
                            ? (language === 'ar' ? 'إجباري' : 'Mandatory')
                            : (language === 'ar' ? 'اختياري' : 'Elective')}
                        </Badge>
                        {isAlreadyAdded && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            {language === 'ar' ? 'مُضاف' : 'Added'}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">
                        {language === 'ar' ? course.name_ar : course.name_en}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {course.credit_hours} {language === 'ar' ? 'ساعات' : 'hours'}
                        {course.instructor && ` • ${course.instructor}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAddDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleQuickAddCourses}
              disabled={saving}
              className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-[#D4AF37] text-black font-bold"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الإضافة...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};