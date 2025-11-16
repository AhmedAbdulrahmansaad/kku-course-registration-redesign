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
  Award
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

export const ManageCoursesPage: React.FC = () => {
  const { language } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

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
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/courses`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setCourses(result.courses || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast.error(
        language === 'ar' ? 'فشل في تحميل المقررات' : 'Failed to load courses'
      );
    } finally {
      setLoading(false);
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
        setIsAddDialogOpen(false);
        resetForm();
        fetchCourses();
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

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/delete-course`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            courseId: selectedCourse.course_id,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          language === 'ar'
            ? '✅ تم حذف المقرر بنجاح'
            : '✅ Course deleted successfully'
        );
        setIsDeleteDialogOpen(false);
        setSelectedCourse(null);
        fetchCourses();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error deleting course:', error);
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
    });
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
          <Card key={course.course_id} className="p-6 hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-gradient-to-br from-[#184A2C] to-blue-700 p-4 rounded-xl text-white flex-shrink-0">
                  <BookOpen className="h-8 w-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Badge variant="secondary" className="text-sm font-mono">
                      {course.code}
                    </Badge>
                    <Badge variant="outline">
                      {course.credit_hours} {language === 'ar' ? 'ساعات' : 'hours'}
                    </Badge>
                    <Badge className="bg-[#184A2C]">
                      {language === 'ar' ? `المستوى ${course.level}` : `Level ${course.level}`}
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold mb-2">
                    {language === 'ar' ? course.name_ar : course.name_en}
                  </h3>

                  {(course.description_ar || course.description_en) && (
                    <p className="text-muted-foreground mb-4">
                      {language === 'ar' ? course.description_ar : course.description_en}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {course.instructor && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>{course.instructor}</span>
                      </div>
                    )}
                    {course.semester && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{course.semester}</span>
                      </div>
                    )}
                    {course.prerequisites && course.prerequisites.length > 0 && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
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

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => openEditDialog(course)}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  onClick={() => openDeleteDialog(course)}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
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
                <Label>{language === 'ar' ? 'اسم الدكتور' : 'Instructor'}</Label>
                <Input
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
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
                <Label>{language === 'ar' ? 'اسم الدكتور' : 'Instructor'}</Label>
                <Input
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
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
    </div>
  );
};