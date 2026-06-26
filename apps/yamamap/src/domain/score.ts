// 登頂スコア・達成率の計算(SPEC §A2 W2)。yamamap 固有(累計標高ベース)。
import type { Climb, MountainMeta } from "./types";

const EVEREST_M = 8848;

/** 登頂済(visits に存在)の座数。 */
export function visitedCount(visits: Record<string, Climb>): number {
  return Object.keys(visits).length;
}

/** 累計標高(m)= 登頂済の山の標高合計。 */
export function totalAltitude(meta: MountainMeta, visits: Record<string, Climb>): number {
  let sum = 0;
  for (const id of Object.keys(visits)) sum += meta.points[id]?.altitude ?? 0;
  return sum;
}

/** 全国達成率(0〜1)= 登頂数 / 総座数。 */
export function nationalRatio(meta: MountainMeta, visits: Record<string, Climb>): number {
  const total = meta.totals.pointCount;
  if (total <= 0) return 0;
  return visitedCount(visits) / total;
}

/** 3000m峰の登頂数。 */
export function high3000Count(meta: MountainMeta, visits: Record<string, Climb>): number {
  let n = 0;
  for (const id of Object.keys(visits)) {
    if ((meta.points[id]?.altitude ?? 0) >= 3000) n++;
  }
  return n;
}

/** 都道府県別達成率(0〜1)。 */
export function prefCompletion(meta: MountainMeta, visits: Record<string, Climb>): Record<string, number> {
  const visitedByPref: Record<string, number> = {};
  for (const id of Object.keys(visits)) {
    const p = meta.points[id];
    if (p) visitedByPref[p.pref] = (visitedByPref[p.pref] ?? 0) + 1;
  }
  const out: Record<string, number> = {};
  for (const [pref, total] of Object.entries(meta.totals.byPref)) {
    out[pref] = total > 0 ? (visitedByPref[pref] ?? 0) / total : 0;
  }
  return out;
}

/** 累計標高の換算文言(エベレスト◯回分)。SPEC §A2 W2。 */
export function altitudeConversion(meterSum: number): string {
  if (meterSum <= 0) return "";
  const everest = meterSum / EVEREST_M;
  return `エベレスト ${everest.toFixed(1)} 回分`;
}
