# NOTELOG — fillmap-apps 開発素材ログ

> 開発過程の「やったこと・詰まったこと・解決法」を作業のたびに記録する。
> 形式は `docs/41_notelog_spec.md` §3 厳守(1エントリ最大7行)。記事化の素材。
> モノレポ1冊集約・見出しの「| アプリ名 |」で区別。

---

### 2026-06-18 | fillmap-apps | モノレポ昇格(railmap→工場)
- やったこと: 線路アプリを apps/railmap へ移植、src/core を packages/core(@fillmap/core)へ昇格。npm workspaces + vite alias でソース直参照
- 詰まり: なし(ビルド/型チェック/実機の地図描画すべて一発通過) 📷
- 記事ネタ度: ★★ / タグ: #モノレポ #npm-workspaces #vite

### 2026-06-18 | fillmap-apps | NOTELOG基盤の組み込み
- やったこと: 41_notelog_spec.md を docs へ、CLAUDE.md に NOTELOGルール§2ブロックを追記、本ファイルを作成
- 詰まり: なし
- 記事ネタ度: ★ / タグ: #運用 #note素材化

### 2026-06-18 | citymap | 2本目骨格 + core汎用層の線引き
- やったこと: POLYGONモードでcitymap骨格を実装(レベル制0-5/スコア/称号/保存)。汎用部品(createPersistence等)を @fillmap/core/generic に新設し実証
- 詰まり: 汎用層をバレルに足すと既存rail版と名前衝突(formatRatio等) → サブパス export "./generic" で分離し railmap 無傷を維持で解決
- 記事ネタ度: ★★★ / タグ: #モノレポ #早すぎる抽象化 #2本目で線引き 📷

### 2026-06-19 | citymap | P2 スコア演出・称号一覧・リスト入力 📷
- やったこと: アニメカウンター(rAFベース)/スコアバーフラッシュ/称号一覧シート/地図↔リストタブ切替/都道府県アコーディオン一括入力を実装
- 詰まり: なし
- 記事ネタ度: ★★ / タグ: #UX #アコーディオン #タブ切替

### 2026-06-19 | citymap | N03前処理 + 全国データ化(P0) 📷
- やったこと: N03 SHP(242MB)を都道府県別バッチ処理で全国1905自治体geojson生成。tolerance+座標4桁丸めで10.86MB(gzip 1.77MB)
- 詰まり: GeoJSONまるごとロード → OOM kill(exit 137) → SHPバッチ方式に切り替えで解決。rglob が _prefecture を先に拾う誤りも修正
- 記事ネタ度: ★★★ / タグ: #N03 #geopandas #OOM #座標丸め

### 2026-06-18 | citymap | 地図の自動フィット
- やったこと: FeatureCollectionのbbox計算→fitBoundsを実装(turf不使用)。サンプル東京/本番全国どちらも適切に収まる
- 詰まり: 初期zoom固定だと6区が点になり操作不能 → bbox自動フィットで解決
- 記事ネタ度: ★★ / タグ: #maplibre #GeoJSON

### 2026-06-19 | citymap | P2 シェア画像・PWAアイコン・vite.config完成
- やったこと: maplibre canvas合成シェア画像(§E5 📤ボタン/Web Share API→fallback download)、Pillow製192×512pxアイコン生成、manifest.iconsを実ファイルへ差し替え
- 詰まり: workbox.maximumFileSizeToCacheInBytes 10MB < cities.geojson 11.4MB でビルドエラー → 15MBに引き上げで解決
- 記事ネタ度: ★★ / タグ: #PWA #シェア画像 #Web-Share-API #canvas合成

### 2026-06-19 | fillmap-apps | railmap を @fillmap/core/generic へ移行
- やったこと: packages/core の鉄道固有コード(6ファイル)を apps/railmap/src/domain/ へ移動。core/index.ts は generic 再エクスポートのみに整理。railmap の vite.config に generic alias を追加
- 詰まり: vite が `@fillmap/core/generic` を解決できず ENOTDIR → vite.config.ts の alias に generic エントリを追加で解決
- 記事ネタ度: ★★ / タグ: #モノレポ #core抽出 #汎用/固有の線引き

### 2026-06-19 | fillmap-apps | 新アプリ雛形ツール tools/create_app.py
- やったこと: `python tools/create_app.py <appId> <アプリ名>` で新アプリ骨格(15ファイル)を自動生成。型チェック通過を確認
- 詰まり: なし
- 記事ネタ度: ★ / タグ: #自動化 #雛形

### 2026-06-19 | citymap | 地方ブロック8分割遅延ロード(SPEC §A1 P0完了) 📷
- やったこと: cities.geojson(11.4MB)を8地方ブロックに分割(最大2.4MB)。MapViewをmanifest.json+viewport intersection判定による逐次ロードに書き換え。旧単一ファイルはフォールバックとして残存。
- 詰まり: allFeatures の TypeScript 型が GeoJSON.Feature に合わず TS2322 → `any[]` に緩和で解決
- 記事ネタ度: ★★★ / タグ: #パフォーマンス #遅延ロード #GeoJSON #maplibre 📷

### 2026-06-19 | citymap | 振り返り年表タブ(SPEC §A1 W5) 📷
- やったこと: YearTab.tsx 新設。visits の firstDate 年別グループ化→都道府県別サブグループ→レベルドット付きチップ表示。日付なしは「日付不明」に分類。3つ目のタブとして追加
- 詰まり: なし
- 記事ネタ度: ★★ / タグ: #振り返り #年表 #W5

### 2026-06-19 | citymap/railmap | 配色修正・年表月対応・広告除外導線
- やったこと: citymap LEVELS配色を色相分離(青/緑/黄/橙/赤)に変更し視認性改善。YearTabを年→月二階層化(citymap/railmap両方)。railmapに年表タブを新設(5タブ目)。@fillmap/core/genericにisPremium/redeemPremiumCode追加、両アプリにAdBanner(AdSense)と広告除外コード入力UIを実装。SPEC.mdに「外部送信なし」原則の例外(AdSense・Stripe決済リンクのみ)を明記
- 詰まり: 古い`.claude/launch.json`(クロード親フォルダ)に同名"railmap"設定があり/Users/ken/Downloads/線路アプリという別コピーを誤起動 → fillmap-apps側の専用設定名"fillmap-railmap"で起動し直して解決
- 記事ネタ度: ★★ / タグ: #UI改善 #年表 #マネタイズ #AdSense #Stripe

### 2026-06-22 | railmap | 地図タブの広告ゼロ方針を修正・keystore復元
- やったこと: AdBanner(App.tsx)が地図タブでも表示される実装ミスを発見、hidden条件に`tab === "map"`を追加して方針(地図タブ=広告ゼロ)に一致させた。iCloudのrailmap.keystoreをandroid-twa/android.keystoreへ復元(TWAビルド前提条件)
- 詰まり: なし
- 記事ネタ度: ★ / タグ: #マネタイズ #AdSense #バグ修正

### 2026-06-22 | citymap | GitHub Pages公開(単体リポジトリ切り出し) 📷
- やったこと: apps/citymapを単体リポジトリ adgrky/citymap(public)へ切り出し。@fillmap/core/genericはsrc/core/generic.tsへ複製してworkspace依存を解消。GitHub Actions(.github/workflows/deploy.yml)でmain push時に自動build→Pages(build_type=workflow)へ公開。https://adgrky.github.io/citymap/ で稼働確認
- 詰まり: 切り出し作業中にMac本体のディスク空き容量が731MBまで枯渇(tools/raw/の生GISデータを誤ってコピー対象に含めたため) → ケンが手動でディスク整理、tools/rawを除外して再実施し解決
- 記事ネタ度: ★★★ / タグ: #GitHubPages #公開 #モノレポ切り出し #ディスク容量

### 2026-06-23 | yamamap | 3本目アプリ・POINTモード新設(SPEC §E2/§A2) 📷
- やったこと: 百名山100座を「日本百選と座標値」CSVから curate→preprocess_point.py で GeoJSON化(出典明記・3000m峰13座)。citymap骨格を流用しfill層→circle層+グロー+波紋アニメ(W1)に置換。登頂トグル/累計標高スコア/称号6種/リスト一括/年表/シェア/PWAを実装。dev実機で登頂→保存→リロード維持を確認
- 決定: POINTモードはレベル制を持たず visits 在不在で登頂判定。preprocess_point.py は今後の道の駅・城など全POINT系で共用
- 詰まり: 生CSVがcp932かつ環境依存文字(半角中黒)混入でiconv失敗 → Pythonのcp932デコードで処理し解決
- 記事ネタ度: ★★★ / タグ: #POINTモード #百名山 #データ前処理 #maplibre #量産

### 2026-06-23 | michimap | 4本目アプリ・道の駅(POINT+クラスタリング SPEC §A3) 📷
- やったこと: 国土数値情報P35-18から道の駅1,145駅を curate_michimap.py→preprocess_point.py でGeoJSON化(47都道府県)。yamamap骨格を流用しfill→circle+クラスタ機能(500超§E2)に。訪問トグル=朱色スタンプ演出、残り駅数スコア、称号5種、出典P35明記。dev実機でクラスタ表示・リスト訪問・保存・称号デビューを確認
- 決定: クラスタ円は点数サイズで表示(数値は glyphフォント未導入のためv2送り)。テーマ=orange
- 詰まり: なし(yamamap資産の流用で型エラーゼロ)
- 記事ネタ度: ★★ / タグ: #クラスタリング #道の駅 #国土数値情報 #量産

### 2026-06-23 | kokudomap | 5本目アプリ・国道(LINE/OSM SPEC §A5) 📷
- やったこと: OSM Overpassから国道436本を取得(network=JP:national)、preprocess_road.pyでref番号集約+MultiLineString化。railmap骨格を流用しLINE描画・光走りアニメ・距離スコア・称号8種・統計簡素化。dev実機で走破→青点灯・全国4.8%/3247km・地球一周換算・国道デビュー解除を確認
- 決定: 1国道=1 MultiLineStringに集約しlines.geojsonを29MB→5.6MBへ圧縮(feature数14万→436)。railType="国道"単一でrailmap型を流用
- 詰まり: Overpass一括取得が49MBで途中切断(transfer closed) → ref番号5レンジ分割+User-Agent付与で解決。406はcurlのUA無しが原因
- 記事ネタ度: ★★★ / タグ: #LINEモード #国道 #OSM #Overpass #ODbL #量産完了

### 2026-06-23 | shiromap | 6本目・100名城(POINT/§A4) 📷
- やったこと: 城郭協会100名城(shiro02.csv)をcurate_castles.pyで現存12天守・国宝タグ付与→preprocess_point.py。yamamap骨格流用で攻略文言・金テーマ・称号5種。dev実機で攻略5城金点灯・スコア5/100・保存反映を確認
- 決定: v1は100名城のみ(続100名城はデータ未入手→v2)。POINTアプリのコピー量産フロー(cp yamamap/src→型rename→データ差替)が定着
- 詰まり: cp先をsrc/にして app/*.tsx がsrc直下に散らばった → mvでsrc/app/へ移動して解決
- 記事ネタ度: ★★ / タグ: #100名城 #POINT量産 #タグ多層達成率

### 2026-06-23 | onsenmap | 7本目・温泉(POINT/§A6)
- やったこと: 日本百名湯(onsen02.csv)をcurate_onsen.py→preprocess。shiromap骨格流用で入湯文言・朱テーマ・湯けむり風波紋・称号4種。dev実機で入湯3湯朱点灯・3/100・保存反映を確認
- 決定: 元データに泉質が無く泉質別達成率はv2。POINT量産は1本あたりcp+型rename+データ差替で短時間化
- 詰まり: なし
- 記事ネタ度: ★ / タグ: #温泉 #百名湯 #POINT量産

### 2026-06-25 | railmap | TWA→Capacitor 切替でネイティブアプリ化 📷
- やったこと: Capacitor8でrailmapをAndroidアプリ化。packages/coreに広告(AdMob)/課金(Play買い切り)ファサードを追加しisNativePlatformでWeb/アプリ分岐。CAP_BUILD分岐でアプリ版はPWA無効・base=/。デバッグAPK生成→エミュレータで地図描画・タブUIを確認(クラッシュなし)
- 詰まり: ①Capacitor8はJDK21必須(JDK17だと「21は無効なソース・リリースです」)→Android Studio同梱JBRで解決 ②cordova-plugin-purchaseはグローバル型(非モジュール)でdynamic importが型エラー→@ts-expect-error ③@fillmap/core peerの@capacitor/core範囲が狭く衝突→>=6.0.0 ④旧署名の同package残存でinstall失敗→adb uninstall
- 記事ネタ度: ★★★ / タグ: #Capacitor #TWAやめた #AdMob #Play課金 #JDK21 #ストア配信

### 2026-06-25 | railmap | プレミアム機能=種別カラー塗り分け実装 📷
- やったこと: 既存データの railType プロパティを使い、買い切り解放時に乗車済路線を新幹線/JR/私鉄/地下鉄/路面で5色に塗り分けるmatch式を追加。無料は単色のまま。地図上部に凡例表示
- 詰まり: line-gradientはline-progressのみ参照可能でfeatureプロパティ(railType)を使えない→もともと単色固定で実質不要だったline-gradientを撤去しline-colorのデータ式に統一して解決
- 記事ネタ度: ★★ / タグ: #MapLibre #データ駆動スタイリング #プレミアム機能

### 2026-06-25 | citymap/kokudomap/michimap/yamamap | Capacitor導入(railmap手順の横展開) 📷
- やったこと: railmapで確立したSTORE_PIPELINE.md手順を4本に横展開。add_capacitor.py実行→vite CAP_BUILD分岐→AdBanner/main/Settingsのnative分岐→cap add android→デバッグAPK生成。4本ともエミュレータでクラッシュなし・地図描画・購入導線を確認
- 詰まり: kokudomap/michimapは初回起動時にスプラッシュが長め(国道網436本・道の駅1145点の初期ロードで10秒超)→単なる読込待ちでクラッシュではないと確認して解決
- 決定: AdMobアプリIDは4本ともGoogle公式テストIDを暫定設定(本番IDはケンのAdMob取得待ち)
- 記事ネタ度: ★★ / タグ: #Capacitor #横展開 #量産フロー #AdMob

### 2026-06-25 | citymap/kokudomap/michimap/yamamap | 署名鍵発行・署名付きAAB・ストア素材一式 📷
- やったこと: 4本分のkeystoreを新規発行(iCloud保管・README追記)、build.gradleにrailmapと同じsigningConfigsを追加。`bundleRelease`で4本とも署名付きAAB生成を確認。@resvg/resvg-jsでSVG→PNGのフィーチャーグラフィック(1024×500)を4本分生成、privacy.html・PLAY_LISTING_DRAFT.mdも作成
- 詰まり: SVG→PNG変換でcairosvgはmacOSにcairoライブラリが無く失敗、qlmanageは1024×1024正方形にパディングされアスペクト比が崩れる→@resvg/resvg-js(Rust製・系統依存なし)でfitTo width指定により1024×500ぴったり出力できて解決
- 記事ネタ度: ★★★ / タグ: #Android署名 #keystore #SVGtoPNG #resvg #ストア素材量産

### 2026-06-26 | citymap | 消滅自治体プレミアム機能(SPEC §11) 📷
- やったこと: 総務省「市町村名逆引き一覧」(47都道府県ページ)をtools/curate_dissolved.pyでパース→平成の大合併で消えた旧市町村1805件抽出→現行1905自治体への名称マッチで1798件に座標付与→dissolved.json生成。MapViewにpremium限定のdissolved-pointsレイヤー追加、タップでDissolvedSheet表示
- 詰まり: ①Geoshape歴史的行政区域データセットは1888年からの全履歴で対象データの絞り込みが困難→総務省の平成大合併専用の逆引き一覧に切替で解決 ②全47都道府県ページのtr正規表現が`<tr>`厳格一致で8県分しか取れず→`<tr[^>]*>`に緩めて47県分(1805件)取得できて解決 ③旧市町村名に郡名が前置(例: 亀田郡　大野町)され現行データの名称と不一致→郡名部分を分離して名称マッチ
- 記事ネタ度: ★★★ / タグ: #データスクレイピング #市町村合併 #総務省オープンデータ #プレミアム機能

### 2026-06-26 | kokudomap | 国道トリビアタグ プレミアム機能(SPEC §11) 📷
- やったこと: 「酷道」の定番ランキングはroute01.comの個人評価で転載に許可が必要と判明→著作権リスクを避け、公式データ(Wikipedia海上国道29路線/国交省道路データブック点線国道16路線)に切替。domain/roadTags.tsの静的Setで判定、LineSheetにpremium限定バッジ表示
- 詰まり: 当初の酷道5段階ランキング(route01.com)は「転載に管理者の許可が必要」と明記された個人著作物だった→ケンに確認のうえ採用見送り、国土交通省の公式統計(交通不能区間)に切替で著作権問題なく解決
- 記事ネタ度: ★★★ / タグ: #著作権チェック #オープンデータ #国土交通省 #海上国道

### 2026-06-26 | michimap | 地方ブロック別カラー表示 プレミアム機能(SPEC §11) 📷
- やったこと: 標準8地方区分のpref→regionマッピングをdomain/regions.tsに定義、premium時にMapViewのGLOW/BASE層をmatch式で地方別塗り分けに切替。地図上に凡例表示。railmapの種別カラー塗り分けと同パターンで新規データ取得なしに実装
- 詰まり: maplibreの型上、case式にDataDrivenPropertyValueSpecification型の式を埋め込むとTSが配列リテラルの型推論で衝突→circle-color全体を関数化してas unknown経由でキャストし解決
- 記事ネタ度: ★★ / タグ: #MapLibre #データ駆動スタイリング #量産パターン流用

### 2026-06-26 | yamamap | 二百名山・三百名山 プレミアム機能(SPEC §11) 📷
- やったこと: 既存の百名山データ出典(100sen.cyber-ninja.jp、自由使用可)が二百名山・三百名山CSVも提供していることを確認、tools/curate_extra_peaks.pyで取得・整形しpublic/data/extra_peaks.json(201座)を生成。premium時のみ地図に別レイヤー追加、本体のスコア/称号からは分離
- 詰まり: なし(既存ソースの延長で取得でき、citymapの消滅自治体パターンを流用できたため詰まりなし)
- 記事ネタ度: ★★ / タグ: #データソース再利用 #量産パターン流用 #著作権チェック

### 2026-06-26 | 全4アプリ | プレミアム機能 実機代替確認(ブラウザプレビュー) 📷
- やったこと: citymap消滅自治体・kokudomap国道タグ・michimap地方カラー・yamamap二百三百名山を、エミュレータの代わりにdevサーバ+preview_evalでmaplibreのqueryRenderedFeatures/projectを使い正確な座標をクリックして全機能の見た目とシート表示を確認。4アプリ全てtsc --noEmitもクリーン
- 詰まり: ピクセル座標の当てクリックでは細い国道線・小さい点に当たらず外れ続けた→map.queryRenderedFeaturesで対象フィーチャの座標を取得しmap.project()で画面座標に変換してからクリックする方式に切替えて解決
- 記事ネタ度: ★★★ / タグ: #エミュレータ不要の検証手法 #maplibre #ブラウザプレビュー活用

| 2026-09-07 | railmap | 提出準備集約・公開条件確認 | 2ヶ月の停止から復帰。提出物が5階層に分散していたためデスクトップ直下へ集約。PLAY_LISTING_DRAFTのポリシーURLが`fillmap-apps/privacy.html`(404)だったのを`adgrky.github.io/railmap/privacy.html`(200)へ訂正。個人アカウントのテスター12人×14日要件を公式ヘルプで裏取り。 | 停止原因はコードではなく管理画面の情報設計。以降は提出セット方式で集約する。 |

| 2026-09-07 | citymap/kokudomap/michimap/yamamap | プライバシーポリシー4本公開 | `public/privacy.html`が未コミットのまま放置されていたためpush。GitHub Actionsのビルドを経て`https://adgrky.github.io/<app>/privacy.html`で200を確認。各PLAY_LISTING_DRAFTのURL欄を「要発行」から実URLへ更新。 | Pages公開の仕組みは4本とも生きていた。止まっていたのはpushだけ。 |
| 2026-09-07 | railmap | 掲載文と実装の不一致を修正 | 詳しい説明の「都道府県別・路線種別の達成率」のうち、都道府県別は`meta.json`の`pref`が全て`[]`で未実装。StatsPanelにも「都道府県データは Phase 2 で追加予定」が実画面に露出。掲載文から都道府県別を削除し路線種別のみに。 | 掲載文が実機能を上回るとストア審査リスク。画面内の開発用語露出は要対処(ケン判断待ち)。 |
| 2026-09-07 | railmap | スクショのPlay要件違反を修正 | 1080x2400は「長辺が短辺の2倍以内」に違反しアップロード時に弾かれる。左右に背景色パディングして1200x2400(比2.0)へ。積立カレンダー8枚も同様に修正。 | 公式ヘルプで要件を確認。9:16は推奨であり必須ではないが、2倍以内は必須。 |

| 2026-09-07 | railmap | 都道府県別データを実装 | N03全国版は611MBで空きディスク3.2GBを圧迫するため、都道府県別(各数MB〜)を1件ずつDL→ポリゴン化→即削除する方式に。597路線全てに付与、47県カバー。既知路線3本で検算一致。 | 全国版一括DLは空き容量を見てから判断する。 |
| 2026-09-07 | railmap | ステータスバー重なりを修正 | Android 15+ は edge-to-edge が既定。viewport-fit=cover はあったが env(safe-area-inset-*) 未使用で、時刻表示と達成率バーが重なっていた。上部バーと下部nav・全パネルに safe-area を追加。 | 6月撮影のスクショはこの不具合が写ったまま提出直前だった。 |
| 2026-09-07 | railmap | 広告がタブバーを覆う問題を修正 | AdMobバナーはネイティブ層に描画されタブが押せない状態だった。showBanner の margin で試みたが無効: `int densityMargin = (int)(adOptions.margin * density);` の後に Android 15+ 用 WindowInsets リスナーが `setMargins(0,0,0,bottomInset)` で上書きしていた(BannerExecutor.java)。バナー実高さを購読して nav/パネルの bottom を上げる方式で解決。📷 | プラグインの margin は Android 15+ で信用できない。 |
| 2026-09-07 | fillmap-apps | dev サーバーの参照先ずれを修正 | `npm run dev -w railmap` が PATH 解決に失敗し `~/Downloads/線路アプリ/node_modules/.bin/vite` を起動していた(sh: vite: command not found の後、古いプロジェクトを配信)。launch.json を `npm exec -w <app> -- vite apps/<app>` 方式へ変更。 | 修正が反映されない時はサーバーの実行体を lsof/ps で確認する。 |
| 2026-09-07 | fillmap-apps | dev サーバー参照先ずれの原因を訂正 | 前エントリで「launch.json を修正」と書いたが、実際に読まれていたのは `~/Desktop/クロード/.claude/launch.json`(プロジェクトルート側)の `railmap` エントリで、`--prefix /Users/ken/Downloads/線路アプリ` を指していた。モノレポ版は別名 `fillmap-railmap` で登録されていたため気付きにくかった。同フォルダをゴミ箱へ移した後、`railmap` エントリを fillmap-apps 指定へ修正し、起動・データ配信(pref付与済み meta.json)を確認。 | 設定ファイルは「直した場所が読まれているか」を起動プロセスで検証する。 |
| 2026-09-07 | railmap | 全消去が保存に反映されない不具合を修正 | 他の操作は store の persist ヘルパー経由で saveData が走るが、全消去だけ `useRailStore.setState` 直呼びで保存されず、再起動で記録が復活していた。`saveData(cleared)` を追加。実機検証: 158件→0件、再起動後も0件。📷 | Playデータセーフティで「削除手段あり」と申告する前に実装の裏を取ったことで発見。 |
| 2026-09-07 | railmap | データ削除の案内ページを公開 | Playのデータセーフティで削除用URLの入力が必須だったため、gh-pages へ data-deletion.html を直接追加(GitHub API経由)。https://adgrky.github.io/railmap/data-deletion.html で200確認。 | アカウント機能が無くてもURLを求められる場合がある。 |
