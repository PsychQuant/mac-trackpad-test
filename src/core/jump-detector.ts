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
