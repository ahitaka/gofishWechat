import type { CommunityPost } from "../../models/index";
import type { CustomEvent } from "../../utils/events";
import { login } from "../../services/auth.service";
import { getUserPosts, sharePost } from "../../services/post.service";
import { toPostDetail, toSpotDetail } from "../../constants/routes";
Page({
  data: {
    page: 1,
    posts: [] as CommunityPost[],
    currentUserId: "" as string,
  },
  onLoad() {
    this.loadPosts();
  },
  onPullDownRefresh() {
    this.setData({ page: 1 }, () => {
      this.loadPosts().finally(() => wx.stopPullDownRefresh());
    });
  },
  onReachBottom() {
    const page = this.data.page + 1;
    this.loadPosts(page, true);
  },
  async loadPosts(page = 1, append = false) {
    try {
      const userInfo = await login();
      const posts = await getUserPosts(String(userInfo.id), page);
      this.setData({
        page,
        posts: append ? this.data.posts.concat(posts) : posts,
        currentUserId: String(userInfo.id),
      });
    } catch (_error) {
      wx.showToast({ title: "动态加载失败", icon: "none" });
    }
  },
  previewImage(event: CustomEvent<{ post: CommunityPost; index: number }>) {
    const { post, index } = event.detail;
    wx.previewImage({
      urls: post.images,
      current: post.images[index],
    });
  },
  openComment(event: CustomEvent<{ post: CommunityPost }>) {
    wx.navigateTo({
      url: toPostDetail(event.detail.post.id),
    });
  },
  openSpot(event: CustomEvent<{ post: CommunityPost }>) {
    const spotId = event.detail.post.spot?.id;
    if (spotId) {
      wx.navigateTo({
        url: toSpotDetail(spotId),
      });
    }
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
