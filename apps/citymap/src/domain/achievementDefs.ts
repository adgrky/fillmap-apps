// citymap 称号定義(SPEC §A1)。汎用 AchievementDef<CityStats> を使う。
import type { AchievementDef } from "@fillmap/core/generic";
import type { CityMeta, Visit } from "./types";
import { nationalRatio, prefCompletion, totalScore, visitedCount } from "./score";

/** 称号判定に使う統計値セット。 */
export type CityStats = {
  visitedCount: number;
  totalScore: number;
  nationalRatio: number;
  islandCount: number;
  maxPrefCompletion: number; // いずれかの県の最高達成率(県内コンプ判定)
};

export function buildCityStats(meta: CityMeta, visits: Record<string, Visit>): CityStats {
  let islandCount = 0;
  for (const id of Object.keys(visits)) {
    if (meta.cities[id]?.isIsland) islandCount++;
  }
  const prefs = prefCompletion(meta, visits);
  const maxPref = Object.values(prefs).reduce((m, v) => Math.max(m, v), 0);
  return {
    visitedCount: visitedCount(visits),
    totalScore: totalScore(visits),
    nationalRatio: nationalRatio(meta, visits),
    islandCount,
    maxPrefCompletion: maxPref,
  };
}

export const cityAchievements: AchievementDef<CityStats>[] = [
  { id: "first", name: "初上陸", condition: "1自治体を記録", check: (s) => s.visitedCount >= 1 },
  { id: "pref_comp", name: "県内コンプ", condition: "いずれかの県を100%", check: (s) => s.maxPrefCompletion >= 1 },
  { id: "island10", name: "離島マスター", condition: "島嶼自治体10", check: (s) => s.islandCount >= 10 },
  { id: "club1", name: "全国1%クラブ", condition: "全国達成率1%", check: (s) => s.nationalRatio >= 0.01 },
  { id: "half", name: "半分来たぞ", condition: "全国達成率50%", check: (s) => s.nationalRatio >= 0.5 },
];
