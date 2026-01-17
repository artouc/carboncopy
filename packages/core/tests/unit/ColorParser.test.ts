import { describe, it, expect } from 'vitest';
import { parseColor, colorToString, isTransparent, isValidColor } from '../../src/utils/ColorParser';

describe('ColorParser', () => {
  describe('parseColor', () => {
    describe('Hex colors', () => {
      it('should parse #RGB format', () => {
        const color = parseColor('#f00');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: 1 });
      });

      it('should parse #RRGGBB format', () => {
        const color = parseColor('#ff0000');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: 1 });
      });

      it('should parse #RGBA format', () => {
        const color = parseColor('#f008');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: expect.closeTo(0.533, 2) });
      });

      it('should parse #RRGGBBAA format', () => {
        const color = parseColor('#ff000080');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: expect.closeTo(0.502, 2) });
      });

      it('should handle mixed case', () => {
        const color = parseColor('#FF00FF');
        expect(color).toEqual({ r: 1, g: 0, b: 1, a: 1 });
      });
    });

    describe('RGB colors', () => {
      it('should parse rgb(r, g, b) format', () => {
        const color = parseColor('rgb(255, 128, 0)');
        expect(color).toEqual({
          r: 1,
          g: expect.closeTo(0.502, 2),
          b: 0,
          a: 1,
        });
      });

      it('should parse rgba(r, g, b, a) format', () => {
        const color = parseColor('rgba(255, 0, 0, 0.5)');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
      });

      it('should parse percentage values', () => {
        const color = parseColor('rgb(100%, 50%, 0%)');
        expect(color).toEqual({ r: 1, g: 0.5, b: 0, a: 1 });
      });

      it('should parse modern syntax with spaces', () => {
        const color = parseColor('rgb(255 128 0)');
        expect(color).toEqual({
          r: 1,
          g: expect.closeTo(0.502, 2),
          b: 0,
          a: 1,
        });
      });

      it('should parse modern syntax with alpha', () => {
        const color = parseColor('rgb(255 0 0 / 0.5)');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
      });

      it('should parse alpha as percentage', () => {
        const color = parseColor('rgba(255, 0, 0, 50%)');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
      });
    });

    describe('HSL colors', () => {
      it('should parse hsl(h, s%, l%) format', () => {
        const color = parseColor('hsl(0, 100%, 50%)');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: 1 });
      });

      it('should parse hsla with alpha', () => {
        const color = parseColor('hsla(120, 100%, 50%, 0.5)');
        expect(color?.a).toBe(0.5);
        expect(color?.g).toBeCloseTo(1, 1);
      });

      it('should parse blue (240 degrees)', () => {
        const color = parseColor('hsl(240, 100%, 50%)');
        expect(color?.b).toBeCloseTo(1, 1);
        expect(color?.r).toBeCloseTo(0, 1);
      });

      it('should handle hue units (turn, rad)', () => {
        const colorTurn = parseColor('hsl(0.5turn, 100%, 50%)');
        expect(colorTurn?.r).toBeCloseTo(0, 1);
        expect(colorTurn?.g).toBeCloseTo(1, 1);
      });
    });

    describe('Named colors', () => {
      it('should parse basic color names', () => {
        expect(parseColor('red')).toEqual({ r: 1, g: 0, b: 0, a: 1 });
        expect(parseColor('green')).toEqual({ r: 0, g: expect.closeTo(0.502, 2), b: 0, a: 1 });
        expect(parseColor('blue')).toEqual({ r: 0, g: 0, b: 1, a: 1 });
        expect(parseColor('white')).toEqual({ r: 1, g: 1, b: 1, a: 1 });
        expect(parseColor('black')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
      });

      it('should parse transparent', () => {
        const color = parseColor('transparent');
        expect(color).toEqual({ r: 0, g: 0, b: 0, a: 0 });
      });

      it('should handle case insensitivity', () => {
        expect(parseColor('RED')).toEqual({ r: 1, g: 0, b: 0, a: 1 });
        expect(parseColor('Red')).toEqual({ r: 1, g: 0, b: 0, a: 1 });
      });
    });

    describe('Edge cases', () => {
      it('should return null for invalid input', () => {
        expect(parseColor('')).toBeNull();
        expect(parseColor('none')).toBeNull();
        expect(parseColor('invalid')).toBeNull();
        expect(parseColor('#gg0000')).toBeNull();
      });

      it('should handle whitespace', () => {
        const color = parseColor('  rgb(255, 0, 0)  ');
        expect(color).toEqual({ r: 1, g: 0, b: 0, a: 1 });
      });
    });
  });

  describe('colorToString', () => {
    it('should convert to rgb string when alpha is 1', () => {
      const str = colorToString({ r: 1, g: 0.5, b: 0, a: 1 });
      expect(str).toBe('rgb(255, 128, 0)');
    });

    it('should convert to rgba string when alpha is not 1', () => {
      const str = colorToString({ r: 1, g: 0, b: 0, a: 0.5 });
      expect(str).toBe('rgba(255, 0, 0, 0.5)');
    });
  });

  describe('isTransparent', () => {
    it('should return true for null', () => {
      expect(isTransparent(null)).toBe(true);
    });

    it('should return true for alpha 0', () => {
      expect(isTransparent({ r: 1, g: 0, b: 0, a: 0 })).toBe(true);
    });

    it('should return false for opaque color', () => {
      expect(isTransparent({ r: 1, g: 0, b: 0, a: 1 })).toBe(false);
    });
  });

  describe('isValidColor', () => {
    it('should return false for null', () => {
      expect(isValidColor(null)).toBe(false);
    });

    it('should return false for transparent', () => {
      expect(isValidColor({ r: 0, g: 0, b: 0, a: 0 })).toBe(false);
    });

    it('should return true for valid color', () => {
      expect(isValidColor({ r: 1, g: 0, b: 0, a: 0.5 })).toBe(true);
    });
  });
});
