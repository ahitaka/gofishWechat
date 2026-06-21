import type { CommunityPost } from "../models/index";
import { request } from "./request";

export interface HistoryItem {
  id: string;
  postId: string;
  post: CommunityPost;
  viewedAt: string;
}

interface PageResponse<T> {
  records: T[];
  total?: number;
  page?: number;
  size?: number;
}

interface PostApiItem {
  id: number | string;
  content: string;
  images?: string[];
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  liked?: boolean;
  waterType?: string;
  fishSpecies?: string;
  author?: {
    id: number | string;
    nickname?: string;
    avatarUrl?: string;
    level?: number;
    city?: string;
    followed?: boolean;
  };
  userId?: number | string;
  spot?: {
    id: number | string;
    name: string;
  };
  spotId?: number | string;
}

interface HistoryApiItem {
  id: number | string;
  postId: number | string;
  post: PostApiItem;
  viewedAt: string;
}

function toPost(item: PostApiItem): CommunityPost {
  const tags = [item.fishSpecies].filter(Boolean) as string[];
  return {
    id: String(item.id),
    author: {
      id: String(item.author?.id || item.userId),
      nickname: item.author?.nickname || `钓友${item.userId}`,
      avatarUrl: item.author?.avatarUrl || "/images/avatar.png",
      level: item.author?.level || 1,
      city: item.author?.city || "",
      followed: item.author?.followed ?? false,
    },
    content: item.content,
    images: item.images || [],
    createdAt: item.createdAt,
    createdAtText: undefined,
    spot: item.spot
      ? { id: String(item.spot.id), name: item.spot.name }
      : item.spotId
        ? { id: String(item.spotId), name: "关联钓点" }
        : undefined,
    waterType: item.waterType,
    tags,
    likeCount: item.likeCount || 0,
    commentCount: item.commentCount || 0,
    shareCount: item.shareCount || 0,
    liked: !!item.liked,
  };
}

function toHistory(item: HistoryApiItem): HistoryItem {
  return {
    id: String(item.id),
    postId: String(item.postId),
    post: toPost(item.post),
    viewedAt: item.viewedAt,
  };
}

/** 记录浏览（打开帖子详情时调用） */
export function recordView(postId: string): Promise<void> {
  return request<void>(`/posts/${postId}/view`, "POST");
}

/** 获取浏览历史列表 */
export async function getHistory(page = 1, size = 20): Promise<HistoryItem[]> {
  try {
    const result = await request<PageResponse<HistoryApiItem>>(
      `/history?page=${page}&size=${size}`,
    );
    return (result.records || []).map(toHistory);
  } catch (_error) {
    return [];
  }
}

/** 删除单条浏览记录 */
export function deleteHistory(postId: string): Promise<void> {
  return request<void>(`/history/${postId}`, "DELETE");
}

/** 清空浏览历史 */
export function clearHistory(): Promise<void> {
  return request<void>("/history", "DELETE");
}
