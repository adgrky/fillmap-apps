// @fillmap/core 計測層(§8-1)。GoatCounter を使ったPVのみの軽量計測。
// 設計原則(W4信頼設計と整合):
//   - サイトコード未注入なら「一切何も送信しない」(完全無効)
//   - 送るのはページパスのみ。個人データ・操作内容・Cookie は送らない
//   - 失敗しても本体機能に影響を与えない(握りつぶす)

let initialized = false;

/**
 * 計測を初期化し、初回PVを1回だけ送信する。
 * @param siteCode GoatCounter のサイトコード(例 "fillmap" → https://fillmap.goatcounter.com)。
 *                 未指定・空文字なら計測を完全に無効化する(何も読み込まない/送らない)。
 */
export function initAnalytics(siteCode?: string | null): void {
  if (initialized) return;
  if (!siteCode) return; // 未注入 = 計測オフ(プライバシー既定)
  if (typeof window === "undefined" || typeof document === "undefined") return;

  initialized = true;

  const endpoint = `https://${siteCode}.goatcounter.com/count`;

  // 自動カウントを止め、手動で1回だけ送る(SPAの二重計測を防ぐ)。
  // no_events: クリック等のイベント送信も無効化し、PVのみに限定。
  (window as unknown as { goatcounter?: Record<string, unknown> }).goatcounter = {
    no_onload: true,
    no_events: true,
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = "//gc.zgo.at/count.js";
  script.setAttribute("data-goatcounter", endpoint);
  script.addEventListener("load", () => {
    try {
      const gc = (window as unknown as { goatcounter?: { count?: (o: { path: string }) => void } }).goatcounter;
      // パスのみ送信(クエリ/ハッシュ/個人データは送らない)
      gc?.count?.({ path: window.location.pathname });
    } catch {
      /* 計測失敗は本体に影響させない */
    }
  });
  script.addEventListener("error", () => {
    /* スクリプト読み込み失敗も無視 */
  });
  document.head.appendChild(script);
}
