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
