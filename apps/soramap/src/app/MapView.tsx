// 地図(POINT モード, SPEC §E2)。外部タイル不要のブランクスタイル+自前ポイント。
// 100座と軽量なので単一 points.geojson を一括ロード(ブロック分割は不要)。
// 登頂済=テーマ色+グロー円、未登頂=グレー小円。登頂時に波紋アニメ(W1)。
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { THEME, UNVISITED } from "../domain/theme";

const SRC = "points";
const GLOW = "points-glow";
const BASE = "points-base";
const RIPPLE_SRC = "ripple";
const RIPPLE = "points-ripple";

// 百名山の分布(屋久島〜利尻)に合わせた初期 bbox — 余白を抑えて山々を主役に
const JAPAN_BOUNDS: maplibregl.LngLatBoundsLike = [[129, 29.5], [146, 46]];

export type CaptureMapCallback = () => HTMLCanvasElement | null;

type Props = {
  onSelect: (id: string, name: string) => void;
  isVisited: (id: string) => boolean;
  onReady: (
    capture: CaptureMapCallback,
    applyVisit: (id: string, visited: boolean) => void,
    playRipple: (id: string) => void,
  ) => void;
};

const BLANK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "#0b0e14" } }],
};

const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function MapView({ onSelect, isVisited, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const coordsById = useRef<Map<string, [number, number]>>(new Map());
  const rippleRaf = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BLANK_STYLE,
      center: [138, 38],
      zoom: 4.2,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });
    mapRef.current = map;

    map.on("load", async () => {
      // 空 source を先に登録
      map.addSource(SRC, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        promoteId: "id",
      });
      map.addSource(RIPPLE_SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      // グロー層(登頂済のみ点灯)
      map.addLayer({
        id: GLOW,
        type: "circle",
        source: SRC,
        paint: {
          "circle-color": THEME,
          "circle-blur": 1,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 9, 9, 20],
          "circle-opacity": ["case", ["boolean", ["feature-state", "visited"], false], 0.5, 0],
        },
      });
      // 本体の円
      map.addLayer({
        id: BASE,
        type: "circle",
        source: SRC,
        paint: {
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "visited"], false],
            THEME,
            UNVISITED,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            ["case", ["boolean", ["feature-state", "visited"], false], 4, 2.5],
            9,
            ["case", ["boolean", ["feature-state", "visited"], false], 9, 5],
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": ["case", ["boolean", ["feature-state", "visited"], false], 1.5, 0],
        },
      });
      // 波紋(登頂時の一時アニメ)
      map.addLayer({
        id: RIPPLE,
        type: "circle",
        source: RIPPLE_SRC,
        paint: {
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": THEME,
          "circle-stroke-width": 3,
          "circle-radius": 6,
          "circle-stroke-opacity": 0,
        },
      });

      const handleClick = (e: maplibregl.MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = String(f.id ?? f.properties?.id);
        onSelect(id, f.properties?.name ?? id);
      };
      map.on("click", BASE, handleClick);
      map.on("click", GLOW, handleClick);
      map.on("mouseenter", BASE, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", BASE, () => (map.getCanvas().style.cursor = ""));

      // 親へコールバックを渡す
      const capture: CaptureMapCallback = () => map.getCanvas();
      const applyVisit = (id: string, visited: boolean) =>
        map.setFeatureState({ source: SRC, id }, { visited });
      const playRipple = (id: string) => {
        const c = coordsById.current.get(id);
        if (!c) return;
        if (prefersReducedMotion) return;
        const rsrc = map.getSource(RIPPLE_SRC) as maplibregl.GeoJSONSource;
        rsrc.setData({
          type: "FeatureCollection",
          features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: c } }],
        });
        const start = performance.now();
        const DUR = 500;
        const tick = (now: number) => {
          const t = Math.min((now - start) / DUR, 1);
          map.setPaintProperty(RIPPLE, "circle-radius", 6 + t * 42);
          map.setPaintProperty(RIPPLE, "circle-stroke-opacity", 0.7 * (1 - t));
          if (t < 1) {
            rippleRaf.current = requestAnimationFrame(tick);
          } else {
            rsrc.setData({ type: "FeatureCollection", features: [] });
          }
        };
        cancelAnimationFrame(rippleRaf.current);
        rippleRaf.current = requestAnimationFrame(tick);
      };
      onReady(capture, applyVisit, playRipple);

      map.fitBounds(JAPAN_BOUNDS, { padding: 40, duration: 0 });

      // points.geojson を一括ロード
      try {
        const res = await fetch("./data/points.geojson");
        const fc = await res.json();
        (map.getSource(SRC) as maplibregl.GeoJSONSource).setData(fc);
        for (const f of fc.features) {
          const id = f.properties?.id ?? f.id;
          const coords = f.geometry?.coordinates;
          if (id && Array.isArray(coords)) coordsById.current.set(String(id), [coords[0], coords[1]]);
          if (id && isVisited(String(id))) map.setFeatureState({ source: SRC, id }, { visited: true });
        }
      } catch {
        // 取得失敗時は空のまま(設定タブで案内)
      }
    });

    return () => {
      cancelAnimationFrame(rippleRaf.current);
      map.remove();
      mapRef.current = null;
      coordsById.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
