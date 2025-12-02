import React, { useState, useEffect } from 'react';
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
  X as XIcon,
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
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { fetchJSON, getErrorMessage } from '../../utils/fetchWithTimeout';

interface RegistrationRequest {
  request_id: string;
  registration_id: string;
  student_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  reason?: string;
  // Additional data from joins
  student?: {
    full_name: string;
    email: string;
    level: number;
    major: string;
  };
  course?: {
    code: string;
    name_ar: string;
    name_en: string;
    credit_hours: number;
    level: number;
  };
}

export const RequestsPage: React.FC = () => {
  const { 
    language, 
    userInfo 
  } = useApp();

  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log('📋 [Requests] Fetching registration requests...');

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login');
        setLoading(false);
        return;
      }

      const result = await fetchJSON(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/registration-requests`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      console.log('📋 [Requests] Response:', result);

      if (result.success) {
        setRequests(result.requests || []);
        console.log('✅ [Requests] Loaded', result.requests?.length || 0, 'requests');
        
        // ✅ طباعة تفصيلية للطلبات
        if (result.requests && result.requests.length > 0) {
          console.log('📊 [Requests] Sample request data:', result.requests[0]);
          console.log('👤 [Requests] Student data in first request:', result.requests[0]?.student);
          console.log('📚 [Requests] Course data in first request:', result.requests[0]?.course);
        } else {
          console.log('ℹ️ [Requests] No pending requests found');
        }
      } else {
        // Handle specific errors
        if (result.error === 'Admin or Supervisor access required') {
          toast.error(
            language === 'ar' 
              ? '⚠️ هذه الصفحة تتطلب صلاحيات مدير أو مشرف. يرجى تسجيل الدخول بحساب مناسب.' 
              : '⚠️ This page requires admin or supervisor privileges. Please login with appropriate account.'
          );
          toast.info(
            language === 'ar'
              ? 'للحصول على حساب مدير، اذهب إلى صفحة System Setup'
              : 'To create an admin account, go to System Setup page'
          );
        } else if (result.error === 'User not found') {
          toast.error(
            language === 'ar' 
              ? 'المستخدم غير موجود في قاعدة البيانات' 
              : 'User not found in database'
          );
        } else {
          throw new Error(result.error || 'Failed to load requests');
        }
      }
    } catch (error: any) {
      console.error('❌ [Requests] Error fetching requests:', error);
      const errorMessage = getErrorMessage(
        error,
        { ar: 'فشل في تحميل الطلبات', en: 'Failed to load requests' },
        language
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // فلترة الطلبات
  const filteredRequests = requests.filter(request => {
    // تجاهل القيم الفارغة أو null
    if (!request) return false;
    
    const matchesSearch =
      request.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.course?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.course?.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.course?.name_en.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // إحصائيات
  const stats = {
    total: requests.filter(r => r != null).length,
    pending: requests.filter(r => r && r.status === 'pending').length,
    approved: requests.filter(r => r && r.status === 'approved').length,
    rejected: requests.filter(r => r && r.status === 'rejected').length,
  };

  // معالجة المراجعة
  const handleReview = (request: RegistrationRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNote('');
    setIsReviewDialogOpen(true);
  };

  // تأكيد المراجعة
  const confirmReview = async () => {
    if (!selectedRequest || !userInfo) return;

    setProcessing(true);

    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        toast.error(language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login');
        return;
      }

      console.log('📝 [Requests] Processing request:', {
        request_id: selectedRequest.request_id,
        action: reviewAction,
        student: selectedRequest.student?.full_name,
        course: selectedRequest.course?.code,
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/process-registration-request`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request_id: selectedRequest.request_id,
            action: reviewAction,
            note: reviewNote || undefined,
          }),
        }
      );

      const result = await response.json();
      console.log('📋 [Requests] Process request response:', result);

      if (response.ok && result.success) {
        const updatedRequests = requests.map(request => {
          if (request.request_id === selectedRequest.request_id) {
            return {
              ...request,
              status: reviewAction === 'approve' ? 'approved' as const : 'rejected' as const,
              processed_by: userInfo.name,
              processed_at: new Date().toISOString(),
              reason: reviewNote || undefined,
            };
          }
          return request;
        });

        setRequests(updatedRequests);

        // إشعار نجاح
        toast.success(
          language === 'ar'
            ? `✅ تم ${reviewAction === 'approve' ? 'قبول' : 'رفض'} طلب ${selectedRequest.student?.full_name}`
            : `✅ Request ${reviewAction === 'approve' ? 'approved' : 'rejected'} for ${selectedRequest.student?.full_name}`,
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
      } else {
        const errorMessage = result.error || 'Failed to update registration';
        console.error('❌ [Requests] Server error:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ [Requests] Error processing request:', error);
      toast.error(
        language === 'ar' ? 'فشل في معالجة الطلب' : 'Failed to process request'
      );
    } finally {
      setProcessing(false);
    }
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
                ? `عرض ${filteredRequests.length} من ${requests.length} طلب`
                : `Showing ${filteredRequests.length} of ${requests.length} requests`}
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
              key={request.request_id}
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
                          <h3 className="text-xl font-bold text-foreground">{request.student?.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{request.student?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-15">
                        <Mail className="h-4 w-4" />
                        <span>{request.student?.email}</span>
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
                          {request.course?.code}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === 'ar' ? 'اسم المقرر' : 'Course Name'}
                        </p>
                        <p className="font-medium text-foreground">{request.course?.name_ar}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === 'ar' ? 'الوقت' : 'Time'}
                        </p>
                        <p className="text-sm">{request.course?.credit_hours} {language === 'ar' ? 'ساعة' : 'CH'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {language === 'ar' ? 'الساعات المعتمدة' : 'Credits'}
                        </p>
                        <p className="text-sm font-bold">{request.course?.credit_hours} {language === 'ar' ? 'ساعة' : 'CH'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Request Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {language === 'ar' ? 'تاريخ الطلب: ' : 'Request Date: '}
                      {new Date(request.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Review Info */}
                  {request.processed_by && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'ar' ? 'راجعه: ' : 'Reviewed by: '}
                        <span className="font-medium text-foreground">{request.processed_by}</span>
                      </p>
                      {request.processed_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.processed_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                      {request.reason && (
                        <p className="text-sm mt-2 text-foreground">
                          <span className="font-medium">{language === 'ar' ? 'ملاحظة: ' : 'Note: '}</span>
                          {request.reason}
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
                    {selectedRequest.student?.full_name}
                  </p>
                  <p className="text-base">
                    <span className="font-medium">{language === 'ar' ? 'المقرر: ' : 'Course: '}</span>
                    {selectedRequest.course?.code} - {selectedRequest.course?.name_ar}
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