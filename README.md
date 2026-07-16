# Mac Trackpad Test — Mac 觸控板健康檢查

線上使用 / Live: **https://mac-trackpad-test.vercel.app**（請用 Safari 開啟 / open in Safari）

---

## 中文

五關互動測試，檢查 MacBook 觸控板的五種故障模式。典型情境：買賣二手機驗機、進水後確認功能、日常「游標怪怪的」疑難排解。

| 關卡 | 測什麼 | 怎麼判讀 |
|------|--------|----------|
| 1. 軌跡 | 死區與游標瞬移 | 線應連續平滑；斷線 = 死區；紅色段 = 速度突變異常 |
| 2. 九宮格 | 每個區域的左右鍵點按 | 左右鍵各 9/9（含四角）才算全過 |
| 3. Force Touch | 壓力感應層 | 壓力條平滑上升、越過白線觸發用力點按 |
| 4. 雙指捲動 | 平滑度與慣性 | 捲動跟手、慣性平滑減速 |
| 5. 捏合手勢 | 多指獨立追蹤 | 方塊即時跟隨縮放旋轉 |

做完按「複製測試結果」，JSON 會複製到剪貼簿（並下載備份），可貼給 AI 或維修人員判讀。

### 判讀基準

- 事件頻率：**內建觸控板**健康值約 90–120 Hz（120 為硬體上限）。**巧控板（Magic Trackpad）**目前尚無實測健康範圍：藍牙連線下事件頻率可能低於內建板，因此不應單獨以 90–120 Hz 判定異常——判讀時以匯出 JSON 的 `裝置類型` 欄位（頁面右上角自選）為準，並與同型號樣本比較
- 異常跳點：0 個為正常；紅色代表游標從平順移動中瞬移（快滑不會誤標）
- 九宮格：左右鍵各 9/9
- 壓力：最大值應能超過 1.0 並觸發用力點按（量程上限約 3.0）
- 進水腐蝕型故障常延遲出現，建議數週後複測

### 為什麼需要 Safari

第 3、5 關使用 Safari 專屬事件（`webkitmouseforcechanged`、`GestureEvent`），Chrome/Firefox 會顯示說明卡並跳過，其餘三關不受影響。

### 偵測演算法

異常跳點採「速度突變判定」：單步位移 > 50px **且** 超過前一步的 3 倍才標紅。快速滑動是漸進加速（相鄰步幅同量級），不會誤報；只有「小步中突然爆大步」的感應瞬移會被抓到。第一版用絕對門檻（>50px）時，快滑的每一幀都被誤標——實測 19 個「跳點」呈等距直線排列，全是快滑簽名；改為相對門檻後誤報歸零。

---

## English

Five interactive checks covering the five failure modes of a MacBook trackpad. Typical uses: inspecting a second-hand machine, verifying function after a liquid spill, or diagnosing a cursor that "feels off".

| Check | Target | Pass criteria |
|-------|--------|---------------|
| 1. Trail | Dead zones & cursor teleports | Continuous smooth line; gaps = dead zone; red = velocity anomaly |
| 2. 3×3 grid | Clicks in every zone | 9/9 left and right clicks, corners included |
| 3. Force Touch | Pressure sensing layer | Bar rises smoothly; crossing the line triggers a force click |
| 4. Two-finger scroll | Smoothness & inertia | Tracks fingers; decelerates smoothly |
| 5. Pinch gestures | Independent multi-finger tracking | Square follows zoom/rotate in real time |

When done, press "Copy results": a JSON report is copied to the clipboard (and downloaded) — paste it to an AI or a technician.

### Interpretation baseline

- Event rate: **built-in trackpad** ~90–120 Hz is healthy (120 is the hardware cap). **Magic Trackpad**: no empirically measured healthy range yet — over Bluetooth it may report below the built-in cap, so do not judge it by 90–120 Hz alone. Interpret against the exported `裝置類型` (device type) field (selectable at the top right) and compare against samples of the same model
- Anomalies: 0 is normal; red means the cursor teleported mid-motion (fast swipes are not flagged)
- Grid: 9/9 for both left and right clicks
- Pressure: max should exceed 1.0 and trigger a force click (range tops out near 3.0)
- Corrosion damage from liquid often develops late — retest after a few weeks

### Why Safari

Checks 3 and 5 rely on Safari-only events (`webkitmouseforcechanged`, `GestureEvent`). Chrome/Firefox show an explanatory card and skip them; the other three checks still work.

### Detection algorithm

Anomalies use a velocity-discontinuity rule: a step is flagged only if it exceeds 50px **and** 3× the previous step. Fast swipes accelerate gradually (neighbouring steps are similar), so they never trigger; only a genuine sensor teleport — a sudden large step amid small ones — is caught. The first version used an absolute threshold and flagged every frame of a fast swipe (19 false "anomalies" in an evenly-spaced line); the relative threshold eliminated the false positives.

---

## Development

```bash
npm i
npm run dev        # local dev server
npm test           # vitest (jsdom)
npm run coverage   # coverage with 80% line threshold
npm run build      # tsc + vite build → dist/
```

Stack: Vite + TypeScript (strict) + Vitest. Detection algorithms live in `src/core/` as pure functions; panels in `src/panels/` are thin DOM layers; `src/i18n/` holds the zh-TW/en dictionaries.
