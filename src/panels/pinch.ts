import type { Session } from '../core/session';
import type { Capabilities } from '../support';
import { t } from '../i18n';

export function mountPinch(el: HTMLElement, session: Session, caps: Capabilities): void {
  el.innerHTML = `<h2 data-i18n="pinchTitle">${t('pinchTitle')}</h2>`;

  if (!caps.gesture) {
    session.markSkipped('pinch');
    el.insertAdjacentHTML('beforeend', `
      <div class="notice-card">
        <b data-i18n="needSafariTitle">${t('needSafariTitle')}</b>
        <span data-i18n="needSafariPinch">${t('needSafariPinch')}</span>
      </div>`);
    return;
  }

  el.insertAdjacentHTML('beforeend', `
    <p class="hint" data-i18n="pinchHint">${t('pinchHint')}</p>
    <div class="pinchbox"><div class="pinchtarget" data-i18n="pinchTarget">${t('pinchTarget')}</div></div>
    <div class="stats">
      <span><span data-i18n="scaleLabel">${t('scaleLabel')}</span> <b class="scale">1.00</b></span>
      <span><span data-i18n="rotationLabel">${t('rotationLabel')}</span> <b class="rot">0°</b></span>
    </div>`);

  const box = el.querySelector('.pinchbox') as HTMLElement;
  const target = el.querySelector('.pinchtarget') as HTMLElement;
  const scaleEl = el.querySelector('.scale') as HTMLElement;
  const rotEl = el.querySelector('.rot') as HTMLElement;

  box.addEventListener('gesturestart', (e) => e.preventDefault());
  box.addEventListener('gesturechange', (e) => {
    e.preventDefault();
    const g = e as Event & { scale?: number; rotation?: number };
    const scale = g.scale ?? 1;
    const rotation = g.rotation ?? 0;
    session.pinch.fired = true;
    session.pinch.lastScale = Math.round(scale * 100) / 100;
    session.pinch.lastRotation = Math.round(rotation);
    const clamped = Math.max(0.4, Math.min(scale, 2.5));
    target.style.transform = `scale(${clamped}) rotate(${rotation}deg)`;
    scaleEl.textContent = scale.toFixed(2);
    rotEl.textContent = `${rotation.toFixed(0)}°`;
  });
}
