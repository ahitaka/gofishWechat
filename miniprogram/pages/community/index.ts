import { TAB_COMMUNITY, toPostDetail, toSpotDetail } from "../../constants/routes";
import type { CommunityPost } from "../../models/index";
import type { CustomEvent } from "../../utils/events";
import { getPosts, likePost, sharePost } from "../../services/post.service";
import { followUser, unfollowUser } from "../../services/follow.service";

Page({
  data: {
    tabs: [
      { key: "latest", label: "最新" },
      { key: "hot", label: "热门" },
      { key: "follow", label: "关注" },
    ],
    activeTab: "latest",
    page: 1,
    spotFilter: null as { spotId: string; spotName: string } | null,
    posts: [] as CommunityPost[],
    currentUserId: "",
    shareTarget: null as CommunityPost | null,
  },
  onLoad() {
    const userInfo = wx.getStorageSync("userInfo") || {};
    this.setData({ currentUserId: userInfo.id ? String(userInfo.id) : "" });
    this.loadPosts();
  },
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: "pages/community/index" });
    }
    if (wx.getStorageSync("communityNeedRefresh")) {
      wx.removeStorageSync("communityNeedRefresh");
      this.setData({ activeTab: "latest", page: 1 }, () => this.loadPosts());
    }
    const spotFilter = wx.getStorageSync("communitySpotFilter");
    if (spotFilter?.spotId) {
      wx.removeStorageSync("communitySpotFilter");
      this.setData({ activeTab: "latest", page: 1, spotFilter }, () => this.loadPosts());
    }
  },
  onPullDownRefresh() {
    this.setData({ page: 1 }, () => {
      this.loadPosts().finally(() => wx.stopPullDownRefresh());
    });
  },
  onReachBottom() {
    const page = this.data.page + 1;
    getPosts(this.data.activeTab, page, this.data.spotFilter?.spotId || "").then((posts) => {
      this.setData({
        page,
        posts: this.data.posts.concat(posts),
      });
    });
  },
  async loadPosts() {
    try {
      this.setData({
        posts: await getPosts(
          this.data.activeTab,
          this.data.page,
          this.data.spotFilter?.spotId || "",
        ),
      });
    } catch (_error) {
      wx.showToast({ title: "动态加载失败", icon: "none" });
    }
  },
  switchFeed(event: WechatMiniprogram.TouchEvent) {
    this.setData(
      {
        activeTab: event.currentTarget.dataset.key,
        page: 1,
      },
      () => this.loadPosts(),
    );
  },
  clearSpotFilter() {
    this.setData({ spotFilter: null, page: 1 }, () => this.loadPosts());
  },
  async toggleLike(event: CustomEvent<{ post: CommunityPost }>) {
    const target = event.detail.post;
    try {
      await likePost(target.id, target.liked);
    } catch (_error) {
      wx.showToast({ title: "操作失败", icon: "none" });
      return;
    }
    const posts = this.data.posts.map((post) => {
      if (post.id !== target.id) {
        return post;
      }
      const liked = !post.liked;
      return {
        ...post,
        liked,
        likeCount: post.likeCount + (liked ? 1 : -1),
      };
    });
    this.setData({ posts });
  },
  async toggleFollow(event: CustomEvent<{ post: CommunityPost }>) {
    const target = event.detail.post;
    if (String(target.author.id) === String(this.data.currentUserId)) {
      return;
    }
    const willFollow = !target.author.followed;
    const api = willFollow ? followUser : unfollowUser;
    try {
      await api(target.author.id);
    } catch (_error) {
      wx.showToast({ title: "操作失败", icon: "none" });
      return;
    }
    const posts = this.data.posts.map((post) => {
      if (post.author.id !== target.author.id) {
        return post;
      }
      return {
        ...post,
        author: {
          ...post.author,
          followed: willFollow,
        },
      };
    });
    this.setData({ posts });
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
  async sharePost(event: CustomEvent<{ post: CommunityPost }>) {
    const target = event.detail.post;
    // 记录当前分享的帖子，供 onShareAppMessage 使用
    this.setData({ shareTarget: target });
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
  openSpot(event: CustomEvent<{ post: CommunityPost }>) {
    const spotId = event.detail.post.spot?.id;
    if (spotId) {
      wx.navigateTo({
        url: toSpotDetail(spotId),
      });
    }
  },
  onShareAppMessage() {
    const target = this.data.shareTarget;
    if (target) {
      return {
        title: target.content?.substring(0, 30) || `${target.author.nickname}的分享`,
        path: `/pages/post-detail/index?id=${target.id}`,
        imageUrl: target.images?.[0] || "",
      };
    }
    return {
      title: "看看钓友们的新鱼获",
      path: TAB_COMMUNITY,
    };
  },
  onShareTimeline() {
    const target = this.data.shareTarget;
    if (target) {
      return {
        title: target.content?.substring(0, 30) || `${target.author.nickname}的分享`,
        query: `id=${target.id}`,
        imageUrl: target.images?.[0] || "",
      };
    }
    return {
      title: "看看钓友们的新鱼获",
      query: "",
    };
  },
});
