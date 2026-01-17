import { describe, it, expect } from 'vitest';
import { UnitConverter, PAGE_SIZES } from '../../src/utils/UnitConverter';

describe('UnitConverter', () => {
  describe('pxToPt', () => {
    it('should convert CSS pixels to PDF points correctly', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);

      // 96 DPI (CSS) → 72 DPI (PDF)
      // 比率: 72/96 = 0.75
      expect(converter.pxToPt(96)).toBeCloseTo(72, 5);
      expect(converter.pxToPt(100)).toBeCloseTo(75, 5);
      expect(converter.pxToPt(1)).toBeCloseTo(0.75, 5);
    });

    it('should handle zero and negative values', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);

      expect(converter.pxToPt(0)).toBe(0);
      expect(converter.pxToPt(-100)).toBeCloseTo(-75, 5);
    });

    it('should maintain precision for fractional values', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);

      // 0.75 * 1.5 = 1.125
      expect(converter.pxToPt(1.5)).toBeCloseTo(1.125, 5);
    });
  });

  describe('ptToPx', () => {
    it('should convert PDF points to CSS pixels correctly', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);

      // 比率: 96/72 = 1.333...
      expect(converter.ptToPx(72)).toBeCloseTo(96, 5);
      expect(converter.ptToPx(75)).toBeCloseTo(100, 5);
    });
  });

  describe('mmToPt', () => {
    it('should convert millimeters to PDF points', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);

      // 1 inch = 25.4mm = 72pt
      // 25.4mm → 72pt
      expect(converter.mmToPt(25.4)).toBeCloseTo(72, 1);

      // 10mm → ~28.35pt
      expect(converter.mmToPt(10)).toBeCloseTo(28.3465, 2);
    });
  });

  describe('ptToMm', () => {
    it('should convert PDF points to millimeters', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);

      // 72pt → 25.4mm
      expect(converter.ptToMm(72)).toBeCloseTo(25.4, 1);
    });
  });

  describe('convertX', () => {
    it('should convert X coordinate without offset', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);

      expect(converter.convertX(100)).toBeCloseTo(75, 5);
    });

    it('should apply page offset correctly', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);
      converter.setPageOffset(50, 0);

      // 100px - 50px offset = 50px → 37.5pt
      expect(converter.convertX(100)).toBeCloseTo(37.5, 5);
    });
  });

  describe('convertY', () => {
    it('should flip Y axis (CSS top-left origin to PDF bottom-left origin)', () => {
      const pageHeight = 842; // A4 height in pt
      const converter = new UnitConverter(pageHeight);

      // CSS y=0 (top) should become PDF y=pageHeight (top)
      expect(converter.convertY(0, 0)).toBeCloseTo(pageHeight, 1);

      // CSS y=100px with element height 0
      // PDF y = pageHeight - (100 * 0.75) = 842 - 75 = 767
      expect(converter.convertY(100, 0)).toBeCloseTo(767, 1);
    });

    it('should account for element height', () => {
      const pageHeight = 842;
      const converter = new UnitConverter(pageHeight);

      // Element at y=100px with height=50px
      // PDF y (of element bottom-left) = pageHeight - (100 + 50) * 0.75
      // = 842 - 112.5 = 729.5
      expect(converter.convertY(100, 50)).toBeCloseTo(729.5, 1);
    });

    it('should apply page Y offset', () => {
      const pageHeight = 842;
      const converter = new UnitConverter(pageHeight);
      converter.setPageOffset(0, 100);

      // CSS y=150px - offset 100px = 50px
      // PDF y = pageHeight - 50 * 0.75 = 842 - 37.5 = 804.5
      expect(converter.convertY(150, 0)).toBeCloseTo(804.5, 1);
    });
  });

  describe('convertRect', () => {
    it('should convert a complete rectangle', () => {
      const pageHeight = 842;
      const converter = new UnitConverter(pageHeight);

      const cssRect = { x: 100, y: 200, width: 300, height: 150 };
      const pdfRect = converter.convertRect(cssRect);

      expect(pdfRect.x).toBeCloseTo(75, 1);
      expect(pdfRect.width).toBeCloseTo(225, 1);
      expect(pdfRect.height).toBeCloseTo(112.5, 1);
      // y should be flipped and account for height
      expect(pdfRect.y).toBeCloseTo(pageHeight - (200 + 150) * 0.75, 1);
    });
  });

  describe('convertFontSize', () => {
    it('should convert font size from CSS px to PDF pt', () => {
      const converter = new UnitConverter(PAGE_SIZES.A4.height);

      expect(converter.convertFontSize(16)).toBeCloseTo(12, 1);
      expect(converter.convertFontSize(24)).toBeCloseTo(18, 1);
      expect(converter.convertFontSize(12)).toBeCloseTo(9, 1);
    });
  });

  describe('PAGE_SIZES', () => {
    it('should have correct A4 dimensions', () => {
      // A4: 210mm × 297mm
      // In points: 595.28 × 841.89
      expect(PAGE_SIZES.A4.width).toBeCloseTo(595.28, 0);
      expect(PAGE_SIZES.A4.height).toBeCloseTo(841.89, 0);
    });

    it('should have correct Letter dimensions', () => {
      // Letter: 8.5" × 11" = 612pt × 792pt
      expect(PAGE_SIZES.Letter.width).toBe(612);
      expect(PAGE_SIZES.Letter.height).toBe(792);
    });
  });

  describe('fromPageSize', () => {
    it('should create converter for named page size', () => {
      const converter = UnitConverter.fromPageSize('A4');
      expect(converter.getPageHeight()).toBeCloseTo(PAGE_SIZES.A4.height, 1);
    });

    it('should create converter for custom size in mm', () => {
      const converter = UnitConverter.fromPageSize([100, 200]);
      // 200mm in pt = 200 * (72/25.4) ≈ 566.93
      expect(converter.getPageHeight()).toBeCloseTo(566.93, 0);
    });

    it('should handle landscape orientation', () => {
      const converter = UnitConverter.fromPageSize('A4', 'landscape');
      // In landscape, width becomes height
      expect(converter.getPageHeight()).toBeCloseTo(PAGE_SIZES.A4.width, 1);
    });
  });

  describe('convertMargins', () => {
    it('should convert margins from mm to pt', () => {
      const margins = UnitConverter.convertMargins({
        top: 10,
        right: 15,
        bottom: 20,
        left: 25,
      });

      const mmToPt = 72 / 25.4;
      expect(margins.top).toBeCloseTo(10 * mmToPt, 1);
      expect(margins.right).toBeCloseTo(15 * mmToPt, 1);
      expect(margins.bottom).toBeCloseTo(20 * mmToPt, 1);
      expect(margins.left).toBeCloseTo(25 * mmToPt, 1);
    });
  });
});
