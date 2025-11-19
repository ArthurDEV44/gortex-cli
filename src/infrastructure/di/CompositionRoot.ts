/**
 * Composition Root
 * Application bootstrap and dependency composition
 */

import { DIContainer } from './DIContainer.js';
import { ServiceRegistry, ServiceRegistrationOptions, ServiceIdentifiers } from './ServiceRegistry.js';
import { CreateCommitUseCase } from '../../application/use-cases/CreateCommitUseCase.js';
import { GenerateAICommitUseCase } from '../../application/use-cases/GenerateAICommitUseCase.js';
import { GetRepositoryStatusUseCase } from '../../application/use-cases/GetRepositoryStatusUseCase.js';
import { AnalyzeCommitHistoryUseCase } from '../../application/use-cases/AnalyzeCommitHistoryUseCase.js';
import { StageFilesUseCase } from '../../application/use-cases/StageFilesUseCase.js';

/**
 * Application services accessible via composition root
 */
export interface ApplicationServices {
  // Use Cases
  createCommitUseCase: CreateCommitUseCase;
  generateAICommitUseCase: GenerateAICommitUseCase;
  getRepositoryStatusUseCase: GetRepositoryStatusUseCase;
  analyzeCommitHistoryUseCase: AnalyzeCommitHistoryUseCase;
  stageFilesUseCase: StageFilesUseCase;
}

/**
 * Composition Root
 * Single point of entry for dependency injection and application bootstrap
 */
export class CompositionRoot {
  private container: DIContainer;
  private services?: ApplicationServices;

  /**
   * Creates a new composition root
   * @param options Service registration options
   */
  constructor(options: ServiceRegistrationOptions = {}) {
    this.container = new DIContainer();
    ServiceRegistry.registerServices(this.container, options);
  }

  /**
   * Gets the DI container
   * Use this for advanced scenarios or testing
   */
  getContainer(): DIContainer {
    return this.container;
  }

  /**
   * Gets all application services
   * Services are lazily resolved and cached
   */
  getServices(): ApplicationServices {
    if (!this.services) {
      this.services = {
        createCommitUseCase: this.container.resolve<CreateCommitUseCase>(
          ServiceIdentifiers.CreateCommitUseCase,
        ),
        generateAICommitUseCase: this.container.resolve<GenerateAICommitUseCase>(
          ServiceIdentifiers.GenerateAICommitUseCase,
        ),
        getRepositoryStatusUseCase: this.container.resolve<GetRepositoryStatusUseCase>(
          ServiceIdentifiers.GetRepositoryStatusUseCase,
        ),
        analyzeCommitHistoryUseCase: this.container.resolve<AnalyzeCommitHistoryUseCase>(
          ServiceIdentifiers.AnalyzeCommitHistoryUseCase,
        ),
        stageFilesUseCase: this.container.resolve<StageFilesUseCase>(
          ServiceIdentifiers.StageFilesUseCase,
        ),
      };
    }

    return this.services;
  }

  /**
   * Gets a specific use case
   * @param useCase Use case identifier
   */
  getUseCase<T>(useCase: keyof ApplicationServices): T {
    return this.getServices()[useCase] as T;
  }

  /**
   * Creates a child composition root
   * Useful for creating isolated scopes (e.g., per-request in API)
   * @param options Additional options for child
   */
  createChild(options: ServiceRegistrationOptions = {}): CompositionRoot {
    const child = new CompositionRoot(options);
    // The child gets a fresh container but we could copy parent if needed
    return child;
  }

  /**
   * Disposes the composition root and clears services
   * Call this when shutting down the application
   */
  dispose(): void {
    this.services = undefined;
    this.container.clear();
  }
}

/**
 * Global composition root instance
 * Use this for simple applications with a single global context
 */
let globalRoot: CompositionRoot | undefined;

/**
 * Gets or creates the global composition root
 * @param options Options for creating the root (only used if root doesn't exist)
 */
export function getGlobalCompositionRoot(
  options?: ServiceRegistrationOptions,
): CompositionRoot {
  if (!globalRoot) {
    globalRoot = new CompositionRoot(options);
  }
  return globalRoot;
}

/**
 * Resets the global composition root
 * Useful for testing
 */
export function resetGlobalCompositionRoot(): void {
  if (globalRoot) {
    globalRoot.dispose();
    globalRoot = undefined;
  }
}

/**
 * Helper to quickly get a use case from the global root
 * @param useCase Use case identifier
 */
export function getUseCase<T>(useCase: keyof ApplicationServices): T {
  return getGlobalCompositionRoot().getUseCase<T>(useCase);
}
