import { subscribeLoading } from "../../utils/loading";

Component({
  data: {
    visible: false,
  },
  lifetimes: {
    attached() {
      this.unsubscribe = subscribeLoading((visible) => {
        this.setData({ visible });
      });
    },
    detached() {
      this.unsubscribe?.();
    },
  },
});
