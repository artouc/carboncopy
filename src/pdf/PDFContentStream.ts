/**
 * PDFContentStream - PDF描画命令生成
 *
 * PDFのコンテンツストリームは描画命令（オペレーター）の連続。
 * テキスト、グラフィックス、カラーの各オペレーターを生成する。
 */

const TEXT_ENCODER = new TextEncoder();

export interface RGBColor {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

export interface TextOptions {
  font: string;
  fontSize: number;
  color?: RGBColor;
  charSpace?: number;
  wordSpace?: number;
}

export interface LineOptions {
  color?: RGBColor;
  width?: number;
  dash?: number[];
  cap?: 'butt' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
}

export interface RectOptions {
  fill?: RGBColor;
  stroke?: RGBColor;
  lineWidth?: number;
}

/**
 * 数値を PDF用文字列にフォーマット
 */
function formatNumber(n: number): string {
  if (Number.isInteger(n)) {
    return n.toString();
  }
  // 小数点以下5桁、末尾の0を除去
  return n.toFixed(5).replace(/\.?0+$/, '');
}

/**
 * PDF Content Stream Builder
 */
export class PDFContentStream {
  private commands: string[] = [];

  /**
   * グラフィックス状態を保存 (q)
   */
  saveState(): this {
    this.commands.push('q');
    return this;
  }

  /**
   * グラフィックス状態を復元 (Q)
   */
  restoreState(): this {
    this.commands.push('Q');
    return this;
  }

  // ============================================
  // テキストオペレーター
  // ============================================

  /**
   * テキストオブジェクト開始 (BT)
   */
  beginText(): this {
    this.commands.push('BT');
    return this;
  }

  /**
   * テキストオブジェクト終了 (ET)
   */
  endText(): this {
    this.commands.push('ET');
    return this;
  }

  /**
   * フォント設定 (Tf)
   * @param fontName フォント名 (リソース辞書のキー、例: "F1")
   * @param size フォントサイズ (pt)
   */
  setFont(fontName: string, size: number): this {
    this.commands.push(`/${fontName} ${formatNumber(size)} Tf`);
    return this;
  }

  /**
   * テキスト位置移動 (Td)
   */
  moveText(x: number, y: number): this {
    this.commands.push(`${formatNumber(x)} ${formatNumber(y)} Td`);
    return this;
  }

  /**
   * テキスト行列設定 (Tm)
   */
  setTextMatrix(a: number, b: number, c: number, d: number, e: number, f: number): this {
    this.commands.push(
      `${formatNumber(a)} ${formatNumber(b)} ${formatNumber(c)} ${formatNumber(d)} ${formatNumber(e)} ${formatNumber(f)} Tm`
    );
    return this;
  }

  /**
   * テキスト表示 (Tj)
   */
  showText(text: string): this {
    const escaped = this.escapeString(text);
    this.commands.push(`(${escaped}) Tj`);
    return this;
  }

  /**
   * 16進数文字列としてテキスト表示 (Tj)
   * Unicode対応のため、UTF-16BEでエンコード
   */
  showTextHex(text: string): this {
    const hex = this.stringToUtf16BeHex(text);
    this.commands.push(`<${hex}> Tj`);
    return this;
  }

  /**
   * 事前変換済み16進数文字列でテキスト表示 (Tj)
   * CIDフォント用：グリフIDの16進数文字列を直接渡す
   */
  showTextHexRaw(hexString: string): this {
    this.commands.push(`<${hexString}> Tj`);
    return this;
  }

  /**
   * カーニング付きテキスト表示 (TJ)
   * @param items 文字列または数値(カーニング調整)の配列
   */
  showTextWithKerning(items: Array<string | number>): this {
    const parts = items.map(item => {
      if (typeof item === 'number') {
        return formatNumber(item);
      }
      return `(${this.escapeString(item)})`;
    });
    this.commands.push(`[${parts.join(' ')}] TJ`);
    return this;
  }

  /**
   * 文字間隔設定 (Tc)
   */
  setCharacterSpacing(spacing: number): this {
    this.commands.push(`${formatNumber(spacing)} Tc`);
    return this;
  }

  /**
   * 単語間隔設定 (Tw)
   */
  setWordSpacing(spacing: number): this {
    this.commands.push(`${formatNumber(spacing)} Tw`);
    return this;
  }

  /**
   * 行間設定 (TL)
   */
  setLeading(leading: number): this {
    this.commands.push(`${formatNumber(leading)} TL`);
    return this;
  }

  /**
   * 次の行に移動 (T*)
   */
  nextLine(): this {
    this.commands.push('T*');
    return this;
  }

  // ============================================
  // グラフィックスオペレーター
  // ============================================

  /**
   * パス開始点移動 (m)
   */
  moveTo(x: number, y: number): this {
    this.commands.push(`${formatNumber(x)} ${formatNumber(y)} m`);
    return this;
  }

  /**
   * 直線描画 (l)
   */
  lineTo(x: number, y: number): this {
    this.commands.push(`${formatNumber(x)} ${formatNumber(y)} l`);
    return this;
  }

  /**
   * ベジェ曲線 (c)
   */
  curveTo(
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number
  ): this {
    this.commands.push(
      `${formatNumber(x1)} ${formatNumber(y1)} ${formatNumber(x2)} ${formatNumber(y2)} ${formatNumber(x3)} ${formatNumber(y3)} c`
    );
    return this;
  }

  /**
   * 矩形パス (re)
   */
  rect(x: number, y: number, width: number, height: number): this {
    this.commands.push(
      `${formatNumber(x)} ${formatNumber(y)} ${formatNumber(width)} ${formatNumber(height)} re`
    );
    return this;
  }

  /**
   * パスを閉じる (h)
   */
  closePath(): this {
    this.commands.push('h');
    return this;
  }

  /**
   * ストローク (S)
   */
  stroke(): this {
    this.commands.push('S');
    return this;
  }

  /**
   * パスを閉じてストローク (s)
   */
  closeAndStroke(): this {
    this.commands.push('s');
    return this;
  }

  /**
   * フィル (f) - 非ゼロワインディング規則
   */
  fill(): this {
    this.commands.push('f');
    return this;
  }

  /**
   * フィル (f*) - 偶奇規則
   */
  fillEvenOdd(): this {
    this.commands.push('f*');
    return this;
  }

  /**
   * フィルとストローク (B)
   */
  fillAndStroke(): this {
    this.commands.push('B');
    return this;
  }

  /**
   * パスを終了（描画なし）(n)
   */
  endPath(): this {
    this.commands.push('n');
    return this;
  }

  /**
   * クリッピングパス設定 (W)
   */
  clip(): this {
    this.commands.push('W');
    return this;
  }

  /**
   * クリッピングパス設定 偶奇規則 (W*)
   */
  clipEvenOdd(): this {
    this.commands.push('W*');
    return this;
  }

  // ============================================
  // カラーオペレーター
  // ============================================

  /**
   * ストローク色設定 RGB (RG)
   */
  setStrokeColorRGB(r: number, g: number, b: number): this {
    this.commands.push(`${formatNumber(r)} ${formatNumber(g)} ${formatNumber(b)} RG`);
    return this;
  }

  /**
   * フィル色設定 RGB (rg)
   */
  setFillColorRGB(r: number, g: number, b: number): this {
    this.commands.push(`${formatNumber(r)} ${formatNumber(g)} ${formatNumber(b)} rg`);
    return this;
  }

  /**
   * ストローク色設定 グレースケール (G)
   */
  setStrokeColorGray(gray: number): this {
    this.commands.push(`${formatNumber(gray)} G`);
    return this;
  }

  /**
   * フィル色設定 グレースケール (g)
   */
  setFillColorGray(gray: number): this {
    this.commands.push(`${formatNumber(gray)} g`);
    return this;
  }

  /**
   * ストローク色設定 CMYK (K)
   */
  setStrokeColorCMYK(c: number, m: number, y: number, k: number): this {
    this.commands.push(`${formatNumber(c)} ${formatNumber(m)} ${formatNumber(y)} ${formatNumber(k)} K`);
    return this;
  }

  /**
   * フィル色設定 CMYK (k)
   */
  setFillColorCMYK(c: number, m: number, y: number, k: number): this {
    this.commands.push(`${formatNumber(c)} ${formatNumber(m)} ${formatNumber(y)} ${formatNumber(k)} k`);
    return this;
  }

  // ============================================
  // 線スタイルオペレーター
  // ============================================

  /**
   * 線幅設定 (w)
   */
  setLineWidth(width: number): this {
    this.commands.push(`${formatNumber(width)} w`);
    return this;
  }

  /**
   * 線端スタイル設定 (J)
   * 0: butt, 1: round, 2: square
   */
  setLineCap(cap: 0 | 1 | 2): this {
    this.commands.push(`${cap} J`);
    return this;
  }

  /**
   * 線結合スタイル設定 (j)
   * 0: miter, 1: round, 2: bevel
   */
  setLineJoin(join: 0 | 1 | 2): this {
    this.commands.push(`${join} j`);
    return this;
  }

  /**
   * 破線パターン設定 (d)
   */
  setDashPattern(dashArray: number[], dashPhase: number = 0): this {
    const arrayStr = `[${dashArray.map(formatNumber).join(' ')}]`;
    this.commands.push(`${arrayStr} ${formatNumber(dashPhase)} d`);
    return this;
  }

  // ============================================
  // 変換オペレーター
  // ============================================

  /**
   * 変換行列設定 (cm)
   */
  transform(a: number, b: number, c: number, d: number, e: number, f: number): this {
    this.commands.push(
      `${formatNumber(a)} ${formatNumber(b)} ${formatNumber(c)} ${formatNumber(d)} ${formatNumber(e)} ${formatNumber(f)} cm`
    );
    return this;
  }

  /**
   * 平行移動
   */
  translate(x: number, y: number): this {
    return this.transform(1, 0, 0, 1, x, y);
  }

  /**
   * スケール
   */
  scale(sx: number, sy: number): this {
    return this.transform(sx, 0, 0, sy, 0, 0);
  }

  /**
   * 回転 (ラジアン)
   */
  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return this.transform(cos, sin, -sin, cos, 0, 0);
  }

  // ============================================
  // 画像オペレーター
  // ============================================

  /**
   * 画像表示 (Do)
   * @param imageName リソース辞書のXObjectキー (例: "Im1")
   */
  drawImage(imageName: string): this {
    this.commands.push(`/${imageName} Do`);
    return this;
  }

  // ============================================
  // ユーティリティ
  // ============================================

  /**
   * 文字列を PDF用にエスケープ
   */
  private escapeString(str: string): string {
    let result = '';
    for (const char of str) {
      const code = char.charCodeAt(0);
      if (char === '(' || char === ')' || char === '\\') {
        result += '\\' + char;
      } else if (code === 0x0A) {
        result += '\\n';
      } else if (code === 0x0D) {
        result += '\\r';
      } else if (code === 0x09) {
        result += '\\t';
      } else if (code < 32 || code > 126) {
        // 非ASCII文字は8進数エスケープ
        result += '\\' + code.toString(8).padStart(3, '0');
      } else {
        result += char;
      }
    }
    return result;
  }

  /**
   * 文字列を UTF-16BE 16進数文字列に変換
   */
  private stringToUtf16BeHex(str: string): string {
    let hex = 'FEFF'; // BOM
    for (const char of str) {
      const code = char.charCodeAt(0);
      hex += code.toString(16).padStart(4, '0').toUpperCase();
    }
    return hex;
  }

  /**
   * 生成した命令をバイト配列として取得
   */
  toBytes(): Uint8Array {
    const content = this.commands.join('\n');
    return TEXT_ENCODER.encode(content);
  }

  /**
   * 生成した命令を文字列として取得 (デバッグ用)
   */
  toString(): string {
    return this.commands.join('\n');
  }

  /**
   * 命令をクリア
   */
  clear(): void {
    this.commands = [];
  }
}
