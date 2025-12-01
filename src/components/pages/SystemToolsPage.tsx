import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Trash2, 
  RefreshCw, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Shield,
  Database,
  Zap
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

interface OrphanedUser {
  id: string;
  email: string;
  created_at: string;
}

interface CleanupResult {
  email: string;
  id: string;
  status: 'deleted' | 'failed';
  error?: string;
}

export const SystemToolsPage: React.FC = () => {
  const { language, t, userInfo, accessToken } = useApp();
  const [orphanedUsers, setOrphanedUsers] = useState<OrphanedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<CleanupResult[] | null>(null);

  // التحقق من صلاحيات المدير
  if (userInfo?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl mb-2">
            {language === 'ar' ? 'غير مصرح' : 'Unauthorized'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ar' 
              ? 'هذه الصفحة متاحة للمديرين فقط'
              : 'This page is only available for admins'}
          </p>
        </Card>
      </div>
    );
  }

  // جلب قائمة المستخدمين اليتامى
  const fetchOrphanedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/list-orphaned-users`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setOrphanedUsers(data.orphanedUsers || []);
        toast.success(
          language === 'ar'
            ? `تم العثور على ${data.count} مستخدم يتيم`
            : `Found ${data.count} orphaned users`
        );
      } else {
        toast.error(data.error || 'Failed to fetch orphaned users');
      }
    } catch (error: any) {
      console.error('Error fetching orphaned users:', error);
      toast.error(
        language === 'ar'
          ? 'فشل في جلب المستخدمين اليتامى'
          : 'Failed to fetch orphaned users'
      );
    } finally {
      setLoading(false);
    }
  };

  // تنظيف المستخدمين اليتامى
  const cleanupOrphanedUsers = async () => {
    if (!confirm(
      language === 'ar'
        ? `هل أنت متأكد من حذف ${orphanedUsers.length} مستخدم يتيم؟ هذا الإجراء لا يمكن التراجع عنه.`
        : `Are you sure you want to delete ${orphanedUsers.length} orphaned users? This action cannot be undone.`
    )) {
      return;
    }

    setCleanupLoading(true);
    setCleanupResults(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/admin/cleanup-orphaned-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCleanupResults(data.results);
        toast.success(
          language === 'ar'
            ? `تم حذف ${data.cleaned} مستخدم بنجاح`
            : `Successfully deleted ${data.cleaned} users`
        );
        
        // إعادة جلب القائمة
        setTimeout(() => {
          fetchOrphanedUsers();
        }, 1000);
      } else {
        toast.error(data.error || 'Cleanup failed');
      }
    } catch (error: any) {
      console.error('Error cleaning up orphaned users:', error);
      toast.error(
        language === 'ar'
          ? 'فشل في تنظيف المستخدمين اليتامى'
          : 'Failed to cleanup orphaned users'
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-[#184A2C]" />
            <h1 className="text-4xl text-[#184A2C] dark:text-[#D4AF37]">
              {language === 'ar' ? 'أدوات النظام' : 'System Tools'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ar'
              ? 'أدوات إدارية لصيانة وتنظيف النظام'
              : 'Administrative tools for system maintenance and cleanup'}
          </p>
        </div>

        {/* System Info */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl">
              {language === 'ar' ? 'معلومات النظام' : 'System Information'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'قاعدة البيانات' : 'Database'}
              </div>
              <div className="text-lg">PostgreSQL (Supabase)</div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'المصادقة' : 'Authentication'}
              </div>
              <div className="text-lg">Supabase Auth</div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar' ? 'الحالة' : 'Status'}
              </div>
              <div className="text-lg flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                {language === 'ar' ? 'متصل' : 'Connected'}
              </div>
            </div>
          </div>
        </Card>

        {/* Orphaned Users Cleanup Tool */}
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-yellow-200 dark:border-yellow-900">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-xl">
              {language === 'ar' ? 'تنظيف المستخدمين اليتامى' : 'Orphaned Users Cleanup'}
            </h2>
          </div>

          <Alert className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-300">
              {language === 'ar'
                ? 'المستخدمون اليتامى هم حسابات موجودة في نظام المصادقة ولكن ليس لها سجلات في قاعدة البيانات. هذا يحدث عند فشل عملية التسجيل في منتصفها.'
                : 'Orphaned users are accounts that exist in the authentication system but have no corresponding records in the database. This happens when signup fails midway.'}
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 mb-6">
            <Button
              onClick={fetchOrphanedUsers}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} animate-spin`} />
                  {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                </>
              ) : (
                <>
                  <Search className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'البحث عن المستخدمين اليتامى' : 'Search for Orphaned Users'}
                </>
              )}
            </Button>

            {orphanedUsers.length > 0 && (
              <Button
                onClick={cleanupOrphanedUsers}
                disabled={cleanupLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {cleanupLoading ? (
                  <>
                    <RefreshCw className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} animate-spin`} />
                    {language === 'ar' ? 'جاري التنظيف...' : 'Cleaning...'}
                  </>
                ) : (
                  <>
                    <Trash2 className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? `حذف ${orphanedUsers.length} مستخدم` : `Delete ${orphanedUsers.length} Users`}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Orphaned Users List */}
          {orphanedUsers.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
              <h3 className="text-lg mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                {language === 'ar' 
                  ? `تم العثور على ${orphanedUsers.length} مستخدم يتيم`
                  : `Found ${orphanedUsers.length} Orphaned Users`}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {orphanedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                  >
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? 'تاريخ الإنشاء: ' : 'Created: '}
                        {new Date(user.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                      {language === 'ar' ? 'يتيم' : 'Orphaned'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cleanup Results */}
          {cleanupResults && cleanupResults.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                {language === 'ar' ? 'نتائج التنظيف' : 'Cleanup Results'}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cleanupResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.status === 'deleted'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{result.email}</div>
                      {result.error && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {result.error}
                        </div>
                      )}
                    </div>
                    {result.status === 'deleted' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {orphanedUsers.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p>
                {language === 'ar'
                  ? 'لا توجد مستخدمين يتامى. النظام نظيف! ✨'
                  : 'No orphaned users found. System is clean! ✨'}
              </p>
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-700 border-2 border-purple-200 dark:border-purple-900">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            {language === 'ar' ? 'تعليمات الاستخدام' : 'Usage Instructions'}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center">
                1
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {language === 'ar'
                  ? 'اضغط على "البحث عن المستخدمين اليتامى" للتحقق من وجود حسابات يتيمة'
                  : 'Click "Search for Orphaned Users" to check for orphaned accounts'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center">
                2
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {language === 'ar'
                  ? 'راجع قائمة الحسابات اليتيمة المعروضة'
                  : 'Review the list of orphaned accounts displayed'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center">
                3
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {language === 'ar'
                  ? 'اضغط على "حذف" لتنظيف جميع الحسابات اليتيمة مرة واحدة'
                  : 'Click "Delete" to clean all orphaned accounts at once'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center">
                4
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {language === 'ar'
                  ? 'تحقق من نتائج التنظيف للتأكد من نجاح العملية'
                  : 'Check cleanup results to verify successful operation'}
              </p>
            </div>
          </div>
        </Card>

        {/* Warning */}
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-sm text-red-800 dark:text-red-300">
            {language === 'ar'
              ? '⚠️ تحذير: عملية الحذف لا يمكن التراجع عنها. تأكد من مراجعة القائمة جيداً قبل الحذف.'
              : '⚠️ Warning: Deletion is irreversible. Make sure to review the list carefully before deleting.'}
          </AlertDescription>
        </Alert>

      </div>
    </div>
  );
};
