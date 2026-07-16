import { strings, LOCALES, localeNames } from '../src/i18n/strings';
import { detectLocale, setLocale, getLocale, t, applyI18n, isLocale } from '../src/i18n';

describe('i18n', () => {
  it('三份字典 key 完全一致', () => {
    const zhKeys = Object.keys(strings['zh-TW']).sort();
    expect(Object.keys(strings.en).sort()).toEqual(zhKeys);
    expect(Object.keys(strings.ja).sort()).toEqual(zhKeys);
  });

  it('LOCALES 為單一事實來源：strings 與 localeNames 完全對齊', () => {
    expect(Object.keys(strings).sort()).toEqual([...LOCALES].sort());
    expect(Object.keys(localeNames).sort()).toEqual([...LOCALES].sort());
  });

  it('isLocale：LOCALES 全 true，其他 false', () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true);
    expect(isLocale('garbage')).toBe(false);
    expect(isLocale('ZH-TW')).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it('detectLocale：stored 優先、zh 前綴 → zh-TW、ja 前綴 → ja、其他 → en', () => {
    expect(detectLocale('zh-TW', null)).toBe('zh-TW');
    expect(detectLocale('zh-CN', null)).toBe('zh-TW');
    expect(detectLocale('ja-JP', null)).toBe('ja');
    expect(detectLocale('ja', null)).toBe('ja');
    expect(detectLocale('ko-KR', null)).toBe('en');
    expect(detectLocale('zh-TW', 'en')).toBe('en');
    expect(detectLocale('en-US', 'zh-TW')).toBe('zh-TW');
    expect(detectLocale('en-US', 'ja')).toBe('ja');
    expect(detectLocale('en-US', 'garbage')).toBe('en');
  });

  it('setLocale + t 切換三份字典', () => {
    setLocale('zh-TW');
    expect(t('exportBtn')).toBe(strings['zh-TW'].exportBtn);
    setLocale('ja');
    expect(getLocale()).toBe('ja');
    expect(t('exportBtn')).toBe(strings.ja.exportBtn);
    setLocale('en');
    expect(t('exportBtn')).toBe(strings.en.exportBtn);
  });

  it('applyI18n 原地換掉 [data-i18n] 的文字', () => {
    setLocale('ja');
    const div = document.createElement('div');
    div.innerHTML = '<span data-i18n="trailTitle">舊字</span>';
    applyI18n(div);
    expect(div.querySelector('span')!.textContent).toBe(strings.ja.trailTitle);
  });
});
