// 行動力スコア・達成率の計算(SPEC §A1 W2)。citymap 固有(レベル合計ベース)。
import type { CityMeta, Visit } from "./types";

/** 行動力スコア = 全自治体のレベル合計。 */
export function totalScore(visits: Record<string, Visit>): number {
  let sum = 0;
  for (const v of Object.values(visits)) sum += v.level;
  return sum;
}

/** 訪問済(レベル1以上)の自治体数。 */
export function visitedCount(visits: Record<string, Visit>): number {
  return Object.keys(visits).length;
}

/** 全国達成率(0〜1)= 訪問済数 / 総自治体数。 */
export function nationalRatio(meta: CityMeta, visits: Record<string, Visit>): number {
  const total = meta.totals.cityCount;
  if (total <= 0) return 0;
  return visitedCount(visits) / total;
}

/** 都道府県別達成率(0〜1)。 */
export function prefCompletion(meta: CityMeta, visits: Record<string, Visit>): Record<string, number> {
  const visitedByPref: Record<string, number> = {};
  for (const id of Object.keys(visits)) {
    const c = meta.cities[id];
    if (c) visitedByPref[c.pref] = (visitedByPref[c.pref] ?? 0) + 1;
  }
  const out: Record<string, number> = {};
  for (const [pref, total] of Object.entries(meta.totals.byPref)) {
    out[pref] = total > 0 ? (visitedByPref[pref] ?? 0) / total : 0;
  }
  return out;
}
