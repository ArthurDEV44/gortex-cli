import { describe, it, expect } from 'vitest';
import { CommitType } from './CommitType.js';

describe('CommitType', () => {
  describe('create', () => {
    it('should create valid commit types', () => {
      const validTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];

      validTypes.forEach(type => {
        const commitType = CommitType.create(type);
        expect(commitType.getValue()).toBe(type);
      });
    });

    it('should throw error for invalid commit type', () => {
      expect(() => CommitType.create('invalid')).toThrow('Invalid commit type');
      expect(() => CommitType.create('feature')).toThrow('Invalid commit type');
      expect(() => CommitType.create('')).toThrow('Invalid commit type');
    });

    it('should be case-sensitive', () => {
      expect(() => CommitType.create('FEAT')).toThrow('Invalid commit type');
      expect(() => CommitType.create('Feat')).toThrow('Invalid commit type');
    });
  });

  describe('equals', () => {
    it('should return true for equal commit types', () => {
      const type1 = CommitType.create('feat');
      const type2 = CommitType.create('feat');

      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different commit types', () => {
      const type1 = CommitType.create('feat');
      const type2 = CommitType.create('fix');

      expect(type1.equals(type2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const type = CommitType.create('feat');
      expect(type.toString()).toBe('feat');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const type = CommitType.create('feat');

      expect(Object.isFrozen(type)).toBe(true);
    });
  });
});
