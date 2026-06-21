import { PAGE_HISTORY, PAGE_MY_FAVORITES, PAGE_MY_POSTS, PAGE_MY_SPOTS, PAGE_SETTINGS, PAGE_ADMIN_REVIEWS, toUserList } from "../../constants/routes";
import { getPendingReviewCount } from "../../services/admin-review.service";
import { login } from "../../services/auth.service";
import { getUserProfile } from "../../services/user.service";

Page({
  data: {
    isAdmin: false,
    pendingReviewCount: 0,
    userInfo: {
      id: "",
      nickname: "钓友",
      avatarUrl: "/images/avatar.png",
      level: 1,
      role: "USER",
    },
    stats: [
      { key: "following", label: "关注", value: 0 },
      { key: "followers", label: "粉丝", value: 0 },
      { key: "likes", label: "获赞", value: 0 },
    ],
    menus: [
      { title: "我的发布" },
      { title: "我的收藏" },
      { title: "我的钓点" },
      { title: "我的审核", adminOnly: true },
      { title: "浏览历史" },
      { title: "设置" },
    ],
  },
  async onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: "pages/profile/index" });
    }
    let userInfo = wx.getStorageSync("userInfo") || {};
    if (!userInfo.id) {
      try {
        userInfo = await login();
      } catch (_error) {
        userInfo = this.data.userInfo;
      }
    }
    if (userInfo.id) {
      try {
        userInfo = await getUserProfile(String(userInfo.id));
        wx.setStorageSync("userInfo", userInfo);
      } catch (_error) {
        userInfo = wx.getStorageSync("userInfo") || userInfo;
      }
    }
    const isAdmin = userInfo.role === "ADMIN";
    this.setData({
      userInfo: {
        ...userInfo,
        nickname: userInfo.nickname || "钓友",
        avatarUrl: userInfo.avatarUrl || "/images/avatar.png",
        level: userInfo.level || 1,
      },
      stats: [
        { key: "following", label: "关注", value: userInfo.followingCount ?? 0 },
        { key: "followers", label: "粉丝", value: userInfo.followerCount ?? 0 },
        { key: "likes", label: "获赞", value: userInfo.likedCount ?? 0 },
      ],
      isAdmin,
      pendingReviewCount: isAdmin ? await getPendingReviewCount() : 0,
    });
  },
  openStat(event: WechatMiniprogram.TouchEvent) {
    const key = event.currentTarget.dataset.key;
    if (key === "followers" || key === "following") {
      wx.navigateTo({ url: toUserList(this.data.userInfo.id, key) });
    }
  },
  openMenu(event: WechatMiniprogram.TouchEvent) {
    const title = event.currentTarget.dataset.title;
    if (title === "我的发布") {
      wx.navigateTo({ url: PAGE_MY_POSTS });
    }
    if (title === "我的收藏") {
      wx.navigateTo({ url: PAGE_MY_FAVORITES });
    }
    if (title === "我的钓点") {
      wx.navigateTo({ url: PAGE_MY_SPOTS });
    }
    if (title === "我的审核") {
      wx.navigateTo({ url: PAGE_ADMIN_REVIEWS });
    }
    if (title === "浏览历史") {
      wx.navigateTo({ url: PAGE_HISTORY });
    }
    if (title === "设置") {
      wx.navigateTo({ url: PAGE_SETTINGS });
    }
  },
});
