import { PAGE_LOGIN } from "../constants/routes";
import { API_BASE_URL } from "./request";
import { cacheImageUrl } from "./image-cache.service";

interface UploadResult {
  url: string;
}

interface LoginResponseData {
  accessToken: string;
  user: Record<string, unknown>;
  needProfile?: boolean;
}

export function uploadImage(filePath: string): Promise<string> {
  return compressImage(filePath).then((compressedPath) =>
    doUploadImage(compressedPath, true).then((url) =>
      cacheImageUrl(url, compressedPath).then(() => url),
    ),
  );
}

function compressImage(filePath: string): Promise<string> {
  return new Promise((resolve) => {
    wx.compressImage({
      src: filePath,
      quality: 45,
      success: (res: WechatMiniprogram.CompressImageSuccessCallbackResult) => {
        resolve(res.tempFilePath || filePath);
      },
      fail: () => resolve(filePath),
    });
  });
}

function refreshLoginToken(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    wx.login({
      success: (res: WechatMiniprogram.LoginSuccessCallbackResult) => {
        wx.request({
          url: `${API_BASE_URL}/auth/wechat-login`,
          method: "POST",
          data: { code: res.code },
          header: { "content-type": "application/json" },
          success: (loginRes: WechatMiniprogram.RequestSuccessCallbackResult) => {
            const body = JSON.parse(JSON.stringify(loginRes.data)) as {
              code: number;
              message: string;
              data: LoginResponseData;
            };
            if (loginRes.statusCode >= 200 && loginRes.statusCode < 300 && body?.code === 0) {
              wx.setStorageSync("accessToken", body.data.accessToken);
              wx.setStorageSync("userInfo", body.data.user);
              wx.setStorageSync("needProfile", !!body.data.needProfile);
              if (body.data.needProfile) {
                wx.reLaunch({ url: PAGE_LOGIN });
                reject(new Error("需要登录"));
                return;
              }
              resolve();
              return;
            }
            reject(new Error(body?.message || "登录失败"));
          },
          fail: (err: WechatMiniprogram.GeneralCallbackResult) => reject(err),
        });
      },
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => reject(err),
    });
  });
}

function doUploadImage(filePath: string, retryOnUnauthorized: boolean): Promise<string> {
  const token = wx.getStorageSync("accessToken") as string | undefined;
  return new Promise<string>((resolve, reject) => {
    wx.uploadFile({
      url: `${API_BASE_URL}/files/upload`,
      filePath,
      name: "file",
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res: WechatMiniprogram.UploadFileSuccessCallbackResult) => {
        try {
          const body = JSON.parse(res.data) as {
            code: number;
            message: string;
            data: UploadResult;
          };
          if (res.statusCode >= 200 && res.statusCode < 300 && body?.code === 0) {
            resolve(body.data.url);
            return;
          }
          if ((res.statusCode === 401 || res.statusCode === 403) && retryOnUnauthorized) {
            wx.removeStorageSync("accessToken");
            wx.removeStorageSync("userInfo");
            refreshLoginToken()
              .then(() => doUploadImage(filePath, false).then(resolve).catch(reject))
              .catch(reject);
            return;
          }
          reject(new Error(body?.message || "上传失败"));
        } catch (_error) {
          reject(_error);
        }
      },
      fail: (error: WechatMiniprogram.GeneralCallbackResult) => {
        if (retryOnUnauthorized) {
          wx.removeStorageSync("accessToken");
          wx.removeStorageSync("userInfo");
          refreshLoginToken()
            .then(() => doUploadImage(filePath, false).then(resolve).catch(reject))
            .catch(reject);
          return;
        }
        reject(error);
      },
    });
  });
}

export function uploadImages(filePaths: string[]): Promise<string[]> {
  return Promise.all(filePaths.map(uploadImage));
}
