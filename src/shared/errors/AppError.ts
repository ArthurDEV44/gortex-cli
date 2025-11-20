/**
 * Base application error class
 * All custom errors should extend this class
 */
export abstract class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(message: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Returns a user-friendly error message
   */
  abstract getUserMessage(): string;

  /**
   * Returns error details for logging
   */
  getDetails(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
    };
  }
}

/**
 * Error thrown when Git repository is not found or invalid
 */
export class GitRepositoryError extends AppError {
  constructor(message: string) {
    super(message, true);
  }

  getUserMessage(): string {
    return `Erreur Git: ${this.message}`;
  }
}

/**
 * Error thrown when no changes are detected
 */
export class NoChangesError extends AppError {
  constructor(message = "Aucun changement détecté") {
    super(message, true);
  }

  getUserMessage(): string {
    return this.message;
  }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigurationError extends AppError {
  public readonly configPath?: string;

  constructor(message: string, configPath?: string) {
    super(message, true);
    this.configPath = configPath;
  }

  getUserMessage(): string {
    return `Erreur de configuration: ${this.message}`;
  }

  getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      configPath: this.configPath,
    };
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(message: string, field?: string, value?: unknown) {
    super(message, true);
    this.field = field;
    this.value = value;
  }

  getUserMessage(): string {
    return `Validation échouée: ${this.message}`;
  }

  getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      field: this.field,
      value: this.value,
    };
  }
}

/**
 * Error thrown when AI provider is not available
 */
export class AIProviderError extends AppError {
  public readonly providerName: string;
  public readonly reason?: string;

  constructor(providerName: string, message: string, reason?: string) {
    super(message, true);
    this.providerName = providerName;
    this.reason = reason;
  }

  getUserMessage(): string {
    return `Provider ${this.providerName} indisponible: ${this.message}`;
  }

  getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      providerName: this.providerName,
      reason: this.reason,
    };
  }
}

/**
 * Error thrown when AI generation fails
 */
export class AIGenerationError extends AppError {
  public readonly providerName: string;

  constructor(providerName: string, message: string) {
    super(message, true);
    this.providerName = providerName;
  }

  getUserMessage(): string {
    return `Erreur de génération avec ${this.providerName}: ${this.message}`;
  }

  getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      providerName: this.providerName,
    };
  }
}

/**
 * Error thrown when file system operations fail
 */
export class FileSystemError extends AppError {
  public readonly filePath?: string;
  public readonly operation?: string;

  constructor(message: string, filePath?: string, operation?: string) {
    super(message, true);
    this.filePath = filePath;
    this.operation = operation;
  }

  getUserMessage(): string {
    return `Erreur système de fichiers: ${this.message}`;
  }

  getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      filePath: this.filePath,
      operation: this.operation,
    };
  }
}

/**
 * Error thrown when network operations fail
 */
export class NetworkError extends AppError {
  public readonly url?: string;
  public readonly statusCode?: number;

  constructor(message: string, url?: string, statusCode?: number) {
    super(message, true);
    this.url = url;
    this.statusCode = statusCode;
  }

  getUserMessage(): string {
    return `Erreur réseau: ${this.message}`;
  }

  getDetails(): Record<string, unknown> {
    return {
      ...super.getDetails(),
      url: this.url,
      statusCode: this.statusCode,
    };
  }
}
