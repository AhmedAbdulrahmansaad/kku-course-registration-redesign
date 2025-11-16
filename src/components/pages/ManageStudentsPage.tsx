import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Search,
  Filter,
  User,
  Mail,
  GraduationCap,
  Award,
  TrendingUp,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2
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
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Student {
  user_id: string;
  student_id: string;
  full_name: string;
  email: string;
  major: string;
  level: number;
  gpa: number | null;
  role: string;
  created_at: string;
}

export const ManageStudentsPage: React.FC = () => {
  const { language } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/students`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setStudents(result.students || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error(
        language === 'ar' ? 'فشل في تحميل الطلاب' : 'Failed to load students'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      setDeleting(true);
      const accessToken = localStorage.getItem('access_token');

      if (!selectedStudent) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/delete-student`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            studentId: selectedStudent.student_id,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          language === 'ar'
            ? '✅ تم حذف الطالب بنجاح'
            : '✅ Student deleted successfully'
        );
        setIsDeleteDialogOpen(false);
        setSelectedStudent(null);
        fetchStudents();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في حذف الطالب' : 'Failed to delete student')
      );
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const filteredStudents = students.filter(student => {
    // تجاهل القيم الفارغة أو null
    if (!student || !student.full_name) return false;
    
    const matchesSearch = 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || student.level.toString() === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  // حساب الإحصائيات
  const stats = {
    total: students.filter(s => s != null).length,
    level1: students.filter(s => s && s.level === 1).length,
    level2: students.filter(s => s && s.level === 2).length,
    level3: students.filter(s => s && s.level === 3).length,
    level4: students.filter(s => s && s.level === 4).length,
    mis: students.filter(s => s && s.major === 'MIS').length,
  };

  if (loading) {
    return (
      <Card className="p-16 text-center">
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#184A2C]" />
        <p className="text-muted-foreground">
          {language === 'ar' ? 'جاري تحميل الطلاب...' : 'Loading students...'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-48 md:h-56 bg-gradient-to-br from-[#184A2C] via-green-700 to-green-900 dark:from-[#0e2818] dark:via-green-900 dark:to-black"></div>
        <div className="absolute inset-0 h-48 md:h-56 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-6 md:py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Users className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
                {language === 'ar' ? 'إدارة الطلاب' : 'Manage Students'}
              </h1>
              <p className="text-white/90 text-base md:text-lg">
                {language === 'ar'
                  ? `${students.length} طالب مسجل`
                  : `${students.length} registered students`}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'إجمالي' : 'Total'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'مستوى 1' : 'Level 1'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{stats.level1}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'مستوى 2' : 'Level 2'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{stats.level2}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'مستوى 3' : 'Level 3'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{stats.level3}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">MIS</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{stats.mis}</p>
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
              placeholder={language === 'ar' ? 'ابحث عن طالب...' : 'Search for student...'}
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

          <Select value={majorFilter} onValueChange={setMajorFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={language === 'ar' ? 'التخصص' : 'Major'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع التخصصات' : 'All Majors'}</SelectItem>
              <SelectItem value="MIS">MIS</SelectItem>
              <SelectItem value="CS">CS</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Students Grid */}
      <div className="grid gap-4">
        {filteredStudents.map((student, index) => (
          <Card key={student.student_id} className="p-6 hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 0.03}s` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-gradient-to-br from-[#184A2C] to-green-700 p-4 rounded-full text-white flex-shrink-0">
                  <User className="h-8 w-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold">{student.full_name}</h3>
                    <Badge variant="secondary" className="font-mono">
                      {student.student_id}
                    </Badge>
                    <Badge className="bg-[#184A2C]">
                      {language === 'ar' ? `المستوى ${student.level}` : `Level ${student.level}`}
                    </Badge>
                    {student.gpa && (
                      <Badge variant="outline" className="font-bold">
                        GPA: {student.gpa.toFixed(2)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>{student.major}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {language === 'ar' ? 'تاريخ التسجيل: ' : 'Registration Date: '}
                      {new Date(student.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => openDeleteDialog(student)}
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

      {filteredStudents.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'لم يتم العثور على طلاب يطابقون البحث'
              : 'No students found matching your search'}
          </p>
        </Card>
      )}

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
                ? 'هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع بياناته بما في ذلك التسجيلات والطلبات.'
                : 'Are you sure you want to delete this student? All their data including registrations and requests will be deleted.'}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="py-4 space-y-2">
              <p className="font-medium text-lg">{selectedStudent.full_name}</p>
              <p className="text-sm text-muted-foreground">{selectedStudent.student_id}</p>
              <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleDeleteStudent}
              disabled={deleting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {deleting ? (
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