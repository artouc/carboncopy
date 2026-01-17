/**
 * ListRenderer のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  isListElement,
  isListItemElement,
} from '../../src/renderers/ListRenderer.js';

describe('ListRenderer', () => {
  describe('isListElement', () => {
    it('should be a function', () => {
      expect(typeof isListElement).toBe('function');
    });
  });

  describe('isListItemElement', () => {
    it('should be a function', () => {
      expect(typeof isListItemElement).toBe('function');
    });
  });

  describe('number formatting functions', () => {
    // toLowerAlpha のテスト（内部関数のため直接テストできないが、概念をテスト）
    it('should format numbers to alphabet correctly (concept)', () => {
      // 1 -> a, 2 -> b, ..., 26 -> z, 27 -> aa
      const toLowerAlpha = (n: number): string => {
        let result = '';
        while (n > 0) {
          n--;
          result = String.fromCharCode(97 + (n % 26)) + result;
          n = Math.floor(n / 26);
        }
        return result;
      };

      expect(toLowerAlpha(1)).toBe('a');
      expect(toLowerAlpha(2)).toBe('b');
      expect(toLowerAlpha(26)).toBe('z');
      expect(toLowerAlpha(27)).toBe('aa');
      expect(toLowerAlpha(28)).toBe('ab');
      expect(toLowerAlpha(52)).toBe('az');
      expect(toLowerAlpha(53)).toBe('ba');
    });

    it('should format numbers to roman numerals correctly (concept)', () => {
      const toRoman = (n: number): string => {
        const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

        let result = '';
        for (let i = 0; i < values.length; i++) {
          while (n >= values[i]) {
            result += numerals[i];
            n -= values[i];
          }
        }
        return result;
      };

      expect(toRoman(1)).toBe('I');
      expect(toRoman(4)).toBe('IV');
      expect(toRoman(5)).toBe('V');
      expect(toRoman(9)).toBe('IX');
      expect(toRoman(10)).toBe('X');
      expect(toRoman(40)).toBe('XL');
      expect(toRoman(50)).toBe('L');
      expect(toRoman(90)).toBe('XC');
      expect(toRoman(100)).toBe('C');
      expect(toRoman(400)).toBe('CD');
      expect(toRoman(500)).toBe('D');
      expect(toRoman(900)).toBe('CM');
      expect(toRoman(1000)).toBe('M');
      expect(toRoman(2024)).toBe('MMXXIV');
      expect(toRoman(3999)).toBe('MMMCMXCIX');
    });

    it('should format numbers to greek letters correctly (concept)', () => {
      const toLowerGreek = (n: number): string => {
        const greekLetters = 'αβγδεζηθικλμνξοπρστυφχψω';
        if (n < 1 || n > greekLetters.length) {
          return n.toString();
        }
        return greekLetters[n - 1];
      };

      expect(toLowerGreek(1)).toBe('α');
      expect(toLowerGreek(2)).toBe('β');
      expect(toLowerGreek(3)).toBe('γ');
      expect(toLowerGreek(24)).toBe('ω');
      expect(toLowerGreek(25)).toBe('25'); // 範囲外
    });
  });
});
