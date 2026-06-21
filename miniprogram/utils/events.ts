/** 自定义组件事件类型，detail 由组件调用方传递 */
export interface CustomEvent<T> extends WechatMiniprogram.BaseEvent {
  detail: T;
}
