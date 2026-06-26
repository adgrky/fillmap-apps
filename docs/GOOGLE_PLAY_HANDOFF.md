# Google Play 公開手続きガイド(ケン作業用・2026-06-25)

citymap・kokudomap・michimap・yamamapの4本について、コード側の準備(Capacitor化・署名・ストア素材)は完了済み。
ここからはGoogle側の管理画面操作とファイルの差し替えのみで、1人で進められる。railmapも同じ手順で残課題が同種(末尾に補足あり)。

---

## 0. 全体の流れ(この順番で進める)

1. [鍵の保管場所を確認](#1-署名鍵の場所だけ最初に確認)
2. [AdMobでアプリ登録・広告ユニット作成](#2-admob広告id取得アプリごとに2026-06-25時点で全アプリ未取得)
3. [取得したIDをファイルに反映](#3-取得したidをファイルに反映)
4. [プライバシーポリシーを公開](#4-プライバシーポリシーの公開)
5. [Play Consoleでアプリ作成・買い切り商品登録](#5-play-consoleでアプリ作成買い切り商品登録)
6. [署名付きAABをビルド](#6-署名付きaabをビルド)
7. [ストア掲載情報を入力](#7-ストア掲載情報を入力)
8. [内部テスト→本番提出](#8-内部テスト本番提出)

---

## 1. 署名鍵の場所(最初に確認するだけ)

| ファイル | 場所 |
|---|---|
| 鍵本体(4本分) | `~/Library/Mobile Documents/com~apple~CloudDocs/android-keys/citymap.keystore` `kokudomap.keystore` `michimap.keystore` `yamamap.keystore` |
| パスワード・エイリアス一覧 | 同フォルダの `README.txt` |
| 各アプリの参照設定 | `apps/<app>/android/key.properties`(すでに作成済み。鍵ファイルとパスワードを読み込む設定) |

**この4つのkeystoreファイルは絶対に削除・上書きしないこと。** 紛失するとそのアプリは二度とPlay Storeで更新できなくなる(別アプリとして再公開するしかない)。iCloud経由でバックアップされているので、それ以上の追加対応は不要。

---

## 2. AdMobで広告ID取得(アプリごとに。2026-06-25時点で全アプリ未取得)

[AdMob管理画面](https://apps.admob.com/) で、**4本それぞれ**について以下を行う。

1. 「アプリを追加」→ Android → 「Google Playで公開されていますか？」は **いいえ**(まだ未公開のため)
2. アプリ名はストア表示名と合わせる(例: 市区町村塗りつぶしマップ)
3. 作成すると **アプリID**(`ca-app-pub-xxxxxxxxxx~yyyyyyyyyy` の形式)が発行される
4. そのアプリ内で「広告ユニットを追加」→ **バナー** を選択 → **広告ユニットID**(`ca-app-pub-xxxxxxxxxx/zzzzzzzzzz` の形式)が発行される

4本分、アプリID・広告ユニットIDのペアをメモしておく(railmapは取得済み。`apps/railmap/.env` と `apps/railmap/android/app/src/main/AndroidManifest.xml` が実例)。

---

## 3. 取得したIDをファイルに反映

各アプリで2ファイルを編集する(`<app>` は citymap / kokudomap / michimap / yamamap)。

### 3-1. `apps/<app>/android/app/src/main/AndroidManifest.xml`

現在は暫定でGoogle公式テストIDが入っている箇所を、取得した**アプリID**に書き換える。

```xml
<!-- 書き換え前(暫定テストID) -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713" />
```
↓
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="(取得した本物のアプリID)" />
```

### 3-2. `apps/<app>/.env`(すでにファイルはあるので追記・編集)

```
VITE_ADMOB_BANNER=(取得した広告ユニットID)
VITE_IAP_PRODUCT_ID=<app>.premium
```

`VITE_ADMOB_TEST=1` の行があれば削除する(本番IDに切り替えるため)。

> このファイルは4本とも現状 `VITE_ADMOB_TEST=1` のみが入った仮の状態(テスト広告が出るだけで実害はない)。実際にPlay Storeに出す前に必ず本物のIDへ差し替えること。

---

## 4. プライバシーポリシーの公開

各アプリのプライバシーポリシー(`privacy.html`)は作成済みで、公開用のリポジトリにもコピー済み。**あとはpushするだけ**。

| アプリ | 公開予定URL | コピー済みファイル |
|---|---|---|
| citymap | https://adgrky.github.io/citymap/privacy.html | `~/Desktop/クロード/citymap/public/privacy.html` |
| kokudomap | https://adgrky.github.io/kokudomap/privacy.html | `~/Desktop/クロード/kokudomap/public/privacy.html` |
| michimap | https://adgrky.github.io/michimap/privacy.html | `~/Desktop/クロード/michimap/public/privacy.html` |
| yamamap | https://adgrky.github.io/yamamap/privacy.html | `~/Desktop/クロード/yamamap/public/privacy.html` |

手順(4本とも同じ):
```sh
cd ~/Desktop/クロード/<app>
git add public/privacy.html
git commit -m "add privacy policy"
git push
```
push後、数分でGitHub Pagesに反映される。実際に上記URLをブラウザで開いて表示されることを確認してからPlay Consoleに登録する。

---

## 5. Play Consoleでアプリ作成・買い切り商品登録

[Play Console](https://play.google.com/console/) で、**4本それぞれ**について:

1. 「アプリを作成」→ パッケージ名は **必ず一致させる**:
   - citymap → `com.adgrky.citymap`
   - kokudomap → `com.adgrky.kokudomap`
   - michimap → `com.adgrky.michimap`
   - yamamap → `com.adgrky.yamamap`
2. 「収益化」→「商品」→「アプリ内アイテム」→ 買い切り商品を作成
   - productId は **`.env` に書いた `VITE_IAP_PRODUCT_ID` の値と完全一致させる**(`citymap.premium` など)
   - 価格は¥300〜600あたりで仮決め(各app の `docs/store/PLAY_LISTING_DRAFT.md` 参照、要確定)
3. プライバシーポリシーURL欄に、手順4で公開したURLを入力

---

## 6. 署名付きAABをビルド

手順3でファイルを書き換えた後、各appで以下を実行(JDK21が必要。詳細は `docs/STORE_PIPELINE.md` 参照):

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
cd ~/Desktop/クロード/fillmap-apps/apps/<app>
npm run build:app
npx cap sync android
cd android
./gradlew bundleRelease
```

生成物: `apps/<app>/android/app/build/outputs/bundle/release/app-release.aab`
→ これをPlay Consoleの「テストとリリース」→「内部テスト」にアップロードする。

(動作確認だけしたい場合は `./gradlew assembleDebug` でAPKを作り、`adb install` で実機/エミュレータに入れて確認できる。)

---

## 7. ストア掲載情報を入力

各appの掲載文・素材は作成済み。そのまま使うか、文面を見て調整してから貼り付ける。

| アプリ | 掲載文・データセーフティ回答ドラフト | フィーチャーグラフィック(1024×500) |
|---|---|---|
| citymap | `apps/citymap/docs/store/PLAY_LISTING_DRAFT.md` | `apps/citymap/docs/store/feature_graphic.png` |
| kokudomap | `apps/kokudomap/docs/store/PLAY_LISTING_DRAFT.md` | `apps/kokudomap/docs/store/feature_graphic.png` |
| michimap | `apps/michimap/docs/store/PLAY_LISTING_DRAFT.md` | `apps/michimap/docs/store/feature_graphic.png` |
| yamamap | `apps/yamamap/docs/store/PLAY_LISTING_DRAFT.md` | `apps/yamamap/docs/store/feature_graphic.png` |

各 `PLAY_LISTING_DRAFT.md` の中に：
- 短い説明・詳しい説明(コピペ用)
- データセーフティフォームの回答例(広告ID収集ありなど、虚偽申告にならない回答)
- 末尾の「未確定・要ケン判断の項目」(カテゴリ選択・価格・プレミアム機能の最終確認など)

スクリーンショットは未撮影。各appをエミュレータか実機で動かして、地図画面・タップ時のシート・統計/称号画面・設定画面の縦長(9:16)スクショを2枚以上(推奨8枚まで)用意する。

---

## 8. 内部テスト→本番提出

1. 手順6で作ったAABを「内部テスト」トラックにアップロード
2. 「設定」→「ライセンステスト」に自分のGoogleアカウントを登録(課金されずに購入テストできる)
3. 内部テストのリンクから実機にインストールし、広告表示・買い切り購入・復元ボタンの動作を確認
4. 問題なければ「製品版」へ昇格(Googleは新規開発者アカウントだとクローズドテストを経由するよう求める場合がある)

---

## 補足: 4本共通の進捗(2026-06-26更新)

- **プレミアム機能の実装は4本とも完了済み**: citymap=消滅自治体(総務省データ)、kokudomap=海上国道・点線国道タグ(国交省/Wikipedia公式データ)、michimap=地方ブロック別カラー表示、yamamap=二百名山・三百名山データ。ブラウザプレビューで動作確認済み(各app `docs/PROGRESS.md` 参照)。
- 残るコード側のタスクはスクリーンショット撮影のみ。それ以外(Capacitor配線・広告/課金の枠組み・署名・ストア素材・プレミアム機能)はすべて完了済み。ここからは本ガイドの手順2以降、Google側の管理画面操作が中心。

## 補足: railmap(塗り鉄)について

railmapはこのガイドの手順2〜3にあたる部分(AdMobアプリID・広告ユニットID取得)が**ケンの方で既に完了済み**(`apps/railmap/.env` と `AndroidManifest.xml` に実IDが入っている)。`apps/railmap/android/key.properties` も作成済み。
残っているのは手順4(プライバシーポリシーのpush)以降、つまりPlay Console側の商品登録・ビルド・ストア掲載・テスト・提出のみ。
