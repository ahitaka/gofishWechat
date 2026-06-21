import { getUnreadCountByType } from "../../services/notification.service";
import { toNotificationDetail } from "../../constants/routes";

Page({
  data: {
    categories: [
      { key: "LIKE", icon: "赞", title: "点赞", desc: "钓友赞了你的鱼获", count: 0 },
      { key: "COMMENT", icon: "评", title: "评论", desc: "新的评论和回复", count: 0 },
      { key: "FOLLOW", icon: "关", title: "新关注", desc: "有人关注了你", count: 0 },
    ],
  },
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: "pages/messages/index" });
    }
    this.loadCounts();
  },
  onPullDownRefresh() {
    this.loadCounts().finally(() => wx.stopPullDownRefresh());
  },
  async loadCounts() {
    const categories = this.data.categories;
    const updated = await Promise.all(
      categories.map(async (cat) => {
        try {
          const count = await getUnreadCountByType(cat.key);
          return { ...cat, count };
        } catch {
          return { ...cat, count: 0 };
        }
      }),
    );
    this.setData({ categories: updated });
  },
  openCategory(event: WechatMiniprogram.TouchEvent) {
    const key = event.currentTarget.dataset.key;
    const title = event.currentTarget.dataset.title;
    wx.navigateTo({ url: toNotificationDetail(key, title) });
  },
});
