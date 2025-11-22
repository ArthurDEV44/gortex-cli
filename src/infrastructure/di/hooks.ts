/**
 * React Hooks for Use Cases
 * Convenient hooks to access specific use cases and repositories
 */

import type { AnalyzeCommitHistoryUseCase } from "../../application/use-cases/AnalyzeCommitHistoryUseCase.js";
import type { BranchOperationsUseCase } from "../../application/use-cases/BranchOperationsUseCase.js";
import type { CreateCommitUseCase } from "../../application/use-cases/CreateCommitUseCase.js";
import type { GenerateAICommitUseCase } from "../../application/use-cases/GenerateAICommitUseCase.js";
import type { GetRepositoryStatusUseCase } from "../../application/use-cases/GetRepositoryStatusUseCase.js";
import type { PushOperationsUseCase } from "../../application/use-cases/PushOperationsUseCase.js";
import type { StageFilesUseCase } from "../../application/use-cases/StageFilesUseCase.js";
import type { IAIProvider } from "../../domain/repositories/IAIProvider.js";
import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import { useCompositionRoot, useUseCase } from "./DIContext.js";
import { ServiceIdentifiers } from "./ServiceRegistry.js";

/**
 * Hook to access CreateCommitUseCase
 */
export function useCreateCommit(): CreateCommitUseCase {
  return useUseCase<CreateCommitUseCase>("createCommitUseCase");
}

/**
 * Hook to access GenerateAICommitUseCase
 */
export function useGenerateAICommit(): GenerateAICommitUseCase {
  return useUseCase<GenerateAICommitUseCase>("generateAICommitUseCase");
}

/**
 * Hook to access GetRepositoryStatusUseCase
 */
export function useRepositoryStatus(): GetRepositoryStatusUseCase {
  return useUseCase<GetRepositoryStatusUseCase>("getRepositoryStatusUseCase");
}

/**
 * Hook to access AnalyzeCommitHistoryUseCase
 */
export function useCommitHistory(): AnalyzeCommitHistoryUseCase {
  return useUseCase<AnalyzeCommitHistoryUseCase>("analyzeCommitHistoryUseCase");
}

/**
 * Hook to access StageFilesUseCase
 */
export function useStageFiles(): StageFilesUseCase {
  return useUseCase<StageFilesUseCase>("stageFilesUseCase");
}

/**
 * Hook to access BranchOperationsUseCase
 */
export function useBranchOperations(): BranchOperationsUseCase {
  return useUseCase<BranchOperationsUseCase>("branchOperationsUseCase");
}

/**
 * Hook to access PushOperationsUseCase
 */
export function usePushOperations(): PushOperationsUseCase {
  return useUseCase<PushOperationsUseCase>("pushOperationsUseCase");
}

/**
 * Hook to access GitRepository directly
 * Use this when you need low-level git operations not covered by use cases
 */
export function useGitRepository(): IGitRepository {
  const root = useCompositionRoot();
  return root
    .getContainer()
    .resolve<IGitRepository>(ServiceIdentifiers.GitRepository);
}

/**
 * Hook to access AIProvider directly
 * Use this when you need to check provider availability or other provider-specific operations
 */
export function useAIProvider(): IAIProvider | null {
  const root = useCompositionRoot();
  try {
    return root
      .getContainer()
      .resolve<IAIProvider>(ServiceIdentifiers.AIProvider);
  } catch {
    return null;
  }
}
