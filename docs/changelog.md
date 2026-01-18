# Changelog

carboncopyのすべての変更履歴を記録しています。

## [0.1.1] - 2025-01-18

### Fixed

- `<pre>` / `<code>` タグ内の改行が正しく保持されない問題を修正
  - `lineRects.length > 1` のケースでもY座標の変化検出ではなく、明示的に改行文字で分割するように変更
- コードブロック内のインデント（空白）が削除される問題を修正

### Added

- CSS `letter-spacing` プロパティのサポートを追加

## [0.1.0] - 2025-01-18

### Added

- 初回リリース
- HTML要素をPDFに変換する `convert()` 関数
- 日本語フォント（Noto Sans JP）の埋め込みサポート
- PDF標準14フォントのサポート
- 画像埋め込み（PNG, JPEG）のサポート
- テーブルレンダリングのサポート
- テキストの自動折り返し
- `<pre>` / `<code>` タグ内の空白保持
- Low-level API（PDFDocument, PDFPage）
