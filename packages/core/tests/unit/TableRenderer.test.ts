/**
 * TableRenderer のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  isTableElement,
  isTableCellElement,
  isTableRowElement,
} from '../../src/renderers/TableRenderer.js';

describe('TableRenderer', () => {
  describe('isTableElement', () => {
    it('should be a function', () => {
      expect(typeof isTableElement).toBe('function');
    });
  });

  describe('isTableCellElement', () => {
    it('should be a function', () => {
      expect(typeof isTableCellElement).toBe('function');
    });
  });

  describe('isTableRowElement', () => {
    it('should be a function', () => {
      expect(typeof isTableRowElement).toBe('function');
    });
  });
});
