/**
 * ColorParser - CSS色表現の解析
 *
 * 対応フォーマット:
 * - Hex: #RGB, #RRGGBB, #RGBA, #RRGGBBAA
 * - RGB: rgb(r, g, b), rgba(r, g, b, a)
 * - HSL: hsl(h, s%, l%), hsla(h, s%, l%, a)
 * - Named colors: red, blue, transparent, etc.
 */

export interface RGBAColor {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

/**
 * CSS Named Colors (CSS Level 4)
 */
const NAMED_COLORS: Record<string, [number, number, number]> = {
  // Basic colors
  black: [0, 0, 0],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  white: [255, 255, 255],
  maroon: [128, 0, 0],
  red: [255, 0, 0],
  purple: [128, 0, 128],
  fuchsia: [255, 0, 255],
  magenta: [255, 0, 255],
  green: [0, 128, 0],
  lime: [0, 255, 0],
  olive: [128, 128, 0],
  yellow: [255, 255, 0],
  navy: [0, 0, 128],
  blue: [0, 0, 255],
  teal: [0, 128, 128],
  aqua: [0, 255, 255],
  cyan: [0, 255, 255],
  orange: [255, 165, 0],

  // Extended colors (common ones)
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  blanchedalmond: [255, 235, 205],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgrey: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  greenyellow: [173, 255, 47],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgrey: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  oldlace: [253, 245, 230],
  olivedrab: [107, 142, 35],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  whitesmoke: [245, 245, 245],
  yellowgreen: [154, 205, 50],

  // Special
  transparent: [0, 0, 0], // alpha = 0 で処理
};

/**
 * CSS色文字列を解析してRGBAColorに変換
 *
 * @param colorStr CSS色文字列
 * @returns RGBAColor または null (解析失敗時)
 */
export function parseColor(colorStr: string): RGBAColor | null {
  if (!colorStr || colorStr === 'none') {
    return null;
  }

  const str = colorStr.trim().toLowerCase();

  // transparent
  if (str === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Named color
  const namedColor = NAMED_COLORS[str];
  if (namedColor) {
    return {
      r: namedColor[0] / 255,
      g: namedColor[1] / 255,
      b: namedColor[2] / 255,
      a: 1,
    };
  }

  // Hex format
  if (str.startsWith('#')) {
    return parseHexColor(str);
  }

  // rgb/rgba format
  if (str.startsWith('rgb')) {
    return parseRgbColor(str);
  }

  // hsl/hsla format
  if (str.startsWith('hsl')) {
    return parseHslColor(str);
  }

  return null;
}

/**
 * Hex色を解析
 * #RGB, #RRGGBB, #RGBA, #RRGGBBAA
 */
function parseHexColor(hex: string): RGBAColor | null {
  const h = hex.slice(1);

  let r: number, g: number, b: number, a: number = 1;

  if (h.length === 3) {
    // #RGB
    r = parseInt(h[0] + h[0], 16) / 255;
    g = parseInt(h[1] + h[1], 16) / 255;
    b = parseInt(h[2] + h[2], 16) / 255;
  } else if (h.length === 4) {
    // #RGBA
    r = parseInt(h[0] + h[0], 16) / 255;
    g = parseInt(h[1] + h[1], 16) / 255;
    b = parseInt(h[2] + h[2], 16) / 255;
    a = parseInt(h[3] + h[3], 16) / 255;
  } else if (h.length === 6) {
    // #RRGGBB
    r = parseInt(h.slice(0, 2), 16) / 255;
    g = parseInt(h.slice(2, 4), 16) / 255;
    b = parseInt(h.slice(4, 6), 16) / 255;
  } else if (h.length === 8) {
    // #RRGGBBAA
    r = parseInt(h.slice(0, 2), 16) / 255;
    g = parseInt(h.slice(2, 4), 16) / 255;
    b = parseInt(h.slice(4, 6), 16) / 255;
    a = parseInt(h.slice(6, 8), 16) / 255;
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
    return null;
  }

  return { r, g, b, a };
}

/**
 * RGB/RGBA色を解析
 * rgb(255, 0, 0), rgba(255, 0, 0, 0.5)
 * rgb(100%, 0%, 0%), rgba(100%, 0%, 0%, 50%)
 * 新構文: rgb(255 0 0), rgb(255 0 0 / 0.5)
 */
function parseRgbColor(str: string): RGBAColor | null {
  // 括弧内の内容を抽出
  const match = str.match(/rgba?\s*\(\s*([^)]+)\s*\)/);
  if (!match) return null;

  const content = match[1];

  // 新構文 (スペース区切り、/ でアルファ)
  if (content.includes('/')) {
    const [colorPart, alphaPart] = content.split('/').map(s => s.trim());
    const [r, g, b] = colorPart.split(/\s+/).map(parseColorValue);
    const a = parseAlphaValue(alphaPart);
    if (r === null || g === null || b === null || a === null) return null;
    return { r, g, b, a };
  }

  // カンマ区切り or スペース区切り
  const values = content.includes(',')
    ? content.split(',').map(s => s.trim())
    : content.split(/\s+/).map(s => s.trim());

  if (values.length < 3) return null;

  const r = parseColorValue(values[0]);
  const g = parseColorValue(values[1]);
  const b = parseColorValue(values[2]);
  const a = values[3] !== undefined ? parseAlphaValue(values[3]) : 1;

  if (r === null || g === null || b === null || a === null) return null;

  return { r, g, b, a };
}

/**
 * HSL/HSLA色を解析してRGBに変換
 */
function parseHslColor(str: string): RGBAColor | null {
  const match = str.match(/hsla?\s*\(\s*([^)]+)\s*\)/);
  if (!match) return null;

  const content = match[1];

  // 新構文 (スペース区切り、/ でアルファ)
  let h: number, s: number, l: number, a: number = 1;

  if (content.includes('/')) {
    const [colorPart, alphaPart] = content.split('/').map(s => s.trim());
    const parts = colorPart.split(/\s+/).map(s => s.trim());
    h = parseHueValue(parts[0]);
    s = parsePercentValue(parts[1]);
    l = parsePercentValue(parts[2]);
    a = parseAlphaValue(alphaPart);
  } else {
    const values = content.includes(',')
      ? content.split(',').map(s => s.trim())
      : content.split(/\s+/).map(s => s.trim());

    if (values.length < 3) return null;

    h = parseHueValue(values[0]);
    s = parsePercentValue(values[1]);
    l = parsePercentValue(values[2]);
    a = values[3] !== undefined ? parseAlphaValue(values[3]) : 1;
  }

  if (isNaN(h) || isNaN(s) || isNaN(l) || isNaN(a)) return null;

  // HSL to RGB
  const { r, g, b } = hslToRgb(h, s, l);

  return { r, g, b, a };
}

/**
 * 色の値を解析 (0-255 or 0%-100%)
 */
function parseColorValue(str: string): number | null {
  str = str.trim();
  if (str.endsWith('%')) {
    const percent = parseFloat(str);
    if (isNaN(percent)) return null;
    return Math.max(0, Math.min(1, percent / 100));
  }
  const value = parseFloat(str);
  if (isNaN(value)) return null;
  return Math.max(0, Math.min(1, value / 255));
}

/**
 * アルファ値を解析 (0-1 or 0%-100%)
 */
function parseAlphaValue(str: string): number | null {
  str = str.trim();
  if (str.endsWith('%')) {
    const percent = parseFloat(str);
    if (isNaN(percent)) return null;
    return Math.max(0, Math.min(1, percent / 100));
  }
  const value = parseFloat(str);
  if (isNaN(value)) return null;
  return Math.max(0, Math.min(1, value));
}

/**
 * Hue値を解析 (deg, turn, rad, grad)
 */
function parseHueValue(str: string): number {
  str = str.trim().toLowerCase();

  if (str.endsWith('turn')) {
    return parseFloat(str) * 360;
  }
  if (str.endsWith('rad')) {
    return parseFloat(str) * (180 / Math.PI);
  }
  if (str.endsWith('grad')) {
    return parseFloat(str) * 0.9;
  }
  // deg または数値
  return parseFloat(str.replace('deg', ''));
}

/**
 * パーセント値を解析
 */
function parsePercentValue(str: string): number {
  str = str.trim();
  if (str.endsWith('%')) {
    return parseFloat(str) / 100;
  }
  return parseFloat(str);
}

/**
 * HSL to RGB 変換
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360; // 正規化
  h /= 360;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r, g, b };
}

/**
 * RGBAColorをCSS文字列に変換
 */
export function colorToString(color: RGBAColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);

  if (color.a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${color.a})`;
}

/**
 * 色が透明かどうか判定
 */
export function isTransparent(color: RGBAColor | null): boolean {
  return color === null || color.a === 0;
}

/**
 * 色が有効（描画すべき）かどうか判定
 */
export function isValidColor(color: RGBAColor | null): color is RGBAColor {
  return color !== null && color.a > 0;
}

/**
 * グラデーションのカラーストップ
 */
export interface GradientColorStop {
  color: RGBAColor;
  position: number; // 0-1
}

/**
 * 線形グラデーション情報
 */
export interface LinearGradient {
  type: 'linear';
  angle: number; // degrees (0 = to top, 90 = to right)
  colorStops: GradientColorStop[];
}

/**
 * 放射状グラデーション情報
 */
export interface RadialGradient {
  type: 'radial';
  colorStops: GradientColorStop[];
}

export type ParsedGradient = LinearGradient | RadialGradient;

/**
 * CSS linear-gradient を解析
 *
 * 対応フォーマット:
 * - linear-gradient(#f00, #00f)
 * - linear-gradient(to right, #f00, #00f)
 * - linear-gradient(45deg, #f00, #00f)
 * - linear-gradient(135deg, #667eea 0%, #764ba2 100%)
 */
export function parseGradient(gradientStr: string): ParsedGradient | null {
  if (!gradientStr) return null;

  const str = gradientStr.trim();

  // linear-gradient
  if (str.startsWith('linear-gradient(')) {
    return parseLinearGradient(str);
  }

  // radial-gradient (基本対応)
  if (str.startsWith('radial-gradient(')) {
    return parseRadialGradient(str);
  }

  return null;
}

/**
 * linear-gradient を解析
 */
function parseLinearGradient(str: string): LinearGradient | null {
  // 括弧内の内容を抽出
  const match = str.match(/linear-gradient\s*\(\s*(.+)\s*\)/i);
  if (!match) return null;

  const content = match[1];

  // カラーストップを分割（カッコ内のカンマは無視）
  const parts = splitGradientParts(content);
  if (parts.length < 2) return null;

  let angle = 180; // デフォルト: to bottom
  let colorStartIndex = 0;

  // 最初の部分が方向指定かどうか確認
  const firstPart = parts[0].trim();

  if (firstPart.startsWith('to ')) {
    // to right, to left, to top, to bottom, etc.
    angle = parseDirectionToAngle(firstPart);
    colorStartIndex = 1;
  } else if (/^-?\d+(\.\d+)?(deg|grad|rad|turn)?$/i.test(firstPart)) {
    // 角度指定
    angle = parseAngleValue(firstPart);
    colorStartIndex = 1;
  }

  // カラーストップを解析
  const colorStops: GradientColorStop[] = [];
  const colorParts = parts.slice(colorStartIndex);

  for (let i = 0; i < colorParts.length; i++) {
    const stop = parseColorStop(colorParts[i], i, colorParts.length);
    if (stop) {
      colorStops.push(stop);
    }
  }

  if (colorStops.length < 2) return null;

  return {
    type: 'linear',
    angle,
    colorStops,
  };
}

/**
 * radial-gradient を解析（基本的な対応）
 */
function parseRadialGradient(str: string): RadialGradient | null {
  const match = str.match(/radial-gradient\s*\(\s*(.+)\s*\)/i);
  if (!match) return null;

  const content = match[1];
  const parts = splitGradientParts(content);

  // シンプルなカラーストップのみ対応
  const colorStops: GradientColorStop[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    // circle, ellipse, at などの形状指定はスキップ
    if (part.startsWith('circle') || part.startsWith('ellipse') ||
        part.startsWith('at ') || part.includes(' at ')) {
      continue;
    }

    const stop = parseColorStop(part, colorStops.length, parts.length);
    if (stop) {
      colorStops.push(stop);
    }
  }

  if (colorStops.length < 2) return null;

  return {
    type: 'radial',
    colorStops,
  };
}

/**
 * グラデーション引数をカンマで分割（括弧内のカンマは無視）
 */
function splitGradientParts(content: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of content) {
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * 方向キーワードを角度に変換
 */
function parseDirectionToAngle(direction: string): number {
  const dir = direction.toLowerCase().replace('to ', '').trim();

  switch (dir) {
    case 'top': return 0;
    case 'right': return 90;
    case 'bottom': return 180;
    case 'left': return 270;
    case 'top right': case 'right top': return 45;
    case 'bottom right': case 'right bottom': return 135;
    case 'bottom left': case 'left bottom': return 225;
    case 'top left': case 'left top': return 315;
    default: return 180;
  }
}

/**
 * 角度値を解析
 */
function parseAngleValue(str: string): number {
  str = str.trim().toLowerCase();

  if (str.endsWith('turn')) {
    return parseFloat(str) * 360;
  }
  if (str.endsWith('rad')) {
    return parseFloat(str) * (180 / Math.PI);
  }
  if (str.endsWith('grad')) {
    return parseFloat(str) * 0.9;
  }
  // deg または数値
  return parseFloat(str.replace('deg', ''));
}

/**
 * カラーストップを解析
 */
function parseColorStop(
  str: string,
  index: number,
  total: number
): GradientColorStop | null {
  str = str.trim();

  // 色とポジションを分離
  // 例: "#667eea 0%", "rgb(255, 0, 0) 50%", "#00f"
  const parts = str.split(/\s+(?=\d)/);

  let colorStr = str;
  let position: number | null = null;

  if (parts.length >= 2) {
    // 最後の部分がパーセンテージか確認
    const lastPart = parts[parts.length - 1];
    if (lastPart.endsWith('%')) {
      position = parseFloat(lastPart) / 100;
      colorStr = parts.slice(0, -1).join(' ');
    } else if (/^\d+(\.\d+)?$/.test(lastPart)) {
      // 数値のみ（0-1の範囲と仮定）
      position = parseFloat(lastPart);
      colorStr = parts.slice(0, -1).join(' ');
    }
  }

  const color = parseColor(colorStr);
  if (!color) return null;

  // ポジションが指定されていない場合は均等に配置
  if (position === null) {
    position = total <= 1 ? 0 : index / (total - 1);
  }

  return {
    color,
    position: Math.max(0, Math.min(1, position)),
  };
}

/**
 * グラデーションの最初の色を取得（フォールバック用）
 */
export function getGradientFirstColor(gradient: ParsedGradient | null): RGBAColor | null {
  if (!gradient || gradient.colorStops.length === 0) return null;
  return gradient.colorStops[0].color;
}
