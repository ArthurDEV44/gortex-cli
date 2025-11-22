/**
 * Centralized error handling for GORTEX CLI
 *
 * This module provides:
 * - Custom error classes for different error types
 * - Centralized error handler
 * - Error wrapping utilities
 */

export {
  AIGenerationError,
  AIProviderError,
  AppError,
  ConfigurationError,
  FileSystemError,
  GitRepositoryError,
  NetworkError,
  NoChangesError,
  ValidationError,
} from "./AppError.js";

export { ErrorHandler } from "./ErrorHandler.js";
