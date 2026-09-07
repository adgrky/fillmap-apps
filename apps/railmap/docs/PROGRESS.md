# 進捗・決定事項ログ

各フェーズ完了時、Claude Code が「完了 / 決定 / 残課題」を3行以内で追記する。

## Phase 0(データパイプライン) 2026-06-18
- 完了: §2構成へ整理+git初期化、preprocess.pyでN02-25→lines/stations/meta生成(597路線/10234駅/総延長27,725.7km)。受け入れ条件3点達成、VERIFIED.md記録。
- 決定: データはN02-25(令和7)をコードで自動DL。GeoJSON同梱を直接利用。gzip合計0.72MBで分割不要。地図ベースはdark実在を確認。
- 残課題: pref(都道府県)付与とrailType地下鉄判定の精緻化はPhase 2へ。

## Phase 1(MVP) 2026-06-18
- 完了: Vite+React18+TS(strict)+Tailwind+Zustand+MapLibre雛形、core層(store/persistence/progress)、app層(MapView/LineSheet/上部達成率バー/タブ器)。build・型チェック0エラー。
- 決定: geojson本体はMapLibreがURL直読み、metaのみApp fetch(§3.3)。Phase1ベース地図はpositron。地図検証用にDEV限定で window.__map 公開。
- 残課題: ①persistence/progress/リロード保持/全国%(山陰線685.2km→2.5%手計算一致)は検証済 ②地図描画と実タップ塗りは preview サンドボックスがMapLibreのload完了を通さず未検証→実ブラウザで要確認。アニメ/統計/称号/シェア/PWAはPhase2。

## 2026-06-19 年表追加・広告除外
- 完了: YearTab.tsx新規(citymapと同設計の年→月二階層)、5タブ目として追加。AdBanner+SettingsView拡張(広告除外コード入力)
- 決定: 外部送信なし原則の例外としてAdSense・Stripe決済リンクのみ許可(SPEC.md §0追記)。実IDは.env.example未設定のプレースホルダ
- 残課題: AdSense publisher ID/Stripe決済リンク/解除コードハッシュの実値設定

## 2026-06-22 TWA準備・広告ゼロ方針修正
- 完了: AdBanner非表示条件に地図タブ判定を追加(地図タブ=広告ゼロを実装に反映)。iCloud保管のrailmap.keystoreをandroid-twa/android.keystoreへ復元
- 決定: 広告はAdSense(Web埋め込み)方式で進める。ネイティブAdMob SDKへの切替は不採用(TWA構成のため)
- 残課題: AdSense publisher ID/slot ID取得(ケン作業)、プライバシーポリシーの広告ID収集記載、Play Consoleデータセーフティ回答更新、Play Console掲載情報の最終判断

## 2026-06-25 Capacitor化(TWA→Capacitor 方針転換)
- 完了: TWAをやめ Capacitor でネイティブアプリ化。core に ads.ts(AdMob)/iap.ts(Play買い切り)ファサード追加、vite CAP_BUILD分岐(base/PWA無効化)、AdBanner/SettingsView/main をnative/Web分岐。`cap add android`→デバッグAPK生成→エミュレータで地図/タブ描画を確認(クラッシュなし)。privacy.html(広告ID収集あり)新規。SPEC §14新設。
- 決定: 広告=AdMob(native)/AdSense(web)、課金=Google Play買い切り(cordova-plugin-purchase)+従来Stripe(web)。premium判定は isPremium("railmap.v1")共通。ビルドはJDK21必須。手順は docs/STORE_PIPELINE.md・tools/add_capacitor.py に集約(横展開用)。
- 残課題: AdMob実アプリID/広告ユニットID・Play課金商品ID(railmap.premium)取得→Manifest/.env設定、署名AAB(key.properties)、フィーチャーグラフィック1024x500、Play Console内部テスト→提出。

## 2026-06-25 プレミアム機能(種別カラー塗り分け)実装
- 完了: MapView に premium prop追加。`lines-visited`/`lines-glow` の色を `railType`(新幹線/JR在来線/私鉄/地下鉄/路面・その他)の match式で出し分け(無料=テーマ単色/premium=5色)。地図上部に凡例(premium時のみ表示)。Web/アプリ両ビルド・型チェック・エミュレータ実機確認済み。
- 決定: 冗長だった `lines-visited` の line-gradient(常に単色固定)を廃止し line-color のデータ式に統一。色定義は MapView.tsx の RAIL_TYPE_COLORS と App.tsx の凡例で重複管理(2箇所一致必須、3本目以降で共通化検討)。
- 残課題: なし(本機能は完成。ストア提出関連の残課題は上記参照)。

## 2026-06-27 ストア掲載用スクリーンショット撮影
- 完了: ヘッドレスエミュレータ(adb tap+screencap)で地図(無料/塗り進行)・路線シート・統計の4枚を撮影し`docs/store/screenshots/`へ配置。PLAY_LISTING_DRAFT.mdのチェックリスト更新(Play Store最低2枚はクリア)。
- 決定: 称号/設定/シェア画像の3枚は撮影継続せず、実機かAndroid Studio通常GUIエミュレータでの撮影に切替判断。
- 残課題: 称号・設定・シェア画像・プレミアム色分け画面のスクショ(エミュレータのSystem UI ANRで撮影不可だったため要別環境)。Play Console側の手続き(AdMob/IAP/署名AAB/掲載情報入力)は`docs/GOOGLE_PLAY_HANDOFF.md`参照。

## 2026-09-07 提出準備の集約・公開条件の裏取り
- 完了: 提出物を`/Users/ken/Desktop/railmap-提出セット/`へ集約(AAB/画像/コピペ用テキスト)。PLAY_LISTING_DRAFTのポリシーURLを実在URL(https://adgrky.github.io/railmap/privacy.html・200確認済)へ訂正。8ステップの公開手順ガイドを作成。
- 決定: シリーズ5本同時ではなくrailmap 1本を先に通し切る方針。素材の分散(5階層)がケンの着手障壁だったため、以降のアプリも提出セット方式で集約する。
- 残課題: 【要確認】Playデベロッパーアカウントの作成日。2023-11-13以降の個人アカウントは製品版公開前に「テスター12人×14日連続」が必須(公式ヘルプ確認済・2024-12に20人→12人へ緩和)。支払いプロフィール登録状況も未確認。
