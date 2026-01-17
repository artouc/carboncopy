/**
 * FontManager - フォントの読み込みと管理
 *
 * TrueType/OpenType フォントを読み込み、解析し、
 * PDF埋め込み用のデータを準備する。
 */

import opentype from 'opentype.js';

/**
 * 読み込まれたフォント情報
 */
export interface LoadedFont {
  /** フォント名 */
  name: string;
  /** PostScript名 */
  postScriptName: string;
  /** フォントファミリー */
  family: string;
  /** ウェイト (100-900) */
  weight: number;
  /** スタイル */
  style: 'normal' | 'italic';
  /** opentype.js Font オブジェクト */
  otFont: opentype.Font;
  /** 元のフォントデータ */
  data: Uint8Array;
  /** 使用されている文字コードポイント */
  usedCodePoints: Set<number>;
}

/**
 * フォントマネージャー
 */
export class FontManager {
  private fonts: Map<string, LoadedFont> = new Map();
  private fontsByFamily: Map<string, LoadedFont[]> = new Map();

  /**
   * URLからフォントを読み込み
   */
  async loadFromURL(url: string, name?: string): Promise<LoadedFont> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return this.loadFromArrayBuffer(arrayBuffer, name);
  }

  /**
   * ArrayBuffer からフォントを読み込み
   */
  async loadFromArrayBuffer(buffer: ArrayBuffer, name?: string): Promise<LoadedFont> {
    const data = new Uint8Array(buffer);
    return this.loadFromUint8Array(data, name);
  }

  /**
   * Uint8Array からフォントを読み込み
   */
  async loadFromUint8Array(data: Uint8Array, name?: string): Promise<LoadedFont> {
    // opentype.jsでパース
    const otFont = opentype.parse(data.buffer);

    // フォント情報を抽出
    const postScriptName = otFont.names.postScriptName?.en || otFont.names.fullName?.en || 'Unknown';
    const family = otFont.names.fontFamily?.en || 'Unknown';
    const fontName = name || postScriptName;

    // ウェイトを推定
    const weight = this.detectWeight(otFont);

    // スタイルを推定
    const style = this.detectStyle(otFont);

    const loadedFont: LoadedFont = {
      name: fontName,
      postScriptName,
      family,
      weight,
      style,
      otFont,
      data,
      usedCodePoints: new Set(),
    };

    // キャッシュに追加
    this.fonts.set(fontName, loadedFont);

    // ファミリー別インデックスに追加
    if (!this.fontsByFamily.has(family)) {
      this.fontsByFamily.set(family, []);
    }
    this.fontsByFamily.get(family)!.push(loadedFont);

    return loadedFont;
  }

  /**
   * 名前でフォントを取得
   */
  getFont(name: string): LoadedFont | undefined {
    return this.fonts.get(name);
  }

  /**
   * ファミリーとスタイルでフォントを検索
   */
  findFont(family: string, weight: number = 400, style: 'normal' | 'italic' = 'normal'): LoadedFont | undefined {
    const familyFonts = this.fontsByFamily.get(family);
    if (!familyFonts || familyFonts.length === 0) {
      return undefined;
    }

    // 最も近いウェイトとスタイルのフォントを見つける
    let bestMatch: LoadedFont | undefined;
    let bestScore = Infinity;

    for (const font of familyFonts) {
      let score = Math.abs(font.weight - weight);
      if (font.style !== style) {
        score += 1000; // スタイル不一致のペナルティ
      }
      if (score < bestScore) {
        bestScore = score;
        bestMatch = font;
      }
    }

    return bestMatch;
  }

  /**
   * フォントが読み込まれているか確認
   */
  hasFont(name: string): boolean {
    return this.fonts.has(name);
  }

  /**
   * 使用する文字をマーク
   */
  markGlyphsAsUsed(fontName: string, text: string): void {
    const font = this.fonts.get(fontName);
    if (!font) return;

    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (codePoint !== undefined) {
        font.usedCodePoints.add(codePoint);
      }
    }
  }

  /**
   * 使用されている文字コードポイントを取得
   */
  getUsedCodePoints(fontName: string): Set<number> {
    const font = this.fonts.get(fontName);
    return font?.usedCodePoints ?? new Set();
  }

  /**
   * 全フォントを取得
   */
  getAllFonts(): LoadedFont[] {
    return Array.from(this.fonts.values());
  }

  /**
   * フォントのウェイトを検出
   */
  private detectWeight(font: opentype.Font): number {
    // OS/2テーブルからウェイトを取得
    const os2 = (font.tables as any).os2;
    if (os2?.usWeightClass) {
      return os2.usWeightClass;
    }

    // 名前から推定
    const fullName = (font.names.fullName?.en || '').toLowerCase();
    const subfamily = (font.names.fontSubfamily?.en || '').toLowerCase();
    const combined = fullName + ' ' + subfamily;

    if (combined.includes('thin') || combined.includes('hairline')) return 100;
    if (combined.includes('extralight') || combined.includes('ultralight')) return 200;
    if (combined.includes('light')) return 300;
    if (combined.includes('medium')) return 500;
    if (combined.includes('semibold') || combined.includes('demibold')) return 600;
    if (combined.includes('extrabold') || combined.includes('ultrabold')) return 800;
    if (combined.includes('black') || combined.includes('heavy')) return 900;
    if (combined.includes('bold')) return 700;

    return 400; // Regular
  }

  /**
   * フォントのスタイルを検出
   */
  private detectStyle(font: opentype.Font): 'normal' | 'italic' {
    const subfamily = (font.names.fontSubfamily?.en || '').toLowerCase();
    const fullName = (font.names.fullName?.en || '').toLowerCase();
    const combined = fullName + ' ' + subfamily;

    if (combined.includes('italic') || combined.includes('oblique')) {
      return 'italic';
    }

    return 'normal';
  }

  /**
   * フォントメトリクスを取得
   */
  getMetrics(fontName: string): FontMetrics | undefined {
    const font = this.fonts.get(fontName);
    if (!font) return undefined;

    const otFont = font.otFont;
    const unitsPerEm = otFont.unitsPerEm;

    return {
      unitsPerEm,
      ascender: otFont.ascender,
      descender: otFont.descender,
      lineGap: (otFont.tables as any).hhea?.lineGap ?? 0,
    };
  }

  /**
   * テキストの幅を計測
   */
  measureText(fontName: string, text: string, fontSize: number): number {
    const font = this.fonts.get(fontName);
    if (!font) return 0;

    const otFont = font.otFont;
    const scale = fontSize / otFont.unitsPerEm;
    let width = 0;

    for (let i = 0; i < text.length; i++) {
      const glyph = otFont.charToGlyph(text[i]);
      width += glyph.advanceWidth ?? 0;
    }

    return width * scale;
  }

  /**
   * グリフIDを取得
   */
  getGlyphId(fontName: string, codePoint: number): number {
    const font = this.fonts.get(fontName);
    if (!font) return 0;

    const char = String.fromCodePoint(codePoint);
    const glyph = font.otFont.charToGlyph(char);
    return glyph.index;
  }

  /**
   * グリフの幅を取得
   */
  getGlyphWidth(fontName: string, codePoint: number): number {
    const font = this.fonts.get(fontName);
    if (!font) return 0;

    const char = String.fromCodePoint(codePoint);
    const glyph = font.otFont.charToGlyph(char);
    return glyph.advanceWidth ?? 0;
  }
}

/**
 * フォントメトリクス
 */
export interface FontMetrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  lineGap: number;
}

/**
 * グローバルフォントマネージャーインスタンス
 */
export const fontManager = new FontManager();
