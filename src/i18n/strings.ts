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
