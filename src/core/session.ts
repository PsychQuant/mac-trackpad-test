import { deltaStats } from './stats';

export type PanelId = 'trail' | 'grid' | 'force' | 'scroll' | 'pinch';

// Web API 無法自動偵測觸控板型號（PointerEvent 一律回報 "mouse"），
// 由使用者自選；影響判讀端對事件頻率上限的預期（藍牙外接板可能低於內建 120Hz）。
export type DeviceType = 'builtin' | 'magic';

export interface JumpRecord { xPct: number; yPct: number; distPx: number }

export class Session {
  readonly trail = { maxHz: 0, maxJumpPx: 0, jumps: [] as JumpRecord[] };
  readonly grid = {
    left: Array.from({ length: 9 }, () => false),
    right: Array.from({ length: 9 }, () => false),
    doubleClick: false
  };
  readonly force = { maxForce: 0, forceClick: false };
  readonly scroll = { events: 0, deltas: [] as number[] };
  readonly pinch = { fired: false, lastScale: 1, lastRotation: 0 };
  deviceType: DeviceType = 'builtin';
  private readonly skippedSet = new Set<PanelId>();

  markSkipped(id: PanelId): void { this.skippedSet.add(id); }
  get skipped(): PanelId[] { return [...this.skippedSet]; }
}

export interface ExportMeta { timestamp: string; browser: string; language: string }

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function buildExport(s: Session, meta: ExportMeta): Record<string, unknown> {
  const st = deltaStats(s.scroll.deltas);
  return {
    工具: 'mac-trackpad-test 1.0',
    時間: meta.timestamp,
    browser: meta.browser,
    language: meta.language,
    skipped: s.skipped,
    裝置類型: s.deviceType,
    軌跡: {
      最大事件頻率Hz: s.trail.maxHz,
      最大單步跳距px: Math.round(s.trail.maxJumpPx),
      異常跳點: s.trail.jumps.slice(0, 50)
        .map((j) => ({ 'x%': j.xPct, 'y%': j.yPct, 距離px: j.distPx }))
    },
    九宮格: {
      左鍵完成: s.grid.left.filter(Boolean).length,
      右鍵完成: s.grid.right.filter(Boolean).length,
      各格LR: s.grid.left.map(
        (l, i) => (l ? 'L' : '-') + (s.grid.right[i] ? 'R' : '-')
      ),
      雙擊通過: s.grid.doubleClick
    },
    壓力: { 最大壓力: round2(s.force.maxForce), 用力點按觸發: s.force.forceClick },
    捲動: {
      事件數: s.scroll.events,
      deltaY統計: st
        ? { 樣本數: st.n, 最大: st.max, 平均: st.mean, 標準差: st.sd }
        : null
    },
    手勢: {
      有觸發: s.pinch.fired,
      最後縮放: s.pinch.lastScale,
      最後旋轉度: s.pinch.lastRotation
    }
  };
}
