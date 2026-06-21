import type {
  ReviewStatus,
  SpotOperationType,
  SpotReviewDetail,
  SpotReviewTask,
} from "../models/index";
import { mockReviewDetails, mockReviewTasks } from "../mock/index";
import { hideCoordinateAddress } from "../utils/display";
import { request } from "./request";

interface PageResponse<T> {
  records: T[];
  list?: T[];
  total?: number;
  page?: number;
  size?: number;
}

interface PendingCountResponse {
  count: number;
}

interface ReviewTaskApiItem {
  id: string;
  operationType: SpotOperationType;
  reviewStatus: ReviewStatus;
  spotId?: string;
  spotName: string;
  coverUrl?: string;
  submitter: {
    id: string;
    nickname: string;
    avatarUrl?: string;
  };
  submittedAt: string;
  reviewedAt?: string;
  rejectReason?: string;
  version: number;
}

function queryString(params: Record<string, string | undefined>): string {
  return Object.keys(params)
    .filter((key) => params[key])
    .map((key) => `${key}=${encodeURIComponent(params[key]!)}`)
    .join("&");
}

export async function getPendingReviewCount(): Promise<number> {
  try {
    const data = await request<PendingCountResponse>("/admin/spot-reviews/pending-count");
    return Number(data?.count || 0);
  } catch (_error) {
    return mockReviewTasks.filter((task) => task.reviewStatus === "PENDING").length;
  }
}

export async function getAdminReviews(
  params: { status?: ReviewStatus; operationType?: SpotOperationType | "ALL" } = {},
): Promise<SpotReviewTask[]> {
  try {
    const requestParams: Record<string, string | undefined> = {
      ...params,
      operationType: params.operationType === "ALL" ? "" : params.operationType,
    };
    const data = await request<PageResponse<ReviewTaskApiItem>>(
      `/admin/spot-reviews${queryString(requestParams) ? `?${queryString(requestParams)}` : ""}`,
    );
    return (data?.records || data?.list || []) as unknown as SpotReviewTask[];
  } catch (_error) {
    return mockReviewTasks.filter((task) => {
      const matchStatus = !params.status || task.reviewStatus === params.status;
      const matchType =
        !params.operationType ||
        params.operationType === "ALL" ||
        task.operationType === params.operationType;
      return matchStatus && matchType;
    });
  }
}

export async function getAdminReviewDetail(id?: string): Promise<SpotReviewDetail | undefined> {
  if (!id) {
    return undefined;
  }
  try {
    return sanitizeReviewDetail(await request<SpotReviewDetail>(`/admin/spot-reviews/${id}`));
  } catch (_error) {
    const detail = mockReviewDetails[id];
    return detail ? sanitizeReviewDetail(detail) : undefined;
  }
}

function sanitizeReviewDetail(detail: SpotReviewDetail): SpotReviewDetail {
  return {
    ...detail,
    before: detail.before
      ? { ...detail.before, address: hideCoordinateAddress(detail.before.address) }
      : detail.before,
    after: detail.after
      ? { ...detail.after, address: hideCoordinateAddress(detail.after.address) }
      : detail.after,
  };
}

export function approveReview(id: string, version: number): Promise<void> {
  return request<void>(`/admin/spot-reviews/${id}/approve`, "PUT", { version });
}

export function rejectReview(id: string, reason: string, version: number): Promise<void> {
  return request<void>(`/admin/spot-reviews/${id}/reject`, "PUT", { reason, version });
}
