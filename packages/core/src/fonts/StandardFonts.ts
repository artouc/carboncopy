/**
 * StandardFonts - PDF標準14フォント
 *
 * これらのフォントはすべてのPDFビューワーに組み込まれているため、
 * 埋め込み不要で使用できる。
 */

export const StandardFonts = {
  // Times ファミリー
  TimesRoman: 'Times-Roman',
  TimesBold: 'Times-Bold',
  TimesItalic: 'Times-Italic',
  TimesBoldItalic: 'Times-BoldItalic',

  // Helvetica ファミリー (sans-serif)
  Helvetica: 'Helvetica',
  HelveticaBold: 'Helvetica-Bold',
  HelveticaOblique: 'Helvetica-Oblique',
  HelveticaBoldOblique: 'Helvetica-BoldOblique',

  // Courier ファミリー (monospace)
  Courier: 'Courier',
  CourierBold: 'Courier-Bold',
  CourierOblique: 'Courier-Oblique',
  CourierBoldOblique: 'Courier-BoldOblique',

  // Symbol フォント
  Symbol: 'Symbol',
  ZapfDingbats: 'ZapfDingbats',
} as const;

export type StandardFontName = typeof StandardFonts[keyof typeof StandardFonts];

/**
 * CSSフォントファミリーから最適な標準フォントを選択
 */
export function mapCSSFontToStandard(
  fontFamily: string,
  fontWeight: number | string,
  fontStyle: string
): StandardFontName {
  const family = fontFamily.toLowerCase();
  const isBold = fontWeight === 'bold' || Number(fontWeight) >= 700;
  const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';

  // serif系
  if (family.includes('times') || family.includes('serif') || family.includes('georgia')) {
    if (isBold && isItalic) return StandardFonts.TimesBoldItalic;
    if (isBold) return StandardFonts.TimesBold;
    if (isItalic) return StandardFonts.TimesItalic;
    return StandardFonts.TimesRoman;
  }

  // monospace系
  if (family.includes('courier') || family.includes('mono') || family.includes('consolas')) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  // sans-serif系 (デフォルト)
  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
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
 * テキスト幅を計算 (標準フォント用)
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  widths: Record<number, number> = HelveticaWidths
): number {
  let width = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    const charWidth = widths[code] ?? 556; // デフォルト幅
    width += charWidth;
  }
  // 1000分の1 em → pt に変換
  return (width / 1000) * fontSize;
}
