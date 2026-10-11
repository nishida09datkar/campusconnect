import { apiClient } from '../axios';
import { USE_MOCKS } from '../config';
import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { AppNotification, NotificationPreferences, EmailSendResult } from '@/types';

type NotificationListener = () => void;
const listeners = new Set<NotificationListener>();

export const notificationService = {
  subscribe(listener: NotificationListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  emitChange(): void {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Notification subscriber error:', err);
      }
    });
  },

  async getUserNotifications(userId: string): Promise<AppNotification[]> {
    await delay(50, 120);
    return db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((n) => ({ ...n }));
  },

  async getUnreadCount(userId: string): Promise<number> {
    await delay(30, 80);
    return db.notifications.filter((n) => n.userId === userId && !n.read).length;
  },

  async markAsRead(notificationId: string): Promise<AppNotification> {
    await delay(60, 120);
    const notif = db.notifications.find((n) => n.id === notificationId);
    if (!notif) {
      throw { status: 404, message: 'Notification not found' };
    }
    notif.read = true;
    db.persistNotifications();
    this.emitChange();
    return { ...notif };
  },

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    await delay(70, 150);
    let count = 0;
    db.notifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    db.persistNotifications();
    this.emitChange();
    return { count };
  },

  async createNotification(data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<AppNotification> {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(newNotif);
    db.persistNotifications();
    this.emitChange();
    return { ...newNotif };
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const getLocalPrefs = (): NotificationPreferences => {
      const saved = localStorage.getItem('campusconnect_notification_preferences');
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
      return {
        emailNotifications: true,
        inAppNotifications: true,
        assignmentAlerts: true,
        announcementAlerts: true,
        meetingAlerts: true,
        chatAlerts: false,
        attendanceAlerts: true,
        digestFrequency: 'IMMEDIATE',
      };
    };

    if (USE_MOCKS) {
      await delay(50, 100);
      return getLocalPrefs();
    }

    try {
      const response = await apiClient.get<NotificationPreferences>('/api/notifications/preferences');
      return response.data;
    } catch {
      return getLocalPrefs();
    }
  },

  async updatePreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    localStorage.setItem('campusconnect_notification_preferences', JSON.stringify(prefs));
    if (USE_MOCKS) {
      await delay(50, 100);
      return prefs;
    }

    try {
      const response = await apiClient.put<NotificationPreferences>('/api/notifications/preferences', prefs);
      return response.data;
    } catch {
      return prefs;
    }
  },

  async sendTestEmail(): Promise<EmailSendResult> {
    if (USE_MOCKS) {
      await delay(200, 350);
      return {
        status: 'UNCONFIGURED',
        recipient: 'current_user@campus.test',
        message: 'Mock Mode: Email delivery simulation active. Set VITE_USE_MOCKS=false and configure SMTP in backend for live emails.',
        eventType: 'TEST',
        timestamp: Date.now(),
      };
    }

    try {
      const response = await apiClient.post<EmailSendResult>('/api/notifications/test-email');
      return response.data;
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'SMTP service error'
        : 'Failed to contact backend notification service';
      return {
        status: 'UNCONFIGURED',
        recipient: 'current_user',
        message: msg,
        eventType: 'TEST',
        timestamp: Date.now(),
      };
    }
  },
};
