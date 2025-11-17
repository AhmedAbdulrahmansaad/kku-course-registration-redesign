import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Megaphone, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react';
import { Textarea } from '../ui/textarea';
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

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'low' | 'medium' | 'high';
  views: number;
}

export const AnnouncementsPage: React.FC = () => {
  const { language } = useApp();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: language === 'ar' ? 'بدء فترة التسجيل' : 'Registration Period Started',
      content: language === 'ar' 
        ? 'بدأت فترة التسجيل للفصل الدراسي القادم. يرجى تسجيل المقررات المطلوبة قبل نهاية المهلة.' 
        : 'Registration period for next semester has started. Please register for required courses before the deadline.',
      date: '2024-01-15',
      author: 'د. محمد رشيد',
      priority: 'high',
      views: 245,
    },
    {
      id: '2',
      title: language === 'ar' ? 'تحديث النظام' : 'System Update',
      content: language === 'ar' 
        ? 'تم تحديث النظام بميزات جديدة تشمل تحسينات في الأداء والواجهة.' 
        : 'System has been updated with new features including performance and interface improvements.',
      date: '2024-01-14',
      author: 'د. عبدالعزيز الزهراني',
      priority: 'medium',
      views: 156,
    },
    {
      id: '3',
      title: language === 'ar' ? 'ورشة عمل قادمة' : 'Upcoming Workshop',
      content: language === 'ar' 
        ? 'ورشة عمل عن أساسيات نظم المعلومات الإدارية يوم الأحد القادم.' 
        : 'Workshop on MIS fundamentals next Sunday.',
      date: '2024-01-13',
      author: 'قسم نظم المعلومات',
      priority: 'low',
      views: 89,
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', priority: 'medium' });
  };

  const handleAdd = () => {
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      date: new Date().toISOString().split('T')[0],
      author: 'د. عبدالعزيز الزهراني',
      views: 0,
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success(
      language === 'ar' ? '✅ تم إضافة الإعلان بنجاح' : '✅ Announcement added successfully'
    );
  };

  const handleEdit = () => {
    if (!selectedAnnouncement) return;
    setAnnouncements(announcements.map(a => 
      a.id === selectedAnnouncement.id 
        ? { ...a, ...formData }
        : a
    ));
    setIsEditDialogOpen(false);
    setSelectedAnnouncement(null);
    resetForm();
    toast.success(
      language === 'ar' ? '✅ تم تحديث الإعلان بنجاح' : '✅ Announcement updated successfully'
    );
  };

  const handleDelete = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast.success(
      language === 'ar' ? '✅ تم حذف الإعلان بنجاح' : '✅ Announcement deleted successfully'
    );
  };

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncements(announcements.map(a => 
      a.id === announcement.id 
        ? { ...a, views: a.views + 1 }
        : a
    ));
    setIsViewDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return language === 'ar' ? 'عالية' : 'High';
      case 'medium': return language === 'ar' ? 'متوسطة' : 'Medium';
      case 'low': return language === 'ar' ? 'منخفضة' : 'Low';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-48 bg-gradient-to-br from-[#184A2C] via-blue-700 to-blue-900 dark:from-[#0e2818] dark:via-blue-900 dark:to-black"></div>
        <div className="absolute inset-0 h-48 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Megaphone className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold drop-shadow-lg">
                  {language === 'ar' ? 'الإعلانات' : 'Announcements'}
                </h1>
                <p className="text-white/90 text-lg">
                  {announcements.length} {language === 'ar' ? 'إعلان' : 'announcements'}
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
              {language === 'ar' ? 'إعلان جديد' : 'New Announcement'}
            </Button>
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="grid gap-6">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-4 rounded-xl flex-shrink-0 ${
                  announcement.priority === 'high' 
                    ? 'bg-gradient-to-br from-red-600 to-red-700' 
                    : announcement.priority === 'medium'
                    ? 'bg-gradient-to-br from-yellow-600 to-yellow-700'
                    : 'bg-gradient-to-br from-green-600 to-green-700'
                } text-white`}>
                  <Megaphone className="h-8 w-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {getPriorityLabel(announcement.priority)}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{announcement.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{announcement.views} {language === 'ar' ? 'مشاهدة' : 'views'}</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{announcement.title}</h3>
                  <p className="text-muted-foreground mb-3 line-clamp-2">{announcement.content}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{announcement.author}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => openViewDialog(announcement)}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'عرض' : 'View'}
                </Button>
                <Button
                  onClick={() => openEditDialog(announcement)}
                  variant="outline"
                  size="sm"
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  onClick={() => handleDelete(announcement.id)}
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

      {announcements.length === 0 && (
        <Card className="p-12 text-center">
          <Megaphone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">
            {language === 'ar' ? 'لا توجد إعلانات' : 'No announcements'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'لم يتم إضافة أي إعلانات بعد' 
              : 'No announcements have been added yet'}
          </p>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6 text-[#184A2C]" />
              {language === 'ar' ? 'إعلان جديد' : 'New Announcement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'العنوان *' : 'Title *'}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الأولوية *' : 'Priority *'}</Label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">{language === 'ar' ? 'منخفضة' : 'Low'}</option>
                <option value="medium">{language === 'ar' ? 'متوسطة' : 'Medium'}</option>
                <option value="high">{language === 'ar' ? 'عالية' : 'High'}</option>
              </select>
            </div>

            <div>
              <Label>{language === 'ar' ? 'المحتوى *' : 'Content *'}</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-green-600 to-green-700">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-6 w-6 text-blue-600" />
              {language === 'ar' ? 'تعديل الإعلان' : 'Edit Announcement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>{language === 'ar' ? 'العنوان *' : 'Title *'}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الأولوية *' : 'Priority *'}</Label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">{language === 'ar' ? 'منخفضة' : 'Low'}</option>
                <option value="medium">{language === 'ar' ? 'متوسطة' : 'Medium'}</option>
                <option value="high">{language === 'ar' ? 'عالية' : 'High'}</option>
              </select>
            </div>

            <div>
              <Label>{language === 'ar' ? 'المحتوى *' : 'Content *'}</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEdit} className="bg-gradient-to-r from-blue-600 to-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحديث' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">
                      {selectedAnnouncement.title}
                    </DialogTitle>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={getPriorityColor(selectedAnnouncement.priority)}>
                        {getPriorityLabel(selectedAnnouncement.priority)}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{selectedAnnouncement.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{selectedAnnouncement.views} {language === 'ar' ? 'مشاهدة' : 'views'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="py-4">
                <p className="whitespace-pre-wrap text-base leading-relaxed">
                  {selectedAnnouncement.content}
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{language === 'ar' ? 'بواسطة:' : 'By:'} {selectedAnnouncement.author}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
