import { describe, it, expect } from 'vitest';
import { Scope } from './Scope.js';

describe('Scope', () => {
  describe('create', () => {
    it('should create valid scopes', () => {
      const validScopes = ['api', 'ui', 'auth', 'database', 'core', 'api-v2'];

      validScopes.forEach(scope => {
        const scopeObj = Scope.create(scope);
        expect(scopeObj.getValue()).toBe(scope);
      });
    });

    it('should handle undefined as empty scope', () => {
      const scope = Scope.create(undefined);
      expect(scope.isEmpty()).toBe(true);
      expect(scope.getValue()).toBeUndefined();
    });

    it('should handle null as empty scope', () => {
      const scope = Scope.create(null as any);
      expect(scope.isEmpty()).toBe(true);
      expect(scope.getValue()).toBeUndefined();
    });

    it('should throw error for empty string', () => {
      expect(() => Scope.create('')).toThrow('Scope cannot be empty');
    });

    it('should throw error for whitespace-only', () => {
      expect(() => Scope.create('   ')).toThrow('Scope cannot be empty');
      expect(() => Scope.create('\t\n')).toThrow('Scope cannot be empty');
    });

    it('should throw error for invalid characters', () => {
      expect(() => Scope.create('API')).toThrow('lowercase letters');
      expect(() => Scope.create('api_v2')).toThrow('lowercase letters');
      expect(() => Scope.create('api/v2')).toThrow('lowercase letters');
      expect(() => Scope.create('api v2')).toThrow('lowercase letters');
    });

    it('should trim whitespace', () => {
      const scope = Scope.create('  api  ');
      expect(scope.getValue()).toBe('api');
    });
  });

  describe('empty', () => {
    it('should create empty scope', () => {
      const scope = Scope.empty();
      expect(scope.isEmpty()).toBe(true);
      expect(scope.getValue()).toBeUndefined();
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty scope', () => {
      const scope = Scope.empty();
      expect(scope.isEmpty()).toBe(true);
    });

    it('should return false for non-empty scope', () => {
      const scope = Scope.create('api');
      expect(scope.isEmpty()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal scopes', () => {
      const scope1 = Scope.create('api');
      const scope2 = Scope.create('api');

      expect(scope1.equals(scope2)).toBe(true);
    });

    it('should return false for different scopes', () => {
      const scope1 = Scope.create('api');
      const scope2 = Scope.create('ui');

      expect(scope1.equals(scope2)).toBe(false);
    });

    it('should return true for two empty scopes', () => {
      const scope1 = Scope.empty();
      const scope2 = Scope.create(undefined);

      expect(scope1.equals(scope2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return string value', () => {
      const scope = Scope.create('api');
      expect(scope.toString()).toBe('api');
    });

    it('should return empty string for empty scope', () => {
      const scope = Scope.empty();
      expect(scope.toString()).toBe('');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const scope = Scope.create('api');
      expect(Object.isFrozen(scope)).toBe(true);
    });
  });
});
