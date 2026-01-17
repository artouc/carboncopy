/**
 * ListRenderer - リストの描画
 *
 * HTML リスト要素 (ul, ol) のマーカーをPDFに描画する。
 * - 箇条書き (disc, circle, square, etc.)
 * - 番号付き (decimal, lower-alpha, upper-alpha, etc.)
 * - カスタムマーカー
 */

import type { PDFPage } from '../pdf/PDFPage.js';
import type { UnitConverter } from '../utils/UnitConverter.js';
import type { RGBAColor } from '../utils/ColorParser.js';
import { extractStyles, extractTextStyles } from '../dom/StyleExtractor.js';

/**
 * リストマーカーの種類
 */
export type ListStyleType =
  | 'disc'
  | 'circle'
  | 'square'
  | 'decimal'
  | 'decimal-leading-zero'
  | 'lower-alpha'
  | 'upper-alpha'
  | 'lower-roman'
  | 'upper-roman'
  | 'lower-greek'
  | 'none';

/**
 * リストアイテムの情報
 */
export interface ListItemInfo {
  element: HTMLLIElement;
  index: number;
  markerRect: DOMRect | null;
  contentRect: DOMRect;
  listStyleType: ListStyleType;
  color: RGBAColor | null;
  fontSize: number;
}

/**
 * リストのマーカーを描画
 */
export function renderListMarkers(
  list: HTMLUListElement | HTMLOListElement,
  page: PDFPage,
  converter: UnitConverter
): void {
  const items = collectListItems(list);

  for (const item of items) {
    renderListItemMarker(item, page, converter);
  }
}

/**
 * リストアイテムを収集
 */
export function collectListItems(list: HTMLUListElement | HTMLOListElement): ListItemInfo[] {
  const items: ListItemInfo[] = [];
  const listStyle = getComputedStyle(list);
  const startValue = list instanceof HTMLOListElement ? list.start : 1;

  let index = startValue;

  for (const child of list.children) {
    if (child.tagName === 'LI') {
      const li = child as HTMLLIElement;
      const liStyle = getComputedStyle(li);
      const textStyles = extractTextStyles(li);

      // マーカーの位置を計算
      // list-style-position: inside/outside で異なる
      const contentRect = li.getBoundingClientRect();
      let markerRect: DOMRect | null = null;

      // マーカーの位置は list-style-position に依存
      // outside の場合、コンテンツの左側にマーカーがある
      const position = liStyle.listStylePosition;
      if (position === 'outside') {
        // マーカーはコンテンツ左側
        const markerWidth = textStyles.font.size * 1.5;
        markerRect = new DOMRect(
          contentRect.x - markerWidth,
          contentRect.y,
          markerWidth,
          textStyles.font.lineHeight
        );
      }

      // li要素のvalueプロパティがある場合はそれを使用
      const liValue = li.value;
      const actualIndex = liValue > 0 ? liValue : index;

      items.push({
        element: li,
        index: actualIndex,
        markerRect,
        contentRect,
        listStyleType: parseListStyleType(liStyle.listStyleType),
        color: textStyles.color,
        fontSize: textStyles.font.size,
      });

      index++;
    }
  }

  return items;
}

/**
 * リストアイテムのマーカーを描画
 */
function renderListItemMarker(
  item: ListItemInfo,
  page: PDFPage,
  converter: UnitConverter
): void {
  if (item.listStyleType === 'none') {
    return;
  }

  // マーカーの位置（outside の場合はmarkerRect、inside の場合はcontentRectの左端）
  const markerX = item.markerRect
    ? item.markerRect.x + item.markerRect.width * 0.5
    : item.contentRect.x;
  const markerY = item.contentRect.y + item.fontSize * 0.35; // 視覚的な中央

  if (isBulletStyle(item.listStyleType)) {
    renderBulletMarker(
      page,
      markerX,
      markerY,
      item.listStyleType,
      item.fontSize,
      item.color,
      converter
    );
  } else {
    renderNumberMarker(
      page,
      markerX,
      item.contentRect.y,
      item.index,
      item.listStyleType,
      item.fontSize,
      item.color,
      converter
    );
  }
}

/**
 * 箇条書きマーカーを描画
 */
function renderBulletMarker(
  page: PDFPage,
  x: number,
  y: number,
  style: ListStyleType,
  fontSize: number,
  color: RGBAColor | null,
  converter: UnitConverter
): void {
  const stream = page.getContentStream();
  const pdfX = converter.convertX(x);
  const pdfY = converter.convertY(y, 0);
  const radius = converter.pxToPt(fontSize * 0.15);

  stream.saveState();

  if (color) {
    stream.setFillColorRGB(color.r, color.g, color.b);
    stream.setStrokeColorRGB(color.r, color.g, color.b);
  }

  switch (style) {
    case 'disc':
      // 塗りつぶし円
      drawCircle(stream, pdfX, pdfY, radius, true);
      break;
    case 'circle':
      // 円（線のみ）
      stream.setLineWidth(converter.pxToPt(1));
      drawCircle(stream, pdfX, pdfY, radius, false);
      break;
    case 'square':
      // 正方形
      const size = radius * 1.8;
      stream.rect(pdfX - size / 2, pdfY - size / 2, size, size);
      stream.fill();
      break;
  }

  stream.restoreState();
}

/**
 * 円を描画（ベジェ曲線で近似）
 */
function drawCircle(
  stream: ReturnType<PDFPage['getContentStream']>,
  cx: number,
  cy: number,
  r: number,
  fill: boolean
): void {
  const k = 0.5522847498; // 4 * (sqrt(2) - 1) / 3

  stream.moveTo(cx + r, cy);
  stream.curveTo(cx + r, cy + r * k, cx + r * k, cy + r, cx, cy + r);
  stream.curveTo(cx - r * k, cy + r, cx - r, cy + r * k, cx - r, cy);
  stream.curveTo(cx - r, cy - r * k, cx - r * k, cy - r, cx, cy - r);
  stream.curveTo(cx + r * k, cy - r, cx + r, cy - r * k, cx + r, cy);
  stream.closePath();

  if (fill) {
    stream.fill();
  } else {
    stream.stroke();
  }
}

/**
 * 番号マーカーを描画
 */
function renderNumberMarker(
  page: PDFPage,
  x: number,
  y: number,
  index: number,
  style: ListStyleType,
  fontSize: number,
  color: RGBAColor | null,
  converter: UnitConverter
): void {
  const markerText = formatNumberMarker(index, style);
  const pdfX = converter.convertX(x) - converter.pxToPt(fontSize * 0.5);
  const pdfY = converter.convertY(y + fontSize * 0.8, 0);
  const pdfFontSize = converter.convertFontSize(fontSize);

  page.drawText(markerText, pdfX, pdfY, {
    font: 'Helvetica',
    fontSize: pdfFontSize,
    color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
  });
}

/**
 * 番号マーカーをフォーマット
 */
function formatNumberMarker(index: number, style: ListStyleType): string {
  switch (style) {
    case 'decimal':
      return `${index}.`;
    case 'decimal-leading-zero':
      return `${index.toString().padStart(2, '0')}.`;
    case 'lower-alpha':
      return `${toLowerAlpha(index)}.`;
    case 'upper-alpha':
      return `${toLowerAlpha(index).toUpperCase()}.`;
    case 'lower-roman':
      return `${toRoman(index).toLowerCase()}.`;
    case 'upper-roman':
      return `${toRoman(index)}.`;
    case 'lower-greek':
      return `${toLowerGreek(index)}.`;
    default:
      return `${index}.`;
  }
}

/**
 * 数値をアルファベット（a, b, c, ..., z, aa, ab, ...）に変換
 */
function toLowerAlpha(n: number): string {
  let result = '';
  while (n > 0) {
    n--;
    result = String.fromCharCode(97 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/**
 * 数値をローマ数字に変換
 */
function toRoman(n: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

  let result = '';
  for (let i = 0; i < values.length; i++) {
    while (n >= values[i]) {
      result += numerals[i];
      n -= values[i];
    }
  }
  return result;
}

/**
 * 数値をギリシャ小文字に変換
 */
function toLowerGreek(n: number): string {
  const greekLetters = 'αβγδεζηθικλμνξοπρστυφχψω';
  if (n < 1 || n > greekLetters.length) {
    return n.toString();
  }
  return greekLetters[n - 1];
}

/**
 * 箇条書きスタイルかどうか
 */
function isBulletStyle(style: ListStyleType): boolean {
  return style === 'disc' || style === 'circle' || style === 'square';
}

/**
 * CSSの list-style-type を解析
 */
function parseListStyleType(cssValue: string): ListStyleType {
  const normalizedValue = cssValue.toLowerCase().trim();
  const validTypes: ListStyleType[] = [
    'disc', 'circle', 'square',
    'decimal', 'decimal-leading-zero',
    'lower-alpha', 'upper-alpha',
    'lower-roman', 'upper-roman',
    'lower-greek', 'none'
  ];

  if (validTypes.includes(normalizedValue as ListStyleType)) {
    return normalizedValue as ListStyleType;
  }

  // デフォルト
  return 'disc';
}

/**
 * リスト要素かどうかを判定
 */
export function isListElement(element: Element): element is HTMLUListElement | HTMLOListElement {
  return element.tagName === 'UL' || element.tagName === 'OL';
}

/**
 * リストアイテム要素かどうかを判定
 */
export function isListItemElement(element: Element): element is HTMLLIElement {
  return element.tagName === 'LI';
}
