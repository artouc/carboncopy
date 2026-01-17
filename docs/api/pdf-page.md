# PDFPage

PDFページへの描画操作を提供するクラスです。

## インポート

```typescript
import { PDFDocument, PDFPage } from "@osaxyz/carboncopy"
```

## インスタンスの取得

`PDFPage` は `PDFDocument.addPage()` から取得します。

```typescript
const doc = new PDFDocument()
const page = doc.addPage(595, 842) // PDFPage インスタンス
```

## 描画メソッド

### drawText

テキストを描画します（標準フォント用）。

```typescript
page.drawText(text: string, x: number, y: number, options?: TextOptions)
```

#### パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| text | string | 描画するテキスト |
| x | number | X座標（pt） |
| y | number | Y座標（pt） |
| options | TextOptions | 描画オプション |

#### TextOptions

```typescript
interface TextOptions {
    font?: string      // フォントキー
    fontSize?: number  // フォントサイズ（pt）
    color?: RGBColor   // テキスト色
}
```

#### 使用例

```typescript
page.drawText("Hello", 50, 700, {
    font: "F1",
    fontSize: 24,
    color: { r: 0, g: 0, b: 0 },
})
```

### drawTextCID

CIDフォント（日本語等）用のテキスト描画です。

```typescript
page.drawTextCID(hexString: string, x: number, y: number, options?: TextOptions)
```

#### パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| hexString | string | Hex エンコードされたグリフID列 |
| x | number | X座標（pt） |
| y | number | Y座標（pt） |
| options | TextOptions | 描画オプション |

#### 使用例

```typescript
const hex = doc.textToHex("NotoSansJP", "こんにちは")
page.drawTextCID(hex, 50, 700, {
    font: "NotoSansJP",
    fontSize: 24,
})
```

### drawRect

矩形を描画します。

```typescript
page.drawRect(x: number, y: number, width: number, height: number, options?: RectOptions)
```

#### パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| x | number | 左下X座標 |
| y | number | 左下Y座標 |
| width | number | 幅 |
| height | number | 高さ |
| options | RectOptions | 描画オプション |

#### RectOptions

```typescript
interface RectOptions {
    fill?: RGBColor      // 塗りつぶし色
    stroke?: RGBColor    // 線の色
    lineWidth?: number   // 線の太さ
}
```

#### 使用例

```typescript
// 塗りつぶしのみ
page.drawRect(50, 600, 200, 100, {
    fill: { r: 0.9, g: 0.9, b: 0.9 },
})

// 枠線のみ
page.drawRect(50, 450, 200, 100, {
    stroke: { r: 0, g: 0, b: 0 },
    lineWidth: 2,
})

// 塗りつぶし + 枠線
page.drawRect(50, 300, 200, 100, {
    fill: { r: 0.95, g: 0.95, b: 1 },
    stroke: { r: 0.2, g: 0.4, b: 0.8 },
    lineWidth: 1,
})
```

### drawLine

直線を描画します。

```typescript
page.drawLine(x1: number, y1: number, x2: number, y2: number, options?: LineOptions)
```

#### パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| x1 | number | 始点X座標 |
| y1 | number | 始点Y座標 |
| x2 | number | 終点X座標 |
| y2 | number | 終点Y座標 |
| options | LineOptions | 描画オプション |

#### LineOptions

```typescript
interface LineOptions {
    color?: RGBColor   // 線の色
    width?: number     // 線の太さ
}
```

#### 使用例

```typescript
// 水平線
page.drawLine(50, 500, 545, 500, {
    color: { r: 0.8, g: 0.8, b: 0.8 },
    width: 1,
})

// 斜線
page.drawLine(50, 400, 200, 500, {
    color: { r: 1, g: 0, b: 0 },
    width: 2,
})
```

### drawImage

画像を描画します。

```typescript
page.drawImage(name: string, x: number, y: number, width: number, height: number)
```

#### パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| name | string | 画像リソース名 |
| x | number | 左下X座標 |
| y | number | 左下Y座標 |
| width | number | 描画幅 |
| height | number | 描画高さ |

#### 使用例

```typescript
// 画像を埋め込み済みの場合
page.drawImage("Img1", 50, 400, 200, 150)
```

### drawRoundedRect

角丸矩形を描画します。

```typescript
page.drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | { tl: number, tr: number, br: number, bl: number },
    options?: RectOptions
)
```

#### 使用例

```typescript
// 均一な角丸
page.drawRoundedRect(50, 500, 200, 100, 10, {
    fill: { r: 0.9, g: 0.9, b: 0.9 },
})

// 個別の角丸
page.drawRoundedRect(50, 350, 200, 100, {
    tl: 20, tr: 10, br: 5, bl: 0,
}, {
    fill: { r: 0.8, g: 0.9, b: 1 },
    stroke: { r: 0, g: 0.5, b: 1 },
})
```

## 座標系

PDFの座標系は左下が原点です。

```
(0, height) ────────────── (width, height)
     │                          │
     │     Y軸↑                 │
     │      │                   │
     │      └──→ X軸            │
     │                          │
  (0, 0) ─────────────────  (width, 0)
```

## 使用例

### 名刺サイズのカード

```typescript
const doc = new PDFDocument()

// 名刺サイズ: 91mm × 55mm
const card_width = 91 * 2.83465  // mm to pt
const card_height = 55 * 2.83465

const page = doc.addPage(card_width, card_height)

doc.addStandardFont("F1", "Helvetica-Bold")
doc.addStandardFont("F2", "Helvetica")
doc.applyFontToPage(page, "F1")
doc.applyFontToPage(page, "F2")

// 背景
page.drawRect(0, 0, card_width, card_height, {
    fill: { r: 0.1, g: 0.2, b: 0.4 },
})

// 名前
page.drawText("John Doe", 20, card_height - 40, {
    font: "F1",
    fontSize: 18,
    color: { r: 1, g: 1, b: 1 },
})

// 肩書き
page.drawText("Software Engineer", 20, card_height - 60, {
    font: "F2",
    fontSize: 10,
    color: { r: 0.8, g: 0.8, b: 0.8 },
})

// 連絡先
page.drawText("email@example.com", 20, 30, {
    font: "F2",
    fontSize: 9,
    color: { r: 1, g: 1, b: 1 },
})
```

### グリッドレイアウト

```typescript
const page = doc.addPage(595, 842)

const cols = 4
const rows = 6
const cell_width = 595 / cols
const cell_height = 842 / rows

// グリッド線を描画
for (let i = 0; i <= cols; i++) {
    const x = i * cell_width
    page.drawLine(x, 0, x, 842, {
        color: { r: 0.8, g: 0.8, b: 0.8 },
        width: 0.5,
    })
}

for (let j = 0; j <= rows; j++) {
    const y = j * cell_height
    page.drawLine(0, y, 595, y, {
        color: { r: 0.8, g: 0.8, b: 0.8 },
        width: 0.5,
    })
}
```

## 型定義

### RGBColor

```typescript
interface RGBColor {
    r: number  // 0-1
    g: number  // 0-1
    b: number  // 0-1
}
```
