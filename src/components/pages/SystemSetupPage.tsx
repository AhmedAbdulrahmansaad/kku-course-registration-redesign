import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  BookOpen,
  Users,
  Shield,
  Settings,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const SystemSetupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [step, setStep] = useState(0);
  const [adminCredentials, setAdminCredentials] = useState({
    email: 'admin@kku.edu.sa',
    password: 'Admin@123',
    name: 'مدير النظام',
    studentId: 'admin'
  });

  const setupSteps = [
    { id: 'courses', label: 'تحميل 49 مقرر دراسي', icon: BookOpen },
    { id: 'admin', label: 'إنشاء حساب المدير', icon: Shield },
    { id: 'supervisor', label: 'إنشاء حساب المشرف التجريبي', icon: Users },
    { id: 'student', label: 'إنشاء حساب الطالب التجريبي', icon: Users },
  ];

  const handleFullSetup = async () => {
    try {
      setLoading(true);
      setStep(0);
      
      // الخطوة 1: تحميل المقررات
      setStep(1);
      toast.loading('جاري تحميل المقررات الدراسية...');
      
      const coursesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/init-courses`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!coursesResponse.ok) {
        throw new Error('فشل في تحميل المقررات');
      }

      const coursesResult = await coursesResponse.json();
      console.log('✅ Courses loaded:', coursesResult);
      toast.success(`✅ تم تحميل ${coursesResult.created} مقرر دراسي`);

      // الخطوة 2: إنشاء حساب المدير
      setStep(2);
      toast.loading('جاري إنشاء حساب المدير...');
      
      const adminResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/setup/create-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(adminCredentials),
        }
      );

      if (!adminResponse.ok) {
        const error = await adminResponse.json();
        throw new Error(error.error || 'فشل في إنشاء حساب المدير');
      }

      const adminResult = await adminResponse.json();
      console.log('✅ Admin created:', adminResult);
      toast.success('✅ تم إنشاء حساب المدير بنجاح');

      // الخطوة 3: إنشاء مشرف تجريبي
      setStep(3);
      toast.loading('جاري إنشاء حساب المشرف التجريبي...');
      
      const supervisorResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/setup/create-supervisor`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!supervisorResponse.ok) {
        throw new Error('فشل في إنشاء حساب المشرف');
      }

      const supervisorResult = await supervisorResponse.json();
      console.log('✅ Supervisor created:', supervisorResult);
      toast.success('✅ تم إنشاء حساب المشرف التجريبي');

      // الخطوة 4: إنشاء طالب تجريبي
      setStep(4);
      toast.loading('جاري إنشاء حساب الطالب التجريبي...');
      
      const studentResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/setup/create-student`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!studentResponse.ok) {
        throw new Error('فشل في إنشاء حساب الطالب');
      }

      const studentResult = await studentResponse.json();
      console.log('✅ Student created:', studentResult);
      toast.success('✅ تم إنشاء حساب الطالب التجريبي');

      // اكتمال التهيئة
      setSetupComplete(true);
      toast.success('🎉 تم إعداد النظام بنجاح!', {
        description: 'يمكنك الآن البدء باستخدام النظام',
        duration: 5000,
      });

    } catch (error: any) {
      console.error('❌ Setup error:', error);
      toast.error(`فشل في إعداد النظام: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#184A2C] via-emerald-700 to-emerald-900">
        <Card className="max-w-2xl w-full p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            🎉 تم إعداد النظام بنجاح!
          </h1>
          
          <p className="text-muted-foreground mb-8 text-lg">
            النظام الآن جاهز للاستخدام. يمكنك تسجيل الدخول بأحد الحسابات التالية:
          </p>

          <div className="space-y-4 text-right">
            <Card className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="font-bold text-red-900 dark:text-red-100">حساب المدير</h3>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>البريد:</strong> {adminCredentials.email}<br />
                <strong>كلمة المرور:</strong> {adminCredentials.password}
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-blue-900 dark:text-blue-100">حساب المشرف الأكاديمي</h3>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>الرقم الوظيفي:</strong> supervisor1<br />
                <strong>كلمة المرور:</strong> password
              </p>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-bold text-green-900 dark:text-green-100">حساب الطالب التجريبي</h3>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>الرقم الجامعي:</strong> 442100001<br />
                <strong>كلمة المرور:</strong> password
              </p>
            </Card>
          </div>

          <div className="mt-8">
            <Button
              onClick={() => window.location.href = '/'}
              size="lg"
              className="bg-gradient-to-r from-[#184A2C] to-emerald-700 hover:from-[#0e2818] hover:to-emerald-800"
            >
              <ArrowRight className="h-5 w-5 ml-2 rotate-180" />
              الذهاب إلى صفحة تسجيل الدخول
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#184A2C] via-emerald-700 to-emerald-900">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#184A2C] p-4 rounded-full">
              <Database className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            إعداد نظام تسجيل المقررات
          </h1>
          <p className="text-muted-foreground">
            جامعة الملك خالد - كلية إدارة الأعمال
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                تنبيه: التهيئة الأولية للنظام
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                قاعدة البيانات فارغة. يجب تشغيل عملية الإعداد الأولي لتحميل البيانات الأساسية وإنشاء الحسابات الضرورية.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Label className="text-base font-bold mb-3 block">
            بيانات حساب المدير:
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                value={adminCredentials.email}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div>
              <Label>الاسم الكامل</Label>
              <Input
                value={adminCredentials.name}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div>
              <Label>الرقم الوظيفي</Label>
              <Input
                value={adminCredentials.studentId}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, studentId: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="font-bold">خطوات الإعداد:</h3>
          {setupSteps.map((s, index) => {
            const StepIcon = s.icon;
            const isActive = step === index + 1;
            const isComplete = step > index + 1;
            
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700'
                    : isComplete
                    ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : (
                  <StepIcon className="h-5 w-5 text-gray-400" />
                )}
                <span className={isComplete ? 'text-green-700 dark:text-green-300' : ''}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleFullSetup}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#184A2C] to-emerald-700 hover:from-[#0e2818] hover:to-emerald-800"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              جاري الإعداد... (الخطوة {step} من {setupSteps.length})
            </>
          ) : (
            <>
              <Settings className="h-5 w-5 mr-2" />
              بدء إعداد النظام
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center mt-4">
          ⚠️ يُرجى عدم إغلاق الصفحة أثناء عملية الإعداد
        </p>
      </Card>
    </div>
  );
};
