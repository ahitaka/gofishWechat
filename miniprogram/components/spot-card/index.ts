Component({
  properties: {
    spot: Object,
    active: Boolean,
  },
  methods: {
    handleTap() {
      this.triggerEvent("select", { spot: this.data.spot });
    },
    openPosts() {
      this.triggerEvent("posts", { spot: this.data.spot });
    },
  },
});
