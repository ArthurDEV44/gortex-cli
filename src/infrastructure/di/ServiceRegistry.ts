/**
 * Service Registry
 * Centralized configuration of dependency bindings
 */

import { AnalyzeCommitHistoryUseCase } from "../../application/use-cases/AnalyzeCommitHistoryUseCase.js";
import { BranchOperationsUseCase } from "../../application/use-cases/BranchOperationsUseCase.js";
import { CreateCommitUseCase } from "../../application/use-cases/CreateCommitUseCase.js";
import { GenerateAICommitUseCase } from "../../application/use-cases/GenerateAICommitUseCase.js";
import { GetRepositoryStatusUseCase } from "../../application/use-cases/GetRepositoryStatusUseCase.js";
import { PushOperationsUseCase } from "../../application/use-cases/PushOperationsUseCase.js";
import { StageFilesUseCase } from "../../application/use-cases/StageFilesUseCase.js";
import type { IAIProvider } from "../../domain/repositories/IAIProvider.js";
import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import type { AIConfig } from "../../types.js";
import {
  AIProviderFactory,
  type AIProviderType,
} from "../factories/AIProviderFactory.js";
import { RepositoryFactory } from "../factories/RepositoryFactory.js";
import { DIContainer } from "./DIContainer.js";

/**
 * Service identifiers for dependency injection
 */
export const ServiceIdentifiers = {
  // Repositories
  GitRepository: "IGitRepository",

  // AI Provider
  AIProvider: "IAIProvider",

  // Use Cases
  CreateCommitUseCase: "CreateCommitUseCase",
  GenerateAICommitUseCase: "GenerateAICommitUseCase",
  GetRepositoryStatusUseCase: "GetRepositoryStatusUseCase",
  AnalyzeCommitHistoryUseCase: "AnalyzeCommitHistoryUseCase",
  StageFilesUseCase: "StageFilesUseCase",
  BranchOperationsUseCase: "BranchOperationsUseCase",
  PushOperationsUseCase: "PushOperationsUseCase",

  // Configuration
  AIConfig: "AIConfig",
  WorkingDirectory: "WorkingDirectory",
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
    ServiceRegistry.registerRepositories(container, options);

    // Register AI providers
    ServiceRegistry.registerAIProviders(container, options);

    // Register use cases
    ServiceRegistry.registerUseCases(container);
  }

  /**
   * Creates a fully configured container with all services registered
   * @param options Configuration options
   * @returns Configured DI container
   */
  static createContainer(
    options: ServiceRegistrationOptions = {},
  ): DIContainer {
    const container = new DIContainer();
    ServiceRegistry.registerServices(container, options);
    return container;
  }

  /**
   * Registers repository services
   * @param container DI container
   * @param options Configuration options
   */
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used by registerServices
  private static registerRepositories(
    container: DIContainer,
    options: ServiceRegistrationOptions,
  ): void {
    if (options.gitRepository) {
      container.registerInstance(
        ServiceIdentifiers.GitRepository,
        options.gitRepository,
      );
    } else {
      const workingDir = options.workingDirectory;
      container.registerSingleton(ServiceIdentifiers.GitRepository, () =>
        RepositoryFactory.createGitRepository(workingDir),
      );
    }
  }

  /**
   * Registers AI provider services
   * @param container DI container
   * @param options Configuration options
   */
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used by registerServices
  private static registerAIProviders(
    container: DIContainer,
    options: ServiceRegistrationOptions,
  ): void {
    if (options.aiProvider) {
      container.registerInstance(
        ServiceIdentifiers.AIProvider,
        options.aiProvider,
      );
    } else {
      const providerType = options.aiProviderType || "ollama";
      const aiConfig = options.aiConfig;
      container.registerSingleton(ServiceIdentifiers.AIProvider, () =>
        AIProviderFactory.create(providerType, aiConfig),
      );
    }
  }

  /**
   * Registers use case services
   * @param container DI container
   */
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used by registerServices
  private static registerUseCases(container: DIContainer): void {
    // Register CreateCommitUseCase
    container.registerTransient(
      ServiceIdentifiers.CreateCommitUseCase,
      (c) =>
        new CreateCommitUseCase(
          c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository),
        ),
    );

    // Register GenerateAICommitUseCase
    container.registerTransient(
      ServiceIdentifiers.GenerateAICommitUseCase,
      (c) =>
        new GenerateAICommitUseCase(
          c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository),
        ),
    );

    // Register GetRepositoryStatusUseCase
    container.registerTransient(
      ServiceIdentifiers.GetRepositoryStatusUseCase,
      (c) =>
        new GetRepositoryStatusUseCase(
          c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository),
        ),
    );

    // Register AnalyzeCommitHistoryUseCase
    container.registerTransient(
      ServiceIdentifiers.AnalyzeCommitHistoryUseCase,
      (c) =>
        new AnalyzeCommitHistoryUseCase(
          c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository),
        ),
    );

    // Register StageFilesUseCase
    container.registerTransient(
      ServiceIdentifiers.StageFilesUseCase,
      (c) =>
        new StageFilesUseCase(
          c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository),
        ),
    );

    // Register BranchOperationsUseCase
    container.registerTransient(
      ServiceIdentifiers.BranchOperationsUseCase,
      (c) =>
        new BranchOperationsUseCase(
          c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository),
        ),
    );

    // Register PushOperationsUseCase
    container.registerTransient(
      ServiceIdentifiers.PushOperationsUseCase,
      (c) =>
        new PushOperationsUseCase(
          c.resolve<IGitRepository>(ServiceIdentifiers.GitRepository),
        ),
    );
  }
}
