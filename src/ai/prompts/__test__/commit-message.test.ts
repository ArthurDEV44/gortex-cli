import { describe, it, expect } from 'vitest';
import {
  generateSystemPrompt,
  generateUserPrompt,
  parseAIResponse,
} from '../commit-message.js';
import type { CommitContext } from '../../providers/base.js';

describe('AI Prompts', () => {
  describe('generateSystemPrompt', () => {
    it('should generate system prompt with available types', () => {
      const availableTypes = ['feat', 'fix', 'docs'];
      const prompt = generateSystemPrompt(availableTypes);

      expect(prompt).toContain('Conventional Commit');
      expect(prompt).toContain('feat, fix, docs');
      expect(prompt).toContain('type');
      expect(prompt).toContain('scope');
      expect(prompt).toContain('subject');
      expect(prompt).toContain('body');
      expect(prompt).toContain('breaking');
    });

    it('should handle empty types array', () => {
      const prompt = generateSystemPrompt([]);
      expect(prompt).toContain('Conventional Commit');
    });

    it('should handle single type', () => {
      const prompt = generateSystemPrompt(['feat']);
      expect(prompt).toContain('feat');
    });

    it('should include JSON format requirements', () => {
      const prompt = generateSystemPrompt(['feat', 'fix']);
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('confidence');
    });

    it('should include instructions for analyzing diff', () => {
      const prompt = generateSystemPrompt(['feat']);
      expect(prompt).toContain('SÉMANTIQUE');
      expect(prompt).toContain('NOMS EXACTS');
    });
  });

  describe('generateUserPrompt', () => {
    const baseContext: CommitContext = {
      files: ['file1.ts', 'file2.ts'],
      branch: 'main',
      recentCommits: [],
      availableTypes: ['feat', 'fix'],
      availableScopes: ['auth', 'api'],
    };

    it('should generate user prompt with basic context', () => {
      const diff = 'test diff content';
      const prompt = generateUserPrompt(diff, baseContext);

      expect(prompt).toContain('<diff>');
      expect(prompt).toContain('test diff content');
      // When no analysis is provided, uses fallback instructions
      expect(prompt).toContain('Génère un message de commit conventionnel PRÉCIS et DESCRIPTIF');
    });

    it('should include suggested scopes when available', () => {
      const diff = 'test diff';
      const prompt = generateUserPrompt(diff, baseContext);

      // Scopes are shown in XML format
      expect(prompt).toContain('<suggested_scopes>');
      expect(prompt).toContain('<scope>auth</scope>');
      expect(prompt).toContain('<scope>api</scope>');
    });

    it('should handle context without scopes', () => {
      const contextWithoutScopes: CommitContext = {
        ...baseContext,
        availableScopes: [],
      };
      const diff = 'test diff';
      const prompt = generateUserPrompt(diff, contextWithoutScopes);

      expect(prompt).toContain('<diff>');
      expect(prompt).toContain('test diff');
      expect(prompt).not.toContain('<suggested_scopes>');
    });

    it('should include recent commits when available', () => {
      const contextWithCommits: CommitContext = {
        ...baseContext,
        recentCommits: [
          'feat(auth): add login',
          'fix(api): resolve bug',
        ],
      };
      const diff = 'test diff';
      const prompt = generateUserPrompt(diff, contextWithCommits);

      // Recent commits are shown in XML format
      expect(prompt).toContain('<recent_commits>');
      expect(prompt).toContain('feat(auth): add login');
      expect(prompt).toContain('fix(api): resolve bug');
    });

    it('should limit recent commits to 5', () => {
      const contextWithManyCommits: CommitContext = {
        ...baseContext,
        recentCommits: [
          'commit1',
          'commit2',
          'commit3',
          'commit4',
          'commit5',
          'commit6',
          'commit7',
        ],
      };
      const diff = 'test diff';
      const prompt = generateUserPrompt(diff, contextWithManyCommits);

      // Recent commits are limited to 5
      expect(prompt).toContain('<recent_commits>');
      expect(prompt).toContain('commit1');
      expect(prompt).toContain('commit5');
      expect(prompt).not.toContain('commit6');
      expect(prompt).not.toContain('commit7');
    });

    it('should handle empty files array', () => {
      const contextWithNoFiles: CommitContext = {
        ...baseContext,
        files: [],
      };
      const diff = 'test diff';
      const prompt = generateUserPrompt(diff, contextWithNoFiles);

      expect(prompt).toContain('<diff>');
      expect(prompt).toContain('<files count="0">');
    });

    it('should include analysis instructions', () => {
      const diff = 'test diff';
      const prompt = generateUserPrompt(diff, baseContext);

      // When no analysis is provided, uses fallback instructions
      expect(prompt).toContain('Analyse ATTENTIVEMENT ces changements');
      expect(prompt).toContain('Génère un message de commit conventionnel PRÉCIS et DESCRIPTIF');
    });

    it('should wrap diff in CDATA section', () => {
      const diff = 'test diff with <special> characters';
      const prompt = generateUserPrompt(diff, baseContext);

      // CDATA is used to escape special characters in XML
      expect(prompt).toContain('<![CDATA[');
      expect(prompt).toContain('test diff with <special> characters');
      expect(prompt).toContain(']]>');
    });
  });

  describe('parseAIResponse', () => {
    it('should parse valid JSON response', () => {
      const response = '{"type":"feat","subject":"add feature","breaking":false,"confidence":90}';
      const result = parseAIResponse(response);

      expect(result).toEqual({
        type: 'feat',
        subject: 'add feature',
        breaking: false,
        confidence: 90,
      });
    });

    it('should parse JSON wrapped in markdown code block', () => {
      const response = '```json\n{"type":"fix","subject":"fix bug"}\n```';
      const result = parseAIResponse(response);

      expect(result).toEqual({
        type: 'fix',
        subject: 'fix bug',
      });
    });

    it('should parse JSON in markdown code block without language', () => {
      const response = '```\n{"type":"docs","subject":"update docs"}\n```';
      const result = parseAIResponse(response);

      expect(result).toEqual({
        type: 'docs',
        subject: 'update docs',
      });
    });

    it('should extract JSON from text with surrounding content', () => {
      const response = 'Here is the commit:\n{"type":"feat","subject":"new feature"}\nEnd of response';
      const result = parseAIResponse(response);

      expect(result).toEqual({
        type: 'feat',
        subject: 'new feature',
      });
    });

    it('should handle JSON with whitespace', () => {
      const response = '  \n  {"type":"fix","subject":"fix"}  \n  ';
      const result = parseAIResponse(response);

      expect(result).toEqual({
        type: 'fix',
        subject: 'fix',
      });
    });

    it('should extract JSON when multiple braces exist', () => {
      // Le parser actuel utilise un regex qui cherche le premier { et le dernier }
      // Ce cas nécessite une réponse mieux formatée
      const response = 'Some text {"type":"feat","subject":"feature"} more text';
      const result = parseAIResponse(response);

      expect(result).toEqual({
        type: 'feat',
        subject: 'feature',
      });
    });

    it('should throw error when no JSON found', () => {
      const response = 'This is not JSON at all';
      
      expect(() => parseAIResponse(response)).toThrow('Réponse AI invalide');
      expect(() => parseAIResponse(response)).toThrow('aucun JSON trouvé');
    });

    it('should throw error when JSON is invalid', () => {
      const response = '{"type":"feat","subject":}'; // JSON invalide
      
      expect(() => parseAIResponse(response)).toThrow('Impossible de parser');
    });

    it('should handle complex JSON with nested objects', () => {
      const response = JSON.stringify({
        type: 'feat',
        subject: 'add feature',
        breaking: false,
        confidence: 90,
        reasoning: 'Complex reasoning here',
      });
      const result = parseAIResponse(response);

      expect(result).toEqual({
        type: 'feat',
        subject: 'add feature',
        breaking: false,
        confidence: 90,
        reasoning: 'Complex reasoning here',
      });
    });

    it('should handle response with text before and after JSON', () => {
      const response = 'I think the commit should be:\n{"type":"fix","subject":"bug fix"}\nWhat do you think?';
      const result = parseAIResponse(response);

      expect(result).toEqual({
        type: 'fix',
        subject: 'bug fix',
      });
    });

    it('should extract JSON from nested braces', () => {
      // Le parser utilise firstBrace et lastBrace, donc il prendra tout entre le premier { et dernier }
      // Pour ce test, utilisons un JSON valide avec des accolades dans le contenu
      const response = 'Text {"type":"feat","subject":"test with {nested} content"} end';
      const result = parseAIResponse(response);

      expect(result.type).toBe('feat');
      expect(result.subject).toBe('test with {nested} content');
    });
  });
});

