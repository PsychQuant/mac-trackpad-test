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
