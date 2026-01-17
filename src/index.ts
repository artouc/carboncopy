/**
 * precise-html-pdf
 *
 * High-precision HTML to PDF converter
 * 位置関係・スタイルを正確に保ったHTML→PDF変換
 */

// Internal imports for use in this module
import { PDFDocument } from './pdf/PDFDocument.js';
import { PDFPage } from './pdf/PDFPage.js';
import { PDFContentStream, type RGBColor } from './pdf/PDFContentStream.js';
import { PDFResult } from './api/PDFResult.js';

// PDF Core - re-export
export { PDFDocument, PDFPage, PDFContentStream, type RGBColor };

// PDF Objects
export {
  PDFNull,
  PDFBoolean,
  PDFNumber,
  PDFString,
  PDFHexString,
  PDFName,
  PDFArray,
  PDFDict,
  PDFRef,
  PDFStream,
  PDFIndirectObject,
} from './pdf/objects/PDFObject.js';

// Fonts
export {
  StandardFonts,
  type StandardFontName,
  mapCSSFontToStandard,
  measureTextWidth,
  HelveticaWidths,
} from './fonts/StandardFonts.js';
export {
  FontManager,
  fontManager,
  type LoadedFont,
  type FontMetrics,
} from './fonts/FontManager.js';
export {
  collectSubsetInfo,
  getSubsetGlyphIds,
  getGlyphId,
  logSubsetInfo,
  buildOptimizedWidthArray,
  groupConsecutiveGlyphs,
  isSubsettingBeneficial,
  estimateSubsetSize,
  type SubsetInfo,
} from './fonts/FontSubsetter.js';

// Utils
export {
  UnitConverter,
  PAGE_SIZES,
  type PageSize,
  type PageDimensions,
  type Margins,
} from './utils/UnitConverter.js';

export {
  parseColor,
  colorToString,
  isTransparent,
  isValidColor,
  type RGBAColor,
} from './utils/ColorParser.js';

// DOM
export {
  walkDOM,
  flattenNodes,
  sortByZIndex,
  getTextLines,
  type RenderNode,
  type ElementRenderNode,
  type TextRenderNode,
  type ImageRenderNode,
  type WalkOptions,
} from './dom/DOMWalker.js';

export {
  extractStyles,
  extractTextStyles,
  isVisible,
  needsClipping,
  type ExtractedStyles,
  type BoxModel,
  type FontInfo,
  type BorderInfo,
} from './dom/StyleExtractor.js';

// Renderers
export { renderBox, setClipRect } from './renderers/BoxRenderer.js';
export {
  renderText,
  renderMultilineText,
  renderTextDecoration,
  createTextRenderContext,
  getAllFontMappings,
  type FontMapping,
  type TextRenderContext,
} from './renderers/TextRenderer.js';
export {
  renderTable,
  collectTableCells,
  isTableElement,
  isTableCellElement,
  isTableRowElement,
  type TableCell,
  type TableRenderOptions,
} from './renderers/TableRenderer.js';
export {
  renderListMarkers,
  collectListItems,
  isListElement,
  isListItemElement,
  type ListStyleType,
  type ListItemInfo,
} from './renderers/ListRenderer.js';
export {
  renderImage,
  embedImage,
  embedImageFromURL,
  embedImageFromElement,
  detectImageType,
  type EmbeddedImage,
  type ImageEmbedContext,
  type ImageType,
} from './renderers/ImageRenderer.js';

// High-level API
export { PDFResult } from './api/PDFResult.js';
export { HtmlToPdf, convert, type ConvertOptions } from './api/HtmlToPdf.js';

// ============================================
// シンプルなPDF生成API
// ============================================

import { PAGE_SIZES as _PAGE_SIZES } from './utils/UnitConverter.js';

/**
 * シンプルなPDFを作成
 *
 * @example
 * ```typescript
 * const pdf = createPDF({
 *   format: 'A4',
 *   title: 'My Document',
 * });
 *
 * pdf.addPage();
 * pdf.drawText('Hello World!', 50, 750, {
 *   font: 'Helvetica',
 *   fontSize: 24,
 * });
 *
 * const result = pdf.save();
 * result.download('hello.pdf');
 * ```
 */
export function createPDF(options: {
  format?: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  author?: string;
} = {}): SimplePDFBuilder {
  return new SimplePDFBuilder(options);
}

export class SimplePDFBuilder {
  private doc: PDFDocument;
  private currentPage: PDFPage | null = null;
  private pageWidth: number;
  private pageHeight: number;
  private fontMap: Map<string, string> = new Map();

  constructor(options: {
    format?: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    title?: string;
    author?: string;
  } = {}) {
    this.doc = new PDFDocument();

    const format = options.format ?? 'A4';
    const size = _PAGE_SIZES[format];
    this.pageWidth = size.width;
    this.pageHeight = size.height;

    if (options.orientation === 'landscape') {
      [this.pageWidth, this.pageHeight] = [this.pageHeight, this.pageWidth];
    }

    if (options.title || options.author) {
      this.doc.setInfo({
        title: options.title,
        author: options.author,
      });
    }
  }

  /**
   * 新しいページを追加
   */
  addPage(): this {
    this.currentPage = this.doc.addPage(this.pageWidth, this.pageHeight);
    return this;
  }

  /**
   * テキストを描画
   */
  drawText(
    text: string,
    x: number,
    y: number,
    options: {
      font?: string;
      fontSize?: number;
      color?: RGBColor;
    } = {}
  ): this {
    if (!this.currentPage) {
      this.addPage();
    }

    const fontName = options.font ?? 'Helvetica';
    const fontSize = options.fontSize ?? 12;
    const color = options.color;

    // フォントを登録（まだの場合）
    let fontKey = this.fontMap.get(fontName);
    if (!fontKey) {
      fontKey = `F${this.fontMap.size + 1}`;
      this.doc.addStandardFont(fontKey, fontName);
      this.doc.applyFontToPage(this.currentPage!, fontKey);
      this.fontMap.set(fontName, fontKey);
    } else {
      // 新しいページの場合、フォントを適用
      this.doc.applyFontToPage(this.currentPage!, fontKey);
    }

    this.currentPage!.drawText(text, x, y, {
      font: fontKey,
      fontSize,
      color,
    });

    return this;
  }

  /**
   * 矩形を描画
   */
  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fill?: RGBColor;
      stroke?: RGBColor;
      lineWidth?: number;
    } = {}
  ): this {
    if (!this.currentPage) {
      this.addPage();
    }

    this.currentPage!.drawRect(x, y, width, height, options);
    return this;
  }

  /**
   * 直線を描画
   */
  drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: {
      color?: RGBColor;
      width?: number;
    } = {}
  ): this {
    if (!this.currentPage) {
      this.addPage();
    }

    this.currentPage!.drawLine(x1, y1, x2, y2, options);
    return this;
  }

  /**
   * PDFを保存
   */
  save(): PDFResult {
    const data = this.doc.save();
    return new PDFResult(data);
  }
}
