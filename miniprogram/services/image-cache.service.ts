const CACHE_KEY = "imageCacheMap";

function getCacheMap(): Record<string, string> {
  return wx.getStorageSync(CACHE_KEY) || {};
}

function setCacheMap(map: Record<string, string>) {
  wx.setStorageSync(CACHE_KEY, map);
}

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function fileExists(filePath: string): boolean {
  try {
    wx.getFileSystemManager().accessSync(filePath);
    return true;
  } catch (_error) {
    return false;
  }
}

// saveFile 在新版微信 API 类型中标记为废弃，使用文件系统 API 替代
function saveLocalFile(filePath: string): Promise<string> {
  const result = wx.getFileSystemManager().saveFileSync(filePath);
  return Promise.resolve(result);
}

export async function cacheImageUrl(remoteUrl: string, localPath: string): Promise<string> {
  if (!remoteUrl || !localPath || !isRemoteUrl(remoteUrl)) {
    return localPath;
  }
  const savedPath = await saveLocalFile(localPath);
  const map = getCacheMap();
  map[remoteUrl] = savedPath;
  setCacheMap(map);
  return savedPath;
}

export function getCachedImageUrl(url: string): string {
  if (!url || !isRemoteUrl(url)) {
    return url;
  }
  const cachedPath = getCacheMap()[url];
  return cachedPath && fileExists(cachedPath) ? cachedPath : url;
}

export function downloadImageToCache(url: string): Promise<string> {
  if (!url || !isRemoteUrl(url)) {
    return Promise.resolve(url);
  }
  const cachedUrl = getCachedImageUrl(url);
  if (cachedUrl !== url) {
    return Promise.resolve(cachedUrl);
  }
  return new Promise((resolve) => {
    wx.downloadFile({
      url,
      success: async (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          resolve(await cacheImageUrl(url, res.tempFilePath));
          return;
        }
        resolve(url);
      },
      fail: () => resolve(url),
    });
  });
}
