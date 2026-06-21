import { request } from "./request";

export async function followUser(userId: string): Promise<void> {
  await request(`/users/${userId}/follow`, "PUT");
}

export async function unfollowUser(userId: string): Promise<void> {
  await request(`/users/${userId}/follow`, "DELETE");
}
