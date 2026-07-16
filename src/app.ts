import { applyI18n, getLocale, setLocale, t, type Locale } from './i18n';
import type { Capabilities } from './support';
import { Session, buildExport } from './core/session';
import { mountTrail } from './panels/trail';
import { mountGrid } from './panels/grid';
import { mountForce } from './panels/force';
import { mountScroll } from './panels/scroll';
import { mountPinch } from './panels/pinch';

export function renderApp(root: HTMLElement, session: Session, caps: Capabilities): void {
  root.innerHTML = `
    <header>
      <div>
        <h1 data-i18n="pageTitle">${t('pageTitle')}</h1>
        <p class="sub" data-i18n="pageSubtitle">${t('pageSubtitle')}</p>
      </div>
      <select id="lang-select" class="lang-btn" aria-label="${t('langSelectLabel')}">
        <option value="zh-TW">中文</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>
    </header>
    ${caps.touchDevice ? `<div class="banner" data-i18n="touchBanner">${t('touchBanner')}</div>` : ''}
    <section id="panel-trail"></section>
    <section id="panel-grid"></section>
    <section id="panel-force"></section>
    <section id="panel-scroll"></section>
    <section id="panel-pinch"></section>
    <section id="panel-export">
      <h2 data-i18n="exportTitle">${t('exportTitle')}</h2>
      <p class="hint" data-i18n="exportHint">${t('exportHint')}</p>
      <button id="export-btn" data-i18n="exportBtn">${t('exportBtn')}</button>
      <span id="export-status" class="hint"></span>
    </section>`;

  mountTrail(root.querySelector('#panel-trail') as HTMLElement, session);
  mountGrid(root.querySelector('#panel-grid') as HTMLElement, session);
  mountForce(root.querySelector('#panel-force') as HTMLElement, session, caps);
  mountScroll(root.querySelector('#panel-scroll') as HTMLElement, session);
  mountPinch(root.querySelector('#panel-pinch') as HTMLElement, session, caps);

  const langSelect = root.querySelector('#lang-select') as HTMLSelectElement;
  langSelect.value = getLocale();
  langSelect.addEventListener('change', () => {
    setLocale(langSelect.value as Locale);
    applyI18n(document);
    langSelect.setAttribute('aria-label', t('langSelectLabel'));
    document.title = t('pageTitle');
  });

  (root.querySelector('#export-btn') as HTMLButtonElement).addEventListener('click', () => {
    void exportResults(root, session);
  });
}

async function exportResults(root: HTMLElement, session: Session): Promise<void> {
  const data = buildExport(session, {
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    language: getLocale()
  });
  const text = JSON.stringify(data, null, 2);
  const status = root.querySelector('#export-status') as HTMLElement;
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = t('exportCopied');
  } catch {
    status.textContent = t('exportCopyFailed');
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = 'mac-trackpad-test-results.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
