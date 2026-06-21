import { toSpotDetail, toMySpotDetail, toSpotForm } from "../../constants/routes";
import type { MySpotItem } from "../../models/index";
import {
  deleteMySpot,
  getFavoriteSpots,
  getMySpots,
  submitPublishReview,
  unfavoriteSpot,
} from "../../services/my-spot.service";
import type { CustomEvent } from "../../utils/events";

interface SpotDetailEvent {
  spot: MySpotItem;
}

Page({
  data: {
    primaryTab: "created",
    visibilityFilter: "ALL",
    reviewFilter: "ALL",
    loading: false,
    page: 1,
    hasMore: true,
    error: "",
    spots: [] as MySpotItem[],
    primaryTabs: [
      { key: "created", label: "我新增的" },
      { key: "favorite", label: "我收藏的" },
    ],
    visibilityTabs: [
      { key: "ALL", label: "全部" },
      { key: "PRIVATE", label: "私人" },
      { key: "PUBLIC", label: "公开" },
    ],
    reviewTabs: [
      { key: "ALL", label: "全部" },
      { key: "PENDING", label: "正在审核" },
      { key: "APPROVED", label: "审核通过" },
      { key: "REJECTED", label: "审核拒绝" },
    ],
  },
  onLoad() {
    this.load();
  },
  onPullDownRefresh() {
    this.load(false).finally(() => wx.stopPullDownRefresh());
  },
  onReachBottom() {
    if (this.data.hasMore) {
      this.load(true);
    }
  },
  async load(append = false) {
    if (this.data.loading) {
      return;
    }
    const page = append ? this.data.page + 1 : 1;
    this.setData({ loading: true, error: "" });
    try {
      const spots =
        this.data.primaryTab === "favorite"
          ? await getFavoriteSpots({ page })
          : await getMySpots({
              page,
              visibility: this.data.visibilityFilter === "ALL" ? "" : this.data.visibilityFilter,
              reviewStatus: this.data.reviewFilter === "ALL" ? "" : this.data.reviewFilter,
            });
      const merged = append ? this.mergeById(this.data.spots, spots) : this.mergeById([], spots);
      this.setData({
        spots: merged,
        page,
        hasMore: spots.length > 0 && merged.length > this.data.spots.length,
      });
    } catch (_error) {
      this.setData({ error: "加载失败，请重试" });
    } finally {
      this.setData({ loading: false });
    }
  },
  mergeById(current: MySpotItem[], next: MySpotItem[]) {
    const map: Record<string, MySpotItem> = {};
    current.concat(next).forEach((spot) => {
      map[spot.id] = spot;
    });
    return Object.keys(map).map((id) => map[id]);
  },
  switchPrimary(event: WechatMiniprogram.TouchEvent) {
    this.setData({ primaryTab: event.currentTarget.dataset.key, page: 1, hasMore: true }, () =>
      this.load(),
    );
  },
  switchVisibility(event: WechatMiniprogram.TouchEvent) {
    this.setData(
      { visibilityFilter: event.currentTarget.dataset.key, page: 1, hasMore: true },
      () => this.load(),
    );
  },
  switchReview(event: WechatMiniprogram.TouchEvent) {
    this.setData({ reviewFilter: event.currentTarget.dataset.key, page: 1, hasMore: true }, () =>
      this.load(),
    );
  },
  openSpot(event: CustomEvent<SpotDetailEvent>) {
    const spot = event.detail.spot;
    wx.navigateTo({
      url:
        this.data.primaryTab === "favorite"
          ? toSpotDetail(spot.id)
          : toMySpotDetail(spot.id),
    });
  },
  editSpot(event: CustomEvent<SpotDetailEvent>) {
    wx.navigateTo({ url: toSpotForm({ mode: "edit", spotId: event.detail.spot.id }) });
  },
  async removeSpot(event: CustomEvent<SpotDetailEvent>) {
    const spot = event.detail.spot;
    wx.showModal({
      title: "删除钓点",
      content: spot.visibility === "PUBLIC" ? "公开钓点删除需要提交审核。" : "确认删除该私人钓点？",
      success: async (res: WechatMiniprogram.ShowModalSuccessCallbackResult) => {
        if (!res.confirm) {
          return;
        }
        try {
          if (spot.visibility === "PUBLIC") {
            wx.navigateTo({ url: toMySpotDetail(spot.id, { delete: "1" }) });
          } else {
            await deleteMySpot(spot.id);
            wx.setStorageSync("spotsNeedRefresh", true);
            this.load();
          }
        } catch (_error) {
          wx.showToast({ title: "删除失败", icon: "none" });
        }
      },
    });
  },
  async publishSpot(event: CustomEvent<SpotDetailEvent>) {
    try {
      await submitPublishReview(event.detail.spot.id);
      wx.showToast({ title: "已提交审核" });
      this.load();
    } catch (_error) {
      wx.showToast({ title: "提交失败", icon: "none" });
    }
  },
  async unfavorite(event: CustomEvent<SpotDetailEvent>) {
    try {
      await unfavoriteSpot(event.detail.spot.id);
      this.load();
    } catch (_error) {
      wx.showToast({ title: "取消失败", icon: "none" });
    }
  },
  retry() {
    this.load();
  },
});
