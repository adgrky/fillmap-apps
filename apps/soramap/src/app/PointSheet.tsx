// 山タップ時のボトムシート(SPEC §E2)。登頂トグル+訪問日/回数/メモ/ルート。
import { useState } from "react";
import type { Climb, MountainInfo } from "../domain/types";

type Props = {
  info: MountainInfo;
  climb: Climb | undefined; // undefined = 未登頂
  onToggle: () => void;
  onUpdate: (patch: Partial<Climb>) => void;
  onClose: () => void;
};

export function PointSheet({ info, climb, onToggle, onUpdate, onClose }: Props) {
  const visited = Boolean(climb);
  const [routeInput, setRouteInput] = useState("");

  const addRoute = () => {
    const r = routeInput.trim();
    if (!r) return;
    onUpdate({ routes: [...(climb?.routes ?? []), r] });
    setRouteInput("");
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[#11151c] p-4 pb-6 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{info.name}</h2>
          <p className="text-xs text-[#8b93a3]">
            {info.pref}・標高 {info.altitude.toLocaleString()}m
            {info.altitude >= 3000 && <span className="ml-2 text-emerald-300">3000m峰</span>}
          </p>
        </div>
        <button onClick={onClose} className="px-2 text-2xl leading-none text-[#8b93a3]" aria-label="閉じる">
          ×
        </button>
      </div>

      {/* 登頂トグル */}
      <button
        onClick={onToggle}
        className={`w-full rounded-xl py-3 text-base font-bold transition ${
          visited
            ? "bg-[#1e2530] text-[#8b93a3]"
            : "bg-emerald-400 text-[#0b0e14]"
        }`}
      >
        {visited ? "登頂を取り消す" : "⛰ 登頂した！"}
      </button>

      {/* 登頂済の詳細 */}
      {visited && climb && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-16 text-xs text-[#8b93a3]">登頂日</label>
            <input
              type="date"
              value={climb.firstDate ?? ""}
              onChange={(e) => onUpdate({ firstDate: e.target.value })}
              className="flex-1 rounded-lg bg-[#1e2530] px-3 py-2 text-sm text-[#e8ecf4] outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-16 text-xs text-[#8b93a3]">登頂回数</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdate({ count: Math.max(1, climb.count - 1) })}
                className="h-8 w-8 rounded-lg bg-[#1e2530] text-lg leading-none text-[#e8ecf4]"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold">{climb.count}</span>
              <button
                onClick={() => onUpdate({ count: climb.count + 1 })}
                className="h-8 w-8 rounded-lg bg-[#1e2530] text-lg leading-none text-[#e8ecf4]"
              >
                ＋
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#8b93a3]">メモ(140字)</label>
            <textarea
              value={climb.memo ?? ""}
              maxLength={140}
              rows={2}
              onChange={(e) => onUpdate({ memo: e.target.value })}
              placeholder="天気・同行者・思い出など"
              className="w-full resize-none rounded-lg bg-[#1e2530] px-3 py-2 text-sm text-[#e8ecf4] outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#8b93a3]">登頂ルート</label>
            {(climb.routes ?? []).length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {climb.routes!.map((r, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-lg bg-[#1e2530] px-2 py-1 text-xs text-[#e8ecf4]"
                  >
                    {r}
                    <button
                      onClick={() =>
                        onUpdate({ routes: climb.routes!.filter((_, j) => j !== i) })
                      }
                      className="text-[#8b93a3]"
                      aria-label="ルート削除"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={routeInput}
                onChange={(e) => setRouteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRoute()}
                placeholder="例: 御殿場ルート"
                className="flex-1 rounded-lg bg-[#1e2530] px-3 py-2 text-sm text-[#e8ecf4] outline-none"
              />
              <button
                onClick={addRoute}
                className="rounded-lg bg-[#1e2530] px-4 py-2 text-sm font-semibold text-emerald-300"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
