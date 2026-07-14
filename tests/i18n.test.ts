import { strings } from '../src/i18n/strings';
import { detectLocale, setLocale, getLocale, t, applyI18n } from '../src/i18n';

describe('i18n', () => {
  it('兩份字典 key 完全一致', () => {
    expect(Object.keys(strings['zh-TW']).sort()).toEqual(Object.keys(strings.en).sort());
  });

  it('detectLocale：stored 優先、zh 前綴 → zh-TW、其他 → en', () => {
    expect(detectLocale('zh-TW', null)).toBe('zh-TW');
    expect(detectLocale('zh-CN', null)).toBe('zh-TW');
    expect(detectLocale('ja-JP', null)).toBe('en');
    expect(detectLocale('zh-TW', 'en')).toBe('en');
    expect(detectLocale('en-US', 'zh-TW')).toBe('zh-TW');
    expect(detectLocale('en-US', 'garbage')).toBe('en');
  });

  it('setLocale + t 切換字典', () => {
    setLocale('zh-TW');
    expect(t('exportBtn')).toBe(strings['zh-TW'].exportBtn);
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('exportBtn')).toBe(strings.en.exportBtn);
  });

  it('applyI18n 原地換掉 [data-i18n] 的文字', () => {
    setLocale('en');
    const div = document.createElement('div');
    div.innerHTML = '<span data-i18n="trailTitle">舊字</span>';
    applyI18n(div);
    expect(div.querySelector('span')!.textContent).toBe(strings.en.trailTitle);
  });
});
