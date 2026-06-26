// 入湯スコア・達成率の計算(SPEC §A6 W2)。onsenmap 固有(温泉地数)。
import type { Bath, OnsenMeta } from "./types";

/** 入湯済(visits に存在)の湯数。 */
export function visitedCount(visits: Record<string, Bath>): number {
  return Object.keys(visits).length;
}

/** 全国達成率(0〜1)= 入湯数 / 総湯数。 */
export function nationalRatio(meta: OnsenMeta, visits: Record<string, Bath>): number {
  const total = meta.totals.pointCount;
  if (total <= 0) return 0;
  return visitedCount(visits) / total;
}

/** 残り湯数(百湯制覇まで)。 */
export function remaining(meta: OnsenMeta, visits: Record<string, Bath>): number {
  return Math.max(0, meta.totals.pointCount - visitedCount(visits));
}

/** 都道府県別達成率(0〜1)。 */
export function prefCompletion(meta: OnsenMeta, visits: Record<string, Bath>): Record<string, number> {
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
