/**
 * PDF Object Base Types and Serialization
 *
 * PDF仕様 (ISO 32000-1) に基づくオブジェクト型:
 * - Boolean, Integer, Real, String, Name, Array, Dictionary, Stream, Null
 * - 間接参照 (Indirect Reference)
 */

const TEXT_ENCODER = new TextEncoder();

/**
 * PDFオブジェクトの基底型
 */
export type PDFObjectValue =
  | PDFNull
  | PDFBoolean
  | PDFNumber
  | PDFString
  | PDFHexString
  | PDFName
  | PDFArray
  | PDFDict
  | PDFRef
  | PDFStream;

/**
 * null オブジェクト
 */
export class PDFNull {
  static readonly instance = new PDFNull();
  private constructor() {}

  serialize(): Uint8Array {
    return TEXT_ENCODER.encode('null');
  }
}

/**
 * Boolean オブジェクト
 */
export class PDFBoolean {
  constructor(public readonly value: boolean) {}

  serialize(): Uint8Array {
    return TEXT_ENCODER.encode(this.value ? 'true' : 'false');
  }
}

/**
 * Number オブジェクト (Integer/Real)
 */
export class PDFNumber {
  constructor(public readonly value: number) {}

  serialize(): Uint8Array {
    // 整数の場合は小数点なし、実数は必要な精度で
    if (Number.isInteger(this.value)) {
      return TEXT_ENCODER.encode(this.value.toString());
    }
    // 精度を制限して不要な桁を除去 (PDF仕様では通常5桁程度で十分)
    const fixed = this.value.toFixed(5).replace(/\.?0+$/, '');
    return TEXT_ENCODER.encode(fixed);
  }
}

/**
 * String オブジェクト (リテラル文字列)
 * 括弧で囲まれる: (Hello World)
 */
export class PDFString {
  constructor(public readonly value: string) {}

  serialize(): Uint8Array {
    // 特殊文字をエスケープ
    let escaped = '';
    for (const char of this.value) {
      const code = char.charCodeAt(0);
      if (char === '(' || char === ')' || char === '\\') {
        escaped += '\\' + char;
      } else if (code < 32 || code > 126) {
        // 非ASCII文字は8進数エスケープ
        escaped += '\\' + code.toString(8).padStart(3, '0');
      } else {
        escaped += char;
      }
    }
    return TEXT_ENCODER.encode(`(${escaped})`);
  }
}

/**
 * Hex String オブジェクト
 * 16進数表記: <48656C6C6F>
 */
export class PDFHexString {
  constructor(public readonly data: Uint8Array) {}

  static fromString(str: string): PDFHexString {
    // UTF-16BE エンコーディング (PDF標準)
    const bytes: number[] = [0xFE, 0xFF]; // BOM
    for (const char of str) {
      const code = char.charCodeAt(0);
      bytes.push((code >> 8) & 0xFF);
      bytes.push(code & 0xFF);
    }
    return new PDFHexString(new Uint8Array(bytes));
  }

  serialize(): Uint8Array {
    let hex = '<';
    for (const byte of this.data) {
      hex += byte.toString(16).padStart(2, '0').toUpperCase();
    }
    hex += '>';
    return TEXT_ENCODER.encode(hex);
  }
}

/**
 * Name オブジェクト
 * スラッシュで始まる: /Type /Font
 */
export class PDFName {
  constructor(public readonly value: string) {}

  serialize(): Uint8Array {
    // 特殊文字は #xx でエスケープ
    let escaped = '/';
    for (const char of this.value) {
      const code = char.charCodeAt(0);
      if (code < 33 || code > 126 || char === '#' || char === '/' ||
          char === '(' || char === ')' || char === '<' || char === '>' ||
          char === '[' || char === ']' || char === '{' || char === '}' ||
          char === '%') {
        escaped += '#' + code.toString(16).padStart(2, '0');
      } else {
        escaped += char;
      }
    }
    return TEXT_ENCODER.encode(escaped);
  }
}

/**
 * Array オブジェクト
 * 角括弧で囲まれる: [1 2 3]
 */
export class PDFArray {
  constructor(public readonly items: PDFObjectValue[]) {}

  serialize(): Uint8Array {
    const parts: Uint8Array[] = [TEXT_ENCODER.encode('[')];
    for (let i = 0; i < this.items.length; i++) {
      if (i > 0) {
        parts.push(TEXT_ENCODER.encode(' '));
      }
      parts.push(this.items[i].serialize());
    }
    parts.push(TEXT_ENCODER.encode(']'));
    return concatUint8Arrays(parts);
  }

  push(...items: PDFObjectValue[]): void {
    (this.items as PDFObjectValue[]).push(...items);
  }

  get length(): number {
    return this.items.length;
  }
}

/**
 * Dictionary オブジェクト
 * << /Key Value >> 形式
 */
export class PDFDict {
  private entries: Map<string, PDFObjectValue> = new Map();

  constructor(entries?: Record<string, PDFObjectValue>) {
    if (entries) {
      for (const [key, value] of Object.entries(entries)) {
        this.entries.set(key, value);
      }
    }
  }

  set(key: string, value: PDFObjectValue): void {
    this.entries.set(key, value);
  }

  get(key: string): PDFObjectValue | undefined {
    return this.entries.get(key);
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  serialize(): Uint8Array {
    const parts: Uint8Array[] = [TEXT_ENCODER.encode('<<')];
    for (const [key, value] of this.entries) {
      parts.push(TEXT_ENCODER.encode('\n'));
      parts.push(new PDFName(key).serialize());
      parts.push(TEXT_ENCODER.encode(' '));
      parts.push(value.serialize());
    }
    parts.push(TEXT_ENCODER.encode('\n>>'));
    return concatUint8Arrays(parts);
  }
}

/**
 * 間接参照 (Indirect Reference)
 * "n 0 R" 形式
 */
export class PDFRef {
  constructor(
    public readonly objectNumber: number,
    public readonly generationNumber: number = 0
  ) {}

  serialize(): Uint8Array {
    return TEXT_ENCODER.encode(`${this.objectNumber} ${this.generationNumber} R`);
  }
}

/**
 * Stream オブジェクト
 * Dictionary + バイナリデータ
 */
export class PDFStream {
  public dict: PDFDict;
  public data: Uint8Array;

  constructor(data: Uint8Array, dict?: PDFDict) {
    this.data = data;
    this.dict = dict ?? new PDFDict();
    this.dict.set('Length', new PDFNumber(data.length));
  }

  serialize(): Uint8Array {
    const parts: Uint8Array[] = [
      this.dict.serialize(),
      TEXT_ENCODER.encode('\nstream\n'),
      this.data,
      TEXT_ENCODER.encode('\nendstream'),
    ];
    return concatUint8Arrays(parts);
  }
}

/**
 * 間接オブジェクト (Indirect Object)
 * "n g obj ... endobj" 形式
 */
export class PDFIndirectObject {
  constructor(
    public readonly objectNumber: number,
    public readonly generationNumber: number,
    public readonly value: PDFObjectValue
  ) {}

  serialize(): Uint8Array {
    const parts: Uint8Array[] = [
      TEXT_ENCODER.encode(`${this.objectNumber} ${this.generationNumber} obj\n`),
      this.value.serialize(),
      TEXT_ENCODER.encode('\nendobj\n'),
    ];
    return concatUint8Arrays(parts);
  }

  ref(): PDFRef {
    return new PDFRef(this.objectNumber, this.generationNumber);
  }
}

/**
 * Uint8Array を連結
 */
export function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
