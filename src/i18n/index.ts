import { strings, type Locale, type Strings } from './strings';

const STORAGE_KEY = 'mac-trackpad-test-lang';
let current: Locale = 'zh-TW';

export function detectLocale(navLang: string, stored: string | null): Locale {
  if (stored === 'zh-TW' || stored === 'en') return stored;
  return navLang.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}

// localStorage 在無痕模式（舊 Safari）可能拋錯、在部分測試環境不存在——一律防禦性存取。
function readStored(): string | null {
  try { return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null; } catch { return null; }
}

function writeStored(l: Locale): void {
  try { globalThis.localStorage?.setItem(STORAGE_KEY, l); } catch { /* 無法持久化時僅本次生效 */ }
}

export function initLocale(): Locale {
  current = detectLocale(navigator.language, readStored());
  return current;
}

export function getLocale(): Locale { return current; }

export function setLocale(l: Locale): void {
  current = l;
  writeStored(l);
}

export function t(key: keyof Strings): string { return strings[current][key]; }

export function applyI18n(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as keyof Strings);
  });
}

export { strings, type Locale, type Strings };
