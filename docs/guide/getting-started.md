# Getting Started

## インストール

npm または yarn を使用してインストールします。

```bash
npm install @osaxyz/carboncopy
```

```bash
yarn add @osaxyz/carboncopy
```

## 必要な環境

- Node.js 18.0.0 以上
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

## 最初のPDF

最もシンプルな例として、「Hello World」PDFを作成してみましょう。

### ブラウザ環境

```typescript
import { createPDF } from "@osaxyz/carboncopy"

// PDFを作成
const pdf = createPDF({
    format: "A4",
    title: "My First PDF",
})

// ページを追加
pdf.addPage()

// テキストを描画
pdf.drawText("Hello, World!", 50, 750, {
    font: "Helvetica",
    fontSize: 24,
})

// 保存してダウンロード
const result = pdf.save()
result.download("hello.pdf")
```

### Node.js 環境

```typescript
import { createPDF } from "@osaxyz/carboncopy"
import { writeFileSync } from "fs"

const pdf = createPDF({
    format: "A4",
    title: "My First PDF",
})

pdf.addPage()
pdf.drawText("Hello, World!", 50, 750, {
    font: "Helvetica",
    fontSize: 24,
})

const result = pdf.save()
writeFileSync("hello.pdf", result.toUint8Array())
```

## 座標系について

carboncopy の座標系は PDF 仕様に準拠しています。

- **原点**: ページ左下
- **X軸**: 右方向が正
- **Y軸**: 上方向が正
- **単位**: ポイント（pt）、1pt = 1/72インチ

```
(0, 842) ─────────────────── (595, 842)
    │                             │
    │          A4 Page            │
    │                             │
    │                             │
(0, 0) ───────────────────── (595, 0)
```

A4サイズの場合:
- 幅: 595.28pt（210mm）
- 高さ: 841.89pt（297mm）

## 次のステップ

- [Basic Usage](/guide/basic-usage) - 基本的な使い方の詳細
- [テキスト描画](/guide/text-rendering) - テキスト描画の詳細
- [日本語フォント](/guide/japanese-fonts) - 日本語対応
