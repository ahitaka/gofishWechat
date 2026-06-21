type LoadingListener = (visible: boolean) => void;

let loadingCount = 0;
const listeners = new Set<LoadingListener>();

function notify() {
  const visible = loadingCount > 0;
  listeners.forEach((fn) => fn(visible));
}

export function showLoading() {
  loadingCount++;
  notify();
}

export function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    notify();
  }
}

export function subscribeLoading(listener: LoadingListener): () => void {
  listeners.add(listener);
  listener(loadingCount > 0);
  return () => listeners.delete(listener);
}

export function isLoading(): boolean {
  return loadingCount > 0;
}
