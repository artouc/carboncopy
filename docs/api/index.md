# API Reference

## High-level API

### HtmlToPdf

HTMLエレメントをPDFに変換するメインAPI。

```typescript
import { convert } from "@osaxyz/carboncopy"

const result = await convert(element, {
  format: 'A4',
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
})

result.download('output.pdf')
```

## Low-level API

### PDFDocument

PDFドキュメントを直接構築するためのクラス。

```typescript
import { PDFDocument, PAGE_SIZES } from "@osaxyz/carboncopy"

const doc = new PDFDocument()
doc.setInfo({ title: 'My Document' })

const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)
// ...

const bytes = doc.save()
```

### PDFPage

ページへの描画操作を行うクラス。

```typescript
page.drawText('Hello', 50, 700, {
  font: 'Helvetica',
  fontSize: 24,
})

page.drawRect(50, 600, 200, 100, {
  fill: { r: 0.9, g: 0.9, b: 0.9 },
})
```

## Utility Functions

- `parseColor(cssColor)` - CSS色文字列をRGBAに変換
- `UnitConverter` - px/pt/mm間の単位変換
- `FontManager` - フォントの読み込みと管理
