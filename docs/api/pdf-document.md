# PDFDocument

PDFドキュメントを管理するローレベルクラスです。

## インポート

```typescript
import { PDFDocument } from "@osaxyz/carboncopy"
```

## コンストラクタ

```typescript
const doc = new PDFDocument()
```

## メソッド

### setInfo

PDFメタデータを設定します。

```typescript
doc.setInfo({
    title: "Document Title",
    author: "Author Name",
    subject: "Document Subject",
    keywords: "pdf, typescript, document",
    creator: "carboncopy",
    producer: "carboncopy",
})
```

### addPage

新しいページを追加します。

```typescript
import { PAGE_SIZES } from "@osaxyz/carboncopy"

// A4サイズ
const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

// カスタムサイズ
const custom_page = doc.addPage(400, 600)
```

### addStandardFont

標準14フォントを追加します。

```typescript
// addStandardFont(key, fontName)
doc.addStandardFont("F1", "Helvetica")
doc.addStandardFont("F2", "Helvetica-Bold")
doc.addStandardFont("F3", "Times-Roman")
doc.addStandardFont("F4", "Courier")
```

### addCustomFont

カスタムフォント（TTF/OTF）を埋め込みます。

```typescript
import { FontManager } from "@osaxyz/carboncopy"

const font_manager = new FontManager()
const loaded_font = await font_manager.loadFromUint8Array(font_data, "MyFont")

// 使用文字を登録
for (const char of text) {
    const cp = char.codePointAt(0)
    if (cp) loaded_font.usedCodePoints.add(cp)
}

// フォントを追加
doc.addCustomFont("MyFont", loaded_font, text)
```

### applyFontToPage

ページにフォントを適用します。

```typescript
const page = doc.addPage(595, 842)
doc.applyFontToPage(page, "F1")

// 複数フォントを適用
doc.applyFontToPage(page, "F1")
doc.applyFontToPage(page, "F2")
```

### textToHex

CIDフォント用にテキストをHex文字列に変換します。

```typescript
const text = "こんにちは"
const hex = doc.textToHex("MyFont", text)
// → "001A002B003C..." (グリフID列)
```

### addImage

画像リソースを追加します。

```typescript
import { embedImage } from "@osaxyz/carboncopy"

const context = doc.getEmbedContext()
const embedded = await embedImage(image_data, context)
doc.syncEmbedContext(context)

doc.addImage(embedded.name, embedded.ref, embedded.width, embedded.height)
```

### applyImageToPage

ページに画像を適用します。

```typescript
doc.applyImageToPage(page, embedded.name)
```

### getEmbedContext / syncEmbedContext

画像埋め込み用のコンテキストを管理します。

```typescript
const context = doc.getEmbedContext()
// 画像埋め込み処理...
doc.syncEmbedContext(context)
```

### save

PDFバイナリデータを生成します。

```typescript
const pdf_bytes: Uint8Array = doc.save()
```

## 使用例

### 基本的な文書作成

```typescript
import { PDFDocument, PAGE_SIZES } from "@osaxyz/carboncopy"

const doc = new PDFDocument()

doc.setInfo({
    title: "Sample Document",
    author: "carboncopy",
})

// フォントを追加
doc.addStandardFont("helvetica", "Helvetica")
doc.addStandardFont("helvetica-bold", "Helvetica-Bold")

// ページを追加
const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

// フォントを適用
doc.applyFontToPage(page, "helvetica")
doc.applyFontToPage(page, "helvetica-bold")

// 描画
page.drawText("Title", 50, 750, {
    font: "helvetica-bold",
    fontSize: 24,
})

page.drawText("Body text here.", 50, 700, {
    font: "helvetica",
    fontSize: 12,
})

// 保存
const bytes = doc.save()
```

### 日本語文書

```typescript
import { PDFDocument, PAGE_SIZES, FontManager, PDFResult } from "@osaxyz/carboncopy"

async function createJapaneseDoc() {
    const doc = new PDFDocument()

    // フォントを読み込み
    const font_manager = new FontManager()
    const font_data = await fetch("/fonts/NotoSansJP.ttf")
        .then(r => r.arrayBuffer())
        .then(b => new Uint8Array(b))

    const loaded_font = await font_manager.loadFromUint8Array(font_data, "NotoSansJP")

    const text = "日本語テキスト"

    // 使用文字を登録
    for (const char of text) {
        const cp = char.codePointAt(0)
        if (cp) loaded_font.usedCodePoints.add(cp)
    }

    // フォント埋め込み
    doc.addCustomFont("NotoSansJP", loaded_font, text)

    // ページ作成
    const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)
    doc.applyFontToPage(page, "NotoSansJP")

    // 描画
    const hex = doc.textToHex("NotoSansJP", text)
    page.drawTextCID(hex, 50, 750, {
        font: "NotoSansJP",
        fontSize: 24,
    })

    return new PDFResult(doc.save())
}
```

### 画像付き文書

```typescript
import { PDFDocument, PAGE_SIZES, embedImage, PDFResult } from "@osaxyz/carboncopy"

async function createDocWithImage(image_data: Uint8Array) {
    const doc = new PDFDocument()
    const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

    // 画像を埋め込み
    const context = doc.getEmbedContext()
    const embedded = await embedImage(image_data, context)
    doc.syncEmbedContext(context)

    // 登録と適用
    doc.addImage(embedded.name, embedded.ref, embedded.width, embedded.height)
    doc.applyImageToPage(page, embedded.name)

    // 描画
    page.drawImage(embedded.name, 50, 500, 200, 150)

    return new PDFResult(doc.save())
}
```

## プロパティ

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| pages | PDFPage[] | ドキュメント内のページ一覧 |
