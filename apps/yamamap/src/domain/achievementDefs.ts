// yamamap 称号定義(SPEC §A2)。汎用 AchievementDef<MountainStats> を使う。
import type { AchievementDef } from "@fillmap/core/generic";
import type { Climb, MountainMeta } from "./types";
import { high3000Count, nationalRatio, prefCompletion, totalAltitude, visitedCount } from "./score";

/** 称号判定に使う統計値セット。 */
export type MountainStats = {
  climbCount: number;
  totalAltitude: number;
  nationalRatio: number;
  high3000Count: number;
  maxPrefCompletion: number; // いずれかの県の最高達成率
};

export function buildMountainStats(meta: MountainMeta, visits: Record<string, Climb>): MountainStats {
  const prefs = prefCompletion(meta, visits);
  const maxPref = Object.values(prefs).reduce((m, v) => Math.max(m, v), 0);
  return {
    climbCount: visitedCount(visits),
    totalAltitude: totalAltitude(meta, visits),
    nationalRatio: nationalRatio(meta, visits),
    high3000Count: high3000Count(meta, visits),
    maxPrefCompletion: maxPref,
  };
}

export const mountainAchievements: AchievementDef<MountainStats>[] = [
  { id: "first", name: "初登頂", condition: "1座を登頂", check: (s) => s.climbCount >= 1 },
  { id: "peak3000", name: "3000m峰デビュー", condition: "3000m峰に1座登頂", check: (s) => s.high3000Count >= 1 },
  { id: "everest", name: "累計エベレスト超え", condition: "累計標高8,848m", check: (s) => s.totalAltitude >= 8848 },
  { id: "high10", name: "高峰ハンター", condition: "3000m峰10座", check: (s) => s.high3000Count >= 10 },
  { id: "half", name: "半分の頂", condition: "50座登頂", check: (s) => s.climbCount >= 50 },
  { id: "complete", name: "百名山コンプリート", condition: "100座すべて登頂", check: (s) => s.climbCount >= 100 },
];
