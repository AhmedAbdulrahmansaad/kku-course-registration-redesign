import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Trash2, RefreshCw, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const CleanupPage: React.FC = () => {
  const { language, t } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cleaningAll, setCleaningAll] = useState(false);

  const handleCleanupSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error(
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني'
          : 'Please enter email address'
      );
      return;
    }

    setLoading(true);

    try {
      console.log('🧹 Cleaning up orphaned user:', email);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/public/cleanup-orphaned-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (result.success) {
        if (result.cleaned) {
          toast.success(
            language === 'ar'
              ? `✅ تم تنظيف الحساب بنجاح!\n\nيمكنك الآن التسجيل باستخدام: ${email}`
              : `✅ Account cleaned successfully!\n\nYou can now register using: ${email}`,
            { duration: 6000 }
          );
          setEmail('');
        } else {
          toast.info(
            language === 'ar'
              ? 'ℹ️ لم يتم العثور على حساب يتيم بهذا البريد'
              : 'ℹ️ No orphaned account found with this email',
            { duration: 4000 }
          );
        }
      } else {
        throw new Error(result.error || 'Cleanup failed');
      }
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error(
        language === 'ar'
          ? `❌ فشل التنظيف: ${error.message}`
          : `❌ Cleanup failed: ${error.message}`,
        { duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupAll = async () => {
    const confirmed = window.confirm(
      language === 'ar'
        ? 'هل أنت متأكد؟ سيتم حذف جميع المستخدمين اليتامى من النظام.'
        : 'Are you sure? All orphaned users will be deleted from the system.'
    );

    if (!confirmed) return;

    setCleaningAll(true);

    try {
      console.log('🧹 Cleaning up all orphaned users...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/public/cleanup-all-orphaned-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(
          language === 'ar'
            ? `✅ تم تنظيف ${result.cleaned} حساب يتيم بنجاح!`
            : `✅ Successfully cleaned ${result.cleaned} orphaned accounts!`,
          { duration: 6000 }
        );

        if (result.failed > 0) {
          toast.warning(
            language === 'ar'
              ? `⚠️ فشل تنظيف ${result.failed} حساب`
              : `⚠️ Failed to clean ${result.failed} accounts`,
            { duration: 4000 }
          );
        }
      } else {
        throw new Error(result.error || 'Cleanup failed');
      }
    } catch (error: any) {
      console.error('Cleanup all error:', error);
      toast.error(
        language === 'ar'
          ? `❌ فشل التنظيف: ${error.message}`
          : `❌ Cleanup failed: ${error.message}`,
        { duration: 5000 }
      );
    } finally {
      setCleaningAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white mb-4">
          <Trash2 className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold mb-2">
          {language === 'ar' ? 'تنظيف المستخدمين اليتامى' : 'Cleanup Orphaned Users'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {language === 'ar'
            ? 'إذا واجهت مشكلة في التسجيل أو تسجيل الدخول'
            : 'If you face issues with registration or login'}
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              {language === 'ar' ? 'ما هو المستخدم اليتيم؟' : 'What is an Orphaned User?'}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {language === 'ar'
                ? 'المستخدم اليتيم هو حساب موجود في نظام المصادقة لكن غير موجود في قاعدة البيانات. يحدث هذا عندما تفشل عملية التسجيل في منتصفها.'
                : 'An orphaned user is an account that exists in the authentication system but not in the database. This happens when registration fails midway.'}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {language === 'ar'
                ? '💡 إذا ظهرت لك رسالة "البريد الإلكتروني مسجل مسبقاً" ولكنك لا تستطيع تسجيل الدخول، فأنت بحاجة لتنظيف الحساب.'
                : '💡 If you see "Email already registered" but cannot login, you need to cleanup the account.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Single User Cleanup */}
      <Card className="p-6 mb-6">
        <form onSubmit={handleCleanupSingle} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="h-6 w-6 text-kku-green dark:text-primary" />
              {language === 'ar' ? 'تنظيف حساب محدد' : 'Cleanup Specific Account'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {language === 'ar'
                ? 'أدخل البريد الإلكتروني للحساب الذي تريد تنظيفه'
                : 'Enter the email of the account you want to cleanup'}
            </p>

            <div className="space-y-2">
              <Label htmlFor="email">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@kku.edu.sa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-kku-green to-emerald-700 hover:from-emerald-700 hover:to-kku-green text-lg"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                {language === 'ar' ? 'جاري التنظيف...' : 'Cleaning...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {language === 'ar' ? 'تنظيف الحساب' : 'Cleanup Account'}
              </div>
            )}
          </Button>
        </form>
      </Card>

      {/* Cleanup All */}
      <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-200 dark:border-red-800">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-red-900 dark:text-red-100">
            <AlertCircle className="h-6 w-6" />
            {language === 'ar' ? 'تنظيف شامل (للطوارئ)' : 'Full Cleanup (Emergency)'}
          </h2>
          
          <p className="text-sm text-red-800 dark:text-red-200">
            {language === 'ar'
              ? '⚠️ هذا سيحذف جميع المستخدمين اليتامى من النظام. استخدم هذا فقط إذا كنت تواجه مشاكل متعددة.'
              : '⚠️ This will delete all orphaned users from the system. Use this only if you face multiple issues.'}
          </p>

          <Button
            onClick={handleCleanupAll}
            variant="destructive"
            className="w-full h-12 text-lg"
            disabled={cleaningAll}
          >
            {cleaningAll ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                {language === 'ar' ? 'جاري التنظيف الشامل...' : 'Full Cleanup in Progress...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {language === 'ar' ? 'تنظيف جميع الحسابات اليتيمة' : 'Cleanup All Orphaned Accounts'}
              </div>
            )}
          </Button>
        </div>
      </Card>

      {/* Success Card */}
      <Card className="p-6 mt-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              {language === 'ar' ? 'بعد التنظيف' : 'After Cleanup'}
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              {language === 'ar'
                ? '✅ بعد تنظيف الحساب بنجاح، يمكنك العودة لصفحة التسجيل وإنشاء حساب جديد بنفس البريد الإلكتروني.'
                : '✅ After successful cleanup, you can return to the registration page and create a new account with the same email.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
