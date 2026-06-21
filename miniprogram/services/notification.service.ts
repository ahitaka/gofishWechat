import { request } from "./request";

export interface NotificationItem {
  id: string;
  type: string;
  bizType: string;
  bizId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    nickname: string;
    avatarUrl: string;
  } | null;
}

interface PageResponse<T> {
  records: T[];
  total?: number;
  page?: number;
  size?: number;
}

interface NotificationApiItem {
  id: number | string;
  type?: string;
  bizType?: string;
  bizId?: number | string;
  content?: string;
  isRead?: boolean;
  createdAt?: string;
  actor?: {
    id: number | string;
    nickname?: string;
    avatarUrl?: string;
  } | null;
}

function toNotification(item: NotificationApiItem): NotificationItem {
  return {
    id: String(item.id),
    type: item.type || "",
    bizType: item.bizType || "",
    bizId: item.bizId ? String(item.bizId) : "",
    content: item.content || "",
    isRead: !!item.isRead,
    createdAt: item.createdAt || "",
    actor: item.actor
      ? {
          id: String(item.actor.id),
          nickname: item.actor.nickname || "",
          avatarUrl: item.actor.avatarUrl || "/images/avatar.png",
        }
      : null,
  };
}

export async function getNotifications(
  type?: string,
  page = 1,
  size = 20,
): Promise<NotificationItem[]> {
  const query = type ? `?type=${type}&page=${page}&size=${size}` : `?page=${page}&size=${size}`;
  const data = await request<PageResponse<NotificationApiItem>>(`/notifications${query}`);
  return (data.records || []).map(toNotification);
}

export async function getUnreadCount(): Promise<number> {
  return request<number>("/notifications/unread-count");
}

export async function getUnreadCountByType(type: string): Promise<number> {
  return request<number>(`/notifications/unread-count/${type}`);
}

export async function readNotification(id: string): Promise<void> {
  await request<void>(`/notifications/${id}/read`, "PUT");
}

export async function readAllByType(type: string): Promise<void> {
  await request<void>(`/notifications/read-all/${type}`, "PUT");
}
