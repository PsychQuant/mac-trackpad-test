import type { Session } from '../core/session';
import type { Capabilities } from '../support';
import { t } from '../i18n';

const FORCE_RANGE = 3; // Safari webkitForce 量程約 0–3，1 ≈ force click 門檻

export function mountForce(el: HTMLElement, session: Session, caps: Capabilities): void {
  el.innerHTML = `<h2 data-i18n="forceTitle">${t('forceTitle')}</h2>`;

  if (!caps.forceTouch) {
    session.markSkipped('force');
    el.insertAdjacentHTML('beforeend', `
      <div class="notice-card">
        <b data-i18n="needSafariTitle">${t('needSafariTitle')}</b>
        <span data-i18n="needSafariForce">${t('needSafariForce')}</span>
      </div>`);
    return;
  }

  el.insertAdjacentHTML('beforeend', `
    <p class="hint" data-i18n="forceHint">${t('forceHint')}</p>
    <div class="forcebar-wrap">
      <div class="forcebar"></div>
      <div class="force-thresh"></div>
    </div>
    <div class="stats">
      <span><span data-i18n="forceNowLabel">${t('forceNowLabel')}</span> <b class="fnow">0.00</b></span>
      <span><span data-i18n="forceMaxLabel">${t('forceMaxLabel')}</span> <b class="fmax">0.00</b></span>
      <span><span data-i18n="forceClickLabel">${t('forceClickLabel')}</span> <b class="fclick" data-i18n="forceClickPending">${t('forceClickPending')}</b></span>
    </div>`);

  const wrap = el.querySelector('.forcebar-wrap') as HTMLElement;
  const bar = el.querySelector('.forcebar') as HTMLElement;
  const fnowEl = el.querySelector('.fnow') as HTMLElement;
  const fmaxEl = el.querySelector('.fmax') as HTMLElement;
  const fclickEl = el.querySelector('.fclick') as HTMLElement;

  wrap.addEventListener('webkitmouseforcechanged', (e) => {
    const f = (e as MouseEvent & { webkitForce?: number }).webkitForce ?? 0;
    bar.style.transform = `scaleX(${Math.min(f / FORCE_RANGE, 1)})`;
    fnowEl.textContent = f.toFixed(2);
    if (f > session.force.maxForce) {
      session.force.maxForce = f;
      fmaxEl.textContent = f.toFixed(2);
    }
  });

  wrap.addEventListener('webkitmouseforcedown', () => {
    session.force.forceClick = true;
    fclickEl.dataset.i18n = 'forceClickDone';
    fclickEl.textContent = t('forceClickDone');
    fclickEl.classList.add('ok');
  });

  wrap.addEventListener('mouseup', () => {
    bar.style.transform = 'scaleX(0)';
    fnowEl.textContent = '0.00';
  });
}
