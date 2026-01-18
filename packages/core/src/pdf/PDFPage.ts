/**
 * PDFPage - PDFページの管理
 *
 * ページの描画操作とリソース管理を行う。
 */

import { PDFContentStream, RGBColor } from './PDFContentStream.js';
import { PDFDict, PDFName, PDFNumber, PDFArray, PDFRef, PDFStream } from './objects/PDFObject.js';

export interface PageSize {
  width: number;  // pt
  height: number; // pt
}

export interface DrawTextOptions {
  font: string;
  fontSize: number;
  color?: RGBColor;
  /** ターゲット幅（pt）。指定すると水平スケーリングで調整 */
  targetWidth?: number;
  /** PDF計算上の幅（pt）。targetWidthと共に使用してスケール計算 */
  pdfWidth?: number;
  /** letter-spacing（pt単位） */
  letterSpacing?: number;
}

export interface DrawLineOptions {
  color?: RGBColor;
  width?: number;
}

export interface DrawRectOptions {
  fill?: RGBColor;
  stroke?: RGBColor;
  lineWidth?: number;
}

export class PDFPage {
  private mediaBox: [number, number, number, number];
  private contents: PDFContentStream;
  private fonts: Map<string, PDFRef> = new Map();
  private images: Map<string, PDFRef> = new Map();
  private currentFont: string | null = null;
  private currentFontSize: number = 12;

  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.mediaBox = [0, 0, width, height];
    this.contents = new PDFContentStream();
  }

  /**
   * フォントをページに追加
   */
  addFont(name: string, ref: PDFRef): void {
    this.fonts.set(name, ref);
  }

  /**
   * 画像をページに追加
   */
  addImage(name: string, ref: PDFRef): void {
    this.images.set(name, ref);
  }

  /**
   * テキストを描画
   */
  drawText(text: string, x: number, y: number, options: DrawTextOptions): void {
    const { font, fontSize, color, targetWidth, pdfWidth, letterSpacing } = options;

    this.contents.beginText();

    // 色設定
    if (color) {
      this.contents.setFillColorRGB(color.r, color.g, color.b);
    }

    // フォント設定
    if (this.currentFont !== font || this.currentFontSize !== fontSize) {
      this.contents.setFont(font, fontSize);
      this.currentFont = font;
      this.currentFontSize = fontSize;
    }

    // CSS letter-spacingを適用
    let charSpacing = letterSpacing ?? 0;

    // 幅調整が必要な場合は追加の文字間隔を計算
    if (targetWidth && pdfWidth && pdfWidth > 0 && text.length > 1) {
      const widthDiff = targetWidth - pdfWidth;
      // 文字間隔 = 幅の差分 / (文字数 - 1)
      let widthAdjustment = widthDiff / (text.length - 1);
      // 極端な調整は避ける（-2pt〜+2pt程度に制限）
      widthAdjustment = Math.max(-2, Math.min(2, widthAdjustment));
      charSpacing += widthAdjustment;
    }

    // 文字間隔が必要な場合は設定
    if (charSpacing !== 0) {
      this.contents.setCharacterSpacing(charSpacing);
    }

    // 位置とテキスト
    this.contents.moveText(x, y);
    this.contents.showText(text);

    // 文字間隔をリセット
    if (charSpacing !== 0) {
      this.contents.setCharacterSpacing(0);
    }

    this.contents.endText();
  }

  /**
   * Unicode テキストを描画 (日本語等)
   * UTF-16BE エンコードを使用
   */
  drawTextUnicode(text: string, x: number, y: number, options: DrawTextOptions): void {
    const { font, fontSize, color } = options;

    this.contents.beginText();

    if (color) {
      this.contents.setFillColorRGB(color.r, color.g, color.b);
    }

    if (this.currentFont !== font || this.currentFontSize !== fontSize) {
      this.contents.setFont(font, fontSize);
      this.currentFont = font;
      this.currentFontSize = fontSize;
    }

    this.contents.moveText(x, y);
    this.contents.showTextHex(text);

    this.contents.endText();
  }

  /**
   * CIDフォントでテキストを描画（グリフID 16進数文字列を使用）
   * @param hexText グリフIDの16進数文字列（textToCIDHexで変換済み）
   */
  drawTextCID(hexText: string, x: number, y: number, options: DrawTextOptions): void {
    const { font, fontSize, color, letterSpacing } = options;

    this.contents.beginText();

    if (color) {
      this.contents.setFillColorRGB(color.r, color.g, color.b);
    }

    if (this.currentFont !== font || this.currentFontSize !== fontSize) {
      this.contents.setFont(font, fontSize);
      this.currentFont = font;
      this.currentFontSize = fontSize;
    }

    // letter-spacingを適用
    const charSpacing = letterSpacing ?? 0;
    if (charSpacing !== 0) {
      this.contents.setCharacterSpacing(charSpacing);
    }

    this.contents.moveText(x, y);
    this.contents.showTextHexRaw(hexText);

    // 文字間隔をリセット
    if (charSpacing !== 0) {
      this.contents.setCharacterSpacing(0);
    }

    this.contents.endText();
  }

  /**
   * 直線を描画
   */
  drawLine(
    x1: number, y1: number,
    x2: number, y2: number,
    options: DrawLineOptions = {}
  ): void {
    const { color, width } = options;

    this.contents.saveState();

    if (width !== undefined) {
      this.contents.setLineWidth(width);
    }

    if (color) {
      this.contents.setStrokeColorRGB(color.r, color.g, color.b);
    }

    this.contents.moveTo(x1, y1);
    this.contents.lineTo(x2, y2);
    this.contents.stroke();

    this.contents.restoreState();
  }

  /**
   * 矩形を描画
   */
  drawRect(
    x: number, y: number,
    width: number, height: number,
    options: DrawRectOptions = {}
  ): void {
    const { fill, stroke, lineWidth } = options;

    this.contents.saveState();

    if (lineWidth !== undefined) {
      this.contents.setLineWidth(lineWidth);
    }

    this.contents.rect(x, y, width, height);

    if (fill && stroke) {
      this.contents.setFillColorRGB(fill.r, fill.g, fill.b);
      this.contents.setStrokeColorRGB(stroke.r, stroke.g, stroke.b);
      this.contents.fillAndStroke();
    } else if (fill) {
      this.contents.setFillColorRGB(fill.r, fill.g, fill.b);
      this.contents.fill();
    } else if (stroke) {
      this.contents.setStrokeColorRGB(stroke.r, stroke.g, stroke.b);
      this.contents.stroke();
    }

    this.contents.restoreState();
  }

  /**
   * 画像を描画
   */
  drawImage(
    imageName: string,
    x: number, y: number,
    width: number, height: number
  ): void {
    this.contents.saveState();
    // 画像は1x1ユニット空間に描画されるため、変換が必要
    this.contents.transform(width, 0, 0, height, x, y);
    this.contents.drawImage(imageName);
    this.contents.restoreState();
  }

  /**
   * クリッピング矩形を設定
   */
  setClipRect(x: number, y: number, width: number, height: number): void {
    this.contents.rect(x, y, width, height);
    this.contents.clip();
    this.contents.endPath();
  }

  /**
   * グラフィックス状態を保存
   */
  saveState(): void {
    this.contents.saveState();
  }

  /**
   * グラフィックス状態を復元
   */
  restoreState(): void {
    this.contents.restoreState();
  }

  /**
   * ContentStreamを取得
   */
  getContentStream(): PDFContentStream {
    return this.contents;
  }

  /**
   * ページの PDF オブジェクトを構築
   */
  buildPageDict(parentRef: PDFRef, contentsRef: PDFRef): PDFDict {
    const pageDict = new PDFDict();
    pageDict.set('Type', new PDFName('Page'));
    pageDict.set('Parent', parentRef);
    pageDict.set('MediaBox', new PDFArray([
      new PDFNumber(this.mediaBox[0]),
      new PDFNumber(this.mediaBox[1]),
      new PDFNumber(this.mediaBox[2]),
      new PDFNumber(this.mediaBox[3]),
    ]));
    pageDict.set('Contents', contentsRef);

    // リソース辞書
    const resources = new PDFDict();

    // フォント
    if (this.fonts.size > 0) {
      const fontDict = new PDFDict();
      for (const [name, ref] of this.fonts) {
        fontDict.set(name, ref);
      }
      resources.set('Font', fontDict);
    }

    // 画像 (XObject)
    if (this.images.size > 0) {
      const xObjectDict = new PDFDict();
      for (const [name, ref] of this.images) {
        xObjectDict.set(name, ref);
      }
      resources.set('XObject', xObjectDict);
    }

    pageDict.set('Resources', resources);

    return pageDict;
  }

  /**
   * コンテンツストリームをバイト配列として取得
   */
  getContentsBytes(): Uint8Array {
    return this.contents.toBytes();
  }
}
