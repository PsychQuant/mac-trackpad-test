import { mountScroll } from '../src/panels/scroll';
import { Session } from '../src/core/session';

function setup() {
  const el = document.createElement('section');
  document.body.appendChild(el);
  const session = new Session();
  mountScroll(el, session);
  return { el, session, box: el.querySelector('.scrollbox') as HTMLElement };
}

afterEach(() => { document.body.innerHTML = ''; });

describe('mountScroll', () => {
  it('wheel 事件：計數與 deltas 記錄', () => {
    const { el, session, box } = setup();
    box.dispatchEvent(new WheelEvent('wheel', { deltaY: -12.5, bubbles: true }));
    box.dispatchEvent(new WheelEvent('wheel', { deltaY: 30, bubbles: true }));
    expect(session.scroll.events).toBe(2);
    expect(session.scroll.deltas).toEqual([-12.5, 30]);
    expect(el.querySelector('.wc')!.textContent).toBe('2');
    expect(el.querySelector('.dy')!.textContent).toBe('30.0');
  });

  it('deltas 上限 1000（FIFO）', () => {
    const { session, box } = setup();
    for (let i = 0; i < 1005; i++) {
      box.dispatchEvent(new WheelEvent('wheel', { deltaY: i, bubbles: true }));
    }
    expect(session.scroll.deltas).toHaveLength(1000);
    expect(session.scroll.deltas[0]).toBe(5);
    expect(session.scroll.events).toBe(1005);
  });
});
