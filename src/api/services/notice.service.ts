import { db } from '../mock/db';
import { delay } from '../mock/delay';
import { Announcement, NoticeAudience, Attachment, AppNotification } from '@/types';
import { sanitizeHtml } from '@/utils/sanitize';
import { notificationService } from './notification.service';

export interface CreateNoticePayload {
  senderId: string;
  departmentId?: string;
  audience: NoticeAudience;
  year?: number;
  classId?: string;
  title: string;
  body: string;
  attachments?: Attachment[];
}

export const noticeService = {
  async getNotices(filters?: { departmentId?: string; senderId?: string }): Promise<Announcement[]> {
    await delay(70, 150);
    let notices = [...db.announcements];

    if (filters?.departmentId) {
      notices = notices.filter(
        (n) => n.departmentId === filters.departmentId || !n.departmentId // include campus-wide notices
      );
    }

    if (filters?.senderId) {
      notices = notices.filter((n) => n.senderId === filters.senderId);
    }

    return notices.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getNoticeById(id: string): Promise<Announcement | null> {
    await delay(40, 90);
    const notice = db.announcements.find((n) => n.id === id);
    return notice ? { ...notice } : null;
  },

  async createNotice(payload: CreateNoticePayload): Promise<Announcement> {
    await delay(150, 300);

    const title = payload.title.trim();
    if (!title) {
      throw { status: 400, message: 'Notice title is required' };
    }

    const sanitizedBody = sanitizeHtml(payload.body.trim());
    if (!sanitizedBody) {
      throw { status: 400, message: 'Notice content is required' };
    }

    const newNotice: Announcement = {
      id: `notice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: payload.senderId,
      departmentId: payload.departmentId,
      audience: payload.audience,
      year: payload.year,
      classId: payload.classId,
      title,
      body: sanitizedBody,
      createdAt: new Date().toISOString(),
      attachments: payload.attachments || [],
    };

    db.announcements.unshift(newNotice);

    // Target Audience Notification Generation (Section 20 Phase 3 requirement)
    const matchingRecipients = db.users.filter((targetUser) => {
      // 1. Must be active
      if (!targetUser.isActive) return false;

      // 2. Do not notify the sender
      if (targetUser.id === payload.senderId) return false;

      // 3. Department scope check
      if (payload.departmentId) {
        if (targetUser.departmentId !== payload.departmentId) {
          return false;
        }
      }

      // 4. Role audience check
      if (payload.audience === 'FACULTY') {
        if (targetUser.role !== 'FACULTY') return false;
      } else if (payload.audience === 'STUDENTS') {
        if (targetUser.role !== 'STUDENT') return false;
      }
      // If audience is 'ALL', both faculty and students (and HODs if in department) receive it

      // 5. Year filter check (applies to students)
      if (payload.year !== undefined && payload.year !== null) {
        if (targetUser.role === 'STUDENT' && targetUser.year !== payload.year) {
          return false;
        }
      }

      // 6. Class filter check (applies to students enrolled in that class)
      if (payload.classId) {
        if (targetUser.role === 'STUDENT') {
          const cls = db.classes.find((c) => c.id === payload.classId);
          const isEnrolled =
            (cls && cls.studentIds.includes(targetUser.id)) ||
            db.enrollments.some(
              (e) => e.classId === payload.classId && e.studentId === targetUser.id
            );
          if (!isEnrolled) return false;
        }
      }

      return true;
    });

    // Plain text snippet for notification body
    const plainExcerpt = sanitizedBody
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);

    for (const recipient of matchingRecipients) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}-${recipient.id}-${Math.random().toString(36).substring(2, 6)}`,
        userId: recipient.id,
        type: 'NOTICE',
        title: title,
        body: plainExcerpt || 'You have received a new department notice.',
        link: `/notifications?noticeId=${newNotice.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      db.notifications.unshift(notif);
    }

    notificationService.emitChange();

    return { ...newNotice };
  },
};
