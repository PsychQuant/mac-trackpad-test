export interface Capabilities {
  forceTouch: boolean;
  gesture: boolean;
  touchDevice: boolean;
}

export interface WindowLike {
  MouseEvent: object;
  navigator: { maxTouchPoints: number };
  [k: string]: unknown;
}

// 用特徵偵測（不是 UA 字串）：Safari 的 MouseEvent 帶 WEBKIT_FORCE_* 常數、
// window 有 GestureEvent 建構子。
export function detectCapabilities(
  win: WindowLike = window as unknown as WindowLike
): Capabilities {
  return {
    forceTouch: 'WEBKIT_FORCE_AT_MOUSE_DOWN' in win.MouseEvent,
    gesture: 'GestureEvent' in win,
    touchDevice: 'ontouchstart' in win || win.navigator.maxTouchPoints > 0
  };
}
