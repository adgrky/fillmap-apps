// yamamap 登頂記録ストア(POINT モード)。汎用 createPersistence の上に zustand を載せる。
import { create } from "zustand";
import { createPersistence } from "@fillmap/core/generic";
import { THEME } from "./theme";
import type { Climb, MountainSaveData } from "./types";

const STORAGE_KEY = "yamamap.v1";
const VERSION = 1;

function createInitial(): MountainSaveData {
  return {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    settings: { theme: THEME, sound: true },
    unlockedAchievements: {},
    visits: {},
  };
}

/** version 一致時の健全性チェック+正規化(壊れていれば null)。 */
function normalize(raw: unknown): MountainSaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<MountainSaveData>;
  if (typeof o.visits !== "object" || o.visits === null) return null;
  const visits: Record<string, Climb> = {};
  for (const [id, v] of Object.entries(o.visits as Record<string, Climb>)) {
    if (!v || typeof v !== "object") continue;
    visits[id] = {
      count: typeof v.count === "number" && v.count >= 1 ? v.count : 1,
      firstDate: typeof v.firstDate === "string" ? v.firstDate : undefined,
      memo: typeof v.memo === "string" ? v.memo : undefined,
      routes: Array.isArray(v.routes) ? v.routes.filter((r) => typeof r === "string") : undefined,
    };
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
      o.unlockedAchievements && typeof o.unlockedAchievements === "object" ? o.unlockedAchievements : {},
    visits,
  };
}

export const persistence = createPersistence<MountainSaveData>({
  storageKey: STORAGE_KEY,
  version: VERSION,
  createInitial,
  normalize,
});

type MountainStore = {
  data: MountainSaveData;
  isVisited: (id: string) => boolean;
  /** 登頂を記録/取り消し。記録時は今日の日付を初期セット。 */
  toggleVisit: (id: string) => void;
  /** 登頂記録の詳細(日付/回数/メモ/ルート)を更新。 */
  updateVisit: (id: string, patch: Partial<Climb>) => void;
  unlockAchievement: (id: string) => void;
};

export const useMountainStore = create<MountainStore>((set, get) => ({
  data: persistence.load(),

  isVisited: (id) => Boolean(get().data.visits[id]),

  toggleVisit: (id) =>
    set((s) => {
      const visits = { ...s.data.visits };
      if (visits[id]) {
        delete visits[id];
      } else {
        visits[id] = { count: 1, firstDate: new Date().toISOString().slice(0, 10) };
      }
      const next = { ...s.data, visits };
      persistence.save(next);
      return { data: next };
    }),

  updateVisit: (id, patch) =>
    set((s) => {
      const cur = s.data.visits[id];
      if (!cur) return s;
      const visits = { ...s.data.visits, [id]: { ...cur, ...patch } };
      const next = { ...s.data, visits };
      persistence.save(next);
      return { data: next };
    }),

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
