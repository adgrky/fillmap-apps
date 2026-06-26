# 百名山埋め立てマップ(yamamap) SPEC

> 基底: 工場マスター(docs/00_master) + シリーズ設計(docs/10_fillmap_series §E, §A2)。本書は差分のみ。

## §1 概要
日本百名山100座の登頂記録を地図上に「埋めて」いくPOINTモードアプリ。一言: 登った山が光る、自分だけの登頂史。

## §2 データ(§E2 POINT / §E6 / §E7)
- ソース: 「日本百選と座標値」 https://100sen.cyber-ninja.jp/ (csv/100meizan02.csv, 緯度経度十進数・自由使用可)。標高は深田久弥『日本百名山』の伝統値(Wikipedia照合)。
- 山名・標高・座標は事実データ(著作権対象外)。百名山100座のみ抽出。写真・解説文は非収載。
- 前処理: `tools/curate_mountains.py`(生CSV→`tools/curated/mountains.csv`)→ `tools/preprocess_point.py`(→`public/data/points.geojson` + `meta.json`)。
- 受入: 100フィーチャ / meta.totals.pointCount === 100。3000m峰13座・27都道府県。

## §3 塗り状態
- 0:未登頂(グレー小円) / 登頂済(テーマ色+グロー円+白縁)。visits に存在=登頂済(レベルは持たない)。
- 登頂時アニメ(W1): 円から波紋が広がる(500ms)+スコアカウントアップ。prefers-reduced-motion 尊重。

## §4 保存(§E4)
- storageKey: `yamamap.v1` / version: 1
- visits: `{ [id]: { count, firstDate?, memo?, routes? } }`(routes=登頂ルート履歴 §A2 W4)

## §5 画面構成
- タブ: 🗺地図 / 📋リスト(都道府県アコーディオン・ワンタップ登頂 W4) / 📅年表(W5) / ⚙️設定
- 山タップ→PointSheet: 山名/標高/登頂トグル/登頂日/回数/メモ140字/ルート

## §6 デザイントークン
- アクセント: emerald(THEME #34d399 / DIM #6ee7b7)。未登頂 #3a3f4a。

## §7 スコア / 演出(§A2 W2)
- 累計標高 = Σ(登頂済の標高)。換算文言「エベレストN回分」(8,848m基準)。

## §8 達成率
- 全国 = 登頂数/100。都道府県別・3000m峰別の達成率を保持。

## §9 称号
- 初登頂 / 3000m峰デビュー / 累計エベレスト超え / 高峰ハンター(3000m峰10座) / 半分の頂(50座) / 百名山コンプリート(100座・金)

## §10 シェア画像(§E5)
- 地図スナップ+「百名山 N/100座」+「累計標高 Nm エベレストN回分」+統一フッター。0座時は「これから登る余白」。

## §11 二百名山・三百名山(プレミアム機能、2026-06-26実装)
- ソース: 「日本百選と座標値」 https://100sen.cyber-ninja.jp/ (csv/200meizan02.csv=No.101-200, csv/300meizan02.csv=No.201-300。緯度経度十進数・自由使用可)。
- premium時のみ地図上に追加201座(二百名山+100/三百名山+101)を別レイヤーで表示。タップで山名/標高/区分をシート表示。
- 登頂記録・スコア・称号には含めない(発見要素のみ。基本100座の百名山スコアと分離)。
- 前処理: `tools/curate_extra_peaks.py` → `public/data/extra_peaks.json`(百名山本体のpoints.geojson/meta.jsonとは独立)。
