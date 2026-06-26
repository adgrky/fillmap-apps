import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";
import { App } from "./app/App";
import { initAnalytics } from "@fillmap/core";

// PVのみの軽量計測(§8-1)。サイトコード未設定時は何も送らない(プライバシー既定)。
initAnalytics(import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
