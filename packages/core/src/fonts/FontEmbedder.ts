/**
 * FontEmbedder - TrueType/OpenType フォントのPDF埋め込み
 *
 * フォントデータをPDF形式に変換して埋め込む。
 * - TrueType フォント (CIDFontType2)
 * - ToUnicode CMap 生成
 * - 文字幅配列 (W) 生成
 */

import type { LoadedFont, FontManager } from './FontManager.js';
import {
  PDFDict,
  PDFArray,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFStream,
  PDFString,
  PDFIndirectObject,
  concatUint8Arrays,
} from '../pdf/objects/PDFObject.js';

const TEXT_ENCODER = new TextEncoder();

/**
 * フォント埋め込み結果
 */
export interface EmbeddedFont {
  /** フォント辞書への参照 */
  ref: PDFRef;
  /** 生成されたPDFオブジェクト */
  objects: PDFIndirectObject[];
  /** フォント名（PDF内での参照名） */
  pdfName: string;
}

/**
 * フォント埋め込みコンテキスト
 */
export interface EmbedContext {
  nextObjectNumber: number;
  registerObject: (obj: PDFIndirectObject) => void;
}

/**
 * TrueType/CIDFont としてフォントを埋め込み
 *
 * CIDFont は Unicode 対応で、日本語を含む多言語テキストを
 * 正しく表示できる。
 */
export function embedCIDFont(
  font: LoadedFont,
  usedCodePoints: Set<number>,
  context: EmbedContext
): EmbeddedFont {
  const objects: PDFIndirectObject[] = [];

  // 1. フォントファイルストリーム
  const fontFileObj = createFontFileStream(font, context.nextObjectNumber++);
  objects.push(fontFileObj);
  context.registerObject(fontFileObj);

  // 2. FontDescriptor
  const fontDescriptorObj = createFontDescriptor(
    font,
    fontFileObj.ref(),
    context.nextObjectNumber++
  );
  objects.push(fontDescriptorObj);
  context.registerObject(fontDescriptorObj);

  // 3. ToUnicode CMap
  const toUnicodeObj = createToUnicodeCMap(
    font,
    usedCodePoints,
    context.nextObjectNumber++
  );
  objects.push(toUnicodeObj);
  context.registerObject(toUnicodeObj);

  // 4. CIDFont 辞書
  const cidFontObj = createCIDFontDict(
    font,
    usedCodePoints,
    fontDescriptorObj.ref(),
    context.nextObjectNumber++
  );
  objects.push(cidFontObj);
  context.registerObject(cidFontObj);

  // 5. Type0 フォント辞書（メイン）
  const type0FontObj = createType0FontDict(
    font,
    cidFontObj.ref(),
    toUnicodeObj.ref(),
    context.nextObjectNumber++
  );
  objects.push(type0FontObj);
  context.registerObject(type0FontObj);

  return {
    ref: type0FontObj.ref(),
    objects,
    pdfName: font.name,
  };
}

/**
 * フォントファイルストリームを作成
 */
function createFontFileStream(font: LoadedFont, objectNumber: number): PDFIndirectObject {
  const streamDict = new PDFDict();
  streamDict.set('Length1', new PDFNumber(font.data.length));

  const stream = new PDFStream(font.data, streamDict);

  return new PDFIndirectObject(objectNumber, 0, stream);
}

/**
 * FontDescriptor を作成
 */
function createFontDescriptor(
  font: LoadedFont,
  fontFileRef: PDFRef,
  objectNumber: number
): PDFIndirectObject {
  const otFont = font.otFont;
  const unitsPerEm = otFont.unitsPerEm;
  const scale = 1000 / unitsPerEm;

  // フラグを計算
  let flags = 0;
  flags |= (1 << 2); // Symbolic (bit 3)
  if (font.style === 'italic') {
    flags |= (1 << 6); // Italic (bit 7)
  }

  // Bounding Box
  const head = (otFont.tables as any).head;
  const bbox = [
    Math.round(head.xMin * scale),
    Math.round(head.yMin * scale),
    Math.round(head.xMax * scale),
    Math.round(head.yMax * scale),
  ];

  const dict = new PDFDict();
  dict.set('Type', new PDFName('FontDescriptor'));
  dict.set('FontName', new PDFName(font.postScriptName.replace(/\s/g, '')));
  dict.set('Flags', new PDFNumber(flags));
  dict.set('FontBBox', new PDFArray(bbox.map(v => new PDFNumber(v))));
  dict.set('ItalicAngle', new PDFNumber(font.style === 'italic' ? -12 : 0));
  dict.set('Ascent', new PDFNumber(Math.round(otFont.ascender * scale)));
  dict.set('Descent', new PDFNumber(Math.round(otFont.descender * scale)));
  dict.set('CapHeight', new PDFNumber(Math.round((otFont.ascender * 0.8) * scale)));
  dict.set('StemV', new PDFNumber(80)); // 推定値

  // フォントファイル参照
  dict.set('FontFile2', fontFileRef);

  return new PDFIndirectObject(objectNumber, 0, dict);
}

/**
 * ToUnicode CMap を作成
 *
 * グリフID → Unicode のマッピングを定義する。
 * これにより PDF からテキストをコピー可能になる。
 */
function createToUnicodeCMap(
  font: LoadedFont,
  usedCodePoints: Set<number>,
  objectNumber: number
): PDFIndirectObject {
  const otFont = font.otFont;
  const mappings: Array<{ gid: number; unicode: number }> = [];

  // 使用されている文字のマッピングを収集
  for (const codePoint of usedCodePoints) {
    const char = String.fromCodePoint(codePoint);
    const glyph = otFont.charToGlyph(char);
    if (glyph.index > 0) {
      mappings.push({ gid: glyph.index, unicode: codePoint });
    }
  }

  // CMap コンテンツを生成
  const cmap = buildToUnicodeCMap(mappings);
  const cmapBytes = TEXT_ENCODER.encode(cmap);

  const stream = new PDFStream(cmapBytes);

  return new PDFIndirectObject(objectNumber, 0, stream);
}

/**
 * ToUnicode CMap コンテンツを構築
 */
function buildToUnicodeCMap(mappings: Array<{ gid: number; unicode: number }>): string {
  // GIDでソート
  mappings.sort((a, b) => a.gid - b.gid);

  const lines: string[] = [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo <<',
    '  /Registry (Adobe)',
    '  /Ordering (UCS)',
    '  /Supplement 0',
    '>> def',
    '/CMapName /Adobe-Identity-UCS def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange',
  ];

  // bfchar エントリを生成（100個ずつ）
  const chunkSize = 100;
  for (let i = 0; i < mappings.length; i += chunkSize) {
    const chunk = mappings.slice(i, i + chunkSize);
    lines.push(`${chunk.length} beginbfchar`);

    for (const { gid, unicode } of chunk) {
      const gidHex = gid.toString(16).padStart(4, '0').toUpperCase();
      const unicodeHex = unicode.toString(16).padStart(4, '0').toUpperCase();
      lines.push(`<${gidHex}> <${unicodeHex}>`);
    }

    lines.push('endbfchar');
  }

  lines.push('endcmap');
  lines.push('CMapName currentdict /CMap defineresource pop');
  lines.push('end');
  lines.push('end');

  return lines.join('\n');
}

/**
 * CIDFont 辞書を作成
 */
function createCIDFontDict(
  font: LoadedFont,
  usedCodePoints: Set<number>,
  fontDescriptorRef: PDFRef,
  objectNumber: number
): PDFIndirectObject {
  const otFont = font.otFont;
  const unitsPerEm = otFont.unitsPerEm;
  const scale = 1000 / unitsPerEm;

  const dict = new PDFDict();
  dict.set('Type', new PDFName('Font'));
  dict.set('Subtype', new PDFName('CIDFontType2'));
  dict.set('BaseFont', new PDFName(font.postScriptName.replace(/\s/g, '')));

  // CIDSystemInfo
  const cidSystemInfo = new PDFDict();
  cidSystemInfo.set('Registry', new PDFString('Adobe'));
  cidSystemInfo.set('Ordering', new PDFString('Identity'));
  cidSystemInfo.set('Supplement', new PDFNumber(0));
  dict.set('CIDSystemInfo', cidSystemInfo);

  dict.set('FontDescriptor', fontDescriptorRef);

  // デフォルト幅
  const defaultWidth = Math.round(otFont.charToGlyph(' ').advanceWidth * scale) || 1000;
  dict.set('DW', new PDFNumber(defaultWidth));

  // 文字幅配列 (W)
  const widthArray = buildWidthArray(font, usedCodePoints, scale);
  if (widthArray.length > 0) {
    dict.set('W', new PDFArray(widthArray));
  }

  // CIDToGIDMap
  dict.set('CIDToGIDMap', new PDFName('Identity'));

  return new PDFIndirectObject(objectNumber, 0, dict);
}

/**
 * 文字幅配列 (W) を構築
 *
 * 形式: [cid [w1 w2 ...] cid [w1 w2 ...] ...]
 * または: [startCid endCid w]
 */
function buildWidthArray(
  font: LoadedFont,
  usedCodePoints: Set<number>,
  scale: number
): Array<PDFNumber | PDFArray> {
  const otFont = font.otFont;
  const widths: Array<{ gid: number; width: number }> = [];

  // 使用されている文字の幅を収集
  for (const codePoint of usedCodePoints) {
    const char = String.fromCodePoint(codePoint);
    const glyph = otFont.charToGlyph(char);
    if (glyph.index > 0) {
      const width = Math.round((glyph.advanceWidth ?? 0) * scale);
      widths.push({ gid: glyph.index, width });
    }
  }

  // GIDでソート
  widths.sort((a, b) => a.gid - b.gid);

  const result: Array<PDFNumber | PDFArray> = [];

  // 連続するGIDをグループ化
  let i = 0;
  while (i < widths.length) {
    const startGid = widths[i].gid;
    const groupWidths: number[] = [widths[i].width];
    i++;

    // 連続するGIDを収集
    while (i < widths.length && widths[i].gid === widths[i - 1].gid + 1) {
      groupWidths.push(widths[i].width);
      i++;
    }

    // グループを配列形式で追加
    result.push(new PDFNumber(startGid));
    result.push(new PDFArray(groupWidths.map(w => new PDFNumber(w))));
  }

  return result;
}

/**
 * Type0 フォント辞書を作成
 */
function createType0FontDict(
  font: LoadedFont,
  cidFontRef: PDFRef,
  toUnicodeRef: PDFRef,
  objectNumber: number
): PDFIndirectObject {
  const dict = new PDFDict();
  dict.set('Type', new PDFName('Font'));
  dict.set('Subtype', new PDFName('Type0'));
  dict.set('BaseFont', new PDFName(font.postScriptName.replace(/\s/g, '')));
  dict.set('Encoding', new PDFName('Identity-H'));
  dict.set('DescendantFonts', new PDFArray([cidFontRef]));
  dict.set('ToUnicode', toUnicodeRef);

  return new PDFIndirectObject(objectNumber, 0, dict);
}

/**
 * テキストを CID フォント用の 16進数文字列に変換
 *
 * 各文字をグリフIDに変換し、16ビット16進数として出力
 */
export function textToCIDHex(font: LoadedFont, text: string): string {
  const otFont = font.otFont;
  let hex = '';

  for (const char of text) {
    const glyph = otFont.charToGlyph(char);
    const gid = glyph.index;
    hex += gid.toString(16).padStart(4, '0').toUpperCase();
  }

  return hex;
}
