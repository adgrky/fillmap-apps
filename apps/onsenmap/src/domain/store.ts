// onsenmap 入湯記録ストア(POINT モード)。汎用 createPersistence の上に zustand を載せる。
import { create } from "zustand";
import { createPersistence } from "@fillmap/core/generic";
import { THEME } from "./theme";
import type { Bath, OnsenSaveData } from "./types";

const STORAGE_KEY = "onsenmap.v1";
const VERSION = 1;

function createInitial(): OnsenSaveData {
  return {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    settings: { theme: THEME, sound: true },
    unlockedAchievements: {},
    visits: {},
  };
}

function normalize(raw: unknown): OnsenSaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<OnsenSaveData>;
  if (typeof o.visits !== "object" || o.visits === null) return null;
  const visits: Record<string, Bath> = {};
  for (const [id, v] of Object.entries(o.visits as Record<string, Bath>)) {
    if (!v || typeof v !== "object") continue;
    visits[id] = {
      count: typeof v.count === "number" && v.count >= 1 ? v.count : 1,
      firstDate: typeof v.firstDate === "string" ? v.firstDate : undefined,
      memo: typeof v.memo === "string" ? v.memo : undefined,
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

export const persistence = createPersistence<OnsenSaveData>({
  storageKey: STORAGE_KEY,
  version: VERSION,
  createInitial,
  normalize,
});

type OnsenStore = {
  data: OnsenSaveData;
  isVisited: (id: string) => boolean;
  /** 入湯を記録/取り消し。記録時は今日の日付を初期セット。 */
  toggleVisit: (id: string) => void;
  /** 入湯記録の詳細(日付/回数/メモ)を更新。 */
  updateVisit: (id: string, patch: Partial<Bath>) => void;
  unlockAchievement: (id: string) => void;
};

export const useOnsenStore = create<OnsenStore>((set, get) => ({
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
