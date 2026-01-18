/**
 * TextRenderer - テキストの描画
 *
 * DOM上のテキストノードをPDFに描画する。
 * - フォント選択（標準フォント/埋め込みフォント）
 * - 位置計算（ベースライン調整）
 * - 行分割
 * - 日本語フォントフォールバック
 */

import type { PDFPage } from "../pdf/PDFPage.js"
import type { UnitConverter } from "../utils/UnitConverter.js"
import type { TextRenderNode } from "../dom/DOMWalker.js"
import type { RGBAColor } from "../utils/ColorParser.js"
import type { LoadedFont } from "../fonts/FontManager.js"
import { mapCSSFontToStandard, getFontType, measureTextWidth } from "../fonts/StandardFonts.js"
import { containsJapanese, segmentText, collectCodePoints } from "../utils/JapaneseDetector.js"

/**
 * フォントマッピング情報
 */
export interface FontMapping {
    /** PDFフォント名（F1, F2, ...） */
    pdfName: string
    /** 標準フォント名またはカスタムフォント名 */
    baseFontName: string
    /** CSSフォントファミリー */
    cssFamily: string
    /** フォントウェイト */
    weight: number
    /** フォントスタイル */
    style: "normal" | "italic" | "oblique"
    /** CIDフォント（カスタムフォント）かどうか */
    is_cid?: boolean
    /** 元のLoadedFont（CIDフォントの場合） */
    loaded_font?: LoadedFont
}

/**
 * カスタムフォント設定
 */
export interface CustomFontConfig {
    /** フォント名 */
    name: string
    /** LoadedFont */
    font: LoadedFont
    /** このフォントを使用するCSSファミリー（省略時は全てにフォールバック） */
    css_families?: string[]
}

/**
 * テキストレンダリングコンテキスト
 */
export interface TextRenderContext {
    page: PDFPage
    converter: UnitConverter
    fontMappings: Map<string, FontMapping>
    nextFontId: number
    /** カスタムフォント（日本語等） */
    custom_fonts: Map<string, CustomFontConfig>
    /** 日本語フォールバックフォント名 */
    japanese_fallback_font?: string
    /** 使用されたテキスト（フォント埋め込み用） */
    used_text_by_font: Map<string, Set<number>>
}

/**
 * テキストノードを描画
 */
export function renderText(
    node: TextRenderNode,
    context: TextRenderContext
): void {
    const { page, converter } = context
    const { textContent, x, y, width, font, color } = node

    if (!textContent.trim()) {
        return
    }

    // 日本語フォールバックが設定されていて、テキストに日本語が含まれる場合
    if (context.japanese_fallback_font && containsJapanese(textContent)) {
        renderTextWithJapaneseFallback(node, context)
        return
    }

    // フォントマッピングを取得または作成
    const fontMapping = getOrCreateFontMapping(font, context)

    // PDF座標に変換
    // テキストのベースラインを計算
    // CSSのyは要素の上端、PDFではベースラインからの位置
    const baselineOffset = calculateBaselineOffset(font)
    const pdfX = converter.convertX(x)
    const pdfY = converter.convertY(y + baselineOffset, 0)
    const pdfFontSize = converter.convertFontSize(font.size)

    // letter-spacingをpt単位に変換
    const letterSpacingPt = font.letterSpacing ? converter.pxToPt(font.letterSpacing) : undefined

    // CIDフォントの場合は16進数エンコードが必要
    if (fontMapping.is_cid && fontMapping.loaded_font) {
        // 使用文字を記録
        markUsedCodePoints(context, fontMapping.pdfName, textContent)

        page.drawTextCID(
            textToHex(fontMapping.loaded_font, textContent),
            pdfX,
            pdfY,
            {
                font: fontMapping.pdfName,
                fontSize: pdfFontSize,
                color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
                letterSpacing: letterSpacingPt,
            }
        )
        return
    }

    // フォントタイプを判定
    const fontType = getFontType(font.family)

    // monospaceフォントの場合のみ文字間隔調整を適用
    // （ブラウザのmonospaceフォントとPDFのCourierで文字幅が異なるため）
    if (fontType === "monospace") {
        const pdfWidth = measureTextWidth(textContent, pdfFontSize, fontType)
        const targetWidth = converter.pxToPt(width)

        page.drawText(textContent, pdfX, pdfY, {
            font: fontMapping.pdfName,
            fontSize: pdfFontSize,
            color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
            targetWidth,
            pdfWidth,
            letterSpacing: letterSpacingPt,
        })
    } else {
        // serif/sans-serifは調整なしで描画
        page.drawText(textContent, pdfX, pdfY, {
            font: fontMapping.pdfName,
            fontSize: pdfFontSize,
            color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
            letterSpacing: letterSpacingPt,
        })
    }
}

/**
 * 日本語フォールバックを使用してテキストを描画
 *
 * 日本語が含まれるテキストは全体を日本語フォントで描画する
 * （日本語フォントは英数字も含むため、混合テキストも正しく表示される）
 * PDFフォントのメトリクスに基づいてテキストを再折り返しする
 */
function renderTextWithJapaneseFallback(
    node: TextRenderNode,
    context: TextRenderContext
): void {
    const { page, converter } = context
    const { textContent, x, y, font, color, maxWidth, containerX } = node
    const japanese_fallback_name = context.japanese_fallback_font!

    // 日本語フォールバックフォントを取得
    const fallbackMapping = getOrCreateJapaneseFallbackMapping(
        japanese_fallback_name,
        context
    )

    if (!fallbackMapping.is_cid || !fallbackMapping.loaded_font) {
        return
    }

    const loadedFont = fallbackMapping.loaded_font
    const pdfFontSize = converter.convertFontSize(font.size)
    const baselineOffset = calculateBaselineOffset(font)

    // letter-spacingをpt単位に変換
    const letterSpacingPt = font.letterSpacing ? converter.pxToPt(font.letterSpacing) : undefined

    // 利用可能な幅をPDFポイントに変換
    // テキストの開始位置からコンテナ右端までの幅を計算
    const availableWidthPx = maxWidth - (x - containerX)
    const availableWidthPt = converter.pxToPt(availableWidthPx)

    // テキストをPDFフォントメトリクスに基づいて折り返し
    const lines = wrapTextByFontMetrics(loadedFont, textContent, pdfFontSize, availableWidthPt)

    // 各行を描画
    const lineHeightPt = converter.pxToPt(font.lineHeight)
    let currentY = y

    for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i]
        const pdfX = i === 0
            ? converter.convertX(x)  // 最初の行は元のX位置
            : converter.convertX(containerX)  // 折り返し行はコンテナ左端
        const pdfY = converter.convertY(currentY + baselineOffset, 0)

        // 使用文字を記録
        markUsedCodePoints(context, fallbackMapping.pdfName, lineText)

        page.drawTextCID(
            textToHex(loadedFont, lineText),
            pdfX,
            pdfY,
            {
                font: fallbackMapping.pdfName,
                fontSize: pdfFontSize,
                color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
                letterSpacing: letterSpacingPt,
            }
        )

        currentY += font.lineHeight
    }
}

/**
 * PDFフォントメトリクスに基づいてテキストを折り返し
 */
function wrapTextByFontMetrics(
    font: LoadedFont,
    text: string,
    fontSize: number,
    maxWidthPt: number
): string[] {
    const lines: string[] = []
    let currentLine = ""
    let currentWidth = 0

    const otFont = font.otFont
    const scale = fontSize / otFont.unitsPerEm

    for (const char of text) {
        const glyph = otFont.charToGlyph(char)
        const charWidth = (glyph.advanceWidth ?? 0) * scale

        if (currentWidth + charWidth > maxWidthPt && currentLine.length > 0) {
            // 現在の行を確定し、新しい行を開始
            lines.push(currentLine)
            currentLine = char
            currentWidth = charWidth
        } else {
            currentLine += char
            currentWidth += charWidth
        }
    }

    // 最後の行を追加
    if (currentLine.length > 0) {
        lines.push(currentLine)
    }

    return lines
}

/**
 * CIDフォントでのテキスト幅を計測（px単位）
 */
function measureCIDTextWidth(
    font: LoadedFont,
    text: string,
    fontSize: number
): number {
    const otFont = font.otFont
    const scale = fontSize / otFont.unitsPerEm
    let width = 0

    for (const char of text) {
        const glyph = otFont.charToGlyph(char)
        width += glyph.advanceWidth ?? 0
    }

    return width * scale
}

/**
 * テキストを16進数文字列に変換（CIDフォント用）
 */
function textToHex(font: LoadedFont, text: string): string {
    const otFont = font.otFont
    let hex = ""

    for (const char of text) {
        const glyph = otFont.charToGlyph(char)
        const gid = glyph.index
        hex += gid.toString(16).padStart(4, "0").toUpperCase()
    }

    return hex
}

/**
 * 使用されたコードポイントを記録
 */
function markUsedCodePoints(
    context: TextRenderContext,
    fontName: string,
    text: string
): void {
    let used_set = context.used_text_by_font.get(fontName)
    if (!used_set) {
        used_set = new Set<number>()
        context.used_text_by_font.set(fontName, used_set)
    }

    for (const char of text) {
        const cp = char.codePointAt(0)
        if (cp !== undefined) {
            used_set.add(cp)
        }
    }
}

/**
 * 日本語フォールバックマッピングを取得または作成
 */
function getOrCreateJapaneseFallbackMapping(
    fallback_font_name: string,
    context: TextRenderContext
): FontMapping {
    const fontKey = `__japanese_fallback__${fallback_font_name}`

    let mapping = context.fontMappings.get(fontKey)
    if (mapping) {
        return mapping
    }

    // カスタムフォントから取得
    const customFont = context.custom_fonts.get(fallback_font_name)
    if (!customFont) {
        throw new Error(`Japanese fallback font not found: ${fallback_font_name}`)
    }

    const pdfName = `F${context.nextFontId++}`

    mapping = {
        pdfName,
        baseFontName: customFont.font.postScriptName,
        cssFamily: customFont.font.family,
        weight: customFont.font.weight,
        style: customFont.font.style,
        is_cid: true,
        loaded_font: customFont.font,
    }

    context.fontMappings.set(fontKey, mapping)
    return mapping
}

/**
 * 複数行テキストを描画
 */
export function renderMultilineText(
    lines: Array<{ text: string; x: number; y: number }>,
    font: TextRenderNode["font"],
    color: RGBAColor | null,
    context: TextRenderContext
): void {
    const { page, converter } = context

    if (lines.length === 0) {
        return
    }

    const fontMapping = getOrCreateFontMapping(font, context)
    const pdfFontSize = converter.convertFontSize(font.size)
    const baselineOffset = calculateBaselineOffset(font)

    // letter-spacingをpt単位に変換
    const letterSpacingPt = font.letterSpacing ? converter.pxToPt(font.letterSpacing) : undefined

    for (const line of lines) {
        if (!line.text.trim()) continue

        const pdfX = converter.convertX(line.x)
        const pdfY = converter.convertY(line.y + baselineOffset, 0)

        // CIDフォントの場合は16進数エンコード
        if (fontMapping.is_cid && fontMapping.loaded_font) {
            markUsedCodePoints(context, fontMapping.pdfName, line.text)

            page.drawTextCID(
                textToHex(fontMapping.loaded_font, line.text),
                pdfX,
                pdfY,
                {
                    font: fontMapping.pdfName,
                    fontSize: pdfFontSize,
                    color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
                    letterSpacing: letterSpacingPt,
                }
            )
        } else {
            page.drawText(line.text, pdfX, pdfY, {
                font: fontMapping.pdfName,
                fontSize: pdfFontSize,
                color: color ? { r: color.r, g: color.g, b: color.b } : undefined,
                letterSpacing: letterSpacingPt,
            })
        }
    }
}

/**
 * フォントマッピングを取得または作成
 */
function getOrCreateFontMapping(
    font: TextRenderNode["font"],
    context: TextRenderContext
): FontMapping {
    // フォントキーを生成（ファミリー + ウェイト + スタイル）
    const fontKey = `${font.family}|${font.weight}|${font.style}`

    let mapping = context.fontMappings.get(fontKey)
    if (mapping) {
        return mapping
    }

    // カスタムフォントが登録されているか確認
    const customFont = findCustomFont(font, context)
    if (customFont) {
        const pdfName = `F${context.nextFontId++}`

        mapping = {
            pdfName,
            baseFontName: customFont.font.postScriptName,
            cssFamily: font.family,
            weight: font.weight,
            style: font.style,
            is_cid: true,
            loaded_font: customFont.font,
        }

        context.fontMappings.set(fontKey, mapping)
        return mapping
    }

    // 標準フォントにマッピング
    const baseFontName = mapCSSFontToStandard(font.family, font.weight, font.style)
    const pdfName = `F${context.nextFontId++}`

    mapping = {
        pdfName,
        baseFontName,
        cssFamily: font.family,
        weight: font.weight,
        style: font.style,
    }

    context.fontMappings.set(fontKey, mapping)
    return mapping
}

/**
 * CSSフォント設定に合致するカスタムフォントを検索
 */
function findCustomFont(
    font: TextRenderNode["font"],
    context: TextRenderContext
): CustomFontConfig | undefined {
    for (const [_, customFont] of context.custom_fonts) {
        // ファミリー指定がある場合はマッチするか確認
        if (customFont.css_families && customFont.css_families.length > 0) {
            const fontFamilyLower = font.family.toLowerCase()
            const matches = customFont.css_families.some(
                (f) => fontFamilyLower.includes(f.toLowerCase())
            )
            if (matches) {
                return customFont
            }
        }
    }
    return undefined
}

/**
 * ベースラインオフセットを計算
 *
 * CSSではテキスト位置は要素の上端基準だが、
 * PDFではベースライン基準。
 * line-heightが1より大きい場合、テキストはライン内で垂直中央揃えされる。
 */
function calculateBaselineOffset(font: TextRenderNode['font']): number {
  const { size: fontSize, lineHeight } = font;

  // line-heightによる余白を計算
  // テキストはライン内で垂直中央に配置される
  const extraSpace = lineHeight - fontSize;
  const topPadding = extraSpace / 2;

  // ベースラインはフォントの上端から約80%の位置
  // (正確にはascender ratioだが、標準フォントでは0.8で近似)
  const ascenderRatio = 0.8;

  return topPadding + fontSize * ascenderRatio;
}

/**
 * テキスト装飾を描画（下線、取り消し線など）
 */
export function renderTextDecoration(
  node: TextRenderNode,
  context: TextRenderContext,
  decoration: string
): void {
  if (decoration === 'none' || !node.color) {
    return;
  }

  const { page, converter } = context;
  const { x, y, width, font, color } = node;

  const lineWidth = Math.max(1, font.size / 12); // 線の太さ
  const baselineOffset = calculateBaselineOffset(font);

  // 下線
  if (decoration.includes('underline')) {
    const underlineY = y + baselineOffset + font.size * 0.1;
    page.drawLine(
      converter.convertX(x),
      converter.convertY(underlineY, 0),
      converter.convertX(x + width),
      converter.convertY(underlineY, 0),
      { color, width: converter.pxToPt(lineWidth) }
    );
  }

  // 取り消し線
  if (decoration.includes('line-through')) {
    const strikeY = y + font.size * 0.5;
    page.drawLine(
      converter.convertX(x),
      converter.convertY(strikeY, 0),
      converter.convertX(x + width),
      converter.convertY(strikeY, 0),
      { color, width: converter.pxToPt(lineWidth) }
    );
  }

  // 上線
  if (decoration.includes('overline')) {
    const overlineY = y + font.size * 0.1;
    page.drawLine(
      converter.convertX(x),
      converter.convertY(overlineY, 0),
      converter.convertX(x + width),
      converter.convertY(overlineY, 0),
      { color, width: converter.pxToPt(lineWidth) }
    );
  }
}

/**
 * すべてのフォントマッピングを取得
 */
export function getAllFontMappings(context: TextRenderContext): FontMapping[] {
    return Array.from(context.fontMappings.values())
}

/**
 * フォント別の使用コードポイントを取得
 */
export function getUsedCodePointsByFont(
    context: TextRenderContext
): Map<string, Set<number>> {
    return context.used_text_by_font
}

/**
 * テキストレンダリングコンテキストを作成
 */
export function createTextRenderContext(
    page: PDFPage,
    converter: UnitConverter,
    options?: {
        custom_fonts?: Map<string, CustomFontConfig>
        japanese_fallback_font?: string
    }
): TextRenderContext {
    return {
        page,
        converter,
        fontMappings: new Map(),
        nextFontId: 1,
        custom_fonts: options?.custom_fonts ?? new Map(),
        japanese_fallback_font: options?.japanese_fallback_font,
        used_text_by_font: new Map(),
    }
}

/**
 * カスタムフォントをコンテキストに追加
 */
export function addCustomFont(
    context: TextRenderContext,
    name: string,
    font: LoadedFont,
    css_families?: string[]
): void {
    context.custom_fonts.set(name, {
        name,
        font,
        css_families,
    })
}

/**
 * 日本語フォールバックを設定
 */
export function setJapaneseFallback(
    context: TextRenderContext,
    font_name: string
): void {
    context.japanese_fallback_font = font_name
}
