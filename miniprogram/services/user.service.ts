import type { UserProfile } from "../models/index";
import { request } from "./request";

/** 后端返回的用户原始数据 */
interface UserApiItem {
  id: number | string;
  nickname?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  level?: number;
  followerCount?: number;
  followingCount?: number;
  likedCount?: number;
  role?: string;
}

interface PageResponse<T> {
  records: T[];
  total?: number;
  page?: number;
  size?: number;
}

function pageRecords<T>(data: PageResponse<T> | T[]): T[] {
  return data && "records" in data ? data.records || [] : Array.isArray(data) ? data : [];
}

function toUser(item: UserApiItem): UserProfile {
  return {
    id: String(item.id),
    nickname: item.nickname || "钓友",
    avatarUrl: item.avatarUrl || "/images/avatar.png",
    coverUrl: item.coverUrl || "",
    bio: item.bio || "",
    level: item.level || 1,
    followerCount: item.followerCount || 0,
    followingCount: item.followingCount || 0,
    likedCount: item.likedCount || 0,
    role: item.role === "ADMIN" ? "ADMIN" : "USER",
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  return toUser(await request<UserApiItem>(`/users/${userId}`));
}

export async function getUserFollowers(userId: string): Promise<UserProfile[]> {
  const data = await request<PageResponse<UserApiItem>>(`/users/${userId}/followers?size=50`);
  return pageRecords(data).map(toUser);
}

export async function getUserFollowing(userId: string): Promise<UserProfile[]> {
  const data = await request<PageResponse<UserApiItem>>(`/users/${userId}/following?size=50`);
  return pageRecords(data).map(toUser);
}

export async function updateMyProfile(data: {
  nickname?: string;
  avatarUrl?: string;
  coverUrl?: string;
}): Promise<UserProfile> {
  return toUser(await request<UserApiItem>("/users/me", "PATCH", data));
}
