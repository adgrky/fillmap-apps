// shiromap ドメイン型(SPEC §A4 / §E4)。POINT モード。汎用基底 SaveDataBase を拡張。
import type { SaveDataBase } from "@fillmap/core/generic";

/** 城メタ(meta.json)。preprocess_point.py が生成。 */
export type CastleMeta = {
  points: Record<string, CastleInfo>;
  totals: {
    pointCount: number;
    byPref: Record<string, number>;
  };
};

export type CastleInfo = {
  name: string;
  pref: string;
  /** タグ(100名城 / 現存12天守 / 国宝)。多層達成率に使う。 */
  tags?: string[];
};

/** 1城の攻略記録(§E4 visits)。visits に存在=攻略済。 */
export type Conquest = {
  count: number;
  firstDate?: string;
  memo?: string;
};

/** localStorage 保存データ。 */
export type CastleSaveData = SaveDataBase & {
  visits: Record<string, Conquest>;
};
