# citymap SPEC(市区町村塗りつぶしマップ)

> 唯一の仕様書。詳細は工場マスター `../../docs/10_fillmap_series.md §A1` と `§E3/§E4/§E5` を参照(再記述しない)。
> 共通技術原則・デザイン・PWA・運用は `../../docs/00_master_strategy.md` を基底とする。

## 現状(2026-06-18 / Phase 1 着手)
- 塗りモード: POLYGON(§E3)。区域タップ→レベル選択→塗り。
- レベル制(§A1 W2): 0未踏/1通過/2降り立った/3歩いた/4泊まった/5住んだ。レベル合計=行動力スコア。
- 保存: localStorage `citymap.v1`、`visits{[id]:{level,count,firstDate,memo}}`(§E4)。汎用 `@fillmap/core/generic` の createPersistence を使用。
- 称号: 初上陸/県内コンプ/離島マスター/全国1%/半分来たぞ(§A1)。汎用 checkNewAchievements。
- データ: 現状は東京6区のサンプル GeoJSON。**本番は国土数値情報 N03(1,741自治体)を前処理予定(P0未了)**。

## フェーズ(§A1)
- [ ] P0: N03前処理(受入: 自治体数1,741±政令区で一致)。simplify必須、3MB超で地方ブロック8分割遅延ロード。
- [x] P1(骨格): POLYGON塗り+レベル+保存+スコアバー+称号トースト。※サンプルデータで動作確認済み
- [ ] P2: 行動力スコア演出/称号一覧/シェア画像(§E5)/PWAアイコン/リスト一括入力(W4)。

## 残課題
- マップが外部タイル無し(ブランクスタイル+自前ポリゴンのみ)。本番は全国ポリゴンで重さ確認しsimplify調整。
- アイコン未作成(manifest icons空)。
- core汎用層への railmap 移行は別途(現状 railmap は旧 core を使用)。
