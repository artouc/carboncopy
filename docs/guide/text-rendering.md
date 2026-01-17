# テキスト描画

## 基本的なテキスト描画

```typescript
import { createPDF } from "@osaxyz/carboncopy"

const pdf = createPDF({ format: "A4" })
pdf.addPage()

// 基本のテキスト
pdf.drawText("Hello, World!", 50, 750, {
    font: "Helvetica",
    fontSize: 24,
})

// 色付きテキスト
pdf.drawText("Red Text", 50, 700, {
    font: "Helvetica",
    fontSize: 16,
    color: { r: 1, g: 0, b: 0 },
})
```

## フォントサイズ

フォントサイズはポイント（pt）で指定します。

```typescript
pdf.drawText("12pt", 50, 750, { fontSize: 12 })
pdf.drawText("18pt", 50, 720, { fontSize: 18 })
pdf.drawText("24pt", 50, 680, { fontSize: 24 })
pdf.drawText("36pt", 50, 630, { fontSize: 36 })
```

## フォントファミリー

標準14フォントを使用できます。

```typescript
// サンセリフ
pdf.drawText("Helvetica", 50, 750, { font: "Helvetica" })
pdf.drawText("Helvetica Bold", 50, 720, { font: "Helvetica-Bold" })
pdf.drawText("Helvetica Oblique", 50, 690, { font: "Helvetica-Oblique" })

// セリフ
pdf.drawText("Times Roman", 50, 650, { font: "Times-Roman" })
pdf.drawText("Times Bold", 50, 620, { font: "Times-Bold" })
pdf.drawText("Times Italic", 50, 590, { font: "Times-Italic" })

// 等幅
pdf.drawText("Courier", 50, 550, { font: "Courier" })
pdf.drawText("Courier Bold", 50, 520, { font: "Courier-Bold" })
```

## テキスト幅の計測

テキストの幅を事前に計測できます。

```typescript
import { measureTextWidth } from "@osaxyz/carboncopy"

const text = "Hello, World!"
const width = measureTextWidth(text, "Helvetica", 24)

console.log(`Text width: ${width}pt`)
```

## 右揃え・中央揃え

テキスト幅を計測して位置を調整します。

```typescript
import { measureTextWidth, PAGE_SIZES } from "@osaxyz/carboncopy"

const page_width = PAGE_SIZES.A4.width
const text = "Centered Text"
const font_size = 24
const text_width = measureTextWidth(text, "Helvetica", font_size)

// 中央揃え
const center_x = (page_width - text_width) / 2
pdf.drawText(text, center_x, 750, { fontSize: font_size })

// 右揃え
const right_margin = 50
const right_x = page_width - right_margin - text_width
pdf.drawText(text, right_x, 700, { fontSize: font_size })
```

## 複数行テキスト

ローレベルAPIを使用して複数行テキストを描画します。

```typescript
import { PDFDocument, PAGE_SIZES } from "@osaxyz/carboncopy"

const doc = new PDFDocument()
const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

doc.addStandardFont("F1", "Helvetica")
doc.applyFontToPage(page, "F1")

const lines = [
    "Line 1: Introduction",
    "Line 2: Main content goes here",
    "Line 3: More details",
    "Line 4: Conclusion",
]

const font_size = 14
const line_height = font_size * 1.5
let y = PAGE_SIZES.A4.height - 50

for (const line of lines) {
    page.drawText(line, 50, y, {
        font: "F1",
        fontSize: font_size,
    })
    y -= line_height
}
```

## 特殊文字

PDF標準フォントはASCII範囲の文字のみサポートしています。日本語や絵文字を使用する場合は、カスタムフォントを埋め込む必要があります。

```typescript
// ASCII文字は問題なく描画可能
pdf.drawText("Hello! @#$%^&*()", 50, 750)

// 日本語はカスタムフォントが必要
// → /guide/japanese-fonts を参照
```

## 次のステップ

- [日本語フォント](/guide/japanese-fonts) - 日本語テキストの描画
- [画像埋め込み](/guide/images) - 画像の埋め込み
