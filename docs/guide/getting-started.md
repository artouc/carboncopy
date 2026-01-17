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

## HTML to PDF 変換

carboncopy の最も強力な機能は、HTML要素をそのままPDFに変換することです。

```typescript
import { convert } from "@osaxyz/carboncopy"

// HTML要素を取得
const element = document.getElementById("content")

// PDFに変換
const result = await convert(element)

// ダウンロード
result.download("document.pdf")
```

これだけで、HTML要素の見た目をそのままPDFに変換できます。

### 実際の例

```html
<div id="invoice" style="padding: 40px; font-family: sans-serif;">
  <h1 style="color: #1e40af;">Invoice</h1>
  <p>Date: January 15, 2024</p>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background: #1e293b; color: white;">
      <th style="padding: 12px;">Item</th>
      <th style="padding: 12px;">Amount</th>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Web Design</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">$5,000</td>
    </tr>
  </table>
</div>
```

```typescript
import { convert } from "@osaxyz/carboncopy"

const invoice = document.getElementById("invoice")
const result = await convert(invoice)
result.download("invoice.pdf")
```

### オプション

```typescript
const result = await convert(element, {
  // ページサイズ: 'A4', 'Letter', または 'auto'（要素サイズに合わせる）
  format: "auto",  // デフォルト

  // マージン (mm)
  margin: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
  },

  // 背景色を含める
  background: true,

  // ドキュメント情報
  info: {
    title: "Invoice",
    author: "My Company",
  },
})
```

### 自動サイズ調整

`format: "auto"`（デフォルト）を使用すると、PDFのサイズがHTML要素の大きさに自動的に合わせられます。

```typescript
// 要素が 800x600px の場合、PDFも同じ比率で生成される
const result = await convert(element)  // format: "auto" がデフォルト
```

固定サイズのページが必要な場合：

```typescript
const result = await convert(element, {
  format: "A4",
  orientation: "portrait",  // or "landscape"
})
```

## フォントの自動マッピング

HTMLの `font-family` 設定は自動的にPDF標準フォントにマッピングされます。

| CSS font-family | PDFフォント |
|-----------------|------------|
| serif, Times, Georgia | Times ファミリー |
| monospace, Courier, Consolas | Courier ファミリー |
| sans-serif, Arial, その他 | Helvetica ファミリー |

```html
<!-- Times-Roman で描画 -->
<p style="font-family: Georgia, serif;">Serif text</p>

<!-- Helvetica で描画 -->
<p style="font-family: Arial, sans-serif;">Sans-serif text</p>

<!-- Courier で描画 -->
<code style="font-family: monospace;">Code text</code>

<!-- font-weight, font-style も反映 -->
<p style="font-family: serif; font-weight: bold;">Times-Bold で描画</p>
```

::: warning 日本語について
PDF標準フォントは日本語をサポートしていません。日本語を含むHTMLを変換する場合は、カスタムフォントの埋め込みが必要です。詳しくは [日本語フォント](/guide/japanese-fonts) を参照してください。
:::

## プログラムでPDFを生成

HTMLではなく、プログラムで直接PDFを生成することもできます。

```typescript
import { createPDF } from "@osaxyz/carboncopy"

const pdf = createPDF({ format: "A4" })
pdf.addPage()
pdf.drawText("Hello, World!", 50, 750, {
  font: "Helvetica",
  fontSize: 24,
})

const result = pdf.save()
result.download("hello.pdf")
```

詳しくは [Basic Usage](/guide/basic-usage) を参照してください。

## 次のステップ

- [Basic Usage](/guide/basic-usage) - createPDF APIの詳細
- [PDF標準フォント](/guide/standard-fonts) - 使用可能なフォント
- [日本語フォント](/guide/japanese-fonts) - 日本語対応の方法
