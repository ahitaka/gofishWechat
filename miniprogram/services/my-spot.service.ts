import type { FishingSpot, MySpotDetail, MySpotItem, SpotFormData } from "../models/index";
import { mockMySpotDetails, mockMySpots } from "../mock/index";
import { hideCoordinateAddress } from "../utils/display";
import { request } from "./request";

/** 后端分页响应 */
interface PageResponse<T> {
  records: T[];
  list?: T[];
  total?: number;
  page?: number;
  size?: number;
}

function pageRecords<T>(data: PageResponse<T> | T[] | null | undefined, fallback: T[]): T[] {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  return data.records || data.list || fallback;
}

function getLocalMySpots(): MySpotDetail[] {
  return wx.getStorageSync("localMySpots") || [];
}

function setLocalMySpot(detail: MySpotDetail) {
  const list = getLocalMySpots();
  const next = [detail].concat(list.filter((spot) => spot.id !== detail.id));
  wx.setStorageSync("localMySpots", next);
}

function removeLocalMySpot(id: string) {
  wx.setStorageSync(
    "localMySpots",
    getLocalMySpots().filter((spot) => spot.id !== id),
  );
}

function pendingImageKey(id: string) {
  return `pendingSpotImages:${id}`;
}

export function rememberPendingSpotImages(
  id: string,
  data: Pick<SpotFormData, "coverUrl" | "imageUrls">,
) {
  if (!id || !data.imageUrls?.length) {
    return;
  }
  wx.setStorageSync(pendingImageKey(id), {
    coverUrl: data.coverUrl || data.imageUrls[0],
    imageUrls: data.imageUrls,
  });
}

function mergePendingSpotImages(detail: MySpotDetail): MySpotDetail {
  const pendingImages = wx.getStorageSync(pendingImageKey(detail.id)) as
    | {
        coverUrl?: string;
        imageUrls: string[];
      }
    | undefined;
  if (detail.reviewStatus !== "PENDING") {
    wx.removeStorageSync(pendingImageKey(detail.id));
    return detail;
  }
  if (detail.imageUrls?.length) {
    wx.removeStorageSync(pendingImageKey(detail.id));
    return detail;
  }
  return pendingImages?.imageUrls?.length
    ? {
        ...detail,
        coverUrl: pendingImages.coverUrl || detail.coverUrl,
        imageUrls: pendingImages.imageUrls,
      }
    : detail;
}

function toItem(detail: MySpotDetail): MySpotItem {
  return {
    id: detail.id,
    name: detail.name,
    coverUrl: detail.coverUrl,
    typeLabel: detail.typeLabel,
    address: hideCoordinateAddress(detail.address),
    visibility: detail.visibility,
    reviewStatus: detail.reviewStatus,
    latestOperationType: detail.latestOperationType,
    rejectReason: detail.rejectReason,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    isFavorite: detail.isFavorite,
  };
}

function sanitizeItem<T extends MySpotItem>(spot: T): T {
  return { ...spot, address: hideCoordinateAddress(spot.address) };
}

function sanitizeDetail(detail: MySpotDetail): MySpotDetail {
  return { ...detail, address: hideCoordinateAddress(detail.address) };
}

function buildLocalDetail(data: SpotFormData, id?: string): MySpotDetail {
  const now = new Date().toISOString();
  return {
    id: id || `local_${Date.now()}`,
    name: data.name,
    coverUrl: data.coverUrl || "/images/default-goods-image.png",
    type: data.type,
    typeLabel: data.type,
    address: data.address,
    visibility: data.visibility,
    reviewStatus: data.visibility === "PUBLIC" ? "PENDING" : "NOT_SUBMITTED",
    createdAt: now,
    updatedAt: now,
    latitude: data.latitude || 31.2304,
    longitude: data.longitude || 121.4737,
    imageUrls: data.imageUrls,
    fishSpecies: data.fishSpecies,
    feeType: data.feeType,
    feeAmount: data.feeAmount,
    parkingSupported: data.parkingSupported,
    nightFishingSupported: data.nightFishingSupported,
    description: data.description,
  };
}

export async function getMySpots(
  params: Record<string, string | number> = {},
): Promise<MySpotItem[]> {
  const localItems = getLocalMySpots().map(toItem);
  try {
    const query = Object.keys(params)
      .filter((key) => params[key])
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join("&");
    const data = await request<PageResponse<MySpotItem>>(`/my-spots${query ? `?${query}` : ""}`);
    return localItems.concat(pageRecords<MySpotItem>(data, mockMySpots).map(sanitizeItem));
  } catch (_error) {
    return params.page && Number(params.page) > 1
      ? []
      : localItems.concat(mockMySpots.map(sanitizeItem));
  }
}

export async function getFavoriteSpots(
  params: Record<string, string | number> = {},
): Promise<MySpotItem[]> {
  try {
    const query = Object.keys(params)
      .filter((key) => params[key])
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join("&");
    const data = await request<PageResponse<MySpotItem>>(
      `/users/me/favorite-spots${query ? `?${query}` : ""}`,
    );
    return pageRecords<MySpotItem>(
      data,
      mockMySpots.filter((spot) => spot.isFavorite),
    ).map((item) => ({ ...sanitizeItem(item), isFavorite: true }));
  } catch (_error) {
    return params.page && Number(params.page) > 1
      ? []
      : mockMySpots.filter((spot) => spot.isFavorite).map(sanitizeItem);
  }
}

export async function getMySpotDetail(id?: string): Promise<MySpotDetail | undefined> {
  if (!id) {
    return undefined;
  }
  try {
    return sanitizeDetail(mergePendingSpotImages(await request<MySpotDetail>(`/my-spots/${id}`)));
  } catch (_error) {
    const detail = getLocalMySpots().find((spot) => spot.id === id) || mockMySpotDetails[id];
    return detail ? sanitizeDetail(detail) : undefined;
  }
}

export async function savePrivateSpot(data: SpotFormData, id?: string): Promise<MySpotDetail> {
  const method = id ? "PUT" : "POST";
  const path = id ? `/my-spots/${id}` : "/my-spots";
  try {
    const result = await request<MySpotDetail>(
      path,
      method,
      data as unknown as Record<string, unknown>,
    );
    const detail = {
      ...buildLocalDetail(data, String(result?.id || id || "")),
      ...result,
    };
    setLocalMySpot(detail);
    return detail;
  } catch (_error) {
    const detail = buildLocalDetail(data, id);
    setLocalMySpot(detail);
    return detail;
  }
}

export function savePrivateSpotQuiet(data: SpotFormData, id: string): Promise<void> {
  return request<void>(`/my-spots/${id}`, "PUT", data as unknown as Record<string, unknown>)
    .then(() => undefined)
    .catch(() => undefined);
}

export function syncPendingSpotSnapshotQuiet(data: SpotFormData, id: string): Promise<void> {
  return request<void>(
    `/my-spots/${id}/pending-snapshot`,
    "PUT",
    data as unknown as Record<string, unknown>,
  )
    .then(() => undefined)
    .catch(() => undefined);
}

export async function submitPublishReview(id: string): Promise<MySpotDetail> {
  try {
    return await request<MySpotDetail>(`/my-spots/${id}/publish`, "POST");
  } catch (_error) {
    const detail = mockMySpotDetails[id];
    return { ...detail, visibility: "PUBLIC", reviewStatus: "PENDING" };
  }
}

export async function submitUpdateReview(id: string, data: SpotFormData): Promise<MySpotDetail> {
  try {
    return await request<MySpotDetail>(
      `/my-spots/${id}/update-submission`,
      "POST",
      data as unknown as Record<string, unknown>,
    );
  } catch (_error) {
    const detail = mockMySpotDetails[id];
    return {
      ...detail,
      reviewStatus: "PENDING",
      latestOperationType: "UPDATE",
      hasPendingReview: true,
    };
  }
}

export function submitDeleteReview(id: string, reason: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/my-spots/${id}/delete-submission`, "POST", { reason });
}

export function cancelReview(id: string): Promise<void> {
  return request<void>(`/my-spots/${id}/cancel-review`, "POST");
}

export async function deleteMySpot(id: string): Promise<boolean> {
  if (id.startsWith("local_")) {
    removeLocalMySpot(id);
    return true;
  }
  await request<void>(`/my-spots/${id}`, "DELETE");
  removeLocalMySpot(id);
  wx.setStorageSync("spotsNeedRefresh", true);
  return true;
}

export function unfavoriteSpot(id: string): Promise<void> {
  return request<void>(`/spots/${id}/favorite`, "DELETE");
}

export function mySpotToFishingSpot(spot: MySpotDetail | MySpotItem): FishingSpot | null {
  const latitude = Number((spot as MySpotDetail).latitude);
  const longitude = Number((spot as MySpotDetail).longitude);
  if (!latitude || !longitude) {
    return null;
  }
  return {
    id: String(spot.id),
    name: spot.name,
    type: ((spot as MySpotDetail).type || "OTHER") as FishingSpot["type"],
    typeLabel: spot.typeLabel || "我的钓点",
    coverUrl: spot.coverUrl || "/images/default-goods-image.png",
    distanceKm: 0,
    fishSpecies: (spot as MySpotDetail).fishSpecies || [],
    rating: 0,
    reviewCount: 0,
    latitude,
    longitude,
    address: hideCoordinateAddress(spot.address),
    visibility: spot.visibility,
    reviewStatus: spot.reviewStatus,
    isMine: true,
  };
}

export async function getMyMapSpots(): Promise<FishingSpot[]> {
  const localDetails = getLocalMySpots();
  try {
    const data = await request<PageResponse<MySpotItem>>("/my-spots?page=1&size=500");
    const records: MySpotItem[] = pageRecords<MySpotItem>(data, []);
    const remoteDetails = await Promise.all(records.map((item) => getMySpotDetail(item.id)));
    const remoteList = remoteDetails.filter(Boolean) as MySpotDetail[];
    const remoteIds = new Set(remoteList.map((s) => String(s.id)));
    // Remote data takes precedence; local-only entries (not yet synced) are appended
    const merged = remoteList.concat(localDetails.filter((s) => !remoteIds.has(String(s.id))));
    return merged.map(mySpotToFishingSpot).filter(Boolean) as FishingSpot[];
  } catch (_error) {
    return localDetails.map(mySpotToFishingSpot).filter(Boolean) as FishingSpot[];
  }
}
