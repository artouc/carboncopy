/**
 * PDFContentStream のユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PDFContentStream } from '../../src/pdf/PDFContentStream.js';

describe('PDFContentStream', () => {
  let stream: PDFContentStream;

  beforeEach(() => {
    stream = new PDFContentStream();
  });

  describe('テキストオペレーター', () => {
    it('BT/ET でテキストオブジェクトを囲む', () => {
      stream.beginText();
      stream.endText();
      expect(stream.toString()).toBe('BT\nET');
    });

    it('Tf でフォントを設定', () => {
      stream.setFont('F1', 12);
      expect(stream.toString()).toBe('/F1 12 Tf');
    });

    it('Td でテキスト位置を移動', () => {
      stream.moveText(100, 200);
      expect(stream.toString()).toBe('100 200 Td');
    });

    it('Tj でテキストを表示', () => {
      stream.showText('Hello');
      expect(stream.toString()).toBe('(Hello) Tj');
    });

    it('showTextHex で UTF-16BE テキストを表示', () => {
      stream.showTextHex('A');
      // BOM (FEFF) + 'A' (0041)
      expect(stream.toString()).toBe('<FEFF0041> Tj');
    });

    it('showTextHexRaw で事前変換済み16進数文字列を表示', () => {
      stream.showTextHexRaw('00410042');
      expect(stream.toString()).toBe('<00410042> Tj');
    });

    it('TJ でカーニング付きテキストを表示', () => {
      stream.showTextWithKerning(['A', -50, 'B']);
      expect(stream.toString()).toBe('[(A) -50 (B)] TJ');
    });
  });

  describe('グラフィックスオペレーター', () => {
    it('m で移動', () => {
      stream.moveTo(10, 20);
      expect(stream.toString()).toBe('10 20 m');
    });

    it('l で直線', () => {
      stream.lineTo(30, 40);
      expect(stream.toString()).toBe('30 40 l');
    });

    it('re で矩形', () => {
      stream.rect(10, 20, 100, 50);
      expect(stream.toString()).toBe('10 20 100 50 re');
    });

    it('S でストローク', () => {
      stream.stroke();
      expect(stream.toString()).toBe('S');
    });

    it('f でフィル', () => {
      stream.fill();
      expect(stream.toString()).toBe('f');
    });

    it('B でフィルとストローク', () => {
      stream.fillAndStroke();
      expect(stream.toString()).toBe('B');
    });
  });

  describe('カラーオペレーター', () => {
    it('rg でフィル色を設定 (RGB)', () => {
      stream.setFillColorRGB(1, 0, 0);
      expect(stream.toString()).toBe('1 0 0 rg');
    });

    it('RG でストローク色を設定 (RGB)', () => {
      stream.setStrokeColorRGB(0, 1, 0);
      expect(stream.toString()).toBe('0 1 0 RG');
    });

    it('g でフィル色を設定 (グレースケール)', () => {
      stream.setFillColorGray(0.5);
      expect(stream.toString()).toBe('0.5 g');
    });
  });

  describe('状態オペレーター', () => {
    it('q/Q で状態を保存/復元', () => {
      stream.saveState();
      stream.restoreState();
      expect(stream.toString()).toBe('q\nQ');
    });

    it('w で線幅を設定', () => {
      stream.setLineWidth(2);
      expect(stream.toString()).toBe('2 w');
    });
  });

  describe('変換オペレーター', () => {
    it('cm で変換行列を設定', () => {
      stream.transform(1, 0, 0, 1, 100, 200);
      expect(stream.toString()).toBe('1 0 0 1 100 200 cm');
    });

    it('translate で平行移動', () => {
      stream.translate(50, 100);
      expect(stream.toString()).toBe('1 0 0 1 50 100 cm');
    });

    it('scale でスケール', () => {
      stream.scale(2, 3);
      expect(stream.toString()).toBe('2 0 0 3 0 0 cm');
    });
  });

  describe('数値フォーマット', () => {
    it('整数は小数点なし', () => {
      stream.moveTo(10, 20);
      expect(stream.toString()).toBe('10 20 m');
    });

    it('小数点以下は必要な桁のみ', () => {
      stream.moveTo(10.5, 20.25);
      expect(stream.toString()).toBe('10.5 20.25 m');
    });

    it('末尾の0は除去', () => {
      stream.moveTo(10.10000, 20.50000);
      expect(stream.toString()).toBe('10.1 20.5 m');
    });
  });

  describe('文字列エスケープ', () => {
    it('括弧をエスケープ', () => {
      stream.showText('(test)');
      expect(stream.toString()).toBe('(\\(test\\)) Tj');
    });

    it('バックスラッシュをエスケープ', () => {
      stream.showText('a\\b');
      expect(stream.toString()).toBe('(a\\\\b) Tj');
    });
  });

  describe('toBytes', () => {
    it('UTF-8 バイト配列を返す', () => {
      stream.showText('test');
      const bytes = stream.toBytes();
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(bytes)).toBe('(test) Tj');
    });
  });

  describe('clear', () => {
    it('命令をクリア', () => {
      stream.showText('test');
      stream.clear();
      expect(stream.toString()).toBe('');
    });
  });
});
