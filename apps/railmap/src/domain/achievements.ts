// 称号判定エンジン(SPEC §9)。railmap 固有統計型 + buildStats。
// checkNewAchievements は @fillmap/core/generic の汎用版を使う。
import type { AchievementDef as GenericAchievementDef } from "@fillmap/core/generic";
import type { Meta, SaveData } from "./types";
import { nationalRatio, railTypeRatio, riddenKm } from "./progress";

export type AchievementStats = {
  rideCount: number;
  riddenKm: number;
  nationalRatio: number;
  shinkansenRatio: number;
  jrRatio: number;
  subwayRatio: number;
  privateCount: number;
  prefCompletion: Record<string, number>;
};

/** railmap 称号定義型のエイリアス。 */
export type AchievementDef = GenericAchievementDef<AchievementStats>;

export function buildStats(meta: Meta, rides: SaveData["rides"]): AchievementStats {
  const rideCount = Object.keys(rides).length;
  const km = riddenKm(meta, rides);

  let privateCount = 0;
  for (const lineId of Object.keys(rides)) {
    const m = meta.lines[lineId];
    if (m && (m.railType === "私鉄" || m.railType === "路面・その他")) privateCount++;
  }

  const prefRidden: Record<string, number> = {};
  const prefTotal: Record<string, number> = {};
  for (const [lineId, m] of Object.entries(meta.lines)) {
    for (const pref of m.pref) {
      prefTotal[pref] = (prefTotal[pref] ?? 0) + m.lengthKm;
      if (rides[lineId]) prefRidden[pref] = (prefRidden[pref] ?? 0) + m.lengthKm;
    }
  }
  const prefCompletion: Record<string, number> = {};
  for (const pref of Object.keys(prefTotal)) {
    prefCompletion[pref] = (prefRidden[pref] ?? 0) / prefTotal[pref];
  }

  return {
    rideCount,
    riddenKm: km,
    nationalRatio: nationalRatio(meta, rides),
    shinkansenRatio: railTypeRatio(meta, rides, "新幹線"),
    jrRatio: railTypeRatio(meta, rides, "JR在来線"),
    subwayRatio: railTypeRatio(meta, rides, "地下鉄"),
    privateCount,
    prefCompletion,
  };
}
