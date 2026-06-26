// 路線タップ時のボトムシート(SPEC §5.2 のうち Phase1: 乗った!/取り消し)。app層。
import type { LineMeta } from "../domain/types";
import { roadTagsFor } from "../domain/roadTags";

type Props = {
  lineId: string;
  meta: LineMeta;
  isRidden: boolean;
  onToggle: () => void;
  onClose: () => void;
  premium: boolean;
};

export function LineSheet({ meta, isRidden, onToggle, onClose, premium }: Props) {
  const tags = premium ? roadTagsFor(meta.ref) : [];
  return (
    <div className="absolute inset-x-0 bottom-14 z-40">
      <div className="mx-auto max-w-md rounded-t-[14px] bg-surface p-5 pb-7 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-text">{meta.lineName}</h2>
            <p className="truncate text-sm text-text-dim">一般国道</p>
            {tags.length > 0 && (
              <div className="mt-1 flex gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                    {t === "海上国道" ? "🌊 " : "⚠️ "}{t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            aria-label="閉じる"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-dim hover:bg-surface-2"
          >
            ✕
          </button>
        </div>

        <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-surface-2 px-3 py-2">
            <dt className="text-text-dim">総延長</dt>
            <dd className="tnum text-base font-semibold text-text">{meta.lengthKm.toFixed(1)} km</dd>
          </div>
          <div className="rounded-lg bg-surface-2 px-3 py-2">
            <dt className="text-text-dim">区分</dt>
            <dd className="text-base font-semibold text-text">一般国道</dd>
          </div>
        </dl>

        {isRidden ? (
          <button
            onClick={onToggle}
            className="min-h-[44px] w-full rounded-token border border-danger/60 py-3 font-semibold text-danger hover:bg-danger/10"
          >
            走破を取り消す
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="min-h-[44px] w-full rounded-token bg-accent-blue py-3 text-base font-bold text-bg hover:opacity-90"
          >
            🛣 走破した!
          </button>
        )}
      </div>
    </div>
  );
}
