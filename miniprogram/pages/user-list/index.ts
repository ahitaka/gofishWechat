import type { UserProfile } from "../../models/index";
import { getUserFollowers, getUserFollowing } from "../../services/user.service";
import { toUserProfile } from "../../constants/routes";

Page({
  data: {
    title: "用户",
    userId: "",
    type: "followers",
    users: [] as UserProfile[],
  },
  onLoad(options: Record<string, string>) {
    const type = options.type === "following" ? "following" : "followers";
    this.setData({
      userId: options.userId || "",
      type,
      title: type === "following" ? "关注" : "粉丝",
    });
    this.loadUsers();
  },
  onPullDownRefresh() {
    this.loadUsers().finally(() => wx.stopPullDownRefresh());
  },
  async loadUsers() {
    if (!this.data.userId) return;
    try {
      const users =
        this.data.type === "following"
          ? await getUserFollowing(this.data.userId)
          : await getUserFollowers(this.data.userId);
      this.setData({ users });
    } catch (_error) {
      wx.showToast({ title: "用户加载失败", icon: "none" });
    }
  },
  openUser(event: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: toUserProfile(event.currentTarget.dataset.id) });
  },
});
