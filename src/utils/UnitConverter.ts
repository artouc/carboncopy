/**
 * UnitConverter - CSS px ↔ PDF pt の高精度変換
 *
 * サイズずれの根本原因を解決する核心モジュール:
 * - CSS: 96 DPI (1px = 1/96 inch)
 * - PDF: 72 DPI (1pt = 1/72 inch)
 * - 変換比率: 72/96 = 0.75
 *
 * PDFの座標系は左下が原点でY軸が上向き。
 * CSSは左上が原点でY軸が下向き。
 */

const CSS_DPI = 96;
const PDF_DPI = 72;
const PX_TO_PT_RATIO = PDF_DPI / CSS_DPI; // 0.75
const PT_TO_PX_RATIO = CSS_DPI / PDF_DPI; // 1.333...

// mm to pt: 1 inch = 25.4mm, 1 inch = 72pt
const MM_TO_PT = 72 / 25.4;
const PT_TO_MM = 25.4 / 72;

// 標準ページサイズ (単位: pt)
export const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 } as const,
  A3: { width: 841.89, height: 1190.55 } as const,
  A5: { width: 419.53, height: 595.28 } as const,
  Letter: { width: 612, height: 792 } as const,
  Legal: { width: 612, height: 1008 } as const,
} as const;

export type PageSize = keyof typeof PAGE_SIZES;

export interface PageDimensions {
  width: number;  // pt
  height: number; // pt
}

export interface Margins {
  top: number;    // mm
  right: number;  // mm
  bottom: number; // mm
  left: number;   // mm
}

export class UnitConverter {
  private pageHeight: number; // ページ高さ (pt)
  private pageOffsetX: number = 0; // ページ原点オフセットX (px)
  private pageOffsetY: number = 0; // ページ原点オフセットY (px)

  /**
   * @param pageHeight ページの高さ (pt単位)
   */
  constructor(pageHeight: number) {
    this.pageHeight = pageHeight;
  }

  /**
   * CSS px → PDF pt 変換
   * 丸めを行わず、最大限の精度を維持
   */
  pxToPt(px: number): number {
    return px * PX_TO_PT_RATIO;
  }

  /**
   * PDF pt → CSS px 変換
   */
  ptToPx(pt: number): number {
    return pt * PT_TO_PX_RATIO;
  }

  /**
   * mm → PDF pt 変換
   */
  mmToPt(mm: number): number {
    return mm * MM_TO_PT;
  }

  /**
   * PDF pt → mm 変換
   */
  ptToMm(pt: number): number {
    return pt * PT_TO_MM;
  }

  /**
   * X座標変換
   * CSSのビューポート座標 → PDF座標
   */
  convertX(cssX: number): number {
    return this.pxToPt(cssX - this.pageOffsetX);
  }

  /**
   * Y座標変換
   * CSSは左上原点・下向きY、PDFは左下原点・上向きY
   *
   * @param cssY CSS座標系でのY位置
   * @param height 要素の高さ (px)。PDFでは左下が基準なので必要
   */
  convertY(cssY: number, height: number = 0): number {
    const adjustedY = cssY - this.pageOffsetY;
    // ページ高さから引くことでY軸を反転
    // heightを引くのは、PDFでは要素の左下が基準位置になるため
    return this.pageHeight - this.pxToPt(adjustedY + height);
  }

  /**
   * 矩形座標変換
   * DOMRect/getBoundingClientRect → PDF座標
   */
  convertRect(rect: { x: number; y: number; width: number; height: number }): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: this.convertX(rect.x),
      y: this.convertY(rect.y, rect.height),
      width: this.pxToPt(rect.width),
      height: this.pxToPt(rect.height),
    };
  }

  /**
   * フォントサイズ変換
   * CSS px → PDF pt
   */
  convertFontSize(cssPx: number): number {
    return this.pxToPt(cssPx);
  }

  /**
   * 線幅変換
   * CSS px → PDF pt
   */
  convertLineWidth(cssPx: number): number {
    return this.pxToPt(cssPx);
  }

  /**
   * ページ原点オフセット設定
   * 変換対象要素の左上を基準にする場合に使用
   */
  setPageOffset(x: number, y: number): void {
    this.pageOffsetX = x;
    this.pageOffsetY = y;
  }

  /**
   * ページ高さ取得
   */
  getPageHeight(): number {
    return this.pageHeight;
  }

  /**
   * ページ高さ設定
   */
  setPageHeight(height: number): void {
    this.pageHeight = height;
  }

  /**
   * ページサイズからUnitConverterを作成
   */
  static fromPageSize(
    size: PageSize | [number, number],
    orientation: 'portrait' | 'landscape' = 'portrait'
  ): UnitConverter {
    let dimensions: PageDimensions;

    if (Array.isArray(size)) {
      // [width, height] in mm
      dimensions = {
        width: size[0] * MM_TO_PT,
        height: size[1] * MM_TO_PT,
      };
    } else {
      dimensions = { ...PAGE_SIZES[size] };
    }

    if (orientation === 'landscape') {
      [dimensions.width, dimensions.height] = [dimensions.height, dimensions.width];
    }

    return new UnitConverter(dimensions.height);
  }

  /**
   * マージンをpt単位に変換
   */
  static convertMargins(margins: Margins): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    return {
      top: margins.top * MM_TO_PT,
      right: margins.right * MM_TO_PT,
      bottom: margins.bottom * MM_TO_PT,
      left: margins.left * MM_TO_PT,
    };
  }
}
