import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Mail, Phone, Globe, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export const ContactPage: React.FC = () => {
  const { language, t } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = language === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = language === 'ar' ? 'الموضوع مطلوب' : 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = language === 'ar' ? 'الرسالة مطلوبة' : 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = language === 'ar' ? 'الرسالة قصيرة جداً (10 أحرف على الأقل)' : 'Message is too short (min 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error(
        language === 'ar' 
          ? '⚠️ يرجى تصحيح الأخطاء في النموذج' 
          : '⚠️ Please fix the errors in the form'
      );
      return;
    }

    setLoading(true);

    try {
      // Simulate sending message (you can replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Success
      setSubmitted(true);
      toast.success(
        language === 'ar' 
          ? '✅ تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' 
          : '✅ Message sent successfully! We will contact you soon.'
      );
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSubmitted(false);
        setErrors({});
      }, 3000);

    } catch (error) {
      console.error('Error sending contact message:', error);
      toast.error(
        language === 'ar' 
          ? '❌ حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.' 
          : '❌ Error sending message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-8">
      {/* Enhanced Hero Header with Gradient Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-12">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1683117927786-f146451082fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250YWN0JTIwZW1haWwlMjBzdXBwb3J0fGVufDF8fHx8MTc2Mjk3ODMxN3ww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Contact"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/98 via-blue-600/95 to-indigo-600/90"></div>
        </div>

        <div className="relative z-10 text-center py-20 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-full animate-pulse-soft border-4 border-white/30 shadow-2xl">
              <Mail className="h-16 w-16" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-2xl">
            {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
          </h1>
          
          <p className="text-xl md:text-2xl opacity-95 max-w-3xl mx-auto drop-shadow-lg">
            {language === 'ar'
              ? 'نحن هنا للإجابة على استفساراتك ومساعدتك'
              : 'We are here to answer your questions and help you'}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span>{language === 'ar' ? 'دعم سريع' : 'Fast Support'}</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                <span>{language === 'ar' ? 'متاح 24/7' : 'Available 24/7'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Information - Enhanced */}
        <div className="space-y-6">
          <Card className="p-8 shadow-xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#184A2C] dark:hover:border-primary transition-all">
            <h3 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
              <Mail className="h-8 w-8 text-[#184A2C] dark:text-primary" />
              {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#184A2C]/5 to-[#D4AF37]/5 rounded-xl hover:from-[#184A2C]/10 hover:to-[#D4AF37]/10 transition-all">
                <div className="p-3 bg-gradient-to-br from-[#184A2C] to-emerald-700 rounded-xl shadow-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-2 text-lg">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </h4>
                  <a
                    href="mailto:sraj3225@gmail.com"
                    className="text-muted-foreground hover:text-[#184A2C] dark:hover:text-primary font-medium transition-colors"
                  >
                    sraj3225@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#184A2C]/5 to-[#D4AF37]/5 rounded-xl hover:from-[#184A2C]/10 hover:to-[#D4AF37]/10 transition-all">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-2 text-lg">
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </h4>
                  <a
                    href="tel:+966502232978"
                    className="text-muted-foreground hover:text-[#184A2C] dark:hover:text-primary font-medium transition-colors"
                    dir="ltr"
                  >
                    +966 50 223 2978
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#184A2C]/5 to-[#D4AF37]/5 rounded-xl hover:from-[#184A2C]/10 hover:to-[#D4AF37]/10 transition-all">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-2 text-lg">
                    {language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}
                  </h4>
                  <a
                    href="https://www.kku.edu.sa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[#184A2C] dark:hover:text-primary font-medium transition-colors"
                  >
                    www.kku.edu.sa
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#184A2C]/5 to-[#D4AF37]/5 rounded-xl hover:from-[#184A2C]/10 hover:to-[#D4AF37]/10 transition-all">
                <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-2 text-lg">
                    {language === 'ar' ? 'العنوان' : 'Address'}
                  </h4>
                  <p className="text-muted-foreground font-medium">
                    {language === 'ar'
                      ? 'جامعة الملك خالد - كلية إدارة الأعمال'
                      : 'King Khalid University - College of Business'}
                  </p>
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'أبها، المملكة العربية السعودية' : 'Abha, Saudi Arabia'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[#184A2C]/10 to-[#D4AF37]/10 border-2 border-[#184A2C]/30 dark:border-primary/30 shadow-xl">
            <h4 className="font-bold mb-3 text-xl text-[#184A2C] dark:text-primary flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              {language === 'ar' ? 'المشرف الأكاديمي' : 'Academic Supervisor'}
            </h4>
            <p className="text-2xl font-bold mb-2 gradient-text">
              {language === 'ar' ? 'د. محمد رشيد' : 'Dr. Mohammed Rashid'}
            </p>
            <p className="text-muted-foreground font-medium">
              {language === 'ar' ? 'قسم المعلوماتية الإدارية' : 'Department of Business Informatics'}
            </p>
          </Card>
        </div>

        {/* Contact Form - Enhanced */}
        <Card className={`p-8 shadow-xl border-2 transition-all ${
          submitted 
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-[#184A2C] dark:hover:border-primary'
        }`}>
          {submitted ? (
            <div className="text-center py-12 animate-scale-in">
              <div className="mb-6 flex justify-center">
                <div className="bg-emerald-500 p-6 rounded-full shadow-xl">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-emerald-600 dark:text-emerald-400">
                {language === 'ar' ? '✅ تم الإرسال بنجاح!' : '✅ Successfully Sent!'}
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                {language === 'ar' 
                  ? 'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.' 
                  : 'Thank you for contacting us. We will respond as soon as possible.'}
              </p>
              <div className="bg-white dark:bg-card p-4 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' 
                    ? '📧 ستتلقى رداً على: ' 
                    : '📧 You will receive a response at: '}
                  <span className="font-bold text-[#184A2C] dark:text-primary">{formData.email}</span>
                </p>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-bold mb-6 gradient-text flex items-center gap-3">
                <Send className="h-8 w-8 text-[#184A2C] dark:text-primary" />
                {language === 'ar' ? 'أرسل رسالة' : 'Send a Message'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-base font-bold">
                    {language === 'ar' ? 'الاسم *' : 'Name *'}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setErrors({ ...errors, name: '' });
                    }}
                    className={`mt-2 h-12 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-2'}`}
                    placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-base font-bold">
                    {language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setErrors({ ...errors, email: '' });
                    }}
                    className={`mt-2 h-12 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-2'}`}
                    placeholder={language === 'ar' ? 'example@kku.edu.sa' : 'example@kku.edu.sa'}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subject" className="text-base font-bold">
                    {language === 'ar' ? 'الموضوع *' : 'Subject *'}
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                      setErrors({ ...errors, subject: '' });
                    }}
                    className={`mt-2 h-12 ${errors.subject ? 'border-red-500 focus:border-red-500' : 'border-2'}`}
                    placeholder={language === 'ar' ? 'موضوع الرسالة' : 'Message subject'}
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="message" className="text-base font-bold">
                    {language === 'ar' ? 'الرسالة *' : 'Message *'}
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      setErrors({ ...errors, message: '' });
                    }}
                    rows={6}
                    className={`mt-2 ${errors.message ? 'border-red-500 focus:border-red-500' : 'border-2'}`}
                    placeholder={language === 'ar' ? 'اكتب رسالتك هنا (10 أحرف على الأقل)' : 'Write your message here (min 10 characters)'}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#184A2C] to-emerald-700 hover:from-[#184A2C]/90 hover:to-emerald-700/90 shadow-xl hover:shadow-2xl transition-all"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner h-5 w-5" />
                      {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                    </div>
                  ) : (
                    <>
                      <Send className="h-5 w-5 me-2" />
                      {language === 'ar' ? '📤 إرسال الرسالة' : '📤 Send Message'}
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  {language === 'ar' 
                    ? '* جميع الحقول مطلوبة' 
                    : '* All fields are required'}
                </p>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
