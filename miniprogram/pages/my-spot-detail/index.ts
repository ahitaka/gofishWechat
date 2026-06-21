import type { FishingSpot, MySpotDetail, SpotReview } from "../../models/index";
import {
  cancelReview,
  deleteMySpot,
  getMySpotDetail,
  submitDeleteReview,
  submitPublishReview,
} from "../../services/my-spot.service";
import {
  favoriteSpot,
  getSpotById,
  getSpotReviews,
  submitSpotReview,
  unfavoriteSpot,
} from "../../services/spot.service";
import { TAB_COMMUNITY, toSpotForm } from "../../constants/routes";

const NAV_APPS = ["高德地图", "百度地图"];

interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

Page({
  data: {
    spot: null as MySpotDetail | null,
    publicSpot: null as FishingSpot | null,
    isFavorite: false,
    fishText: "",
    markers: [] as MapMarker[],
    loading: false,
    reviews: [] as SpotReview[],
    reviewRating: 5,
    reviewContent: "",
    ratingOptions: [1, 2, 3, 4, 5],
    reviewSubmitting: false,
    createdAtText: "",
    updatedAtText: "",
  },
  onLoad(options: Record<string, string>) {
    this.load(options.id);
  },
  async load(id: string) {
    this.setData({ loading: true });
    try {
      const spot = await getMySpotDetail(id);
      if (!spot) {
        wx.showToast({ title: "钓点不存在", icon: "none" });
        return;
      }
      this.setData({
        spot,
        publicSpot: null,
        reviews: [],
        isFavorite: !!spot.isFavorite,
        fishText: (spot.fishSpecies || []).join("、"),
        markers: [
          { id: 1, latitude: spot.latitude, longitude: spot.longitude, width: 34, height: 34 },
        ],
        createdAtText: formatDate(spot.createdAt),
        updatedAtText: formatDate(spot.updatedAt),
      });
      if (spot.visibility === "PUBLIC") {
        this.loadPublicDetail(spot.id);
      }
    } finally {
      this.setData({ loading: false });
    }
  },
  async loadPublicDetail(id: string) {
    try {
      const publicSpot = await getSpotById(id);
      this.setData({ publicSpot });
      this.loadReviews(id);
    } catch (_error) {
      this.setData({ publicSpot: null, reviews: [] });
    }
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
      this.loadPublicDetail(spot.id);
    } catch (_error) {
      wx.showToast({
        title: _error instanceof Error ? _error.message.slice(0, 28) : "评价失败",
        icon: "none",
      });
    } finally {
      this.setData({ reviewSubmitting: false });
    }
  },
  openSpotPosts() {
    const spot = this.data.publicSpot;
    if (!spot) {
      return;
    }
    wx.setStorageSync("communitySpotFilter", { spotId: spot.id, spotName: spot.name });
    wx.switchTab({ url: TAB_COMMUNITY });
  },
  edit() {
    if (this.data.spot) {
      wx.navigateTo({ url: toSpotForm({ mode: "edit", spotId: this.data.spot?.id || "" }) });
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
  async publish() {
    if (!this.data.spot) {
      return;
    }
    await submitPublishReview(this.data.spot.id);
    wx.showToast({ title: "已提交审核" });
    this.load(this.data.spot.id);
  },
  remove() {
    const spot = this.data.spot;
    if (!spot) {
      return;
    }
    if (spot.visibility === "PUBLIC") {
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
          this.load(spot.id);
        },
      });
      return;
    }
    wx.showModal({
      title: "删除钓点",
      content: "确认删除该私人钓点？",
      success: async (res) => {
        if (res.confirm) {
          await deleteMySpot(spot.id);
          wx.setStorageSync("spotsNeedRefresh", true);
          wx.navigateBack();
        }
      },
    });
  },
  async cancel() {
    if (!this.data.spot) {
      return;
    }
    await cancelReview(this.data.spot.id);
    wx.showToast({ title: "已取消" });
    this.load(this.data.spot.id);
  },
  async toggleFavorite() {
    const spot = this.data.spot;
    if (!spot) {
      return;
    }
    const next = !this.data.isFavorite;
    try {
      if (next) {
        await favoriteSpot(spot.id);
        wx.showToast({ title: "已收藏" });
      } else {
        await unfavoriteSpot(spot.id);
        wx.showToast({ title: "已取消收藏", icon: "none" });
      }
      this.setData({
        isFavorite: next,
        spot: { ...spot, isFavorite: next },
      });
    } catch (_error) {
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },
});
