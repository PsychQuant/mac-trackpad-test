import { detectStep, type Point } from '../core/jump-detector';
import type { Session } from '../core/session';
import { t } from '../i18n';

export function mountTrail(el: HTMLElement, session: Session): void {
  el.innerHTML = `
    <h2 data-i18n="trailTitle">${t('trailTitle')}</h2>
    <p class="hint" data-i18n="trailHint">${t('trailHint')}</p>
    <canvas class="trail-canvas" height="300"></canvas>
    <div class="stats">
      <span><span data-i18n="hzLabel">${t('hzLabel')}</span> <b class="hz">–</b> Hz</span>
      <span><span data-i18n="maxJumpLabel">${t('maxJumpLabel')}</span> <b class="maxjump">–</b> px</span>
      <span><span data-i18n="jumpCountLabel">${t('jumpCountLabel')}</span> <b class="jumps">0</b></span>
    </div>
    <button class="clear" data-i18n="clearBtn">${t('clearBtn')}</button>`;

  const canvas = el.querySelector('canvas') as HTMLCanvasElement;
  const ctx2d = canvas.getContext('2d'); // jsdom 回 null，繪圖跳過、邏輯照常
  const hzEl = el.querySelector('.hz') as HTMLElement;
  const maxJumpEl = el.querySelector('.maxjump') as HTMLElement;
  const jumpsEl = el.querySelector('.jumps') as HTMLElement;

  if (ctx2d) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = 300 * dpr;
    ctx2d.scale(dpr, dpr);
    ctx2d.lineWidth = 2;
    ctx2d.lineCap = 'round';
  }

  let last: Point | null = null;
  let lastT = 0;
  let prevStep = 0;
  const times: number[] = [];

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const curr = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const now = performance.now();

    times.push(now);
    while (times.length && now - times[0] > 1000) times.shift();
    if (times.length > session.trail.maxHz) session.trail.maxHz = times.length;
    hzEl.textContent = String(times.length);

    const step = detectStep(last, curr, now - lastT, prevStep);
    prevStep = step.nextPrevStepPx;

    if (step.withinStroke && step.distPx > session.trail.maxJumpPx) {
      session.trail.maxJumpPx = step.distPx;
      maxJumpEl.textContent = step.distPx.toFixed(0);
    }
    if (step.isJump) {
      session.trail.jumps.push({
        xPct: Math.round((curr.x / canvas.clientWidth) * 100),
        yPct: Math.round((curr.y / canvas.clientHeight) * 100),
        distPx: Math.round(step.distPx)
      });
      jumpsEl.textContent = String(session.trail.jumps.length);
    }
    if (ctx2d && last) {
      ctx2d.strokeStyle = step.isJump ? '#ff453a' : '#0a84ff';
      ctx2d.beginPath();
      ctx2d.moveTo(last.x, last.y);
      ctx2d.lineTo(curr.x, curr.y);
      ctx2d.stroke();
    }
    last = curr;
    lastT = now;
  });

  canvas.addEventListener('mouseleave', () => { last = null; });

  (el.querySelector('.clear') as HTMLButtonElement).addEventListener('click', () => {
    if (ctx2d) ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    session.trail.jumps.length = 0;
    session.trail.maxJumpPx = 0;
    maxJumpEl.textContent = '–';
    jumpsEl.textContent = '0';
  });
}
