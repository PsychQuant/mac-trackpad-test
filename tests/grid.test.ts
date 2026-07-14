import { mountGrid } from '../src/panels/grid';
import { Session } from '../src/core/session';
import { strings } from '../src/i18n/strings';
import { setLocale } from '../src/i18n';

function setup() {
  setLocale('zh-TW');
  const el = document.createElement('section');
  document.body.appendChild(el);
  const session = new Session();
  mountGrid(el, session);
  return { el, session, cells: [...el.querySelectorAll<HTMLElement>('.cell')] };
}

afterEach(() => { document.body.innerHTML = ''; });

describe('mountGrid', () => {
  it('產生 9 格', () => {
    expect(setup().cells).toHaveLength(9);
  });

  it('左鍵點按：session 記錄、格子變綠、計數更新', () => {
    const { el, session, cells } = setup();
    cells[0].click();
    cells[4].click();
    expect(session.grid.left[0]).toBe(true);
    expect(session.grid.left[4]).toBe(true);
    expect(cells[0].classList.contains('leftdone')).toBe(true);
    expect(el.querySelector('.lc')!.textContent).toBe('2');
  });

  it('右鍵（contextmenu）：記錄並在左+右都完成時變藍', () => {
    const { session, cells } = setup();
    cells[3].click();
    cells[3].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(session.grid.right[3]).toBe(true);
    expect(cells[3].classList.contains('bothdone')).toBe(true);
  });

  it('雙擊：session.doubleClick = true、狀態文字換成通過', () => {
    const { el, session, cells } = setup();
    cells[8].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(session.grid.doubleClick).toBe(true);
    expect(el.querySelector('.dc')!.textContent).toBe(strings['zh-TW'].dblPass);
  });
});
