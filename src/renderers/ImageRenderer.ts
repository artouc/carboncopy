/**
 * ImageRenderer - 画像の描画
 *
 * JPEG/PNG画像をPDFに埋め込む。
 * - JPEG: DCTDecode (そのまま埋め込み)
 * - PNG: FlateDecode (圧縮データ抽出)
 */

import type { PDFPage } from '../pdf/PDFPage.js';
import type { PDFDocument } from '../pdf/PDFDocument.js';
import type { UnitConverter } from '../utils/UnitConverter.js';
import type { ImageRenderNode } from '../dom/DOMWalker.js';
import {
  PDFDict,
  PDFName,
  PDFNumber,
  PDFArray,
  PDFRef,
  PDFStream,
  PDFIndirectObject,
} from '../pdf/objects/PDFObject.js';
import pako from 'pako';

/**
 * 埋め込み画像情報
 */
export interface EmbeddedImage {
  ref: PDFRef;
  name: string;
  width: number;
  height: number;
}

/**
 * 画像埋め込みコンテキスト
 */
export interface ImageEmbedContext {
  nextObjectNumber: number;
  registerObject: (obj: PDFIndirectObject) => void;
}

/**
 * 画像の種類
 */
export type ImageType = 'jpeg' | 'png' | 'unknown';

/**
 * 画像ノードを描画
 */
export function renderImage(
  node: ImageRenderNode,
  page: PDFPage,
  converter: UnitConverter,
  imageName: string
): void {
  const { styles } = node;
  const { box } = styles;

  const pdfX = converter.convertX(box.contentX);
  const pdfY = converter.convertY(box.contentY, box.contentHeight);
  const pdfWidth = converter.pxToPt(box.contentWidth);
  const pdfHeight = converter.pxToPt(box.contentHeight);

  page.drawImage(imageName, pdfX, pdfY, pdfWidth, pdfHeight);
}

/**
 * 画像をPDFに埋め込む
 */
export async function embedImage(
  imageData: Uint8Array,
  context: ImageEmbedContext
): Promise<EmbeddedImage> {
  const imageType = detectImageType(imageData);

  switch (imageType) {
    case 'jpeg':
      return embedJPEG(imageData, context);
    case 'png':
      return embedPNG(imageData, context);
    default:
      throw new Error('Unsupported image format');
  }
}

/**
 * URLから画像を読み込んで埋め込む
 */
export async function embedImageFromURL(
  url: string,
  context: ImageEmbedContext
): Promise<EmbeddedImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const imageData = new Uint8Array(arrayBuffer);

  return embedImage(imageData, context);
}

/**
 * HTMLImageElementから画像を埋め込む
 */
export async function embedImageFromElement(
  img: HTMLImageElement,
  context: ImageEmbedContext
): Promise<EmbeddedImage> {
  // Canvas経由でピクセルデータを取得
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  ctx.drawImage(img, 0, 0);

  // PNGとしてエクスポート
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  const imageData = base64ToUint8Array(base64);

  return embedImage(imageData, context);
}

/**
 * 画像の種類を検出
 */
export function detectImageType(data: Uint8Array): ImageType {
  // JPEG: FF D8 FF
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4E &&
    data[3] === 0x47 &&
    data[4] === 0x0D &&
    data[5] === 0x0A &&
    data[6] === 0x1A &&
    data[7] === 0x0A
  ) {
    return 'png';
  }

  return 'unknown';
}

/**
 * JPEGをPDFに埋め込む
 */
function embedJPEG(data: Uint8Array, context: ImageEmbedContext): EmbeddedImage {
  // JPEG情報を解析
  const info = parseJPEGInfo(data);

  // XObject辞書を作成
  const dict = new PDFDict();
  dict.set('Type', new PDFName('XObject'));
  dict.set('Subtype', new PDFName('Image'));
  dict.set('Width', new PDFNumber(info.width));
  dict.set('Height', new PDFNumber(info.height));
  dict.set('ColorSpace', new PDFName(info.colorSpace));
  dict.set('BitsPerComponent', new PDFNumber(8));
  dict.set('Filter', new PDFName('DCTDecode'));

  const stream = new PDFStream(data, dict);
  const obj = new PDFIndirectObject(context.nextObjectNumber++, 0, stream);
  context.registerObject(obj);

  const name = `Im${context.nextObjectNumber - 1}`;

  return {
    ref: obj.ref(),
    name,
    width: info.width,
    height: info.height,
  };
}

/**
 * PNGをPDFに埋め込む
 */
function embedPNG(data: Uint8Array, context: ImageEmbedContext): EmbeddedImage {
  // PNG情報を解析
  const info = parsePNGInfo(data);

  // 画像データを抽出・変換
  const { imageData, alphaData } = extractPNGData(data, info);

  // メイン画像XObject
  const dict = new PDFDict();
  dict.set('Type', new PDFName('XObject'));
  dict.set('Subtype', new PDFName('Image'));
  dict.set('Width', new PDFNumber(info.width));
  dict.set('Height', new PDFNumber(info.height));
  dict.set('BitsPerComponent', new PDFNumber(info.bitDepth));
  dict.set('Filter', new PDFName('FlateDecode'));

  // カラースペース
  if (info.colorType === 0 || info.colorType === 4) {
    dict.set('ColorSpace', new PDFName('DeviceGray'));
  } else {
    dict.set('ColorSpace', new PDFName('DeviceRGB'));
  }

  // アルファチャンネルがある場合はSMask
  if (alphaData && alphaData.length > 0) {
    const smaskObj = createSoftMask(alphaData, info.width, info.height, context);
    dict.set('SMask', smaskObj.ref());
  }

  // 圧縮
  const compressed = pako.deflate(imageData);

  const stream = new PDFStream(compressed, dict);
  const obj = new PDFIndirectObject(context.nextObjectNumber++, 0, stream);
  context.registerObject(obj);

  const name = `Im${context.nextObjectNumber - 1}`;

  return {
    ref: obj.ref(),
    name,
    width: info.width,
    height: info.height,
  };
}

/**
 * ソフトマスク（アルファチャンネル）を作成
 */
function createSoftMask(
  alphaData: Uint8Array,
  width: number,
  height: number,
  context: ImageEmbedContext
): PDFIndirectObject {
  const dict = new PDFDict();
  dict.set('Type', new PDFName('XObject'));
  dict.set('Subtype', new PDFName('Image'));
  dict.set('Width', new PDFNumber(width));
  dict.set('Height', new PDFNumber(height));
  dict.set('ColorSpace', new PDFName('DeviceGray'));
  dict.set('BitsPerComponent', new PDFNumber(8));
  dict.set('Filter', new PDFName('FlateDecode'));

  const compressed = pako.deflate(alphaData);
  const stream = new PDFStream(compressed, dict);
  const obj = new PDFIndirectObject(context.nextObjectNumber++, 0, stream);
  context.registerObject(obj);

  return obj;
}

/**
 * JPEG情報を解析
 */
interface JPEGInfo {
  width: number;
  height: number;
  colorSpace: string;
  components: number;
}

function parseJPEGInfo(data: Uint8Array): JPEGInfo {
  let offset = 2; // Skip SOI marker

  while (offset < data.length) {
    if (data[offset] !== 0xFF) {
      throw new Error('Invalid JPEG data');
    }

    const marker = data[offset + 1];

    // SOF markers (Start of Frame)
    if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      const height = (data[offset + 5] << 8) | data[offset + 6];
      const width = (data[offset + 7] << 8) | data[offset + 8];
      const components = data[offset + 9];

      let colorSpace = 'DeviceRGB';
      if (components === 1) {
        colorSpace = 'DeviceGray';
      } else if (components === 4) {
        colorSpace = 'DeviceCMYK';
      }

      return { width, height, colorSpace, components };
    }

    // Skip to next marker
    const length = (data[offset + 2] << 8) | data[offset + 3];
    offset += length + 2;
  }

  throw new Error('Could not find JPEG dimensions');
}

/**
 * PNG情報を解析
 */
interface PNGInfo {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  compression: number;
  filter: number;
  interlace: number;
}

function parsePNGInfo(data: Uint8Array): PNGInfo {
  // IHDRチャンク (オフセット8から)
  const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
  const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
  const bitDepth = data[24];
  const colorType = data[25];
  const compression = data[26];
  const filter = data[27];
  const interlace = data[28];

  return { width, height, bitDepth, colorType, compression, filter, interlace };
}

/**
 * PNGからピクセルデータを抽出
 */
function extractPNGData(
  data: Uint8Array,
  info: PNGInfo
): { imageData: Uint8Array; alphaData: Uint8Array | null } {
  // IDATチャンクを収集
  const idatChunks: Uint8Array[] = [];
  let offset = 8; // Skip PNG signature

  while (offset < data.length) {
    const length = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
    const type = String.fromCharCode(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]);

    if (type === 'IDAT') {
      idatChunks.push(data.slice(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }

    offset += 12 + length; // length(4) + type(4) + data + crc(4)
  }

  // IDATデータを結合して解凍
  const compressedData = concatUint8Arrays(idatChunks);
  const decompressed = pako.inflate(compressedData);

  // フィルター解除してピクセルデータを取得
  return decodePixelData(decompressed, info);
}

/**
 * PNGフィルターを解除してピクセルデータを抽出
 */
function decodePixelData(
  data: Uint8Array,
  info: PNGInfo
): { imageData: Uint8Array; alphaData: Uint8Array | null } {
  const { width, height, colorType, bitDepth } = info;

  // サンプルあたりのバイト数
  let samplesPerPixel = 1;
  switch (colorType) {
    case 0: samplesPerPixel = 1; break; // Grayscale
    case 2: samplesPerPixel = 3; break; // RGB
    case 3: samplesPerPixel = 1; break; // Palette
    case 4: samplesPerPixel = 2; break; // Grayscale + Alpha
    case 6: samplesPerPixel = 4; break; // RGBA
  }

  const bytesPerPixel = Math.ceil((samplesPerPixel * bitDepth) / 8);
  const bytesPerRow = bytesPerPixel * width;
  const filterBytesPerRow = bytesPerRow + 1; // +1 for filter byte

  // フィルター解除
  const unfiltered = new Uint8Array(height * bytesPerRow);
  let prevRow = new Uint8Array(bytesPerRow);

  for (let y = 0; y < height; y++) {
    const filterType = data[y * filterBytesPerRow];
    const rowStart = y * filterBytesPerRow + 1;
    const outStart = y * bytesPerRow;

    for (let x = 0; x < bytesPerRow; x++) {
      const raw = data[rowStart + x];
      const a = x >= bytesPerPixel ? unfiltered[outStart + x - bytesPerPixel] : 0;
      const b = prevRow[x];
      const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;

      let value: number;
      switch (filterType) {
        case 0: value = raw; break; // None
        case 1: value = (raw + a) & 0xFF; break; // Sub
        case 2: value = (raw + b) & 0xFF; break; // Up
        case 3: value = (raw + Math.floor((a + b) / 2)) & 0xFF; break; // Average
        case 4: value = (raw + paethPredictor(a, b, c)) & 0xFF; break; // Paeth
        default: value = raw;
      }

      unfiltered[outStart + x] = value;
    }

    prevRow = unfiltered.slice(outStart, outStart + bytesPerRow);
  }

  // RGBとAlphaを分離
  let imageData: Uint8Array;
  let alphaData: Uint8Array | null = null;

  if (colorType === 6) {
    // RGBA -> RGB + Alpha
    const rgbData = new Uint8Array(width * height * 3);
    alphaData = new Uint8Array(width * height);

    for (let i = 0; i < width * height; i++) {
      rgbData[i * 3] = unfiltered[i * 4];
      rgbData[i * 3 + 1] = unfiltered[i * 4 + 1];
      rgbData[i * 3 + 2] = unfiltered[i * 4 + 2];
      alphaData[i] = unfiltered[i * 4 + 3];
    }
    imageData = rgbData;
  } else if (colorType === 4) {
    // Grayscale + Alpha -> Gray + Alpha
    const grayData = new Uint8Array(width * height);
    alphaData = new Uint8Array(width * height);

    for (let i = 0; i < width * height; i++) {
      grayData[i] = unfiltered[i * 2];
      alphaData[i] = unfiltered[i * 2 + 1];
    }
    imageData = grayData;
  } else {
    imageData = unfiltered;
  }

  return { imageData, alphaData };
}

/**
 * Paeth予測器
 */
function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);

  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Uint8Array を結合
 */
function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Base64をUint8Arrayに変換
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
