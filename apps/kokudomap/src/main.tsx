import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";
import { App } from "./app/App";
import { initAds, initIap, isNativeApp, initAnalytics } from "@fillmap/core";

// PVのみの軽量計測(§8-1)。サイトコード未設定時は何も送らない(プライバシー既定)。
initAnalytics(import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined);

// native(Capacitor)時のみ広告(AdMob)・課金(Google Play)を初期化する(SPEC §14.3/§14.4, railmap同様)。
if (isNativeApp()) {
  const testMode = import.meta.env.DEV || import.meta.env.VITE_ADMOB_TEST === "1";
  void initAds({
    bannerId: import.meta.env.VITE_ADMOB_BANNER as string | undefined,
    testMode,
  });
  void initIap({
    productId: (import.meta.env.VITE_IAP_PRODUCT_ID as string) || "kokudomap.premium",
    storageKey: "kokudomap.v1",
    onUnlocked: () => window.dispatchEvent(new Event("kokudomap:premium-unlocked")),
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
