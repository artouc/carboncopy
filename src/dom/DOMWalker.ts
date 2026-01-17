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
      // テキストノード
      const textNode = createTextNode(child as Text, element);
      if (textNode) {
        childNodes.push(textNode);
      }
    }
  }
}

/**
 * テキストノードを作成
 */
function createTextNode(textNode: Text, parentElement: Element): TextRenderNode | null {
  const text = textNode.textContent?.trim();
  if (!text) {
    return null;
  }

  // Range APIでテキストの正確な位置を取得
  const range = document.createRange();
  range.selectNodeContents(textNode);
  const rects = range.getClientRects();

  if (rects.length === 0) {
    return null;
  }

  // 最初の矩形を使用（複数行の場合は後で対応）
  const rect = rects[0];

  const textStyles = extractTextStyles(parentElement);

  return {
    type: 'text',
    parentElement,
    textContent: text,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    font: textStyles.font,
    color: textStyles.color,
  };
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
 * (複数行テキストの処理)
 */
export function getTextLines(
  textNode: Text,
  parentElement: Element
): Array<{ text: string; x: number; y: number; width: number; height: number }> {
  const range = document.createRange();
  const lines: Array<{ text: string; x: number; y: number; width: number; height: number }> = [];

  const text = textNode.textContent ?? '';
  if (!text.trim()) {
    return lines;
  }

  // Range APIで各文字の位置を取得し、行を検出
  range.selectNodeContents(textNode);
  const rects = range.getClientRects();

  // 単純なケース: 1行のみ
  if (rects.length === 1) {
    lines.push({
      text: text.trim(),
      x: rects[0].x,
      y: rects[0].y,
      width: rects[0].width,
      height: rects[0].height,
    });
    return lines;
  }

  // 複数行: 各行ごとに矩形を収集
  let currentLineY = -Infinity;
  let currentLineText = '';
  let currentLineRect: DOMRect | null = null;

  for (let i = 0; i < text.length; i++) {
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    const charRects = range.getClientRects();

    if (charRects.length === 0) continue;

    const charRect = charRects[0];

    // 新しい行を検出（Y座標が大きく変わった場合）
    if (charRect.y > currentLineY + 2) {
      // 前の行を保存
      if (currentLineText.trim() && currentLineRect) {
        lines.push({
          text: currentLineText.trim(),
          x: currentLineRect.x,
          y: currentLineRect.y,
          width: currentLineRect.width,
          height: currentLineRect.height,
        });
      }
      // 新しい行を開始
      currentLineY = charRect.y;
      currentLineText = text[i];
      currentLineRect = charRect;
    } else {
      // 同じ行に追加
      currentLineText += text[i];
      if (currentLineRect) {
        // 幅を更新
        currentLineRect = new DOMRect(
          currentLineRect.x,
          currentLineRect.y,
          charRect.right - currentLineRect.x,
          currentLineRect.height
        );
      }
    }
  }

  // 最後の行を保存
  if (currentLineText.trim() && currentLineRect) {
    lines.push({
      text: currentLineText.trim(),
      x: currentLineRect.x,
      y: currentLineRect.y,
      width: currentLineRect.width,
      height: currentLineRect.height,
    });
  }

  return lines;
}
