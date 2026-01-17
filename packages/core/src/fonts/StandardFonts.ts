/**
 * StandardFonts - PDF標準フォント（serif/sans-serif/monospace）
 *
 * これらのフォントはすべてのPDFビューワーに組み込まれているため、
 * 埋め込み不要で使用できる。
 *
 * HTMLのfont-family設定を読み取り、適切なフォントにマッピングする。
 */

export const StandardFonts = {
  // Times ファミリー (serif)
  TimesRoman: "Times-Roman",
  TimesBold: "Times-Bold",
  TimesItalic: "Times-Italic",
  TimesBoldItalic: "Times-BoldItalic",

  // Helvetica ファミリー (sans-serif)
  Helvetica: "Helvetica",
  HelveticaBold: "Helvetica-Bold",
  HelveticaOblique: "Helvetica-Oblique",
  HelveticaBoldOblique: "Helvetica-BoldOblique",

  // Courier ファミリー (monospace)
  Courier: "Courier",
  CourierBold: "Courier-Bold",
  CourierOblique: "Courier-Oblique",
  CourierBoldOblique: "Courier-BoldOblique",
} as const;

export type StandardFontName = typeof StandardFonts[keyof typeof StandardFonts];

/**
 * CSSフォントファミリーから最適な標準フォントを選択
 *
 * HTMLのfont-family設定を読み取り、以下のようにマッピング:
 * - serif, times, georgia 等 → Times ファミリー
 * - monospace, courier, consolas 等 → Courier ファミリー
 * - それ以外（sans-serif, arial 等） → Helvetica ファミリー
 */
export function mapCSSFontToStandard(
  fontFamily: string,
  fontWeight: number | string,
  fontStyle: string
): StandardFontName {
  const family = fontFamily.toLowerCase()
  const isBold = fontWeight === "bold" || Number(fontWeight) >= 700
  const isItalic = fontStyle === "italic" || fontStyle === "oblique"

  // monospace系の判定
  const isMonospace =
    family.includes("monospace") ||
    family.includes("courier") ||
    family.includes("consolas") ||
    family.includes("monaco") ||
    family.includes("menlo") ||
    family.includes("source code") ||
    family.includes("fira code") ||
    family.includes("jetbrains")

  if (isMonospace) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique
    if (isBold) return StandardFonts.CourierBold
    if (isItalic) return StandardFonts.CourierOblique
    return StandardFonts.Courier
  }

  // serif系の判定
  // "sans-serif"が含まれる場合は除外（"serif"だけにマッチしないように）
  const isSerif = !family.includes("sans-serif") && (
    family.includes("serif") ||
    family.includes("times") ||
    family.includes("georgia") ||
    family.includes("palatino") ||
    family.includes("cambria") ||
    family.includes("book")
  )

  if (isSerif) {
    if (isBold && isItalic) return StandardFonts.TimesBoldItalic
    if (isBold) return StandardFonts.TimesBold
    if (isItalic) return StandardFonts.TimesItalic
    return StandardFonts.TimesRoman
  }

  // sans-serif (デフォルト)
  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique
  if (isBold) return StandardFonts.HelveticaBold
  if (isItalic) return StandardFonts.HelveticaOblique
  return StandardFonts.Helvetica
}

/**
 * 標準フォントの文字幅テーブル (単位: 1000分の1 em)
 * Helvetica の文字幅
 */
export const HelveticaWidths: Record<number, number> = {
  32: 278,   // space
  33: 278,   // !
  34: 355,   // "
  35: 556,   // #
  36: 556,   // $
  37: 889,   // %
  38: 667,   // &
  39: 191,   // '
  40: 333,   // (
  41: 333,   // )
  42: 389,   // *
  43: 584,   // +
  44: 278,   // ,
  45: 333,   // -
  46: 278,   // .
  47: 278,   // /
  48: 556,   // 0
  49: 556,   // 1
  50: 556,   // 2
  51: 556,   // 3
  52: 556,   // 4
  53: 556,   // 5
  54: 556,   // 6
  55: 556,   // 7
  56: 556,   // 8
  57: 556,   // 9
  58: 278,   // :
  59: 278,   // ;
  60: 584,   // <
  61: 584,   // =
  62: 584,   // >
  63: 556,   // ?
  64: 1015,  // @
  65: 667,   // A
  66: 667,   // B
  67: 722,   // C
  68: 722,   // D
  69: 667,   // E
  70: 611,   // F
  71: 778,   // G
  72: 722,   // H
  73: 278,   // I
  74: 500,   // J
  75: 667,   // K
  76: 556,   // L
  77: 833,   // M
  78: 722,   // N
  79: 778,   // O
  80: 667,   // P
  81: 778,   // Q
  82: 722,   // R
  83: 667,   // S
  84: 611,   // T
  85: 722,   // U
  86: 667,   // V
  87: 944,   // W
  88: 667,   // X
  89: 667,   // Y
  90: 611,   // Z
  91: 278,   // [
  92: 278,   // \
  93: 278,   // ]
  94: 469,   // ^
  95: 556,   // _
  96: 333,   // `
  97: 556,   // a
  98: 556,   // b
  99: 500,   // c
  100: 556,  // d
  101: 556,  // e
  102: 278,  // f
  103: 556,  // g
  104: 556,  // h
  105: 222,  // i
  106: 222,  // j
  107: 500,  // k
  108: 222,  // l
  109: 833,  // m
  110: 556,  // n
  111: 556,  // o
  112: 556,  // p
  113: 556,  // q
  114: 333,  // r
  115: 500,  // s
  116: 278,  // t
  117: 556,  // u
  118: 500,  // v
  119: 722,  // w
  120: 500,  // x
  121: 500,  // y
  122: 500,  // z
  123: 334,  // {
  124: 260,  // |
  125: 334,  // }
  126: 584,  // ~
};

/**
 * Times-Roman の文字幅 (単位: 1000分の1 em)
 */
export const TimesRomanWidths: Record<number, number> = {
  32: 250,   // space
  33: 333,   // !
  34: 408,   // "
  35: 500,   // #
  36: 500,   // $
  37: 833,   // %
  38: 778,   // &
  39: 180,   // '
  40: 333,   // (
  41: 333,   // )
  42: 500,   // *
  43: 564,   // +
  44: 250,   // ,
  45: 333,   // -
  46: 250,   // .
  47: 278,   // /
  48: 500,   // 0
  49: 500,   // 1
  50: 500,   // 2
  51: 500,   // 3
  52: 500,   // 4
  53: 500,   // 5
  54: 500,   // 6
  55: 500,   // 7
  56: 500,   // 8
  57: 500,   // 9
  58: 278,   // :
  59: 278,   // ;
  60: 564,   // <
  61: 564,   // =
  62: 564,   // >
  63: 444,   // ?
  64: 921,   // @
  65: 722,   // A
  66: 667,   // B
  67: 667,   // C
  68: 722,   // D
  69: 611,   // E
  70: 556,   // F
  71: 722,   // G
  72: 722,   // H
  73: 333,   // I
  74: 389,   // J
  75: 722,   // K
  76: 611,   // L
  77: 889,   // M
  78: 722,   // N
  79: 722,   // O
  80: 556,   // P
  81: 722,   // Q
  82: 667,   // R
  83: 556,   // S
  84: 611,   // T
  85: 722,   // U
  86: 722,   // V
  87: 944,   // W
  88: 722,   // X
  89: 722,   // Y
  90: 611,   // Z
  91: 333,   // [
  92: 278,   // \
  93: 333,   // ]
  94: 469,   // ^
  95: 500,   // _
  96: 333,   // `
  97: 444,   // a
  98: 500,   // b
  99: 444,   // c
  100: 500,  // d
  101: 444,  // e
  102: 333,  // f
  103: 500,  // g
  104: 500,  // h
  105: 278,  // i
  106: 278,  // j
  107: 500,  // k
  108: 278,  // l
  109: 778,  // m
  110: 500,  // n
  111: 500,  // o
  112: 500,  // p
  113: 500,  // q
  114: 333,  // r
  115: 389,  // s
  116: 278,  // t
  117: 500,  // u
  118: 500,  // v
  119: 722,  // w
  120: 500,  // x
  121: 500,  // y
  122: 444,  // z
  123: 480,  // {
  124: 200,  // |
  125: 480,  // }
  126: 541,  // ~
}

/**
 * Courier の文字幅 (単位: 1000分の1 em)
 * 等幅フォントなので全文字同じ幅
 */
export const CourierWidths: Record<number, number> = (() => {
  const widths: Record<number, number> = {}
  // ASCII範囲の全文字を600に設定
  for (let i = 32; i <= 126; i++) {
    widths[i] = 600
  }
  return widths
})()

/**
 * フォントタイプ
 */
export type FontType = "serif" | "sans-serif" | "monospace"

/**
 * フォントタイプを判定
 */
export function getFontType(fontFamily: string): FontType {
  const family = fontFamily.toLowerCase()

  // monospace系の判定
  const isMonospace =
    family.includes("monospace") ||
    family.includes("courier") ||
    family.includes("consolas") ||
    family.includes("monaco") ||
    family.includes("menlo") ||
    family.includes("source code") ||
    family.includes("fira code") ||
    family.includes("jetbrains")

  if (isMonospace) return "monospace"

  // serif系の判定
  const isSerif = !family.includes("sans-serif") && (
    family.includes("serif") ||
    family.includes("times") ||
    family.includes("georgia") ||
    family.includes("palatino") ||
    family.includes("cambria") ||
    family.includes("book")
  )

  return isSerif ? "serif" : "sans-serif"
}

/**
 * フォントタイプに応じた幅テーブルを取得
 */
export function getFontWidths(fontType: FontType): Record<number, number> {
  switch (fontType) {
    case "serif":
      return TimesRomanWidths
    case "monospace":
      return CourierWidths
    default:
      return HelveticaWidths
  }
}

/**
 * テキスト幅を計算 (標準フォント用)
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontType: FontType = "sans-serif"
): number {
  const widths = getFontWidths(fontType)
  const defaultWidth = fontType === "monospace" ? 600 : fontType === "serif" ? 500 : 556
  let width = 0
  for (const char of text) {
    const code = char.charCodeAt(0)
    const charWidth = widths[code] ?? defaultWidth
    width += charWidth
  }
  // 1000分の1 em → pt に変換
  return (width / 1000) * fontSize
}
