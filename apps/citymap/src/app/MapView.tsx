// 地図(POLYGON モード, SPEC §E3)。外部タイル不要のブランクスタイル+自前ポリゴン。
// 地方ブロック8分割遅延ロード(SPEC §A1 P0): viewport に重なるブロックのみ逐次追加。
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { levelColorStepExpression } from "../domain/levels";
import type { DissolvedMunicipality } from "../domain/types";

const SRC  = "cities";
const FILL = "cities-fill";
const LINE = "cities-line";
const DISSOLVED_SRC = "dissolved";
const DISSOLVED_LAYER = "dissolved-points";

// 全国を包むおおよその bbox — fitBounds の初期値
const JAPAN_BOUNDS: maplibregl.LngLatBoundsLike = [[122, 24], [154, 46]];

export type CaptureMapCallback = () => HTMLCanvasElement | null;

type BlockMeta = {
  id: string;
  name: string;
  file: string;
  bbox: [number, number, number, number]; // [w, s, e, n]
  count: number;
};

type Props = {
  onSelect: (cityId: string, name: string) => void;
  getLevel: (cityId: string) => number;
  onReady: (capture: CaptureMapCallback, setLevel: (cityId: string, level: number) => void) => void;
  premium: boolean;
  onSelectDissolved: (d: DissolvedMunicipality) => void;
};

const BLANK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "#0b0e14" } }],
};

/** ブロックの bbox と地図 viewport が重なっているか判定。 */
function intersects(bbox: [number, number, number, number], bounds: maplibregl.LngLatBounds): boolean {
  const [bw, bs, be, bn] = bbox;
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return !(be < sw.lng || bw > ne.lng || bn < sw.lat || bs > ne.lat);
}

export function MapView({ onSelect, getLevel, onReady, premium, onSelectDissolved }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const onSelectDissolvedRef = useRef(onSelectDissolved);
  onSelectDissolvedRef.current = onSelectDissolved;

  // ロード済みブロック管理
  const loadedBlocks = useRef<Set<string>>(new Set());
  // 累積 features(setData に渡す用)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFeatures = useRef<any[]>([]);
  // ブロック manifest
  const blocksRef = useRef<BlockMeta[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BLANK_STYLE,
      center: [138.5, 37.5],
      zoom: 4.2,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });
    mapRef.current = map;

    // ブロックを fetch → source に追加 → feature-state 適用
    async function loadBlock(block: BlockMeta): Promise<void> {
      if (loadedBlocks.current.has(block.id)) return;
      loadedBlocks.current.add(block.id); // 先にマークして二重ロードを防ぐ

      try {
        const res = await fetch(`./${block.file}`);
        const fc  = await res.json();
        allFeatures.current.push(...fc.features);

        const src = map.getSource(SRC) as maplibregl.GeoJSONSource | undefined;
        if (!src) return;
        src.setData({ type: "FeatureCollection", features: allFeatures.current });

        // 追加されたフィーチャに保存済みレベルを適用
        for (const f of fc.features) {
          const id = f.properties?.id;
          const lv = getLevel(id);
          if (lv > 0) map.setFeatureState({ source: SRC, id }, { level: lv });
        }
      } catch {
        // ネットワークエラー: 後の moveend で再試行されるようロードマークを戻す
        loadedBlocks.current.delete(block.id);
      }
    }

    // 現在の viewport に重なるブロックをまとめてロード
    function loadVisibleBlocks(): void {
      const bounds = map.getBounds();
      for (const block of blocksRef.current) {
        if (!loadedBlocks.current.has(block.id) && intersects(block.bbox, bounds)) {
          loadBlock(block);
        }
      }
    }

    map.on("load", async () => {
      // 空の source + layer を先に登録(ブロック到着前にクリックイベントが飛ばないようにする)
      map.addSource(SRC, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        promoteId: "id",
      });
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

      map.on("click", FILL, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = String(f.id ?? f.properties?.id);
        onSelect(id, f.properties?.name ?? id);
      });
      map.on("mouseenter", FILL, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", FILL, () => (map.getCanvas().style.cursor = ""));

      // 親にコールバックを渡す(レイヤーが揃った時点)
      const capture: CaptureMapCallback = () => map.getCanvas();
      const setLevel = (cityId: string, level: number) =>
        map.setFeatureState({ source: SRC, id: cityId }, { level });
      onReady(capture, setLevel);

      // 全国 bbox でフィット(データ到着前に済ませる)
      map.fitBounds(JAPAN_BOUNDS, { padding: 48, duration: 0 });

      // manifest 取得 → 初期 viewport のブロックをロード
      try {
        const res = await fetch("./data/blocks/manifest.json");
        const manifest = await res.json();
        blocksRef.current = manifest.blocks;
        loadVisibleBlocks();
      } catch {
        // manifest 失敗 → 旧来の単一ファイルにフォールバック
        const res = await fetch("./data/cities.geojson");
        const fc  = await res.json();
        allFeatures.current.push(...fc.features);
        (map.getSource(SRC) as maplibregl.GeoJSONSource).setData(fc);
        for (const f of fc.features) {
          const id = f.properties?.id;
          const lv = getLevel(id);
          if (lv > 0) map.setFeatureState({ source: SRC, id }, { level: lv });
        }
      }
    });

    // パン/ズーム後に新しく見えたブロックを追加ロード
    map.on("moveend", loadVisibleBlocks);

    return () => {
      map.remove();
      mapRef.current = null;
      loadedBlocks.current.clear();
      allFeatures.current = [];
      blocksRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 消滅自治体レイヤー(プレミアム, §11): premium が立った時だけ取得・追加。非premiumでは追加しない。
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const teardown = () => {
      if (map.getLayer(DISSOLVED_LAYER)) map.removeLayer(DISSOLVED_LAYER);
      if (map.getSource(DISSOLVED_SRC)) map.removeSource(DISSOLVED_SRC);
    };

    if (!premium) {
      teardown();
      return;
    }

    const setup = async () => {
      if (map.getSource(DISSOLVED_SRC)) return;
      const res = await fetch("./data/dissolved.json");
      const list: DissolvedMunicipality[] = await res.json();
      const fc = {
        type: "FeatureCollection" as const,
        features: list.map((d) => ({
          type: "Feature" as const,
          properties: d,
          geometry: { type: "Point" as const, coordinates: [d.lng, d.lat] },
        })),
      };
      map.addSource(DISSOLVED_SRC, { type: "geojson", data: fc });
      map.addLayer({
        id: DISSOLVED_LAYER,
        type: "circle",
        source: DISSOLVED_SRC,
        paint: {
          "circle-radius": 4,
          "circle-color": "#c4b5fd",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#1e1b3a",
          "circle-opacity": 0.85,
        },
      });
      map.on("click", DISSOLVED_LAYER, (e) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        onSelectDissolvedRef.current(f.properties as DissolvedMunicipality);
      });
      map.on("mouseenter", DISSOLVED_LAYER, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", DISSOLVED_LAYER, () => (map.getCanvas().style.cursor = ""));
    };

    if (map.isStyleLoaded()) void setup();
    else map.once("load", () => void setup());
  }, [premium]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
