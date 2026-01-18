/**
 * HtmlToPdf - メインの変換API
 *
 * HTML要素をPDFに変換する高レベルAPI。
 * getBoundingClientRectを使用してブラウザのレイアウト結果を
 * そのままPDFに反映することで、高精度な変換を実現。
 */

import { PDFDocument } from "../pdf/PDFDocument.js"
import { PDFPage } from "../pdf/PDFPage.js"
import { UnitConverter, PAGE_SIZES, type PageSize } from "../utils/UnitConverter.js"
import { walkDOM, type RenderNode, type ElementRenderNode, type TextRenderNode } from "../dom/DOMWalker.js"
import { renderBox, setClipRect } from "../renderers/BoxRenderer.js"
import {
    renderText,
    createTextRenderContext,
    getAllFontMappings,
    getUsedCodePointsByFont,
    addCustomFont,
    setJapaneseFallback,
    type TextRenderContext,
    type CustomFontConfig,
} from "../renderers/TextRenderer.js"
import { PDFResult } from "./PDFResult.js"
import { FontManager, type LoadedFont } from "../fonts/FontManager.js"

/**
 * フォントソース
 */
export type FontSource =
    | { type: "url"; url: string }
    | { type: "data"; data: ArrayBuffer | Uint8Array }
    | { type: "loaded"; font: LoadedFont }

/**
 * カスタムフォント設定
 */
export interface FontOption {
    /** フォント名 */
    name: string
    /** フォントソース */
    source: FontSource
    /** このフォントを使用するCSSファミリー（省略時は日本語フォールバックとして使用） */
    css_families?: string[]
}

/**
 * 変換オプション
 */
export interface ConvertOptions {
    /** ページサイズ: 'A4', 'Letter', etc. または [width, height] (mm) または 'auto' (要素サイズに合わせる) */
    format?: PageSize | [number, number] | "auto"
    /** ページの向き (format が 'auto' の場合は無視) */
    orientation?: "portrait" | "landscape"
    /** マージン (mm) */
    margin?: {
        top?: number
        right?: number
        bottom?: number
        left?: number
    }
    /** 背景色を含める */
    background?: boolean
    /** 無視する要素のセレクタ */
    ignoreSelectors?: string[]
    /** ドキュメント情報 */
    info?: {
        title?: string
        author?: string
        subject?: string
    }
    /** 進捗コールバック */
    onProgress?: (progress: number) => void
    /** カスタムフォント設定（日本語フォント等） */
    fonts?: FontOption[]
    /** 日本語フォールバックフォント名（fonts配列内のフォント名を指定） */
    japanese_fallback?: string
}

/**
 * HTML要素をPDFに変換
 */
export async function convert(
    element: Element,
    options: ConvertOptions = {}
): Promise<PDFResult> {
    const {
        format = "auto",
        orientation = "portrait",
        margin = { top: 0, right: 0, bottom: 0, left: 0 },
        background = true,
        ignoreSelectors = [],
        info,
        onProgress,
        fonts = [],
        japanese_fallback,
    } = options

    // 進捗報告
    const reportProgress = (progress: number) => {
        onProgress?.(Math.min(1, Math.max(0, progress)))
    }
    reportProgress(0)

    // 要素の位置を取得（サイズ計算のため先に取得）
    const elementRect = element.getBoundingClientRect()

    // px to pt 変換比率 (CSS: 96dpi, PDF: 72dpi)
    const pxToPtRatio = 72 / 96
    const mmToPt = 72 / 25.4

    // マージンをptに変換
    const margins = {
        top: (margin.top ?? 0) * mmToPt,
        right: (margin.right ?? 0) * mmToPt,
        bottom: (margin.bottom ?? 0) * mmToPt,
        left: (margin.left ?? 0) * mmToPt,
    }

    // ページサイズを計算
    let pageWidth: number
    let pageHeight: number

    if (format === "auto") {
        // 要素サイズに合わせる (px → pt) + マージン
        pageWidth = elementRect.width * pxToPtRatio + margins.left + margins.right
        pageHeight = elementRect.height * pxToPtRatio + margins.top + margins.bottom
    } else if (Array.isArray(format)) {
        // カスタムサイズ (mm)
        pageWidth = format[0] * mmToPt
        pageHeight = format[1] * mmToPt
    } else {
        const size = PAGE_SIZES[format]
        pageWidth = size.width
        pageHeight = size.height

        if (orientation === "landscape") {
            [pageWidth, pageHeight] = [pageHeight, pageWidth]
        }
    }

    // PDFドキュメントを作成
    const doc = new PDFDocument()
    if (info) {
        doc.setInfo(info)
    }

    reportProgress(0.1)

    // カスタムフォントを読み込み
    const fontManager = new FontManager()
    const loaded_fonts = new Map<string, LoadedFont>()

    for (const fontOption of fonts) {
        const loadedFont = await loadFont(fontManager, fontOption)
        loaded_fonts.set(fontOption.name, loadedFont)
    }

    reportProgress(0.2)

    // UnitConverterを作成
    const converter = new UnitConverter(pageHeight)
    converter.setPageOffset(
        elementRect.x - margins.left / converter.pxToPt(1),
        elementRect.y - margins.top / converter.pxToPt(1)
    )

    reportProgress(0.25)

    // DOM を走査してレンダリングノードを収集
    const renderNodes = walkDOM(element, {
        ignoreSelectors,
        includeImages: true,
    })

    reportProgress(0.3)

    // ページを追加
    const page = doc.addPage(pageWidth, pageHeight)

    // テキストレンダリングコンテキストを作成（カスタムフォント付き）
    const custom_fonts_map = new Map<string, CustomFontConfig>()
    for (const fontOption of fonts) {
        const loadedFont = loaded_fonts.get(fontOption.name)
        if (loadedFont) {
            custom_fonts_map.set(fontOption.name, {
                name: fontOption.name,
                font: loadedFont,
                css_families: fontOption.css_families,
            })
        }
    }

    const textContext = createTextRenderContext(page, converter, {
        custom_fonts: custom_fonts_map,
        japanese_fallback_font: japanese_fallback,
    })

    reportProgress(0.4)

    // ノードを描画
    renderNodes.forEach((node, index) => {
        renderNode(node, page, converter, textContext, background)
        reportProgress(0.4 + (0.5 * index) / renderNodes.length)
    })

    reportProgress(0.85)

    // フォントを登録
    const fontMappings = getAllFontMappings(textContext)
    const usedCodePointsByFont = getUsedCodePointsByFont(textContext)

    for (const mapping of fontMappings) {
        if (mapping.is_cid && mapping.loaded_font) {
            // CIDフォント（カスタムフォント）を埋め込み
            const usedCodePoints = usedCodePointsByFont.get(mapping.pdfName)
            const usedText = usedCodePoints
                ? Array.from(usedCodePoints)
                      .map((cp) => String.fromCodePoint(cp))
                      .join("")
                : ""

            doc.addCustomFont(mapping.pdfName, mapping.loaded_font, usedText)
            doc.applyFontToPage(page, mapping.pdfName)
        } else {
            // 標準フォント
            doc.addStandardFont(mapping.pdfName, mapping.baseFontName)
            doc.applyFontToPage(page, mapping.pdfName)
        }
    }

    reportProgress(0.95)

    // PDFを生成
    const pdfBytes = doc.save()

    reportProgress(1)

    return new PDFResult(pdfBytes)
}

/**
 * フォントオプションからフォントを読み込み
 */
async function loadFont(
    fontManager: FontManager,
    option: FontOption
): Promise<LoadedFont> {
    const { name, source } = option

    if (source.type === "url") {
        return fontManager.loadFromURL(source.url, name)
    } else if (source.type === "data") {
        if (source.data instanceof Uint8Array) {
            return fontManager.loadFromUint8Array(source.data, name)
        } else {
            return fontManager.loadFromArrayBuffer(source.data, name)
        }
    } else if (source.type === "loaded") {
        return source.font
    }

    throw new Error(`Unknown font source type`)
}

/**
 * レンダリングノードを描画
 */
function renderNode(
  node: RenderNode,
  page: PDFPage,
  converter: UnitConverter,
  textContext: TextRenderContext,
  includeBackground: boolean
): void {
  if (node.type === 'text') {
    // テキストノード
    renderText(node, textContext);
    return;
  }

  if (node.type === 'element') {
    // 要素ノード
    renderElementNode(node, page, converter, textContext, includeBackground);
    return;
  }

  // 画像や置換要素は後で対応
}

/**
 * 要素ノードを描画
 */
function renderElementNode(
  node: ElementRenderNode,
  page: PDFPage,
  converter: UnitConverter,
  textContext: TextRenderContext,
  includeBackground: boolean
): void {
  const { styles, children, needsClipping } = node;

  // クリッピングが必要な場合
  if (needsClipping) {
    page.saveState();
    setClipRect(
      page,
      styles.box.borderX,
      styles.box.borderY,
      styles.box.borderWidth,
      styles.box.borderHeight,
      converter
    );
  }

  // ボックス（背景と境界線）を描画
  if (includeBackground) {
    renderBox(page, styles, converter);
  }

  // 子ノードを描画
  for (const child of children) {
    renderNode(child, page, converter, textContext, includeBackground);
  }

  // クリッピングを解除
  if (needsClipping) {
    page.restoreState();
  }
}

/**
 * HtmlToPdf名前空間
 */
export const HtmlToPdf = {
  convert,
};
