import type { CommunityPost, PostComment } from "../../models/index";
import type { CustomEvent } from "../../utils/events";
import {
  createPostComment,
  getPostById,
  getPostComments,
  likePost,
  sharePost,
} from "../../services/post.service";
import { followUser, unfollowUser } from "../../services/follow.service";
import { ensureLogin } from "../../services/auth.service";
import { toSpotDetail, toUserProfile } from "../../constants/routes";
import { recordView } from "../../services/history.service";

Page({
  data: {
    post: null as CommunityPost | null,
    comments: [] as PostComment[],
    commentText: "",
    submittingComment: false,
  },
  async onLoad(options: Record<string, string>) {
    const post = await getPostById(options.id);
    if (!post) {
      wx.showToast({ title: "帖子不存在", icon: "none" });
      return;
    }
    this.setData({ post });
    this.loadComments(post.id);
    recordView(post.id).catch(() => {});
  },
  async loadComments(postId: string) {
    try {
      this.setData({ comments: await getPostComments(postId) });
    } catch (_error) {
      wx.showToast({ title: "评论加载失败", icon: "none" });
    }
  },
  async toggleLike() {
    if (!(await ensureLogin())) return;
    const post = this.data.post;
    if (!post) return;
    // 乐观更新：立即响应 UI
    const liked = !post.liked;
    const prevLiked = post.liked;
    const prevLikeCount = post.likeCount;
    this.setData({
      post: {
        ...post,
        liked,
        likeCount: post.likeCount + (liked ? 1 : -1),
      },
    });
    // 后台发请求，失败则回滚
    try {
      await likePost(post.id, prevLiked);
    } catch (_error) {
      this.setData({
        post: {
          ...this.data.post!,
          liked: prevLiked,
          likeCount: prevLikeCount,
        },
      });
      wx.showToast({ title: "操作失败", icon: "none" });
    }
  },
  async toggleFollow() {
    if (!(await ensureLogin())) return;
    const post = this.data.post;
    if (!post) {
      return;
    }
    const willFollow = !post.author.followed;
    const api = willFollow ? followUser : unfollowUser;
    try {
      await api(post.author.id);
    } catch (_error) {
      wx.showToast({ title: "操作失败", icon: "none" });
      return;
    }
    this.setData({
      post: {
        ...post,
        author: {
          ...post.author,
          followed: willFollow,
        },
      },
    });
  },
  previewImage(event: CustomEvent<{ post: CommunityPost; index: number }>) {
    const { post, index } = event.detail;
    wx.previewImage({
      urls: post.images,
      current: post.images[index],
    });
  },
  async sharePost() {
    if (!(await ensureLogin())) return;
    const post = this.data.post;
    if (!post) return;
    try {
      await sharePost(post.id);
      this.setData({ post: { ...post, shareCount: post.shareCount + 1 } });
    } catch (_error) {
      wx.showToast({ title: "分享计数失败", icon: "none" });
    }
  },
  onCommentInput(event: WechatMiniprogram.Input) {
    this.setData({ commentText: event.detail.value });
  },
  async submitComment() {
    if (!(await ensureLogin())) return;
    const post = this.data.post;
    const content = this.data.commentText.trim();
    if (!post || !content) {
      wx.showToast({ title: "请输入评论", icon: "none" });
      return;
    }
    this.setData({ submittingComment: true });
    try {
      await createPostComment(post.id, content);
      this.setData({
        commentText: "",
        post: { ...post, commentCount: post.commentCount + 1 },
      });
      await this.loadComments(post.id);
    } catch (_error) {
      wx.showToast({ title: "评论失败", icon: "none" });
    } finally {
      this.setData({ submittingComment: false });
    }
  },
  openSpot(event: CustomEvent<{ post: CommunityPost }>) {
    const spotId = event.detail.post.spot?.id;
    if (spotId) {
      wx.navigateTo({ url: toSpotDetail(spotId) });
    }
  },
  openUser(event: CustomEvent<{ userId: string }>) {
    const userId = event.detail.userId;
    if (userId) {
      wx.navigateTo({ url: toUserProfile(userId) });
    }
  },
  onShareAppMessage() {
    const post = this.data.post;
    if (!post) return { title: "GoFish" };
    // 异步更新分享计数
    sharePost(post.id)
      .then(() => {
        const p = this.data.post;
        if (p) {
          this.setData({ post: { ...p, shareCount: p.shareCount + 1 } });
        }
      })
      .catch(() => {});
    return {
      title: post.content?.substring(0, 30) || `${post.author.nickname}的分享`,
      path: `/pages/post-detail/index?id=${post.id}`,
      imageUrl: post.images?.[0] || "",
    };
  },
  onShareTimeline() {
    const post = this.data.post;
    if (!post) return { title: "GoFish" };
    return {
      title: post.content?.substring(0, 30) || `${post.author.nickname}的分享`,
      query: `id=${post.id}`,
      imageUrl: post.images?.[0] || "",
    };
  },
});
