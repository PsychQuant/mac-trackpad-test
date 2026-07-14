import type { Session } from '../core/session';
import { t } from '../i18n';

const MAX_DELTAS = 1000;
const LINES = 80;

export function mountScroll(el: HTMLElement, session: Session): void {
  el.innerHTML = `
    <h2 data-i18n="scrollTitle">${t('scrollTitle')}</h2>
    <p class="hint" data-i18n="scrollHint">${t('scrollHint')}</p>
    <div class="scrollbox"></div>
    <div class="stats">
      <span><span data-i18n="dyLabel">${t('dyLabel')}</span> <b class="dy">0</b></span>
      <span><span data-i18n="wheelCountLabel">${t('wheelCountLabel')}</span> <b class="wc">0</b></span>
    </div>`;

  const box = el.querySelector('.scrollbox') as HTMLElement;
  const dyEl = el.querySelector('.dy') as HTMLElement;
  const wcEl = el.querySelector('.wc') as HTMLElement;

  for (let i = 1; i <= LINES; i++) {
    const line = document.createElement('div');
    line.textContent = `${i} ${t('scrollLine')}`;
    box.appendChild(line);
  }

  box.addEventListener('wheel', (e) => {
    session.scroll.events += 1;
    session.scroll.deltas.push(e.deltaY);
    if (session.scroll.deltas.length > MAX_DELTAS) session.scroll.deltas.shift();
    dyEl.textContent = e.deltaY.toFixed(1);
    wcEl.textContent = String(session.scroll.events);
  }, { passive: true });
}
