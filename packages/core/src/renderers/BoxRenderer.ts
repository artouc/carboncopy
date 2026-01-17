/**
 * BoxRenderer - ボックス（背景・境界線）の描画
 *
 * DOM要素のボックスモデルをPDFに描画する。
 * - 背景色
 * - 境界線（solid, dashed, dotted 等）
 * - 角丸
 */

import type { PDFPage } from '../pdf/PDFPage.js';
import type { UnitConverter } from '../utils/UnitConverter.js';
import type { ExtractedStyles, BorderSide } from '../dom/StyleExtractor.js';
import { isValidColor, parseGradient, getGradientFirstColor, type RGBAColor, type ParsedGradient, type LinearGradient } from '../utils/ColorParser.js';
import { PDFContentStream } from '../pdf/PDFContentStream.js';

/**
 * ボックスの描画
 */
export function renderBox(
  page: PDFPage,
  styles: ExtractedStyles,
  converter: UnitConverter
): void {
  const { box } = styles;

  // 背景グラデーションを描画
  if (styles.backgroundImage) {
    const gradient = parseGradient(styles.backgroundImage);
    if (gradient) {
      renderGradientBackground(page, box, gradient, styles.borderRadius, converter);
    } else if (isValidColor(styles.backgroundColor)) {
      // グラデーションが解析できなかった場合は背景色を使用
      renderBackground(page, box, styles.backgroundColor, styles.borderRadius, converter);
    }
  } else if (isValidColor(styles.backgroundColor)) {
    // 背景色を描画
    renderBackground(page, box, styles.backgroundColor, styles.borderRadius, converter);
  }

  // 境界線を描画
  renderBorders(page, box, styles.border, styles.borderRadius, converter);
}

/**
 * 背景色を描画
 */
function renderBackground(
  page: PDFPage,
  box: ExtractedStyles['box'],
  color: RGBAColor,
  borderRadius: ExtractedStyles['borderRadius'],
  converter: UnitConverter
): void {
  const x = converter.convertX(box.borderX);
  const y = converter.convertY(box.borderY, box.borderHeight);
  const width = converter.pxToPt(box.borderWidth);
  const height = converter.pxToPt(box.borderHeight);

  // 角丸があるかどうか
  const hasRadius =
    borderRadius.topLeft > 0 ||
    borderRadius.topRight > 0 ||
    borderRadius.bottomRight > 0 ||
    borderRadius.bottomLeft > 0;

  if (hasRadius) {
    // 角丸矩形を描画
    renderRoundedRect(
      page,
      x, y, width, height,
      converter.pxToPt(borderRadius.topLeft),
      converter.pxToPt(borderRadius.topRight),
      converter.pxToPt(borderRadius.bottomRight),
      converter.pxToPt(borderRadius.bottomLeft),
      { fill: color }
    );
  } else {
    // 通常の矩形
    page.drawRect(x, y, width, height, { fill: color });
  }
}

/**
 * グラデーション背景を描画
 * 複数の色バンドを使用してグラデーションを近似描画
 */
function renderGradientBackground(
  page: PDFPage,
  box: ExtractedStyles['box'],
  gradient: ParsedGradient,
  borderRadius: ExtractedStyles['borderRadius'],
  converter: UnitConverter
): void {
  const x = converter.convertX(box.borderX);
  const y = converter.convertY(box.borderY, box.borderHeight);
  const width = converter.pxToPt(box.borderWidth);
  const height = converter.pxToPt(box.borderHeight);

  const stream = page.getContentStream();
  stream.saveState();

  // 角丸があるかどうか
  const hasRadius =
    borderRadius.topLeft > 0 ||
    borderRadius.topRight > 0 ||
    borderRadius.bottomRight > 0 ||
    borderRadius.bottomLeft > 0;

  // 角丸がある場合はクリッピングパスを設定
  if (hasRadius) {
    setRoundedClipPath(
      stream,
      x, y, width, height,
      converter.pxToPt(borderRadius.topLeft),
      converter.pxToPt(borderRadius.topRight),
      converter.pxToPt(borderRadius.bottomRight),
      converter.pxToPt(borderRadius.bottomLeft)
    );
  }

  if (gradient.type === 'linear') {
    renderLinearGradient(stream, x, y, width, height, gradient);
  } else {
    // 放射状グラデーションは最初の色でフォールバック
    const fallbackColor = getGradientFirstColor(gradient);
    if (fallbackColor) {
      stream.setFillColorRGB(fallbackColor.r, fallbackColor.g, fallbackColor.b);
      stream.rect(x, y, width, height);
      stream.fill();
    }
  }

  stream.restoreState();
}

/**
 * 線形グラデーションを描画
 */
function renderLinearGradient(
  stream: PDFContentStream,
  x: number,
  y: number,
  width: number,
  height: number,
  gradient: LinearGradient
): void {
  const { angle, colorStops } = gradient;

  // グラデーションのバンド数（多いほど滑らか）
  const bands = Math.max(50, Math.ceil(Math.max(width, height)));

  // 角度をラジアンに変換（CSSの角度は0degが上、時計回り）
  // PDFの座標系では下が原点なので調整が必要
  const angleRad = ((90 - angle) * Math.PI) / 180;

  // グラデーションの方向ベクトル
  const dirX = Math.cos(angleRad);
  const dirY = Math.sin(angleRad);

  // グラデーション軸の長さを計算
  const axisLength = Math.abs(width * dirX) + Math.abs(height * dirY);

  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const tNext = (i + 1) / bands;

    // 現在位置の色を補間
    const color = interpolateColor(colorStops, (t + tNext) / 2);

    stream.setFillColorRGB(color.r, color.g, color.b);

    // バンドの位置を計算
    if (Math.abs(dirX) > Math.abs(dirY)) {
      // 主に水平方向のグラデーション
      const bandX = x + t * width;
      const bandWidth = width / bands;
      stream.rect(bandX, y, bandWidth + 0.5, height); // 0.5はギャップ防止
    } else {
      // 主に垂直方向のグラデーション
      const bandY = y + t * height;
      const bandHeight = height / bands;
      stream.rect(x, bandY, width, bandHeight + 0.5);
    }

    stream.fill();
  }
}

/**
 * 色を補間
 */
function interpolateColor(
  colorStops: { color: RGBAColor; position: number }[],
  t: number
): RGBAColor {
  // tの位置に最も近い2つのカラーストップを見つける
  let lower = colorStops[0];
  let upper = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (t >= colorStops[i].position && t <= colorStops[i + 1].position) {
      lower = colorStops[i];
      upper = colorStops[i + 1];
      break;
    }
  }

  // 線形補間
  const range = upper.position - lower.position;
  const ratio = range === 0 ? 0 : (t - lower.position) / range;

  return {
    r: lower.color.r + (upper.color.r - lower.color.r) * ratio,
    g: lower.color.g + (upper.color.g - lower.color.g) * ratio,
    b: lower.color.b + (upper.color.b - lower.color.b) * ratio,
    a: lower.color.a + (upper.color.a - lower.color.a) * ratio,
  };
}

/**
 * 角丸クリッピングパスを設定
 */
function setRoundedClipPath(
  stream: PDFContentStream,
  x: number, y: number,
  width: number, height: number,
  radiusTL: number, radiusTR: number,
  radiusBR: number, radiusBL: number
): void {
  const maxRadiusX = width / 2;
  const maxRadiusY = height / 2;
  radiusTL = Math.min(radiusTL, maxRadiusX, maxRadiusY);
  radiusTR = Math.min(radiusTR, maxRadiusX, maxRadiusY);
  radiusBR = Math.min(radiusBR, maxRadiusX, maxRadiusY);
  radiusBL = Math.min(radiusBL, maxRadiusX, maxRadiusY);

  const k = 0.5522847498;

  stream.moveTo(x + radiusBL, y);
  stream.lineTo(x + width - radiusBR, y);
  if (radiusBR > 0) {
    stream.curveTo(
      x + width - radiusBR + radiusBR * k, y,
      x + width, y + radiusBR - radiusBR * k,
      x + width, y + radiusBR
    );
  }
  stream.lineTo(x + width, y + height - radiusTR);
  if (radiusTR > 0) {
    stream.curveTo(
      x + width, y + height - radiusTR + radiusTR * k,
      x + width - radiusTR + radiusTR * k, y + height,
      x + width - radiusTR, y + height
    );
  }
  stream.lineTo(x + radiusTL, y + height);
  if (radiusTL > 0) {
    stream.curveTo(
      x + radiusTL - radiusTL * k, y + height,
      x, y + height - radiusTL + radiusTL * k,
      x, y + height - radiusTL
    );
  }
  stream.lineTo(x, y + radiusBL);
  if (radiusBL > 0) {
    stream.curveTo(
      x, y + radiusBL - radiusBL * k,
      x + radiusBL - radiusBL * k, y,
      x + radiusBL, y
    );
  }
  stream.closePath();
  stream.clip();
  stream.endPath();
}

/**
 * 境界線を描画
 */
function renderBorders(
  page: PDFPage,
  box: ExtractedStyles['box'],
  border: ExtractedStyles['border'],
  borderRadius: ExtractedStyles['borderRadius'],
  converter: UnitConverter
): void {
  const { top, right, bottom, left } = border;

  // 各辺を個別に描画
  if (shouldRenderBorder(top)) {
    renderBorderTop(page, box, top, borderRadius, converter);
  }
  if (shouldRenderBorder(right)) {
    renderBorderRight(page, box, right, borderRadius, converter);
  }
  if (shouldRenderBorder(bottom)) {
    renderBorderBottom(page, box, bottom, borderRadius, converter);
  }
  if (shouldRenderBorder(left)) {
    renderBorderLeft(page, box, left, borderRadius, converter);
  }
}

/**
 * 境界線を描画すべきかどうか
 */
function shouldRenderBorder(side: BorderSide): boolean {
  return side.width > 0 &&
         side.style !== 'none' &&
         side.style !== 'hidden' &&
         isValidColor(side.color);
}

/**
 * 上境界線を描画
 */
function renderBorderTop(
  page: PDFPage,
  box: ExtractedStyles['box'],
  side: BorderSide,
  borderRadius: ExtractedStyles['borderRadius'],
  converter: UnitConverter
): void {
  if (!side.color) return;

  const y = converter.convertY(box.borderY, 0) - converter.pxToPt(side.width / 2);
  const x1 = converter.convertX(box.borderX);
  const x2 = converter.convertX(box.borderX + box.borderWidth);

  renderBorderLine(
    page,
    x1, y, x2, y,
    side,
    converter
  );
}

/**
 * 右境界線を描画
 */
function renderBorderRight(
  page: PDFPage,
  box: ExtractedStyles['box'],
  side: BorderSide,
  borderRadius: ExtractedStyles['borderRadius'],
  converter: UnitConverter
): void {
  if (!side.color) return;

  const x = converter.convertX(box.borderX + box.borderWidth) - converter.pxToPt(side.width / 2);
  const y1 = converter.convertY(box.borderY, 0);
  const y2 = converter.convertY(box.borderY + box.borderHeight, 0);

  renderBorderLine(
    page,
    x, y1, x, y2,
    side,
    converter
  );
}

/**
 * 下境界線を描画
 */
function renderBorderBottom(
  page: PDFPage,
  box: ExtractedStyles['box'],
  side: BorderSide,
  borderRadius: ExtractedStyles['borderRadius'],
  converter: UnitConverter
): void {
  if (!side.color) return;

  const y = converter.convertY(box.borderY + box.borderHeight, 0) + converter.pxToPt(side.width / 2);
  const x1 = converter.convertX(box.borderX);
  const x2 = converter.convertX(box.borderX + box.borderWidth);

  renderBorderLine(
    page,
    x1, y, x2, y,
    side,
    converter
  );
}

/**
 * 左境界線を描画
 */
function renderBorderLeft(
  page: PDFPage,
  box: ExtractedStyles['box'],
  side: BorderSide,
  borderRadius: ExtractedStyles['borderRadius'],
  converter: UnitConverter
): void {
  if (!side.color) return;

  const x = converter.convertX(box.borderX) + converter.pxToPt(side.width / 2);
  const y1 = converter.convertY(box.borderY, 0);
  const y2 = converter.convertY(box.borderY + box.borderHeight, 0);

  renderBorderLine(
    page,
    x, y1, x, y2,
    side,
    converter
  );
}

/**
 * 境界線の線を描画
 */
function renderBorderLine(
  page: PDFPage,
  x1: number, y1: number,
  x2: number, y2: number,
  side: BorderSide,
  converter: UnitConverter
): void {
  if (!side.color) return;

  const stream = page.getContentStream();
  stream.saveState();

  // 線幅
  stream.setLineWidth(converter.pxToPt(side.width));

  // 色
  stream.setStrokeColorRGB(side.color.r, side.color.g, side.color.b);

  // 線のスタイル
  switch (side.style) {
    case 'dashed':
      stream.setDashPattern([converter.pxToPt(side.width * 3)], 0);
      break;
    case 'dotted':
      stream.setLineCap(1); // round
      stream.setDashPattern([0, converter.pxToPt(side.width * 2)], 0);
      break;
    case 'double':
      // doubleは後で対応（複雑）
      break;
    // solid, groove, ridge, inset, outset はsolid扱い
  }

  // 線を描画
  stream.moveTo(x1, y1);
  stream.lineTo(x2, y2);
  stream.stroke();

  stream.restoreState();
}

/**
 * 角丸矩形を描画
 */
function renderRoundedRect(
  page: PDFPage,
  x: number, y: number,
  width: number, height: number,
  radiusTL: number, radiusTR: number,
  radiusBR: number, radiusBL: number,
  options: { fill?: RGBAColor; stroke?: RGBAColor; lineWidth?: number }
): void {
  const stream = page.getContentStream();
  stream.saveState();

  // 角丸の半径を制限（幅・高さの半分まで）
  const maxRadiusX = width / 2;
  const maxRadiusY = height / 2;
  radiusTL = Math.min(radiusTL, maxRadiusX, maxRadiusY);
  radiusTR = Math.min(radiusTR, maxRadiusX, maxRadiusY);
  radiusBR = Math.min(radiusBR, maxRadiusX, maxRadiusY);
  radiusBL = Math.min(radiusBL, maxRadiusX, maxRadiusY);

  // ベジェ曲線の係数（円弧の近似）
  const k = 0.5522847498; // 4 * (sqrt(2) - 1) / 3

  // パスを構築
  // 左下から開始、反時計回り（PDFの座標系では下が原点）
  stream.moveTo(x + radiusBL, y);

  // 下辺 → 右下角丸
  stream.lineTo(x + width - radiusBR, y);
  if (radiusBR > 0) {
    stream.curveTo(
      x + width - radiusBR + radiusBR * k, y,
      x + width, y + radiusBR - radiusBR * k,
      x + width, y + radiusBR
    );
  }

  // 右辺 → 右上角丸
  stream.lineTo(x + width, y + height - radiusTR);
  if (radiusTR > 0) {
    stream.curveTo(
      x + width, y + height - radiusTR + radiusTR * k,
      x + width - radiusTR + radiusTR * k, y + height,
      x + width - radiusTR, y + height
    );
  }

  // 上辺 → 左上角丸
  stream.lineTo(x + radiusTL, y + height);
  if (radiusTL > 0) {
    stream.curveTo(
      x + radiusTL - radiusTL * k, y + height,
      x, y + height - radiusTL + radiusTL * k,
      x, y + height - radiusTL
    );
  }

  // 左辺 → 左下角丸
  stream.lineTo(x, y + radiusBL);
  if (radiusBL > 0) {
    stream.curveTo(
      x, y + radiusBL - radiusBL * k,
      x + radiusBL - radiusBL * k, y,
      x + radiusBL, y
    );
  }

  stream.closePath();

  // 塗りつぶしとストローク
  if (options.fill && options.stroke) {
    stream.setFillColorRGB(options.fill.r, options.fill.g, options.fill.b);
    stream.setStrokeColorRGB(options.stroke.r, options.stroke.g, options.stroke.b);
    if (options.lineWidth) {
      stream.setLineWidth(options.lineWidth);
    }
    stream.fillAndStroke();
  } else if (options.fill) {
    stream.setFillColorRGB(options.fill.r, options.fill.g, options.fill.b);
    stream.fill();
  } else if (options.stroke) {
    stream.setStrokeColorRGB(options.stroke.r, options.stroke.g, options.stroke.b);
    if (options.lineWidth) {
      stream.setLineWidth(options.lineWidth);
    }
    stream.stroke();
  }

  stream.restoreState();
}

/**
 * クリッピングパスを設定
 */
export function setClipRect(
  page: PDFPage,
  x: number, y: number,
  width: number, height: number,
  converter: UnitConverter
): void {
  const pdfX = converter.convertX(x);
  const pdfY = converter.convertY(y, height);
  const pdfWidth = converter.pxToPt(width);
  const pdfHeight = converter.pxToPt(height);

  page.setClipRect(pdfX, pdfY, pdfWidth, pdfHeight);
}
