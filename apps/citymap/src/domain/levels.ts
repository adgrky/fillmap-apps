// 経県値方式の塗りレベル定義(SPEC §A1 W2)。0:未踏 〜 5:住んだ。
// レベル合計が「行動力スコア」になる。色はレベルが上がるほど濃く・明るく。

export type LevelDef = {
  level: number;
  label: string;
  color: string; // 地図塗り色
};

// 隣接レベルの彩度/色相を変えて視認性を確保(単色グラデは見分けがつかないため §バグ修正)。
export const LEVELS: LevelDef[] = [
  { level: 0, label: "未踏", color: "#1a1f2a" },
  { level: 1, label: "通過した", color: "#3b82f6" },
  { level: 2, label: "降り立った", color: "#10b981" },
  { level: 3, label: "歩いた", color: "#eab308" },
  { level: 4, label: "泊まった", color: "#f97316" },
  { level: 5, label: "住んだ", color: "#ef4444" },
];

export const MAX_LEVEL = 5;

export function levelLabel(level: number): string {
  return LEVELS[level]?.label ?? "未踏";
}

/** maplibre fill-color 用の step 式(feature-state.level を参照)。 */
export function levelColorStepExpression(): unknown[] {
  const expr: unknown[] = ["step", ["coalesce", ["feature-state", "level"], 0], LEVELS[0].color];
  for (let i = 1; i <= MAX_LEVEL; i++) {
    expr.push(i, LEVELS[i].color);
  }
  return expr;
}
