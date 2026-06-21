import type { CommunityPost, FishingSpot, UserProfile } from "../../models/index";
import { getUserPosts, sharePost } from "../../services/post.service";
import { getUserPublicSpots } from "../../services/spot.service";
import { getUserProfile } from "../../services/user.service";
import type { CustomEvent } from "../../utils/events";
import { toPostDetail, toSpotDetail } from "../../constants/routes";

Page({
  data: {
    userId: "",
    user: null as UserProfile | null,
    spots: [] as FishingSpot[],
    posts: [] as CommunityPost[],
  },
  onLoad(options: Record<string, string>) {
    this.setData({ userId: options.userId || "" });
    this.loadProfile();
  },
  onPullDownRefresh() {
    this.loadProfile().finally(() => wx.stopPullDownRefresh());
  },
  async loadProfile() {
    if (!this.data.userId) return;
    try {
      const [user, spots, posts] = await Promise.all([
        getUserProfile(this.data.userId),
        getUserPublicSpots(this.data.userId),
        getUserPosts(this.data.userId),
      ]);
      this.setData({ user, spots, posts });
    } catch (_error) {
      wx.showToast({ title: "主页加载失败", icon: "none" });
    }
  },
  openSpot(event: WechatMiniprogram.TouchEvent | CustomEvent<{ spot: FishingSpot }>) {
    const id =
      event.currentTarget?.dataset?.id || (event.detail?.spot as FishingSpot | undefined)?.id;
    if (id) {
      wx.navigateTo({ url: toSpotDetail(id) });
    }
  },
  openPost(event: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: toPostDetail(event.currentTarget.dataset.id) });
  },
  previewImage(event: CustomEvent<{ post: CommunityPost; index: number }>) {
    const { post, index } = event.detail;
    wx.previewImage({ urls: post.images, current: post.images[index] });
  },
  async sharePost(event: CustomEvent<{ post: CommunityPost }>) {
    const target = event.detail.post;
    try {
      await sharePost(target.id);
      this.setData({
        posts: this.data.posts.map((post) =>
          post.id === target.id ? { ...post, shareCount: post.shareCount + 1 } : post,
        ),
      });
    } catch (_error) {
      wx.showToast({ title: "分享计数失败", icon: "none" });
    }
  },
});
