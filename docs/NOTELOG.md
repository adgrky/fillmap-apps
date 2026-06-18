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
