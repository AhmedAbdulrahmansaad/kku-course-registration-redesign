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
  Check,
  Edit,
  RefreshCw,
  UserCheck,
  UserX,
  Lock,
  Unlock
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface Supervisor {
  user_id: string;
  id?: string;
  name: string; // ✅ تغيير من full_name إلى name
  email: string;
  role: string;
  student_id?: string;
  department?: string;
  active?: boolean;
  created_at: string;
  supervisors?: any[];
}

export const ManageSupervisorsPage: React.FC = () => {
  const { language } = useApp();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    department: 'نظم المعلومات الإدارية',
    role: 'supervisor' as 'supervisor' | 'admin',
  });

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [ManageSupervisors] Fetching supervisors from SQL Database...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/supervisors`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('📚 [ManageSupervisors] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ManageSupervisors] Server response error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📚 [ManageSupervisors] SQL Database response:', result);

      if (result.success && result.supervisors) {
        console.log('✅ [ManageSupervisors] Loaded', result.supervisors.length, 'supervisors from SQL');
        setSupervisors(result.supervisors);
      } else {
        throw new Error(result.error || 'Failed to load supervisors');
      }
    } catch (error: any) {
      console.error('❌ [ManageSupervisors] Error fetching supervisors:', error);
      toast.error(
        language === 'ar' 
          ? `فشل في تحميل المشرفين: ${error.message}` 
          : `Failed to load supervisors: ${error.message}`
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

  const handleEditSupervisor = async () => {
    try {
      setSaving(true);
      const accessToken = localStorage.getItem('access_token');

      if (!selectedSupervisor) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/update-supervisor`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: selectedSupervisor.user_id,
            fullName: formData.fullName,
            email: formData.email,
            department: formData.department,
            role: formData.role,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          language === 'ar'
            ? '✅ تم تحديث بيانات المشرف بنجاح'
            : '✅ Supervisor updated successfully'
        );
        setIsEditDialogOpen(false);
        setSelectedSupervisor(null);
        resetForm();
        await fetchSupervisors();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error updating supervisor:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في تحديث المشرف' : 'Failed to update supervisor')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (supervisor: Supervisor) => {
    try {
      setToggling(supervisor.user_id);
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/toggle-supervisor-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: supervisor.user_id,
            active: !supervisor.active,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        const newStatus = !supervisor.active;
        toast.success(
          language === 'ar'
            ? `✅ تم ${newStatus ? 'تفعيل' : 'تعطيل'} المشرف بنجاح`
            : `✅ Supervisor ${newStatus ? 'activated' : 'deactivated'} successfully`
        );
        await fetchSupervisors();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error toggling supervisor status:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في تغيير حالة المشرف' : 'Failed to toggle supervisor status')
      );
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteSupervisor = async () => {
    try {
      setDeleting(true);
      const accessToken = localStorage.getItem('access_token');

      if (!selectedSupervisor) return;

      console.log('🗑️ [ManageSupervisors] Deleting supervisor:', selectedSupervisor.student_id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/supervisors/${selectedSupervisor.student_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      console.log('🗑️ [ManageSupervisors] Delete response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ManageSupervisors] Delete error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [ManageSupervisors] Supervisor deleted:', result);

      if (result.success) {
        toast.success(
          language === 'ar'
            ? '✅ تم حذف المشرف بنجاح'
            : '✅ Supervisor deleted successfully'
        );
        setIsDeleteDialogOpen(false);
        setSelectedSupervisor(null);
        await fetchSupervisors();
      } else {
        throw new Error(result.error || 'Failed to delete supervisor');
      }
    } catch (error: any) {
      console.error('❌ [ManageSupervisors] Error deleting supervisor:', error);
      toast.error(
        error.message || (language === 'ar' ? 'فشل في حذف المشرف' : 'Failed to delete supervisor')
      );
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setFormData({
      fullName: supervisor.name,
      email: supervisor.email,
      password: '',
      department: supervisor.department || 'نظم المعلومات الإدارية',
      role: supervisor.role as 'supervisor' | 'admin',
    });
    setIsEditDialogOpen(true);
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
      department: 'نظم المعلومات الإدارية',
      role: 'supervisor',
    });
  };

  const filteredSupervisors = supervisors.filter(supervisor =>
    supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="absolute inset-0 h-48 md:h-56 bg-gradient-to-br from-[#184A2C] via-emerald-700 to-emerald-900"></div>
        <div className="absolute inset-0 h-48 md:h-56 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <GraduationCap className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {language === 'ar' ? 'إدارة المشرفين' : 'Manage Supervisors'}
                </h1>
                <p className="text-white/90">
                  {language === 'ar'
                    ? `${supervisors.length} مشرف`
                    : `${supervisors.length} supervisors`}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={fetchSupervisors}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
                className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-[#D4AF37] text-black font-bold"
              >
                <Plus className="h-5 w-5 mr-2" />
                {language === 'ar' ? 'إضافة مشرف' : 'Add Supervisor'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={language === 'ar' ? 'ابحث عن مشرف...' : 'Search supervisors...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Supervisors List */}
      {filteredSupervisors.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
              <UserCheck className="h-16 w-16 text-gray-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">
            {language === 'ar' ? 'لا يوجد مشرفين' : 'No Supervisors'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {language === 'ar'
              ? 'لم يتم إضافة أي مشرفين بعد. ابدأ بإضافة مشرف جديد.'
              : 'No supervisors added yet. Start by adding a new supervisor.'}
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="bg-gradient-to-r from-[#184A2C] to-emerald-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            {language === 'ar' ? 'إضافة مشرف جديد' : 'Add New Supervisor'}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredSupervisors.map((supervisor, index) => (
            <Card key={supervisor.user_id || supervisor.id || supervisor.email || index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-4 rounded-xl text-white ${
                    supervisor.active !== false 
                      ? 'bg-gradient-to-br from-[#184A2C] to-emerald-700' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    <User className="h-8 w-8" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-2xl font-bold">{supervisor.name}</h3>
                      <Badge className={
                        supervisor.role === 'admin' 
                          ? 'bg-purple-600' 
                          : 'bg-[#184A2C]'
                      }>
                        {supervisor.role === 'admin'
                          ? (language === 'ar' ? 'مدير' : 'Admin')
                          : (language === 'ar' ? 'مشرف' : 'Supervisor')}
                      </Badge>
                      {supervisor.active === false && (
                        <Badge variant="destructive">
                          {language === 'ar' ? 'معطّل' : 'Inactive'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{supervisor.email}</span>
                      </div>
                      {supervisor.department && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>{supervisor.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => openEditDialog(supervisor)}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                  
                  <Button
                    onClick={() => handleToggleStatus(supervisor)}
                    disabled={toggling === supervisor.user_id}
                    variant="outline"
                    size="sm"
                    className={
                      supervisor.active !== false
                        ? 'border-orange-600 text-orange-600 hover:bg-orange-50'
                        : 'border-green-600 text-green-600 hover:bg-green-50'
                    }
                  >
                    {toggling === supervisor.user_id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : supervisor.active !== false ? (
                      <UserX className="h-4 w-4 mr-2" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    {supervisor.active !== false
                      ? (language === 'ar' ? 'تعطيل' : 'Deactivate')
                      : (language === 'ar' ? 'تفعيل' : 'Activate')}
                  </Button>

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
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إضافة مشرف جديد' : 'Add New Supervisor'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'أدخل بيانات المشرف الجديد'
                : 'Enter the new supervisor details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder={language === 'ar' ? 'أحمد محمد علي' : 'John Doe'}
              />
            </div>

            <div>
              <Label htmlFor="email">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="supervisor@kku.edu.sa"
              />
            </div>

            <div>
              <Label htmlFor="password">
                {language === 'ar' ? 'كلمة المرور' : 'Password'} *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="********"
              />
            </div>

            <div>
              <Label htmlFor="department">
                {language === 'ar' ? 'القسم' : 'Department'}
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder={language === 'ar' ? 'نظم المعلومات الإدارية' : 'MIS'}
              />
            </div>

            <div>
              <Label htmlFor="role">
                {language === 'ar' ? 'الدور' : 'Role'}
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'supervisor' | 'admin') => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">
                    {language === 'ar' ? 'مشرف أكاديمي' : 'Supervisor'}
                  </SelectItem>
                  <SelectItem value="admin">
                    {language === 'ar' ? 'مدير نظام' : 'Admin'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleAddSupervisor}
              disabled={saving}
              className="bg-gradient-to-r from-[#184A2C] to-emerald-700"
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل بيانات المشرف' : 'Edit Supervisor'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'قم بتعديل بيانات المشرف'
                : 'Update supervisor details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-fullName">
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
              </Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-email">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-department">
                {language === 'ar' ? 'القسم' : 'Department'}
              </Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-role">
                {language === 'ar' ? 'الدور' : 'Role'}
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'supervisor' | 'admin') => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervisor">
                    {language === 'ar' ? 'مشرف أكاديمي' : 'Supervisor'}
                  </SelectItem>
                  <SelectItem value="admin">
                    {language === 'ar' ? 'مدير نظام' : 'Admin'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleEditSupervisor}
              disabled={saving}
              className="bg-gradient-to-r from-[#184A2C] to-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? `هل أنت متأكد من حذف المشرف "${selectedSupervisor?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete supervisor "${selectedSupervisor?.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleting}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleDeleteSupervisor}
              disabled={deleting}
              variant="destructive"
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