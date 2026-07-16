import { Session, buildExport } from '../src/core/session';

const META = { timestamp: '2026-07-14T00:00:00.000Z', browser: 'test-ua', language: 'zh-TW' };

describe('Session / buildExport', () => {
  it('初始狀態匯出：中文 key 與 v2 schema 相容', () => {
    const out = buildExport(new Session(), META) as Record<string, any>;
    expect(out['工具']).toContain('mac-trackpad-test');
    expect(out['時間']).toBe(META.timestamp);
    expect(out['browser']).toBe('test-ua');
    expect(out['language']).toBe('zh-TW');
    expect(out['skipped']).toEqual([]);
    expect(out['軌跡']).toEqual({ 最大事件頻率Hz: 0, 最大單步跳距px: 0, 異常跳點: [] });
    expect(out['九宮格']).toEqual({
      左鍵完成: 0, 右鍵完成: 0,
      各格LR: ['--', '--', '--', '--', '--', '--', '--', '--', '--'],
      雙擊通過: false
    });
    expect(out['壓力']).toEqual({ 最大壓力: 0, 用力點按觸發: false });
    expect(out['捲動']).toEqual({ 事件數: 0, deltaY統計: null });
    expect(out['手勢']).toEqual({ 有觸發: false, 最後縮放: 1, 最後旋轉度: 0 });
  });

  it('填入資料後正確組裝', () => {
    const s = new Session();
    s.trail.maxHz = 120;
    s.trail.maxJumpPx = 83.4;
    s.trail.jumps.push({ xPct: 18, yPct: 59, distPx: 60 });
    s.grid.left[0] = true; s.grid.right[0] = true; s.grid.left[4] = true;
    s.grid.doubleClick = true;
    s.force.maxForce = 2.734; s.force.forceClick = true;
    s.scroll.events = 3; s.scroll.deltas.push(-3, 4, 5);
    s.pinch.fired = true; s.pinch.lastScale = 2.28; s.pinch.lastRotation = -15;
    const out = buildExport(s, META) as Record<string, any>;
    expect(out['軌跡']['最大單步跳距px']).toBe(83);
    expect(out['軌跡']['異常跳點']).toEqual([{ 'x%': 18, 'y%': 59, 距離px: 60 }]);
    expect(out['九宮格']['左鍵完成']).toBe(2);
    expect(out['九宮格']['各格LR'][0]).toBe('LR');
    expect(out['九宮格']['各格LR'][4]).toBe('L-');
    expect(out['壓力']['最大壓力']).toBe(2.73);
    expect(out['捲動']['deltaY統計']).toEqual({ 樣本數: 3, 最大: 5, 平均: 4, 標準差: 0.8 });
    expect(out['手勢']['最後縮放']).toBe(2.28);
  });

  it('language 欄位跟隨 meta（ja 案例，verify R1 覆蓋缺口）', () => {
    const out = buildExport(new Session(), { ...META, language: 'ja' }) as Record<string, any>;
    expect(out['language']).toBe('ja');
  });

  it('skipped 清單：重複標記去重', () => {
    const s = new Session();
    s.markSkipped('force'); s.markSkipped('pinch'); s.markSkipped('force');
    expect(s.skipped).toEqual(['force', 'pinch']);
  });

  it('異常跳點最多匯出 50 筆', () => {
    const s = new Session();
    for (let i = 0; i < 60; i++) s.trail.jumps.push({ xPct: i, yPct: 0, distPx: 51 });
    const out = buildExport(s, META) as Record<string, any>;
    expect(out['軌跡']['異常跳點']).toHaveLength(50);
  });
});
