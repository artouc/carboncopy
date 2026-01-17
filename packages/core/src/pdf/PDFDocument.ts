/**
 * PDFDocument - PDFドキュメント全体の管理
 *
 * ページ、フォント、画像などのリソースを管理し、
 * 最終的なPDFバイナリを生成する。
 */

import { PDFPage } from './PDFPage.js';
import {
  PDFDict,
  PDFArray,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFStream,
  PDFIndirectObject,
  PDFString,
  concatUint8Arrays,
} from './objects/PDFObject.js';
import type { LoadedFont } from '../fonts/FontManager.js';
import { embedCIDFont, textToCIDHex, type EmbedContext } from '../fonts/FontEmbedder.js';
import pako from 'pako';

const TEXT_ENCODER = new TextEncoder();

export interface FontInfo {
  ref: PDFRef;
  name: string;
  /** CIDフォントの場合true */
  isCID?: boolean;
  /** 元のLoadedFont（CIDフォントの場合） */
  loadedFont?: LoadedFont;
}

export interface ImageInfo {
  ref: PDFRef;
  name: string;
  width: number;
  height: number;
}

export interface DocumentInfo {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
}

export class PDFDocument {
  private pages: PDFPage[] = [];
  private fonts: Map<string, FontInfo> = new Map();
  private images: Map<string, ImageInfo> = new Map();
  private objects: PDFIndirectObject[] = [];
  private nextObjectNumber: number = 1;
  private info: DocumentInfo = {
    producer: 'precise-html-pdf',
    creator: 'precise-html-pdf',
  };

  constructor() {}

  /**
   * ドキュメント情報を設定
   */
  setInfo(info: DocumentInfo): void {
    this.info = { ...this.info, ...info };
  }

  /**
   * 新しいページを追加
   */
  addPage(width: number, height: number): PDFPage {
    const page = new PDFPage(width, height);
    this.pages.push(page);
    return page;
  }

  /**
   * 標準フォントを追加
   */
  addStandardFont(name: string, baseFont: string): FontInfo {
    if (this.fonts.has(name)) {
      return this.fonts.get(name)!;
    }

    // 標準フォントの辞書を作成
    const fontDict = new PDFDict();
    fontDict.set('Type', new PDFName('Font'));
    fontDict.set('Subtype', new PDFName('Type1'));
    fontDict.set('BaseFont', new PDFName(baseFont));

    // WinAnsiEncoding を使用（標準的な西欧文字）
    fontDict.set('Encoding', new PDFName('WinAnsiEncoding'));

    const obj = this.registerObject(fontDict);
    const fontInfo: FontInfo = { ref: obj.ref(), name };
    this.fonts.set(name, fontInfo);

    return fontInfo;
  }

  /**
   * カスタムフォント（TrueType/OpenType）を追加
   * CIDFont として埋め込み、日本語等のUnicode文字をサポート
   */
  addCustomFont(name: string, loadedFont: LoadedFont, usedText?: string): FontInfo {
    if (this.fonts.has(name)) {
      return this.fonts.get(name)!;
    }

    // 使用する文字を収集
    const usedCodePoints = new Set<number>();
    if (usedText) {
      for (const char of usedText) {
        const cp = char.codePointAt(0);
        if (cp !== undefined) {
          usedCodePoints.add(cp);
        }
      }
    }
    // LoadedFont に記録されている使用文字も追加
    for (const cp of loadedFont.usedCodePoints) {
      usedCodePoints.add(cp);
    }

    // 最低限の文字（スペース）を追加
    usedCodePoints.add(32);

    // 埋め込みコンテキスト
    const context: EmbedContext = {
      nextObjectNumber: this.nextObjectNumber,
      registerObject: (obj) => {
        this.objects.push(obj);
      },
    };

    // CIDFont として埋め込み
    const embedded = embedCIDFont(loadedFont, usedCodePoints, context);

    // オブジェクト番号を更新
    this.nextObjectNumber = context.nextObjectNumber;

    const fontInfo: FontInfo = {
      ref: embedded.ref,
      name,
      isCID: true,
      loadedFont,
    };
    this.fonts.set(name, fontInfo);

    return fontInfo;
  }

  /**
   * オブジェクトを登録
   */
  private registerObject(value: PDFDict | PDFStream | PDFArray): PDFIndirectObject {
    const obj = new PDFIndirectObject(this.nextObjectNumber++, 0, value);
    this.objects.push(obj);
    return obj;
  }

  /**
   * ページにフォントを適用
   */
  applyFontToPage(page: PDFPage, fontName: string): void {
    const fontInfo = this.fonts.get(fontName);
    if (fontInfo) {
      page.addFont(fontName, fontInfo.ref);
    }
  }

  /**
   * フォント情報を取得
   */
  getFontInfo(fontName: string): FontInfo | undefined {
    return this.fonts.get(fontName);
  }

  /**
   * テキストをCIDフォント用の16進数文字列に変換
   */
  textToHex(fontName: string, text: string): string | null {
    const fontInfo = this.fonts.get(fontName);
    if (!fontInfo?.isCID || !fontInfo.loadedFont) {
      return null;
    }
    return textToCIDHex(fontInfo.loadedFont, text);
  }

  /**
   * 画像を追加（内部登録済みのXObjectを使用）
   */
  addImage(name: string, ref: PDFRef, width: number, height: number): ImageInfo {
    if (this.images.has(name)) {
      return this.images.get(name)!;
    }

    const imageInfo: ImageInfo = { ref, name, width, height };
    this.images.set(name, imageInfo);
    return imageInfo;
  }

  /**
   * 画像情報を取得
   */
  getImageInfo(name: string): ImageInfo | undefined {
    return this.images.get(name);
  }

  /**
   * ページに画像を適用
   */
  applyImageToPage(page: PDFPage, imageName: string): void {
    const imageInfo = this.images.get(imageName);
    if (imageInfo) {
      page.addImage(imageName, imageInfo.ref);
    }
  }

  /**
   * 埋め込みコンテキストを取得（画像・フォント埋め込み用）
   */
  getEmbedContext(): EmbedContext {
    return {
      nextObjectNumber: this.nextObjectNumber,
      registerObject: (obj: PDFIndirectObject) => {
        this.objects.push(obj);
        // nextObjectNumberを更新
        if (obj.objectNumber >= this.nextObjectNumber) {
          this.nextObjectNumber = obj.objectNumber + 1;
        }
      },
    };
  }

  /**
   * 埋め込みコンテキストの状態を同期
   */
  syncEmbedContext(context: EmbedContext): void {
    this.nextObjectNumber = context.nextObjectNumber;
  }

  /**
   * PDFバイナリを生成
   */
  save(): Uint8Array {
    const parts: Uint8Array[] = [];
    const objectOffsets: number[] = [];
    let currentOffset = 0;

    // ヘッダー
    const header = TEXT_ENCODER.encode('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n');
    parts.push(header);
    currentOffset += header.length;

    // 登録済みオブジェクト（フォントなど）を書き出し
    for (const obj of this.objects) {
      objectOffsets[obj.objectNumber] = currentOffset;
      const serialized = obj.serialize();
      parts.push(serialized);
      currentOffset += serialized.length;
    }

    // Pages辞書を作成
    const pagesObjectNumber = this.nextObjectNumber++;
    const pageRefs: PDFRef[] = [];
    const pageObjectNumbers: number[] = [];
    const contentObjectNumbers: number[] = [];

    // 各ページのオブジェクトを作成
    for (const page of this.pages) {
      const contentObjectNumber = this.nextObjectNumber++;
      const pageObjectNumber = this.nextObjectNumber++;
      contentObjectNumbers.push(contentObjectNumber);
      pageObjectNumbers.push(pageObjectNumber);
      pageRefs.push(new PDFRef(pageObjectNumber));
    }

    const pagesDict = new PDFDict();
    pagesDict.set('Type', new PDFName('Pages'));
    pagesDict.set('Kids', new PDFArray(pageRefs));
    pagesDict.set('Count', new PDFNumber(this.pages.length));

    objectOffsets[pagesObjectNumber] = currentOffset;
    const pagesObj = new PDFIndirectObject(pagesObjectNumber, 0, pagesDict);
    const pagesSerialized = pagesObj.serialize();
    parts.push(pagesSerialized);
    currentOffset += pagesSerialized.length;

    // 各ページとそのコンテンツを書き出し
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const contentObjNum = contentObjectNumbers[i];
      const pageObjNum = pageObjectNumbers[i];

      // コンテンツストリーム（Deflate圧縮）
      const contentData = page.getContentsBytes();
      const compressedData = pako.deflate(contentData);
      const contentDict = new PDFDict();
      contentDict.set('Filter', new PDFName('FlateDecode'));
      const contentStream = new PDFStream(compressedData, contentDict);
      objectOffsets[contentObjNum] = currentOffset;
      const contentObj = new PDFIndirectObject(contentObjNum, 0, contentStream);
      const contentSerialized = contentObj.serialize();
      parts.push(contentSerialized);
      currentOffset += contentSerialized.length;

      // ページ辞書
      const pageDict = page.buildPageDict(
        new PDFRef(pagesObjectNumber),
        new PDFRef(contentObjNum)
      );
      objectOffsets[pageObjNum] = currentOffset;
      const pageObj = new PDFIndirectObject(pageObjNum, 0, pageDict);
      const pageSerialized = pageObj.serialize();
      parts.push(pageSerialized);
      currentOffset += pageSerialized.length;
    }

    // Info辞書
    const infoObjectNumber = this.nextObjectNumber++;
    const infoDict = new PDFDict();
    if (this.info.title) {
      infoDict.set('Title', new PDFString(this.info.title));
    }
    if (this.info.author) {
      infoDict.set('Author', new PDFString(this.info.author));
    }
    if (this.info.subject) {
      infoDict.set('Subject', new PDFString(this.info.subject));
    }
    if (this.info.creator) {
      infoDict.set('Creator', new PDFString(this.info.creator));
    }
    if (this.info.producer) {
      infoDict.set('Producer', new PDFString(this.info.producer));
    }
    // 作成日時
    const now = new Date();
    const dateStr = this.formatPDFDate(now);
    infoDict.set('CreationDate', new PDFString(dateStr));
    infoDict.set('ModDate', new PDFString(dateStr));

    objectOffsets[infoObjectNumber] = currentOffset;
    const infoObj = new PDFIndirectObject(infoObjectNumber, 0, infoDict);
    const infoSerialized = infoObj.serialize();
    parts.push(infoSerialized);
    currentOffset += infoSerialized.length;

    // Catalog辞書
    const catalogObjectNumber = this.nextObjectNumber++;
    const catalogDict = new PDFDict();
    catalogDict.set('Type', new PDFName('Catalog'));
    catalogDict.set('Pages', new PDFRef(pagesObjectNumber));

    objectOffsets[catalogObjectNumber] = currentOffset;
    const catalogObj = new PDFIndirectObject(catalogObjectNumber, 0, catalogDict);
    const catalogSerialized = catalogObj.serialize();
    parts.push(catalogSerialized);
    currentOffset += catalogSerialized.length;

    // クロスリファレンステーブル
    const xrefOffset = currentOffset;
    const xrefLines = ['xref', `0 ${this.nextObjectNumber}`];
    xrefLines.push('0000000000 65535 f ');
    for (let i = 1; i < this.nextObjectNumber; i++) {
      const offset = objectOffsets[i] ?? 0;
      xrefLines.push(`${offset.toString().padStart(10, '0')} 00000 n `);
    }
    const xref = TEXT_ENCODER.encode(xrefLines.join('\n') + '\n');
    parts.push(xref);

    // Trailer
    const trailerDict = new PDFDict();
    trailerDict.set('Size', new PDFNumber(this.nextObjectNumber));
    trailerDict.set('Root', new PDFRef(catalogObjectNumber));
    trailerDict.set('Info', new PDFRef(infoObjectNumber));

    const trailer = concatUint8Arrays([
      TEXT_ENCODER.encode('trailer\n'),
      trailerDict.serialize(),
      TEXT_ENCODER.encode(`\nstartxref\n${xrefOffset}\n%%EOF\n`),
    ]);
    parts.push(trailer);

    return concatUint8Arrays(parts);
  }

  /**
   * PDF日付形式にフォーマット
   * D:YYYYMMDDHHmmSSOHH'mm'
   */
  private formatPDFDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const tzOffset = -date.getTimezoneOffset();
    const tzSign = tzOffset >= 0 ? '+' : '-';
    const tzHours = pad(Math.floor(Math.abs(tzOffset) / 60));
    const tzMins = pad(Math.abs(tzOffset) % 60);
    return `D:${year}${month}${day}${hours}${minutes}${seconds}${tzSign}${tzHours}'${tzMins}'`;
  }

  /**
   * ページ数を取得
   */
  getPageCount(): number {
    return this.pages.length;
  }

  /**
   * ページを取得
   */
  getPage(index: number): PDFPage | undefined {
    return this.pages[index];
  }
}
