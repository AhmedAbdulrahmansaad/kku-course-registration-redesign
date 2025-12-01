import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Bell,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  Trash2,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface Notification {
  id: string;
  user_id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  read: boolean;
  created_at: string;
  related_id?: string; // معرف المقرر أو الطلب المرتبط
  action_url?: string; // رابط للانتقال للصفحة المرتبطة
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { language, userInfo } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        console.warn('⚠️ [Notifications] No access token');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/notifications`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Notifications] Fetched notifications:', result.notifications);
        setNotifications(result.notifications || []);
        setUnreadCount(result.unreadCount || 0);
      } else {
        console.error('❌ [Notifications] Failed to fetch:', response.status);
      }
    } catch (error) {
      console.error('❌ [Notifications] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        console.log('✅ [Notifications] Marked as read:', notificationId);
        // تحديث الإشعار محلياً
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ [Notifications] Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        console.log('✅ [Notifications] Marked all as read');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success(
          language === 'ar' ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read'
        );
      }
    } catch (error) {
      console.error('❌ [Notifications] Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1573e40a/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        console.log('✅ [Notifications] Deleted:', notificationId);
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success(
          language === 'ar' ? 'تم حذف الإشعار' : 'Notification deleted'
        );
      }
    } catch (error) {
      console.error('❌ [Notifications] Error deleting:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    const opacity = read ? '20' : '40';
    switch (type) {
      case 'success':
        return `bg-green-50 dark:bg-green-950/${opacity} border-green-200 dark:border-green-800`;
      case 'error':
        return `bg-red-50 dark:bg-red-950/${opacity} border-red-200 dark:border-red-800`;
      case 'warning':
        return `bg-yellow-50 dark:bg-yellow-950/${opacity} border-yellow-200 dark:border-yellow-800`;
      default:
        return `bg-blue-50 dark:bg-blue-950/${opacity} border-blue-200 dark:border-blue-800`;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return language === 'ar' ? 'الآن' : 'Now';
    } else if (diffMins < 60) {
      return language === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return language === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return language === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 ${
          language === 'ar' ? 'left-0' : 'right-0'
        } h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 animate-slide-in-right overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#184A2C] to-emerald-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </h2>
              {unreadCount > 0 && (
                <p className="text-sm opacity-90">
                  {language === 'ar'
                    ? `${unreadCount} إشعار جديد`
                    : `${unreadCount} new`}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="p-3 border-b flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex-1"
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark All Read'}
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#184A2C]"></div>
              <p className="mt-4 text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bell className="h-20 w-20 text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-bold mb-2">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No Notifications'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? 'ستظهر إشعاراتك هنا'
                  : 'Your notifications will appear here'}
              </p>
            </div>
          ) : (
            notifications.map(notification => (
              <Card
                key={notification.id}
                className={`p-4 border-2 transition-all hover:shadow-md ${getNotificationBg(
                  notification.type,
                  notification.read
                )} ${!notification.read ? 'ring-2 ring-offset-2 ring-[#184A2C]/20' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm">
                        {language === 'ar'
                          ? notification.title_ar
                          : notification.title_en}
                      </h3>
                      {!notification.read && (
                        <Badge className="bg-[#184A2C] text-white text-xs px-2 py-0.5">
                          {language === 'ar' ? 'جديد' : 'New'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {language === 'ar'
                        ? notification.message_ar
                        : notification.message_en}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(notification.created_at)}
                      </div>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-7 px-2 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {language === 'ar' ? 'تحديد كمقروء' : 'Mark Read'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
};
