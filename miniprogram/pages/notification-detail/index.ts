import {
  getNotifications,
  readAllByType,
  readNotification,
  type NotificationItem,
} from "../../services/notification.service";
import { toPostDetail } from "../../constants/routes";

function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "刚刚";
    if (min < 60) return `${min}分钟前`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour}小时前`;
    const day = Math.floor(hour / 24);
    if (day === 1) return "昨天";
    if (day < 7) return `${day}天前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return "";
  }
}

Page({
  data: {
    type: "" as string,
    title: "" as string,
    notifications: [] as (NotificationItem & { timeText: string })[],
    page: 1,
    loading: false,
    noMore: false,
  },
  onLoad(options: Record<string, string>) {
    const type = options.type || "";
    const rawTitle = options.title || "消息";
    let title = rawTitle;
    try {
      title = decodeURIComponent(rawTitle);
    } catch {}
    this.setData({ type, title });
    this.loadNotifications();
  },
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: "pages/messages/index" });
    }
  },
  async loadNotifications() {
    if (this.data.loading || this.data.noMore) return;
    this.setData({ loading: true });
    try {
      const list = await getNotifications(this.data.type, this.data.page);
      const formatted = list.map((item) => ({ ...item, timeText: formatTime(item.createdAt) }));
      this.setData({
        notifications: this.data.page === 1 ? formatted : this.data.notifications.concat(formatted),
        noMore: list.length < 20,
      });
      if (this.data.page === 1 && formatted.length > 0) {
        readAllByType(this.data.type).catch(() => {});
      }
    } catch {
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },
  onReachBottom() {
    if (this.data.noMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 }, () => this.loadNotifications());
  },
  async tapNotification(event: WechatMiniprogram.TouchEvent) {
    const index = event.currentTarget.dataset.index;
    const item = this.data.notifications[index];
    if (!item) return;
    if (!item.isRead) {
      readNotification(item.id).catch(() => {});
      const notifications = this.data.notifications.map((n, i) =>
        i === index ? { ...n, isRead: true } : n,
      );
      this.setData({ notifications });
    }
    if (item.bizType === "POST" && item.bizId) {
      wx.navigateTo({ url: toPostDetail(item.bizId) });
    }
  },
});
