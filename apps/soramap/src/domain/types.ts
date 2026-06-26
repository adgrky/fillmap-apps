// yamamap ドメイン型(SPEC §A2 / §E4)。POINT モード。汎用基底 SaveDataBase を拡張。
import type { SaveDataBase } from "@fillmap/core/generic";

/** 山メタ(meta.json)。preprocess_point.py が生成。 */
export type MountainMeta = {
  points: Record<string, MountainInfo>;
  totals: {
    pointCount: number;
    byPref: Record<string, number>;
  };
};

export type MountainInfo = {
  name: string;
  pref: string;
  /** 標高(m)。累計標高・3000m峰称号に使う。 */
  altitude: number;
  /** タグ(百名山 / 3000m峰 等)。 */
  tags?: string[];
};

/** 1座の登頂記録(§E4 visits)。visits に存在する=登頂済。 */
export type Climb = {
  count: number;
  firstDate?: string;
  memo?: string;
  /** 登頂ルート名の履歴(§A2 W4)。 */
  routes?: string[];
};

/** localStorage 保存データ。 */
export type MountainSaveData = SaveDataBase & {
  visits: Record<string, Climb>;
};
