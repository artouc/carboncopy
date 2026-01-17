/**
 * StyleExtractor - DOM要素からスタイル情報を抽出
 *
 * getComputedStyle と getBoundingClientRect を統合し、
 * PDF描画に必要な情報を正確に取得する。
 *
 * 重要: getBoundingClientRect はブラウザのレイアウト計算結果を返すため、
 * Flexbox/Grid のレイアウトも正確に反映される。
 */

import { parseColor, type RGBAColor } from '../utils/ColorParser.js';

/**
 * 抽出されたボックスモデル情報
 */
export interface BoxModel {
  // Content box (padding内側)
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;

  // Padding box
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;

  // Border box (要素全体)
  borderX: number;
  borderY: number;
  borderWidth: number;
  borderHeight: number;

  // Border widths
  borderTopWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;

  // Margin
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

/**
 * 抽出されたフォント情報
 */
export interface FontInfo {
  family: string;
  size: number; // px
  weight: number;
  style: 'normal' | 'italic' | 'oblique';
  lineHeight: number; // px (計算済み)
  letterSpacing: number; // px
}

/**
 * 抽出された境界線情報
 */
export interface BorderInfo {
  top: BorderSide;
  right: BorderSide;
  bottom: BorderSide;
  left: BorderSide;
}

export interface BorderSide {
  width: number; // px
  style: string;
  color: RGBAColor | null;
}

/**
 * 抽出されたスタイル情報の全体
 */
export interface ExtractedStyles {
  // 位置・サイズ (getBoundingClientRect から)
  box: BoxModel;

  // 背景
  backgroundColor: RGBAColor | null;
  backgroundImage: string | null;

  // 境界線
  border: BorderInfo;

  // 角丸
  borderRadius: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  };

  // テキスト
  font: FontInfo;
  color: RGBAColor | null;
  textAlign: string;
  textDecoration: string;
  verticalAlign: string;
  whiteSpace: string;

  // 表示
  display: string;
  visibility: string;
  opacity: number;
  overflow: string;
  overflowX: string;
  overflowY: string;

  // 変形
  transform: DOMMatrix | null;

  // Z-index
  zIndex: number | 'auto';

  // その他
  position: string;
  boxShadow: string | null;
}

/**
 * DOM要素からスタイル情報を抽出
 */
export function extractStyles(element: Element): ExtractedStyles {
  const computed = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return {
    box: extractBoxModel(element, computed, rect),
    backgroundColor: parseColor(computed.backgroundColor),
    backgroundImage: computed.backgroundImage !== 'none' ? computed.backgroundImage : null,
    border: extractBorder(computed),
    borderRadius: extractBorderRadius(computed),
    font: extractFont(computed),
    color: parseColor(computed.color),
    textAlign: computed.textAlign,
    textDecoration: computed.textDecoration,
    verticalAlign: computed.verticalAlign,
    whiteSpace: computed.whiteSpace,
    display: computed.display,
    visibility: computed.visibility,
    opacity: parseFloat(computed.opacity) || 1,
    overflow: computed.overflow,
    overflowX: computed.overflowX,
    overflowY: computed.overflowY,
    transform: extractTransform(computed),
    zIndex: computed.zIndex === 'auto' ? 'auto' : parseInt(computed.zIndex, 10),
    position: computed.position,
    boxShadow: computed.boxShadow !== 'none' ? computed.boxShadow : null,
  };
}

/**
 * ボックスモデル情報を抽出
 */
function extractBoxModel(
  element: Element,
  computed: CSSStyleDeclaration,
  rect: DOMRect
): BoxModel {
  const paddingTop = parseFloat(computed.paddingTop) || 0;
  const paddingRight = parseFloat(computed.paddingRight) || 0;
  const paddingBottom = parseFloat(computed.paddingBottom) || 0;
  const paddingLeft = parseFloat(computed.paddingLeft) || 0;

  const borderTopWidth = parseFloat(computed.borderTopWidth) || 0;
  const borderRightWidth = parseFloat(computed.borderRightWidth) || 0;
  const borderBottomWidth = parseFloat(computed.borderBottomWidth) || 0;
  const borderLeftWidth = parseFloat(computed.borderLeftWidth) || 0;

  const marginTop = parseFloat(computed.marginTop) || 0;
  const marginRight = parseFloat(computed.marginRight) || 0;
  const marginBottom = parseFloat(computed.marginBottom) || 0;
  const marginLeft = parseFloat(computed.marginLeft) || 0;

  // getBoundingClientRect は border-box を返す
  const borderX = rect.x;
  const borderY = rect.y;
  const borderWidth = rect.width;
  const borderHeight = rect.height;

  // Content box = border box - border - padding
  const contentX = borderX + borderLeftWidth + paddingLeft;
  const contentY = borderY + borderTopWidth + paddingTop;
  const contentWidth = borderWidth - borderLeftWidth - borderRightWidth - paddingLeft - paddingRight;
  const contentHeight = borderHeight - borderTopWidth - borderBottomWidth - paddingTop - paddingBottom;

  return {
    contentX,
    contentY,
    contentWidth: Math.max(0, contentWidth),
    contentHeight: Math.max(0, contentHeight),
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    borderX,
    borderY,
    borderWidth,
    borderHeight,
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  };
}

/**
 * 境界線情報を抽出
 */
function extractBorder(computed: CSSStyleDeclaration): BorderInfo {
  return {
    top: {
      width: parseFloat(computed.borderTopWidth) || 0,
      style: computed.borderTopStyle,
      color: parseColor(computed.borderTopColor),
    },
    right: {
      width: parseFloat(computed.borderRightWidth) || 0,
      style: computed.borderRightStyle,
      color: parseColor(computed.borderRightColor),
    },
    bottom: {
      width: parseFloat(computed.borderBottomWidth) || 0,
      style: computed.borderBottomStyle,
      color: parseColor(computed.borderBottomColor),
    },
    left: {
      width: parseFloat(computed.borderLeftWidth) || 0,
      style: computed.borderLeftStyle,
      color: parseColor(computed.borderLeftColor),
    },
  };
}

/**
 * 角丸情報を抽出
 */
function extractBorderRadius(computed: CSSStyleDeclaration): {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
} {
  return {
    topLeft: parseFloat(computed.borderTopLeftRadius) || 0,
    topRight: parseFloat(computed.borderTopRightRadius) || 0,
    bottomRight: parseFloat(computed.borderBottomRightRadius) || 0,
    bottomLeft: parseFloat(computed.borderBottomLeftRadius) || 0,
  };
}

/**
 * フォント情報を抽出
 */
function extractFont(computed: CSSStyleDeclaration): FontInfo {
  const fontSize = parseFloat(computed.fontSize) || 16;

  // line-height は 'normal' の場合がある
  let lineHeight: number;
  if (computed.lineHeight === 'normal') {
    lineHeight = fontSize * 1.2; // デフォルト
  } else {
    lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.2;
  }

  // letter-spacing は 'normal' の場合がある
  const letterSpacing = computed.letterSpacing === 'normal'
    ? 0
    : parseFloat(computed.letterSpacing) || 0;

  // font-weight は数値または文字列
  let fontWeight: number;
  if (computed.fontWeight === 'normal') {
    fontWeight = 400;
  } else if (computed.fontWeight === 'bold') {
    fontWeight = 700;
  } else {
    fontWeight = parseInt(computed.fontWeight, 10) || 400;
  }

  // font-style
  let fontStyle: 'normal' | 'italic' | 'oblique' = 'normal';
  if (computed.fontStyle === 'italic') {
    fontStyle = 'italic';
  } else if (computed.fontStyle === 'oblique') {
    fontStyle = 'oblique';
  }

  return {
    family: computed.fontFamily,
    size: fontSize,
    weight: fontWeight,
    style: fontStyle,
    lineHeight,
    letterSpacing,
  };
}

/**
 * transform を抽出
 */
function extractTransform(computed: CSSStyleDeclaration): DOMMatrix | null {
  if (computed.transform === 'none') {
    return null;
  }

  try {
    return new DOMMatrix(computed.transform);
  } catch {
    return null;
  }
}

/**
 * 要素が表示されるかどうか判定
 */
export function isVisible(styles: ExtractedStyles): boolean {
  if (styles.display === 'none') return false;
  if (styles.visibility === 'hidden') return false;
  if (styles.opacity === 0) return false;
  if (styles.box.borderWidth === 0 && styles.box.borderHeight === 0) return false;
  return true;
}

/**
 * 要素にクリッピングが必要かどうか判定
 */
export function needsClipping(styles: ExtractedStyles): boolean {
  return styles.overflow === 'hidden' ||
         styles.overflow === 'clip' ||
         styles.overflowX === 'hidden' ||
         styles.overflowX === 'clip' ||
         styles.overflowY === 'hidden' ||
         styles.overflowY === 'clip';
}

/**
 * テキストノードの親要素からスタイルを取得
 */
export function extractTextStyles(element: Element): {
  font: FontInfo;
  color: RGBAColor | null;
  textAlign: string;
  textDecoration: string;
  whiteSpace: string;
} {
  const computed = getComputedStyle(element);
  return {
    font: extractFont(computed),
    color: parseColor(computed.color),
    textAlign: computed.textAlign,
    textDecoration: computed.textDecoration,
    whiteSpace: computed.whiteSpace,
  };
}
