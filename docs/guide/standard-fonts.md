# PDF標準フォント

## 概要

PDF仕様では「標準14フォント」が定義されており、これらのフォントはすべてのPDFビューワーに組み込まれています。フォントファイルをPDFに埋め込む必要がないため、ファイルサイズを小さく保てます。

## carboncopy で使用可能なフォント

carboncopy では、標準フォントのうち **serif**、**sans-serif**、**monospace** の3ファミリー（計12フォント）をサポートしています。

### sans-serif（Helvetica）

| フォント名 | スタイル |
|-----------|---------|
| `Helvetica` | 標準 |
| `Helvetica-Bold` | 太字 |
| `Helvetica-Oblique` | 斜体 |
| `Helvetica-BoldOblique` | 太字斜体 |

### serif（Times）

| フォント名 | スタイル |
|-----------|---------|
| `Times-Roman` | 標準 |
| `Times-Bold` | 太字 |
| `Times-Italic` | 斜体 |
| `Times-BoldItalic` | 太字斜体 |

### monospace（Courier）

| フォント名 | スタイル |
|-----------|---------|
| `Courier` | 標準 |
| `Courier-Bold` | 太字 |
| `Courier-Oblique` | 斜体 |
| `Courier-BoldOblique` | 太字斜体 |

## クロスプラットフォーム対応

### なぜどの環境でも動作するのか

PDF標準フォントは **OSではなくPDFビューワー** が描画を担当します。

### OS別の表示

| OS | Helvetica | Times-Roman | Courier |
|----|-----------|-------------|---------|
| Windows | Arial で代替 | Times New Roman で代替 | Courier New で代替 |
| macOS | ネイティブ | ネイティブ | ネイティブ |
| Linux | Liberation Sans 等 | Liberation Serif 等 | Liberation Mono 等 |

::: info メトリクス互換
Arial と Helvetica は「メトリクス互換」設計されており、文字幅やスペーシングがほぼ同一です。そのため、Windows で Arial に代替表示されても、レイアウトが崩れることはありません。
:::

## メリットとデメリット

### メリット

- **ファイルサイズが小さい**: フォントデータを埋め込まないため、PDFサイズを最小限に抑えられる
- **高速な生成**: フォント処理が不要で生成が高速
- **確実な表示**: すべてのPDFビューワーで表示可能
- **テキスト選択・検索**: ベクターテキストとして埋め込まれるため、コピー&ペーストや検索が可能

### デメリット

- **ASCII文字のみ**: 日本語、中国語、韓国語などは表示できない
- **フォントの選択肢が限定的**: デザインの自由度が低い
- **微妙な表示差**: OS/ビューワーによって若干の見た目の違いがある

## 使用例

### シンプルAPI

```typescript
import { createPDF } from "@osaxyz/carboncopy"

const pdf = createPDF({ format: "A4" })
pdf.addPage()

// sans-serif
pdf.drawText("Hello, World!", 50, 750, {
    font: "Helvetica",
    fontSize: 24,
})

// serif
pdf.drawText("Hello, World!", 50, 700, {
    font: "Times-Roman",
    fontSize: 24,
})

// monospace
pdf.drawText("const code = 'example'", 50, 650, {
    font: "Courier",
    fontSize: 14,
})

// 太字・斜体
pdf.drawText("Bold Text", 50, 600, {
    font: "Helvetica-Bold",
    fontSize: 18,
})

pdf.drawText("Italic Text", 50, 570, {
    font: "Times-Italic",
    fontSize: 18,
})

const result = pdf.save()
result.download("standard-fonts.pdf")
```

### ローレベルAPI

```typescript
import { PDFDocument, PAGE_SIZES } from "@osaxyz/carboncopy"

const doc = new PDFDocument()

// フォントを登録
doc.addStandardFont("sans", "Helvetica")
doc.addStandardFont("serif", "Times-Roman")
doc.addStandardFont("mono", "Courier")

const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

// ページにフォントを適用
doc.applyFontToPage(page, "sans")
doc.applyFontToPage(page, "serif")
doc.applyFontToPage(page, "mono")

// 描画
page.drawText("Sans-serif text", 50, 750, {
    font: "sans",
    fontSize: 16,
})

page.drawText("Serif text", 50, 720, {
    font: "serif",
    fontSize: 16,
})

page.drawText("Monospace text", 50, 690, {
    font: "mono",
    fontSize: 16,
})

const bytes = doc.save()
```

## HTMLからの自動マッピング

`convert()` 関数でHTML要素をPDFに変換する際、CSSの `font-family` 設定が自動的にPDF標準フォントにマッピングされます。

### マッピングルール

| CSS font-family | PDFフォント |
|-----------------|------------|
| `serif`, `Times`, `Times New Roman`, `Georgia`, `Palatino`, `Cambria` | Times ファミリー |
| `monospace`, `Courier`, `Consolas`, `Monaco`, `Menlo` | Courier ファミリー |
| `sans-serif`, `Arial`, `Helvetica`, その他 | Helvetica ファミリー |

### font-weight / font-style の反映

CSSの `font-weight` と `font-style` も自動的に反映されます。

```html
<!-- Helvetica -->
<p style="font-family: sans-serif;">Normal</p>

<!-- Helvetica-Bold -->
<p style="font-family: sans-serif; font-weight: bold;">Bold</p>

<!-- Times-Roman -->
<p style="font-family: Georgia, serif;">Serif</p>

<!-- Times-BoldItalic -->
<p style="font-family: serif; font-weight: 700; font-style: oblique;">
    Bold Italic Serif
</p>

<!-- Courier -->
<code style="font-family: monospace;">Code</code>

<!-- Courier-Bold -->
<code style="font-family: Consolas, monospace; font-weight: bold;">
    Bold Code
</code>
```

## 日本語を使用する場合

PDF標準フォントは日本語をサポートしていません。日本語テキストを含むPDFを生成するには、TTF/OTFフォントを埋め込む必要があります。

```typescript
// NG: 標準フォントでは日本語は表示できない
pdf.drawText("こんにちは", 50, 750, { font: "Helvetica" })
// → 文字化けまたは空白になる

// OK: カスタムフォントを埋め込む
doc.addCustomFont("NotoSansJP", loaded_font, "こんにちは")
```

詳しくは [日本語フォント](/guide/japanese-fonts) を参照してください。

## PDF仕様の標準14フォント（参考）

PDF仕様では以下の14フォントが定義されています。carboncopy では太字で示した12フォントをサポートしています。

| フォント | carboncopy |
|---------|------------|
| **Helvetica** | ✓ |
| **Helvetica-Bold** | ✓ |
| **Helvetica-Oblique** | ✓ |
| **Helvetica-BoldOblique** | ✓ |
| **Times-Roman** | ✓ |
| **Times-Bold** | ✓ |
| **Times-Italic** | ✓ |
| **Times-BoldItalic** | ✓ |
| **Courier** | ✓ |
| **Courier-Bold** | ✓ |
| **Courier-Oblique** | ✓ |
| **Courier-BoldOblique** | ✓ |
| Symbol | - |
| ZapfDingbats | - |

## 次のステップ

- [テキスト描画](/guide/text-rendering) - テキストの詳細な描画方法
- [日本語フォント](/guide/japanese-fonts) - 日本語対応の方法
