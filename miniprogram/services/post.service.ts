import type { CommunityPost, PostComment } from "../models/index";
import { mockPosts } from "../mock/index";
import { request } from "./request";

/** 后端分页响应 */
interface PageResponse<T> {
  records: T[];
  total?: number;
  page?: number;
  size?: number;
}

/** 后端帖子原始数据 */
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

/** 后端评论原始数据 */
interface CommentApiItem {
  id: number | string;
  postId: number | string;
  userId: number | string;
  content?: string;
  likeCount?: number;
  createdAt: string;
  author?: {
    id: number | string;
    nickname?: string;
    avatarUrl?: string;
    level?: number;
  };
}

function formatTime(iso: string): string | undefined {
  if (!iso) return undefined;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return undefined;
    const HH = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const time = `${HH}:${mm}`;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    if (d >= todayStart) return `今天 ${time}`;
    if (d >= yesterdayStart) return `昨天 ${time}`;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
  } catch {
    return undefined;
  }
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
    createdAtText: formatTime(item.createdAt),
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

function toComment(item: CommentApiItem): PostComment {
  return {
    id: String(item.id),
    postId: String(item.postId),
    userId: String(item.userId),
    author: item.author
      ? {
          id: String(item.author.id),
          nickname: item.author.nickname || "钓友",
          avatarUrl: item.author.avatarUrl || "/images/avatar.png",
          level: item.author.level || 1,
        }
      : undefined,
    content: item.content || "",
    likeCount: item.likeCount || 0,
    createdAt: item.createdAt,
  };
}

export async function getPosts(tab = "latest", page = 1, spotId = ""): Promise<CommunityPost[]> {
  if (page > 1) {
    return [];
  }
  const feed = tab === "hot" ? "hot" : "latest";
  try {
    const result = await request<PageResponse<PostApiItem>>(
      `/posts?feed=${feed}&size=${page * 20}${spotId ? `&spotId=${spotId}` : ""}`,
    );
    const posts = (result.records || []).map(toPost);
    return tab === "follow" ? posts.filter((post) => post.author.followed) : posts;
  } catch (_error) {
    const posts =
      tab === "hot" ? [...mockPosts].sort((a, b) => b.likeCount - a.likeCount) : mockPosts;
    return (tab === "follow" ? posts.filter((post) => post.author.followed) : posts)
      .filter((post) => !spotId || post.spot?.id === spotId)
      .map((post) => ({ ...post, createdAtText: formatTime(post.createdAt) }));
  }
}

export async function getUserPosts(userId: string, page = 1): Promise<CommunityPost[]> {
  if (page > 1) {
    return [];
  }
  try {
    const result = await request<PageResponse<PostApiItem>>(
      `/posts?userId=${userId}&size=${page * 20}`,
    );
    return (result.records || []).map(toPost);
  } catch (_error) {
    return mockPosts
      .filter((post) => post.author.id === userId)
      .map((post) => ({ ...post, createdAtText: formatTime(post.createdAt) }));
  }
}

export async function getPostById(id?: string): Promise<CommunityPost | undefined> {
  if (!id) {
    return undefined;
  }
  try {
    return toPost(await request<PostApiItem>(`/posts/${id}`));
  } catch (_error) {
    const post = mockPosts.find((post) => post.id === id);
    return post ? { ...post, createdAtText: formatTime(post.createdAt) } : undefined;
  }
}

export function createPost(form: Record<string, unknown>): Promise<CommunityPost> {
  return request<PostApiItem>("/posts", "POST", {
    ...form,
    type: String(form.type).toUpperCase(),
    visibility: String(form.visibility).toUpperCase(),
    fishSpecies: Array.isArray(form.fishSpecies) ? (form.fishSpecies as string[]).join(",") : "",
  }).then(toPost);
}

export function likePost(id: string, liked: boolean): Promise<boolean> {
  return request<boolean>(`/posts/${id}/like`, liked ? "DELETE" : "PUT");
}

export function sharePost(id: string): Promise<void> {
  return request<void>(`/posts/${id}/share`, "POST");
}

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const result = await request<PageResponse<CommentApiItem>>(`/posts/${postId}/comments?size=50`);
  return (result.records || []).map(toComment);
}

export function createPostComment(postId: string, content: string): Promise<void> {
  return request<void>(`/posts/${postId}/comments`, "POST", { content });
}
