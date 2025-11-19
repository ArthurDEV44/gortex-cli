/**
 * Service Registry
 * Centralized configuration of dependency bindings
 */

import { DIContainer } from './DIContainer.js';
import { IGitRepository } from '../../domain/repositories/IGitRepository.js';
import { IAIProvider } from '../../domain/repositories/IAIProvider.js';
import { GitRepositoryImpl } from '../repositories/GitRepositoryImpl.js';
import { AIProviderFactory, AIProviderType } from '../factories/AIProviderFactory.js';
import { RepositoryFactory } from '../factories/RepositoryFactory.js';
import type { AIConfig } from '../../types.js';

// Use Cases
import { CreateCommitUseCase } from '../../application/use-cases/CreateCommitUseCase.js';
import { GenerateAICommitUseCase } from '../../application/use-cases/GenerateAICommitUseCase.js';
import { GetRepositoryStatusUseCase } from '../../application/use-cases/GetRepositoryStatusUseCase.js';
import { AnalyzeCommitHistoryUseCase } from '../../application/use-cases/AnalyzeCommitHistoryUseCase.js';
import { StageFilesUseCase } from '../../application/use-cases/StageFilesUseCase.js';

/**
 * Service identifiers for dependency injection
 */
export const ServiceIdentifiers = {
  // Repositories
  GitRepository: 'IGitRepository',

  // AI Provider
  AIProvider: 'IAIProvider',

  // Use Cases
  CreateCommitUseCase: 'CreateCommitUseCase',
  GenerateAICommitUseCase: 'GenerateAICommitUseCase',
  GetRepositoryStatusUseCase: 'GetRepositoryStatusUseCase',
  AnalyzeCommitHistoryUseCase: 'AnalyzeCommitHistoryUseCase',
  StageFilesUseCase: 'StageFilesUseCase',

  // Configuration
  AIConfig: 'AIConfig',
  WorkingDirectory: 'WorkingDirectory',
} as const;

/**
 * Configuration options for service registration
 */
export interface ServiceRegistrationOptions {
  /** Working directory for git operations */
  workingDirectory?: string;

  /** AI provider type to use */
  aiProviderType?: AIProviderType;

  /** AI configuration */
  aiConfig?: AIConfig;

  /** Use existing git repository instance */
  gitRepository?: IGitRepository;

  /** Use existing AI provider instance */
  aiProvider?: IAIProvider;
}

/**
 * Service Registry
 * Manages service registration and configuration
 */
export class ServiceRegistry {
  /**
   * Registers all application services in the container
   * @param container DI container to register services in
   * @param options Configuration options
   */
  static registerServices(
    container: DIContainer,
    options: ServiceRegistrationOptions = {},
  ): void {
    // Register configuration
    if (options.workingDirectory) {
      container.registerInstance(
        ServiceIdentifiers.WorkingDirectory,
        options.workingDirectory,
      );
    }

    if (options.aiConfig) {
      container.registerInstance(ServiceIdentifiers.AIConfig, options.aiConfig);
    }

    // Register repositories
    this.registerRepositories(container, options);

    // Register AI providers
    this.registerAIProviders(container, options);

    // Register use cases
    this.registerUseCases(container);
  }

  /**
   * Registers repository services
   */
  private static registerRepositories(
    container: DIContainer,
    options: ServiceRegistrationOptions,
  ): void {
    if (options.gitRepository) {
      // Use provided instance
      container.registerInstance(ServiceIdentifiers.GitRepository, options.gitRepository);
    } else {
      // Create new instance
      container.registerSingleton(ServiceIdentifiers.GitRepository, c => {
        const workingDir = c.tryResolve<string>(ServiceIdentifiers.WorkingDirectory);
        return RepositoryFactory.createGitRepository(workingDir);
      });
    }
  }

  /**
   * Registers AI provider services
   */
  private static registerAIProviders(
    container: DIContainer,
    options: ServiceRegistrationOptions,
  ): void {
    if (options.aiProvider) {
      // Use provided instance
      container.registerInstance(ServiceIdentifiers.AIProvider, options.aiProvider);
    } else if (options.aiProviderType) {
      // Create provider based on type
      container.registerSingleton(ServiceIdentifiers.AIProvider, c => {
        const config = c.tryResolve<AIConfig>(ServiceIdentifiers.AIConfig);
        return AIProviderFactory.create(options.aiProviderType!, config);
      });
    } else {
      // Auto-detect first available provider
      container.registerSingleton(ServiceIdentifiers.AIProvider, async c => {
        const config = c.tryResolve<AIConfig>(ServiceIdentifiers.AIConfig);
        const preferredOrder: AIProviderType[] = ['ollama', 'mistral', 'openai'];
        const provider = await AIProviderFactory.findFirstAvailable(
          preferredOrder,
          config,
        );

        if (!provider) {
          throw new Error('No AI provider available. Please install Ollama or configure an API key.');
        }

        return provider;
      });
    }
  }

  /**
   * Registers use case services
   */
  private static registerUseCases(container: DIContainer): void {
    // CreateCommitUseCase
    container.registerTransient(ServiceIdentifiers.CreateCommitUseCase, c =>
      new CreateCommitUseCase(c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository)),
    );

    // GenerateAICommitUseCase
    container.registerTransient(ServiceIdentifiers.GenerateAICommitUseCase, c =>
      new GenerateAICommitUseCase(c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository)),
    );

    // GetRepositoryStatusUseCase
    container.registerTransient(ServiceIdentifiers.GetRepositoryStatusUseCase, c =>
      new GetRepositoryStatusUseCase(c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository)),
    );

    // AnalyzeCommitHistoryUseCase
    container.registerTransient(ServiceIdentifiers.AnalyzeCommitHistoryUseCase, c =>
      new AnalyzeCommitHistoryUseCase(c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository)),
    );

    // StageFilesUseCase
    container.registerTransient(ServiceIdentifiers.StageFilesUseCase, c =>
      new StageFilesUseCase(c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository)),
    );
  }

  /**
   * Creates a fully configured container with all services registered
   * @param options Configuration options
   * @returns Configured DI container
   */
  static createContainer(options: ServiceRegistrationOptions = {}): DIContainer {
    const container = new DIContainer();
    this.registerServices(container, options);
    return container;
  }
}
