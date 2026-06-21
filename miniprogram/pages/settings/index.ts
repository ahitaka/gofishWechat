import { uploadImage } from "../../services/file.service";
import { updateMyProfile } from "../../services/user.service";
import type { CustomEvent } from "../../utils/events";

Page({
  data: {
    nickname: "",
    avatarUrl: "",
    avatarTempPath: "",
    submitting: false,
  },
  onLoad() {
    const userInfo = wx.getStorageSync("userInfo") || {};
    this.setData({
      nickname: userInfo.nickname || "",
      avatarUrl: userInfo.avatarUrl || "/images/avatar.png",
    });
  },
  chooseAvatar(event: CustomEvent<{ avatarUrl: string }>) {
    const avatarUrl = event.detail?.avatarUrl;
    if (avatarUrl) {
      this.setData({ avatarUrl, avatarTempPath: avatarUrl });
    }
  },
  setNickname(event: WechatMiniprogram.Input) {
    this.setData({ nickname: event.detail.value });
  },
  async save() {
    const nickname = this.data.nickname.trim();
    if (!nickname) {
      wx.showToast({ title: "请输入昵称", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      let avatarUrl = this.data.avatarUrl;
      if (this.data.avatarTempPath) {
        avatarUrl = await uploadImage(this.data.avatarTempPath);
      }
      const userInfo = await updateMyProfile({ nickname, avatarUrl });
      wx.setStorageSync("userInfo", userInfo);
      wx.showToast({ title: "已保存" });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (_error) {
      wx.showToast({ title: "保存失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
