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
import { toSpotDetail } from "../../constants/routes";
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
    const post = this.data.post;
    if (!post) {
      return;
    }
    try {
      await likePost(post.id, post.liked);
    } catch (_error) {
      wx.showToast({ title: "操作失败", icon: "none" });
      return;
    }
    const liked = !post.liked;
    this.setData({
      post: {
        ...post,
        liked,
        likeCount: post.likeCount + (liked ? 1 : -1),
      },
    });
  },
  async toggleFollow() {
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
});
