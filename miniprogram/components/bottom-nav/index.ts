Component({
  data: {
    list: [
      { key: "spots", pagePath: "pages/spots/index", text: "找钓点", icon: "⌖" },
      { key: "community", pagePath: "pages/community/index", text: "社区", icon: "◎" },
      { key: "publish", pagePath: "pages/publish/index", text: "发布", icon: "+" },
      { key: "messages", pagePath: "pages/messages/index", text: "消息", icon: "✉" },
      { key: "profile", pagePath: "pages/profile/index", text: "我的", icon: "○" },
    ],
  },
  methods: {
    switchTab(event: WechatMiniprogram.TouchEvent) {
      wx.switchTab({
        url: `/${event.currentTarget.dataset.path}`,
      });
    },
  },
});
