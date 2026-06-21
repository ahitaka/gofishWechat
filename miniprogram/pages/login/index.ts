import { TAB_SPOTS } from "../../constants/routes";
import { isLoggedIn, login } from "../../services/auth.service";
import { uploadImage } from "../../services/file.service";
import { updateMyProfile } from "../../services/user.service";
import type { CustomEvent } from "../../utils/events";

Page({
  data: {
    nickname: "",
    avatarUrl: "/images/avatar.png",
    avatarTempPath: "",
    submitting: false,
  },
  onShow() {
    if (isLoggedIn()) {
      wx.switchTab({ url: TAB_SPOTS });
    }
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
  async loginWithWechat(event: WechatMiniprogram.ButtonGetPhoneNumber) {
    if (this.data.submitting) {
      return;
    }
    const phoneCode = event.detail?.code;
    const envVersion = wx.getAccountInfoSync?.().miniProgram?.envVersion;
    const phoneNumber = !phoneCode && envVersion !== "release" ? "13800000000" : "";
    if (!phoneCode && !phoneNumber) {
      wx.showToast({ title: "请授权手机号", icon: "none" });
      return;
    }
    const nickname = this.data.nickname.trim();
    if (!nickname) {
      wx.showToast({ title: "请填写昵称", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      const userInfo = await login({
        nickname,
        avatarUrl: this.data.avatarTempPath ? "" : this.data.avatarUrl,
        phoneCode,
        phoneNumber,
      });
      if (this.data.avatarTempPath) {
        try {
          const avatarUrl = await uploadImage(this.data.avatarTempPath);
          const updated = await updateMyProfile({
            nickname: userInfo.nickname || nickname,
            avatarUrl,
          });
          wx.setStorageSync("userInfo", updated);
        } catch (_error) {
          wx.showToast({ title: "头像稍后可在设置中修改", icon: "none" });
        }
      }
      wx.switchTab({ url: TAB_SPOTS });
    } catch (_error) {
      wx.showToast({ title: "登录失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
