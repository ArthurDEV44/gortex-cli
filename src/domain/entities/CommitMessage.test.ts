import { describe, it, expect } from 'vitest';
import { CommitMessage } from './CommitMessage.js';
import { CommitType } from '../value-objects/CommitType.js';
import { Scope } from '../value-objects/Scope.js';
import { CommitSubject } from '../value-objects/CommitSubject.js';

describe('CommitMessage', () => {
  describe('create', () => {
    it('should create valid commit message', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add new feature'),
      });

      expect(message.getType().getValue()).toBe('feat');
      expect(message.getSubject().getValue()).toBe('add new feature');
    });

    it('should create commit message with scope', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add new feature'),
        scope: Scope.create('api'),
      });

      expect(message.getScope().getValue()).toBe('api');
    });

    it('should create commit message with body', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add new feature'),
        body: 'This is a detailed description',
      });

      expect(message.getBody()).toBe('This is a detailed description');
    });

    it('should create breaking change commit', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('change API'),
        breaking: true,
        breakingChangeDescription: 'API endpoint changed',
      });

      expect(message.isBreaking()).toBe(true);
      expect(message.getBreakingChangeDescription()).toBe('API endpoint changed');
    });

    it('should default scope to empty if not provided', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
      });

      expect(message.getScope().isEmpty()).toBe(true);
    });

    it('should default breaking to false if not provided', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
      });

      expect(message.isBreaking()).toBe(false);
    });

    it('should throw error for too short body', () => {
      expect(() =>
        CommitMessage.create({
          type: CommitType.create('feat'),
          subject: CommitSubject.create('add feature'),
          body: 'short',
        })
      ).toThrow('body too short');
    });

    it('should allow body with exactly 10 characters', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
        body: '1234567890',
      });

      expect(message.getBody()).toBe('1234567890');
    });

    it('should allow undefined body', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
        body: undefined,
      });

      expect(message.getBody()).toBeUndefined();
    });

    it('should trim body whitespace', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
        body: '  This is the body  ',
      });

      expect(message.getBody()).toBe('This is the body');
    });
  });

  describe('format', () => {
    it('should format simple commit without scope', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add new feature'),
      });

      expect(message.format()).toBe('feat: add new feature');
    });

    it('should format commit with scope', () => {
      const message = CommitMessage.create({
        type: CommitType.create('fix'),
        subject: CommitSubject.create('resolve timeout'),
        scope: Scope.create('api'),
      });

      expect(message.format()).toBe('fix(api): resolve timeout');
    });

    it('should format commit with body', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
        body: 'This is a detailed description',
      });

      expect(message.format()).toBe('feat: add feature\n\nThis is a detailed description');
    });

    it('should format breaking change with scope', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('change API'),
        scope: Scope.create('api'),
        breaking: true,
      });

      expect(message.format()).toBe('feat(api)!: change API');
    });

    it('should format breaking change without scope', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('change API'),
        breaking: true,
      });

      expect(message.format()).toBe('feat!: change API');
    });

    it('should format breaking change with description', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('change endpoint'),
        breaking: true,
        breakingChangeDescription: 'Endpoint /old is now /new',
      });

      expect(message.format()).toBe(
        'feat!: change endpoint\n\nBREAKING CHANGE: Endpoint /old is now /new'
      );
    });

    it('should format complete commit with all fields', () => {
      const message = CommitMessage.create({
        type: CommitType.create('refactor'),
        subject: CommitSubject.create('restructure codebase'),
        scope: Scope.create('core'),
        body: 'Moved files to new structure',
      });

      expect(message.format()).toBe(
        'refactor(core): restructure codebase\n\nMoved files to new structure'
      );
    });
  });

  describe('equals', () => {
    it('should return true for equal commit messages', () => {
      const message1 = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
      });

      const message2 = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
      });

      expect(message1.equals(message2)).toBe(true);
    });

    it('should return false for different commit messages', () => {
      const message1 = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
      });

      const message2 = CommitMessage.create({
        type: CommitType.create('fix'),
        subject: CommitSubject.create('fix bug'),
      });

      expect(message1.equals(message2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted commit message', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
      });

      expect(message.toString()).toBe('feat: add feature');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const message = CommitMessage.create({
        type: CommitType.create('feat'),
        subject: CommitSubject.create('add feature'),
      });

      expect(Object.isFrozen(message)).toBe(true);
    });
  });
});
