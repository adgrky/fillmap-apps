# STORE_PIPELINE — Web→Google Play 配信手順(Capacitor)

埋め立て系アプリ(React+Vite+PWA)を **Capacitor** で Android アプリ化し Google Play で配信する共通手順。
railmap で確立(2026-06-25)。他アプリ(citymap 等)はこの手順をなぞる。差分は **appId / AdMob 広告ユニット / productId / 掲載文の4点**に収束させる(SPEC §14.7)。

---

## 0. 前提環境(確認済み・2026-06-25)

| 項目 | 値 |
|---|---|
| Node | v24 / npm v11 |
| **JDK** | **21 必須**(Capacitor 8 は JDK 21 を要求。JDK 17 では `エラー: 21は無効なソース・リリースです` で失敗)。Android Studio 同梱の JBR を使うのが確実: `/Applications/Android Studio.app/Contents/jbr/Contents/Home` |
| Android SDK | `~/Library/Android/sdk`(Android Studio 同梱) |
| 署名鍵 | iCloud `android-keys/`(パスワード等は同 README.txt) |
| Play デベロッパー登録 | 完了済 |

ビルド時は毎回 env を渡す:
```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
```

---

## 1. アプリへの Capacitor 導入

```sh
# 1) 依存(モノレポルートで -w <app>)。バージョンは latest を入れ package.json に記録させる
npm install -w <app> @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest
npm install -w <app> @capacitor-community/admob@latest cordova-plugin-purchase@latest

# 2) 定型ファイルを生成(capacitor.config.ts / vite分岐 / scripts / .gitignore / .env.example追記)
python3 tools/add_capacitor.py <app> "<アプリ名>" com.adgrky.<app>

# 3) ネイティブプロジェクト生成
cd apps/<app> && npm run build:app && npx cap add android
```

ハマりどころ:
- `@fillmap/core` の peer は `@capacitor/core: ">=6.0.0"`(メジャー追従)。狭い範囲だと `Conflicting peer dependency` になる。
- `cordova-plugin-purchase` はグローバル型(非モジュール)を提供する。`await import()` 行に `// @ts-expect-error` が必要(iap.ts 参照)。

---

## 2. 広告(AdMob / native のみ)

- AdMob で広告ユニットを作成 → `apps/<app>/.env` に `VITE_ADMOB_BANNER=ca-app-pub-...`。
- **AdMob アプリID は env 不可**。`android/app/src/main/AndroidManifest.xml` の `<application>` 内に直書き:
  ```xml
  <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
             android:value="ca-app-pub-XXXX~YYYY" />
  ```
- 開発・検証は Google 公式テストID で行う(アプリID `ca-app-pub-3940256099942544~3347511713` / バナー `ca-app-pub-3940256099942544/6300978111`)。`VITE_ADMOB_TEST=1` でテストモード。
- **地図タブ(コア体験)は広告ゼロの聖域**(App.tsx の `<AdBanner hidden={premium || tab==="map"} />`)。

---

## 3. 課金(買い切り / Google Play)

- Play Console → 収益化 → アプリ内アイテム で買い切り商品を作成(productId 例 `<app>.premium`)。
- `apps/<app>/.env` に `VITE_IAP_PRODUCT_ID=<app>.premium`。
- 実装は `@fillmap/core` の `initIap/purchasePremium/restorePurchases`。検証成功で `setPremium("<app>.v1")`。
- テスト購入: Play Console にライセンステスターを登録 → 内部テストトラックで購入(課金されない)。

---

## 4. ビルド & 署名

```sh
# デバッグビルド(動作確認)
cd apps/<app>/android && ./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk

# エミュレータ/実機で起動確認
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

リリース署名(AAB):
1. `apps/<app>/android/key.properties`(gitignore)を作成:
   ```
   storeFile=/Users/ken/Library/Mobile Documents/com~apple~CloudDocs/android-keys/<app>.keystore
   storePassword=…(README.txt 参照)
   keyAlias=…
   keyPassword=…
   ```
2. `android/app/build.gradle` に `signingConfigs.release`(key.properties 読み込み)を追加し、`buildTypes.release` に適用。`applicationId` を `com.adgrky.<app>` に一致させる。
3. ビルド:
   ```sh
   ./gradlew bundleRelease   # app/build/outputs/bundle/release/app-release.aab
   ```
4. 検証: `bundletool build-apks --bundle=app-release.aab --mode=universal` で APK 化し実機インストール起動。

---

## 5. ストア掲載(Play Console)

- アプリアイコン512(=`pwa-512x512.png`)/ アダプティブアイコン(=`maskable-icon-512x512.png` から生成)/ **フィーチャーグラフィック1024×500(新規作成)** / スクショ2枚以上。
- **プライバシーポリシー**: 広告あり(AdMob)に書き換え(広告ID収集ありを明記)。
- **データセーフティ回答**: 広告ID=収集あり / 位置情報=端末内のみ(送信なし) / アプリ内課金=あり。**虚偽申告はアプリ削除リスク**。

---

## 6. テストトラック昇格

内部テスト → クローズドテスト → 製品版。最初は内部テストで実機購入・広告表示を確認してから製品版へ。

---

## 7. 横展開チェックリスト(2本目以降)

新アプリの差分は理想的に以下4点のみ:
- [ ] `capacitor.config.ts` の appId / appName
- [ ] AndroidManifest の AdMob アプリID + `.env` の `VITE_ADMOB_BANNER`
- [ ] `.env` の `VITE_IAP_PRODUCT_ID`
- [ ] Play 掲載文(短説明・長説明・スクショ)

ads/iap の API は citymap 適用時に差分を確認してからフリーズ(早すぎる抽象化の回避 = 00_master §7-2)。
