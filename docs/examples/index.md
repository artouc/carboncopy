# Examples

carboncopy の使用例を紹介します。

## Hello World

最もシンプルなPDF生成例です。

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

## 請求書テンプレート

```typescript
import { createPDF, PAGE_SIZES } from "@osaxyz/carboncopy"

const pdf = createPDF({
    format: "A4",
    title: "請求書",
})

pdf.addPage()

const page_width = PAGE_SIZES.A4.width
const page_height = PAGE_SIZES.A4.height

// ヘッダー
pdf.drawText("請求書", 50, page_height - 50, {
    font: "Helvetica-Bold",
    fontSize: 28,
})

pdf.drawText("Invoice #INV-2024-001", page_width - 200, page_height - 50, {
    font: "Helvetica",
    fontSize: 12,
    color: { r: 0.5, g: 0.5, b: 0.5 },
})

// 区切り線
pdf.drawLine(50, page_height - 70, page_width - 50, page_height - 70, {
    color: { r: 0.8, g: 0.8, b: 0.8 },
    width: 1,
})

// 請求先情報
pdf.drawText("請求先:", 50, page_height - 100, {
    font: "Helvetica-Bold",
    fontSize: 12,
})

pdf.drawText("株式会社サンプル", 50, page_height - 120, {
    font: "Helvetica",
    fontSize: 12,
})

// テーブルヘッダー
const table_y = page_height - 200
pdf.drawRect(50, table_y - 25, page_width - 100, 25, {
    fill: { r: 0.2, g: 0.4, b: 0.6 },
})

pdf.drawText("品目", 60, table_y - 18, {
    font: "Helvetica-Bold",
    fontSize: 11,
    color: { r: 1, g: 1, b: 1 },
})

pdf.drawText("数量", 300, table_y - 18, {
    font: "Helvetica-Bold",
    fontSize: 11,
    color: { r: 1, g: 1, b: 1 },
})

pdf.drawText("単価", 380, table_y - 18, {
    font: "Helvetica-Bold",
    fontSize: 11,
    color: { r: 1, g: 1, b: 1 },
})

pdf.drawText("金額", 480, table_y - 18, {
    font: "Helvetica-Bold",
    fontSize: 11,
    color: { r: 1, g: 1, b: 1 },
})

// テーブル行
const items = [
    { name: "Web Design", qty: 1, price: 500000 },
    { name: "Development", qty: 1, price: 800000 },
    { name: "Maintenance", qty: 12, price: 10000 },
]

let row_y = table_y - 50
items.forEach((item, i) => {
    if (i % 2 === 0) {
        pdf.drawRect(50, row_y - 5, page_width - 100, 25, {
            fill: { r: 0.95, g: 0.95, b: 0.95 },
        })
    }

    pdf.drawText(item.name, 60, row_y, { fontSize: 11 })
    pdf.drawText(String(item.qty), 300, row_y, { fontSize: 11 })
    pdf.drawText(`¥${item.price.toLocaleString()}`, 380, row_y, { fontSize: 11 })
    pdf.drawText(`¥${(item.qty * item.price).toLocaleString()}`, 480, row_y, { fontSize: 11 })

    row_y -= 25
})

// 合計
const total = items.reduce((sum, item) => sum + item.qty * item.price, 0)
pdf.drawLine(380, row_y - 10, page_width - 50, row_y - 10, { width: 1 })
pdf.drawText("合計:", 380, row_y - 30, {
    font: "Helvetica-Bold",
    fontSize: 14,
})
pdf.drawText(`¥${total.toLocaleString()}`, 480, row_y - 30, {
    font: "Helvetica-Bold",
    fontSize: 14,
})

const result = pdf.save()
result.download("invoice.pdf")
```

## 日本語文書

```typescript
import { PDFDocument, PAGE_SIZES, FontManager, PDFResult } from "@osaxyz/carboncopy"
import { readFileSync, writeFileSync } from "fs"

async function main() {
    const font_manager = new FontManager()
    const font_data = readFileSync("./NotoSansJP-Regular.ttf")
    const loaded_font = await font_manager.loadFromUint8Array(
        new Uint8Array(font_data),
        "NotoSansJP"
    )

    const doc = new PDFDocument()
    doc.setInfo({ title: "日本語サンプル", author: "carboncopy" })

    const text = "こんにちは、世界！\nこれは日本語のPDFです。"

    for (const char of text) {
        const cp = char.codePointAt(0)
        if (cp) loaded_font.usedCodePoints.add(cp)
    }

    doc.addCustomFont("NotoSansJP", loaded_font, text)

    const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)
    doc.applyFontToPage(page, "NotoSansJP")

    const lines = text.split("\n")
    let y = PAGE_SIZES.A4.height - 50

    for (const line of lines) {
        const hex = doc.textToHex("NotoSansJP", line)
        page.drawTextCID(hex, 50, y, {
            font: "NotoSansJP",
            fontSize: 18,
        })
        y -= 30
    }

    writeFileSync("japanese.pdf", new PDFResult(doc.save()).toUint8Array())
}

main()
```

## 画像付きレポート

```typescript
import { PDFDocument, PAGE_SIZES, PDFResult, embedImage } from "@osaxyz/carboncopy"

async function createReport(chart_image: Uint8Array) {
    const doc = new PDFDocument()
    doc.setInfo({ title: "Monthly Report" })

    doc.addStandardFont("F1", "Helvetica-Bold")
    doc.addStandardFont("F2", "Helvetica")

    const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)
    doc.applyFontToPage(page, "F1")
    doc.applyFontToPage(page, "F2")

    // タイトル
    page.drawText("Monthly Sales Report", 50, 780, {
        font: "F1",
        fontSize: 24,
    })

    page.drawText("January 2024", 50, 750, {
        font: "F2",
        fontSize: 14,
        color: { r: 0.5, g: 0.5, b: 0.5 },
    })

    // 画像を埋め込み
    const context = doc.getEmbedContext()
    const embedded = await embedImage(chart_image, context)
    doc.syncEmbedContext(context)

    doc.addImage(embedded.name, embedded.ref, embedded.width, embedded.height)
    doc.applyImageToPage(page, embedded.name)

    // チャートを描画
    page.drawText("Sales Chart", 50, 700, {
        font: "F1",
        fontSize: 16,
    })

    page.drawImage(embedded.name, 50, 400, 400, 250)

    // 説明文
    page.drawText("Key highlights:", 50, 370, {
        font: "F1",
        fontSize: 14,
    })

    const highlights = [
        "• Total revenue increased by 15%",
        "• New customer acquisition up 20%",
        "• Customer retention rate: 92%",
    ]

    let text_y = 340
    for (const text of highlights) {
        page.drawText(text, 60, text_y, {
            font: "F2",
            fontSize: 12,
        })
        text_y -= 20
    }

    return new PDFResult(doc.save())
}
```

## 複数ページのドキュメント

```typescript
import { createPDF, PAGE_SIZES } from "@osaxyz/carboncopy"

const content = [
    { title: "Chapter 1", body: "Introduction to the topic..." },
    { title: "Chapter 2", body: "Main content goes here..." },
    { title: "Chapter 3", body: "Conclusion and summary..." },
]

const pdf = createPDF({ format: "A4", title: "My Book" })

content.forEach((chapter, index) => {
    pdf.addPage()

    // ヘッダー
    pdf.drawText(chapter.title, 50, PAGE_SIZES.A4.height - 50, {
        font: "Helvetica-Bold",
        fontSize: 24,
    })

    // 本文
    pdf.drawText(chapter.body, 50, PAGE_SIZES.A4.height - 100, {
        font: "Helvetica",
        fontSize: 12,
    })

    // フッター（ページ番号）
    pdf.drawText(`Page ${index + 1}`, PAGE_SIZES.A4.width / 2 - 20, 30, {
        font: "Helvetica",
        fontSize: 10,
        color: { r: 0.5, g: 0.5, b: 0.5 },
    })
})

const result = pdf.save()
result.download("book.pdf")
```

## HTML要素の変換

```typescript
import { convert } from "@osaxyz/carboncopy"

// HTML要素を取得
const element = document.getElementById("report-content")

// PDFに変換
const result = await convert(element, {
    format: "A4",
    margin: { top: 40, right: 40, bottom: 40, left: 40 },
    title: "Report",
    includeBackground: true,
})

// ダウンロード
result.download("report.pdf")
```

## Node.js でのファイル保存

```typescript
import { createPDF } from "@osaxyz/carboncopy"
import { writeFileSync } from "fs"

const pdf = createPDF({ format: "A4" })
pdf.addPage()
pdf.drawText("Server-side PDF", 50, 750, { fontSize: 24 })

const result = pdf.save()
writeFileSync("output.pdf", result.toUint8Array())

console.log(`PDF saved: ${result.size} bytes`)
```
