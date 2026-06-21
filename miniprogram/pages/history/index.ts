import {
  clearHistory,
  deleteHistory,
  getHistory,
  type HistoryItem,
} from "../../services/history.service";
import type { CommunityPost } from "../../models/index";
import type { CustomEvent } from "../../utils/events";
import { toPostDetail } from "../../constants/routes";

function formatViewedAt(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const HH = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const time = `${HH}:${mm}`;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    if (d >= todayStart) return `今天 ${time}`;
    if (d >= yesterdayStart) return `昨天 ${time}`;
    return `${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
  } catch {
    return "";
  }
}

Page({
  data: {
    history: [] as (HistoryItem & { viewedAtText: string })[],
    page: 1,
    loading: false,
    noMore: false,
  },
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: "pages/profile/index" });
    }
    this.setData({ page: 1, noMore: false }, () => this.loadHistory());
  },
  onPullDownRefresh() {
    this.setData({ page: 1, noMore: false }, () => {
      this.loadHistory().finally(() => wx.stopPullDownRefresh());
    });
  },
  onReachBottom() {
    if (this.data.loading || this.data.noMore) return;
    this.setData({ page: this.data.page + 1 }, () => this.loadHistory());
  },
  async loadHistory() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const list = await getHistory(this.data.page);
      const formatted = list.map((item) => ({
        ...item,
        viewedAtText: formatViewedAt(item.viewedAt),
      }));
      this.setData({
        history: this.data.page === 1 ? formatted : this.data.history.concat(formatted),
        noMore: list.length < 20,
      });
    } catch {
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },
  openPost(event: CustomEvent<{ post: CommunityPost }>) {
    const post = event.detail.post;
    if (post?.id) {
      wx.navigateTo({ url: toPostDetail(post.id) });
    }
  },
  async removeItem(event: WechatMiniprogram.TouchEvent) {
    const index = event.currentTarget.dataset.index;
    const item = this.data.history[index];
    if (!item) return;
    try {
      await deleteHistory(item.postId);
      this.setData({ history: this.data.history.filter((_, i) => i !== index) });
      wx.showToast({ title: "已删除", icon: "none" });
    } catch {
      wx.showToast({ title: "删除失败", icon: "none" });
    }
  },
  async clearAll() {
    const res = await wx.showModal({
      title: "提示",
      content: "确定清空所有浏览历史？",
      confirmColor: "#21B56B",
    });
    if (!res.confirm) return;
    try {
      await clearHistory();
      this.setData({ history: [], noMore: true });
      wx.showToast({ title: "已清空", icon: "none" });
    } catch {
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },
  goBack() {
    wx.navigateBack();
  },
});
