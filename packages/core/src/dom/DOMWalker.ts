/**
 * DOMWalker - DOM木の再帰的走査
 *
 * DOM要素を走査し、PDF描画に必要なノード情報を収集する。
 * 描画順序（z-index、DOM順序）を考慮してノードを並べ替える。
 */

import {
  extractStyles,
  extractTextStyles,
  isVisible,
  needsClipping,
  type ExtractedStyles,
} from './StyleExtractor.js';
import type { RGBAColor } from '../utils/ColorParser.js';

/**
 * レンダリングノードの種類
 */
export type RenderNodeType = 'element' | 'text' | 'image' | 'replaced';

/**
 * 基本レンダリングノード
 */
export interface BaseRenderNode {
  type: RenderNodeType;
  element: Element;
  styles: ExtractedStyles;
  children: RenderNode[];
  needsClipping: boolean;
}

/**
 * 要素ノード
 */
export interface ElementRenderNode extends BaseRenderNode {
  type: 'element';
  tagName: string;
}

/**
 * テキストノード
 */
export interface TextRenderNode {
  type: 'text';
  parentElement: Element;
  textContent: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font: {
    family: string;
    size: number;
    weight: number;
    style: 'normal' | 'italic' | 'oblique';
    lineHeight: number;
  };
  color: RGBAColor | null;
}

/**
 * 画像ノード
 */
export interface ImageRenderNode extends BaseRenderNode {
  type: 'image';
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * 置換要素ノード (canvas, video, iframe等)
 */
export interface ReplacedRenderNode extends BaseRenderNode {
  type: 'replaced';
  tagName: string;
}

export type RenderNode = ElementRenderNode | TextRenderNode | ImageRenderNode | ReplacedRenderNode;

/**
 * 走査オプション
 */
export interface WalkOptions {
  /** ルート要素の位置オフセット */
  offsetX?: number;
  offsetY?: number;
  /** 無視する要素のセレクタ */
  ignoreSelectors?: string[];
  /** 画像を含めるかどうか */
  includeImages?: boolean;
}

/**
 * 無視すべきタグ名
 */
const IGNORED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'HEAD',
  'META',
  'LINK',
  'TITLE',
  'BR', // 改行は別途処理
]);

/**
 * 置換要素（特別な処理が必要な要素）
 */
const REPLACED_ELEMENTS = new Set([
  'IMG',
  'VIDEO',
  'CANVAS',
  'IFRAME',
  'EMBED',
  'OBJECT',
  'SVG',
]);

/**
 * DOM木を走査してレンダリングノードのツリーを構築
 */
export function walkDOM(root: Element, options: WalkOptions = {}): RenderNode[] {
  const {
    ignoreSelectors = [],
    includeImages = true,
  } = options;

  const nodes: RenderNode[] = [];

  // ルート要素を処理
  processElement(root, nodes, ignoreSelectors, includeImages);

  return nodes;
}

/**
 * 要素を処理
 */
function processElement(
  element: Element,
  parentNodes: RenderNode[],
  ignoreSelectors: string[],
  includeImages: boolean
): void {
  // 無視するタグ
  if (IGNORED_TAGS.has(element.tagName)) {
    return;
  }

  // 無視するセレクタにマッチ
  if (ignoreSelectors.some(sel => element.matches(sel))) {
    return;
  }

  // スタイルを抽出
  const styles = extractStyles(element);

  // 非表示の要素はスキップ
  if (!isVisible(styles)) {
    return;
  }

  // 画像の場合
  if (element.tagName === 'IMG' && includeImages) {
    const imgNode = createImageNode(element as HTMLImageElement, styles);
    if (imgNode) {
      parentNodes.push(imgNode);
    }
    return;
  }

  // その他の置換要素
  if (REPLACED_ELEMENTS.has(element.tagName)) {
    const replacedNode: ReplacedRenderNode = {
      type: 'replaced',
      tagName: element.tagName,
      element,
      styles,
      children: [],
      needsClipping: needsClipping(styles),
    };
    parentNodes.push(replacedNode);
    return;
  }

  // 通常の要素
  const elementNode: ElementRenderNode = {
    type: 'element',
    tagName: element.tagName,
    element,
    styles,
    children: [],
    needsClipping: needsClipping(styles),
  };

  // 子ノードを処理
  processChildNodes(element, elementNode.children, ignoreSelectors, includeImages);

  parentNodes.push(elementNode);
}

/**
 * 子ノードを処理
 */
function processChildNodes(
  element: Element,
  childNodes: RenderNode[],
  ignoreSelectors: string[],
  includeImages: boolean
): void {
  for (const child of element.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      // 要素ノード
      processElement(child as Element, childNodes, ignoreSelectors, includeImages);
    } else if (child.nodeType === Node.TEXT_NODE) {
      // テキストノード（複数行に対応）
      const textNodes = createTextNodes(child as Text, element);
      for (const textNode of textNodes) {
        childNodes.push(textNode);
      }
    }
  }
}

/**
 * テキストノードを作成（複数行に対応）
 * 複数行のテキストは複数のTextRenderNodeを返す
 */
function createTextNode(textNode: Text, parentElement: Element): TextRenderNode | null {
  const text = textNode.textContent;
  if (!text || !text.trim()) {
    return null;
  }

  const textStyles = extractTextStyles(parentElement);

  // 複数行のテキストを検出して処理
  const lines = getTextLines(textNode, parentElement);

  if (lines.length === 0) {
    return null;
  }

  // 単一行の場合はそのまま返す
  if (lines.length === 1) {
    return {
      type: 'text',
      parentElement,
      textContent: lines[0].text,
      x: lines[0].x,
      y: lines[0].y,
      width: lines[0].width,
      height: lines[0].height,
      font: textStyles.font,
      color: textStyles.color,
    };
  }

  // 複数行の場合は最初の行を返す
  // （残りの行は createTextNodes で処理）
  return {
    type: 'text',
    parentElement,
    textContent: lines[0].text,
    x: lines[0].x,
    y: lines[0].y,
    width: lines[0].width,
    height: lines[0].height,
    font: textStyles.font,
    color: textStyles.color,
  };
}

/**
 * テキストノードから複数のレンダリングノードを作成
 */
function createTextNodes(textNode: Text, parentElement: Element): TextRenderNode[] {
  const text = textNode.textContent;
  if (!text || !text.trim()) {
    return [];
  }

  const textStyles = extractTextStyles(parentElement);
  const lines = getTextLines(textNode, parentElement);

  return lines.map(line => ({
    type: 'text' as const,
    parentElement,
    textContent: line.text,
    x: line.x,
    y: line.y,
    width: line.width,
    height: line.height,
    font: textStyles.font,
    color: textStyles.color,
  }));
}

/**
 * 画像ノードを作成
 */
function createImageNode(img: HTMLImageElement, styles: ExtractedStyles): ImageRenderNode | null {
  // 画像がロードされていない場合
  if (!img.complete || img.naturalWidth === 0) {
    return null;
  }

  return {
    type: 'image',
    element: img,
    styles,
    src: img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    children: [],
    needsClipping: needsClipping(styles),
  };
}

/**
 * レンダリングノードを平坦化（深さ優先）
 * 描画順序を決定するために使用
 */
export function flattenNodes(nodes: RenderNode[]): RenderNode[] {
  const result: RenderNode[] = [];

  function flatten(node: RenderNode): void {
    result.push(node);
    if ('children' in node && node.children) {
      for (const child of node.children) {
        flatten(child);
      }
    }
  }

  for (const node of nodes) {
    flatten(node);
  }

  return result;
}

/**
 * レンダリングノードをz-indexでソート
 * (簡易版 - スタッキングコンテキストの完全な実装は複雑)
 */
export function sortByZIndex(nodes: RenderNode[]): RenderNode[] {
  return [...nodes].sort((a, b) => {
    const zIndexA = 'styles' in a && a.styles.zIndex !== 'auto' ? a.styles.zIndex : 0;
    const zIndexB = 'styles' in b && b.styles.zIndex !== 'auto' ? b.styles.zIndex : 0;
    return zIndexA - zIndexB;
  });
}

/**
 * テキストを行ごとに分割して位置を計算
 * getClientRectsの各矩形（行）に対応するテキストをバイナリサーチで特定
 */
export function getTextLines(
  textNode: Text,
  parentElement: Element
): Array<{ text: string; x: number; y: number; width: number; height: number }> {
  const text = textNode.textContent ?? '';
  if (!text.trim()) {
    return [];
  }

  const range = document.createRange();
  range.selectNodeContents(textNode);
  const allRects = range.getClientRects();

  // 矩形がない場合
  if (allRects.length === 0) {
    return [];
  }

  // 1つの矩形 = 1行（折り返しなし）
  if (allRects.length === 1) {
    return [{
      text: text,
      x: allRects[0].x,
      y: allRects[0].y,
      width: allRects[0].width,
      height: allRects[0].height,
    }];
  }

  // Y座標でユニークな矩形を抽出（各視覚的行に1つ）
  const lineRects: DOMRect[] = [];
  let lastY = -Infinity;
  for (let i = 0; i < allRects.length; i++) {
    const rect = allRects[i];
    if (rect.width > 0 && rect.height > 0 && Math.abs(rect.y - lastY) > 2) {
      lineRects.push(rect);
      lastY = rect.y;
    }
  }

  if (lineRects.length <= 1) {
    const rect = lineRects[0] || allRects[0];
    return [{
      text: text,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    }];
  }

  // 各視覚的行の境界文字インデックスをバイナリサーチで特定
  const lines: Array<{ text: string; x: number; y: number; width: number; height: number }> = [];

  // ヘルパー: 文字インデックスがどのY座標にあるかを取得
  function getCharY(idx: number): number {
    if (idx < 0 || idx >= text.length) return Infinity;
    range.setStart(textNode, idx);
    range.setEnd(textNode, idx + 1);
    const rects = range.getClientRects();
    // 幅がある矩形を探す
    for (let i = 0; i < rects.length; i++) {
      if (rects[i].width > 0) return rects[i].y;
    }
    return Infinity;
  }

  // 各行の開始インデックスを線形スキャンで特定
  // ホワイトスペース文字は前の文字のY座標を継承
  const charYPositions: number[] = [];
  let lastValidY = lineRects[0].y;

  for (let i = 0; i < text.length; i++) {
    const y = getCharY(i);
    if (y !== Infinity) {
      lastValidY = y;
      charYPositions.push(y);
    } else {
      charYPositions.push(lastValidY);
    }
  }

  // Y座標の変化点で行を分割
  const lineStartIndices: number[] = [0];
  let currentLineY = charYPositions[0];

  for (let i = 1; i < text.length; i++) {
    if (Math.abs(charYPositions[i] - currentLineY) > 5) {
      // Y座標が変化 = 新しい行の開始
      // 単語境界まで戻る（前の行の末尾のスペースを含める）
      let lineBreak = i;

      // 現在位置がスペースでなければ、前のスペースまで戻る
      if (!/\s/.test(text[i])) {
        for (let j = i - 1; j >= lineStartIndices[lineStartIndices.length - 1]; j--) {
          if (/\s/.test(text[j])) {
            lineBreak = j + 1;
            break;
          }
        }
      }

      lineStartIndices.push(lineBreak);
      currentLineY = charYPositions[i];
    }
  }
  lineStartIndices.push(text.length);

  // 各行のテキストと矩形を抽出
  for (let i = 0; i < lineStartIndices.length - 1; i++) {
    const start = lineStartIndices[i];
    const end = lineStartIndices[i + 1];
    const lineText = text.slice(start, end);

    // ホワイトスペースを正規化（改行やタブをスペースに、連続スペースを1つに）
    const normalizedText = lineText.replace(/\s+/g, ' ').trim();

    if (normalizedText.length === 0) continue;

    // 正規化後のテキストの矩形を取得
    // 元のテキストから正規化されたテキストの開始・終了位置を特定
    const firstNonWs = lineText.search(/\S/);
    const lastNonWs = lineText.search(/\S\s*$/);

    if (firstNonWs === -1) continue;

    const trimStart = start + firstNonWs;
    const trimEnd = start + lastNonWs + 1;

    range.setStart(textNode, trimStart);
    range.setEnd(textNode, trimEnd);
    const trimRects = range.getClientRects();

    if (trimRects.length > 0) {
      // この範囲の最初の視覚的行の矩形を使用
      const rect = trimRects[0];
      lines.push({
        text: normalizedText,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    }
  }

  if (lines.length === 0) {
    return [{
      text: text.replace(/\s+/g, ' ').trim(),
      x: allRects[0].x,
      y: allRects[0].y,
      width: allRects[0].width,
      height: allRects[0].height,
    }];
  }

  return lines;
}
