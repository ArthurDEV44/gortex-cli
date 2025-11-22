import { describe, it, expect } from 'vitest';
import { CommitMessageService } from './CommitMessageService.js';

describe('CommitMessageService', () => {
  describe('createFromAIGenerated', () => {
    it('should create commit message from AI data', () => {
      const data = {
        type: 'feat',
        subject: 'add new feature',
        scope: 'api',
        body: 'This is a description',
        breaking: false,
      };

      const message = CommitMessageService.createFromAIGenerated(data);

      expect(message.getType().getValue()).toBe('feat');
      expect(message.getSubject().getValue()).toBe('add new feature');
      expect(message.getScope()?.getValue()).toBe('api');
      expect(message.getBody()).toBe('This is a description');
      expect(message.isBreaking()).toBe(false);
    });

    it('should create commit message without optional fields', () => {
      const data = {
        type: 'fix',
        subject: 'fix bug',
      };

      const message = CommitMessageService.createFromAIGenerated(data);

      expect(message.getType().getValue()).toBe('fix');
      expect(message.getSubject().getValue()).toBe('fix bug');
      const scope = message.getScope();
      expect(scope === undefined || scope.getValue() === undefined).toBe(true);
      expect(message.getBody()).toBeUndefined();
    });

    it('should create breaking change message', () => {
      const data = {
        type: 'feat',
        subject: 'change API',
        breaking: true,
        breakingChangeDescription: 'API completely rewritten',
      };

      const message = CommitMessageService.createFromAIGenerated(data);

      expect(message.isBreaking()).toBe(true);
      expect(message.getBreakingChangeDescription()).toBe('API completely rewritten');
    });
  });

  describe('createFromUserInput', () => {
    it('should create commit message from user input', () => {
      const message = CommitMessageService.createFromUserInput(
        'feat',
        'add feature',
        'ui',
        'Added new UI component',
        false
      );

      expect(message.getType().getValue()).toBe('feat');
      expect(message.getSubject().getValue()).toBe('add feature');
      expect(message.getScope()?.getValue()).toBe('ui');
      expect(message.getBody()).toBe('Added new UI component');
    });

    it('should create message without scope', () => {
      const message = CommitMessageService.createFromUserInput(
        'docs',
        'update README'
      );

      expect(message.getType().getValue()).toBe('docs');
      expect(message.getSubject().getValue()).toBe('update README');
      const scope = message.getScope();
      expect(scope === undefined || scope.getValue() === undefined).toBe(true);
    });

    it('should create breaking change from user input', () => {
      const message = CommitMessageService.createFromUserInput(
        'refactor',
        'change structure',
        'core',
        'Refactored core module',
        true,
        'Breaking API changes'
      );

      expect(message.isBreaking()).toBe(true);
      expect(message.getBreakingChangeDescription()).toBe('Breaking API changes');
    });
  });

  describe('parseConventionalCommit', () => {
    it('should parse simple conventional commit', () => {
      const result = CommitMessageService.parseConventionalCommit('feat: add feature');

      expect(result).toEqual({
        type: 'feat',
        scope: undefined,
        breaking: false,
        subject: 'add feature',
      });
    });

    it('should parse commit with scope', () => {
      const result = CommitMessageService.parseConventionalCommit('fix(api): fix bug');

      expect(result).toEqual({
        type: 'fix',
        scope: 'api',
        breaking: false,
        subject: 'fix bug',
      });
    });

    it('should parse breaking change with exclamation', () => {
      const result = CommitMessageService.parseConventionalCommit('feat!: breaking change');

      expect(result).toEqual({
        type: 'feat',
        scope: undefined,
        breaking: true,
        subject: 'breaking change',
      });
    });

    it('should parse breaking change with scope', () => {
      const result = CommitMessageService.parseConventionalCommit('refactor(core)!: major refactor');

      expect(result).toEqual({
        type: 'refactor',
        scope: 'core',
        breaking: true,
        subject: 'major refactor',
      });
    });

    it('should handle whitespace in message', () => {
      const result = CommitMessageService.parseConventionalCommit('  feat: add feature  ');

      expect(result?.subject).toBe('add feature');
    });

    it('should return null for invalid format', () => {
      expect(CommitMessageService.parseConventionalCommit('not a commit')).toBeNull();
      expect(CommitMessageService.parseConventionalCommit('invalid commit message')).toBeNull();
      expect(CommitMessageService.parseConventionalCommit('feat add feature')).toBeNull();
    });

    it('should return null for subject too short', () => {
      const result = CommitMessageService.parseConventionalCommit('feat: ab');

      expect(result).toBeNull();
    });

    it('should handle various commit types', () => {
      const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'];

      types.forEach(type => {
        const result = CommitMessageService.parseConventionalCommit(`${type}: test message`);
        expect(result?.type).toBe(type);
      });
    });

    it('should handle complex scopes', () => {
      const result = CommitMessageService.parseConventionalCommit('feat(api-client): add method');

      expect(result?.scope).toBe('api-client');
    });
  });

  describe('isConventional', () => {
    it('should return true for valid conventional commits', () => {
      expect(CommitMessageService.isConventional('feat: add feature')).toBe(true);
      expect(CommitMessageService.isConventional('fix(api): fix bug')).toBe(true);
      expect(CommitMessageService.isConventional('docs!: breaking docs')).toBe(true);
    });

    it('should return false for invalid commits', () => {
      expect(CommitMessageService.isConventional('not conventional')).toBe(false);
      expect(CommitMessageService.isConventional('Add new feature')).toBe(false);
      expect(CommitMessageService.isConventional('feat add feature')).toBe(false);
    });

    it('should return false for empty or short messages', () => {
      expect(CommitMessageService.isConventional('')).toBe(false);
      expect(CommitMessageService.isConventional('feat: a')).toBe(false);
    });
  });

  describe('analyzeCommitStats', () => {
    it('should analyze commit statistics', () => {
      const messages = [
        'feat: add feature',
        'fix: fix bug',
        'not conventional',
        'feat(api): another feature',
        'docs: update docs',
      ];

      const stats = CommitMessageService.analyzeCommitStats(messages);

      expect(stats.total).toBe(5);
      expect(stats.conventional).toBe(4);
      expect(stats.nonConventional).toBe(1);
      expect(stats.percentage).toBe(80);
      expect(stats.typeBreakdown).toEqual({
        feat: 2,
        fix: 1,
        docs: 1,
      });
    });

    it('should handle empty message array', () => {
      const stats = CommitMessageService.analyzeCommitStats([]);

      expect(stats.total).toBe(0);
      expect(stats.conventional).toBe(0);
      expect(stats.nonConventional).toBe(0);
      expect(stats.percentage).toBe(0);
      expect(stats.typeBreakdown).toEqual({});
    });

    it('should handle all non-conventional messages', () => {
      const messages = [
        'Fix bug',
        'Add feature',
        'Update',
      ];

      const stats = CommitMessageService.analyzeCommitStats(messages);

      expect(stats.total).toBe(3);
      expect(stats.conventional).toBe(0);
      expect(stats.nonConventional).toBe(3);
      expect(stats.percentage).toBe(0);
    });

    it('should handle all conventional messages', () => {
      const messages = [
        'feat: add feature 1',
        'feat: add feature 2',
        'fix: fix bug',
      ];

      const stats = CommitMessageService.analyzeCommitStats(messages);

      expect(stats.total).toBe(3);
      expect(stats.conventional).toBe(3);
      expect(stats.nonConventional).toBe(0);
      expect(stats.percentage).toBe(100);
      expect(stats.typeBreakdown).toEqual({
        feat: 2,
        fix: 1,
      });
    });

    it('should count same type multiple times', () => {
      const messages = [
        'feat: feature 1',
        'feat: feature 2',
        'feat: feature 3',
        'fix: bug 1',
      ];

      const stats = CommitMessageService.analyzeCommitStats(messages);

      expect(stats.typeBreakdown.feat).toBe(3);
      expect(stats.typeBreakdown.fix).toBe(1);
    });

    it('should handle breaking changes in stats', () => {
      const messages = [
        'feat!: breaking feature',
        'feat: normal feature',
        'fix(api)!: breaking fix',
      ];

      const stats = CommitMessageService.analyzeCommitStats(messages);

      expect(stats.conventional).toBe(3);
      expect(stats.typeBreakdown.feat).toBe(2);
      expect(stats.typeBreakdown.fix).toBe(1);
    });
  });
});
