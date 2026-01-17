# HtmlToPdf

HTML要素をPDFに変換する高レベルAPIです。

## インポート

```typescript
import { convert, HtmlToPdf } from "@osaxyz/carboncopy"
```

## convert 関数

### シグネチャ

```typescript
function convert(
    element: HTMLElement,
    options?: ConvertOptions
): Promise<PDFResult>
```

### パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| element | HTMLElement | 変換対象のHTML要素 |
| options | ConvertOptions | 変換オプション（任意） |

### ConvertOptions

```typescript
interface ConvertOptions {
    /** ページフォーマット */
    format?: "A4" | "A3" | "A5" | "Letter" | "Legal"

    /** ページの向き */
    orientation?: "portrait" | "landscape"

    /** マージン（pt単位） */
    margin?: {
        top?: number
        right?: number
        bottom?: number
        left?: number
    }

    /** カスタムフォント */
    fonts?: Array<{
        name: string
        url: string
    }>

    /** PDFメタデータ */
    title?: string
    author?: string

    /** 背景を含めるか */
    includeBackground?: boolean
}
```

### 戻り値

`Promise<PDFResult>` - PDF生成結果

### 使用例

```typescript
import { convert } from "@osaxyz/carboncopy"

// 基本的な使い方
const element = document.getElementById("content")
const result = await convert(element)
result.download("document.pdf")

// オプション指定
const result = await convert(element, {
    format: "A4",
    orientation: "portrait",
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    title: "My Document",
    author: "carboncopy",
    includeBackground: true,
})
```

## HtmlToPdf クラス

より細かい制御が必要な場合に使用します。

### コンストラクタ

```typescript
const converter = new HtmlToPdf(options?: ConvertOptions)
```

### メソッド

#### render

```typescript
async render(element: HTMLElement): Promise<void>
```

HTML要素を解析してPDFコンテンツを構築します。

#### save

```typescript
save(): PDFResult
```

PDFを生成して結果を返します。

### 使用例

```typescript
import { HtmlToPdf } from "@osaxyz/carboncopy"

const converter = new HtmlToPdf({
    format: "A4",
    margin: { top: 40, right: 40, bottom: 40, left: 40 },
})

await converter.render(document.getElementById("page1"))
// 追加のレンダリング処理...

const result = converter.save()
result.download("multi-section.pdf")
```

## 動作の仕組み

1. **DOM解析**: `getBoundingClientRect()` で要素の位置・サイズを取得
2. **スタイル抽出**: `getComputedStyle()` でスタイルを取得
3. **座標変換**: CSS座標系（左上原点）からPDF座標系（左下原点）へ変換
4. **描画**: ベクターデータとしてPDFに出力

```
HTML Element
    ↓ getBoundingClientRect()
Position/Size (px)
    ↓ getComputedStyle()
Styles (colors, fonts, etc.)
    ↓ UnitConverter (px → pt)
PDF Coordinates
    ↓ PDFContentStream
PDF Output
```

## サポートされる要素

| 要素 | 対応状況 | 備考 |
|------|---------|------|
| div, section, article | ✅ | 背景・境界線・角丸 |
| p, span, h1-h6 | ✅ | テキスト描画 |
| table, tr, td, th | ✅ | テーブルレイアウト |
| ul, ol, li | ✅ | リストマーカー |
| img | ✅ | JPEG/PNG |
| a | ⚠️ | テキストのみ（リンクなし） |
| input, button | ⚠️ | 見た目のみ |
| canvas | ❌ | 非対応 |
| video, audio | ❌ | 非対応 |
| iframe | ❌ | 非対応 |

## サポートされるCSSプロパティ

### ボックスモデル
- `width`, `height`
- `padding`, `margin`
- `border`, `border-radius`

### 背景
- `background-color`
- `background-image` (linear-gradient のみ限定対応)

### テキスト
- `font-family`, `font-size`, `font-weight`, `font-style`
- `color`
- `text-align`
- `text-decoration`
- `line-height`

### レイアウト
- `display` (block, inline, flex, grid)
- `position` (static, relative, absolute)
- Flexbox プロパティ
- Grid プロパティ

## 制限事項

1. **外部リソース**: CORSの制限を受ける場合があります
2. **Webフォント**: 事前にフォントを読み込む必要があります
3. **アニメーション**: 静的な状態のみ取得
4. **擬似要素**: `::before`, `::after` は限定的な対応
5. **CSS変数**: `var()` は計算後の値を使用
