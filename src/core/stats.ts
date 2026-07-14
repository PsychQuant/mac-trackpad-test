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
