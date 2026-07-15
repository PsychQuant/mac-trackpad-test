import { mountPinch } from '../src/panels/pinch';
import { Session } from '../src/core/session';
import { setLocale } from '../src/i18n';

const CAPS_ON = { forceTouch: true, gesture: true, touchDevice: false };
const CAPS_OFF = { forceTouch: false, gesture: false, touchDevice: false };

function gestureEvent(type: string, scale: number, rotation: number): Event {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'scale', { value: scale });
  Object.defineProperty(ev, 'rotation', { value: rotation });
  return ev;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('mountPinch', () => {
  it('不支援時：需 Safari 卡片 + skipped', () => {
    setLocale('zh-TW');
    const el = document.createElement('section');
    const session = new Session();
    mountPinch(el, session, CAPS_OFF);
    expect(el.querySelector('.notice-card')).not.toBeNull();
    expect(session.skipped).toEqual(['pinch']);
  });

  it('gesturechange：記錄 fired/scale/rotation 並更新顯示', () => {
    const el = document.createElement('section');
    document.body.appendChild(el);
    const session = new Session();
    mountPinch(el, session, CAPS_ON);
    const box = el.querySelector('.pinchbox') as HTMLElement;
    box.dispatchEvent(gestureEvent('gesturechange', 2.28, -15.4));
    expect(session.pinch.fired).toBe(true);
    expect(session.pinch.lastScale).toBe(2.28);
    expect(session.pinch.lastRotation).toBe(-15);
    expect(el.querySelector('.scale')!.textContent).toBe('2.28');
  });
});
