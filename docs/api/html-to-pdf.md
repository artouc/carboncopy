# convert()

HTML要素をPDFに変換するメインAPIです。

## インポート

```typescript
import { convert } from "@osaxyz/carboncopy"
```

## シグネチャ

```typescript
function convert(
    element: Element,
    options?: ConvertOptions
): Promise<PDFResult>
```

## 基本的な使い方

```typescript
const element = document.getElementById("content")
const result = await convert(element)
result.download("document.pdf")
```

## パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| element | Element | 変換対象のHTML要素 |
| options | ConvertOptions | 変換オプション（任意） |

## ConvertOptions

```typescript
interface ConvertOptions {
    /** ページサイズ: 'auto' | 'A4' | 'Letter' | [width, height] (mm) */
    format?: "auto" | "A4" | "A3" | "A5" | "Letter" | "Legal" | [number, number]

    /** ページの向き（format が 'auto' の場合は無視） */
    orientation?: "portrait" | "landscape"

    /** マージン（mm単位） */
    margin?: {
        top?: number
        right?: number
        bottom?: number
        left?: number
    }

    /** 背景色を含めるか */
    background?: boolean

    /** 無視する要素のセレクタ */
    ignoreSelectors?: string[]

    /** ドキュメント情報 */
    info?: {
        title?: string
        author?: string
        subject?: string
    }

    /** 進捗コールバック */
    onProgress?: (progress: number) => void
}
```

### デフォルト値

| オプション | デフォルト値 |
|-----------|------------|
| format | `"auto"` |
| orientation | `"portrait"` |
| margin | `{ top: 0, right: 0, bottom: 0, left: 0 }` |
| background | `true` |

### 戻り値

`Promise<PDFResult>` - PDF生成結果

## 使用例

### 基本

```typescript
import { convert } from "@osaxyz/carboncopy"

const element = document.getElementById("content")
const result = await convert(element)
result.download("document.pdf")
```

### 自動サイズ（デフォルト）

```typescript
// HTML要素のサイズに合わせてPDFサイズが決まる
const result = await convert(element)  // format: "auto"
```

### 固定サイズ

```typescript
const result = await convert(element, {
    format: "A4",
    orientation: "landscape",
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
})
```

### カスタムサイズ（mm指定）

```typescript
const result = await convert(element, {
    format: [200, 300],  // 200mm x 300mm
})
```

### メタデータ付き

```typescript
const result = await convert(element, {
    info: {
        title: "Invoice #001",
        author: "My Company",
    },
})
```

### 進捗表示

```typescript
const result = await convert(element, {
    onProgress: (progress) => {
        console.log(`${Math.round(progress * 100)}% complete`)
    },
})
```

## フォントマッピング

HTMLの `font-family` は自動的にPDF標準フォントにマッピングされます。

| CSS font-family | PDFフォント |
|-----------------|------------|
| serif, Times, Georgia, Palatino | Times ファミリー |
| monospace, Courier, Consolas, Monaco | Courier ファミリー |
| sans-serif, Arial, Helvetica, その他 | Helvetica ファミリー |

`font-weight` と `font-style` も反映されます:

- `font-weight: bold` (700以上) → Bold バリアント
- `font-style: italic/oblique` → Italic/Oblique バリアント

::: warning
PDF標準フォントは日本語をサポートしていません。日本語を含む場合は [日本語フォント](/guide/japanese-fonts) を参照してください。
:::

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
