import { detectCapabilities, type WindowLike } from '../src/support';

function fakeWin(overrides: Partial<WindowLike> = {}): WindowLike {
  return { MouseEvent: {}, navigator: { maxTouchPoints: 0 }, ...overrides };
}

describe('detectCapabilities', () => {
  it('全無支援（Chrome-like）', () => {
    expect(detectCapabilities(fakeWin())).toEqual(
      { forceTouch: false, gesture: false, touchDevice: false });
  });

  it('Safari-like：MouseEvent 有 WEBKIT_FORCE 常數、window 有 GestureEvent', () => {
    const win = fakeWin({
      MouseEvent: { WEBKIT_FORCE_AT_MOUSE_DOWN: 1 },
      GestureEvent: function GestureEvent() {}
    });
    const caps = detectCapabilities(win);
    expect(caps.forceTouch).toBe(true);
    expect(caps.gesture).toBe(true);
  });

  it('觸控裝置：maxTouchPoints > 0', () => {
    expect(detectCapabilities(fakeWin({ navigator: { maxTouchPoints: 5 } })).touchDevice).toBe(true);
  });

  it('觸控裝置：有 ontouchstart 屬性', () => {
    expect(detectCapabilities(fakeWin({ ontouchstart: null })).touchDevice).toBe(true);
  });
});
