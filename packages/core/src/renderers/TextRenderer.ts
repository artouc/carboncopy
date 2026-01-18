/**
 * TextRenderer - テキストの描画
 *
 * DOM上のテキストノードをPDFに描画する。
 * - フォント選択（標準フォント/埋め込みフォント）
 * - 位置計算（ベースライン調整）
 * - 行分割
 */

import type { PDFPage } from '../pdf/PDFPage.js';
import type { UnitConverter } from '../utils/UnitConverter.js';
import type { TextRenderNode } from '../dom/DOMWalker.js';
import type { RGBAColor } from '../utils/ColorParser.js';
import { mapCSSFontToStandard } from '../fonts/StandardFonts.js';

/**
 * フォントマッピング情報
 */
export interface FontMapping {
  /** PDFフォント名（F1, F2, ...） */
  pdfName: string;
  /** 標準フォント名またはカスタムフォント名 */
  baseFontName: string;
  /** CSSフォントファミリー */
  cssFamily: string;
  /** フォントウェイト */
  weight: number;
  /** フォントスタイル */
  style: 'normal' | 'italic' | 'oblique';
}

/**
 * テキストレンダリングコンテキスト
 */
export interface TextRenderContext {
  page: PDFPage;
  converter: UnitConverter;
  fontMappings: Map<string, FontMapping>;
  nextFontId: number;
}

/**
 * テキストノードを描画
 */
export function renderText(
  node: TextRenderNode,
  context: TextRenderContext
): void {
  const { page, converter, fontMappings } = context;
  const { textContent, x, y, font, color } = node;

  if (!textContent.trim()) {
    return;
  }

  // フォントマッピングを取得または作成
  const fontMapping = getOrCreateFontMapping(font, context);

  // PDF座標に変換
  // テキストのベースラインを計算
  // CSSのyは要素の上端、PDFではベースラインからの位置
  const baselineOffset = calculateBaselineOffset(font);
  const pdfX = converter.convertX(x);
  const pdfY = converter.convertY(y + baselineOffset, 0);
  const pdfFontSize = converter.convertFontSize(font.size);

  // テキストを描画
  page.drawText(textContent, pdfX, pdfY, {
    font: fontMapping.pdfName,
    fontSize: pdfFontSize,
    color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
  });
}

/**
 * 複数行テキストを描画
 */
export function renderMultilineText(
  lines: Array<{ text: string; x: number; y: number }>,
  font: TextRenderNode['font'],
  color: RGBAColor | null,
  context: TextRenderContext
): void {
  const { page, converter } = context;

  if (lines.length === 0) {
    return;
  }

  const fontMapping = getOrCreateFontMapping(font, context);
  const pdfFontSize = converter.convertFontSize(font.size);
  const baselineOffset = calculateBaselineOffset(font);

  for (const line of lines) {
    if (!line.text.trim()) continue;

    const pdfX = converter.convertX(line.x);
    const pdfY = converter.convertY(line.y + baselineOffset, 0);

    page.drawText(line.text, pdfX, pdfY, {
      font: fontMapping.pdfName,
      fontSize: pdfFontSize,
      color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
    });
  }
}

/**
 * フォントマッピングを取得または作成
 */
function getOrCreateFontMapping(
  font: TextRenderNode['font'],
  context: TextRenderContext
): FontMapping {
  // フォントキーを生成（ファミリー + ウェイト + スタイル）
  const fontKey = `${font.family}|${font.weight}|${font.style}`;

  let mapping = context.fontMappings.get(fontKey);
  if (mapping) {
    return mapping;
  }

  // 標準フォントにマッピング
  const baseFontName = mapCSSFontToStandard(font.family, font.weight, font.style);
  const pdfName = `F${context.nextFontId++}`;

  mapping = {
    pdfName,
    baseFontName,
    cssFamily: font.family,
    weight: font.weight,
    style: font.style,
  };

  context.fontMappings.set(fontKey, mapping);
  return mapping;
}

/**
 * ベースラインオフセットを計算
 *
 * CSSではテキスト位置は要素の上端基準だが、
 * PDFではベースライン基準。
 * line-heightが1より大きい場合、テキストはライン内で垂直中央揃えされる。
 */
function calculateBaselineOffset(font: TextRenderNode['font']): number {
  const { size: fontSize, lineHeight } = font;

  // line-heightによる余白を計算
  // テキストはライン内で垂直中央に配置される
  const extraSpace = lineHeight - fontSize;
  const topPadding = extraSpace / 2;

  // ベースラインはフォントの上端から約80%の位置
  // (正確にはascender ratioだが、標準フォントでは0.8で近似)
  const ascenderRatio = 0.8;

  return topPadding + fontSize * ascenderRatio;
}

/**
 * テキスト装飾を描画（下線、取り消し線など）
 */
export function renderTextDecoration(
  node: TextRenderNode,
  context: TextRenderContext,
  decoration: string
): void {
  if (decoration === 'none' || !node.color) {
    return;
  }

  const { page, converter } = context;
  const { x, y, width, font, color } = node;

  const lineWidth = Math.max(1, font.size / 12); // 線の太さ
  const baselineOffset = calculateBaselineOffset(font);

  // 下線
  if (decoration.includes('underline')) {
    const underlineY = y + baselineOffset + font.size * 0.1;
    page.drawLine(
      converter.convertX(x),
      converter.convertY(underlineY, 0),
      converter.convertX(x + width),
      converter.convertY(underlineY, 0),
      { color, width: converter.pxToPt(lineWidth) }
    );
  }

  // 取り消し線
  if (decoration.includes('line-through')) {
    const strikeY = y + font.size * 0.5;
    page.drawLine(
      converter.convertX(x),
      converter.convertY(strikeY, 0),
      converter.convertX(x + width),
      converter.convertY(strikeY, 0),
      { color, width: converter.pxToPt(lineWidth) }
    );
  }

  // 上線
  if (decoration.includes('overline')) {
    const overlineY = y + font.size * 0.1;
    page.drawLine(
      converter.convertX(x),
      converter.convertY(overlineY, 0),
      converter.convertX(x + width),
      converter.convertY(overlineY, 0),
      { color, width: converter.pxToPt(lineWidth) }
    );
  }
}

/**
 * すべてのフォントマッピングを取得
 */
export function getAllFontMappings(context: TextRenderContext): FontMapping[] {
  return Array.from(context.fontMappings.values());
}

/**
 * テキストレンダリングコンテキストを作成
 */
export function createTextRenderContext(
  page: PDFPage,
  converter: UnitConverter
): TextRenderContext {
  return {
    page,
    converter,
    fontMappings: new Map(),
    nextFontId: 1,
  };
}
