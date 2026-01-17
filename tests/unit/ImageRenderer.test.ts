/**
 * ImageRenderer のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { detectImageType } from '../../src/renderers/ImageRenderer.js';

describe('ImageRenderer', () => {
  describe('detectImageType', () => {
    it('should detect JPEG images', () => {
      const jpegData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      expect(detectImageType(jpegData)).toBe('jpeg');
    });

    it('should detect PNG images', () => {
      const pngData = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(detectImageType(pngData)).toBe('png');
    });

    it('should return unknown for unsupported formats', () => {
      const gifData = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF89a
      expect(detectImageType(gifData)).toBe('unknown');
    });

    it('should return unknown for empty data', () => {
      const emptyData = new Uint8Array([]);
      expect(detectImageType(emptyData)).toBe('unknown');
    });

    it('should return unknown for random data', () => {
      const randomData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      expect(detectImageType(randomData)).toBe('unknown');
    });
  });
});
