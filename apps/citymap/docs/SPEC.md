# citymap SPEC(市区町村塗りつぶしマップ)

> 唯一の仕様書。詳細は工場マスター `../../docs/10_fillmap_series.md §A1` と `§E3/§E4/§E5` を参照(再記述しない)。
> 共通技術原則・デザイン・PWA・運用は `../../docs/00_master_strategy.md` を基底とする。

## 現状(2026-06-19 / P0〜P2 完了 + 年表月対応・広告除外)
- 塗りモード: POLYGON(§E3)。区域タップ→レベル選択→塗り。
- レベル制(§A1 W2): 0未踏/1通過/2降り立った/3歩いた/4泊まった/5住んだ。レベル合計=行動力スコア。色は隣接レベルで視認できるよう色相を変えて配色(青→緑→黄→橙→赤)。
- 保存: localStorage `citymap.v1`、`visits{[id]:{level,count,firstDate,memo}}`(§E4)。汎用 `@fillmap/core/generic` の createPersistence を使用。
- 称号: 初上陸/県内コンプ/離島マスター/全国1%/半分来たぞ(§A1)。汎用 checkNewAchievements。
- データ: N03 SHP → 全国1905自治体 GeoJSON。8地方ブロック分割遅延ロード済み。
- 振り返り年表(YearTab): 年→月の二階層グループ表示(firstDate の年月単位)。4タブ目「⚙️設定」追加。

## 外部送信なしの原則に対する例外(2026-06-19 決定)
§(00_master)の「外部送信なし」は維持しつつ、収益化のため以下のみ例外的に許可する:
- Google AdSense バナー広告(画面下部・小)。`VITE_ADSENSE_CLIENT`/`VITE_ADSENSE_SLOT` 未設定時は非表示。
- 広告除外(買い切り)は Stripe決済リンクへの外部遷移のみ。アプリ本体からの自動送信は行わない。購入後に提示される解除コードを設定タブで手入力→ SHA-256 ハッシュ一致で `localStorage` に premium フラグを保存(@fillmap/core/generic の `redeemPremiumCode`)。

## フェーズ(§A1)
- [x] P0: N03前処理(1905自治体)。simplify+座標4桁丸め。8地方ブロック分割+manifest.json、viewport遅延ロード。
- [x] P1(骨格): POLYGON塗り+レベル+保存+スコアバー+称号トースト。
- [x] P2: 行動力スコア演出/称号一覧シート/シェア画像(§E5 📤)/PWAアイコン/リスト一括入力(W4)/workbox修正。
- [x] P3: 振り返り年表の年月対応・広告バナー・広告除外(買い切り)導線。

## §11 消滅自治体(プレミアム機能、2026-06-26実装)
- 出典: 総務省「市町村名逆引き一覧」(都道府県別ページ、平成11年3月31日時点市町村→合併後)。座標は出典に含まれないため、合併後の現市町村(N03由来)の重心を採用し、同一合併先に複数の旧自治体がある場合は決定的なジッターで散らす。
- 生成: `tools/curate_dissolved.py`(47都道府県ページをパース→現行1905自治体に名称マッチ→`public/data/dissolved.json`、1798件)。
- 表示: premium時のみ地図上に小さな点(MapView `dissolved-points` レイヤー)を追加表示。タップで名称・郡名・合併期日・合併先のシートを表示(DissolvedSheet)。訪問記録・スコアには影響しない(発見要素のみ)。
- 非premium時はレイヤー自体を追加しない(データ取得もしない)。

## 将来課題(現フェーズ外)
- core/railmap の旧ファイル6本を手動削除(rm が hooks でブロック中)
- AdSense 実 publisher ID / Stripe 決済リンク / 解除コードハッシュの実値設定(現在 `.env.example` のみ)
