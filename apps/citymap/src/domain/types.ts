// citymap ドメイン型(SPEC §A1 / §E4)。汎用基底 SaveDataBase を拡張。
import type { SaveDataBase } from "@fillmap/core/generic";

/** 自治体メタ(meta.json)。前処理(N03)が生成。 */
export type CityMeta = {
  cities: Record<string, CityInfo>;
  totals: {
    cityCount: number;
    byPref: Record<string, number>;
  };
};

export type CityInfo = {
  name: string;
  pref: string;
  /** 島嶼自治体(離島マスター称号用)。 */
  isIsland?: boolean;
};

/** 消滅自治体1件(プレミアム機能, §11)。tools/curate_dissolved.py が生成。 */
export type DissolvedMunicipality = {
  id: string;
  pref: string;
  name: string;
  county: string | null;
  gapeiDate: string;
  mergedInto: string;
  succId: string;
  lng: number;
  lat: number;
};

/** 1自治体の訪問記録(§E4 visits)。 */
export type Visit = {
  level: number; // 0-5(0は未踏=visits から削除)
  count: number;
  firstDate?: string;
  memo?: string;
};

/** localStorage 保存データ。 */
export type CitySaveData = SaveDataBase & {
  visits: Record<string, Visit>;
};
