// 讀取 CSS 自訂屬性。canvas 繪圖不吃 CSS 變數，需在 JS 端解析。
// jsdom 的 computed style 可讀 inline 自訂屬性，但測試環境不載入 styles.css，
// 變數解析為空字串 → 退 fallback；SSR / 極舊環境無 getComputedStyle 同樣退 fallback。
export function cssColor(varName: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') {
    return fallback;
  }
  const computed = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return computed || fallback;
}
