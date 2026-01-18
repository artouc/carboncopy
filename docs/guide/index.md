# Introduction

`@osaxyz/carboncopy` は、複雑な要素を含むHTMLを正確にPDFにレンダリングするためのクライアントサイドライブラリです。

## クイックスタート

```typescript
import { convert } from "@osaxyz/carboncopy"

// HTML要素をPDFに変換
const element = document.getElementById("content")
const result = await convert(element)
result.download("document.pdf")
```

たった3行で、HTMLをPDFに変換できます。

## 特徴

- **HTML to PDF**: HTML要素をそのままPDFに変換
- **正確なレイアウト**: `getBoundingClientRect` でブラウザの計算結果をそのまま使用
- **ベクター出力**: テキストはベクターデータとして出力、検索・選択可能
- **自動サイズ調整**: HTML要素のサイズに合わせてPDFサイズを自動決定
- **日本語対応**: CIDフォント埋め込みによる完全な日本語サポート
- **軽量**: Puppeteer/Chromium不要、ブラウザのみで動作

## なぜこのライブラリ？

既存のHTML→PDF変換ライブラリ（jsPDF + html2canvas等）には以下の問題がありました:

| 問題 | 原因 | 本ライブラリの解決策 |
|------|------|---------------------|
| サイズずれ | DPI変換の丸め誤差 | 高精度な単位変換 |
| ぼやけたテキスト | ラスタライズ | ベクター直接変換 |
| 検索不可 | 画像化 | テキストデータ保持 |
| 日本語文字化け | フォント非対応 | CIDフォント埋め込み |

## ユースケース

- 請求書・見積書の生成
- 帳票・レポートの出力
- 印刷プレビュー
- Webページの正確なPDF保存

## 次のステップ

- [Getting Started](/guide/getting-started) - インストールとHTML to PDF変換
- [PDF標準フォント](/guide/standard-fonts) - フォントの自動マッピング
- [日本語フォント](/guide/japanese-fonts) - 日本語対応の方法
