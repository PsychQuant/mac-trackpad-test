// 讀取 CSS 自訂屬性。canvas 繪圖不吃 CSS 變數，需在 JS 端解析；
// 測試環境（jsdom 的 computed style 不 cascade）與極舊瀏覽器讀不到值時退回 fallback。
export function cssColor(varName: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') {
    return fallback;
  }
  const root = document.documentElement;
  const computed = getComputedStyle(root).getPropertyValue(varName).trim();
  if (computed) return computed;
  const inline = root.style.getPropertyValue(varName).trim();
  return inline || fallback;
}
