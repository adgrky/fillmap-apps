// shiromap 称号定義(SPEC §A4)。汎用 AchievementDef<CastleStats> を使う。
import type { AchievementDef } from "@fillmap/core/generic";
import type { CastleMeta, Conquest } from "./types";
import { nationalRatio, tagCount, visitedCount } from "./score";

/** 称号判定に使う統計値セット。 */
export type CastleStats = {
  conqueredCount: number;
  nationalRatio: number;
  genzonCount: number; // 現存12天守の攻略数
  kokuhoCount: number; // 国宝の攻略数
};

export function buildCastleStats(meta: CastleMeta, visits: Record<string, Conquest>): CastleStats {
  return {
    conqueredCount: visitedCount(visits),
    nationalRatio: nationalRatio(meta, visits),
    genzonCount: tagCount(meta, visits, "現存12天守"),
    kokuhoCount: tagCount(meta, visits, "国宝"),
  };
}

export const castleAchievements: AchievementDef<CastleStats>[] = [
  { id: "first", name: "初陣", condition: "1城を攻略", check: (s) => s.conqueredCount >= 1 },
  { id: "genzon", name: "現存天守ハンター", condition: "現存12天守をすべて攻略", check: (s) => s.genzonCount >= 12 },
  { id: "kokuho", name: "国宝コンプ", condition: "国宝5城をすべて攻略", check: (s) => s.kokuhoCount >= 5 },
  { id: "half", name: "天下の半ば", condition: "50城を攻略", check: (s) => s.conqueredCount >= 50 },
  { id: "tenka", name: "天下統一", condition: "100名城をすべて攻略", check: (s) => s.nationalRatio >= 1 },
];
