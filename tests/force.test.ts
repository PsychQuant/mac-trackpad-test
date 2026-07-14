import { mountForce } from '../src/panels/force';
import { Session } from '../src/core/session';
import { setLocale } from '../src/i18n';

const CAPS_ON = { forceTouch: true, gesture: true, touchDevice: false };
const CAPS_OFF = { forceTouch: false, gesture: false, touchDevice: false };

function forceEvent(type: string, force: number): Event {
  const ev = new Event(type, { bubbles: true });
  Object.defineProperty(ev, 'webkitForce', { value: force });
  return ev;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('mountForce', () => {
  it('不支援時：顯示需 Safari 卡片、標記 skipped、不產生壓力條', () => {
    setLocale('zh-TW');
    const el = document.createElement('section');
    const session = new Session();
    mountForce(el, session, CAPS_OFF);
    expect(el.querySelector('.notice-card')).not.toBeNull();
    expect(el.querySelector('.forcebar-wrap')).toBeNull();
    expect(session.skipped).toEqual(['force']);
  });

  it('支援時：壓力事件更新 maxForce', () => {
    const el = document.createElement('section');
    document.body.appendChild(el);
    const session = new Session();
    mountForce(el, session, CAPS_ON);
    const wrap = el.querySelector('.forcebar-wrap') as HTMLElement;
    wrap.dispatchEvent(forceEvent('webkitmouseforcechanged', 1.5));
    wrap.dispatchEvent(forceEvent('webkitmouseforcechanged', 2.7));
    wrap.dispatchEvent(forceEvent('webkitmouseforcechanged', 2.0));
    expect(session.force.maxForce).toBe(2.7);
  });

  it('webkitmouseforcedown：forceClick = true、狀態文字更新', () => {
    setLocale('zh-TW');
    const el = document.createElement('section');
    document.body.appendChild(el);
    const session = new Session();
    mountForce(el, session, CAPS_ON);
    const wrap = el.querySelector('.forcebar-wrap') as HTMLElement;
    wrap.dispatchEvent(new Event('webkitmouseforcedown', { bubbles: true }));
    expect(session.force.forceClick).toBe(true);
    expect((el.querySelector('.fclick') as HTMLElement).classList.contains('ok')).toBe(true);
  });
});
