import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Award,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Filter,
  Users,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
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

interface Registration {
  registration_id: string;
  student_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  student?: {
    full_name: string;
    email: string;
    major: string;
    level: number;
    gpa: number | null;
  };
}

export const SupervisorDashboard: React.FC = () => {
  const { language, userInfo } = useApp();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      console.log('📚 [SupervisorDashboard] Fetching registrations...');
      
      let registrationsData: any[] = [];

      // ✅ Try backend first
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/registrations?status=pending`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('✅ [SupervisorDashboard] Loaded', result.registrations.length, 'registrations from backend');
          registrationsData = result.registrations || [];
        }
      } catch (backendError) {
        console.log('🔄 [SupervisorDashboard] Backend offline, using localStorage');
      }

      // ✅ Fallback to localStorage
      if (registrationsData.length === 0) {
        const localRegs = JSON.parse(localStorage.getItem('kku_registrations') || '[]');
        registrationsData = localRegs.filter((reg: any) => reg.status === 'pending');
        
        console.log('✅ [SupervisorDashboard] Loaded', registrationsData.length, 'pending registrations from localStorage');
      }
      
      setRegistrations(registrationsData);
    } catch (error: any) {
      console.error('❌ [SupervisorDashboard] Error fetching registrations:', error);
      toast.error(
        language === 'ar' 
          ? 'فشل في تحميل الطلبات' 
          : 'Failed to load requests'
      );
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        toast.error('Unauthorized');
        return;
      }

      console.log('✅ [SupervisorDashboard] Approving registration:', registrationId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/process-registration-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            request_id: registrationId,
            action: 'approve',
          }),
        }
      );

      const result = await response.json();
      console.log('📡 [SupervisorDashboard] Response:', result);

      if (response.ok && result.success) {
        toast.success(
          language === 'ar' 
            ? '✅ تم قبول التسجيل بنجاح' 
            : '✅ Registration approved successfully'
        );
        fetchRegistrations();
      } else if (result.error && result.error.includes('already')) {
        // Handle "already processed" case
        toast.info(
          language === 'ar' 
            ? `ℹ️ هذا الطلب ${result.currentStatus === 'approved' ? 'مقبول' : 'مرفوض'} بالفعل` 
            : `ℹ️ This request is already ${result.currentStatus}`
        );
        fetchRegistrations(); // Refresh to update UI
      } else {
        throw new Error(result.error || 'Failed to approve registration');
      }
    } catch (error: any) {
      console.error('❌ Error approving registration:', error);
      toast.error(
        language === 'ar' 
          ? 'فشل في قبول التسجيل' 
          : 'Failed to approve registration'
      );
    }
  };

  const handleReject = async (registrationId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        toast.error('Unauthorized');
        return;
      }

      console.log('❌ [SupervisorDashboard] Rejecting registration:', registrationId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/process-registration-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            request_id: registrationId,
            action: 'reject',
            note: rejectionReason,
          }),
        }
      );

      const result = await response.json();
      console.log('📡 [SupervisorDashboard] Response:', result);

      if (response.ok && result.success) {
        toast.success(
          language === 'ar' 
            ? '❌ تم رفض التسجيل' 
            : '❌ Registration rejected'
        );
        setRejectDialogOpen(false);
        setSelectedRegistration(null);
        setRejectionReason('');
        fetchRegistrations();
      } else if (result.error && result.error.includes('already')) {
        // Handle "already processed" case
        toast.info(
          language === 'ar' 
            ? `ℹ️ هذا الطلب ${result.currentStatus === 'approved' ? 'مقبول' : 'مرفوض'} بالفعل` 
            : `ℹ️ This request is already ${result.currentStatus}`
        );
        setRejectDialogOpen(false);
        setSelectedRegistration(null);
        setRejectionReason('');
        fetchRegistrations(); // Refresh to update UI
      } else {
        throw new Error(result.error || 'Failed to reject registration');
      }
    } catch (error: any) {
      console.error('❌ Error rejecting registration:', error);
      toast.error(
        language === 'ar' 
          ? 'فشل في رفض التسجيل' 
          : 'Failed to reject registration'
      );
    }
  };

  const filteredRegistrations = registrations.filter(reg => 
    filter === 'all' ? true : reg.status === filter
  );

  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-12">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBkZXNrJTIwbWFuYWdlcnxlbnwxfHx8fDE3NjI5ODUzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Supervisor"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-700/98 via-indigo-700/95 to-blue-700/90"></div>
        </div>

        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full shadow-2xl border-4 border-white/30">
              <GraduationCap className="h-16 w-16" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl">
            {language === 'ar' ? 'لوحة تحكم المشرف' : 'Supervisor Dashboard'}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-95 mb-2">
            {language === 'ar' 
              ? `مرحباً ${userInfo?.name || 'د. محمد رشيد'}` 
              : `Welcome ${userInfo?.name || 'Dr. Mohammed Rashid'}`}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div key="pending-stat" className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="font-bold">{pendingCount}</span>
                <span>{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
              </div>
            </div>
            <div key="approved-stat" className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold">{approvedCount}</span>
                <span>{language === 'ar' ? 'مقبول' : 'Approved'}</span>
              </div>
            </div>
            <div key="rejected-stat" className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span className="font-bold">{rejectedCount}</span>
                <span>{language === 'ar' ? 'مرفوض' : 'Rejected'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-5 w-5 text-[#184A2C]" />
          <h3 className="text-lg font-bold">
            {language === 'ar' ? 'تصفية الطلبات' : 'Filter Requests'}
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#184A2C]' : ''}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            className={filter === 'pending' ? 'bg-amber-600' : ''}
          >
            <Clock className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            className={filter === 'approved' ? 'bg-emerald-600' : ''}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'مقبول' : 'Approved'}
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
            className={filter === 'rejected' ? 'bg-red-600' : ''}
          >
            <XCircle className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'مرفوض' : 'Rejected'}
          </Button>
        </div>
      </Card>

      {/* Registrations */}
      {loading ? (
        <Card className="p-16 text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </Card>
      ) : filteredRegistrations.length === 0 ? (
        <Card className="p-16 text-center">
          <AlertCircle className="h-20 w-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">
            {language === 'ar' ? 'لا توجد طلبات' : 'No Requests'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'لا توجد طلبات تسجيل في هذا التصنيف' 
              : 'No registration requests in this category'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredRegistrations.map((reg, index) => (
            <Card
              key={reg.registration_id}
              className="p-6 hover-lift animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  {/* Student Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-gradient-to-br from-[#184A2C] to-emerald-700 p-3 rounded-xl">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">
                        {reg.student?.full_name || 'Student Name'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{reg.student?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{reg.student?.major}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {language === 'ar' ? 'المستوى' : 'Level'} {reg.student?.level}
                          </span>
                        </div>
                        {reg.student?.gpa && (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-[#D4AF37]" />
                            <span>
                              {language === 'ar' ? 'المعدل' : 'GPA'}: {reg.student.gpa.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-[#184A2C]" />
                    <span className="font-bold">
                      {language === 'ar' ? 'المقرر' : 'Course'}: {reg.course_id}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    className={`${
                      reg.status === 'pending'
                        ? 'bg-amber-500'
                        : reg.status === 'approved'
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    } text-white`}
                  >
                    {reg.status === 'pending' && (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
                      </>
                    )}
                    {reg.status === 'approved' && (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'مقبول' : 'Approved'}
                      </>
                    )}
                    {reg.status === 'rejected' && (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'مرفوض' : 'Rejected'}
                      </>
                    )}
                  </Badge>
                </div>

                {/* Actions */}
                {reg.status === 'pending' && (
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => handleApprove(reg.registration_id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'قبول' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedRegistration(reg.registration_id);
                        setRejectDialogOpen(true);
                      }}
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'رفض' : 'Reject'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تأكيد رفض التسجيل' : 'Confirm Registration Rejection'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'يرجى كتابة سبب رفضك للتسجيل قبل رفضه.'
                : 'Please provide a reason for rejecting the registration.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="reason">
              {language === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}
            </Label>
            <Textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل السبب هنا...' : 'Enter reason here...'}
              className="h-20"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedRegistration) {
                  handleReject(selectedRegistration);
                }
                setRejectDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {language === 'ar' ? 'رفض' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};