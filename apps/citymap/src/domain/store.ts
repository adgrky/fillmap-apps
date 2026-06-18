// citymap 塗り状態ストア。汎用 createPersistence の上に zustand を載せる。
import { create } from "zustand";
import { createPersistence } from "@fillmap/core/generic";
import type { CitySaveData, Visit } from "./types";
import { MAX_LEVEL } from "./levels";

const STORAGE_KEY = "citymap.v1";
const VERSION = 1;

function createInitial(): CitySaveData {
  return {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    settings: { theme: "#22d3ee", sound: true },
    unlockedAchievements: {},
    visits: {},
  };
}

/** version 一致時の健全性チェック+正規化(壊れていれば null)。 */
function normalize(raw: unknown): CitySaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<CitySaveData>;
  if (typeof o.visits !== "object" || o.visits === null) return null;
  // level の範囲外を弾く
  const visits: Record<string, Visit> = {};
  for (const [id, v] of Object.entries(o.visits as Record<string, Visit>)) {
    if (v && typeof v.level === "number" && v.level >= 1 && v.level <= MAX_LEVEL) {
      visits[id] = { level: v.level, count: v.count ?? 1, firstDate: v.firstDate, memo: v.memo };
    }
  }
  const init = createInitial();
  return {
    version: VERSION,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : init.updatedAt,
    settings: {
      theme: typeof o.settings?.theme === "string" ? o.settings.theme : init.settings.theme,
      sound: typeof o.settings?.sound === "boolean" ? o.settings.sound : init.settings.sound,
    },
    unlockedAchievements:
      o.unlockedAchievements && typeof o.unlockedAchievements === "object"
        ? o.unlockedAchievements
        : {},
    visits,
  };
}

export const persistence = createPersistence<CitySaveData>({
  storageKey: STORAGE_KEY,
  version: VERSION,
  createInitial,
  normalize,
});

type CityStore = {
  data: CitySaveData;
  /** レベルを設定。0 は未踏=記録削除。 */
  setLevel: (cityId: string, level: number) => void;
  getLevel: (cityId: string) => number;
  unlockAchievement: (id: string) => void;
};

export const useCityStore = create<CityStore>((set, get) => ({
  data: persistence.load(),

  setLevel: (cityId, level) =>
    set((s) => {
      const visits = { ...s.data.visits };
      if (level <= 0) {
        delete visits[cityId];
      } else {
        const cur = visits[cityId];
        visits[cityId] = {
          level,
          count: cur?.count ?? 1,
          firstDate: cur?.firstDate ?? new Date().toISOString().slice(0, 10),
          memo: cur?.memo,
        };
      }
      const next = { ...s.data, visits };
      persistence.save(next);
      return { data: next };
    }),

  getLevel: (cityId) => get().data.visits[cityId]?.level ?? 0,

  unlockAchievement: (id) =>
    set((s) => {
      if (s.data.unlockedAchievements[id]) return s;
      const next = {
        ...s.data,
        unlockedAchievements: { ...s.data.unlockedAchievements, [id]: new Date().toISOString() },
      };
      persistence.save(next);
      return { data: next };
    }),
}));
