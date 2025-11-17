import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  Globe, 
  Moon, 
  Sun,
  Bell,
  Mail,
  Shield,
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';

export const SystemSettingsPage: React.FC = () => {
  const { language, darkMode, toggleDarkMode, toggleLanguage } = useApp();
  
  const [settings, setSettings] = useState({
    systemName: language === 'ar' ? 'نظام تسجيل المقررات' : 'Course Registration System',
    universityName: language === 'ar' ? 'جامعة الملك خالد' : 'King Khalid University',
    supportEmail: 'support@kku.edu.sa',
    maxCreditHours: 18,
    minCreditHours: 12,
    registrationOpen: true,
    emailNotifications: true,
    autoApprove: false,
  });

  const handleSave = () => {
    // Save settings
    toast.success(
      language === 'ar' 
        ? '✅ تم حفظ الإعدادات بنجاح' 
        : '✅ Settings saved successfully'
    );
  };

  const handleReset = () => {
    // Reset to defaults
    toast.info(
      language === 'ar' 
        ? '🔄 تم إعادة تعيين الإعدادات' 
        : '🔄 Settings reset to default'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative -mx-4 -mt-8 px-4">
        <div className="absolute inset-0 h-48 bg-gradient-to-br from-[#184A2C] via-blue-700 to-blue-900 dark:from-[#0e2818] dark:via-blue-900 dark:to-black"></div>
        <div className="absolute inset-0 h-48 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-transparent to-transparent"></div>

        <div className="relative z-10 text-white py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold drop-shadow-lg">
                {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
              </h1>
              <p className="text-white/90 text-lg">
                {language === 'ar'
                  ? 'إدارة إعدادات وتكوين النظام'
                  : 'Manage system settings and configuration'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-6 w-6 text-[#184A2C]" />
          <h2 className="text-2xl font-bold">
            {language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label>{language === 'ar' ? 'اسم النظام' : 'System Name'}</Label>
            <Input
              value={settings.systemName}
              onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
            />
          </div>

          <div>
            <Label>{language === 'ar' ? 'اسم الجامعة' : 'University Name'}</Label>
            <Input
              value={settings.universityName}
              onChange={(e) => setSettings({ ...settings, universityName: e.target.value })}
            />
          </div>

          <div>
            <Label>{language === 'ar' ? 'البريد الإلكتروني للدعم' : 'Support Email'}</Label>
            <Input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Registration Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="h-6 w-6 text-[#184A2C]" />
          <h2 className="text-2xl font-bold">
            {language === 'ar' ? 'إعدادات التسجيل' : 'Registration Settings'}
          </h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'ar' ? 'الحد الأقصى للساعات' : 'Max Credit Hours'}</Label>
              <Input
                type="number"
                value={settings.maxCreditHours}
                onChange={(e) => setSettings({ ...settings, maxCreditHours: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>{language === 'ar' ? 'الحد الأدنى للساعات' : 'Min Credit Hours'}</Label>
              <Input
                type="number"
                value={settings.minCreditHours}
                onChange={(e) => setSettings({ ...settings, minCreditHours: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'فتح التسجيل' : 'Registration Open'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'السماح للطلاب بتسجيل المقررات' 
                    : 'Allow students to register for courses'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.registrationOpen}
              onCheckedChange={(checked) => setSettings({ ...settings, registrationOpen: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'إرسال إشعارات عبر البريد الإلكتروني' 
                    : 'Send email notifications'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'الموافقة التلقائية' : 'Auto Approve'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'الموافقة التلقائية على طلبات التسجيل' 
                    : 'Automatically approve registration requests'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.autoApprove}
              onCheckedChange={(checked) => setSettings({ ...settings, autoApprove: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          {darkMode ? <Moon className="h-6 w-6 text-[#184A2C]" /> : <Sun className="h-6 w-6 text-[#184A2C]" />}
          <h2 className="text-2xl font-bold">
            {language === 'ar' ? 'إعدادات المظهر' : 'Appearance Settings'}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'الوضع الداكن' : 'Dark Mode'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? 'تبديل بين الوضع الفاتح والداكن' 
                    : 'Toggle between light and dark mode'}
                </p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  {language === 'ar' ? 'اللغة' : 'Language'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'العربية' : 'English'}
                </p>
              </div>
            </div>
            <Button onClick={toggleLanguage} variant="outline">
              {language === 'ar' ? 'English' : 'عربي'}
            </Button>
          </div>
        </div>
      </Card>

      {/* System Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="h-6 w-6 text-[#184A2C]" />
          <h2 className="text-2xl font-bold">
            {language === 'ar' ? 'حالة النظام' : 'System Status'}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <p className="text-sm font-medium">
                {language === 'ar' ? 'قاعدة البيانات' : 'Database'}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700">
              {language === 'ar' ? 'متصل' : 'Connected'}
            </Badge>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <p className="text-sm font-medium">
                {language === 'ar' ? 'الخادم' : 'Server'}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700">
              {language === 'ar' ? 'يعمل' : 'Running'}
            </Badge>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <p className="text-sm font-medium">
                {language === 'ar' ? 'المصادقة' : 'Auth'}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700">
              {language === 'ar' ? 'نشط' : 'Active'}
            </Badge>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <p className="text-sm font-medium">
                {language === 'ar' ? 'API' : 'API'}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700">
              {language === 'ar' ? 'جاهز' : 'Ready'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          <Save className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </Button>

        <Button
          onClick={handleReset}
          variant="outline"
          className="flex-1"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
        </Button>
      </div>
    </div>
  );
};
