import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Bell, Check, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

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

export const NotificationsDropdown: React.FC = () => {
  const { language, isLoggedIn } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      // Fetch notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/student/notifications`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.notifications || []);
        setUnreadCount(result.notifications?.filter((n: Notification) => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.notification_id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
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
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success(
          language === 'ar'
            ? '✅ تم تحديد جميع الإشعارات كمقروءة'
            : '✅ All notifications marked as read'
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error(
        language === 'ar' ? '❌ فشل تحديد الإشعارات' : '❌ Failed to mark notifications'
      );
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'registration_approved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'registration_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (language === 'ar') {
      if (diffInSeconds < 60) return 'الآن';
      if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
      if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
      return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    } else {
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
              className="h-6 text-xs"
            >
              {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.notification_id}
                className={`flex flex-col items-start p-4 cursor-pointer ${
                  !notification.read ? 'bg-accent/50' : ''
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.notification_id);
                  }
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">
                      {language === 'ar' ? notification.title_ar : notification.title_en}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {language === 'ar' ? notification.message_ar : notification.message_en}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
