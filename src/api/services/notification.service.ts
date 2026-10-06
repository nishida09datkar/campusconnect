import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { AppNotification } from '@/types';

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
    this.emitChange();
    return { ...newNotif };
  },
};
