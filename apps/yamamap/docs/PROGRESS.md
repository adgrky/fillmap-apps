## 初期生成
- 完了: create_app.py で雛形生成
- 決定: -
- 残課題: SPEC.md 記入・データ準備・App.tsx 本実装

## P0〜P2 実装(2026-06-23)
- 完了: 百名山100座データ調達(出典明記)→POINT地図(circle+グロー+波紋W1)→登頂トグル/保存/リスト/年表/スコア(累計標高)/称号6種/シェア画像/PWAアイコン。typecheck通過・dev実機検証OK(登頂→保存→リロード維持)。
- 決定: POINTモードは citymap(POLYGON)骨格を流用し fill層→circle層に置換。レベル制は持たず visits 在不在で登頂判定。テーマ=emerald。
- 残課題: GitHub Pages公開エクスポート(ケン確認後)。michimap/kokudomapへ横展開。

## 2026-06-25 Capacitor化・署名・ストア素材準備
- 完了: railmap手順(STORE_PIPELINE.md)をなぞりCapacitor導入。AdMob/Play課金のネイティブ配線、設定タブに購入・復元ボタン追加。デバッグAPKをエミュレータで動作確認(クラッシュなし・百名山地図描画OK)。署名鍵(yamamap.keystore)新規発行→key.properties→`bundleRelease`で署名付きAAB生成まで確認。フィーチャーグラフィック・プライバシーポリシー・Play掲載文ドラフト作成。
- 決定: AdMobアプリIDは暫定でGoogle公式テストIDを設定(本番IDはAdMob取得後にケンが差し替え)。プレミアム機能は「二百名山・三百名山」(ケン確定)。
- 残課題: 二百名山・三百名山データの調達・実装は未着手(後回し中)。AdMob/Play課金の本番ID取得、スクリーンショット撮影、Play Console提出はケンの作業。

## 2026-06-26 二百名山・三百名山 プレミアム機能 実装(コード完了・実機確認待ち)
- 完了: tools/curate_extra_peaks.py で100sen.cyber-ninja.jpの200/300meizan02.csvを取得・整形しpublic/data/extra_peaks.json(201座)生成。premium時のみMapViewに別レイヤー追加、タップでExtraPeakSheet表示。tsc成功。
- 決定: 既存の100座スコア/称号システムとは完全分離(発見要素のみ、登頂記録に影響しない)。citymapの消滅自治体パターンを流用。
- 残課題: エミュレータでの実機目視確認(後日まとめて実施)。
