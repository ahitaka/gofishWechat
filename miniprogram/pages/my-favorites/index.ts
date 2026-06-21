import type { MySpotItem } from "../../models/index";
import type { CustomEvent } from "../../utils/events";
import { getFavoriteSpots, unfavoriteSpot } from "../../services/my-spot.service";
import { toMySpotDetail, toSpotDetail } from "../../constants/routes";

Page({
  data: {
    favorites: [] as MySpotItem[],
    page: 1,
    loading: false,
    noMore: false,
  },
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: "pages/profile/index" });
    }
    this.setData({ page: 1, noMore: false }, () => this.loadFavorites());
  },
  onLoad() {
    this.loadFavorites();
  },
  onPullDownRefresh() {
    this.setData({ page: 1, noMore: false }, () => {
      this.loadFavorites().finally(() => wx.stopPullDownRefresh());
    });
  },
  onReachBottom() {
    if (this.data.loading || this.data.noMore) return;
    this.setData({ page: this.data.page + 1 }, () => this.loadFavorites());
  },
  async loadFavorites() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const list = await getFavoriteSpots({ page: this.data.page, size: 20 });
      const favorites = this.data.page === 1 ? list : this.data.favorites.concat(list);
      this.setData({
        favorites,
        noMore: list.length < 20,
      });
    } catch (_error) {
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },
  openSpot(event: CustomEvent<{ spot: MySpotItem }>) {
    const spot = event.detail.spot;
    const id = spot.id;
    const url =
      spot.visibility === "PRIVATE"
        ? toMySpotDetail(id)
        : toSpotDetail(id);
    wx.navigateTo({ url });
  },
  async toggleFavorite(event: CustomEvent<{ spot: MySpotItem }>) {
    const id = event.detail.spot.id;
    try {
      await unfavoriteSpot(id);
      this.setData({
        favorites: this.data.favorites.filter((spot) => spot.id !== id),
      });
      wx.showToast({ title: "已取消收藏" });
    } catch (_error) {
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },
});
