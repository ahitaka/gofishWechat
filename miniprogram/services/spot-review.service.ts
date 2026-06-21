import type { MySpotDetail, SpotFormData } from "../models/index";
import { request } from "./request";

export function publishSpot(id: string): Promise<MySpotDetail> {
  return request<MySpotDetail>(`/my-spots/${id}/publish`, "POST");
}

export function updatePublicSpot(id: string, data: SpotFormData): Promise<MySpotDetail> {
  return request<MySpotDetail>(
    `/my-spots/${id}/update-submission`,
    "POST",
    data as unknown as Record<string, unknown>,
  );
}

export function deletePublicSpot(id: string, reason: string): Promise<void> {
  return request<void>(`/my-spots/${id}/delete-submission`, "POST", { reason });
}
