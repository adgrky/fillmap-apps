// 地図(POLYGON モード, SPEC §E3)。外部タイル不要のブランクスタイルに自前ポリゴンを描画。
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { levelColorStepExpression } from "../domain/levels";

const SRC = "cities";
const FILL = "cities-fill";
const LINE = "cities-line";

export type CaptureMapCallback = () => HTMLCanvasElement | null;

type Props = {
  /** 自治体タップ時。cityId と表示名を返す。 */
  onSelect: (cityId: string, name: string) => void;
  /** 現在のレベル取得(feature-state 初期反映用)。 */
  getLevel: (cityId: string) => number;
  /** 地図キャンバス取得関数を親へ渡す(シェア画像用)。 */
  onReady: (capture: CaptureMapCallback, setLevel: (cityId: string, level: number) => void) => void;
};

/** FeatureCollection 全体の境界 [[w,s],[e,n]] を計算(turf不使用)。 */
function bboxOf(geojson: { features: { geometry: { coordinates: unknown } }[] }): maplibregl.LngLatBoundsLike | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (c: unknown) => {
    if (typeof (c as number[])[0] === "number" && typeof (c as number[])[1] === "number" && (c as number[]).length === 2) {
      const [lng, lat] = c as number[];
      if (lng < w) w = lng;
      if (lng > e) e = lng;
      if (lat < s) s = lat;
      if (lat > n) n = lat;
    } else if (Array.isArray(c)) {
      for (const x of c) walk(x);
    }
  };
  for (const f of geojson.features) walk(f.geometry.coordinates);
  if (!isFinite(w)) return null;
  return [[w, s], [e, n]];
}

const BLANK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "#0b0e14" } }],
};

export function MapView({ onSelect, getLevel, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BLANK_STYLE,
      center: [138.5, 37.5], // 日本中心あたり
      zoom: 4.2,
      attributionControl: false,
      preserveDrawingBuffer: true, // シェア画像で canvas を読むため
    });
    mapRef.current = map;

    map.on("load", async () => {
      const res = await fetch("./data/cities.geojson");
      const geojson = await res.json();

      map.addSource(SRC, { type: "geojson", data: geojson, promoteId: "id" });

      // データ範囲に自動フィット(サンプル=東京/本番=全国どちらも適切に収まる)
      const b = bboxOf(geojson);
      if (b) map.fitBounds(b, { padding: 48, duration: 0 });
      map.addLayer({
        id: FILL,
        type: "fill",
        source: SRC,
        paint: {
          "fill-color": levelColorStepExpression() as maplibregl.DataDrivenPropertyValueSpecification<string>,
          "fill-opacity": 0.85,
        },
      });
      map.addLayer({
        id: LINE,
        type: "line",
        source: SRC,
        paint: { "line-color": "#3a3f4a", "line-width": 0.8 },
      });

      // 保存済みレベルを feature-state へ反映
      for (const f of geojson.features) {
        const id = f.properties?.id;
        const lv = getLevel(id);
        if (lv > 0) map.setFeatureState({ source: SRC, id }, { level: lv });
      }

      map.on("click", FILL, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = String(f.id ?? f.properties?.id);
        onSelect(id, f.properties?.name ?? id);
      });
      map.on("mouseenter", FILL, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", FILL, () => (map.getCanvas().style.cursor = ""));

      // 親に「キャプチャ関数」と「レベル反映関数」を渡す
      const capture: CaptureMapCallback = () => map.getCanvas();
      const setLevel = (cityId: string, level: number) =>
        map.setFeatureState({ source: SRC, id: cityId }, { level });
      onReady(capture, setLevel);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
