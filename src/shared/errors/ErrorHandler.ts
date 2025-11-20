import { AppError } from "./AppError.js";

/**
 * Handles AppError instances
 */
function handleAppError(error: AppError, exitOnError: boolean): void {
  console.error("\n❌ Erreur:", error.getUserMessage());

  // Show technical details in DEBUG mode
  const isDebug = process.env.DEBUG === "true";
  if (isDebug) {
    console.error("\nDétails techniques:");
    console.error(JSON.stringify(error.getDetails(), null, 2));
    console.error("\nStack trace:");
    console.error(error.stack);
  }

  // Only exit if error is operational and exitOnError is true
  if (exitOnError && error.isOperational) {
    process.exit(1);
  }
}

/**
 * Handles generic Error instances
 */
function handleGenericError(error: Error, exitOnError: boolean): void {
  console.error("\n❌ Erreur inattendue:", error.message);

  // Show stack trace in DEBUG mode
  const isDebug = process.env.DEBUG === "true";
  if (isDebug) {
    console.error("\nStack trace:");
    console.error(error.stack);
  }

  if (exitOnError) {
    process.exit(1);
  }
}

/**
 * Handles unknown error types
 */
function handleUnknownError(error: unknown, exitOnError: boolean): void {
  console.error("\n❌ Erreur inconnue:", String(error));
  if (exitOnError) {
    process.exit(1);
  }
}

/**
 * Handles errors in a consistent way
 * @param error - The error to handle
 * @param exitOnError - Whether to exit the process after handling (default: true for CLI)
 */
export function handleError(error: unknown, exitOnError = true): void {
  if (error instanceof AppError) {
    handleAppError(error, exitOnError);
  } else if (error instanceof Error) {
    handleGenericError(error, exitOnError);
  } else {
    handleUnknownError(error, exitOnError);
  }
}

/**
 * Wraps an async function with error handling
 * Useful for top-level command handlers
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic function wrapper needs flexible types
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): (...args: Parameters<T>) => Promise<void> {
  return async (...args: Parameters<T>): Promise<void> => {
    try {
      await fn(...args);
    } catch (error) {
      handleError(error, true);
    }
  };
}

/**
 * Creates a safe version of a function that catches and handles errors
 * Returns undefined if an error occurs
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic function wrapper needs flexible types
export function safe<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    try {
      return fn(...args) as ReturnType<T>;
    } catch (error) {
      handleError(error, false);
      return undefined;
    }
  };
}

/**
 * @deprecated Use handleError, wrapAsync, or safe instead
 * Kept for backward compatibility
 */
export class ErrorHandler {
  static handle = handleError;
  static wrapAsync = wrapAsync;
  static safe = safe;
}
