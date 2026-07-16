import { renderApp } from '../src/app';
import { Session } from '../src/core/session';

afterEach(() => { document.body.innerHTML = ''; });

describe('renderApp', () => {
  it('掛載六個 section 與語言選單；不支援的面板顯示降級卡', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const session = new Session();
    renderApp(root, session, { forceTouch: false, gesture: false, touchDevice: false });
    expect(root.querySelectorAll('section')).toHaveLength(6);
    const select = root.querySelector('#lang-select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect([...select.options].map((o) => o.value)).toEqual(['zh-TW', 'en', 'ja']);
    expect(root.querySelectorAll('.notice-card')).toHaveLength(2);
    expect(session.skipped.sort()).toEqual(['force', 'pinch']);
  });

  it('觸控裝置顯示 banner', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    renderApp(root, new Session(), { forceTouch: false, gesture: false, touchDevice: true });
    expect(root.querySelector('.banner')).not.toBeNull();
  });

  it('語言選單切換換字（en 與 ja）', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    renderApp(root, new Session(), { forceTouch: true, gesture: true, touchDevice: false });
    const select = root.querySelector('#lang-select') as HTMLSelectElement;
    const before = root.querySelector('h1')!.textContent;

    select.value = 'en';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const enTitle = root.querySelector('h1')!.textContent;
    expect(enTitle).not.toBe(before);

    select.value = 'ja';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const jaTitle = root.querySelector('h1')!.textContent;
    expect(jaTitle).not.toBe(enTitle);
    expect(jaTitle).not.toBe(before);
  });
});
