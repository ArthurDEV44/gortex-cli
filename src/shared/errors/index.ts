/**
 * Centralized error handling for GORTEX CLI
 *
 * This module provides:
 * - Custom error classes for different error types
 * - Centralized error handler
 * - Error wrapping utilities
 */

export {
  AppError,
  GitRepositoryError,
  NoChangesError,
  ConfigurationError,
  ValidationError,
  AIProviderError,
  AIGenerationError,
  FileSystemError,
  NetworkError,
} from './AppError.js';

export { ErrorHandler } from './ErrorHandler.js';
