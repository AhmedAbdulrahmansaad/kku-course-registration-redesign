// Notification Endpoints for Supervisor and Admin
import { Hono } from 'npm:hono';
import * as kv from './kv_store.ts';

// ===============================
// SUPERVISOR NOTIFICATIONS
// ===============================

export function addSupervisorNotificationEndpoints(app: any, supabase: any) {
  // Get supervisor notifications
  app.get('/make-server-1573e40a/supervisor/notifications', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const supervisorId = await kv.get(`auth:${user.id}`);
      if (!supervisorId) {
        return c.json({ notifications: [] });
      }

      const notificationIds = await kv.get(`supervisor:${supervisorId}:notifications`) || [];
      
      const notifications = [];
      for (const notifId of notificationIds) {
        const notif = await kv.get(`notification:${notifId}`);
        if (notif) {
          notifications.push(notif);
        }
      }

      // Sort by created_at descending
      notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return c.json({ notifications });
    } catch (error: any) {
      console.error('Error in supervisor/notifications endpoint:', error);
      return c.json({ error: 'Failed to get notifications' }, 500);
    }
  });

  // Mark supervisor notification as read
  app.post('/make-server-1573e40a/supervisor/notification/read', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { notificationId } = await c.req.json();
      if (!notificationId) {
        return c.json({ error: 'Missing notification ID' }, 400);
      }

      const notification = await kv.get(`notification:${notificationId}`);
      if (!notification) {
        return c.json({ error: 'Notification not found' }, 404);
      }

      notification.read = true;
      notification.read_at = new Date().toISOString();
      await kv.set(`notification:${notificationId}`, notification);

      return c.json({ success: true });
    } catch (error: any) {
      console.error('Error in mark supervisor notification as read:', error);
      return c.json({ error: 'Failed to mark notification as read' }, 500);
    }
  });

  // Mark all supervisor notifications as read
  app.post('/make-server-1573e40a/supervisor/notifications/read-all', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const supervisorId = await kv.get(`auth:${user.id}`);
      if (!supervisorId) {
        return c.json({ success: true });
      }

      const notificationIds = await kv.get(`supervisor:${supervisorId}:notifications`) || [];
      
      for (const notifId of notificationIds) {
        const notif = await kv.get(`notification:${notifId}`);
        if (notif && !notif.read) {
          notif.read = true;
          notif.read_at = new Date().toISOString();
          await kv.set(`notification:${notifId}`, notif);
        }
      }

      return c.json({ success: true });
    } catch (error: any) {
      console.error('Error in mark all supervisor notifications as read:', error);
      return c.json({ error: 'Failed to mark all notifications as read' }, 500);
    }
  });
}

// ===============================
// ADMIN NOTIFICATIONS
// ===============================

export function addAdminNotificationEndpoints(app: any, supabase: any) {
  // Get admin notifications
  app.get('/make-server-1573e40a/admin/notifications', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const adminId = await kv.get(`auth:${user.id}`);
      if (!adminId) {
        return c.json({ notifications: [] });
      }

      const notificationIds = await kv.get(`admin:${adminId}:notifications`) || [];
      
      const notifications = [];
      for (const notifId of notificationIds) {
        const notif = await kv.get(`notification:${notifId}`);
        if (notif) {
          notifications.push(notif);
        }
      }

      // Sort by created_at descending
      notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return c.json({ notifications });
    } catch (error: any) {
      console.error('Error in admin/notifications endpoint:', error);
      return c.json({ error: 'Failed to get notifications' }, 500);
    }
  });

  // Mark admin notification as read
  app.post('/make-server-1573e40a/admin/notification/read', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { notificationId } = await c.req.json();
      if (!notificationId) {
        return c.json({ error: 'Missing notification ID' }, 400);
      }

      const notification = await kv.get(`notification:${notificationId}`);
      if (!notification) {
        return c.json({ error: 'Notification not found' }, 404);
      }

      notification.read = true;
      notification.read_at = new Date().toISOString();
      await kv.set(`notification:${notificationId}`, notification);

      return c.json({ success: true });
    } catch (error: any) {
      console.error('Error in mark admin notification as read:', error);
      return c.json({ error: 'Failed to mark notification as read' }, 500);
    }
  });

  // Mark all admin notifications as read
  app.post('/make-server-1573e40a/admin/notifications/read-all', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const adminId = await kv.get(`auth:${user.id}`);
      if (!adminId) {
        return c.json({ success: true });
      }

      const notificationIds = await kv.get(`admin:${adminId}:notifications`) || [];
      
      for (const notifId of notificationIds) {
        const notif = await kv.get(`notification:${notifId}`);
        if (notif && !notif.read) {
          notif.read = true;
          notif.read_at = new Date().toISOString();
          await kv.set(`notification:${notifId}`, notif);
        }
      }

      return c.json({ success: true });
    } catch (error: any) {
      console.error('Error in mark all admin notifications as read:', error);
      return c.json({ error: 'Failed to mark all notifications as read' }, 500);
    }
  });
}

// ===============================
// CREATE NOTIFICATION HELPER
// ===============================

export async function createNotification(params: {
  userId: string;
  userRole: 'student' | 'supervisor' | 'admin';
  type: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  relatedId?: string;
}) {
  try {
    const notificationId = `notif:${Date.now()}:${Math.random().toString(36).substring(7)}`;
    
    const notification = {
      notification_id: notificationId,
      user_id: params.userId,
      user_role: params.userRole,
      type: params.type,
      title_ar: params.titleAr,
      title_en: params.titleEn,
      message_ar: params.messageAr,
      message_en: params.messageEn,
      related_id: params.relatedId,
      read: false,
      created_at: new Date().toISOString(),
    };

    // Save notification
    await kv.set(`notification:${notificationId}`, notification);

    // Add to user's notification list
    const notificationKey = `${params.userRole}:${params.userId}:notifications`;
    const existingNotifications = await kv.get(notificationKey) || [];
    existingNotifications.unshift(notificationId); // Add to beginning
    
    // Keep only last 50 notifications
    const trimmedNotifications = existingNotifications.slice(0, 50);
    await kv.set(notificationKey, trimmedNotifications);

    console.log(`✅ Created notification for ${params.userRole} ${params.userId}: ${params.type}`);
    
    return notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
