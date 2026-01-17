/**
 * FontSubsetter - フォントサブセット化
 *
 * 使用されている文字のみを含むサブセットフォントを生成。
 * PDF ファイルサイズを大幅に削減する。
 *
 * Note: 完全なサブセット化は複雑なため、現時点では
 * グリフ使用状況の追跡と基本的なサブセット情報の生成のみ実装。
 * 将来的には opentype.js の機能拡張や専用ライブラリで対応予定。
 */

import type { LoadedFont } from './FontManager.js';

/**
 * サブセット情報
 */
export interface SubsetInfo {
  /** 使用されているコードポイント */
  usedCodePoints: Set<number>;
  /** 使用されているグリフID */
  usedGlyphIds: Set<number>;
  /** コードポイント → グリフID のマッピング */
  codePointToGlyph: Map<number, number>;
  /** グリフ数 */
  glyphCount: number;
  /** 元のグリフ数 */
  originalGlyphCount: number;
  /** 削減率 (0-1) */
  reductionRatio: number;
}

/**
 * フォントのサブセット情報を収集
 */
export function collectSubsetInfo(font: LoadedFont): SubsetInfo {
  const otFont = font.otFont;
  const usedCodePoints = font.usedCodePoints;
  const usedGlyphIds = new Set<number>();
  const codePointToGlyph = new Map<number, number>();

  // 使用文字からグリフIDを収集
  for (const codePoint of usedCodePoints) {
    const char = String.fromCodePoint(codePoint);
    const glyph = otFont.charToGlyph(char);
    if (glyph.index > 0) {
      usedGlyphIds.add(glyph.index);
      codePointToGlyph.set(codePoint, glyph.index);
    }
  }

  // .notdef グリフ (ID 0) は常に含める
  usedGlyphIds.add(0);

  const originalGlyphCount = otFont.numGlyphs;
  const glyphCount = usedGlyphIds.size;
  const reductionRatio = 1 - (glyphCount / originalGlyphCount);

  return {
    usedCodePoints,
    usedGlyphIds,
    codePointToGlyph,
    glyphCount,
    originalGlyphCount,
    reductionRatio,
  };
}

/**
 * サブセットに必要なグリフIDのリストを取得（ソート済み）
 */
export function getSubsetGlyphIds(info: SubsetInfo): number[] {
  return Array.from(info.usedGlyphIds).sort((a, b) => a - b);
}

/**
 * 文字からグリフIDを取得
 */
export function getGlyphId(font: LoadedFont, codePoint: number): number {
  const char = String.fromCodePoint(codePoint);
  const glyph = font.otFont.charToGlyph(char);
  return glyph.index;
}

/**
 * サブセット情報をログ出力
 */
export function logSubsetInfo(info: SubsetInfo, fontName: string): void {
  console.log(`Font Subset: ${fontName}`);
  console.log(`  Used characters: ${info.usedCodePoints.size}`);
  console.log(`  Used glyphs: ${info.glyphCount} / ${info.originalGlyphCount}`);
  console.log(`  Reduction: ${(info.reductionRatio * 100).toFixed(1)}%`);
}

/**
 * CIDFontのW配列（文字幅）を最適化
 * 使用されているグリフのみの幅を含める
 */
export function buildOptimizedWidthArray(
  font: LoadedFont,
  usedCodePoints: Set<number>,
  scale: number
): Array<{ gid: number; width: number }> {
  const otFont = font.otFont;
  const widths: Array<{ gid: number; width: number }> = [];

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

  return widths;
}

/**
 * 連続するグリフIDをグループ化
 * PDF の W 配列形式に最適化
 */
export function groupConsecutiveGlyphs(
  widths: Array<{ gid: number; width: number }>
): Array<{ startGid: number; widths: number[] }> {
  const groups: Array<{ startGid: number; widths: number[] }> = [];

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

    groups.push({ startGid, widths: groupWidths });
  }

  return groups;
}

/**
 * フォントサブセット化が有効かどうかを判定
 * 使用文字が少ない場合のみサブセット化が効果的
 */
export function isSubsettingBeneficial(info: SubsetInfo): boolean {
  // 使用グリフが全体の50%未満の場合のみサブセット化が有効
  return info.reductionRatio > 0.5;
}

/**
 * 推定サブセットサイズを計算
 * 実際のサブセット化なしで、おおよそのサイズを推定
 */
export function estimateSubsetSize(
  originalSize: number,
  info: SubsetInfo
): number {
  // グリフデータは通常フォントサイズの70-80%を占める
  // サブセット化でグリフデータのみが削減される
  const glyphDataRatio = 0.75;
  const reductionRatio = info.reductionRatio;

  const estimatedReduction = originalSize * glyphDataRatio * reductionRatio;
  return Math.round(originalSize - estimatedReduction);
}
