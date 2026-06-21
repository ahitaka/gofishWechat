import { downloadImageToCache, getCachedImageUrl } from "../../services/image-cache.service";

Component({
  externalClasses: ["custom-class"],
  properties: {
    src: {
      type: String,
      value: "",
      observer(src: string) {
        this.loadImage(src);
      },
    },
    mode: {
      type: String,
      value: "aspectFill",
    },
  },
  data: {
    displaySrc: "",
  },
  lifetimes: {
    attached() {
      this.loadImage(this.data.src);
    },
  },
  methods: {
    async loadImage(src: string) {
      if (!src) {
        this.setData({ displaySrc: "" });
        return;
      }
      const cachedSrc = getCachedImageUrl(src);
      this.setData({ displaySrc: cachedSrc });
      if (cachedSrc === src) {
        const nextSrc = await downloadImageToCache(src);
        if (this.data.src === src && nextSrc !== src) {
          this.setData({ displaySrc: nextSrc });
        }
      }
    },
  },
});
