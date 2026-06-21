import type { MySpotItem } from "../../models/index";

Component({
  properties: {
    spot: Object,
    favorite: Boolean,
  },
  data: {
    coverUrl: "/images/default-goods-image.png",
  },
  observers: {
    spot(spot: MySpotItem) {
      this.setData({
        coverUrl: spot?.coverUrl || "/images/default-goods-image.png",
      });
    },
  },
  methods: {
    open() {
      this.triggerEvent("open", { spot: this.data.spot });
    },
    edit() {
      this.triggerEvent("edit", { spot: this.data.spot });
    },
    remove() {
      this.triggerEvent("remove", { spot: this.data.spot });
    },
    publish() {
      this.triggerEvent("publish", { spot: this.data.spot });
    },
    unfavorite() {
      this.triggerEvent("unfavorite", { spot: this.data.spot });
    },
    noop() {
      return;
    },
  },
});
