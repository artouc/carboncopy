# テーブル

carboncopy はHTMLテーブル要素のレンダリングをサポートしています。

## HTML→PDF 変換でのテーブル

```typescript
import { convert } from "@osaxyz/carboncopy"

const html = `
<table style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background: #333; color: white;">
      <th style="border: 1px solid #ddd; padding: 12px;">品目</th>
      <th style="border: 1px solid #ddd; padding: 12px;">数量</th>
      <th style="border: 1px solid #ddd; padding: 12px;">単価</th>
      <th style="border: 1px solid #ddd; padding: 12px;">金額</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 12px;">商品A</td>
      <td style="border: 1px solid #ddd; padding: 12px;">10</td>
      <td style="border: 1px solid #ddd; padding: 12px;">¥1,000</td>
      <td style="border: 1px solid #ddd; padding: 12px;">¥10,000</td>
    </tr>
  </tbody>
</table>
`

// HTMLを含む要素を変換
const element = document.getElementById("invoice")
const result = await convert(element, { format: "A4" })
result.download("invoice.pdf")
```

## ローレベルAPI でのテーブル描画

```typescript
import { PDFDocument, PAGE_SIZES, renderTable, collectTableCells } from "@osaxyz/carboncopy"

// テーブル要素から情報を収集
const table_element = document.querySelector("table")
const cells = collectTableCells(table_element)

// PDFに描画
const doc = new PDFDocument()
const page = doc.addPage(PAGE_SIZES.A4.width, PAGE_SIZES.A4.height)

doc.addStandardFont("F1", "Helvetica")
doc.applyFontToPage(page, "F1")

renderTable(page, cells, {
    offsetX: 0,
    offsetY: 0,
    converter: new UnitConverter(),
})
```

## テーブルスタイル

### border-collapse

```html
<!-- セルの境界線を結合 -->
<table style="border-collapse: collapse;">
  ...
</table>

<!-- セルの境界線を分離 -->
<table style="border-collapse: separate; border-spacing: 5px;">
  ...
</table>
```

### 境界線のスタイル

```html
<td style="
  border: 1px solid #333;
  border-top: 2px solid #000;
  border-bottom: none;
">
  Content
</td>
```

### 背景色

```html
<tr style="background-color: #f5f5f5;">
  <td>Striped row</td>
</tr>

<td style="background-color: #fef3c7;">
  Highlighted cell
</td>
```

## 請求書テンプレート例

```html
<div id="invoice" style="font-family: sans-serif; padding: 40px;">
  <h1 style="color: #333;">請求書</h1>

  <div style="margin-bottom: 20px;">
    <p>請求日: 2024年1月15日</p>
    <p>請求番号: INV-2024-001</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <thead>
      <tr style="background: #2563eb; color: white;">
        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">品目</th>
        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">数量</th>
        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">単価</th>
        <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">金額</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px;">Webサイト制作</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">1</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">¥500,000</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">¥500,000</td>
      </tr>
      <tr style="background: #f9fafb;">
        <td style="border: 1px solid #ddd; padding: 12px;">保守サポート</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">12</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">¥10,000</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">¥120,000</td>
      </tr>
    </tbody>
    <tfoot>
      <tr style="font-weight: bold;">
        <td colspan="3" style="border: 1px solid #ddd; padding: 12px; text-align: right;">合計</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">¥620,000</td>
      </tr>
    </tfoot>
  </table>
</div>
```

## 制限事項

1. **colspan/rowspan**: 基本的な結合セルに対応
2. **固定幅**: `width` スタイルで幅を指定することを推奨
3. **自動幅調整**: ブラウザのレイアウト計算に依存

## パフォーマンス

大きなテーブル（1000行以上）の場合:

- ページ分割を検討
- 必要なデータのみを描画
- 仮想化は非対応（すべてのセルを描画）
