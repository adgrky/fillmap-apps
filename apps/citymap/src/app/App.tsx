// citymap ルート(SPEC §A1)。スコアバー + 地図 + レベル選択シート + 称号判定。
import { useCallback, useEffect, useRef, useState } from "react";
import { checkNewAchievements, formatRatio } from "@fillmap/core/generic";
import { useCityStore } from "../domain/store";
import type { CityMeta } from "../domain/types";
import { nationalRatio, totalScore, visitedCount } from "../domain/score";
import { buildCityStats, cityAchievements } from "../domain/achievementDefs";
import { MapView, type CaptureMapCallback } from "./MapView";
import { CitySheet } from "./CitySheet";

export function App() {
  const data = useCityStore((s) => s.data);
  const setLevel = useCityStore((s) => s.setLevel);
  const getLevel = useCityStore((s) => s.getLevel);
  const unlockAchievement = useCityStore((s) => s.unlockAchievement);

  const [meta, setMeta] = useState<CityMeta | null>(null);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const captureRef = useRef<CaptureMapCallback | null>(null);
  const setFeatureLevelRef = useRef<((id: string, level: number) => void) | null>(null);

  useEffect(() => {
    fetch("./data/meta.json")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta({ cities: {}, totals: { cityCount: 0, byPref: {} } }));
  }, []);

  const handleReady = useCallback(
    (capture: CaptureMapCallback, applyLevel: (id: string, level: number) => void) => {
      captureRef.current = capture;
      setFeatureLevelRef.current = applyLevel;
    },
    []
  );

  const handlePick = useCallback(
    (level: number) => {
      if (!selected) return;
      setLevel(selected.id, level);
      setFeatureLevelRef.current?.(selected.id, level);
      setSelected(null);

      // 称号判定(汎用 checkNewAchievements + citymap stats)
      if (meta) {
        const visits = useCityStore.getState().data.visits;
        const stats = buildCityStats(meta, visits);
        const newly = checkNewAchievements(cityAchievements, stats, data.unlockedAchievements);
        if (newly.length > 0) {
          for (const id of newly) unlockAchievement(id);
          const def = cityAchievements.find((a) => a.id === newly[0]);
          if (def) {
            setToast(`🏆 ${def.name}`);
            setTimeout(() => setToast(null), 2600);
          }
        }
      }
    },
    [selected, setLevel, meta, data.unlockedAchievements, unlockAchievement]
  );

  const visited = visitedCount(data.visits);
  const total = meta?.totals.cityCount ?? 0;
  const ratio = meta ? nationalRatio(meta, data.visits) : 0;
  const score = totalScore(data.visits);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView onSelect={(id, name) => setSelected({ id, name })} getLevel={getLevel} onReady={handleReady} />

      {/* 上部スコアバー */}
      <div className="absolute inset-x-0 top-0 z-10 m-3 rounded-2xl bg-[#11151c]/90 px-4 py-3 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <span className="text-base">
            全国 <b className="text-cyan-300">{visited}</b>
            <span className="text-[#8b93a3]"> / {total || "—"}</span>
            <span className="ml-2 text-sm text-[#8b93a3]">({formatRatio(ratio)})</span>
          </span>
          <span className="text-sm text-[#8b93a3]">
            行動力スコア <b className="text-cyan-300">{score}</b>
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#222834]">
          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
        </div>
      </div>

      {/* 称号トースト */}
      {toast && (
        <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-full bg-amber-400 px-5 py-2 font-bold text-[#0b0e14] shadow-lg">
          {toast}
        </div>
      )}

      {/* レベル選択シート */}
      {selected && (
        <CitySheet
          cityId={selected.id}
          cityName={selected.name}
          currentLevel={getLevel(selected.id)}
          onPick={handlePick}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
