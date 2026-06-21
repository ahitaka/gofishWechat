Component({
  properties: {
    post: Object,
    currentUserId: String,
  },
  data: {
    liking: false,
  },
  methods: {
    toggleLike() {
      this.setData({ liking: true });
      this.triggerEvent("like", { post: this.data.post });
      setTimeout(() => {
        this.setData({ liking: false });
      }, 220);
    },
    toggleFollow() {
      if (String(this.data.post?.author?.id || "") === String(this.data.currentUserId || "")) {
        return;
      }
      this.triggerEvent("follow", { post: this.data.post });
    },
    openComment() {
      this.triggerEvent("comment", { post: this.data.post });
    },
    sharePost() {
      this.triggerEvent("sharepost", { post: this.data.post });
    },
    openSpot() {
      this.triggerEvent("spot", { post: this.data.post });
    },
    previewImage(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent("preview", {
        post: this.data.post,
        index: event.currentTarget.dataset.index,
      });
    },
    openCard() {
      this.triggerEvent("opencard", { post: this.data.post });
    },
    goToUser() {
      this.triggerEvent("user", { userId: this.data.post?.author?.id });
    },
  },
});
