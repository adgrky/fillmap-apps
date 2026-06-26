// onsenmap ドメイン型(SPEC §A6 / §E4)。POINT モード。汎用基底 SaveDataBase を拡張。
import type { SaveDataBase } from "@fillmap/core/generic";

/** 温泉メタ(meta.json)。preprocess_point.py が生成。 */
export type OnsenMeta = {
  points: Record<string, OnsenInfo>;
  totals: {
    pointCount: number;
    byPref: Record<string, number>;
  };
};

export type OnsenInfo = {
  name: string;
  pref: string;
};

/** 1湯の入湯記録(§E4 visits)。visits に存在=入湯済。 */
export type Bath = {
  count: number;
  firstDate?: string;
  memo?: string;
};

/** localStorage 保存データ。 */
export type OnsenSaveData = SaveDataBase & {
  visits: Record<string, Bath>;
};
