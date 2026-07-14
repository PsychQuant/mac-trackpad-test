# mac-trackpad-test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把已驗證的單檔觸控板檢測工具產品化為公開的中英雙語靜態網站，部署到 Vercel。

**Architecture:** Vite（vanilla-ts）建置純靜態站。偵測演算法與統計是無 DOM 依賴的純函式（`src/core/`），五個測試面板是 DOM 薄層（`src/panels/`），i18n 用 `data-i18n` 屬性做原地換字。Vitest + jsdom 測試。

**Tech Stack:** Vite、TypeScript（strict）、Vitest + jsdom + @vitest/coverage-v8、Vercel（git 連動）。

## Global Constraints

- Node 24（Vercel 預設）；所有依賴皆 devDependencies，runtime 零依賴。
- TypeScript strict mode；每檔 ≤ 200 行。
- 匯出 JSON 的中文 key 必須與既有 v2 結果檔完全一致（`工具`、`時間`、`軌跡`、`九宮格`、`壓力`、`捲動`、`手勢` 及其子欄位）。
- 演算法常數:`NEW_STROKE_MS = 40`、`JUMP_MIN_PX = 50`、`JUMP_RATIO = 3`、`PREV_STEP_FLOOR_PX = 5`。
- 色板固定：底 `#1c1c1e`、卡片 `#2c2c2e`、藍 `#0a84ff`、綠 `#30d158`、紅 `#ff453a`、黃 `#ffd60a`、灰字 `#98989f`。系統字體，不引外部字體。
- 每個 commit 訊息用 conventional commits（feat/test/chore/docs），不含 issue ref（本 repo 尚無 issue tracker）。
- 專案根目錄：`/Users/che/Developer/mac-trackpad-test`（以下所有相對路徑以此為準）。

---

### Task 1: 專案 Scaffold（Vite + Vitest 設定）

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/vite-env.d.ts`, `tests/sanity.test.ts`

**Interfaces:**
- Produces: `npm test`（vitest run, jsdom, globals）、`npm run build`（tsc + vite build）、`npm run coverage` 可用；後續所有 task 依賴這套指令。

- [ ] **Step 1: 寫設定檔**

`package.json`：

```json
{
  "name": "mac-trackpad-test",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage"
  }
}
```

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

`vite.config.ts`：

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/main.ts', 'src/vite-env.d.ts'],
      thresholds: { lines: 80 }
    }
  }
});
```

`index.html`：

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Mac trackpad health check — dead zones, clicks, Force Touch, scrolling, gestures" />
  <title>Mac Trackpad Test</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

`.gitignore`：

```
node_modules
dist
coverage
.vercel
.DS_Store
```

`src/vite-env.d.ts`：

```ts
/// <reference types="vite/client" />
```

`tests/sanity.test.ts`：

```ts
describe('sanity', () => {
  it('jsdom 環境可用', () => {
    const el = document.createElement('div');
    el.textContent = 'ok';
    expect(el.textContent).toBe('ok');
  });
});
```

- [ ] **Step 2: 安裝依賴**

Run: `cd /Users/che/Developer/mac-trackpad-test && npm i -D vite typescript vitest jsdom @vitest/coverage-v8`
Expected: 安裝成功，`package.json` 出現 devDependencies。

- [ ] **Step 3: 跑 sanity test**

Run: `npm test`
Expected: `1 passed`。

注意：此時 `src/` 只有 `vite-env.d.ts`，`npm run build` 會因 `index.html` 引用不存在的 `main.ts` 而失敗——這是預期，build 到 Task 12 才需要通過。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: Vite + TypeScript + Vitest scaffold"
```

---

### Task 2: core/jump-detector.ts（速度突變判定）

**Files:**
- Create: `src/core/jump-detector.ts`
- Test: `tests/jump-detector.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface Point { x: number; y: number }
  interface StepResult { isJump: boolean; distPx: number; withinStroke: boolean; nextPrevStepPx: number }
  const NEW_STROKE_MS = 40; const JUMP_MIN_PX = 50; const JUMP_RATIO = 3; const PREV_STEP_FLOOR_PX = 5;
  function detectStep(prev: Point | null, curr: Point, dtMs: number, prevStepPx: number): StepResult
  ```
  Task 7（trail 面板）依賴上述全部。

背景（調參時必讀）：v1 絕對門檻（>50px）把快滑每一幀都誤標；v2 加相對門檻——快滑是漸進加速（相鄰步幅比值 ≈ 1）不觸發，只有「小步中突然爆大步」的感應瞬移觸發。

- [ ] **Step 1: 寫失敗測試**

`tests/jump-detector.test.ts`：

```ts
import { detectStep } from '../src/core/jump-detector';

describe('detectStep', () => {
  it('prev 為 null（首次觸碰）→ 不判定、prevStep 歸零', () => {
    expect(detectStep(null, { x: 10, y: 10 }, 8, 99)).toEqual(
      { isJump: false, distPx: 0, withinStroke: false, nextPrevStepPx: 0 });
  });

  it('dt ≥ 40ms 視為新筆畫 → 不判定、prevStep 歸零', () => {
    const r = detectStep({ x: 0, y: 0 }, { x: 100, y: 0 }, 40, 10);
    expect(r.isJump).toBe(false);
    expect(r.withinStroke).toBe(false);
    expect(r.nextPrevStepPx).toBe(0);
    expect(r.distPx).toBe(100);
  });

  it('距離 50px（未超過門檻）→ 不是 jump', () => {
    expect(detectStep({ x: 0, y: 0 }, { x: 50, y: 0 }, 8, 0).isJump).toBe(false);
  });

  it('距離 51px 且 prevStep 0（floor 5 → 門檻 15）→ 是 jump', () => {
    const r = detectStep({ x: 0, y: 0 }, { x: 51, y: 0 }, 8, 0);
    expect(r.isJump).toBe(true);
    expect(r.withinStroke).toBe(true);
    expect(r.nextPrevStepPx).toBe(51);
  });

  it('快滑不誤報：60px 但 prevStep 20（門檻 60，不嚴格大於）→ 不是 jump', () => {
    expect(detectStep({ x: 0, y: 0 }, { x: 60, y: 0 }, 8, 20).isJump).toBe(false);
  });

  it('瞬移觸發：61px 且 prevStep 20（> 60）→ 是 jump', () => {
    expect(detectStep({ x: 0, y: 0 }, { x: 61, y: 0 }, 8, 20).isJump).toBe(true);
  });

  it('斜向距離用歐氏距離：(30,40) → 50px，不超過門檻', () => {
    expect(detectStep({ x: 0, y: 0 }, { x: 30, y: 40 }, 8, 0).isJump).toBe(false);
  });
});
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- jump-detector`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作**

`src/core/jump-detector.ts`：

```ts
export interface Point { x: number; y: number }

export interface StepResult {
  isJump: boolean;
  distPx: number;
  withinStroke: boolean;
  nextPrevStepPx: number;
}

export const NEW_STROKE_MS = 40;
export const JUMP_MIN_PX = 50;
export const JUMP_RATIO = 3;
export const PREV_STEP_FLOOR_PX = 5;

// v2 速度突變判定：絕對門檻擋小抖動，相對門檻（3× 前一步）讓快滑的
// 漸進加速不被誤標，只抓「平順移動中突然瞬移」。
export function detectStep(
  prev: Point | null,
  curr: Point,
  dtMs: number,
  prevStepPx: number
): StepResult {
  if (prev === null) {
    return { isJump: false, distPx: 0, withinStroke: false, nextPrevStepPx: 0 };
  }
  const distPx = Math.hypot(curr.x - prev.x, curr.y - prev.y);
  if (dtMs >= NEW_STROKE_MS) {
    return { isJump: false, distPx, withinStroke: false, nextPrevStepPx: 0 };
  }
  const isJump =
    distPx > JUMP_MIN_PX &&
    distPx > JUMP_RATIO * Math.max(prevStepPx, PREV_STEP_FLOOR_PX);
  return { isJump, distPx, withinStroke: true, nextPrevStepPx: distPx };
}
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- jump-detector`
Expected: 7 passed。

- [ ] **Step 5: Commit**

```bash
git add src/core/jump-detector.ts tests/jump-detector.test.ts
git commit -m "feat: v2 速度突變判定純函式（jump-detector）"
```

---

### Task 3: core/stats.ts（deltaY 統計）

**Files:**
- Create: `src/core/stats.ts`
- Test: `tests/stats.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface DeltaStats { n: number; max: number; mean: number; sd: number }
  function deltaStats(deltas: number[]): DeltaStats | null   // 空陣列 → null；值取絕對值、四捨五入到小數 1 位
  ```
  Task 4（session）依賴。

- [ ] **Step 1: 寫失敗測試**

`tests/stats.test.ts`：

```ts
import { deltaStats } from '../src/core/stats';

describe('deltaStats', () => {
  it('空陣列 → null', () => {
    expect(deltaStats([])).toBeNull();
  });

  it('單一樣本 → sd 為 0', () => {
    expect(deltaStats([5])).toEqual({ n: 1, max: 5, mean: 5, sd: 0 });
  });

  it('取絕對值後計算：[-3, 4] → mean 3.5, sd 0.5, max 4', () => {
    expect(deltaStats([-3, 4])).toEqual({ n: 2, max: 4, mean: 3.5, sd: 0.5 });
  });

  it('四捨五入到小數 1 位：[1, 2, 4] → mean 2.3', () => {
    const r = deltaStats([1, 2, 4]);
    expect(r?.mean).toBe(2.3);
  });
});
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- stats`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作**

`src/core/stats.ts`：

```ts
export interface DeltaStats { n: number; max: number; mean: number; sd: number }

const round1 = (v: number): number => Math.round(v * 10) / 10;

export function deltaStats(deltas: number[]): DeltaStats | null {
  if (deltas.length === 0) return null;
  const abs = deltas.map(Math.abs);
  const n = abs.length;
  const mean = abs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(abs.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const max = abs.reduce((a, b) => (b > a ? b : a), 0);
  return { n, max: round1(max), mean: round1(mean), sd: round1(sd) };
}
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- stats`
Expected: 4 passed。

- [ ] **Step 5: Commit**

```bash
git add src/core/stats.ts tests/stats.test.ts
git commit -m "feat: deltaY 統計純函式（stats）"
```

---

### Task 4: core/session.ts（結果收集與匯出 JSON）

**Files:**
- Create: `src/core/session.ts`
- Test: `tests/session.test.ts`

**Interfaces:**
- Consumes: `deltaStats`（Task 3）。
- Produces:
  ```ts
  type PanelId = 'trail' | 'grid' | 'force' | 'scroll' | 'pinch';
  interface JumpRecord { xPct: number; yPct: number; distPx: number }
  class Session {
    trail: { maxHz: number; maxJumpPx: number; jumps: JumpRecord[] };
    grid: { left: boolean[]; right: boolean[]; doubleClick: boolean };   // 各長度 9
    force: { maxForce: number; forceClick: boolean };
    scroll: { events: number; deltas: number[] };
    pinch: { fired: boolean; lastScale: number; lastRotation: number };
    markSkipped(id: PanelId): void;
    get skipped(): PanelId[];
  }
  interface ExportMeta { timestamp: string; browser: string; language: string }
  function buildExport(s: Session, meta: ExportMeta): Record<string, unknown>
  ```
  所有 panel task（7–11）與 main（Task 12）依賴 `Session`；Task 12 依賴 `buildExport`。

- [ ] **Step 1: 寫失敗測試**

`tests/session.test.ts`：

```ts
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
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- session`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作**

`src/core/session.ts`：

```ts
import { deltaStats } from './stats';

export type PanelId = 'trail' | 'grid' | 'force' | 'scroll' | 'pinch';

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
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- session`
Expected: 4 passed。

- [ ] **Step 5: Commit**

```bash
git add src/core/session.ts tests/session.test.ts
git commit -m "feat: Session 結果收集與 v2 相容匯出 JSON"
```

---

### Task 5: support.ts（瀏覽器能力偵測）

**Files:**
- Create: `src/support.ts`
- Test: `tests/support.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface Capabilities { forceTouch: boolean; gesture: boolean; touchDevice: boolean }
  interface WindowLike { MouseEvent: object; navigator: { maxTouchPoints: number }; [k: string]: unknown }
  function detectCapabilities(win?: WindowLike): Capabilities   // 預設用全域 window
  ```
  Task 9、11、12 依賴。

- [ ] **Step 1: 寫失敗測試**

`tests/support.test.ts`：

```ts
import { detectCapabilities, type WindowLike } from '../src/support';

function fakeWin(overrides: Partial<WindowLike> = {}): WindowLike {
  return { MouseEvent: {}, navigator: { maxTouchPoints: 0 }, ...overrides };
}

describe('detectCapabilities', () => {
  it('全無支援（Chrome-like）', () => {
    expect(detectCapabilities(fakeWin())).toEqual(
      { forceTouch: false, gesture: false, touchDevice: false });
  });

  it('Safari-like：MouseEvent 有 WEBKIT_FORCE 常數、window 有 GestureEvent', () => {
    const win = fakeWin({
      MouseEvent: { WEBKIT_FORCE_AT_MOUSE_DOWN: 1 },
      GestureEvent: function GestureEvent() {}
    });
    const caps = detectCapabilities(win);
    expect(caps.forceTouch).toBe(true);
    expect(caps.gesture).toBe(true);
  });

  it('觸控裝置：maxTouchPoints > 0', () => {
    expect(detectCapabilities(fakeWin({ navigator: { maxTouchPoints: 5 } })).touchDevice).toBe(true);
  });

  it('觸控裝置：有 ontouchstart 屬性', () => {
    expect(detectCapabilities(fakeWin({ ontouchstart: null })).touchDevice).toBe(true);
  });
});
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- support`
Expected: FAIL。

- [ ] **Step 3: 實作**

`src/support.ts`：

```ts
export interface Capabilities {
  forceTouch: boolean;
  gesture: boolean;
  touchDevice: boolean;
}

export interface WindowLike {
  MouseEvent: object;
  navigator: { maxTouchPoints: number };
  [k: string]: unknown;
}

// 用特徵偵測（不是 UA 字串）：Safari 的 MouseEvent 帶 WEBKIT_FORCE_* 常數、
// window 有 GestureEvent 建構子。
export function detectCapabilities(
  win: WindowLike = window as unknown as WindowLike
): Capabilities {
  return {
    forceTouch: 'WEBKIT_FORCE_AT_MOUSE_DOWN' in win.MouseEvent,
    gesture: 'GestureEvent' in win,
    touchDevice: 'ontouchstart' in win || win.navigator.maxTouchPoints > 0
  };
}
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- support`
Expected: 4 passed。

- [ ] **Step 5: Commit**

```bash
git add src/support.ts tests/support.test.ts
git commit -m "feat: 瀏覽器能力偵測（forceTouch/gesture/touchDevice）"
```

---

### Task 6: i18n（字典 + 換字機制）

**Files:**
- Create: `src/i18n/strings.ts`, `src/i18n/index.ts`
- Test: `tests/i18n.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Locale = 'zh-TW' | 'en';
  interface Strings { /* 全部 UI 字串 key，見下 */ }
  const strings: Record<Locale, Strings>;
  function detectLocale(navLang: string, stored: string | null): Locale;
  function initLocale(): Locale;           // 讀 navigator.language + localStorage
  function getLocale(): Locale;
  function setLocale(l: Locale): void;     // 寫 localStorage
  function t(key: keyof Strings): string;
  function applyI18n(root: ParentNode): void;  // 掃 [data-i18n] 原地換字
  ```
  所有 panel task 與 main 依賴 `t` 與 `data-i18n` 慣例：靜態文字放 `data-i18n="key"`，動態狀態文字（如「通過」）由 panel 在事件當下設 `dataset.i18n` 後呼叫 `t()` 寫入，語言切換時 `applyI18n` 會一併重翻。

- [ ] **Step 1: 寫失敗測試**

`tests/i18n.test.ts`：

```ts
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
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- i18n`
Expected: FAIL。

- [ ] **Step 3: 實作字典**

`src/i18n/strings.ts`（完整內容——zh-TW 沿用既有工具文案，en 為對應翻譯）：

```ts
export type Locale = 'zh-TW' | 'en';

export interface Strings {
  pageTitle: string; pageSubtitle: string; langToggle: string; touchBanner: string;
  trailTitle: string; trailHint: string;
  hzLabel: string; maxJumpLabel: string; jumpCountLabel: string; clearBtn: string;
  gridTitle: string; gridHint: string;
  leftLabel: string; rightLabel: string; dblLabel: string; dblPass: string; dblPending: string;
  forceTitle: string; forceHint: string;
  forceNowLabel: string; forceMaxLabel: string; forceClickLabel: string;
  forceClickDone: string; forceClickPending: string;
  scrollTitle: string; scrollHint: string; scrollLine: string; dyLabel: string; wheelCountLabel: string;
  pinchTitle: string; pinchHint: string; pinchTarget: string; scaleLabel: string; rotationLabel: string;
  exportTitle: string; exportHint: string; exportBtn: string;
  exportCopied: string; exportCopyFailed: string;
  needSafariTitle: string; needSafariForce: string; needSafariPinch: string;
}

export const strings: Record<Locale, Strings> = {
  'zh-TW': {
    pageTitle: 'Mac 觸控板健康檢查',
    pageSubtitle: '依序做完五關。每一關都在測觸控板的一種故障模式（死區、微動開關、壓力感應、慣性捲動、多指手勢）。',
    langToggle: 'EN',
    touchBanner: '本工具供 Mac 觸控板檢測，請在 Mac 上用 Safari 開啟。',
    trailTitle: '1. 軌跡測試 — 找死區與跳動',
    trailHint: '單指掃滿整個觸控板表面，來回蓋滿。畫出的線應該連續平滑：斷線 = 死區。紅色線段 = 速度突變異常（這一步超過 50px 且是前一步的 3 倍以上）——快滑不會誤標，出現紅色代表游標從平順移動中突然瞬移。',
    hzLabel: '事件頻率', maxJumpLabel: '最大單步跳距', jumpCountLabel: '異常跳點', clearBtn: '清除重畫',
    gridTitle: '2. 九宮格點按 — 每個角落都要能按',
    gridHint: '在九格中每一格各做一次左鍵點按（變綠）、再各做一次右鍵/雙指點按（變藍）。任何區域按不出來 = 該區微動或感應異常。',
    leftLabel: '左鍵', rightLabel: '右鍵', dblLabel: '雙擊測試',
    dblPass: '通過', dblPending: '未通過（隨便一格快速連點兩下）',
    forceTitle: '3. Force Touch 壓力感應',
    forceHint: '按住下方壓力條區域，由輕到重慢慢加壓：條應連續平滑上升，越過白線時觸發用力點按（會震動一下）。壓力跳動或永遠到不了白線 = 壓力感應層異常。',
    forceNowLabel: '目前壓力', forceMaxLabel: '本次最大', forceClickLabel: '用力點按',
    forceClickDone: '已觸發 ✓', forceClickPending: '未觸發',
    scrollTitle: '4. 雙指捲動 — 平滑度與慣性',
    scrollHint: '在下方框內雙指上下捲動，然後手指離開讓它慣性滑行。捲動應跟手、慣性應平滑減速。',
    scrollLine: '行 — 平滑捲過我', dyLabel: '目前 ΔY', wheelCountLabel: '事件數',
    pinchTitle: '5. 捏合縮放與旋轉',
    pinchHint: '在藍色方塊上雙指捏合/張開、旋轉。方塊應即時跟著變化，代表多指座標各自獨立正常。',
    pinchTarget: '雙指', scaleLabel: '縮放', rotationLabel: '旋轉',
    exportTitle: '6. 匯出結果',
    exportHint: '五關做完後按下方按鈕，測試數據會複製到剪貼簿（並下載 JSON 備份），可貼給 AI 或維修人員判讀。',
    exportBtn: '複製測試結果', exportCopied: '已複製到剪貼簿 ✓', exportCopyFailed: '剪貼簿失敗，已改用下載',
    needSafariTitle: '此項需要 Safari',
    needSafariForce: '壓力感應使用 Safari 專屬的 webkitForce 事件，Chrome/Firefox 無法測。其餘關卡不受影響。',
    needSafariPinch: '捏合手勢使用 Safari 專屬的 GestureEvent，Chrome/Firefox 無法測。其餘關卡不受影響。'
  },
  en: {
    pageTitle: 'Mac Trackpad Test',
    pageSubtitle: 'Run all five checks. Each targets one trackpad failure mode (dead zones, click switches, pressure sensing, inertial scrolling, multi-finger gestures).',
    langToggle: '中文',
    touchBanner: 'This tool checks Mac trackpads — please open it in Safari on a Mac.',
    trailTitle: '1. Trail — dead zones & cursor jumps',
    trailHint: 'Sweep one finger across the whole trackpad surface until covered. The line should be continuous and smooth: a gap = dead zone. Red segments = velocity anomalies (a step over 50px and 3× the previous step) — fast swipes are not flagged; red means the cursor teleported mid-motion.',
    hzLabel: 'Event rate', maxJumpLabel: 'Max step', jumpCountLabel: 'Anomalies', clearBtn: 'Clear',
    gridTitle: '2. 3×3 click grid — every corner must click',
    gridHint: 'Left-click every cell once (turns green), then right-click / two-finger-click each (turns blue). Any area that will not click = faulty switch or sensing in that zone.',
    leftLabel: 'Left', rightLabel: 'Right', dblLabel: 'Double-click',
    dblPass: 'passed', dblPending: 'not yet (double-click any cell)',
    forceTitle: '3. Force Touch pressure',
    forceHint: 'Press and hold on the bar below, gradually pressing harder: the bar should rise smoothly, and crossing the white line triggers a force click (haptic tap). Jumpy readings or never reaching the line = faulty pressure layer.',
    forceNowLabel: 'Current', forceMaxLabel: 'Max', forceClickLabel: 'Force click',
    forceClickDone: 'triggered ✓', forceClickPending: 'not triggered',
    scrollTitle: '4. Two-finger scroll — smoothness & inertia',
    scrollHint: 'Scroll up and down inside the box, then lift your fingers and let it coast. Scrolling should track your fingers and decelerate smoothly.',
    scrollLine: '— scroll past me smoothly', dyLabel: 'ΔY', wheelCountLabel: 'Events',
    pinchTitle: '5. Pinch zoom & rotate',
    pinchHint: 'Pinch, spread, and rotate two fingers over the blue square. It should follow in real time, proving each finger is tracked independently.',
    pinchTarget: '2 fingers', scaleLabel: 'Scale', rotationLabel: 'Rotation',
    exportTitle: '6. Export results',
    exportHint: 'After all five checks, press the button: results are copied to the clipboard (and downloaded as JSON) — paste them to an AI or technician for interpretation.',
    exportBtn: 'Copy results', exportCopied: 'Copied ✓', exportCopyFailed: 'Clipboard failed — downloaded instead',
    needSafariTitle: 'Safari required',
    needSafariForce: 'Pressure sensing uses Safari-only webkitForce events; Chrome/Firefox cannot run this check. Other checks still work.',
    needSafariPinch: 'Pinch gestures use Safari-only GestureEvent; Chrome/Firefox cannot run this check. Other checks still work.'
  }
};
```

`src/i18n/index.ts`：

```ts
import { strings, type Locale, type Strings } from './strings';

const STORAGE_KEY = 'mac-trackpad-test-lang';
let current: Locale = 'zh-TW';

export function detectLocale(navLang: string, stored: string | null): Locale {
  if (stored === 'zh-TW' || stored === 'en') return stored;
  return navLang.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}

export function initLocale(): Locale {
  current = detectLocale(navigator.language, localStorage.getItem(STORAGE_KEY));
  return current;
}

export function getLocale(): Locale { return current; }

export function setLocale(l: Locale): void {
  current = l;
  localStorage.setItem(STORAGE_KEY, l);
}

export function t(key: keyof Strings): string { return strings[current][key]; }

export function applyI18n(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as keyof Strings);
  });
}

export { strings, type Locale, type Strings };
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- i18n`
Expected: 4 passed。

- [ ] **Step 5: Commit**

```bash
git add src/i18n tests/i18n.test.ts
git commit -m "feat: 中英雙語 i18n（data-i18n 原地換字）"
```

---

### Task 7: panels/trail.ts（軌跡面板）

**Files:**
- Create: `src/panels/trail.ts`
- Test: `tests/trail.test.ts`

**Interfaces:**
- Consumes: `detectStep`、`NEW_STROKE_MS`（Task 2）、`Session`（Task 4）、`t`（Task 6）。
- Produces: `function mountTrail(el: HTMLElement, session: Session): void`（Task 12 依賴）。

實作要點：jsdom 的 `canvas.getContext('2d')` 回 `null`——繪圖程式碼一律以 `if (ctx2d)` 保護，判定與計數邏輯不依賴繪圖，測試才跑得動。

- [ ] **Step 1: 寫失敗測試**

`tests/trail.test.ts`：

```ts
import { mountTrail } from '../src/panels/trail';
import { Session } from '../src/core/session';

function setup() {
  const el = document.createElement('section');
  document.body.appendChild(el);
  const session = new Session();
  mountTrail(el, session);
  const canvas = el.querySelector('canvas')!;
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 600, height: 300, right: 600, bottom: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  Object.defineProperty(canvas, 'clientWidth', { value: 600 });
  Object.defineProperty(canvas, 'clientHeight', { value: 300 });
  return { el, session, canvas };
}

function move(canvas: HTMLElement, x: number, y: number, atMs: number) {
  vi.spyOn(performance, 'now').mockReturnValue(atMs);
  canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
}

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; });

describe('mountTrail', () => {
  it('平順慢速移動：不產生異常跳點', () => {
    const { session, canvas } = setup();
    move(canvas, 100, 100, 0);
    move(canvas, 104, 100, 8);
    move(canvas, 108, 100, 16);
    expect(session.trail.jumps).toHaveLength(0);
  });

  it('小步中突然瞬移：記錄跳點（含百分比座標）並更新計數', () => {
    const { el, session, canvas } = setup();
    move(canvas, 100, 100, 0);
    move(canvas, 104, 100, 8);     // prevStep = 4
    move(canvas, 300, 100, 16);    // 196px > 50 且 > 3×max(4,5) → jump
    expect(session.trail.jumps).toHaveLength(1);
    expect(session.trail.jumps[0]).toEqual({ xPct: 50, yPct: 33, distPx: 196 });
    expect(el.querySelector('.jumps')!.textContent).toBe('1');
  });

  it('快滑漸進加速：不誤報', () => {
    const { session, canvas } = setup();
    move(canvas, 0, 0, 0);
    move(canvas, 40, 0, 8);     // 40px, prevStep 0→floor5, 40 <= 50 不觸發
    move(canvas, 120, 0, 16);   // 80px > 50 但 80 <= 3×40 不觸發
    move(canvas, 210, 0, 24);   // 90px > 50 但 90 <= 3×80 不觸發
    expect(session.trail.jumps).toHaveLength(0);
  });

  it('maxHz 與 maxJumpPx 寫入 session', () => {
    const { session, canvas } = setup();
    move(canvas, 0, 0, 0);
    move(canvas, 10, 0, 8);
    expect(session.trail.maxHz).toBeGreaterThan(0);
    expect(session.trail.maxJumpPx).toBe(10);
  });

  it('清除按鈕重置跳點與跳距', () => {
    const { el, session, canvas } = setup();
    move(canvas, 100, 100, 0);
    move(canvas, 104, 100, 8);
    move(canvas, 300, 100, 16);
    (el.querySelector('.clear') as HTMLButtonElement).click();
    expect(session.trail.jumps).toHaveLength(0);
    expect(session.trail.maxJumpPx).toBe(0);
    expect(el.querySelector('.jumps')!.textContent).toBe('0');
  });
});
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- trail`
Expected: FAIL。

- [ ] **Step 3: 實作**

`src/panels/trail.ts`：

```ts
import { detectStep, type Point } from '../core/jump-detector';
import type { Session } from '../core/session';
import { t } from '../i18n';

export function mountTrail(el: HTMLElement, session: Session): void {
  el.innerHTML = `
    <h2 data-i18n="trailTitle">${t('trailTitle')}</h2>
    <p class="hint" data-i18n="trailHint">${t('trailHint')}</p>
    <canvas class="trail-canvas" height="300"></canvas>
    <div class="stats">
      <span><span data-i18n="hzLabel">${t('hzLabel')}</span> <b class="hz">–</b> Hz</span>
      <span><span data-i18n="maxJumpLabel">${t('maxJumpLabel')}</span> <b class="maxjump">–</b> px</span>
      <span><span data-i18n="jumpCountLabel">${t('jumpCountLabel')}</span> <b class="jumps">0</b></span>
    </div>
    <button class="clear" data-i18n="clearBtn">${t('clearBtn')}</button>`;

  const canvas = el.querySelector('canvas') as HTMLCanvasElement;
  const ctx2d = canvas.getContext('2d'); // jsdom 回 null，繪圖跳過、邏輯照常
  const hzEl = el.querySelector('.hz') as HTMLElement;
  const maxJumpEl = el.querySelector('.maxjump') as HTMLElement;
  const jumpsEl = el.querySelector('.jumps') as HTMLElement;

  if (ctx2d) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = 300 * dpr;
    ctx2d.scale(dpr, dpr);
    ctx2d.lineWidth = 2;
    ctx2d.lineCap = 'round';
  }

  let last: Point | null = null;
  let lastT = 0;
  let prevStep = 0;
  const times: number[] = [];

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const curr = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const now = performance.now();

    times.push(now);
    while (times.length && now - times[0] > 1000) times.shift();
    if (times.length > session.trail.maxHz) session.trail.maxHz = times.length;
    hzEl.textContent = String(times.length);

    const step = detectStep(last, curr, now - lastT, prevStep);
    prevStep = step.nextPrevStepPx;

    if (step.withinStroke && step.distPx > session.trail.maxJumpPx) {
      session.trail.maxJumpPx = step.distPx;
      maxJumpEl.textContent = step.distPx.toFixed(0);
    }
    if (step.isJump) {
      session.trail.jumps.push({
        xPct: Math.round((curr.x / canvas.clientWidth) * 100),
        yPct: Math.round((curr.y / canvas.clientHeight) * 100),
        distPx: Math.round(step.distPx)
      });
      jumpsEl.textContent = String(session.trail.jumps.length);
    }
    if (ctx2d && last) {
      ctx2d.strokeStyle = step.isJump ? '#ff453a' : '#0a84ff';
      ctx2d.beginPath();
      ctx2d.moveTo(last.x, last.y);
      ctx2d.lineTo(curr.x, curr.y);
      ctx2d.stroke();
    }
    last = curr;
    lastT = now;
  });

  canvas.addEventListener('mouseleave', () => { last = null; });

  (el.querySelector('.clear') as HTMLButtonElement).addEventListener('click', () => {
    if (ctx2d) ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    session.trail.jumps.length = 0;
    session.trail.maxJumpPx = 0;
    maxJumpEl.textContent = '–';
    jumpsEl.textContent = '0';
  });
}
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- trail`
Expected: 5 passed。

- [ ] **Step 5: Commit**

```bash
git add src/panels/trail.ts tests/trail.test.ts
git commit -m "feat: 軌跡面板（死區/速度突變視覺化）"
```

---

### Task 8: panels/grid.ts（九宮格點按面板）

**Files:**
- Create: `src/panels/grid.ts`
- Test: `tests/grid.test.ts`

**Interfaces:**
- Consumes: `Session`（Task 4）、`t`（Task 6）。
- Produces: `function mountGrid(el: HTMLElement, session: Session): void`（Task 12 依賴）。

- [ ] **Step 1: 寫失敗測試**

`tests/grid.test.ts`：

```ts
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
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- grid`
Expected: FAIL。

- [ ] **Step 3: 實作**

`src/panels/grid.ts`：

```ts
import type { Session } from '../core/session';
import { t } from '../i18n';

export function mountGrid(el: HTMLElement, session: Session): void {
  el.innerHTML = `
    <h2 data-i18n="gridTitle">${t('gridTitle')}</h2>
    <p class="hint" data-i18n="gridHint">${t('gridHint')}</p>
    <div class="grid3"></div>
    <div class="stats">
      <span><span data-i18n="leftLabel">${t('leftLabel')}</span> <b class="lc">0</b>/9</span>
      <span><span data-i18n="rightLabel">${t('rightLabel')}</span> <b class="rc">0</b>/9</span>
      <span><span data-i18n="dblLabel">${t('dblLabel')}</span> <b class="dc" data-i18n="dblPending">${t('dblPending')}</b></span>
    </div>`;

  const grid = el.querySelector('.grid3') as HTMLElement;
  const lcEl = el.querySelector('.lc') as HTMLElement;
  const rcEl = el.querySelector('.rc') as HTMLElement;
  const dcEl = el.querySelector('.dc') as HTMLElement;

  const paint = (i: number, cell: HTMLElement): void => {
    const l = session.grid.left[i];
    const r = session.grid.right[i];
    cell.className = 'cell' + (l && r ? ' bothdone' : l ? ' leftdone' : '');
    lcEl.textContent = String(session.grid.left.filter(Boolean).length);
    rcEl.textContent = String(session.grid.right.filter(Boolean).length);
  };

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = String(i + 1);
    cell.addEventListener('click', () => {
      session.grid.left[i] = true;
      paint(i, cell);
    });
    cell.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      session.grid.right[i] = true;
      paint(i, cell);
    });
    cell.addEventListener('dblclick', () => {
      session.grid.doubleClick = true;
      dcEl.dataset.i18n = 'dblPass';
      dcEl.textContent = t('dblPass');
      dcEl.classList.add('ok');
    });
    grid.appendChild(cell);
  }
}
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- grid`
Expected: 4 passed。

- [ ] **Step 5: Commit**

```bash
git add src/panels/grid.ts tests/grid.test.ts
git commit -m "feat: 九宮格點按面板"
```

---

### Task 9: panels/force.ts（Force Touch 面板，含降級）

**Files:**
- Create: `src/panels/force.ts`
- Test: `tests/force.test.ts`

**Interfaces:**
- Consumes: `Session`、`Capabilities`、`t`。
- Produces: `function mountForce(el: HTMLElement, session: Session, caps: Capabilities): void`（Task 12 依賴）。

- [ ] **Step 1: 寫失敗測試**

`tests/force.test.ts`：

```ts
import { mountForce } from '../src/panels/force';
import { Session } from '../src/core/session';
import { setLocale } from '../src/i18n';

const CAPS_ON = { forceTouch: true, gesture: true, touchDevice: false };
const CAPS_OFF = { forceTouch: false, gesture: false, touchDevice: false };

function forceEvent(type: string, force: number): Event {
  const ev = new Event(type, { bubbles: true });
  Object.defineProperty(ev, 'webkitForce', { value: force });
  return ev;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('mountForce', () => {
  it('不支援時：顯示需 Safari 卡片、標記 skipped、不產生壓力條', () => {
    setLocale('zh-TW');
    const el = document.createElement('section');
    const session = new Session();
    mountForce(el, session, CAPS_OFF);
    expect(el.querySelector('.notice-card')).not.toBeNull();
    expect(el.querySelector('.forcebar-wrap')).toBeNull();
    expect(session.skipped).toEqual(['force']);
  });

  it('支援時：壓力事件更新 maxForce', () => {
    const el = document.createElement('section');
    document.body.appendChild(el);
    const session = new Session();
    mountForce(el, session, CAPS_ON);
    const wrap = el.querySelector('.forcebar-wrap') as HTMLElement;
    wrap.dispatchEvent(forceEvent('webkitmouseforcechanged', 1.5));
    wrap.dispatchEvent(forceEvent('webkitmouseforcechanged', 2.7));
    wrap.dispatchEvent(forceEvent('webkitmouseforcechanged', 2.0));
    expect(session.force.maxForce).toBe(2.7);
  });

  it('webkitmouseforcedown：forceClick = true、狀態文字更新', () => {
    setLocale('zh-TW');
    const el = document.createElement('section');
    document.body.appendChild(el);
    const session = new Session();
    mountForce(el, session, CAPS_ON);
    const wrap = el.querySelector('.forcebar-wrap') as HTMLElement;
    wrap.dispatchEvent(new Event('webkitmouseforcedown', { bubbles: true }));
    expect(session.force.forceClick).toBe(true);
    expect((el.querySelector('.fclick') as HTMLElement).classList.contains('ok')).toBe(true);
  });
});
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- force`
Expected: FAIL。

- [ ] **Step 3: 實作**

`src/panels/force.ts`：

```ts
import type { Session } from '../core/session';
import type { Capabilities } from '../support';
import { t } from '../i18n';

const FORCE_RANGE = 3; // Safari webkitForce 量程約 0–3，1 ≈ force click 門檻

export function mountForce(el: HTMLElement, session: Session, caps: Capabilities): void {
  el.innerHTML = `<h2 data-i18n="forceTitle">${t('forceTitle')}</h2>`;

  if (!caps.forceTouch) {
    session.markSkipped('force');
    el.insertAdjacentHTML('beforeend', `
      <div class="notice-card">
        <b data-i18n="needSafariTitle">${t('needSafariTitle')}</b>
        <span data-i18n="needSafariForce">${t('needSafariForce')}</span>
      </div>`);
    return;
  }

  el.insertAdjacentHTML('beforeend', `
    <p class="hint" data-i18n="forceHint">${t('forceHint')}</p>
    <div class="forcebar-wrap">
      <div class="forcebar"></div>
      <div class="force-thresh"></div>
    </div>
    <div class="stats">
      <span><span data-i18n="forceNowLabel">${t('forceNowLabel')}</span> <b class="fnow">0.00</b></span>
      <span><span data-i18n="forceMaxLabel">${t('forceMaxLabel')}</span> <b class="fmax">0.00</b></span>
      <span><span data-i18n="forceClickLabel">${t('forceClickLabel')}</span> <b class="fclick" data-i18n="forceClickPending">${t('forceClickPending')}</b></span>
    </div>`);

  const wrap = el.querySelector('.forcebar-wrap') as HTMLElement;
  const bar = el.querySelector('.forcebar') as HTMLElement;
  const fnowEl = el.querySelector('.fnow') as HTMLElement;
  const fmaxEl = el.querySelector('.fmax') as HTMLElement;
  const fclickEl = el.querySelector('.fclick') as HTMLElement;

  wrap.addEventListener('webkitmouseforcechanged', (e) => {
    const f = (e as MouseEvent & { webkitForce?: number }).webkitForce ?? 0;
    bar.style.transform = `scaleX(${Math.min(f / FORCE_RANGE, 1)})`;
    fnowEl.textContent = f.toFixed(2);
    if (f > session.force.maxForce) {
      session.force.maxForce = f;
      fmaxEl.textContent = f.toFixed(2);
    }
  });

  wrap.addEventListener('webkitmouseforcedown', () => {
    session.force.forceClick = true;
    fclickEl.dataset.i18n = 'forceClickDone';
    fclickEl.textContent = t('forceClickDone');
    fclickEl.classList.add('ok');
  });

  wrap.addEventListener('mouseup', () => {
    bar.style.transform = 'scaleX(0)';
    fnowEl.textContent = '0.00';
  });
}
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- force`
Expected: 3 passed。

- [ ] **Step 5: Commit**

```bash
git add src/panels/force.ts tests/force.test.ts
git commit -m "feat: Force Touch 壓力面板（含 Safari 降級卡）"
```

---

### Task 10: panels/scroll.ts（雙指捲動面板）

**Files:**
- Create: `src/panels/scroll.ts`
- Test: `tests/scroll.test.ts`

**Interfaces:**
- Consumes: `Session`、`t`。
- Produces: `function mountScroll(el: HTMLElement, session: Session): void`（Task 12 依賴）。deltas 上限 1000 筆（FIFO）。

- [ ] **Step 1: 寫失敗測試**

`tests/scroll.test.ts`：

```ts
import { mountScroll } from '../src/panels/scroll';
import { Session } from '../src/core/session';

function setup() {
  const el = document.createElement('section');
  document.body.appendChild(el);
  const session = new Session();
  mountScroll(el, session);
  return { el, session, box: el.querySelector('.scrollbox') as HTMLElement };
}

afterEach(() => { document.body.innerHTML = ''; });

describe('mountScroll', () => {
  it('wheel 事件：計數與 deltas 記錄', () => {
    const { el, session, box } = setup();
    box.dispatchEvent(new WheelEvent('wheel', { deltaY: -12.5, bubbles: true }));
    box.dispatchEvent(new WheelEvent('wheel', { deltaY: 30, bubbles: true }));
    expect(session.scroll.events).toBe(2);
    expect(session.scroll.deltas).toEqual([-12.5, 30]);
    expect(el.querySelector('.wc')!.textContent).toBe('2');
    expect(el.querySelector('.dy')!.textContent).toBe('30.0');
  });

  it('deltas 上限 1000（FIFO）', () => {
    const { session, box } = setup();
    for (let i = 0; i < 1005; i++) {
      box.dispatchEvent(new WheelEvent('wheel', { deltaY: i, bubbles: true }));
    }
    expect(session.scroll.deltas).toHaveLength(1000);
    expect(session.scroll.deltas[0]).toBe(5);
    expect(session.scroll.events).toBe(1005);
  });
});
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- scroll`
Expected: FAIL。

- [ ] **Step 3: 實作**

`src/panels/scroll.ts`：

```ts
import type { Session } from '../core/session';
import { t } from '../i18n';

const MAX_DELTAS = 1000;
const LINES = 80;

export function mountScroll(el: HTMLElement, session: Session): void {
  el.innerHTML = `
    <h2 data-i18n="scrollTitle">${t('scrollTitle')}</h2>
    <p class="hint" data-i18n="scrollHint">${t('scrollHint')}</p>
    <div class="scrollbox"></div>
    <div class="stats">
      <span><span data-i18n="dyLabel">${t('dyLabel')}</span> <b class="dy">0</b></span>
      <span><span data-i18n="wheelCountLabel">${t('wheelCountLabel')}</span> <b class="wc">0</b></span>
    </div>`;

  const box = el.querySelector('.scrollbox') as HTMLElement;
  const dyEl = el.querySelector('.dy') as HTMLElement;
  const wcEl = el.querySelector('.wc') as HTMLElement;

  for (let i = 1; i <= LINES; i++) {
    const line = document.createElement('div');
    line.textContent = `${i} ${t('scrollLine')}`;
    box.appendChild(line);
  }

  box.addEventListener('wheel', (e) => {
    session.scroll.events += 1;
    session.scroll.deltas.push(e.deltaY);
    if (session.scroll.deltas.length > MAX_DELTAS) session.scroll.deltas.shift();
    dyEl.textContent = e.deltaY.toFixed(1);
    wcEl.textContent = String(session.scroll.events);
  }, { passive: true });
}
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- scroll`
Expected: 2 passed。

- [ ] **Step 5: Commit**

```bash
git add src/panels/scroll.ts tests/scroll.test.ts
git commit -m "feat: 雙指捲動面板"
```

---

### Task 11: panels/pinch.ts（捏合手勢面板，含降級）

**Files:**
- Create: `src/panels/pinch.ts`
- Test: `tests/pinch.test.ts`

**Interfaces:**
- Consumes: `Session`、`Capabilities`、`t`。
- Produces: `function mountPinch(el: HTMLElement, session: Session, caps: Capabilities): void`（Task 12 依賴）。

- [ ] **Step 1: 寫失敗測試**

`tests/pinch.test.ts`：

```ts
import { mountPinch } from '../src/panels/pinch';
import { Session } from '../src/core/session';
import { setLocale } from '../src/i18n';

const CAPS_ON = { forceTouch: true, gesture: true, touchDevice: false };
const CAPS_OFF = { forceTouch: false, gesture: false, touchDevice: false };

function gestureEvent(type: string, scale: number, rotation: number): Event {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'scale', { value: scale });
  Object.defineProperty(ev, 'rotation', { value: rotation });
  return ev;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('mountPinch', () => {
  it('不支援時：需 Safari 卡片 + skipped', () => {
    setLocale('zh-TW');
    const el = document.createElement('section');
    const session = new Session();
    mountPinch(el, session, CAPS_OFF);
    expect(el.querySelector('.notice-card')).not.toBeNull();
    expect(session.skipped).toEqual(['pinch']);
  });

  it('gesturechange：記錄 fired/scale/rotation 並更新顯示', () => {
    const el = document.createElement('section');
    document.body.appendChild(el);
    const session = new Session();
    mountPinch(el, session, CAPS_ON);
    const box = el.querySelector('.pinchbox') as HTMLElement;
    box.dispatchEvent(gestureEvent('gesturechange', 2.28, -15.4));
    expect(session.pinch.fired).toBe(true);
    expect(session.pinch.lastScale).toBe(2.28);
    expect(session.pinch.lastRotation).toBe(-15);
    expect(el.querySelector('.scale')!.textContent).toBe('2.28');
  });
});
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- pinch`
Expected: FAIL。

- [ ] **Step 3: 實作**

`src/panels/pinch.ts`：

```ts
import type { Session } from '../core/session';
import type { Capabilities } from '../support';
import { t } from '../i18n';

export function mountPinch(el: HTMLElement, session: Session, caps: Capabilities): void {
  el.innerHTML = `<h2 data-i18n="pinchTitle">${t('pinchTitle')}</h2>`;

  if (!caps.gesture) {
    session.markSkipped('pinch');
    el.insertAdjacentHTML('beforeend', `
      <div class="notice-card">
        <b data-i18n="needSafariTitle">${t('needSafariTitle')}</b>
        <span data-i18n="needSafariPinch">${t('needSafariPinch')}</span>
      </div>`);
    return;
  }

  el.insertAdjacentHTML('beforeend', `
    <p class="hint" data-i18n="pinchHint">${t('pinchHint')}</p>
    <div class="pinchbox"><div class="pinchtarget" data-i18n="pinchTarget">${t('pinchTarget')}</div></div>
    <div class="stats">
      <span><span data-i18n="scaleLabel">${t('scaleLabel')}</span> <b class="scale">1.00</b></span>
      <span><span data-i18n="rotationLabel">${t('rotationLabel')}</span> <b class="rot">0°</b></span>
    </div>`);

  const box = el.querySelector('.pinchbox') as HTMLElement;
  const target = el.querySelector('.pinchtarget') as HTMLElement;
  const scaleEl = el.querySelector('.scale') as HTMLElement;
  const rotEl = el.querySelector('.rot') as HTMLElement;

  box.addEventListener('gesturestart', (e) => e.preventDefault());
  box.addEventListener('gesturechange', (e) => {
    e.preventDefault();
    const g = e as Event & { scale?: number; rotation?: number };
    const scale = g.scale ?? 1;
    const rotation = g.rotation ?? 0;
    session.pinch.fired = true;
    session.pinch.lastScale = Math.round(scale * 100) / 100;
    session.pinch.lastRotation = Math.round(rotation);
    const clamped = Math.max(0.4, Math.min(scale, 2.5));
    target.style.transform = `scale(${clamped}) rotate(${rotation}deg)`;
    scaleEl.textContent = scale.toFixed(2);
    rotEl.textContent = `${rotation.toFixed(0)}°`;
  });
}
```

- [ ] **Step 4: 確認通過**

Run: `npm test -- pinch`
Expected: 2 passed。

- [ ] **Step 5: Commit**

```bash
git add src/panels/pinch.ts tests/pinch.test.ts
git commit -m "feat: 捏合手勢面板（含 Safari 降級卡）"
```

---

### Task 12: main.ts + styles.css 組裝（含匯出與語言切換）

**Files:**
- Create: `src/main.ts`, `src/styles.css`
- Test: `tests/main-layout.test.ts`（掛載煙霧測試）

**Interfaces:**
- Consumes: 前面所有模組。
- Produces: 完整可 build 的站。

- [ ] **Step 1: 寫失敗測試**

`tests/main-layout.test.ts`（測 main 抽出的組裝函式）：

main.ts 直接執行副作用不好測，把組裝抽成 `renderApp`，`main.ts` 只呼叫它。先建 `src/app.ts` 放 `renderApp`，main.ts import 它——測試針對 `app.ts`：

```ts
import { renderApp } from '../src/app';
import { Session } from '../src/core/session';

afterEach(() => { document.body.innerHTML = ''; });

describe('renderApp', () => {
  it('掛載六個 section 與語言切換鈕；不支援的面板顯示降級卡', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const session = new Session();
    renderApp(root, session, { forceTouch: false, gesture: false, touchDevice: false });
    expect(root.querySelectorAll('section')).toHaveLength(6);
    expect(root.querySelector('#lang-toggle')).not.toBeNull();
    expect(root.querySelectorAll('.notice-card')).toHaveLength(2);
    expect(session.skipped.sort()).toEqual(['force', 'pinch']);
  });

  it('觸控裝置顯示 banner', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    renderApp(root, new Session(), { forceTouch: false, gesture: false, touchDevice: true });
    expect(root.querySelector('.banner')).not.toBeNull();
  });

  it('語言切換鈕換字', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    renderApp(root, new Session(), { forceTouch: true, gesture: true, touchDevice: false });
    const before = root.querySelector('h1')!.textContent;
    (root.querySelector('#lang-toggle') as HTMLButtonElement).click();
    expect(root.querySelector('h1')!.textContent).not.toBe(before);
  });
});
```

- [ ] **Step 2: 確認失敗**

Run: `npm test -- main-layout`
Expected: FAIL。

- [ ] **Step 3: 實作 app.ts 與 main.ts**

`src/app.ts`：

```ts
import { applyI18n, getLocale, setLocale, t } from './i18n';
import type { Capabilities } from './support';
import { Session, buildExport } from './core/session';
import { mountTrail } from './panels/trail';
import { mountGrid } from './panels/grid';
import { mountForce } from './panels/force';
import { mountScroll } from './panels/scroll';
import { mountPinch } from './panels/pinch';

export function renderApp(root: HTMLElement, session: Session, caps: Capabilities): void {
  root.innerHTML = `
    <header>
      <div>
        <h1 data-i18n="pageTitle">${t('pageTitle')}</h1>
        <p class="sub" data-i18n="pageSubtitle">${t('pageSubtitle')}</p>
      </div>
      <button id="lang-toggle" class="lang-btn" data-i18n="langToggle">${t('langToggle')}</button>
    </header>
    ${caps.touchDevice ? `<div class="banner" data-i18n="touchBanner">${t('touchBanner')}</div>` : ''}
    <section id="panel-trail"></section>
    <section id="panel-grid"></section>
    <section id="panel-force"></section>
    <section id="panel-scroll"></section>
    <section id="panel-pinch"></section>
    <section id="panel-export">
      <h2 data-i18n="exportTitle">${t('exportTitle')}</h2>
      <p class="hint" data-i18n="exportHint">${t('exportHint')}</p>
      <button id="export-btn" data-i18n="exportBtn">${t('exportBtn')}</button>
      <span id="export-status" class="hint"></span>
    </section>`;

  mountTrail(root.querySelector('#panel-trail') as HTMLElement, session);
  mountGrid(root.querySelector('#panel-grid') as HTMLElement, session);
  mountForce(root.querySelector('#panel-force') as HTMLElement, session, caps);
  mountScroll(root.querySelector('#panel-scroll') as HTMLElement, session);
  mountPinch(root.querySelector('#panel-pinch') as HTMLElement, session, caps);

  (root.querySelector('#lang-toggle') as HTMLButtonElement).addEventListener('click', () => {
    setLocale(getLocale() === 'zh-TW' ? 'en' : 'zh-TW');
    applyI18n(document);
    document.title = t('pageTitle');
  });

  (root.querySelector('#export-btn') as HTMLButtonElement).addEventListener('click', () => {
    void exportResults(root, session);
  });
}

async function exportResults(root: HTMLElement, session: Session): Promise<void> {
  const data = buildExport(session, {
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    language: getLocale()
  });
  const text = JSON.stringify(data, null, 2);
  const status = root.querySelector('#export-status') as HTMLElement;
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = t('exportCopied');
  } catch {
    status.textContent = t('exportCopyFailed');
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = 'mac-trackpad-test-results.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
```

`src/main.ts`：

```ts
import './styles.css';
import { initLocale, t } from './i18n';
import { detectCapabilities } from './support';
import { Session } from './core/session';
import { renderApp } from './app';

initLocale();
document.title = t('pageTitle');
renderApp(
  document.querySelector('#app') as HTMLElement,
  new Session(),
  detectCapabilities()
);
```

`src/styles.css`（完整——沿用既有工具的視覺，加上 header/banner/notice-card/lang-btn）：

```css
:root { color-scheme: dark; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, "PingFang TC", sans-serif;
  background: #1c1c1e; color: #f2f2f7;
  padding: 24px; max-width: 900px; margin: 0 auto;
}
header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
h1 { font-size: 22px; margin-bottom: 4px; }
.sub { color: #98989f; font-size: 13px; }
.lang-btn {
  background: #48484a; color: #f2f2f7; border: none; border-radius: 6px;
  padding: 6px 14px; font-size: 13px; cursor: pointer; flex-shrink: 0;
}
.banner {
  background: #3a2f00; color: #ffd60a; border-radius: 10px;
  padding: 12px 16px; font-size: 13px; margin-bottom: 16px;
}
section { background: #2c2c2e; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
h2 { font-size: 15px; margin-bottom: 4px; }
.hint { color: #98989f; font-size: 12px; margin-bottom: 10px; }
.notice-card {
  background: #1c1c1e; border-radius: 8px; padding: 14px;
  font-size: 13px; color: #98989f; margin-top: 8px;
  display: flex; flex-direction: column; gap: 4px;
}
.notice-card b { color: #ffd60a; }
.trail-canvas { background: #1c1c1e; border-radius: 8px; display: block; width: 100%; touch-action: none; }
button {
  background: #48484a; color: #f2f2f7; border: none; border-radius: 6px;
  padding: 4px 12px; font-size: 12px; cursor: pointer; margin-top: 8px;
}
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; height: 220px; }
.cell {
  background: #1c1c1e; border-radius: 8px; display: flex;
  align-items: center; justify-content: center;
  font-size: 12px; color: #98989f; user-select: none; -webkit-user-select: none;
}
.cell.leftdone { background: #1f4d2e; color: #7ee2a0; }
.cell.bothdone { background: #1e3a5f; color: #8ec9ff; }
.stats { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 10px; font-size: 13px; }
.stats b { font-variant-numeric: tabular-nums; }
.ok { color: #30d158; }
.forcebar-wrap { background: #1c1c1e; border-radius: 8px; height: 26px; overflow: hidden; position: relative; }
.forcebar {
  background: linear-gradient(90deg, #30d158, #ffd60a, #ff453a);
  height: 100%; width: 100%; transform: scaleX(0); transform-origin: left;
}
.force-thresh { position: absolute; top: 0; bottom: 0; left: 33%; width: 2px; background: #f2f2f7aa; }
.scrollbox {
  height: 140px; overflow: scroll; background: #1c1c1e; border-radius: 8px;
  padding: 10px; font-size: 12px; color: #98989f; line-height: 2.2;
}
.pinchbox { height: 120px; background: #1c1c1e; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.pinchtarget {
  width: 60px; height: 60px; background: #0a84ff; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 11px;
}
```

- [ ] **Step 4: 確認通過 + build**

Run: `npm test && npm run build`
Expected: 全部測試通過；`dist/` 產出成功。

- [ ] **Step 5: 手動驗證 dev server**

Run: `npm run dev`（背景）然後用 safari-browser 開 `http://localhost:5173`，確認五面板顯示、語言切換換字、Safari 下面板 3/5 是完整功能非降級卡。
Expected: 視覺與 `~/Desktop/trackpad-test.html` 等價 + header/語言鈕。

- [ ] **Step 6: Commit**

```bash
git add src/app.ts src/main.ts src/styles.css tests/main-layout.test.ts
git commit -m "feat: 組裝主頁（語言切換、匯出、觸控裝置 banner）"
```

---

### Task 13: README（中英雙語）

**Files:**
- Create: `README.md`

**Interfaces:** 無程式碼依賴。內容必含：一句話簡介（中英）、線上網址、五關說明摘要、判讀基準表（事件頻率 90–120Hz、異常跳點 0、九宮格 9/9、壓力 >1.0 且觸發 force click、進水腐蝕延遲出現建議數週後複測）、Safari 需求說明、本地開發指令（`npm i && npm run dev`）、演算法一段（v2 速度突變判定與沿革）。

- [ ] **Step 1: 寫 README**（依上述大綱撰寫，中文在前、英文在後，兩語內容對等）

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: 中英雙語 README（使用說明與判讀基準）"
```

---

### Task 14: 覆蓋率驗證

**Files:** 無新檔。

- [ ] **Step 1: 跑覆蓋率**

Run: `npm run coverage`
Expected: 全部通過且 lines ≥ 80%（thresholds 未達會直接 fail）。低於門檻時優先補 core 與 panels 的缺口測試，不可調低門檻。

- [ ] **Step 2: Commit（若有補測試）**

```bash
git add tests && git commit -m "test: 補足覆蓋率缺口"
```

---

### Task 15: GitHub repo 建立與推送

**Files:** 無新檔。

- [ ] **Step 1: 建立 PsychQuant/mac-trackpad-test 並推送**

Run:
```bash
cd /Users/che/Developer/mac-trackpad-test
gh repo create PsychQuant/mac-trackpad-test --public \
  --description "Mac trackpad health check — dead zones, clicks, Force Touch, scroll, gestures. 觸控板五關檢測" \
  --source . --push
```
Expected: repo 建立、main 推上。

- [ ] **Step 2: 驗證**

Run: `gh repo view PsychQuant/mac-trackpad-test --json url,visibility`
Expected: `"visibility": "PUBLIC"` 與正確 URL。

---

### Task 16: Vercel 部署與線上驗證

**Files:**
- Create: `.vercel/`（CLI 自動產生，已在 .gitignore）

- [ ] **Step 1: 建立 Vercel 專案並連結 git**

Run:
```bash
cd /Users/che/Developer/mac-trackpad-test
vercel link --yes --project mac-trackpad-test
vercel git connect
```
Expected: 專案建立、GitHub repo 綁定（之後 push main 自動部署）。

- [ ] **Step 2: 首次正式部署**

Run: `vercel --prod`
Expected: 部署成功，輸出 production URL（`https://mac-trackpad-test.vercel.app` 或帶 scope 的等價網址）。

- [ ] **Step 3: 線上驗證**

用 safari-browser 開 production URL：五面板顯示、語言切換運作、匯出按鈕複製成功。用 Chrome（agent-browser）開同 URL：面板 3/5 顯示需 Safari 降級卡、其餘面板可用。
Expected: 兩種瀏覽器行為符合 spec 降級表。

- [ ] **Step 4: 收尾 commit（若 vercel 產生了需追蹤的設定變更）**

```bash
git add -A && git status   # 確認只有預期變更再 commit
git commit -m "chore: Vercel 部署設定" || echo "無需 commit"
git push
```

---

## Self-Review 紀錄

- **Spec coverage**：目標／五面板／降級表（Task 9、11、12）／i18n（Task 6）／匯出 schema 相容＋skipped（Task 4）／判讀基準（Task 13 README）／測試策略（各 task TDD＋Task 14 門檻）／部署（Task 15–16）——全數對應。手動驗收（真硬體事件）在 Task 12 Step 5 與 Task 16 Step 3。
- **Placeholder scan**：無 TBD/TODO；所有程式碼步驟附完整程式碼。
- **Type consistency**：`detectStep` 簽名（Task 2 定義、Task 7 使用）、`Session` 欄位（Task 4 定義、Task 7–12 使用）、`Capabilities`（Task 5 定義、9/11/12 使用）、`t`/`applyI18n`（Task 6 定義、7–12 使用）已逐一核對一致。
