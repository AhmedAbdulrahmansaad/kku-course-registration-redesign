import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Bell, Check, X, AlertCircle, UserPlus, FileText, Settings, Clock } from 'lucide-react';
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
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Notification {
  notification_id: string;
  user_id: string;
  user_role: 'student' | 'supervisor' | 'admin';
  type: 
    | 'registration_approved' 
    | 'registration_rejected' 
    | 'new_request'
    | 'student_registered'
    | 'system_update'
    | 'course_added'
    | 'user_added';
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  related_id?: string;
  read: boolean;
  created_at: string;
  read_at?: string;
}

export const UnifiedNotificationsDropdown: React.FC = () => {
  const { language, isLoggedIn, userInfo } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const prevUnreadCountRef = useRef<number>(0);
  const hasShownToastRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isLoggedIn && userInfo) {
      fetchNotifications();
      // Fetch notifications every 10 seconds for real-time updates
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, userInfo]);

  // Show toast for new notifications
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current > 0) {
      // Get the latest unread notification
      const latestUnread = notifications.find(n => !n.read && !hasShownToastRef.current.has(n.notification_id));
      if (latestUnread) {
        hasShownToastRef.current.add(latestUnread.notification_id);
        
        const title = language === 'ar' ? latestUnread.title_ar : latestUnread.title_en;
        const message = language === 'ar' ? latestUnread.message_ar : latestUnread.message_en;
        
        // Show toast based on notification type
        if (latestUnread.type === 'registration_approved') {
          toast.success(`${title}\n${message}`, {
            duration: 5000,
            icon: '✅',
          });
        } else if (latestUnread.type === 'registration_rejected') {
          toast.error(`${title}\n${message}`, {
            duration: 5000,
            icon: '❌',
          });
        } else if (latestUnread.type === 'new_request') {
          toast.info(`${title}\n${message}`, {
            duration: 5000,
            icon: '📋',
          });
        } else {
          toast.info(`${title}\n${message}`, {
            duration: 5000,
            icon: '🔔',
          });
        }
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, notifications, language]);

  const fetchNotifications = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken || !userInfo) return;

      // Determine endpoint based on user role
      let endpoint = '';
      if (userInfo.role === 'student' || !userInfo.role) {
        endpoint = '/student/notifications';
      } else if (userInfo.role === 'supervisor') {
        endpoint = '/supervisor/notifications';
      } else if (userInfo.role === 'admin') {
        endpoint = '/admin/notifications';
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const newNotifications = result.notifications || [];
        setNotifications(newNotifications);
        const newUnreadCount = newNotifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(newUnreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken || !userInfo) return;

      let endpoint = '';
      if (userInfo.role === 'student' || !userInfo.role) {
        endpoint = '/student/notification/read';
      } else if (userInfo.role === 'supervisor') {
        endpoint = '/supervisor/notification/read';
      } else if (userInfo.role === 'admin') {
        endpoint = '/admin/notification/read';
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a${endpoint}`,
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
      if (!accessToken || !userInfo) return;

      let endpoint = '';
      if (userInfo.role === 'student' || !userInfo.role) {
        endpoint = '/student/notifications/read-all';
      } else if (userInfo.role === 'supervisor') {
        endpoint = '/supervisor/notifications/read-all';
      } else if (userInfo.role === 'admin') {
        endpoint = '/admin/notifications/read-all';
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a${endpoint}`,
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
      case 'new_request':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'student_registered':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'system_update':
        return <Settings className="h-4 w-4 text-purple-500" />;
      case 'course_added':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'user_added':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
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

  if (!isLoggedIn || !userInfo) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>{language === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
              className="h-6 text-xs"
            >
              {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
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
          <ScrollArea className="h-[450px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.notification_id}
                className={`flex flex-col items-start p-4 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-accent/50 hover:bg-accent/70' : 'hover:bg-accent/30'
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
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {language === 'ar' ? notification.message_ar : notification.message_en}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
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
