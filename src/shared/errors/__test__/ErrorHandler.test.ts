import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../ErrorHandler.js';
import { ConfigurationError } from '../AppError.js';

describe('ErrorHandler', () => {
  let exitSpy: any;
  let errorSpy: any;

  beforeEach(() => {
    // Spy on process.exit and console.error
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.DEBUG;
  });

  describe('handle', () => {
    it('should call handleAppError for AppError instances', () => {
      const error = new ConfigurationError('Config file missing');
      ErrorHandler.handle(error);
      expect(errorSpy).toHaveBeenCalledWith('\n❌ Erreur:', 'Erreur de configuration: Config file missing');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should call handleGenericError for Error instances', () => {
      const error = new Error('Generic error');
      ErrorHandler.handle(error);
      expect(errorSpy).toHaveBeenCalledWith('\n❌ Erreur inattendue:', 'Generic error');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should call handleUnknownError for other types', () => {
      const error = 'Just a string error';
      ErrorHandler.handle(error);
      expect(errorSpy).toHaveBeenCalledWith('\n❌ Erreur inconnue:', 'Just a string error');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should not exit if exitOnError is false', () => {
      const error = new Error('Non-fatal error');
      ErrorHandler.handle(error, false);
      expect(errorSpy).toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleAppError', () => {
    it('should show user message', () => {
      const error = new ConfigurationError('user-friendly message');
      ErrorHandler.handle(error);
      expect(errorSpy).toHaveBeenCalledWith(
        '\n❌ Erreur:',
        'Erreur de configuration: user-friendly message'
      );
    });

    it('should show technical details when DEBUG is true', () => {
      process.env.DEBUG = 'true';
      const error = new ConfigurationError('debug message', 'path/to/config');
      ErrorHandler.handle(error);
      expect(errorSpy).toHaveBeenCalledWith('\nDétails techniques:');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"configPath": "path/to/config"')
      );
      expect(errorSpy).toHaveBeenCalledWith('\nStack trace:');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ConfigurationError')
      );
    });

    it('should not show technical details by default', () => {
      const error = new ConfigurationError('no details');
      ErrorHandler.handle(error);
      expect(errorSpy).not.toHaveBeenCalledWith('\nDétails techniques:');
      expect(errorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:')
      );
    });

    it('should exit if error is operational', () => {
      // All AppErrors are operational by default unless specified
      const error = new ConfigurationError('exit');
      ErrorHandler.handle(error, true);
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should not exit if error is not operational, even with exitOnError=true', () => {
      // Create a non-operational error by creating an instance and overriding isOperational
      const error = new ConfigurationError('dont-exit');
      // Override the readonly property using Object.defineProperty
      Object.defineProperty(error, 'isOperational', {
        value: false,
        writable: true,
        configurable: true,
      });
      ErrorHandler.handle(error, true);
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleGenericError', () => {
    it('should show error message', () => {
      const error = new Error('Something broke');
      ErrorHandler.handle(error);
      expect(errorSpy).toHaveBeenCalledWith('\n❌ Erreur inattendue:', 'Something broke');
    });

    it('should show stack trace when DEBUG is true', () => {
      process.env.DEBUG = 'true';
      const error = new Error('debug me');
      ErrorHandler.handle(error);
      expect(errorSpy).toHaveBeenCalledWith('\nStack trace:');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error: debug me'));
    });
  });

  describe('wrapAsync', () => {
    it('should execute the function without errors', async () => {
      const mockFn = vi.fn().mockResolvedValue(42);
      const wrapped = ErrorHandler.wrapAsync(mockFn);
      await wrapped('arg1');
      expect(mockFn).toHaveBeenCalledWith('arg1');
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should handle thrown errors', async () => {
      const error = new Error('Async fail');
      const mockFn = vi.fn().mockRejectedValue(error);
      const wrapped = ErrorHandler.wrapAsync(mockFn);
      await wrapped();
      expect(mockFn).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith('\n❌ Erreur inattendue:', 'Async fail');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('safe', () => {
    it('should return the result of the function', () => {
      const mockFn = (a: number, b: number) => a + b;
      const safeFn = ErrorHandler.safe(mockFn);
      const result = safeFn(2, 3);
      expect(result).toBe(5);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should return undefined and handle error on throw', () => {
      const error = new Error('Sync fail');
      const mockFn = () => {
        throw error;
      };
      const safeFn = ErrorHandler.safe(mockFn);
      const result = safeFn();
      expect(result).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith('\n❌ Erreur inattendue:', 'Sync fail');
      // exitOnError is false by default in .safe()
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });
});
