// citymap ルート(SPEC §A1)。スコアバー + 地図/リストタブ + レベル選択シート + 称号判定。
import { useCallback, useEffect, useRef, useState } from "react";
import { checkNewAchievements, formatRatio } from "@fillmap/core/generic";
import { useCityStore } from "../domain/store";
import type { CityMeta } from "../domain/types";
import { nationalRatio, totalScore, visitedCount } from "../domain/score";
import { buildCityStats, cityAchievements } from "../domain/achievementDefs";
import { MapView, type CaptureMapCallback } from "./MapView";
import { CitySheet } from "./CitySheet";
import { AchievementSheet } from "./AchievementSheet";
import { ListTab } from "./ListTab";

/** 数値をアニメーション付きで変化させる hook */
function useAnimatedNumber(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      setDisplay(Math.round(start + (target - start) * t));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return display;
}

type Tab = "map" | "list";

export function App() {
  const data = useCityStore((s) => s.data);
  const setLevel = useCityStore((s) => s.setLevel);
  const getLevel = useCityStore((s) => s.getLevel);
  const unlockAchievement = useCityStore((s) => s.unlockAchievement);

  const [meta, setMeta] = useState<CityMeta | null>(null);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [tab, setTab] = useState<Tab>("map");
  const [flash, setFlash] = useState(false);

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
      // リストタブからの選択時は feature-state を更新しない(地図が描画されていないため)
      if (tab === "map") setFeatureLevelRef.current?.(selected.id, level);
      setSelected(null);

      setFlash(true);
      setTimeout(() => setFlash(false), 500);

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
    [selected, setLevel, tab, meta, data.unlockedAchievements, unlockAchievement]
  );

  const visited = visitedCount(data.visits);
  const total = meta?.totals.cityCount ?? 0;
  const ratio = meta ? nationalRatio(meta, data.visits) : 0;
  const score = totalScore(data.visits);

  const animVisited = useAnimatedNumber(visited);
  const animScore = useAnimatedNumber(score);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 地図(常に保持、リストタブ時は hidden で WebGL コンテキストを維持) */}
      <div className={tab === "map" ? "absolute inset-0" : "absolute inset-0 invisible"}>
        <MapView onSelect={(id, name) => setSelected({ id, name })} getLevel={getLevel} onReady={handleReady} />
      </div>

      {/* 上部スコアバー */}
      <div
        className={`absolute inset-x-0 top-0 z-10 m-3 rounded-2xl bg-[#11151c]/90 px-4 py-3 backdrop-blur transition-all duration-200 ${
          flash ? "ring-2 ring-cyan-300/60 shadow-[0_0_16px_2px_rgba(103,232,249,0.3)]" : ""
        }`}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-base">
            全国 <b className="text-cyan-300">{animVisited}</b>
            <span className="text-[#8b93a3]"> / {total || "—"}</span>
            <span className="ml-2 text-sm text-[#8b93a3]">({formatRatio(ratio)})</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8b93a3]">
              行動力スコア <b className="text-cyan-300">{animScore}</b>
            </span>
            <button
              onClick={() => setShowAchievements(true)}
              className="text-lg leading-none opacity-70 hover:opacity-100 transition-opacity"
              aria-label="称号一覧"
            >
              🏆
            </button>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#222834]">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>

        {/* タブバー */}
        <div className="mt-3 flex gap-1">
          {(["map", "list"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-cyan-400/20 text-cyan-300"
                  : "text-[#8b93a3] hover:text-white"
              }`}
            >
              {t === "map" ? "🗺 地図" : "📋 リスト"}
            </button>
          ))}
        </div>
      </div>

      {/* リストタブ */}
      {tab === "list" && meta && (
        <ListTab
          meta={meta}
          getLevel={getLevel}
          onSelect={(id, name) => setSelected({ id, name })}
        />
      )}

      {/* 称号トースト */}
      {toast && (
        <div className="absolute left-1/2 top-28 z-30 -translate-x-1/2 rounded-full bg-amber-400 px-5 py-2 font-bold text-[#0b0e14] shadow-lg animate-bounce">
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

      {/* 称号一覧シート */}
      {showAchievements && (
        <AchievementSheet
          unlocked={data.unlockedAchievements}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </div>
  );
}
