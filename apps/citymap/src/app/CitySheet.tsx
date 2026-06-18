// 自治体タップ時のボトムシート。レベル0-5をワンタップ選択(SPEC §A1 W4)。
import { LEVELS } from "../domain/levels";

type Props = {
  cityId: string;
  cityName: string;
  currentLevel: number;
  onPick: (level: number) => void;
  onClose: () => void;
};

export function CitySheet({ cityName, currentLevel, onPick, onClose }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[#11151c] p-4 pb-6 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{cityName}</h2>
        <button onClick={onClose} className="px-2 text-2xl leading-none text-[#8b93a3]" aria-label="閉じる">
          ×
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map((l) => {
          const active = l.level === currentLevel;
          return (
            <button
              key={l.level}
              onClick={() => onPick(l.level)}
              className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
                active ? "ring-2 ring-cyan-300" : "opacity-90"
              }`}
              style={{ background: l.color, color: l.level >= 3 ? "#0b0e14" : "#e8ecf4" }}
            >
              {l.level === 0 ? "未踏に戻す" : `${l.level}・${l.label}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
