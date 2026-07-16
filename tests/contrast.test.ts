import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// WCAG 2.x relative luminance + contrast ratio（機械驗證，取代人工判讀）
function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`非 6 位 hex：${hex}`);
  const n = parseInt(m[1], 16);
  const r = srgbToLinear((n >> 16) & 0xff);
  const g = srgbToLinear((n >> 8) & 0xff);
  const b = srgbToLinear(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// 從 styles.css 抽出兩套色板：:root 區塊（深色預設）與 @media light 覆寫
function extractPalettes(): { dark: Record<string, string>; light: Record<string, string> } {
  const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
  const grab = (block: string): Record<string, string> => {
    const vars: Record<string, string> = {};
    for (const m of block.matchAll(/(--[a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      vars[m[1]] = m[2];
    }
    return vars;
  };
  const lightStart = css.indexOf('@media (prefers-color-scheme: light)');
  if (lightStart < 0) throw new Error('styles.css 缺 light 覆寫區塊');
  const darkVars = grab(css.slice(0, lightStart));
  const lightOverrides = grab(css.slice(lightStart, css.indexOf('}', css.indexOf('}', lightStart) + 1) + 1));
  return { dark: darkVars, light: { ...darkVars, ...lightOverrides } };
}

// 文字/背景配對與門檻。資訊性文字 4.5（AA）；
// --on-accent on --blue 是 pinch 目標的裝飾性標籤（深色沿用既有設計值，
// pre-existing 3.27，issue Expected(4) 要求深色不變 —— 例外門檻 3.0）。
const TEXT_PAIRS: Array<{ fg: string; bg: string; min: number; note: string }> = [
  { fg: '--text', bg: '--bg', min: 4.5, note: '本文 on 頁底' },
  { fg: '--text', bg: '--card', min: 4.5, note: '本文 on 卡片' },
  { fg: '--text-dim', bg: '--card', min: 4.5, note: 'hint on 卡片' },
  { fg: '--text-dim', bg: '--inset', min: 4.5, note: 'cell/scrollbox/notice 文字 on inset' },
  { fg: '--btn-text', bg: '--btn-bg', min: 4.5, note: '按鈕' },
  { fg: '--banner-text', bg: '--banner-bg', min: 4.5, note: 'banner' },
  { fg: '--cell-left-text', bg: '--cell-left-bg', min: 4.5, note: '九宮格左鍵完成' },
  { fg: '--cell-both-text', bg: '--cell-both-bg', min: 4.5, note: '九宮格雙完成' },
  { fg: '--green', bg: '--card', min: 4.5, note: '.ok 狀態文字' },
  { fg: '--on-accent', bg: '--blue', min: 3.0, note: 'pinch 目標裝飾標籤（深色 pre-existing 例外，見上）' },
];

describe.each(['dark', 'light'] as const)('%s 色板 WCAG 對比', (theme) => {
  const palettes = extractPalettes();
  const palette = palettes[theme];

  it.each(TEXT_PAIRS)('$fg on $bg ≥ $min（$note）', ({ fg, bg, min }) => {
    expect(palette[fg], `${theme} 缺變數 ${fg}`).toBeDefined();
    expect(palette[bg], `${theme} 缺變數 ${bg}`).toBeDefined();
    const ratio = contrast(palette[fg], palette[bg]);
    expect(ratio, `${theme}: ${fg}(${palette[fg]}) on ${bg}(${palette[bg]}) = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
  });
});

describe('深色預設值回歸鎖（issue Expected(4)：既有深色外觀不變）', () => {
  it('深色核心變數與上線版 hex 完全一致', () => {
    const { dark } = extractPalettes();
    expect(dark['--bg']).toBe('#1c1c1e');
    expect(dark['--card']).toBe('#2c2c2e');
    expect(dark['--text']).toBe('#f2f2f7');
    expect(dark['--text-dim']).toBe('#98989f');
    expect(dark['--blue']).toBe('#0a84ff');
    expect(dark['--green']).toBe('#30d158');
    expect(dark['--red']).toBe('#ff453a');
    expect(dark['--yellow']).toBe('#ffd60a');
  });
});
