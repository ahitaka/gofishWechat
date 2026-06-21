import { request } from "./request";

export interface GeoAddress {
  province: string;
  city: string;
  district: string;
  address: string;
}

export function reverseGeocode(latitude: number, longitude: number): Promise<GeoAddress> {
  return request<GeoAddress>(`/geo/reverse?latitude=${latitude}&longitude=${longitude}`);
}
