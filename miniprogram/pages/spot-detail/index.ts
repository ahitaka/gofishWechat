import { TAB_SPOTS, TAB_COMMUNITY, TAB_PUBLISH, toSpotForm } from "../../constants/routes";
import type { FishingSpot, SpotReview } from "../../models/index";
import { submitDeleteReview } from "../../services/my-spot.service";
import {
  favoriteSpot,
  getSpotById,
  getSpotReviews,
  submitSpotReview,
  unfavoriteSpot,
} from "../../services/spot.service";

const NAV_APPS = ["高德地图", "百度地图"];

interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
}

function feeText(spot: FishingSpot): string {
  if (spot.feeType === "free") return "免费";
  if (spot.feeType === "paid") return spot.feeAmount ? `收费 ${spot.feeAmount}元` : "收费";
  return "未知";
}

Page({
  data: {
    spot: null as FishingSpot | null,
    feeText: "未知",
    fishText: "",
    markers: [] as MapMarker[],
    reviews: [] as SpotReview[],
    reviewRating: 5,
    reviewContent: "",
    ratingOptions: [1, 2, 3, 4, 5],
    reviewSubmitting: false,
  },
  async onLoad(options: Record<string, string>) {
    const spot = await getSpotById(options.id);
    if (!spot) {
      wx.showToast({ title: "钓点不存在", icon: "none" });
      return;
    }
    this.setData({
      spot,
      feeText: feeText(spot),
      fishText: (spot.fishSpecies || []).join("、"),
      markers: [
        {
          id: 1,
          latitude: spot.latitude,
          longitude: spot.longitude,
          width: 34,
          height: 34,
        },
      ],
    });
    this.loadReviews(spot.id);
  },
  async loadReviews(id: string) {
    try {
      this.setData({ reviews: await getSpotReviews(id) });
    } catch (_error) {
      this.setData({ reviews: [] });
    }
  },
  setReviewRating(event: WechatMiniprogram.TouchEvent) {
    this.setData({ reviewRating: Number(event.currentTarget.dataset.rating) });
  },
  onReviewInput(event: WechatMiniprogram.Input) {
    this.setData({ reviewContent: event.detail.value });
  },
  async submitReview() {
    const spot = this.data.spot;
    if (!spot || this.data.reviewSubmitting) {
      return;
    }
    this.setData({ reviewSubmitting: true });
    try {
      await submitSpotReview(spot.id, this.data.reviewRating, this.data.reviewContent);
      wx.showToast({ title: "评价成功" });
      this.setData({ reviewContent: "" });
      const nextSpot = await getSpotById(spot.id);
      if (nextSpot) {
        this.setData({ spot: nextSpot });
      }
      this.loadReviews(spot.id);
    } catch (_error) {
      wx.showToast({
        title: _error instanceof Error ? _error.message.slice(0, 28) : "评价失败",
        icon: "none",
      });
    } finally {
      this.setData({ reviewSubmitting: false });
    }
  },
  async favorite() {
    const spot = this.data.spot;
    if (!spot) {
      return;
    }
    const isFavorite = !!spot.isFavorite;
    try {
      if (isFavorite) {
        await unfavoriteSpot(spot.id);
      } else {
        await favoriteSpot(spot.id);
      }
      this.setData({
        spot: {
          ...spot,
          isFavorite: !isFavorite,
        },
      });
      wx.showToast({ title: isFavorite ? "已取消收藏" : "已收藏" });
    } catch (_error) {
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },
  editSpot() {
    const spot = this.data.spot;
    if (spot) {
      wx.navigateTo({ url: toSpotForm({ mode: "edit", spotId: spot.id }) });
    }
  },
  openNavigation() {
    const spot = this.data.spot;
    if (!spot || !spot.latitude || !spot.longitude) {
      wx.showToast({ title: "钓点坐标缺失", icon: "none" });
      return;
    }
    wx.showActionSheet({
      itemList: NAV_APPS,
      success: () => {
        wx.openLocation({
          latitude: spot.latitude,
          longitude: spot.longitude,
          name: spot.name,
          address: spot.address,
          scale: 18,
        });
      },
    });
  },
  openSpotPosts() {
    const spot = this.data.spot;
    if (!spot) {
      return;
    }
    wx.setStorageSync("communitySpotFilter", { spotId: spot.id, spotName: spot.name });
    wx.switchTab({ url: TAB_COMMUNITY });
  },
  requestDelete() {
    const spot = this.data.spot;
    if (!spot) {
      return;
    }
    wx.showModal({
      title: "申请删除",
      editable: true,
      placeholderText: "请输入 5 至 500 字删除原因",
      success: async (res: WechatMiniprogram.ShowModalSuccessCallbackResult) => {
        const reason = res.content || "";
        if (!res.confirm) {
          return;
        }
        if (reason.length < 5 || reason.length > 500) {
          wx.showToast({ title: "删除原因需 5 至 500 字", icon: "none" });
          return;
        }
        await submitDeleteReview(spot.id, reason);
        wx.showToast({ title: "已提交删除审核" });
      },
    });
  },
  publish() {
    wx.switchTab({ url: TAB_PUBLISH });
  },
});
