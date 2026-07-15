import { renderApp } from '../src/app';
import { Session } from '../src/core/session';

afterEach(() => { document.body.innerHTML = ''; });

describe('renderApp', () => {
  it('掛載六個 section 與語言切換鈕；不支援的面板顯示降級卡', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const session = new Session();
    renderApp(root, session, { forceTouch: false, gesture: false, touchDevice: false });
    expect(root.querySelectorAll('section')).toHaveLength(6);
    expect(root.querySelector('#lang-toggle')).not.toBeNull();
    expect(root.querySelectorAll('.notice-card')).toHaveLength(2);
    expect(session.skipped.sort()).toEqual(['force', 'pinch']);
  });

  it('觸控裝置顯示 banner', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    renderApp(root, new Session(), { forceTouch: false, gesture: false, touchDevice: true });
    expect(root.querySelector('.banner')).not.toBeNull();
  });

  it('語言切換鈕換字', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    renderApp(root, new Session(), { forceTouch: true, gesture: true, touchDevice: false });
    const before = root.querySelector('h1')!.textContent;
    (root.querySelector('#lang-toggle') as HTMLButtonElement).click();
    expect(root.querySelector('h1')!.textContent).not.toBe(before);
  });
});
