import { TAB_COMMUNITY, toSpotDetail, toMySpotDetail, toSpotForm } from "../../constants/routes";
import type { FishingSpot, SpotType } from "../../models/index";
import { login } from "../../services/auth.service";
import { getMapSpots } from "../../services/spot.service";
import type { CustomEvent } from "../../utils/events";

type FilterValue = SpotType | "all";

interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  width: number;
  height: number;
  callout?: {
    content: string;
    color: string;
    bgColor: string;
    borderRadius: number;
    padding: number;
    display: string;
  };
}

interface MapCircle {
  latitude: number;
  longitude: number;
  color: string;
  fillColor: string;
  radius: number;
  strokeWidth: number;
}

const sortLabels = ["默认排序", "距离最近", "评分最高", "热度最高"];
const MAX_DISTANCE_KM = 10;

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (toLat - fromLat) * rad;
  const dLng = (toLng - fromLng) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat * rad) * Math.cos(toLat * rad) * Math.sin(dLng / 2) ** 2;
  return Number((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

function buildMarkers(spots: FishingSpot[]): MapMarker[] {
  return spots.map((spot, index) => ({
    id: index + 1,
    latitude: spot.latitude,
    longitude: spot.longitude,
    width: spot.isMine ? 20 : 17,
    height: spot.isMine ? 20 : 17,
    callout: {
      content: spot.isMine ? `我的：${spot.name}` : spot.name,
      color: "#222222",
      bgColor: "#FFFFFF",
      borderRadius: 8,
      padding: 8,
      display: "BYCLICK",
    },
  }));
}

function withDistance(spots: FishingSpot[], latitude: number, longitude: number): FishingSpot[] {
  return spots.map((spot) => ({
    ...spot,
    distanceKm: distanceKm(latitude, longitude, spot.latitude, spot.longitude),
  }));
}

Page({
  data: {
    latitude: 31.2304,
    longitude: 121.4737,
    userLatitude: 31.2304,
    userLongitude: 121.4737,
    keyword: "",
    activeFilter: "all" as FilterValue,
    selectedSpotId: "spot_001",
    scrollTarget: "",
    sortIndex: 0,
    sortLabels,
    filters: [
      { label: "全部", value: "all" },
      { label: "江河", value: "RIVER" },
      { label: "湖库", value: "LAKE" },
      { label: "黑坑", value: "BLACK_PIT" },
      { label: "野钓", value: "OTHER" },
      { label: "筛选", value: "all" },
    ],
    spots: [] as FishingSpot[],
    mapSpots: [] as FishingSpot[],
    markers: [] as MapMarker[],
    circles: [] as MapCircle[],
    selectingCreatePoint: false,
    creatingSpot: false,
  },
  onLoad() {
    this.locateUser(false);
    this.refreshSpots();
  },
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: "pages/spots/index" });
    }
    this.refreshSpots();
  },
  onPullDownRefresh() {
    this.refreshSpots().finally(() => wx.stopPullDownRefresh());
  },
  async refreshSpots() {
    try {
      await this.ensureLogin();
      const mapSpots = withDistance(
        await getMapSpots(this.data.activeFilter, this.data.keyword),
        this.data.userLatitude,
        this.data.userLongitude,
      );
      const spots = mapSpots.filter((spot) => {
        const matchKeyword =
          !this.data.keyword ||
          spot.name.includes(this.data.keyword) ||
          spot.address.includes(this.data.keyword);
        return matchKeyword && spot.distanceKm <= MAX_DISTANCE_KM;
      });
      this.setData({
        spots,
        selectedSpotId: spots[0]?.id || "",
        mapSpots,
        markers: buildMarkers(mapSpots),
      });
    } catch (_error) {
      wx.showToast({ title: "钓点加载失败", icon: "none" });
    }
  },
  onKeywordInput(event: WechatMiniprogram.Input) {
    this.setData({ keyword: event.detail.value });
  },
  searchSpots() {
    this.refreshSpots();
  },
  changeFilter(event: WechatMiniprogram.TouchEvent) {
    this.setData({ activeFilter: event.currentTarget.dataset.value as FilterValue }, () => {
      this.refreshSpots();
    });
  },
  changeSort(event: WechatMiniprogram.PickerChange) {
    const sortIndex = Number(event.detail.value);
    const spots = [...this.data.spots];
    if (sortIndex === 1) {
      spots.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    if (sortIndex === 2) {
      spots.sort((a, b) => b.rating - a.rating);
    }
    if (sortIndex === 3) {
      spots.sort((a, b) => (b.heat || 0) - (a.heat || 0));
    }
    this.setData({ sortIndex, spots });
  },
  locateUser(showError = true) {
    wx.getLocation({
      type: "gcj02",
      success: (res: WechatMiniprogram.GetLocationSuccessCallbackResult) => {
        this.setData(
          {
            latitude: res.latitude,
            longitude: res.longitude,
            userLatitude: res.latitude,
            userLongitude: res.longitude,
            circles: [
              {
                latitude: res.latitude,
                longitude: res.longitude,
                color: "#2F80ED33",
                fillColor: "#2F80ED22",
                radius: 600,
                strokeWidth: 1,
              },
            ],
          },
          () => {
            this.refreshSpots();
          },
        );
      },
      fail: () => {
        if (showError) {
          wx.showModal({
            title: "需要位置权限",
            content: "请授权位置信息以查找附近钓点。",
          });
        }
      },
    });
  },
  handleLocateTap() {
    this.locateUser(true);
  },
  onMarkerTap(event: WechatMiniprogram.MarkerTap) {
    const spot = this.data.mapSpots[event.detail.markerId - 1];
    if (!spot) {
      return;
    }
    this.setData({
      latitude: spot.latitude,
      longitude: spot.longitude,
      selectedSpotId: spot.id,
      scrollTarget: `spot-${spot.id}`,
    });
  },
  async ensureLogin() {
    if (wx.getStorageSync("accessToken")) {
      return;
    }
    try {
      await login();
    } catch (_error) {
      wx.showToast({ title: "当前为本地体验模式", icon: "none" });
    }
  },
  startCreateSpot() {
    this.setData({ selectingCreatePoint: true });
  },
  cancelCreateSpot() {
    this.setData({ selectingCreatePoint: false });
  },
  async openCreateSpot(latitude: number, longitude: number) {
    if (this.data.creatingSpot) {
      return;
    }
    if (!latitude || !longitude) {
      wx.showToast({ title: "未获取到地图坐标", icon: "none" });
      return;
    }
    this.setData({ creatingSpot: true });
    await this.ensureLogin();
    wx.navigateTo({
      url: toSpotForm({ mode: "create", latitude, longitude }),
      complete: () => {
        this.setData({ creatingSpot: false, selectingCreatePoint: false });
      },
    });
  },
  confirmCreateSpot() {
    if (this.data.creatingSpot) {
      return;
    }
    wx.createMapContext("spotMap").getCenterLocation({
      success: (res: WechatMiniprogram.GetCenterLocationSuccessCallbackResult) => {
        this.openCreateSpot(Number(res.latitude), Number(res.longitude));
      },
      fail: () => {
        wx.showToast({ title: "未获取到地图坐标", icon: "none" });
      },
    });
  },
  selectSpot(event: CustomEvent<{ spot: FishingSpot }>) {
    const spot = event.detail.spot;
    this.setData({
      latitude: spot.latitude,
      longitude: spot.longitude,
      selectedSpotId: spot.id,
    });
    wx.navigateTo({
      url: spot.isMine
        ? toMySpotDetail(spot.id)
        : toSpotDetail(spot.id),
    });
  },
  openSpotPosts(event: CustomEvent<{ spot: FishingSpot }>) {
    const spot = event.detail.spot;
    wx.setStorageSync("communitySpotFilter", {
      spotId: spot.id,
      spotName: spot.name,
    });
    wx.switchTab({ url: TAB_COMMUNITY });
  },
});
