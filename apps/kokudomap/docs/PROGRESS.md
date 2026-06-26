## 初期生成
- 完了: create_app.py で雛形生成
- 決定: -
- 残課題: SPEC.md 記入・データ準備・App.tsx 本実装

## フル実装(2026-06-23)
- 完了: OSM Overpassから国道436本を取得→preprocess_road.pyでMultiLineString集約(5.6MB)。railmap骨格を流用しLINE描画・光走りアニメ・距離スコア・称号8種・統計簡素化・出典ODbL明記。typecheck通過・dev実機検証OK(走破→青く点灯・スコア4.8%/3247km・地球一周換算・国道デビュー解除)。
- 決定: railmap資産をほぼそのまま流用(railType="国道"単一で型互換)。1国道=1 MultiLineStringでサイズ29MB→5.6MBに圧縮。
- 残課題: GitHub Pages公開エクスポート(ケン確認後)。酷道タグ・都道府県別達成率はv2。

## 2026-06-25 Capacitor化・署名・ストア素材準備
- 完了: railmap手順(STORE_PIPELINE.md)をなぞりCapacitor導入。AdMob/Play課金のネイティブ配線、設定画面に購入・復元ボタン追加。デバッグAPKをエミュレータで動作確認(クラッシュなし・全国道路網の描画OK)。署名鍵(kokudomap.keystore)新規発行→key.properties→`bundleRelease`で署名付きAAB生成まで確認。フィーチャーグラフィック・プライバシーポリシー・Play掲載文ドラフト作成。
- 決定: AdMobアプリIDは暫定でGoogle公式テストIDを設定(本番IDはAdMob取得後にケンが差し替え)。
- 残課題: 酷道・旧道タグのプレミアム機能は未実装(データ調達から要、後回し中)。AdMob/Play課金の本番ID取得、スクリーンショット撮影、Play Console提出はケンの作業。

## 2026-06-26 国道トリビアタグ プレミアム機能 実装(コード完了・実機確認待ち)
- 完了: 「酷道」評価は個人サイト(route01.com)の独自ランキングで著作権上の懸念(転載許可必須と明記)があったため不採用。代わりに事実ベースの公式データ2種(海上国道29路線=Wikipedia「海上国道」、点線国道16路線=国土交通省道路データブック2025「10-3」)をdomain/roadTags.tsに静的定義。premium時のみLineSheetにバッジ表示。tsc成功。
- 決定: 路線数が少なく更新頻度も低いため別ファイルfetchではなくTS定数で管理。旧道タグは区間単位データが必要で現行データ構造では対応不可、v2へ。
- 残課題: エミュレータでの実機目視確認(後日まとめて実施)。
