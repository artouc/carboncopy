# 画像埋め込み

carboncopy は JPEG および PNG 画像のネイティブ埋め込みをサポートしています。

## 対応フォーマット

| フォーマット | 対応状況 | 備考 |
|-------------|---------|------|
| JPEG | ✅ | DCTDecode で直接埋め込み |
| PNG (RGB) | ✅ | FlateDecode で圧縮 |
| PNG (RGBA) | ✅ | アルファチャンネル対応 |
| PNG (パレット) | ✅ | インデックスカラー対応 |
| GIF | ❌ | 非対応 |
| WebP | ❌ | 非対応 |

## 基本的な使い方

### ブラウザ環境

```typescript
import { PDFDocument, PAGE_SIZES, embedImage } from "@osaxyz/carboncopy"

async function createPDFWithImage() {
    const doc = new PDFDocument()
    const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

    // 画像を読み込み
    const response = await fetch("/images/logo.png")
    const image_data = new Uint8Array(await response.arrayBuffer())

    // 画像を埋め込み
    const context = doc.getEmbedContext()
    const embedded = await embedImage(image_data, context)
    doc.syncEmbedContext(context)

    // ドキュメントに登録
    doc.addImage(embedded.name, embedded.ref, embedded.width, embedded.height)
    doc.applyImageToPage(page, embedded.name)

    // 描画
    page.drawImage(embedded.name, 50, 600, 200, 150)

    return doc.save()
}
```

### Node.js 環境

```typescript
import { readFileSync, writeFileSync } from "fs"
import { PDFDocument, PAGE_SIZES, PDFResult, embedImage } from "@osaxyz/carboncopy"

async function main() {
    const doc = new PDFDocument()
    const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

    // 画像を読み込み
    const image_data = new Uint8Array(readFileSync("./image.png"))

    // 埋め込み
    const context = doc.getEmbedContext()
    const embedded = await embedImage(image_data, context)
    doc.syncEmbedContext(context)

    doc.addImage(embedded.name, embedded.ref, embedded.width, embedded.height)
    doc.applyImageToPage(page, embedded.name)

    // 描画（x, y, width, height）
    page.drawImage(embedded.name, 50, 500, 300, 200)

    const pdf_bytes = doc.save()
    writeFileSync("with-image.pdf", new PDFResult(pdf_bytes).toUint8Array())
}

main()
```

## 画像の位置とサイズ

```typescript
// drawImage(name, x, y, width, height)
// x, y: 左下の座標
// width, height: 描画サイズ

// 原寸で描画
page.drawImage(embedded.name, 50, 500, embedded.width, embedded.height)

// スケール指定
const scale = 0.5
page.drawImage(
    embedded.name,
    50,
    500,
    embedded.width * scale,
    embedded.height * scale
)

// アスペクト比を維持してリサイズ
const max_width = 400
const max_height = 300
const aspect = embedded.width / embedded.height

let draw_width = max_width
let draw_height = max_width / aspect

if (draw_height > max_height) {
    draw_height = max_height
    draw_width = max_height * aspect
}

page.drawImage(embedded.name, 50, 500, draw_width, draw_height)
```

## 画像タイプの検出

```typescript
import { detectImageType } from "@osaxyz/carboncopy"

const image_data = new Uint8Array(await response.arrayBuffer())
const type = detectImageType(image_data)

console.log(type) // "jpeg" | "png" | "unknown"
```

## 複数の画像

```typescript
const images = ["logo.png", "photo.jpg", "chart.png"]
const embedded_images: EmbeddedImage[] = []

for (const filename of images) {
    const data = new Uint8Array(readFileSync(filename))
    const context = doc.getEmbedContext()
    const embedded = await embedImage(data, context)
    doc.syncEmbedContext(context)

    doc.addImage(embedded.name, embedded.ref, embedded.width, embedded.height)
    embedded_images.push(embedded)
}

const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

// 各画像をページに適用
for (const img of embedded_images) {
    doc.applyImageToPage(page, img.name)
}

// 描画
let y = 700
for (const img of embedded_images) {
    page.drawImage(img.name, 50, y, 100, 75)
    y -= 100
}
```

## 透過PNG

PNG のアルファチャンネルは SMask として処理されます。

```typescript
// 透過部分は自動的に処理されます
const png_with_alpha = new Uint8Array(readFileSync("transparent.png"))
const embedded = await embedImage(png_with_alpha, context)

// 背景の上に重ねて描画
page.drawRect(50, 500, 200, 150, { fill: { r: 0.9, g: 0.9, b: 0.9 } })
page.drawImage(embedded.name, 50, 500, 200, 150)
// → 透過部分から背景が見える
```

## JPEG の品質

JPEG は DCTDecode フィルタでそのまま埋め込まれるため、元の品質が維持されます。

```typescript
// JPEG はバイナリデータをそのまま使用
// 再圧縮は行わない → 品質劣化なし
```

## エラーハンドリング

```typescript
import { detectImageType, embedImage } from "@osaxyz/carboncopy"

async function safeEmbedImage(data: Uint8Array, context: ImageEmbedContext) {
    const type = detectImageType(data)

    if (type === "unknown") {
        throw new Error("Unsupported image format")
    }

    try {
        return await embedImage(data, context)
    } catch (error) {
        console.error("Failed to embed image:", error)
        throw error
    }
}
```

## パフォーマンス

- 大きな画像はファイルサイズに影響します
- 必要に応じて事前にリサイズすることを推奨
- PNG は FlateDecode で圧縮されます
- JPEG は圧縮済みのためそのまま埋め込み
