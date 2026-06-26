// citymap ルート(SPEC §A1)。スコアバー + 地図/リストタブ + レベル選択シート + 称号判定。
import { useCallback, useEffect, useRef, useState } from "react";
import { checkNewAchievements, formatRatio, isPremium } from "@fillmap/core/generic";
import { useCityStore } from "../domain/store";
import type { CityMeta, DissolvedMunicipality } from "../domain/types";
import { nationalRatio, totalScore, visitedCount } from "../domain/score";
import { buildCityStats, cityAchievements } from "../domain/achievementDefs";
import { MapView, type CaptureMapCallback } from "./MapView";
import { CitySheet } from "./CitySheet";
import { DissolvedSheet } from "./DissolvedSheet";
import { AchievementSheet } from "./AchievementSheet";
import { ListTab } from "./ListTab";
import { YearTab } from "./YearTab";
import { SettingsTab } from "./SettingsTab";
import { AdBanner } from "./AdBanner";

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

/** maplibre canvas を背景に統計テキストを合成してシェア/ダウンロード(SPEC §E5)。 */
async function compositeShareImage(
  mapCanvas: HTMLCanvasElement,
  visited: number,
  total: number,
  ratio: number,
): Promise<void> {
  const W = mapCanvas.width;
  const H = mapCanvas.height;

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d")!;

  // 地図を転写
  ctx.drawImage(mapCanvas, 0, 0);

  // 下部グラデーションバー
  const barH = Math.round(H * 0.18);
  const grad = ctx.createLinearGradient(0, H - barH, 0, H);
  grad.addColorStop(0, "rgba(11,14,20,0)");
  grad.addColorStop(0.4, "rgba(11,14,20,0.82)");
  grad.addColorStop(1, "rgba(11,14,20,0.97)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - barH, W, barH);

  // テキスト描画
  const pct = formatRatio(ratio);
  const line1 = `全国市区町村 ${pct}`;
  const line2 = total > 0 ? `${visited} / ${total} 市区町村` : `${visited} 市区町村`;

  const fs1 = Math.round(W * 0.072);
  const fs2 = Math.round(W * 0.044);
  const baseY = H - Math.round(barH * 0.18);

  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 8;

  ctx.font = `bold ${fs1}px system-ui, sans-serif`;
  ctx.fillStyle = "#67e8f9"; // cyan-300
  ctx.fillText(line1, W / 2, baseY - fs2 - 6);

  ctx.font = `${fs2}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(line2, W / 2, baseY);

  ctx.shadowBlur = 0;

  // 右下クレジット
  const fsCredit = Math.round(W * 0.026);
  ctx.font = `${fsCredit}px system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("市区町村塗りつぶしマップ", W - Math.round(W * 0.025), H - Math.round(H * 0.02));

  const blob = await new Promise<Blob>((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  );

  const file = new File([blob], "citymap.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `全国市区町村 ${pct}` });
  } else {
    // フォールバック: ダウンロード
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "citymap.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

type Tab = "map" | "list" | "year" | "settings";

export function App() {
  const data = useCityStore((s) => s.data);
  const setLevel = useCityStore((s) => s.setLevel);
  const getLevel = useCityStore((s) => s.getLevel);
  const unlockAchievement = useCityStore((s) => s.unlockAchievement);

  const [meta, setMeta] = useState<CityMeta | null>(null);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [selectedDissolved, setSelectedDissolved] = useState<DissolvedMunicipality | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [tab, setTab] = useState<Tab>("map");
  const [premium, setPremiumState] = useState(() => isPremium("citymap.v1"));
  const [flash, setFlash] = useState(false);
  const [sharing, setSharing] = useState(false);

  const captureRef = useRef<CaptureMapCallback | null>(null);
  const setFeatureLevelRef = useRef<((id: string, level: number) => void) | null>(null);

  useEffect(() => {
    fetch("./data/meta.json")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta({ cities: {}, totals: { cityCount: 0, byPref: {} } }));
  }, []);

  // native の購入/復元が検証されたら premium を反映(main.tsx が発火、railmap同様)
  useEffect(() => {
    const onUnlocked = () => setPremiumState(true);
    window.addEventListener("citymap:premium-unlocked", onUnlocked);
    return () => window.removeEventListener("citymap:premium-unlocked", onUnlocked);
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

  const handleShare = useCallback(async () => {
    const canvas = captureRef.current?.();
    if (!canvas || sharing) return;
    // リストタブ表示中は地図タブに切り替えてから取得
    if (tab !== "map") return;
    setSharing(true);
    try {
      await compositeShareImage(canvas, visited, total, ratio);
    } catch (e) {
      // キャンセルは無視
      if (e instanceof Error && e.name !== "AbortError") console.error(e);
    } finally {
      setSharing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharing, tab]);

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
        <MapView
          onSelect={(id, name) => setSelected({ id, name })}
          getLevel={getLevel}
          onReady={handleReady}
          premium={premium}
          onSelectDissolved={setSelectedDissolved}
        />
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
              onClick={handleShare}
              disabled={sharing || tab !== "map"}
              className="text-lg leading-none opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
              aria-label="シェア画像を作成"
              title="地図をシェア"
            >
              {sharing ? "⏳" : "📤"}
            </button>
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
          {([
            ["map",      "🗺 地図"],
            ["list",     "📋 リスト"],
            ["year",     "📅 年表"],
            ["settings", "⚙️ 設定"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-cyan-400/20 text-cyan-300"
                  : "text-[#8b93a3] hover:text-white"
              }`}
            >
              {label}
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

      {/* 年表タブ */}
      {tab === "year" && meta && (
        <YearTab
          meta={meta}
          visits={data.visits}
          onSelect={(id, name) => setSelected({ id, name })}
        />
      )}

      {/* 設定タブ */}
      {tab === "settings" && (
        <SettingsTab premium={premium} onPremiumUnlocked={() => setPremiumState(true)} />
      )}

      {/* 広告バナー(premium 購入済みなら非表示) */}
      <AdBanner hidden={premium} />

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

      {/* 消滅自治体シート(プレミアム, §11) */}
      {selectedDissolved && (
        <DissolvedSheet item={selectedDissolved} onClose={() => setSelectedDissolved(null)} />
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
