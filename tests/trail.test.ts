import { mountTrail } from '../src/panels/trail';
import { Session } from '../src/core/session';

function setup() {
  const el = document.createElement('section');
  document.body.appendChild(el);
  const session = new Session();
  mountTrail(el, session);
  const canvas = el.querySelector('canvas')!;
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 600, height: 300, right: 600, bottom: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  Object.defineProperty(canvas, 'clientWidth', { value: 600 });
  Object.defineProperty(canvas, 'clientHeight', { value: 300 });
  return { el, session, canvas };
}

function move(canvas: HTMLElement, x: number, y: number, atMs: number) {
  vi.spyOn(performance, 'now').mockReturnValue(atMs);
  canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
}

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; });

describe('mountTrail', () => {
  it('平順慢速移動：不產生異常跳點', () => {
    const { session, canvas } = setup();
    move(canvas, 100, 100, 0);
    move(canvas, 104, 100, 8);
    move(canvas, 108, 100, 16);
    expect(session.trail.jumps).toHaveLength(0);
  });

  it('小步中突然瞬移：記錄跳點（含百分比座標）並更新計數', () => {
    const { el, session, canvas } = setup();
    move(canvas, 100, 100, 0);
    move(canvas, 104, 100, 8);
    move(canvas, 300, 100, 16);
    expect(session.trail.jumps).toHaveLength(1);
    expect(session.trail.jumps[0]).toEqual({ xPct: 50, yPct: 33, distPx: 196 });
    expect(el.querySelector('.jumps')!.textContent).toBe('1');
  });

  it('快滑漸進加速：不誤報', () => {
    const { session, canvas } = setup();
    move(canvas, 0, 0, 0);
    move(canvas, 40, 0, 8);
    move(canvas, 120, 0, 16);
    move(canvas, 210, 0, 24);
    expect(session.trail.jumps).toHaveLength(0);
  });

  it('maxHz 與 maxJumpPx 寫入 session', () => {
    const { session, canvas } = setup();
    move(canvas, 0, 0, 0);
    move(canvas, 10, 0, 8);
    expect(session.trail.maxHz).toBeGreaterThan(0);
    expect(session.trail.maxJumpPx).toBe(10);
  });

  it('清除按鈕重置跳點與跳距', () => {
    const { el, session, canvas } = setup();
    move(canvas, 100, 100, 0);
    move(canvas, 104, 100, 8);
    move(canvas, 300, 100, 16);
    (el.querySelector('.clear') as HTMLButtonElement).click();
    expect(session.trail.jumps).toHaveLength(0);
    expect(session.trail.maxJumpPx).toBe(0);
    expect(el.querySelector('.jumps')!.textContent).toBe('0');
  });
});
