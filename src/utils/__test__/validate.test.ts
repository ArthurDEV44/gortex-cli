import { describe, it, expect } from 'vitest';
import {
  isConventionalCommit,
  parseConventionalCommit,
  formatCommitMessage,
} from '../validate.js';

describe('validate.ts', () => {
  describe('isConventionalCommit', () => {
    it('should return true for valid conventional commit with scope', () => {
      expect(isConventionalCommit('feat(auth): add login')).toBe(true);
      expect(isConventionalCommit('fix(api): resolve timeout')).toBe(true);
      expect(isConventionalCommit('docs(readme): update installation')).toBe(true);
    });

    it('should return true for valid conventional commit without scope', () => {
      expect(isConventionalCommit('feat: add new feature')).toBe(true);
      expect(isConventionalCommit('fix: correct bug')).toBe(true);
      expect(isConventionalCommit('chore: update dependencies')).toBe(true);
    });

    it('should return true for breaking changes with scope', () => {
      expect(isConventionalCommit('feat(api)!: breaking change')).toBe(true);
      expect(isConventionalCommit('refactor(core)!: major refactor')).toBe(true);
    });

    it('should return true for breaking changes without scope', () => {
      expect(isConventionalCommit('feat!: breaking feature')).toBe(true);
      expect(isConventionalCommit('fix!: breaking fix')).toBe(true);
    });

    it('should return true for all valid commit types', () => {
      const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
      types.forEach((type) => {
        expect(isConventionalCommit(`${type}: valid message`)).toBe(true);
      });
    });

    it('should return false for invalid type', () => {
      expect(isConventionalCommit('invalid: not a valid type')).toBe(false);
      expect(isConventionalCommit('feature: should be feat')).toBe(false);
    });

    it('should return false for missing subject', () => {
      expect(isConventionalCommit('feat:')).toBe(false);
      expect(isConventionalCommit('fix(scope):')).toBe(false);
    });

    it('should return false for too short subject (less than 3 chars)', () => {
      expect(isConventionalCommit('feat: ab')).toBe(false);
      expect(isConventionalCommit('fix: a')).toBe(false);
    });

    it('should return false for missing colon', () => {
      expect(isConventionalCommit('feat add feature')).toBe(false);
      expect(isConventionalCommit('fix bug')).toBe(false);
    });

    it('should return false for empty message', () => {
      expect(isConventionalCommit('')).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(isConventionalCommit('  feat: add feature  ')).toBe(true);
      expect(isConventionalCommit('\nfeat: add feature\n')).toBe(true);
    });
  });

  describe('parseConventionalCommit', () => {
    it('should parse simple commit without scope', () => {
      const result = parseConventionalCommit('feat: add new feature');
      expect(result).toEqual({
        type: 'feat',
        scope: undefined,
        breaking: false,
        subject: 'add new feature',
      });
    });

    it('should parse commit with scope', () => {
      const result = parseConventionalCommit('fix(api): resolve timeout');
      expect(result).toEqual({
        type: 'fix',
        scope: 'api',
        breaking: false,
        subject: 'resolve timeout',
      });
    });

    it('should parse breaking change with scope', () => {
      const result = parseConventionalCommit('feat(auth)!: breaking change');
      expect(result).toEqual({
        type: 'feat',
        scope: 'auth',
        breaking: true,
        subject: 'breaking change',
      });
    });

    it('should parse breaking change without scope', () => {
      const result = parseConventionalCommit('feat!: breaking feature');
      expect(result).toEqual({
        type: 'feat',
        scope: undefined,
        breaking: true,
        subject: 'breaking feature',
      });
    });

    it('should parse scope with special characters', () => {
      const result = parseConventionalCommit('feat(api-v2): add endpoint');
      expect(result).toEqual({
        type: 'feat',
        scope: 'api-v2',
        breaking: false,
        subject: 'add endpoint',
      });
    });

    it('should parse subject including everything after colon', () => {
      const result = parseConventionalCommit('feat: add feature\n\nWith body');
      expect(result).toEqual({
        type: 'feat',
        scope: undefined,
        breaking: false,
        subject: 'add feature', // Only captures until first newline based on regex
      });
    });

    it('should return null for invalid format', () => {
      expect(parseConventionalCommit('invalid message')).toBeNull();
      expect(parseConventionalCommit('feat add feature')).toBeNull();
      expect(parseConventionalCommit('')).toBeNull();
    });

    it('should return null for missing subject', () => {
      expect(parseConventionalCommit('feat:')).toBeNull();
      expect(parseConventionalCommit('fix(scope):')).toBeNull();
    });
  });

  describe('formatCommitMessage', () => {
    it('should format simple commit without scope', () => {
      const result = formatCommitMessage('feat', undefined, 'add new feature');
      expect(result).toBe('feat: add new feature');
    });

    it('should format commit with scope', () => {
      const result = formatCommitMessage('fix', 'api', 'resolve timeout');
      expect(result).toBe('fix(api): resolve timeout');
    });

    it('should format commit with body', () => {
      const result = formatCommitMessage(
        'feat',
        undefined,
        'add feature',
        'This is the body\nwith multiple lines'
      );
      expect(result).toBe('feat: add feature\n\nThis is the body\nwith multiple lines');
    });

    it('should format breaking change with scope', () => {
      const result = formatCommitMessage('feat', 'api', 'breaking change', undefined, true);
      expect(result).toBe('feat(api)!: breaking change');
    });

    it('should format breaking change without scope', () => {
      const result = formatCommitMessage('feat', undefined, 'breaking feature', undefined, true);
      expect(result).toBe('feat!: breaking feature');
    });

    it('should format breaking change with description', () => {
      const result = formatCommitMessage(
        'feat',
        'api',
        'change endpoint',
        'Updated the API',
        true,
        'Endpoint /old is now /new'
      );
      expect(result).toBe(
        'feat(api)!: change endpoint\n\nUpdated the API\n\nBREAKING CHANGE: Endpoint /old is now /new'
      );
    });

    it('should format complete commit with all fields', () => {
      const result = formatCommitMessage(
        'refactor',
        'core',
        'restructure codebase',
        'Moved files to new structure\nUpdated imports',
        false
      );
      expect(result).toBe(
        'refactor(core): restructure codebase\n\nMoved files to new structure\nUpdated imports'
      );
    });

    it('should not include scope when scope is empty string', () => {
      const result = formatCommitMessage('feat', '', 'add feature');
      // Empty string is falsy, so it's treated as no scope
      expect(result).toBe('feat: add feature');
    });

    it('should not add breaking change description if not breaking', () => {
      const result = formatCommitMessage(
        'feat',
        undefined,
        'add feature',
        'Body text',
        false,
        'Should not appear'
      );
      expect(result).not.toContain('BREAKING CHANGE');
      expect(result).toBe('feat: add feature\n\nBody text');
    });

    it('should handle special characters in subject', () => {
      const result = formatCommitMessage('feat', 'api', 'add /endpoint & <params>');
      expect(result).toBe('feat(api): add /endpoint & <params>');
    });
  });
});
