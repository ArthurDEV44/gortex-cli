import { describe, it, expect } from 'vitest';
import { BaseAIProvider } from './BaseAIProvider.js';
import type { AIGeneratedCommit } from '../../types.js';
import type { CommitContext } from './base.js';
import { COMMIT_LIMITS } from '../../shared/constants/index.js';

/**
 * Concrete test implementation of BaseAIProvider for testing
 * Since BaseAIProvider is abstract, we need a concrete class to test it
 */
class TestAIProvider extends BaseAIProvider {
  async generateCommitMessage(
    diff: string,
    context: CommitContext,
  ): Promise<AIGeneratedCommit> {
    // Simple mock implementation for testing
    return {
      type: 'feat',
      subject: 'test commit',
      body: undefined,
      breaking: false,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getName(): string {
    return 'TestProvider';
  }

  // Expose protected methods for testing
  public testValidateResponse(response: any): void {
    return this.validateResponse(response);
  }

  public testParseJSON(text: string): any {
    return this.parseJSON(text);
  }

  public testExtractJSON(text: string): string {
    return this.extractJSON(text);
  }
}

describe('BaseAIProvider', () => {
  describe('validateResponse', () => {
    it('should not throw for valid response', () => {
      const provider = new TestAIProvider();
      const validResponse = {
        type: 'feat',
        subject: 'add new feature',
      };

      expect(() => provider.testValidateResponse(validResponse)).not.toThrow();
    });

    it('should throw when type is missing', () => {
      const provider = new TestAIProvider();
      const invalidResponse = {
        subject: 'add feature',
      };

      expect(() => provider.testValidateResponse(invalidResponse)).toThrow(
        'Réponse invalide: "type" manquant ou invalide'
      );
    });

    it('should throw when type is not a string', () => {
      const provider = new TestAIProvider();
      const invalidResponse = {
        type: 123,
        subject: 'add feature',
      };

      expect(() => provider.testValidateResponse(invalidResponse)).toThrow(
        'Réponse invalide: "type" manquant ou invalide'
      );
    });

    it('should throw when subject is missing', () => {
      const provider = new TestAIProvider();
      const invalidResponse = {
        type: 'feat',
      };

      expect(() => provider.testValidateResponse(invalidResponse)).toThrow(
        'Réponse invalide: "subject" manquant ou invalide'
      );
    });

    it('should throw when subject is not a string', () => {
      const provider = new TestAIProvider();
      const invalidResponse = {
        type: 'feat',
        subject: ['not', 'a', 'string'],
      };

      expect(() => provider.testValidateResponse(invalidResponse)).toThrow(
        'Réponse invalide: "subject" manquant ou invalide'
      );
    });

    it('should throw when subject exceeds max length', () => {
      const provider = new TestAIProvider();
      const tooLongSubject = 'a'.repeat(COMMIT_LIMITS.MAX_SUBJECT_LENGTH + 1);
      const invalidResponse = {
        type: 'feat',
        subject: tooLongSubject,
      };

      expect(() => provider.testValidateResponse(invalidResponse)).toThrow(
        `Réponse invalide: "subject" trop long (>${COMMIT_LIMITS.MAX_SUBJECT_LENGTH} chars)`
      );
    });

    it('should not throw when subject is exactly at max length', () => {
      const provider = new TestAIProvider();
      const maxLengthSubject = 'a'.repeat(COMMIT_LIMITS.MAX_SUBJECT_LENGTH);
      const validResponse = {
        type: 'feat',
        subject: maxLengthSubject,
      };

      expect(() => provider.testValidateResponse(validResponse)).not.toThrow();
    });

    it('should accept response with optional fields', () => {
      const provider = new TestAIProvider();
      const responseWithExtras = {
        type: 'feat',
        subject: 'add feature',
        body: 'detailed description',
        breaking: true,
        scope: 'api',
      };

      expect(() => provider.testValidateResponse(responseWithExtras)).not.toThrow();
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON object', () => {
      const provider = new TestAIProvider();
      const jsonString = '{"type":"feat","subject":"add feature"}';
      const result = provider.testParseJSON(jsonString);

      expect(result).toEqual({
        type: 'feat',
        subject: 'add feature',
      });
    });

    it('should parse valid JSON array', () => {
      const provider = new TestAIProvider();
      const jsonString = '[1, 2, 3]';
      const result = provider.testParseJSON(jsonString);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should throw for invalid JSON', () => {
      const provider = new TestAIProvider();
      const invalidJSON = '{type: "feat"}'; // Missing quotes around key

      expect(() => provider.testParseJSON(invalidJSON)).toThrow(
        'Impossible de parser la réponse JSON'
      );
    });

    it('should throw for empty string', () => {
      const provider = new TestAIProvider();

      expect(() => provider.testParseJSON('')).toThrow(
        'Impossible de parser la réponse JSON'
      );
    });

    it('should handle JSON with nested objects', () => {
      const provider = new TestAIProvider();
      const complexJSON = '{"data":{"type":"feat","subject":"test"},"meta":{"timestamp":123}}';
      const result = provider.testParseJSON(complexJSON);

      expect(result).toEqual({
        data: {
          type: 'feat',
          subject: 'test',
        },
        meta: {
          timestamp: 123,
        },
      });
    });
  });

  describe('extractJSON', () => {
    it('should extract JSON from markdown code block with json language', () => {
      const provider = new TestAIProvider();
      const text = '```json\n{"type":"feat","subject":"add feature"}\n```';
      const result = provider.testExtractJSON(text);

      expect(result).toBe('{"type":"feat","subject":"add feature"}');
    });

    it('should extract JSON from markdown code block without language', () => {
      const provider = new TestAIProvider();
      const text = '```\n{"type":"fix","subject":"resolve bug"}\n```';
      const result = provider.testExtractJSON(text);

      expect(result).toBe('{"type":"fix","subject":"resolve bug"}');
    });

    it('should extract JSON object from mixed text', () => {
      const provider = new TestAIProvider();
      const text = 'Here is the commit:\n{"type":"feat","subject":"add feature"}\nDone!';
      const result = provider.testExtractJSON(text);

      expect(result).toBe('{"type":"feat","subject":"add feature"}');
    });

    it('should return trimmed text when no special patterns found', () => {
      const provider = new TestAIProvider();
      const text = '  just plain text  ';
      const result = provider.testExtractJSON(text);

      expect(result).toBe('just plain text');
    });

    it('should handle multiline JSON in code block', () => {
      const provider = new TestAIProvider();
      const text = '```json\n{\n  "type": "feat",\n  "subject": "add feature"\n}\n```';
      const result = provider.testExtractJSON(text);

      expect(result).toBe('{\n  "type": "feat",\n  "subject": "add feature"\n}');
    });

    it('should extract JSON object from text with multiple objects', () => {
      const provider = new TestAIProvider();
      const text = '{"first":"object"} and {"second":"object"}';
      const result = provider.testExtractJSON(text);

      // The regex matches from first { to last }, so it captures all text between
      expect(result).toBe('{"first":"object"} and {"second":"object"}');
    });

    it('should handle code blocks with extra whitespace', () => {
      const provider = new TestAIProvider();
      const text = '```json   \n\n  {"type":"feat"}  \n\n```';
      const result = provider.testExtractJSON(text);

      expect(result).toBe('{"type":"feat"}');
    });

    it('should prioritize code block over plain JSON', () => {
      const provider = new TestAIProvider();
      const text = '{"plain":"json"} ```json\n{"code":"block"}\n```';
      const result = provider.testExtractJSON(text);

      expect(result).toBe('{"code":"block"}');
    });
  });

  describe('abstract methods implementation', () => {
    it('should successfully call implemented abstract methods', async () => {
      const provider = new TestAIProvider();

      // Test getName
      expect(provider.getName()).toBe('TestProvider');

      // Test isAvailable
      const available = await provider.isAvailable();
      expect(available).toBe(true);

      // Test generateCommitMessage
      const result = await provider.generateCommitMessage('diff content', {
        files: ['file1.ts'],
        branch: 'main',
        availableTypes: ['feat', 'fix'],
      });

      expect(result).toEqual({
        type: 'feat',
        subject: 'test commit',
        body: undefined,
        breaking: false,
      });
    });
  });
});
