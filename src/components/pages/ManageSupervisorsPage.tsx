import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  GraduationCap, 
  Plus,
  Search,
  User,
  Mail,
  Shield,
  Trash2,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Supervisor {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export const ManageSupervisorsPage: React.FC = () => {
  const { language } = useApp();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'supervisor' as 'supervisor' | 'admin',
  });

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        toast.error(
          language === 'ar'
            ? '🚫 يجب تسجيل الدخول أولاً'
            : '🚫 Access denied: User not logged in'
        );
        setSupervisors([]);
        return;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/supervisors`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // التحقق من نوع المحتوى قبل محاولة parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', await response.text());
        throw new Error('Invalid response format');
      }

      const result = await response.json();

      if (response.ok) {
        setSupervisors(result.supervisors || []);
      } else {
        throw new Error(result.error || 'Failed to fetch supervisors');
      }
    } catch (error: any) {
      console.error('Error fetching supervisors:', error);
      toast.error(
        language === 'ar' ? 'فشل في تحميل المشرفين' : 'Failed to load supervisors'
      );
      setSupervisors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupervisor = async () => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        toast.error(
          language === 'ar'
            ? '🚫 يجب تسجيل الدخول أولاً'
            : '🚫 Access denied: User not logged in'
        );
        return;
      }

      if (!formData.fullName || !formData.email || !formData.password) {
        toast.error(
          language === 'ar'
            ? 'يرجى ملء جميع الحقول المطلوبة'
            : 'Please fill all required fields'
        );
        return;
      }

      if (!formData.email.endsWith('@kku.edu.sa')) {
        toast.error(
          language === 'ar'
            ? 'يجب استخدام بريد جامعي (@kku.edu.sa)'
            : 'Must use university email (@kku.edu.sa)'
        );
        return;
      }

      console.log('📝 Adding supervisor:', formData);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/add-supervisor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      console.log('📝 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Supervisor added:', result);

      toast.success(
        language === 'ar'
          ? '✅ تم إضافة المشرف بنجاح'
          : '✅ Supervisor added successfully',
        {
          description: language === 'ar'
            ? `تم إنشاء حساب ${formData.fullName} بنجاح`
            : `Account for ${formData.fullName} created successfully`
        }
      );
      
      setIsAddDialogOpen(false);
      resetForm();
      
      // جلب المشرفين مباشرة لإظهار المشرف الجديد
      await fetchSupervisors();
    } catch (error: any) {
      console.error('❌ Error adding supervisor:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في إضافة المشرف' : 'Failed to add supervisor')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSupervisor = async () => {
    try {
      setDeleting(true);
      const accessToken = localStorage.getItem('access_token');

      if (!selectedSupervisor) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/delete-supervisor`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: selectedSupervisor.user_id,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          language === 'ar'
            ? '✅ تم حذف المشرف بنجاح'
            : '✅ Supervisor deleted successfully'
        );
        setIsDeleteDialogOpen(false);
        setSelectedSupervisor(null);
        fetchSupervisors();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error deleting supervisor:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في حذف المشرف' : 'Failed to delete supervisor')
      );
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'supervisor',
    });
  };

  const filteredSupervisors = supervisors.filter(supervisor => {
    // تجاهل القيم الفارغة أو null
    if (!supervisor || !supervisor.full_name) return false;
    
    return supervisor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: supervisors.filter(s => s != null).length,
    supervisors: supervisors.filter(s => s && s.role === 'supervisor').length,
    admins: supervisors.filter(s => s && s.role === 'admin').length,
  };

  if (loading) {
    return (
      <Card className="p-16 text-center">
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#184A2C]" />
        <p className="text-muted-foreground">
          {language === 'ar' ? 'جاري تحميل المشرفين...' : 'Loading supervisors...'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-48 md:h-56 bg-gradient-to-br from-[#184A2C] via-purple-700 to-purple-900 dark:from-[#0e2818] dark:via-purple-900 dark:to-black"></div>
        <div className="absolute inset-0 h-48 md:h-56 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <GraduationCap className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
                  {language === 'ar' ? 'إدارة المشرفين' : 'Manage Supervisors'}
                </h1>
                <p className="text-white/90 text-base md:text-lg">
                  {language === 'ar'
                    ? `${supervisors.length} مشرف`
                    : `${supervisors.length} supervisors`}
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
              {language === 'ar' ? 'إضافة مشرف جديد' : 'Add New Supervisor'}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-[#D4AF37]" />
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
                  {language === 'ar' ? 'مشرفين' : 'Supervisors'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{stats.supervisors}</p>
            </div>

            <div className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-xl border border-white/30">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs md:text-sm opacity-90">
                  {language === 'ar' ? 'مدراء' : 'Admins'}
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{stats.admins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ar' ? 'ابحث عن مشرف...' : 'Search for supervisor...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Supervisors Grid */}
      <div className="grid gap-4">
        {filteredSupervisors.map((supervisor, index) => (
          <Card key={supervisor.user_id} className="p-6 hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 0.03}s` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`bg-gradient-to-br ${supervisor.role === 'admin' ? 'from-[#D4AF37] to-yellow-600' : 'from-[#184A2C] to-purple-700'} p-4 rounded-full text-white flex-shrink-0`}>
                  {supervisor.role === 'admin' ? (
                    <Shield className="h-8 w-8" />
                  ) : (
                    <GraduationCap className="h-8 w-8" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold">{supervisor.full_name}</h3>
                    <Badge className={supervisor.role === 'admin' ? 'bg-[#D4AF37] text-black' : 'bg-[#184A2C]'}>
                      {supervisor.role === 'admin' 
                        ? (language === 'ar' ? 'مدير' : 'Admin')
                        : (language === 'ar' ? 'مشرف' : 'Supervisor')
                      }
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{supervisor.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {language === 'ar' ? 'تاريخ الإضافة: ' : 'Added: '}
                      {new Date(supervisor.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
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
                  onClick={() => openDeleteDialog(supervisor)}
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

      {filteredSupervisors.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'لم يتم العثور على مشرفين يطابقون البحث'
              : 'No supervisors found matching your search'}
          </p>
        </Card>
      )}

      {/* Add Supervisor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-green-600" />
              {language === 'ar' ? 'إضافة مشرف جديد' : 'Add New Supervisor'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'أدخل بيانات المشرف الأكاديمي الجديد أدناه'
                : 'Enter the new supervisor details below'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder={language === 'ar' ? 'د. محمد أحمد' : 'Dr. Mohammed Ahmed'}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="supervisor@kku.edu.sa"
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'كلمة المرور *' : 'Password *'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الدور *' : 'Role *'}</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.role === 'supervisor'}
                    onChange={() => setFormData({ ...formData, role: 'supervisor' })}
                    className="h-4 w-4"
                  />
                  <span>{language === 'ar' ? 'مشرف أكاديمي' : 'Academic Supervisor'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.role === 'admin'}
                    onChange={() => setFormData({ ...formData, role: 'admin' })}
                    className="h-4 w-4"
                  />
                  <span>{language === 'ar' ? 'مدير النظام' : 'System Admin'}</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleAddSupervisor}
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
                ? 'هل أنت متأكد من حذف هذا المشرف؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this supervisor? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {selectedSupervisor && (
            <div className="py-4 space-y-2">
              <p className="font-medium text-lg">{selectedSupervisor.full_name}</p>
              <p className="text-sm text-muted-foreground">{selectedSupervisor.email}</p>
              <Badge className={selectedSupervisor.role === 'admin' ? 'bg-[#D4AF37] text-black' : 'bg-[#184A2C]'}>
                {selectedSupervisor.role === 'admin' 
                  ? (language === 'ar' ? 'مدير' : 'Admin')
                  : (language === 'ar' ? 'مشرف' : 'Supervisor')
                }
              </Badge>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleDeleteSupervisor}
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