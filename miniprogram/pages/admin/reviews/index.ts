import type { ReviewStatus, SpotOperationType, SpotReviewTask } from "../../../models/index";
import { getAdminReviews, getPendingReviewCount } from "../../../services/admin-review.service";
import { TAB_PROFILE, toAdminReviewDetail } from "../../../constants/routes";

Page({
  data: {
    status: "PENDING" as ReviewStatus,
    operationType: "ALL" as SpotOperationType | "ALL",
    pendingCount: 0,
    reviews: [] as SpotReviewTask[],
    loading: false,
    statusTabs: [
      { key: "PENDING", label: "待审核" },
      { key: "APPROVED", label: "已通过" },
      { key: "REJECTED", label: "已拒绝" },
    ],
    typeTabs: [
      { key: "ALL", label: "全部" },
      { key: "CREATE", label: "新增" },
      { key: "UPDATE", label: "修改" },
      { key: "DELETE", label: "删除" },
    ],
  },
  onLoad() {
    const userInfo = wx.getStorageSync("userInfo") || {};
    if (userInfo.role !== "ADMIN") {
      wx.showToast({ title: "无审核权限", icon: "none" });
      setTimeout(() => wx.switchTab({ url: TAB_PROFILE }), 600);
      return;
    }
    this.load();
  },
  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh());
  },
  onReachBottom() {
    this.load(true);
  },
  async load(append = false) {
    if (this.data.loading) {
      return;
    }
    this.setData({ loading: true });
    try {
      const reviews = await getAdminReviews({
        status: this.data.status,
        operationType: this.data.operationType,
      });
      this.setData({
        reviews: append ? this.data.reviews.concat(reviews) : reviews,
        pendingCount: await getPendingReviewCount(),
      });
    } finally {
      this.setData({ loading: false });
    }
  },
  switchStatus(event: WechatMiniprogram.TouchEvent) {
    this.setData({ status: event.currentTarget.dataset.key }, () => this.load());
  },
  switchType(event: WechatMiniprogram.TouchEvent) {
    this.setData({ operationType: event.currentTarget.dataset.key }, () => this.load());
  },
  open(event: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: toAdminReviewDetail(event.currentTarget.dataset.id) });
  },
});
