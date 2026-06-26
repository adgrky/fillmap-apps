// リスト一括入力タブ(SPEC §A6 W4)。都道府県アコーディオン+ワンタップ入湯。
import { useState } from "react";
import type { OnsenMeta } from "../domain/types";
import { THEME, UNVISITED } from "../domain/theme";

type Props = {
  meta: OnsenMeta;
  isVisited: (id: string) => boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string, name: string) => void;
};

export function ListTab({ meta, isVisited, onToggle, onSelect }: Props) {
  const [openPref, setOpenPref] = useState<string | null>(null);

  const prefMap: Record<string, { id: string; name: string }[]> = {};
  for (const [id, info] of Object.entries(meta.points)) {
    (prefMap[info.pref] ??= []).push({ id, name: info.name });
  }
  for (const list of Object.values(prefMap)) list.sort((a, b) => a.id.localeCompare(b.id));
  const prefs = Object.keys(prefMap).sort((a, b) => a.localeCompare(b, "ja"));

  return (
    <div className="absolute inset-0 top-[88px] overflow-y-auto bg-[#0b0e14]">
      {prefs.map((pref) => {
        const onsens = prefMap[pref];
        const isOpen = openPref === pref;
        const visitedInPref = onsens.filter((o) => isVisited(o.id)).length;
        const total = onsens.length;

        return (
          <div key={pref} className="border-b border-[#1e2430]">
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
                    <div className="h-full rounded-full" style={{ width: `${(visitedInPref / total) * 100}%`, background: THEME }} />
                  </div>
                )}
                <span className="text-[#8b93a3] text-xs">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {isOpen && (
              <div className="bg-[#0e1219]">
                {onsens.map((o) => {
                  const v = isVisited(o.id);
                  return (
                    <div key={o.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-[#1a1f2e]">
                      <button
                        onClick={() => onToggle(o.id)}
                        aria-label={v ? "入湯を取り消す" : "入湯を記録"}
                        className="h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition"
                        style={{ borderColor: v ? THEME : UNVISITED, background: v ? THEME : "transparent" }}
                      >
                        {v && <span className="text-[#0b0e14] text-xs leading-none">✓</span>}
                      </button>
                      <button className="flex-1 text-left" onClick={() => onSelect(o.id, o.name)}>
                        <span className="text-sm">{o.name}</span>
                      </button>
                    </div>
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
