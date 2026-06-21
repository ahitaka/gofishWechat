Component({
  properties: {
    post: Object,
    currentUserId: String,
  },
  methods: {
    toggleLike() {
      this.triggerEvent("like", { post: this.data.post });
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
  },
});
