# Basic Usage

## 2つのAPI

carboncopy は用途に応じて2つのAPIを提供しています。

### 1. シンプルAPI (`createPDF`)

手軽にPDFを作成したい場合に最適です。

```typescript
import { createPDF, PAGE_SIZES } from "@osaxyz/carboncopy"

const pdf = createPDF({
    format: "A4",
    orientation: "portrait",  // or "landscape"
    title: "Document Title",
    author: "Author Name",
})

pdf.addPage()
pdf.drawText("Hello", 50, 750, { fontSize: 24 })
pdf.drawRect(50, 600, 200, 100, { fill: { r: 0.9, g: 0.9, b: 0.9 } })
pdf.drawLine(50, 580, 250, 580, { width: 2 })

const result = pdf.save()
```

### 2. ローレベルAPI (`PDFDocument`)

より細かな制御が必要な場合に使用します。

```typescript
import { PDFDocument, PAGE_SIZES } from "@osaxyz/carboncopy"

const doc = new PDFDocument()
doc.setInfo({
    title: "Advanced Document",
    author: "carboncopy",
    subject: "PDF Generation",
    keywords: "pdf, typescript",
})

const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

// フォントを追加
doc.addStandardFont("F1", "Helvetica")
doc.applyFontToPage(page, "F1")

// 描画
page.drawText("Advanced API", 50, 750, {
    font: "F1",
    fontSize: 20,
})

const pdfBytes = doc.save()
```

## ページサイズ

定義済みのページサイズを使用できます。

```typescript
import { PAGE_SIZES } from "@osaxyz/carboncopy"

// 利用可能なサイズ
PAGE_SIZES.A3      // { width: 841.89, height: 1190.55 }
PAGE_SIZES.A4      // { width: 595.28, height: 841.89 }
PAGE_SIZES.A5      // { width: 419.53, height: 595.28 }
PAGE_SIZES.Letter  // { width: 612, height: 792 }
PAGE_SIZES.Legal   // { width: 612, height: 1008 }
```

## 色の指定

RGB形式で色を指定します（各値は0〜1）。

```typescript
// 赤
const red = { r: 1, g: 0, b: 0 }

// 緑
const green = { r: 0, g: 1, b: 0 }

// 青
const blue = { r: 0, g: 0, b: 1 }

// グレー
const gray = { r: 0.5, g: 0.5, b: 0.5 }

// 使用例
pdf.drawText("Red Text", 50, 700, {
    color: { r: 1, g: 0, b: 0 },
})

pdf.drawRect(50, 600, 100, 50, {
    fill: { r: 0.2, g: 0.4, b: 0.8 },
    stroke: { r: 0, g: 0, b: 0 },
    lineWidth: 2,
})
```

## 標準フォント

以下の14種類の標準フォントが使用可能です（埋め込み不要）。

| フォント名 | 説明 |
|-----------|------|
| Helvetica | サンセリフ体 |
| Helvetica-Bold | 太字 |
| Helvetica-Oblique | 斜体 |
| Helvetica-BoldOblique | 太字斜体 |
| Times-Roman | セリフ体 |
| Times-Bold | 太字 |
| Times-Italic | 斜体 |
| Times-BoldItalic | 太字斜体 |
| Courier | 等幅フォント |
| Courier-Bold | 太字 |
| Courier-Oblique | 斜体 |
| Courier-BoldOblique | 太字斜体 |
| Symbol | 記号フォント |
| ZapfDingbats | 装飾記号フォント |

```typescript
pdf.drawText("Helvetica", 50, 700, { font: "Helvetica" })
pdf.drawText("Times-Roman", 50, 680, { font: "Times-Roman" })
pdf.drawText("Courier", 50, 660, { font: "Courier" })
```

## PDFの出力

### ブラウザでダウンロード

```typescript
const result = pdf.save()
result.download("document.pdf")
```

### Blobとして取得

```typescript
const result = pdf.save()
const blob = result.toBlob()

// URLを生成してプレビュー
const url = URL.createObjectURL(blob)
window.open(url)
```

### Uint8Arrayとして取得

```typescript
const result = pdf.save()
const bytes = result.toUint8Array()

// Node.jsでファイル保存
import { writeFileSync } from "fs"
writeFileSync("output.pdf", bytes)
```

### Base64として取得

```typescript
const result = pdf.save()
const base64 = result.toBase64()

// Data URLとして使用
const dataUrl = `data:application/pdf;base64,${base64}`
```

## 複数ページ

```typescript
const pdf = createPDF({ format: "A4" })

// ページ1
pdf.addPage()
pdf.drawText("Page 1", 50, 750)

// ページ2
pdf.addPage()
pdf.drawText("Page 2", 50, 750)

// ページ3
pdf.addPage()
pdf.drawText("Page 3", 50, 750)

const result = pdf.save()
```
