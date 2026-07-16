import { renderApp } from '../src/app';
import { Session } from '../src/core/session';
import { setLocale } from '../src/i18n';

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
    expect([...select.options].map((o) => o.textContent)).toEqual(['繁體中文', 'English', '日本語']);
    expect(root.querySelectorAll('.notice-card')).toHaveLength(2);
    expect(session.skipped.sort()).toEqual(['force', 'pinch']);
  });

  it('裝置選單：預設 builtin、切 magic 寫入 session 並顯示藍牙提示', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const session = new Session();
    renderApp(root, session, { forceTouch: true, gesture: true, touchDevice: false });
    const device = root.querySelector('#device-select') as HTMLSelectElement;
    expect(device).not.toBeNull();
    expect(device.value).toBe('builtin');
    expect(session.deviceType).toBe('builtin');
    const note = root.querySelector('#device-note') as HTMLElement;
    expect(note.hidden).toBe(true);

    device.value = 'magic';
    device.dispatchEvent(new Event('change', { bubbles: true }));
    expect(session.deviceType).toBe('magic');
    expect(note.hidden).toBe(false);

    device.value = 'builtin';
    device.dispatchEvent(new Event('change', { bubbles: true }));
    expect(session.deviceType).toBe('builtin');
    expect(note.hidden).toBe(true);
  });

  it('觸控裝置顯示 banner', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    renderApp(root, new Session(), { forceTouch: false, gesture: false, touchDevice: true });
    expect(root.querySelector('.banner')).not.toBeNull();
  });

  it('語言選單切換換字（en 與 ja）', () => {
    setLocale('zh-TW'); // 固定起點，消除測試順序依賴（verify R1 加固）
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
