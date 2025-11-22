import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AppError,
  GitRepositoryError,
  NoChangesError,
  ConfigurationError,
  ValidationError,
  AIProviderError,
  AIGenerationError,
  FileSystemError,
  NetworkError,
} from '../AppError.js';

// Concrete implementation of AppError for testing
class TestAppError extends AppError {
  getUserMessage(): string {
    return `Test error: ${this.message}`;
  }
}

describe('AppError', () => {
  describe('base AppError class', () => {
    it('should create error with message', () => {
      const error = new TestAppError('Test message');

      expect(error.message).toBe('Test message');
      expect(error.name).toBe('TestAppError');
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should allow setting isOperational to false', () => {
      const error = new TestAppError('Test', false);

      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new TestAppError('Test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestAppError');
    });

    it('should get error details', () => {
      const error = new TestAppError('Test message');
      const details = error.getDetails();

      expect(details.name).toBe('TestAppError');
      expect(details.message).toBe('Test message');
      expect(details.isOperational).toBe(true);
      expect(details.timestamp).toBeDefined();
    });
  });

  describe('GitRepositoryError', () => {
    it('should create git repository error', () => {
      const error = new GitRepositoryError('Not a git repository');

      expect(error.message).toBe('Not a git repository');
      expect(error.isOperational).toBe(true);
      expect(error.getUserMessage()).toBe('Erreur Git: Not a git repository');
    });

    it('should be instance of AppError', () => {
      const error = new GitRepositoryError('Test');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(GitRepositoryError);
    });
  });

  describe('NoChangesError', () => {
    it('should create error with default message', () => {
      const error = new NoChangesError();

      expect(error.message).toBe('Aucun changement détecté');
      expect(error.getUserMessage()).toBe('Aucun changement détecté');
    });

    it('should create error with custom message', () => {
      const error = new NoChangesError('No files staged');

      expect(error.message).toBe('No files staged');
      expect(error.getUserMessage()).toBe('No files staged');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error without path', () => {
      const error = new ConfigurationError('Invalid config');

      expect(error.message).toBe('Invalid config');
      expect(error.configPath).toBeUndefined();
      expect(error.getUserMessage()).toBe('Erreur de configuration: Invalid config');
    });

    it('should create configuration error with path', () => {
      const error = new ConfigurationError('Missing required field', '/path/to/config');

      expect(error.configPath).toBe('/path/to/config');
    });

    it('should include config path in details', () => {
      const error = new ConfigurationError('Test', '/config.json');
      const details = error.getDetails();

      expect(details.configPath).toBe('/config.json');
      expect(details.name).toBe('ConfigurationError');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.getUserMessage()).toBe('Validation échouée: Invalid input');
    });

    it('should create validation error with field', () => {
      const error = new ValidationError('Too short', 'subject');

      expect(error.field).toBe('subject');
    });

    it('should create validation error with field and value', () => {
      const error = new ValidationError('Invalid', 'type', 'invalid-type');

      expect(error.field).toBe('type');
      expect(error.value).toBe('invalid-type');
    });

    it('should include field and value in details', () => {
      const error = new ValidationError('Invalid', 'email', 'not-an-email');
      const details = error.getDetails();

      expect(details.field).toBe('email');
      expect(details.value).toBe('not-an-email');
    });
  });

  describe('AIProviderError', () => {
    it('should create AI provider error', () => {
      const error = new AIProviderError('OpenAI', 'Not configured');

      expect(error.providerName).toBe('OpenAI');
      expect(error.message).toBe('Not configured');
      expect(error.getUserMessage()).toBe('Provider OpenAI indisponible: Not configured');
    });

    it('should create AI provider error with reason', () => {
      const error = new AIProviderError('Ollama', 'Connection failed', 'Server not running');

      expect(error.reason).toBe('Server not running');
    });

    it('should include provider details', () => {
      const error = new AIProviderError('Mistral', 'API error', 'Invalid key');
      const details = error.getDetails();

      expect(details.providerName).toBe('Mistral');
      expect(details.reason).toBe('Invalid key');
    });
  });

  describe('AIGenerationError', () => {
    it('should create AI generation error', () => {
      const error = new AIGenerationError('OpenAI', 'Generation failed');

      expect(error.providerName).toBe('OpenAI');
      expect(error.message).toBe('Generation failed');
      expect(error.getUserMessage()).toBe('Erreur de génération avec OpenAI: Generation failed');
    });

    it('should include provider name in details', () => {
      const error = new AIGenerationError('Ollama', 'Timeout');
      const details = error.getDetails();

      expect(details.providerName).toBe('Ollama');
    });
  });

  describe('FileSystemError', () => {
    it('should create file system error', () => {
      const error = new FileSystemError('File not found');

      expect(error.message).toBe('File not found');
      expect(error.getUserMessage()).toBe('Erreur système de fichiers: File not found');
    });

    it('should create error with file path', () => {
      const error = new FileSystemError('Cannot read', '/path/to/file.txt');

      expect(error.filePath).toBe('/path/to/file.txt');
    });

    it('should create error with operation', () => {
      const error = new FileSystemError('Failed', '/file.txt', 'read');

      expect(error.operation).toBe('read');
    });

    it('should include file details', () => {
      const error = new FileSystemError('Error', '/test.txt', 'write');
      const details = error.getDetails();

      expect(details.filePath).toBe('/test.txt');
      expect(details.operation).toBe('write');
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection timeout');

      expect(error.message).toBe('Connection timeout');
      expect(error.getUserMessage()).toBe('Erreur réseau: Connection timeout');
    });

    it('should create error with URL', () => {
      const error = new NetworkError('Failed', 'https://api.example.com');

      expect(error.url).toBe('https://api.example.com');
    });

    it('should create error with status code', () => {
      const error = new NetworkError('Not found', 'https://api.example.com', 404);

      expect(error.statusCode).toBe(404);
    });

    it('should include network details', () => {
      const error = new NetworkError('Server error', 'https://api.test.com', 500);
      const details = error.getDetails();

      expect(details.url).toBe('https://api.test.com');
      expect(details.statusCode).toBe(500);
    });
  });

  describe('error inheritance', () => {
    it('all errors should be instances of AppError', () => {
      expect(new GitRepositoryError('test')).toBeInstanceOf(AppError);
      expect(new NoChangesError()).toBeInstanceOf(AppError);
      expect(new ConfigurationError('test')).toBeInstanceOf(AppError);
      expect(new ValidationError('test')).toBeInstanceOf(AppError);
      expect(new AIProviderError('test', 'test')).toBeInstanceOf(AppError);
      expect(new AIGenerationError('test', 'test')).toBeInstanceOf(AppError);
      expect(new FileSystemError('test')).toBeInstanceOf(AppError);
      expect(new NetworkError('test')).toBeInstanceOf(AppError);
    });

    it('all errors should be instances of Error', () => {
      expect(new GitRepositoryError('test')).toBeInstanceOf(Error);
      expect(new NoChangesError()).toBeInstanceOf(Error);
      expect(new ConfigurationError('test')).toBeInstanceOf(Error);
    });
  });
});
