export interface Attachment {
  id: string;
  name: string;
  sizeKb: number;
  mime: string;
  url: string;
}

export type NoticeAudience = 'ALL' | 'FACULTY' | 'STUDENTS';

export interface Announcement {
  id: string;
  senderId: string;
  departmentId?: string;
  audience: NoticeAudience;
  year?: number;
  classId?: string;
  title: string;
  body: string;
  createdAt: string;
  attachments?: Attachment[];
}

export type Notice = Announcement;

export type NotificationType =
  | 'NOTICE'
  | 'ASSIGNMENT'
  | 'GRADE'
  | 'MESSAGE'
  | 'CALL'
  | 'LECTURE';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
