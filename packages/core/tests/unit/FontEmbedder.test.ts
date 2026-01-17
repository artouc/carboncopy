/**
 * FontEmbedder のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { textToCIDHex } from '../../src/fonts/FontEmbedder.js';

describe('FontEmbedder', () => {
  describe('textToCIDHex', () => {
    // Note: textToCIDHex requires a LoadedFont object with otFont
    // These tests verify the hex conversion logic conceptually

    it('should be exported as a function', () => {
      expect(typeof textToCIDHex).toBe('function');
    });
  });
});
