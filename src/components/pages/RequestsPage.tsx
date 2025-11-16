import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  BookOpen,
  Calendar,
  Filter,
  Search,
  FileText,
  AlertCircle,
  TrendingUp,
  Users,
  CheckCheck,
  X as XIcon
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export const RequestsPage: React.FC = () => {
  const { 
    language, 
    registrationRequests, 
    setRegistrationRequests,
    addNotification,
    userInfo 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<typeof registrationRequests[0] | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  // فلترة الطلبات
  const filteredRequests = registrationRequests.filter(request => {
    // تجاهل القيم الفارغة أو null
    if (!request) return false;
    
    const matchesSearch =
      request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // إحصائيات
  const stats = {
    total: registrationRequests.filter(r => r != null).length,
    pending: registrationRequests.filter(r => r && r.status === 'pending').length,
    approved: registrationRequests.filter(r => r && r.status === 'approved').length,
    rejected: registrationRequests.filter(r => r && r.status === 'rejected').length,
  };

  // معالجة المراجعة
  const handleReview = (request: typeof registrationRequests[0], action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNote('');
    setIsReviewDialogOpen(true);
  };

  // تأكيد المراجعة
  const confirmReview = () => {
    if (!selectedRequest || !userInfo) return;

    const updatedRequests = registrationRequests.map(request => {
      if (request.id === selectedRequest.id) {
        return {
          ...request,
          status: reviewAction === 'approve' ? 'approved' as const : 'rejected' as const,
          reviewedBy: userInfo.name,
          reviewedAt: new Date().toISOString(),
          note: reviewNote || undefined,
        };
      }
      return request;
    });

    setRegistrationRequests(updatedRequests);

    // إرسال إشعار للطالب
    addNotification({
      userId: selectedRequest.studentId,
      type: reviewAction === 'approve' ? 'approval' : 'rejection',
      title: language === 'ar' 
        ? (reviewAction === 'approve' ? '✅ تمت الموافقة على طلبك' : '❌ تم رفض طلبك')
        : (reviewAction === 'approve' ? '✅ Request Approved' : '❌ Request Rejected'),
      message: language === 'ar'
        ? `${reviewAction === 'approve' ? 'تمت الموافقة على' : 'تم رفض'} طلب تسجيل ${selectedRequest.courseName}`
        : `Registration request for ${selectedRequest.courseName} has been ${reviewAction === 'approve' ? 'approved' : 'rejected'}`,
      requestId: selectedRequest.id,
      read: false,
    });

    toast.success(
      language === 'ar'
        ? `✅ تم ${reviewAction === 'approve' ? 'قبول' : 'رفض'} طلب ${selectedRequest.studentName}`
        : `✅ Request ${reviewAction === 'approve' ? 'approved' : 'rejected'} for ${selectedRequest.studentName}`,
      {
        duration: 5000,
        description: language === 'ar'
          ? 'تم إشعار الطالب بالقرار'
          : 'Student has been notified of the decision'
      }
    );

    setIsReviewDialogOpen(false);
    setSelectedRequest(null);
    setReviewNote('');
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-kku-green/95 via-emerald-700/95 to-kku-gold/90"></div>
        
        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full shadow-2xl animate-pulse border-4 border-white/30">
              <FileText className="w-16 h-16" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl">
            {language === 'ar' ? 'طلبات التسجيل' : 'Registration Requests'}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-95 mb-6 max-w-3xl mx-auto drop-shadow-lg">
            {language === 'ar'
              ? 'مراجعة والموافقة على طلبات تسجيل المقررات'
              : 'Review and approve course registration requests'}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-bold">{stats.total}</span>
                <span>{language === 'ar' ? 'طلب إجمالي' : 'Total Requests'}</span>
              </div>
            </div>
            <div className="bg-yellow-500/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-yellow-400/50">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="font-bold">{stats.pending}</span>
                <span>{language === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>
              </div>
            </div>
            <div className="bg-green-500/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-green-400/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold">{stats.approved}</span>
                <span>{language === 'ar' ? 'موافق عليه' : 'Approved'}</span>
              </div>
            </div>
            <div className="bg-red-500/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-red-400/50">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span className="font-bold">{stats.rejected}</span>
                <span>{language === 'ar' ? 'مرفوض' : 'Rejected'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 animate-fade-in shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
            <Input
              placeholder={language === 'ar' ? '🔍 ابحث عن طالب أو مقرر...' : '🔍 Search for student or course...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} h-12 text-base border-2 focus:border-kku-green dark:focus:border-primary`}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full lg:w-[220px] h-12 border-2">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'جميع الطلبات' : 'All Requests'}</SelectItem>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
                </div>
              </SelectItem>
              <SelectItem value="approved">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {language === 'ar' ? 'موافق عليه' : 'Approved'}
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  {language === 'ar' ? 'مرفوض' : 'Rejected'}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="font-medium">
              {language === 'ar'
                ? `عرض ${filteredRequests.length} من ${registrationRequests.length} طلب`
                : `Showing ${filteredRequests.length} of ${registrationRequests.length} requests`}
            </span>
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-kku-green dark:text-primary hover:bg-kku-green/10"
            >
              <XIcon className="h-4 w-4 mr-1" />
              {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
          )}
        </div>
      </Card>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((request, index) => (
            <Card
              key={request.id}
              className={`p-6 hover-lift animate-scale-in ${
                request.status === 'pending'
                  ? 'border-l-4 border-l-yellow-500 dark:border-l-yellow-400'
                  : request.status === 'approved'
                  ? 'border-l-4 border-l-green-500 dark:border-l-green-400'
                  : 'border-l-4 border-l-red-500 dark:border-l-red-400'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Student Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-kku-green/10 dark:bg-primary/10">
                          <User className="h-6 w-6 text-kku-green dark:text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{request.studentName}</h3>
                          <p className="text-sm text-muted-foreground">{request.studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-15">
                        <Mail className="h-4 w-4" />
                        <span>{request.studentEmail}</span>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : request.status === 'approved'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {request.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {language === 'ar'
                        ? request.status === 'pending'
                          ? 'قيد المراجعة'
                          : request.status === 'approved'
                          ? 'موافق عليه'
                          : 'مرفوض'
                        : request.status === 'pending'
                        ? 'Pending'
                        : request.status === 'approved'
                        ? 'Approved'
                        : 'Rejected'}
                    </Badge>
                  </div>

                  {/* Course Info */}
                  <div className="bg-kku-green/5 dark:bg-primary/5 p-4 rounded-lg border border-kku-green/20 dark:border-primary/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === 'ar' ? 'رمز المقرر' : 'Course Code'}
                        </p>
                        <p className="font-mono font-bold text-kku-green dark:text-primary text-lg">
                          {request.courseCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === 'ar' ? 'اسم المقرر' : 'Course Name'}
                        </p>
                        <p className="font-medium text-foreground">{request.courseName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === 'ar' ? 'الوقت' : 'Time'}
                        </p>
                        <p className="text-sm">{request.time}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === 'ar' ? 'الساعات المعتمدة' : 'Credits'}
                        </p>
                        <p className="text-sm font-bold">{request.credits} {language === 'ar' ? 'ساعة' : 'CH'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Request Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {language === 'ar' ? 'تاريخ الطلب: ' : 'Request Date: '}
                      {new Date(request.requestDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Review Info */}
                  {request.reviewedBy && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'ar' ? 'راجعه: ' : 'Reviewed by: '}
                        <span className="font-medium text-foreground">{request.reviewedBy}</span>
                      </p>
                      {request.reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.reviewedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                      {request.note && (
                        <p className="text-sm mt-2 text-foreground">
                          <span className="font-medium">{language === 'ar' ? 'ملاحظة: ' : 'Note: '}</span>
                          {request.note}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex md:flex-col gap-3">
                    <Button
                      onClick={() => handleReview(request, 'approve')}
                      className="flex-1 md:w-36 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      {language === 'ar' ? 'قبول' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => handleReview(request, 'reject')}
                      variant="outline"
                      className="flex-1 md:w-36 h-12 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-bold"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      {language === 'ar' ? 'رفض' : 'Reject'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-16 text-center animate-scale-in">
          <div className="max-w-md mx-auto">
            <div className="mb-6 flex justify-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full">
                <FileText className="h-20 w-20 text-gray-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 text-foreground">
              {language === 'ar' ? 'لا توجد طلبات' : 'No Requests Found'}
            </h3>
            <p className="text-muted-foreground text-lg mb-6">
              {language === 'ar'
                ? 'لا توجد طلبات تسجيل تطابق معايير البحث'
                : 'No registration requests match your search criteria'}
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="bg-gradient-to-r from-kku-green to-emerald-700 text-white hover:from-kku-green/90 hover:to-emerald-700/90"
            >
              {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
            </Button>
          </div>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  {language === 'ar' ? 'قبول الطلب' : 'Approve Request'}
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  {language === 'ar' ? 'رفض الطلب' : 'Reject Request'}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="space-y-2 mt-4">
                  <p className="text-base">
                    <span className="font-medium">{language === 'ar' ? 'الطالب: ' : 'Student: '}</span>
                    {selectedRequest.studentName}
                  </p>
                  <p className="text-base">
                    <span className="font-medium">{language === 'ar' ? 'المقرر: ' : 'Course: '}</span>
                    {selectedRequest.courseCode} - {selectedRequest.courseName}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ar' ? 'ملاحظة (اختياري)' : 'Note (Optional)'}
              </label>
              <Textarea
                placeholder={language === 'ar' ? 'أضف ملاحظة للطالب...' : 'Add a note for the student...'}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={confirmReview}
              className={
                reviewAction === 'approve'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
              }
            >
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};