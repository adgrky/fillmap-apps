# NOTELOG — fillmap-apps 開発素材ログ

> 開発過程の「やったこと・詰まったこと・解決法」を作業のたびに記録する。
> 形式は `docs/41_notelog_spec.md` §3 厳守(1エントリ最大7行)。記事化の素材。
> モノレポ1冊集約・見出しの「| アプリ名 |」で区別。

---

### 2026-06-18 | fillmap-apps | モノレポ昇格(railmap→工場)
- やったこと: 線路アプリを apps/railmap へ移植、src/core を packages/core(@fillmap/core)へ昇格。npm workspaces + vite alias でソース直参照
- 詰まり: なし(ビルド/型チェック/実機の地図描画すべて一発通過) 📷
- 記事ネタ度: ★★ / タグ: #モノレポ #npm-workspaces #vite

### 2026-06-18 | fillmap-apps | NOTELOG基盤の組み込み
- やったこと: 41_notelog_spec.md を docs へ、CLAUDE.md に NOTELOGルール§2ブロックを追記、本ファイルを作成
- 詰まり: なし
- 記事ネタ度: ★ / タグ: #運用 #note素材化

### 2026-06-18 | citymap | 2本目骨格 + core汎用層の線引き
- やったこと: POLYGONモードでcitymap骨格を実装(レベル制0-5/スコア/称号/保存)。汎用部品(createPersistence等)を @fillmap/core/generic に新設し実証
- 詰まり: 汎用層をバレルに足すと既存rail版と名前衝突(formatRatio等) → サブパス export "./generic" で分離し railmap 無傷を維持で解決
- 記事ネタ度: ★★★ / タグ: #モノレポ #早すぎる抽象化 #2本目で線引き 📷

### 2026-06-19 | citymap | N03前処理 + 全国データ化(P0) 📷
- やったこと: N03 SHP(242MB)を都道府県別バッチ処理で全国1905自治体geojson生成。tolerance+座標4桁丸めで10.86MB(gzip 1.77MB)
- 詰まり: GeoJSONまるごとロード → OOM kill(exit 137) → SHPバッチ方式に切り替えで解決。rglob が _prefecture を先に拾う誤りも修正
- 記事ネタ度: ★★★ / タグ: #N03 #geopandas #OOM #座標丸め

### 2026-06-18 | citymap | 地図の自動フィット
- やったこと: FeatureCollectionのbbox計算→fitBoundsを実装(turf不使用)。サンプル東京/本番全国どちらも適切に収まる
- 詰まり: 初期zoom固定だと6区が点になり操作不能 → bbox自動フィットで解決
- 記事ネタ度: ★★ / タグ: #maplibre #GeoJSON
