/** 小程序页面路由常量 — 统一管理所有页面跳转路径 */

export type RouteParam = string | number;

function build(path: string, params?: Record<string, RouteParam>): string {
  if (!params || Object.keys(params).length === 0) {
    return path;
  }
  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `${path}?${query}`;
}

/** TabBar 页面 */
export const TAB_SPOTS = "/pages/spots/index";
export const TAB_COMMUNITY = "/pages/community/index";
export const TAB_PUBLISH = "/pages/publish/index";
export const TAB_MESSAGES = "/pages/messages/index";
export const TAB_PROFILE = "/pages/profile/index";

/** 非 TabBar 页面 */
export const PAGE_LOGIN = "/pages/login/index";
export const PAGE_SETTINGS = "/pages/settings/index";
export const PAGE_HISTORY = "/pages/history/index";
export const PAGE_MY_POSTS = "/pages/my-posts/index";
export const PAGE_MY_SPOTS = "/pages/my-spots/index";
export const PAGE_MY_FAVORITES = "/pages/my-favorites/index";
export const PAGE_ADMIN_REVIEWS = "/pages/admin/reviews/index";

/** 带参数的页面 */
export const toSpotDetail = (id: RouteParam) =>
  build("/pages/spot-detail/index", { id });
export const toMySpotDetail = (id: RouteParam, extra?: { delete?: string }) =>
  build("/pages/my-spot-detail/index", { id, ...extra });
export const toPostDetail = (id: RouteParam) =>
  build("/pages/post-detail/index", { id });
export const toUserProfile = (userId: RouteParam) =>
  build("/pages/user-profile/index", { userId });
export const toUserList = (userId: RouteParam, type: string) =>
  build("/pages/user-list/index", { userId, type });
export const toNotificationDetail = (type: string, title: string) =>
  build("/pages/notification-detail/index", { type, title });
export const toAdminReviewDetail = (id: RouteParam) =>
  build("/pages/admin/review-detail/index", { id });

/** 钓点表单 */
export const toSpotForm = (params: {
  mode: "create" | "edit";
  latitude?: number;
  longitude?: number;
  spotId?: string;
}) => build("/pages/spot-form/index", params as Record<string, RouteParam>);
