## 2026-06-19 P2完了
- 完了: シェア画像(§E5 📤)・PWAアイコン(192/512px)・manifest.icons実ファイル化・workboxサイズ上限修正
- 決定: Web Share API非対応環境はPNGダウンロードにfallback
- 残課題: 新アプリ雛形ツール(tools/create_app.py)・railmap→@fillmap/core/generic乗せ替え

## 2026-06-19 地方ブロック遅延ロード完了
- 完了: 8ブロック分割スクリプト(tools/split_citymap_geojson.py)・MapView遅延ロード実装・全国地図描画確認
- 決定: 全国表示時はブロックが全部 viewport に入るので実質並列ロード。ズームイン時は差分のみ追加
- 残課題: W5振り返り年表・消滅自治体(プレミアム種)・packages/core旧ファイル手動削除

## 2026-06-19 振り返り年表完了
- 完了: YearTab.tsx(年別→都道府県別グループ/レベルドット/日付不明分類/空状態メッセージ)
- 決定: 3タブ目「📅 年表」として追加
- 残課題: 消滅自治体データ(プレミアム種)・packages/core旧ファイル手動削除

## 2026-06-19 色修正・年表月対応・広告除外
- 完了: LEVELS配色を色相分離(青/緑/黄/橙/赤)に変更/YearTab年→月二階層化/AdBanner+SettingsTab(広告除外コード入力)追加
- 決定: 外部送信なし原則の例外としてAdSense・Stripe決済リンクのみ許可(SPEC.md追記)。実IDは.env.example未設定のプレースホルダ
- 残課題: AdSense publisher ID/Stripe決済リンク/解除コードハッシュの実値設定

## 2026-06-22 GitHub Pages公開
- 完了: apps/citymapを単体リポジトリ(adgrky/citymap, public)へ切り出し。@fillmap/core/genericはsrc/core/generic.tsへ複製してworkspace依存解消。GitHub Actions(deploy.yml)でmainへのpush時に自動build→Pages公開。https://adgrky.github.io/citymap/ で稼働確認(HTML/JS/CSS/geojson全て200)
- 決定: モノレポ(fillmap-apps)は開発用に維持し、citymap単体リポジトリは公開専用のスナップショット運用。今後citymap側の変更はこちら(apps/citymap)で行い、公開時に手動で同期する
- 残課題: AdSense審査(サイトURL登録が今できる状態になった)/Stripe決済リンク作成/解除コードハッシュ設定。railmapも同様の単体リポジトリ切り出しが未着手

## 2026-06-25 Capacitor化・署名・ストア素材準備
- 完了: railmap手順(STORE_PIPELINE.md)をなぞりCapacitor導入。AdMob/Play課金のネイティブ配線、設定タブに購入・復元ボタン追加。デバッグAPKをエミュレータで動作確認(クラッシュなし・地図描画OK)。署名鍵(citymap.keystore)新規発行→key.properties→`bundleRelease`で署名付きAAB生成まで確認。フィーチャーグラフィック・プライバシーポリシー・Play掲載文ドラフト作成。
- 決定: AdMobアプリIDは暫定でGoogle公式テストIDを設定(本番IDはAdMob取得後にケンが差し替え)。
- 残課題: 消滅自治体プレミアム機能は未実装(データ調達から要、後回し中)。AdMob/Play課金の本番ID取得、スクリーンショット撮影、Play Console提出はケンの作業。

## 2026-06-26 消滅自治体プレミアム機能 実装(コード完了・実機確認待ち)
- 完了: 総務省「市町村名逆引き一覧」(47都道府県ページ)を`tools/curate_dissolved.py`でパース→現行1905自治体に名称マッチ→`public/data/dissolved.json`(1798件、平成の大合併で消えた旧市町村)。MapViewにpremium限定の`dissolved-points`レイヤー追加、タップでDissolvedSheet(郡名・合併期日・合併先)表示。スコア・訪問記録には影響しない発見要素。tsc/vite build成功。
- 決定: 座標は出典に無いため合併後の現市町村重心+ジッターで近似(歴史的正確性より実装容易性を優先、SPEC §11に明記)。
- 残課題: エミュレータでの実機目視確認(後日まとめて実施)。Play掲載文ドラフトの「未実装」表記の更新。
