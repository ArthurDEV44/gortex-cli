import { AppError } from './AppError.js';

/**
 * Centralized error handler for the application
 * Provides consistent error handling and logging
 */
export class ErrorHandler {
  /**
   * Handles errors in a consistent way
   * @param error - The error to handle
   * @param exitOnError - Whether to exit the process after handling (default: true for CLI)
   */
  static handle(error: unknown, exitOnError = true): void {
    if (error instanceof AppError) {
      this.handleAppError(error, exitOnError);
    } else if (error instanceof Error) {
      this.handleGenericError(error, exitOnError);
    } else {
      this.handleUnknownError(error, exitOnError);
    }
  }

  /**
   * Handles application-specific errors
   */
  private static handleAppError(error: AppError, exitOnError: boolean): void {
    // Log error details for debugging
    console.error('\n❌ Erreur:', error.getUserMessage());

    if (process.env.DEBUG === 'true') {
      console.error('\nDétails techniques:');
      console.error(JSON.stringify(error.getDetails(), null, 2));
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    if (exitOnError && error.isOperational) {
      process.exit(1);
    }
  }

  /**
   * Handles generic JavaScript errors
   */
  private static handleGenericError(error: Error, exitOnError: boolean): void {
    console.error('\n❌ Erreur inattendue:', error.message);

    if (process.env.DEBUG === 'true') {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    if (exitOnError) {
      process.exit(1);
    }
  }

  /**
   * Handles unknown error types
   */
  private static handleUnknownError(error: unknown, exitOnError: boolean): void {
    console.error('\n❌ Erreur inconnue:', String(error));

    if (exitOnError) {
      process.exit(1);
    }
  }

  /**
   * Wraps an async function with error handling
   * Useful for top-level command handlers
   */
  static wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
  ): (...args: Parameters<T>) => Promise<void> {
    return async (...args: Parameters<T>): Promise<void> => {
      try {
        await fn(...args);
      } catch (error) {
        this.handle(error, true);
      }
    };
  }

  /**
   * Creates a safe version of a function that catches and handles errors
   * Returns undefined if an error occurs
   */
  static safe<T extends (...args: any[]) => any>(
    fn: T,
  ): (...args: Parameters<T>) => ReturnType<T> | undefined {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, false);
        return undefined;
      }
    };
  }
}
