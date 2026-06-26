// 攻略スコア・達成率の計算(SPEC §A4 W2)。shiromap 固有(城数+タグ別)。
import type { CastleMeta, Conquest } from "./types";

/** 攻略済(visits に存在)の城数。 */
export function visitedCount(visits: Record<string, Conquest>): number {
  return Object.keys(visits).length;
}

/** 全国達成率(0〜1)= 攻略数 / 総城数。 */
export function nationalRatio(meta: CastleMeta, visits: Record<string, Conquest>): number {
  const total = meta.totals.pointCount;
  if (total <= 0) return 0;
  return visitedCount(visits) / total;
}

/** 指定タグを持つ攻略済の城数(現存12天守・国宝 等)。 */
export function tagCount(meta: CastleMeta, visits: Record<string, Conquest>, tag: string): number {
  let n = 0;
  for (const id of Object.keys(visits)) {
    if (meta.points[id]?.tags?.includes(tag)) n++;
  }
  return n;
}

/** 都道府県別達成率(0〜1)。 */
export function prefCompletion(meta: CastleMeta, visits: Record<string, Conquest>): Record<string, number> {
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

/** 残り城数(天下統一まで)。 */
export function remaining(meta: CastleMeta, visits: Record<string, Conquest>): number {
  return Math.max(0, meta.totals.pointCount - visitedCount(visits));
}
