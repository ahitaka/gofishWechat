import { request } from "./request";

interface LoginOptions {
  nickname?: string;
  avatarUrl?: string;
  phoneCode?: string;
  phoneNumber?: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    nickname: string;
    avatarUrl?: string;
    level: number;
    role: string;
  };
  needProfile?: boolean;
}

interface WechatProfile {
  nickname: string;
  avatarUrl: string;
}

export function login(options: LoginOptions = {}): Promise<LoginResponse["user"]> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res: WechatMiniprogram.LoginSuccessCallbackResult) => {
        try {
          const data = await request<LoginResponse>("/auth/wechat-login", "POST", {
            code: res.code,
            ...options,
          });
          wx.setStorageSync("accessToken", data.accessToken);
          wx.setStorageSync("userInfo", data.user);
          wx.setStorageSync("needProfile", !!data.needProfile);
          resolve(data.user);
        } catch (_error) {
          reject(_error);
        }
      },
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => reject(err),
    });
  });
}

export function getWechatProfile(): Promise<WechatProfile> {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: "用于展示微信昵称和头像",
      success: (res: WechatMiniprogram.GetUserProfileSuccessCallbackResult) => {
        resolve({
          nickname: res.userInfo?.nickName || "钓友",
          avatarUrl: res.userInfo?.avatarUrl || "",
        });
      },
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => reject(err),
    });
  });
}

export function isLoggedIn(): boolean {
  return !!wx.getStorageSync("accessToken") && !wx.getStorageSync("needProfile");
}
