# mac-trackpad-test 設計文件

- 日期：2026-07-13
- 狀態：已核可（brainstorming 完成，等待實作計畫）
- 前身：`~/Desktop/trackpad-test.html`（單檔工具，經兩輪實測迭代出 v2 偵測演算法）

## 目標

把既有的單檔觸控板檢測工具產品化為公開網站，讓任何 Mac 使用者能檢測觸控板健康狀態。典型情境：買賣二手 MacBook 驗機、進水後確認觸控板功能、日常「游標怪怪的」疑難排解。

## 決策紀錄

| 決策 | 選擇 | 理由 |
|------|------|------|
| 名稱 | `mac-trackpad-test` | 使用者指定名稱須含 mac；此形式搜尋命中率最高 |
| Repo | `PsychQuant/mac-trackpad-test`（public） | 公開產品型專案掛 org 的既有慣例（idol-site、jackson-kids-website） |
| 部署 | Vercel git 連動自動部署 | 同 music-note 慣例；push main 即上線 |
| 技術 | Vite + TypeScript + Vitest | 偵測演算法抽成可單元測試的純函式；建置輸出仍為純靜態站 |
| 語言 | 中英雙語切換 | 公開受眾；依瀏覽器語言自動預設，右上角手動切換，localStorage 記憶 |

## 架構

```
mac-trackpad-test/
  index.html               — 頁面骨架
  src/
    main.ts                — 組裝五面板 + 語言切換 + 匯出按鈕
    core/                  — 純函式層（無 DOM 依賴，可單元測試）
      jump-detector.ts     —   速度突變判定
      stats.ts             —   deltaY 統計
      session.ts           —   測試結果收集與匯出 JSON 組裝
    panels/                — DOM 薄層，每面板一模組
      trail.ts             —   1. 軌跡（死區／跳動，紅色標記異常段）
      grid.ts              —   2. 九宮格點按（左鍵／右鍵／雙擊）
      force.ts             —   3. Force Touch 壓力（Safari 限定）
      scroll.ts            —   4. 雙指捲動平滑度
      pinch.ts             —   5. 捏合縮放旋轉（Safari 限定）
    i18n/
      strings.ts           — zh-TW / en 字典
      index.ts             — 語言偵測、切換、localStorage 持久化
    support.ts             — 瀏覽器能力偵測
    styles.css
  tests/                   — Vitest（jsdom 環境）
  README.md                — 中英雙語，含使用說明與判讀基準
  docs/superpowers/specs/  — 本文件
```

## 模組規格

### core/jump-detector.ts

純函式。簽名概念：

```ts
detectStep(prev: Point | null, curr: Point, dtMs: number, prevStepPx: number)
  → { isJump: boolean, distPx: number, nextPrevStepPx: number }
```

演算法（v2，速度突變判定）：`isJump = dt < 40ms && dist > 50px && dist > 3 × max(prevStep, 5)`。
`dt ≥ 40ms` 視為新筆畫，`nextPrevStep` 歸零。

演算法沿革（重要背景，調參時必讀）：v1 用絕對門檻（>50px）會把快速滑動的每一幀都誤標成異常（實測 19 個「跳點」全是等距直線排列的快滑簽名）；v2 改成相對門檻——快滑是漸進加速、相鄰步幅同量級（比值 ≈ 1）不觸發，感應瞬移（小步中突然爆大步）才觸發。

### core/stats.ts

```ts
deltaStats(deltas: number[]) → { n, max, mean, sd } | null   // 空陣列回 null
```

### core/session.ts

收集五面板的結果、組裝匯出 JSON。schema 向下相容既有結果檔（v1/v2 欄位不變），新增：

- `browser`（UA 摘要）
- `language`（介面語言）
- `skipped`（因瀏覽器不支援而跳過的面板清單）

匯出行為：複製到剪貼簿 + 下載 JSON 備份（雙保險，剪貼簿失敗時仍有下載）。

### panels/*

每面板 `export function mount(el: HTMLElement, ctx: SessionCtx): void`。DOM 事件的薄層，判定與統計一律委派 core。單檔 200 行以內。

### support.ts

```ts
capabilities() → { forceTouch: boolean, gesture: boolean, isTouchDevice: boolean }
```

以 `'GestureEvent' in window`、事件屬性存在性檢查判定，不用 UA 字串猜。

### i18n

`strings.ts` 存 zh-TW 與 en 兩份字典（同 key 結構，TypeScript 型別保證兩邊 key 一致）。`navigator.language` 以 `zh` 開頭 → zh-TW，否則 en。右上角切換鈕，選擇存 localStorage。

## 視覺設計

沿用現有工具的深色系設計（iOS 系統色板：#1c1c1e 底、#0a84ff 藍、#30d158 綠、#ff453a 紅），系統字體（`-apple-system` / PingFang TC），不引入外部字體。淺色模式非本版目標（`color-scheme` 宣告保留未來擴充空間）。

## 降級行為

| 環境 | 行為 |
|------|------|
| Safari on Mac | 五關全開（完整體驗） |
| Chrome / Firefox / Edge on Mac | 面板 1、2、4 照常可測；面板 3、5 顯示「此項需 Safari」說明卡（含原因：webkitForce 與 gesture 事件為 Safari 專屬）；匯出 JSON 標注 skipped |
| 觸控裝置（iPhone/iPad/Android） | 頂部橫幅：本工具供 Mac 觸控板檢測，請在 Mac 上開啟 |

原則：任何環境進來都不會看到「壞掉的空面板」，一律有明確說明。

## 判讀基準（寫進 README 與頁面說明）

- 事件頻率：健康值約 90–120 Hz（120 為硬體上限）
- 異常跳點：0 個為正常；紅色段代表游標從平順移動中瞬移
- 九宮格：左右鍵各 9/9（含四角）
- 壓力：最大值應能超過 1.0 並觸發用力點按（量程上限約 3.0）
- 進水腐蝕型故障常延遲出現，建議數週後複測

## 測試策略

- Vitest + jsdom。
- core 純函式 100% 覆蓋：jump-detector 的門檻邊界（49/50/51px、2.9×/3×/3.1×、dt 39/40ms、新筆畫歸零）、stats 的空陣列與單樣本、session 的 skipped 組裝。
- panels 用 jsdom 派發合成事件：掛載、計數、降級卡顯示。
- 整體覆蓋率目標 80%+。
- 真實觸控板硬體事件（webkitForce、gesture）無法自動化模擬——上線後以手動驗收清單在 Safari 與 Chrome 各過一遍五關。

## 部署

1. GitHub 建 `PsychQuant/mac-trackpad-test`（public）
2. Vercel import，framework preset = Vite，push main 自動部署
3. 上線網址：`mac-trackpad-test.vercel.app`

## 非目標（YAGNI）

- 無後端、無資料收集、無 analytics
- 無多頁內容（FAQ、blog）——判讀說明直接放頁面與 README
- 不做 Magic Trackpad／外接裝置的專屬判定（通用指標對其仍適用，但不特別宣稱支援）
- 不做鍵盤或其他硬體檢測
