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

2種類のフォントファミリーを使用できます。

### sans-serif（Helvetica）

```typescript
pdf.drawText("Helvetica", 50, 750, { font: "Helvetica" })
pdf.drawText("Helvetica Bold", 50, 720, { font: "Helvetica-Bold" })
pdf.drawText("Helvetica Oblique", 50, 690, { font: "Helvetica-Oblique" })
pdf.drawText("Helvetica BoldOblique", 50, 660, { font: "Helvetica-BoldOblique" })
```

### serif（Times）

```typescript
pdf.drawText("Times Roman", 50, 620, { font: "Times-Roman" })
pdf.drawText("Times Bold", 50, 590, { font: "Times-Bold" })
pdf.drawText("Times Italic", 50, 560, { font: "Times-Italic" })
pdf.drawText("Times BoldItalic", 50, 530, { font: "Times-BoldItalic" })
```

### monospace（Courier）

```typescript
pdf.drawText("Courier", 50, 490, { font: "Courier" })
pdf.drawText("Courier Bold", 50, 460, { font: "Courier-Bold" })
pdf.drawText("Courier Oblique", 50, 430, { font: "Courier-Oblique" })
pdf.drawText("Courier BoldOblique", 50, 400, { font: "Courier-BoldOblique" })
```

### HTMLからの自動マッピング

`convert()` でHTML要素を変換する際、CSSの `font-family` 設定が自動的にPDFフォントにマッピングされます。

| CSS font-family | PDFフォント |
|-----------------|------------|
| serif, Times, Georgia, Palatino | Times ファミリー |
| monospace, Courier, Consolas, Monaco | Courier ファミリー |
| sans-serif, Arial, Helvetica, 他 | Helvetica ファミリー |

```html
<!-- serif → Times-Roman -->
<p style="font-family: Georgia, serif;">Serif text</p>

<!-- sans-serif → Helvetica -->
<p style="font-family: Arial, sans-serif;">Sans-serif text</p>

<!-- monospace → Courier -->
<code style="font-family: monospace;">Code text</code>

<!-- font-weight と font-style も反映 -->
<p style="font-family: serif; font-weight: bold; font-style: italic;">
  Bold Italic Serif → Times-BoldItalic
</p>
```

## テキスト幅の計測

テキストの幅を事前に計測できます。

```typescript
import { measureTextWidth } from "@osaxyz/carboncopy"

const text = "Hello, World!"

// sans-serif (Helvetica) の場合
const width_sans = measureTextWidth(text, 24, "sans-serif")

// serif (Times) の場合
const width_serif = measureTextWidth(text, 24, "serif")

// monospace (Courier) の場合
const width_mono = measureTextWidth(text, 24, "monospace")

console.log(`Sans-serif width: ${width_sans}pt`)
console.log(`Serif width: ${width_serif}pt`)
console.log(`Monospace width: ${width_mono}pt`)
```

### フォントタイプの判定

CSSのfont-familyからフォントタイプを判定できます。

```typescript
import { getFontType, measureTextWidth } from "@osaxyz/carboncopy"

const css_font = "Georgia, serif"
const font_type = getFontType(css_font)  // "serif"

const width = measureTextWidth("Hello", 24, font_type)
```

## 右揃え・中央揃え

テキスト幅を計測して位置を調整します。

```typescript
import { measureTextWidth, PAGE_SIZES } from "@osaxyz/carboncopy"

const page_width = PAGE_SIZES.A4.width
const text = "Centered Text"
const font_size = 24
const text_width = measureTextWidth(text, font_size, "sans-serif")

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
