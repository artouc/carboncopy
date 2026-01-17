# 日本語フォント

carboncopy は CIDFont 埋め込みにより、日本語テキストを正確に描画できます。

## フォントの準備

日本語フォント（TTF/OTF）を用意してください。推奨フォント:

- [Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP)
- [Noto Serif JP](https://fonts.google.com/noto/specimen/Noto+Serif+JP)
- [源ノ角ゴシック](https://github.com/adobe-fonts/source-han-sans)

## フォントの読み込み

### ブラウザ環境

```typescript
import { FontManager, PDFDocument, PAGE_SIZES } from "@osaxyz/carboncopy"

async function createJapanesePDF() {
    // フォントを読み込み
    const font_manager = new FontManager()
    const response = await fetch("/fonts/NotoSansJP-Regular.ttf")
    const font_data = await response.arrayBuffer()
    const loaded_font = await font_manager.loadFromUint8Array(
        new Uint8Array(font_data),
        "NotoSansJP"
    )

    // PDFドキュメントを作成
    const doc = new PDFDocument()
    doc.setInfo({ title: "日本語ドキュメント" })

    // 使用するテキスト
    const text = "こんにちは、世界！"

    // 使用文字を登録
    for (const char of text) {
        const cp = char.codePointAt(0)
        if (cp !== undefined) {
            loaded_font.usedCodePoints.add(cp)
        }
    }

    // フォントを埋め込み
    doc.addCustomFont("NotoSansJP", loaded_font, text)

    // ページを追加
    const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)
    doc.applyFontToPage(page, "NotoSansJP")

    // テキストを描画
    const hex_text = doc.textToHex("NotoSansJP", text)
    page.drawTextCID(hex_text, 50, 750, {
        font: "NotoSansJP",
        fontSize: 24,
    })

    return doc.save()
}
```

### Node.js 環境

```typescript
import { readFileSync, writeFileSync } from "fs"
import { FontManager, PDFDocument, PAGE_SIZES, PDFResult } from "@osaxyz/carboncopy"

async function main() {
    // フォントを読み込み
    const font_manager = new FontManager()
    const font_data = readFileSync("./fonts/NotoSansJP-Regular.ttf")
    const loaded_font = await font_manager.loadFromUint8Array(
        new Uint8Array(font_data),
        "NotoSansJP"
    )

    const doc = new PDFDocument()
    const text = "日本語テキストのサンプル"

    // 使用文字を収集
    for (const char of text) {
        const cp = char.codePointAt(0)
        if (cp) loaded_font.usedCodePoints.add(cp)
    }

    // フォント埋め込み
    doc.addCustomFont("NotoSansJP", loaded_font, text)

    const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)
    doc.applyFontToPage(page, "NotoSansJP")

    const hex_text = doc.textToHex("NotoSansJP", text)
    page.drawTextCID(hex_text, 50, 750, {
        font: "NotoSansJP",
        fontSize: 24,
    })

    const pdf_bytes = doc.save()
    const result = new PDFResult(pdf_bytes)
    writeFileSync("japanese.pdf", result.toUint8Array())
}

main()
```

## 複数のテキストブロック

```typescript
const texts = [
    "タイトル",
    "本文テキストがここに入ります。",
    "箇条書き項目1",
    "箇条書き項目2",
]

// すべてのテキストの文字を収集
const all_text = texts.join("")
for (const char of all_text) {
    const cp = char.codePointAt(0)
    if (cp) loaded_font.usedCodePoints.add(cp)
}

// フォント埋め込み（一度だけ）
doc.addCustomFont("NotoSansJP", loaded_font, all_text)

const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)
doc.applyFontToPage(page, "NotoSansJP")

// 各テキストを描画
let y = 750
for (const text of texts) {
    const hex_text = doc.textToHex("NotoSansJP", text)
    page.drawTextCID(hex_text, 50, y, {
        font: "NotoSansJP",
        fontSize: 14,
    })
    y -= 24
}
```

## テキストのコピー・検索

carboncopy は ToUnicode CMap を生成するため、PDFビューアでテキストをコピー・検索できます。

```typescript
// テキストはベクターとして描画されますが、
// ToUnicode CMapにより以下が可能:
// - テキスト選択
// - コピー＆ペースト
// - 検索（Ctrl+F）
```

## 混合テキスト（日本語＋英語）

日本語と英語を混在させる場合:

```typescript
const text = "Hello, 世界！ Welcome to 日本"

// すべての文字を収集（ASCII含む）
for (const char of text) {
    const cp = char.codePointAt(0)
    if (cp) loaded_font.usedCodePoints.add(cp)
}

doc.addCustomFont("NotoSansJP", loaded_font, text)

// 日本語フォントでASCII文字も描画可能
const hex_text = doc.textToHex("NotoSansJP", text)
page.drawTextCID(hex_text, 50, 750, {
    font: "NotoSansJP",
    fontSize: 18,
})
```

## フォントサブセット

carboncopy は使用文字のみをPDFに埋め込む「サブセット化」を行います。これによりファイルサイズを大幅に削減できます。

```typescript
// フルフォント: ~15MB
// サブセット後: ~50KB〜数百KB（使用文字数による）
```

## 注意事項

1. **フォントライセンス**: 使用するフォントのライセンスを確認してください
2. **縦書き**: 現在、縦書きには対応していません
3. **異体字**: 一部の異体字セレクタには対応していません
