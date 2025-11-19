/**
 * React Hooks for Use Cases
 * Convenient hooks to access specific use cases
 */

import { useUseCase } from './DIContext.js';
import type { CreateCommitUseCase } from '../../application/use-cases/CreateCommitUseCase.js';
import type { GenerateAICommitUseCase } from '../../application/use-cases/GenerateAICommitUseCase.js';
import type { GetRepositoryStatusUseCase } from '../../application/use-cases/GetRepositoryStatusUseCase.js';
import type { AnalyzeCommitHistoryUseCase } from '../../application/use-cases/AnalyzeCommitHistoryUseCase.js';
import type { StageFilesUseCase } from '../../application/use-cases/StageFilesUseCase.js';

/**
 * Hook to access CreateCommitUseCase
 */
export function useCreateCommit(): CreateCommitUseCase {
  return useUseCase<CreateCommitUseCase>('createCommitUseCase');
}

/**
 * Hook to access GenerateAICommitUseCase
 */
export function useGenerateAICommit(): GenerateAICommitUseCase {
  return useUseCase<GenerateAICommitUseCase>('generateAICommitUseCase');
}

/**
 * Hook to access GetRepositoryStatusUseCase
 */
export function useRepositoryStatus(): GetRepositoryStatusUseCase {
  return useUseCase<GetRepositoryStatusUseCase>('getRepositoryStatusUseCase');
}

/**
 * Hook to access AnalyzeCommitHistoryUseCase
 */
export function useCommitHistory(): AnalyzeCommitHistoryUseCase {
  return useUseCase<AnalyzeCommitHistoryUseCase>('analyzeCommitHistoryUseCase');
}

/**
 * Hook to access StageFilesUseCase
 */
export function useStageFiles(): StageFilesUseCase {
  return useUseCase<StageFilesUseCase>('stageFilesUseCase');
}
