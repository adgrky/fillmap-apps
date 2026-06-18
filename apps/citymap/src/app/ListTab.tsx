// リスト一括入力タブ(SPEC §A1 W4)。都道府県アコーディオンで地図を開かずに記録可能。
import { useState } from "react";
import type { CityMeta } from "../domain/types";
import { LEVELS } from "../domain/levels";

type Props = {
  meta: CityMeta;
  getLevel: (id: string) => number;
  onSelect: (id: string, name: string) => void;
};

// レベルに応じた色ドット
function LevelDot({ level }: { level: number }) {
  const color = LEVELS[level]?.color ?? LEVELS[0].color;
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full border border-white/10 flex-shrink-0"
      style={{ background: color }}
    />
  );
}

export function ListTab({ meta, getLevel, onSelect }: Props) {
  const [openPref, setOpenPref] = useState<string | null>(null);

  // 都道府県→自治体リスト を構築
  const prefMap: Record<string, { id: string; name: string }[]> = {};
  for (const [id, info] of Object.entries(meta.cities)) {
    if (!prefMap[info.pref]) prefMap[info.pref] = [];
    prefMap[info.pref].push({ id, name: info.name });
  }
  // 各都道府県内はコード順(= 行政コード昇順)でソート
  for (const list of Object.values(prefMap)) {
    list.sort((a, b) => a.id.localeCompare(b.id));
  }
  const prefs = Object.keys(prefMap).sort((a, b) => a.localeCompare(b));

  return (
    <div className="absolute inset-0 top-[88px] overflow-y-auto bg-[#0b0e14]">
      {prefs.map((pref) => {
        const cities = prefMap[pref];
        const isOpen = openPref === pref;
        const visitedInPref = cities.filter((c) => getLevel(c.id) > 0).length;
        const total = cities.length;

        return (
          <div key={pref} className="border-b border-[#1e2430]">
            {/* 都道府県ヘッダ */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#141925] transition-colors"
              onClick={() => setOpenPref(isOpen ? null : pref)}
            >
              <span className="font-medium text-sm">{pref}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#8b93a3]">
                  {visitedInPref}/{total}
                </span>
                {visitedInPref > 0 && (
                  <div className="w-12 h-1 rounded-full bg-[#222834] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{ width: `${(visitedInPref / total) * 100}%` }}
                    />
                  </div>
                )}
                <span className="text-[#8b93a3] text-xs">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* 自治体リスト(展開時) */}
            {isOpen && (
              <div className="bg-[#0e1219]">
                {cities.map((city) => {
                  const lv = getLevel(city.id);
                  return (
                    <button
                      key={city.id}
                      className="w-full flex items-center gap-3 px-6 py-2.5 text-left hover:bg-[#141925] transition-colors border-t border-[#1a1f2e]"
                      onClick={() => onSelect(city.id, city.name)}
                    >
                      <LevelDot level={lv} />
                      <span className="text-sm flex-1">{city.name}</span>
                      {lv > 0 && (
                        <span className="text-xs text-cyan-400/70">{LEVELS[lv].label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
