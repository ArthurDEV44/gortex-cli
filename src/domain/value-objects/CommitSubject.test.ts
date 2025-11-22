import { describe, it, expect } from 'vitest';
import { CommitSubject } from './CommitSubject.js';
import { COMMIT_LIMITS } from '../../shared/constants/limits.js';

describe('CommitSubject', () => {
  describe('create', () => {
    it('should create valid commit subjects', () => {
      const validSubjects = [
        'add new feature',
        'fix authentication bug',
        'update documentation',
        'refactor code structure',
      ];

      validSubjects.forEach(subject => {
        const subjectObj = CommitSubject.create(subject);
        expect(subjectObj.getValue()).toBe(subject);
      });
    });

    it('should trim whitespace', () => {
      const subject = CommitSubject.create('  add feature  ');
      expect(subject.getValue()).toBe('add feature');
    });

    it('should throw error for empty subject', () => {
      expect(() => CommitSubject.create('')).toThrow('cannot be empty');
      expect(() => CommitSubject.create('   ')).toThrow('cannot be empty');
    });

    it('should throw error for too short subject', () => {
      expect(() => CommitSubject.create('ab')).toThrow('too short');
      expect(() => CommitSubject.create('a')).toThrow('too short');
    });

    it('should accept subject with exactly 3 characters', () => {
      const subject = CommitSubject.create('fix');
      expect(subject.getValue()).toBe('fix');
    });

    it('should throw error for too long subject', () => {
      const tooLong = 'a'.repeat(COMMIT_LIMITS.MAX_SUBJECT_LENGTH + 1);
      expect(() => CommitSubject.create(tooLong)).toThrow('too long');
    });

    it('should accept subject at max length', () => {
      const maxLength = 'a'.repeat(COMMIT_LIMITS.MAX_SUBJECT_LENGTH);
      const subject = CommitSubject.create(maxLength);
      expect(subject.getLength()).toBe(COMMIT_LIMITS.MAX_SUBJECT_LENGTH);
    });

    it('should throw error if starts with uppercase', () => {
      expect(() => CommitSubject.create('Add feature')).toThrow('lowercase letter');
      expect(() => CommitSubject.create('FIX bug')).toThrow('lowercase letter');
    });

    it('should throw error if ends with period', () => {
      expect(() => CommitSubject.create('add feature.')).toThrow('should not end with a period');
    });

    it('should allow periods in the middle', () => {
      const subject = CommitSubject.create('update v2.0 API');
      expect(subject.getValue()).toBe('update v2.0 API');
    });
  });

  describe('getLength', () => {
    it('should return correct length', () => {
      const subject = CommitSubject.create('add feature');
      expect(subject.getLength()).toBe(11);
    });
  });

  describe('equals', () => {
    it('should return true for equal subjects', () => {
      const subject1 = CommitSubject.create('add feature');
      const subject2 = CommitSubject.create('add feature');

      expect(subject1.equals(subject2)).toBe(true);
    });

    it('should return false for different subjects', () => {
      const subject1 = CommitSubject.create('add feature');
      const subject2 = CommitSubject.create('fix bug');

      expect(subject1.equals(subject2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string value', () => {
      const subject = CommitSubject.create('add feature');
      expect(subject.toString()).toBe('add feature');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const subject = CommitSubject.create('add feature');
      expect(Object.isFrozen(subject)).toBe(true);
    });
  });
});
