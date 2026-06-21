import { PAGE_LOGIN } from "../constants/routes";
import { hideLoading, showLoading } from "../utils/loading";

export const API_BASE_URL = "https://gofish.kdns.fr/api/v1";

/** 请求方法 */
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

/** 可序列化的请求体数据 */
type RequestData = Record<string, unknown> | undefined;

export function request<T>(path: string, method: Method = "GET", data?: RequestData): Promise<T> {
  return doRequest<T>(path, method, data, true, true);
}

export function requestQuiet<T>(
  path: string,
  method: Method = "GET",
  data?: RequestData,
): Promise<T> {
  return doRequest<T>(path, method, data, true, false);
}

function refreshLoginToken(): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res: WechatMiniprogram.LoginSuccessCallbackResult) => {
        requestQuiet<{ accessToken: string; user: Record<string, unknown>; needProfile?: boolean }>(
          "/auth/wechat-login",
          "POST",
          { code: res.code },
        )
          .then((data) => {
            wx.setStorageSync("accessToken", data.accessToken);
            wx.setStorageSync("userInfo", data.user);
            wx.setStorageSync("needProfile", !!data.needProfile);
            if (data.needProfile) {
              wx.reLaunch({ url: PAGE_LOGIN });
              reject(new Error("需要登录"));
              return;
            }
            resolve();
          })
          .catch((err: unknown) => reject(err));
      },
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => reject(err),
    });
  });
}

function doRequest<T>(
  path: string,
  method: Method = "GET",
  data?: RequestData,
  retryOnUnauthorized = true,
  showGlobalLoading = true,
): Promise<T> {
  const token = wx.getStorageSync("accessToken") as string | undefined;
  const url = `${API_BASE_URL}${path}`;
  if (showGlobalLoading) showLoading();
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: method as WechatMiniprogram.RequestOption["method"],
      data,
      header: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const body = res.data as ApiEnvelope<T>;
        if (res.statusCode >= 200 && res.statusCode < 300 && body?.code === 0) {
          resolve(body.data);
          return;
        }
        if (
          (res.statusCode === 401 || res.statusCode === 403) &&
          retryOnUnauthorized &&
          path !== "/auth/wechat-login"
        ) {
          wx.removeStorageSync("accessToken");
          wx.removeStorageSync("userInfo");
          refreshLoginToken()
            .then(() =>
              doRequest<T>(path, method, data, false, showGlobalLoading)
                .then(resolve)
                .catch(reject),
            )
            .catch(reject);
          return;
        }
        reject(new Error(`${res.statusCode} ${body?.message || "请求失败"} ${url}`));
      },
      fail: (error: WechatMiniprogram.GeneralCallbackResult) => {
        reject(new Error(`${error.errMsg || "请求失败"} ${url}`));
      },
      complete: () => {
        if (showGlobalLoading) hideLoading();
      },
    });
  });
}
