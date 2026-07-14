import type { Session } from '../core/session';
import { t } from '../i18n';

export function mountGrid(el: HTMLElement, session: Session): void {
  el.innerHTML = `
    <h2 data-i18n="gridTitle">${t('gridTitle')}</h2>
    <p class="hint" data-i18n="gridHint">${t('gridHint')}</p>
    <div class="grid3"></div>
    <div class="stats">
      <span><span data-i18n="leftLabel">${t('leftLabel')}</span> <b class="lc">0</b>/9</span>
      <span><span data-i18n="rightLabel">${t('rightLabel')}</span> <b class="rc">0</b>/9</span>
      <span><span data-i18n="dblLabel">${t('dblLabel')}</span> <b class="dc" data-i18n="dblPending">${t('dblPending')}</b></span>
    </div>`;

  const grid = el.querySelector('.grid3') as HTMLElement;
  const lcEl = el.querySelector('.lc') as HTMLElement;
  const rcEl = el.querySelector('.rc') as HTMLElement;
  const dcEl = el.querySelector('.dc') as HTMLElement;

  const paint = (i: number, cell: HTMLElement): void => {
    const l = session.grid.left[i];
    const r = session.grid.right[i];
    cell.className = 'cell' + (l && r ? ' bothdone' : l ? ' leftdone' : '');
    lcEl.textContent = String(session.grid.left.filter(Boolean).length);
    rcEl.textContent = String(session.grid.right.filter(Boolean).length);
  };

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = String(i + 1);
    cell.addEventListener('click', () => {
      session.grid.left[i] = true;
      paint(i, cell);
    });
    cell.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      session.grid.right[i] = true;
      paint(i, cell);
    });
    cell.addEventListener('dblclick', () => {
      session.grid.doubleClick = true;
      dcEl.dataset.i18n = 'dblPass';
      dcEl.textContent = t('dblPass');
      dcEl.classList.add('ok');
    });
    grid.appendChild(cell);
  }
}
