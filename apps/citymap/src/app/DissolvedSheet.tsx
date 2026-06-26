// 消滅自治体タップ時のボトムシート(プレミアム機能, SPEC §11)。発見要素のみ・訪問記録には影響しない。
import type { DissolvedMunicipality } from "../domain/types";

type Props = {
  item: DissolvedMunicipality;
  onClose: () => void;
};

export function DissolvedSheet({ item, onClose }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[#11151c] p-4 pb-6 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-violet-200">
          {item.county ? `${item.county} ` : ""}
          {item.name}
        </h2>
        <button onClick={onClose} className="px-2 text-2xl leading-none text-[#8b93a3]" aria-label="閉じる">
          ×
        </button>
      </div>
      <p className="text-sm text-[#8b93a3]">{item.pref} ・ 消滅した市町村</p>
      <div className="mt-3 space-y-1 rounded-xl bg-[#1e2530] p-3 text-sm">
        <p>
          <span className="text-[#8b93a3]">合併期日: </span>
          {item.gapeiDate}
        </p>
        <p>
          <span className="text-[#8b93a3]">合併先: </span>
          {item.mergedInto}
        </p>
      </div>
    </div>
  );
}
