import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  BookOpen,
  X,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';

interface Notification {
  notification_id: string;
  student_id: string;
  type: 'registration_approved' | 'registration_rejected';
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  course_id: string;
  registration_id: string;
  read: boolean;
  created_at: string;
  read_at?: string;
}

export const NotificationsPanel: React.FC = () => {
  const { language } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/notifications`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setNotifications(result.notifications || []);
      } else {
        console.error('Failed to fetch notifications:', result.error);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/notification/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ notificationId }),
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success(
          language === 'ar'
            ? 'تم تحديد جميع الإشعارات كمقروءة'
            : 'All notifications marked as read'
        );
      }
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className={language === 'ar' ? 'right-auto left-0' : ''}>
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#184A2C]" />
              <span>{language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            {language === 'ar'
              ? `لديك ${unreadCount} إشعار${unreadCount !== 1 ? 'ات' : ''} غير مقروء${unreadCount !== 1 ? 'ة' : ''}`
              : `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-150px)] mt-6">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner h-8 w-8" />
              </div>
            ) : notifications.length === 0 ? (
              <Card className="p-8 text-center">
                <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                </p>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.notification_id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.notification_id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        notification.type === 'registration_approved'
                          ? 'bg-emerald-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {notification.type === 'registration_approved' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm">
                          {language === 'ar'
                            ? notification.title_ar
                            : notification.title_en}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === 'ar'
                          ? notification.message_ar
                          : notification.message_en}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(notification.created_at).toLocaleDateString(
                              language === 'ar' ? 'ar-SA' : 'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{notification.course_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
