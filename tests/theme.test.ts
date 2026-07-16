import { cssColor } from '../src/theme';

describe('cssColor', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--test-color');
  });

  it('讀取已定義的 CSS 變數', () => {
    document.documentElement.style.setProperty('--test-color', '#123456');
    expect(cssColor('--test-color', '#fallback')).toBe('#123456');
  });

  it('未定義時回 fallback', () => {
    expect(cssColor('--never-defined', '#abcdef')).toBe('#abcdef');
  });

  it('無 getComputedStyle（SSR/極舊環境）時回 fallback', () => {
    vi.stubGlobal('getComputedStyle', undefined);
    try {
      expect(cssColor('--test-color', '#fa11ba')).toBe('#fa11ba');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('值含空白時 trim', () => {
    document.documentElement.style.setProperty('--test-color', '  #654321  ');
    expect(cssColor('--test-color', '#fallback')).toBe('#654321');
  });
});
