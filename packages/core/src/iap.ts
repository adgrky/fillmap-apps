// @fillmap/core 課金ファサード(SPEC §14.4)。買い切り(NON_CONSUMABLE)。
// native(Google Play) = cordova-plugin-purchase を動的 import で呼ぶ。
// Web = 何もしない(各アプリの Stripe+解除コード方式が担当)。
// premium 判定は generic.ts の isPremium を単一情報源として温存し、
// IAP は「premium フラグを立てる新しい解除手段」として接続する。
import { Capacitor } from "@capacitor/core";
import { setPremium } from "./generic";

export type IapConfig = {
  /** Google Play の買い切り商品ID(例 "railmap.premium")。 */
  productId: string;
  /** premium フラグの保存キー(アプリの保存キーと揃える。例 "railmap.v1")。 */
  storageKey: string;
  /** premium 確定時に呼ばれる(UI 即時更新用)。 */
  onUnlocked?: () => void;
};

let cfg: IapConfig | null = null;

function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * 課金を初期化(native時のみ)。商品登録と購入監視を開始し、main.tsx で1度呼ぶ。
 * 購入/復元が検証されると setPremium(storageKey) で premium フラグを立てる。
 */
export async function initIap(config: IapConfig): Promise<void> {
  cfg = config;
  if (!isNativeApp()) return;
  // cordova-plugin-purchase v13 は副作用 import でグローバル CdvPurchase を生やす。
  // @ts-expect-error 本プラグインはグローバル型(非モジュール)のため import の型解決を抑制
  await import("cordova-plugin-purchase");
  const { store, ProductType, Platform } = CdvPurchase;
  store.register({
    id: config.productId,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.GOOGLE_PLAY,
  });
  store
    .when()
    .approved((t: any) => t.verify())
    .verified((receipt: any) => {
      setPremium(config.storageKey);
      config.onUnlocked?.();
      receipt.finish();
    });
  await store.initialize([Platform.GOOGLE_PLAY]);
}

/** 買い切りを購入(native時のみ)。設定画面の購入ボタンから呼ぶ。 */
export async function purchasePremium(): Promise<void> {
  if (!isNativeApp() || !cfg) return;
  // @ts-expect-error グローバル型(非モジュール)のため import の型解決を抑制
  await import("cordova-plugin-purchase");
  const { store, Platform } = CdvPurchase;
  const product = store.get(cfg.productId, Platform.GOOGLE_PLAY);
  const offer = product?.getOffer();
  if (offer) await offer.order();
}

/** 購入を復元(再インストール時など)。native時のみ。 */
export async function restorePurchases(): Promise<void> {
  if (!isNativeApp()) return;
  // @ts-expect-error グローバル型(非モジュール)のため import の型解決を抑制
  await import("cordova-plugin-purchase");
  const { store } = CdvPurchase;
  await store.restorePurchases();
}
