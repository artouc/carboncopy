/**
 * TableRenderer - テーブルの描画
 *
 * HTML テーブル要素をPDFに描画する。
 * - セル背景
 * - セル境界線（border-collapse対応）
 * - thead/tbody/tfoot のサポート
 */

import type { PDFPage } from '../pdf/PDFPage.js';
import type { UnitConverter } from '../utils/UnitConverter.js';
import type { ExtractedStyles, BorderSide } from '../dom/StyleExtractor.js';
import { extractStyles, extractTextStyles } from '../dom/StyleExtractor.js';
import { isValidColor, type RGBAColor } from '../utils/ColorParser.js';

/**
 * テーブルセルの情報
 */
export interface TableCell {
  element: HTMLTableCellElement;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  rect: DOMRect;
  styles: ExtractedStyles;
}

/**
 * テーブル描画オプション
 */
export interface TableRenderOptions {
  /** 境界線を描画するか */
  drawBorders?: boolean;
  /** 背景を描画するか */
  drawBackgrounds?: boolean;
}

/**
 * テーブルを描画
 */
export function renderTable(
  table: HTMLTableElement,
  page: PDFPage,
  converter: UnitConverter,
  options: TableRenderOptions = {}
): void {
  const { drawBorders = true, drawBackgrounds = true } = options;

  // テーブルのスタイルを取得
  const tableStyles = extractStyles(table);
  const borderCollapse = getComputedStyle(table).borderCollapse;

  // テーブル全体の背景を描画
  if (drawBackgrounds && isValidColor(tableStyles.backgroundColor)) {
    renderCellBackground(
      page,
      tableStyles.box.borderX,
      tableStyles.box.borderY,
      tableStyles.box.borderWidth,
      tableStyles.box.borderHeight,
      tableStyles.backgroundColor,
      converter
    );
  }

  // テーブルの外枠を描画
  if (drawBorders) {
    renderTableBorder(page, tableStyles, converter);
  }

  // セルを収集して描画
  const cells = collectTableCells(table);

  for (const cell of cells) {
    // セル背景を描画
    if (drawBackgrounds && isValidColor(cell.styles.backgroundColor)) {
      renderCellBackground(
        page,
        cell.rect.x,
        cell.rect.y,
        cell.rect.width,
        cell.rect.height,
        cell.styles.backgroundColor,
        converter
      );
    }

    // セル境界線を描画
    if (drawBorders) {
      if (borderCollapse === 'collapse') {
        renderCollapsedCellBorders(page, cell, converter);
      } else {
        renderSeparateCellBorders(page, cell, converter);
      }
    }
  }
}

/**
 * テーブルのすべてのセルを収集
 */
export function collectTableCells(table: HTMLTableElement): TableCell[] {
  const cells: TableCell[] = [];
  const rows = table.rows;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowCells = row.cells;

    for (let cellIndex = 0; cellIndex < rowCells.length; cellIndex++) {
      const cell = rowCells[cellIndex] as HTMLTableCellElement;
      const rect = cell.getBoundingClientRect();
      const styles = extractStyles(cell);

      cells.push({
        element: cell,
        row: rowIndex,
        col: cellIndex,
        rowSpan: cell.rowSpan,
        colSpan: cell.colSpan,
        rect,
        styles,
      });
    }
  }

  return cells;
}

/**
 * テーブルの外枠を描画
 */
function renderTableBorder(
  page: PDFPage,
  styles: ExtractedStyles,
  converter: UnitConverter
): void {
  const { box, border } = styles;
  const stream = page.getContentStream();

  // 各辺を描画
  const sides = [
    { side: border.top, x1: box.borderX, y1: box.borderY, x2: box.borderX + box.borderWidth, y2: box.borderY },
    { side: border.right, x1: box.borderX + box.borderWidth, y1: box.borderY, x2: box.borderX + box.borderWidth, y2: box.borderY + box.borderHeight },
    { side: border.bottom, x1: box.borderX, y1: box.borderY + box.borderHeight, x2: box.borderX + box.borderWidth, y2: box.borderY + box.borderHeight },
    { side: border.left, x1: box.borderX, y1: box.borderY, x2: box.borderX, y2: box.borderY + box.borderHeight },
  ];

  for (const { side, x1, y1, x2, y2 } of sides) {
    if (shouldRenderBorder(side)) {
      renderBorderLine(page, x1, y1, x2, y2, side, converter);
    }
  }
}

/**
 * セル背景を描画
 */
function renderCellBackground(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: RGBAColor,
  converter: UnitConverter
): void {
  const pdfX = converter.convertX(x);
  const pdfY = converter.convertY(y, height);
  const pdfWidth = converter.pxToPt(width);
  const pdfHeight = converter.pxToPt(height);

  page.drawRect(pdfX, pdfY, pdfWidth, pdfHeight, { fill: color });
}

/**
 * border-collapse: separate のセル境界線を描画
 */
function renderSeparateCellBorders(
  page: PDFPage,
  cell: TableCell,
  converter: UnitConverter
): void {
  const { rect, styles } = cell;
  const { border } = styles;

  // 上
  if (shouldRenderBorder(border.top)) {
    const y = rect.y + border.top.width / 2;
    renderBorderLine(page, rect.x, y, rect.x + rect.width, y, border.top, converter);
  }

  // 右
  if (shouldRenderBorder(border.right)) {
    const x = rect.x + rect.width - border.right.width / 2;
    renderBorderLine(page, x, rect.y, x, rect.y + rect.height, border.right, converter);
  }

  // 下
  if (shouldRenderBorder(border.bottom)) {
    const y = rect.y + rect.height - border.bottom.width / 2;
    renderBorderLine(page, rect.x, y, rect.x + rect.width, y, border.bottom, converter);
  }

  // 左
  if (shouldRenderBorder(border.left)) {
    const x = rect.x + border.left.width / 2;
    renderBorderLine(page, x, rect.y, x, rect.y + rect.height, border.left, converter);
  }
}

/**
 * border-collapse: collapse のセル境界線を描画
 * 隣接セルとの境界線の重複を避けるため、右と下のみ描画
 * （最初の行/列は上/左も描画）
 */
function renderCollapsedCellBorders(
  page: PDFPage,
  cell: TableCell,
  converter: UnitConverter
): void {
  const { rect, styles, row, col } = cell;
  const { border } = styles;

  // 最初の行は上境界を描画
  if (row === 0 && shouldRenderBorder(border.top)) {
    const y = rect.y;
    renderBorderLine(page, rect.x, y, rect.x + rect.width, y, border.top, converter);
  }

  // 最初の列は左境界を描画
  if (col === 0 && shouldRenderBorder(border.left)) {
    const x = rect.x;
    renderBorderLine(page, x, rect.y, x, rect.y + rect.height, border.left, converter);
  }

  // 常に右と下を描画（セル間境界線）
  if (shouldRenderBorder(border.right)) {
    const x = rect.x + rect.width;
    renderBorderLine(page, x, rect.y, x, rect.y + rect.height, border.right, converter);
  }

  if (shouldRenderBorder(border.bottom)) {
    const y = rect.y + rect.height;
    renderBorderLine(page, rect.x, y, rect.x + rect.width, y, border.bottom, converter);
  }
}

/**
 * 境界線を描画すべきかどうか
 */
function shouldRenderBorder(side: BorderSide): boolean {
  return side.width > 0 &&
         side.style !== 'none' &&
         side.style !== 'hidden' &&
         isValidColor(side.color);
}

/**
 * 境界線を描画
 */
function renderBorderLine(
  page: PDFPage,
  x1: number, y1: number,
  x2: number, y2: number,
  side: BorderSide,
  converter: UnitConverter
): void {
  if (!side.color) return;

  const pdfX1 = converter.convertX(x1);
  const pdfY1 = converter.convertY(y1, 0);
  const pdfX2 = converter.convertX(x2);
  const pdfY2 = converter.convertY(y2, 0);

  const stream = page.getContentStream();
  stream.saveState();

  // 線幅
  stream.setLineWidth(converter.pxToPt(side.width));

  // 色
  stream.setStrokeColorRGB(side.color.r, side.color.g, side.color.b);

  // 線のスタイル
  switch (side.style) {
    case 'dashed':
      stream.setDashPattern([converter.pxToPt(side.width * 3)], 0);
      break;
    case 'dotted':
      stream.setLineCap(1); // round
      stream.setDashPattern([0, converter.pxToPt(side.width * 2)], 0);
      break;
    // solid, groove, ridge, inset, outset はsolid扱い
  }

  // 線を描画
  stream.moveTo(pdfX1, pdfY1);
  stream.lineTo(pdfX2, pdfY2);
  stream.stroke();

  stream.restoreState();
}

/**
 * テーブルかどうかを判定
 */
export function isTableElement(element: Element): element is HTMLTableElement {
  return element.tagName === 'TABLE';
}

/**
 * テーブルセルかどうかを判定
 */
export function isTableCellElement(element: Element): element is HTMLTableCellElement {
  return element.tagName === 'TD' || element.tagName === 'TH';
}

/**
 * テーブル行かどうかを判定
 */
export function isTableRowElement(element: Element): element is HTMLTableRowElement {
  return element.tagName === 'TR';
}
