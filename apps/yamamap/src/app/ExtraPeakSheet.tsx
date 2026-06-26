// 二百名山・三百名山タップ時のボトムシート(プレミアム機能, SPEC §11)。発見要素のみ・登頂記録には影響しない。
import type { ExtraPeak } from "../domain/types";

type Props = {
  item: ExtraPeak;
  onClose: () => void;
};

export function ExtraPeakSheet({ item, onClose }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[#11151c] p-4 pb-6 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-amber-200">{item.name}</h2>
        <button onClick={onClose} className="px-2 text-2xl leading-none text-[#8b93a3]" aria-label="閉じる">
          ×
        </button>
      </div>
      <p className="text-sm text-[#8b93a3]">{item.pref} ・ {item.rank}</p>
      <div className="mt-3 rounded-xl bg-[#1e2530] p-3 text-sm">
        <span className="text-[#8b93a3]">標高: </span>
        {item.altitude.toLocaleString()}m
      </div>
    </div>
  );
}
