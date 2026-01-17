/**
 * PDFResult - 生成されたPDFを操作するためのクラス
 */

export class PDFResult {
  private data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  /**
   * Blobとして取得
   */
  toBlob(): Blob {
    return new Blob([this.data], { type: 'application/pdf' });
  }

  /**
   * ArrayBufferとして取得
   */
  toArrayBuffer(): ArrayBuffer {
    return this.data.buffer.slice(
      this.data.byteOffset,
      this.data.byteOffset + this.data.byteLength
    );
  }

  /**
   * Uint8Arrayとして取得
   */
  toUint8Array(): Uint8Array {
    return this.data;
  }

  /**
   * Base64文字列として取得
   */
  toBase64(): string {
    let binary = '';
    for (let i = 0; i < this.data.length; i++) {
      binary += String.fromCharCode(this.data[i]);
    }
    return btoa(binary);
  }

  /**
   * Data URLとして取得
   */
  toDataURL(): string {
    return `data:application/pdf;base64,${this.toBase64()}`;
  }

  /**
   * ダウンロード (ブラウザ環境のみ)
   */
  download(filename: string = 'document.pdf'): void {
    if (typeof document === 'undefined') {
      throw new Error('download() is only available in browser environment');
    }
    const blob = this.toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * ファイルサイズを取得 (bytes)
   */
  get size(): number {
    return this.data.length;
  }
}
