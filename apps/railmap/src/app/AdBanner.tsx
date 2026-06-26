// 広告バナー(画面下部・小)。premium(購入済) または地図タブ=聖域時は非表示。
// native(Capacitor) = AdMob(core の show/hide を呼ぶ。DOM は描画しない)。
// Web = Google AdSense バナー。SPEC §14.3。
// VITE_ADSENSE_CLIENT/VITE_ADSENSE_SLOT 未設定の間は Web では何も描画しない。
import { useEffect } from "react";
import { isNativeApp, showBanner, hideBanner } from "@fillmap/core";

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
const SLOT = import.meta.env.VITE_ADSENSE_SLOT as string | undefined;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdBanner({ hidden }: { hidden: boolean }) {
  useEffect(() => {
    // native: AdMob バナーの表示/非表示を切り替える(地図タブ=聖域や premium で hidden=true)
    if (isNativeApp()) {
      if (hidden) void hideBanner();
      else void showBanner();
      return;
    }
    // Web: AdSense
    if (hidden || !CLIENT || !SLOT) return;
    if (!document.querySelector("script[data-adsbygoogle]")) {
      const script = document.createElement("script");
      script.async = true;
      script.dataset.adsbygoogle = "1";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
    try {
      (window.adsbygoogle ??= []).push({});
    } catch {
      // 広告ブロッカー等は無視
    }
  }, [hidden]);

  // native バナーはネイティブレイヤが描画するため DOM は出さない
  if (isNativeApp()) return null;
  if (hidden || !CLIENT || !SLOT) return null;

  return (
    <div className="absolute inset-x-0 bottom-[56px] z-20 flex justify-center bg-bg" style={{ minHeight: 50 }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", maxWidth: 468, height: 50 }}
        data-ad-client={CLIENT}
        data-ad-slot={SLOT}
        data-ad-format="horizontal"
      />
    </div>
  );
}
