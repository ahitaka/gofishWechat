import type { SpotReviewDetail } from "../../../models/index";
import {
  approveReview,
  getAdminReviewDetail,
  rejectReview,
} from "../../../services/admin-review.service";

interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
}

function isConflictError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("409");
}

Page({
  data: {
    id: "",
    detail: null as SpotReviewDetail | null,
    submitting: false,
    markers: [] as MapMarker[],
  },
  onLoad(options: Record<string, string>) {
    this.setData({ id: options.id || "" });
    this.load(options.id);
  },
  async load(id?: string) {
    const detail = await getAdminReviewDetail(id || this.data.id);
    if (!detail) {
      wx.showToast({ title: "审核不存在", icon: "none" });
      return;
    }
    const point = detail.after || detail.before || {};
    this.setData({
      detail,
      markers:
        point.latitude && point.longitude
          ? [{ id: 1, latitude: point.latitude, longitude: point.longitude }]
          : [],
    });
  },
  approve() {
    wx.showModal({
      title: "审核通过",
      content: "确认通过该审核申请？",
      success: async (res: WechatMiniprogram.ShowModalSuccessCallbackResult) => {
        if (!res.confirm || !this.data.detail) {
          return;
        }
        this.setData({ submitting: true });
        try {
          await approveReview(this.data.detail.id, this.data.detail.version);
          wx.showToast({ title: "已通过" });
          this.load();
        } catch (_error) {
          wx.showToast({
            title: isConflictError(_error) ? "该申请已被处理" : "操作失败",
            icon: "none",
          });
          this.load();
        } finally {
          this.setData({ submitting: false });
        }
      },
    });
  },
  reject() {
    wx.showModal({
      title: "审核拒绝",
      editable: true,
      placeholderText: "请输入 5 至 500 字拒绝原因",
      success: async (res: WechatMiniprogram.ShowModalSuccessCallbackResult) => {
        const reason = res.content || "";
        if (!res.confirm || !this.data.detail) {
          return;
        }
        if (reason.length < 5 || reason.length > 500) {
          wx.showToast({ title: "原因需 5 至 500 字", icon: "none" });
          return;
        }
        this.setData({ submitting: true });
        try {
          await rejectReview(this.data.detail.id, reason, this.data.detail.version);
          wx.showToast({ title: "已拒绝" });
          this.load();
        } catch (_error) {
          wx.showToast({
            title: isConflictError(_error) ? "该申请已被处理" : "操作失败",
            icon: "none",
          });
          this.load();
        } finally {
          this.setData({ submitting: false });
        }
      },
    });
  },
});
