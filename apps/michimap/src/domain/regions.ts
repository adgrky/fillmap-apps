// 地方ブロック別カラー表示(プレミアム機能, SPEC §11)。標準的な8地方区分(一般的な行政地理区分、出典を要しない公知の分類)。
export type Region = "北海道" | "東北" | "関東" | "中部" | "近畿" | "中国" | "四国" | "九州・沖縄";

const PREF_TO_REGION: Record<string, Region> = {
  北海道: "北海道",
  青森県: "東北", 岩手県: "東北", 宮城県: "東北", 秋田県: "東北", 山形県: "東北", 福島県: "東北",
  茨城県: "関東", 栃木県: "関東", 群馬県: "関東", 埼玉県: "関東", 千葉県: "関東", 東京都: "関東", 神奈川県: "関東",
  新潟県: "中部", 富山県: "中部", 石川県: "中部", 福井県: "中部", 山梨県: "中部", 長野県: "中部", 岐阜県: "中部", 静岡県: "中部", 愛知県: "中部",
  三重県: "近畿", 滋賀県: "近畿", 京都府: "近畿", 大阪府: "近畿", 兵庫県: "近畿", 奈良県: "近畿", 和歌山県: "近畿",
  鳥取県: "中国", 島根県: "中国", 岡山県: "中国", 広島県: "中国", 山口県: "中国",
  徳島県: "四国", 香川県: "四国", 愛媛県: "四国", 高知県: "四国",
  福岡県: "九州・沖縄", 佐賀県: "九州・沖縄", 長崎県: "九州・沖縄", 熊本県: "九州・沖縄", 大分県: "九州・沖縄",
  宮崎県: "九州・沖縄", 鹿児島県: "九州・沖縄", 沖縄県: "九州・沖縄",
};

export const REGION_COLORS: Record<Region, string> = {
  "北海道": "#60a5fa",
  "東北": "#34d399",
  "関東": "#fbbf24",
  "中部": "#f472b6",
  "近畿": "#a78bfa",
  "中国": "#fb923c",
  "四国": "#22d3ee",
  "九州・沖縄": "#f87171",
};

export function regionOf(pref: string): Region | undefined {
  return PREF_TO_REGION[pref];
}

/** MapLibre match式用の [pref, color, pref, color, ..., fallback] 配列を生成。 */
export function regionColorMatchPairs(): (string)[] {
  const pairs: string[] = [];
  for (const [pref, region] of Object.entries(PREF_TO_REGION)) {
    pairs.push(pref, REGION_COLORS[region]);
  }
  return pairs;
}
