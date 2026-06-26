// 城タップ時のボトムシート(SPEC §E2/§A4)。攻略トグル+攻略日/回数/メモ。
import type { CastleInfo, Conquest } from "../domain/types";

type Props = {
  info: CastleInfo;
  conquest: Conquest | undefined; // undefined = 未攻略
  onToggle: () => void;
  onUpdate: (patch: Partial<Conquest>) => void;
  onClose: () => void;
};

export function PointSheet({ info, conquest, onToggle, onUpdate, onClose }: Props) {
  const conquered = Boolean(conquest);
  const tags = (info.tags ?? []).filter((t) => t !== "100名城");

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[#11151c] p-4 pb-6 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{info.name}</h2>
          <p className="text-xs text-[#8b93a3]">
            {info.pref}
            {tags.map((t) => (
              <span key={t} className="ml-2 text-yellow-300">{t}</span>
            ))}
          </p>
        </div>
        <button onClick={onClose} className="px-2 text-2xl leading-none text-[#8b93a3]" aria-label="閉じる">
          ×
        </button>
      </div>

      <button
        onClick={onToggle}
        className={`w-full rounded-xl py-3 text-base font-bold transition ${
          conquered ? "bg-[#1e2530] text-[#8b93a3]" : "bg-yellow-500 text-[#0b0e14]"
        }`}
      >
        {conquered ? "攻略を取り消す" : "🚩 攻略した！"}
      </button>

      {conquered && conquest && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-16 text-xs text-[#8b93a3]">攻略日</label>
            <input
              type="date"
              value={conquest.firstDate ?? ""}
              onChange={(e) => onUpdate({ firstDate: e.target.value })}
              className="flex-1 rounded-lg bg-[#1e2530] px-3 py-2 text-sm text-[#e8ecf4] outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-16 text-xs text-[#8b93a3]">登城回数</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onUpdate({ count: Math.max(1, conquest.count - 1) })}
                className="h-8 w-8 rounded-lg bg-[#1e2530] text-lg leading-none text-[#e8ecf4]"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold">{conquest.count}</span>
              <button
                onClick={() => onUpdate({ count: conquest.count + 1 })}
                className="h-8 w-8 rounded-lg bg-[#1e2530] text-lg leading-none text-[#e8ecf4]"
              >
                ＋
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#8b93a3]">メモ(140字)</label>
            <textarea
              value={conquest.memo ?? ""}
              maxLength={140}
              rows={2}
              onChange={(e) => onUpdate({ memo: e.target.value })}
              placeholder="天守・石垣・スタンプの感想など"
              className="w-full resize-none rounded-lg bg-[#1e2530] px-3 py-2 text-sm text-[#e8ecf4] outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
