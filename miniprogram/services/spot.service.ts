import type { FishingSpot, SpotReview, SpotType } from "../models/index";
import { mockSpots } from "../mock/index";
import { hideCoordinateAddress } from "../utils/display";
import { request } from "./request";

/** 后端分页响应结构 */
interface PageResponse<T> {
  records: T[];
  total?: number;
  page?: number;
  size?: number;
}

/** 后端返回的钓点原始数据 */
interface SpotApiItem {
  id: number | string;
  name: string;
  type?: string;
  coverUrl?: string;
  distanceMeters?: number;
  ratingAvg?: number;
  ratingCount?: number;
  reviewCount?: number;
  postCount?: number;
  postsCount?: number;
  relatedPostCount?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  address?: string;
  feeType?: string;
  feeAmount?: number | null;
  parkingSupported?: boolean;
  parking?: boolean;
  nightFishingSupported?: boolean;
  nightFishing?: boolean;
  favoriteCount?: number;
  creatorId?: number | string;
  currentUserIsCreator?: boolean;
  currentUserCanManage?: boolean;
  hasPendingReview?: boolean;
  pendingReviewId?: string;
  visibility?: string;
  reviewStatus?: string;
  isMine?: boolean;
  favorited?: boolean;
}

/** 后端返回的评论原始数据 */
interface ReviewApiItem {
  id: number | string;
  spotId: number | string;
  userId: number | string;
  author?: {
    id: number | string;
    nickname: string;
    avatarUrl?: string;
    level?: number;
  };
  rating?: number;
  content?: string;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  RIVER: "江河",
  LAKE: "湖库",
  RESERVOIR: "水库",
  POND: "池塘",
  BLACK_PIT: "黑坑",
  SEA: "海钓",
  OTHER: "其他",
};

const feeTypes: Record<string, FishingSpot["feeType"]> = {
  FREE: "free",
  PAID: "paid",
  UNKNOWN: "unknown",
};

function toSpot(item: SpotApiItem): FishingSpot {
  const type = String(item.type || "OTHER").toUpperCase() as FishingSpot["type"];
  const feeType = String(item.feeType || "UNKNOWN").toUpperCase();
  return {
    id: String(item.id),
    name: item.name,
    type,
    typeLabel: typeLabels[type] || type,
    coverUrl: item.coverUrl || "/images/default-goods-image.png",
    distanceKm: Number(((item.distanceMeters || 0) / 1000).toFixed(1)),
    fishSpecies: [],
    rating: Number(item.ratingAvg || 0),
    reviewCount: item.ratingCount || item.reviewCount || 0,
    postCount: item.postCount || item.postsCount || item.relatedPostCount || 0,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    city: item.city || "",
    district: item.district || "",
    address: hideCoordinateAddress(item.address),
    feeType: feeTypes[feeType] || "unknown",
    feeAmount: item.feeAmount == null ? undefined : Number(item.feeAmount),
    parking: !!item.parkingSupported || !!item.parking,
    nightFishing: !!item.nightFishingSupported || !!item.nightFishing,
    heat: item.favoriteCount || 0,
    creatorId: item.creatorId ? String(item.creatorId) : undefined,
    currentUserIsCreator: !!item.currentUserIsCreator,
    currentUserCanManage: !!item.currentUserCanManage,
    hasPendingReview: !!item.hasPendingReview,
    pendingReviewId: item.pendingReviewId,
    visibility: item.visibility as FishingSpot["visibility"],
    reviewStatus: item.reviewStatus as FishingSpot["reviewStatus"],
    isMine: !!item.currentUserIsCreator || !!item.isMine,
    isFavorite: !!item.favorited,
  };
}

function formatTime(iso: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function toReview(item: ReviewApiItem): SpotReview {
  return {
    id: String(item.id),
    spotId: String(item.spotId),
    userId: String(item.userId),
    author: item.author
      ? {
          id: String(item.author.id),
          nickname: item.author.nickname || "钓友",
          avatarUrl: item.author.avatarUrl || "/images/avatar.png",
          level: item.author.level || 1,
        }
      : undefined,
    rating: Number(item.rating || 0),
    content: item.content || "",
    createdAt: item.createdAt,
    createdAtText: formatTime(item.createdAt),
  };
}

export async function getSpots(
  type: SpotType | "all" = "all",
  keyword = "",
): Promise<FishingSpot[]> {
  const params = type === "all" ? "" : `?type=${type}`;
  try {
    const page = await request<PageResponse<SpotApiItem>>(`/spots${params}`);
    return (page.records || []).map(toSpot).filter((spot: FishingSpot) => {
      const matchType = type === "all" || spot.type === type;
      const matchKeyword =
        !keyword || spot.name.includes(keyword) || spot.address.includes(keyword);
      return matchType && matchKeyword;
    });
  } catch (_error) {
    return mockSpots.filter((spot) => {
      const matchType = type === "all" || spot.type === type;
      const matchKeyword =
        !keyword || spot.name.includes(keyword) || spot.address.includes(keyword);
      return matchType && matchKeyword;
    });
  }
}

export async function getMapSpots(
  type: SpotType | "all" = "all",
  keyword = "",
): Promise<FishingSpot[]> {
  const params = type === "all" ? "?size=500" : `?type=${type}&size=500`;
  try {
    const page = await request<PageResponse<SpotApiItem>>(`/spots/map${params}`);
    return (page.records || []).map(toSpot).filter((spot: FishingSpot) => {
      const matchType = type === "all" || spot.type === type;
      const matchKeyword =
        !keyword || spot.name.includes(keyword) || spot.address.includes(keyword);
      return matchType && matchKeyword;
    });
  } catch (_error) {
    return getSpots(type, keyword);
  }
}

export async function getUserPublicSpots(userId: string): Promise<FishingSpot[]> {
  try {
    const page = await request<PageResponse<SpotApiItem>>(`/spots?userId=${userId}&size=50`);
    return (page.records || []).map(toSpot);
  } catch (_error) {
    return mockSpots.filter((spot) => spot.creatorId === userId);
  }
}

export async function getSpotById(id?: string): Promise<FishingSpot | undefined> {
  if (!id) {
    return undefined;
  }
  try {
    return toSpot(await request<SpotApiItem>(`/spots/${id}`));
  } catch (_error) {
    return mockSpots.find((spot) => spot.id === id);
  }
}

export async function getSpotReviews(id: string): Promise<SpotReview[]> {
  const page = await request<PageResponse<ReviewApiItem>>(`/spots/${id}/reviews?size=50`);
  return (page.records || []).map(toReview);
}

export function submitSpotReview(id: string, rating: number, content: string): Promise<SpotReview> {
  return request<ReviewApiItem>(`/spots/${id}/reviews`, "POST", { rating, content }).then(toReview);
}

export function favoriteSpot(id: string): Promise<boolean> {
  return request<boolean>(`/spots/${id}/favorite`, "PUT");
}

export function unfavoriteSpot(id: string): Promise<boolean> {
  return request<boolean>(`/spots/${id}/favorite`, "DELETE");
}
