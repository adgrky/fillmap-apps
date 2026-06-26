// onsenmap 称号定義(SPEC §A6)。汎用 AchievementDef<OnsenStats> を使う。
import type { AchievementDef } from "@fillmap/core/generic";
import type { Bath, OnsenMeta } from "./types";
import { nationalRatio, prefCompletion, visitedCount } from "./score";

/** 称号判定に使う統計値セット。 */
export type OnsenStats = {
  bathedCount: number;
  nationalRatio: number;
  maxPrefCompletion: number; // いずれかの県の最高達成率(温泉県制覇)
};

export function buildOnsenStats(meta: OnsenMeta, visits: Record<string, Bath>): OnsenStats {
  const prefs = prefCompletion(meta, visits);
  const maxPref = Object.values(prefs).reduce((m, v) => Math.max(m, v), 0);
  return {
    bathedCount: visitedCount(visits),
    nationalRatio: nationalRatio(meta, visits),
    maxPrefCompletion: maxPref,
  };
}

export const onsenAchievements: AchievementDef<OnsenStats>[] = [
  { id: "first", name: "初湯", condition: "1湯に入る", check: (s) => s.bathedCount >= 1 },
  { id: "pref", name: "温泉県制覇", condition: "いずれかの県の百名湯を100%", check: (s) => s.maxPrefCompletion >= 1 },
  { id: "fifty", name: "五十湯めぐり", condition: "50湯に入る", check: (s) => s.bathedCount >= 50 },
  { id: "hyakuyu", name: "百湯クラブ", condition: "百名湯すべてに入る", check: (s) => s.nationalRatio >= 1 },
];
