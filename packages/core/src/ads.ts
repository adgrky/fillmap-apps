// @fillmap/core 広告ファサード(SPEC §14.3)。プラットフォーム非依存。
// native(Capacitor/Android) = AdMob を動的 import で呼ぶ。
// Web = 何もしない(各アプリの AdBanner が AdSense を描画する)。
// 各アプリは show/hide を呼ぶだけにして横展開可能にする。
import { Capacitor } from "@capacitor/core";

export type AdConfig = {
  /** AdMob バナー広告ユニットID(native)。未設定なら表示しない。 */
  bannerId?: string;
  /** AdMob 全画面広告ユニットID(native、任意)。 */
  interstitialId?: string;
  /** テスト広告を出すか(開発時は true)。 */
  testMode?: boolean;
};

let cfg: AdConfig = {};

/** native アプリ(Capacitor)で動作中か。Web/アプリ分岐の単一判定。 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** AdMob を初期化(native時のみ)。main.tsx で1度だけ呼ぶ。 */
export async function initAds(config: AdConfig): Promise<void> {
  cfg = config;
  if (!isNativeApp()) return;
  const { AdMob } = await import("@capacitor-community/admob");
  await AdMob.initialize({ initializeForTesting: !!cfg.testMode });
}

/** バナーを表示(native時のみ。Webは AdBanner が描画するため何もしない)。 */
export async function showBanner(): Promise<void> {
  if (!isNativeApp() || !cfg.bannerId) return;
  const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
  await AdMob.showBanner({
    adId: cfg.bannerId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    isTesting: !!cfg.testMode,
  });
}

/**
 * バナーの実高さ(dp)の変化を購読する(native時のみ)。0 = 非表示。
 * バナーはネイティブ層に描画され WebView の上に重なるため、この高さぶん
 * アプリ側の下端(タブバー等)を持ち上げないとタブが覆われて押せなくなる。
 * showBanner の margin では解決しない: プラグインは Android 15+ で
 * WindowInsets リスナーにより margin を上書きするため(BannerExecutor.java)。
 */
export async function onBannerHeightChange(
  cb: (heightDp: number) => void,
): Promise<() => void> {
  if (!isNativeApp()) return () => {};
  const { AdMob, BannerAdPluginEvents } = await import("@capacitor-community/admob");
  const handles = await Promise.all([
    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: { height: number }) =>
      cb(info.height ?? 0),
    ),
    AdMob.addListener(BannerAdPluginEvents.Closed, () => cb(0)),
  ]);
  return () => {
    for (const h of handles) void h.remove();
  };
}

/** バナーを隠す(native時のみ)。地図タブ=聖域や premium 時に呼ぶ。 */
export async function hideBanner(): Promise<void> {
  if (!isNativeApp()) return;
  const { AdMob } = await import("@capacitor-community/admob");
  try {
    await AdMob.hideBanner();
  } catch {
    // 未表示状態での hide は無視
  }
}

/** 全画面広告を表示(native時のみ・任意)。自然な区切りで低頻度に呼ぶ。 */
export async function showInterstitial(): Promise<void> {
  if (!isNativeApp() || !cfg.interstitialId) return;
  const { AdMob } = await import("@capacitor-community/admob");
  await AdMob.prepareInterstitial({ adId: cfg.interstitialId, isTesting: !!cfg.testMode });
  await AdMob.showInterstitial();
}
