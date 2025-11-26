import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgenticCommitGenerationUseCase } from '../AgenticCommitGenerationUseCase.js';
import type { IGitRepository } from '../../../domain/repositories/IGitRepository.js';
import type { IAIProvider } from '../../../domain/repositories/IAIProvider.js';
import type { IASTDiffAnalyzer } from '../../../domain/services/ASTDiffAnalyzer.js';
import type { IProjectStyleAnalyzer } from '../../../domain/services/ProjectStyleAnalyzer.js';
import { CommitMessage } from '../../../domain/entities/CommitMessage.js';
import { CommitType } from '../../../domain/value-objects/CommitType.js';
import { CommitSubject } from '../../../domain/value-objects/CommitSubject.js';
import { Scope } from '../../../domain/value-objects/Scope.js';

// Helper to create a CommitMessage easily
function createCommitMessage(type: string, subject: string, scope?: string) {
  return CommitMessage.create({
    type: CommitType.create(type),
    subject: CommitSubject.create(subject),
    scope: scope ? Scope.create(scope) : Scope.empty(),
    breaking: false,
  });
}

describe('AgenticCommitGenerationUseCase', () => {
  let useCase: AgenticCommitGenerationUseCase;
  let mockGitRepo: IGitRepository;
  let mockAIProvider: IAIProvider;
  let mockASTAnalyzer: IASTDiffAnalyzer;
  let mockStyleAnalyzer: IProjectStyleAnalyzer;

  beforeEach(() => {
    // Mock Git Repository
    mockGitRepo = {
      isRepository: vi.fn().mockResolvedValue(true),
      getStagedChangesContext: vi.fn().mockResolvedValue({
        diff: 'test diff content',
        files: ['test.ts'],
        branch: 'main',
        recentCommits: ['feat: previous commit'],
      }),
      getExistingScopes: vi.fn().mockResolvedValue(['api', 'ui']),
    } as any;

    // Mock AI Provider
    mockAIProvider = {
      getName: vi.fn().mockReturnValue('Test Provider'),
      isAvailable: vi.fn().mockResolvedValue(true),
      generateCommitMessage: vi.fn().mockResolvedValue({
        message: createCommitMessage('feat', 'add new feature', 'api'),
        confidence: 85,
        reasoning: 'Test reasoning',
      }),
      generateText: vi.fn(),
    } as any;

    // Mock AST Analyzer
    mockASTAnalyzer = {
      supportsFile: vi.fn().mockReturnValue(true),
      analyzeAST: vi.fn().mockResolvedValue({
        symbols: [],
        imports: [],
        exports: [],
      }),
    } as any;

    // Mock Style Analyzer
    mockStyleAnalyzer = {
      analyzeProjectStyle: vi.fn().mockResolvedValue({
        preferredTypes: ['feat', 'fix'],
        scopeConventions: [],
        subjectFormat: 'imperative',
        averageSubjectLength: 50,
      }),
    } as any;

    useCase = new AgenticCommitGenerationUseCase(
      mockGitRepo,
      mockASTAnalyzer,
      mockStyleAnalyzer
    );
  });

  describe('Basic Execution', () => {
    it('should execute successfully with high quality acceptance', async () => {
      // Mock reflection that accepts immediately
      mockAIProvider.generateText = vi.fn()
        .mockResolvedValueOnce(
          JSON.stringify({
            decision: 'accept',
            issues: [],
            improvements: [],
            reasoning: 'Quality is good',
            qualityScore: 85,
            criteriaScores: {
              clarity: 90,
              accuracy: 85,
              completeness: 80,
            },
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            factualAccuracy: 95,
            hasCriticalIssues: false,
            issues: [],
            verifiedSymbols: [],
            missingSymbols: [],
            hallucinatedSymbols: [],
            recommendations: [],
            reasoning: 'All facts verified',
          })
        );

      const result = await useCase.execute({
        provider: mockAIProvider,
        includeScope: true,
      });

      expect(result.success).toBe(true);
      expect(result.formattedMessage).toBeDefined();
      expect(result.provider).toBe('Test Provider');
      expect(result.iterations).toBe(1);
      expect(result.reflections).toHaveLength(1);
      expect(result.verifications).toHaveLength(1);
      expect(result.finalQualityScore).toBe(85);
      expect(result.finalFactualAccuracy).toBe(95);
    });

    it('should include scope when requested', async () => {
      mockAIProvider.generateText = vi.fn()
        .mockResolvedValueOnce(
          JSON.stringify({
            decision: 'accept',
            issues: [],
            improvements: [],
            reasoning: 'Good',
            qualityScore: 85,
            criteriaScores: { clarity: 85, accuracy: 85, completeness: 85 },
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            factualAccuracy: 90,
            hasCriticalIssues: false,
            issues: [],
            verifiedSymbols: [],
            missingSymbols: [],
            hallucinatedSymbols: [],
            recommendations: [],
            reasoning: 'Good',
          })
        );

      await useCase.execute({
        provider: mockAIProvider,
        includeScope: true,
      });

      expect(mockGitRepo.getExistingScopes).toHaveBeenCalled();
    });

    it('should not include scope when not requested', async () => {
      mockAIProvider.generateText = vi.fn()
        .mockResolvedValueOnce(
          JSON.stringify({
            decision: 'accept',
            issues: [],
            improvements: [],
            reasoning: 'Good',
            qualityScore: 85,
            criteriaScores: { clarity: 85, accuracy: 85, completeness: 85 },
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            factualAccuracy: 90,
            hasCriticalIssues: false,
            issues: [],
            verifiedSymbols: [],
            missingSymbols: [],
            hallucinatedSymbols: [],
            recommendations: [],
            reasoning: 'Good',
          })
        );

      await useCase.execute({
        provider: mockAIProvider,
        includeScope: false,
      });

      expect(mockGitRepo.getExistingScopes).not.toHaveBeenCalled();
    });
  });

  describe('Reflection Pattern', () => {
    it('should refine when quality is low then accept', async () => {
      let generateCallCount = 0;
      mockAIProvider.generateCommitMessage = vi.fn().mockImplementation(async () => {
        generateCallCount++;
        if (generateCallCount === 1) {
          return {
            message: createCommitMessage('feat', 'initial message', 'api'),
            confidence: 60,
            reasoning: 'Initial',
          };
        }
        return {
          message: createCommitMessage('feat', 'improved specific message', 'api'),
          confidence: 85,
          reasoning: 'Refined',
        };
      });

      let textCallCount = 0;
      mockAIProvider.generateText = vi.fn().mockImplementation(async () => {
        textCallCount++;
        // First reflection rejects (low quality)
        if (textCallCount === 1) {
          return JSON.stringify({
            decision: 'refine',
            issues: ['Subject too vague'],
            improvements: ['Be more specific'],
            reasoning: 'Needs improvement',
            qualityScore: 60,
            criteriaScores: { clarity: 50, accuracy: 70, completeness: 60 },
          });
        }
        // First verification
        if (textCallCount === 2) {
          return JSON.stringify({
            factualAccuracy: 65,
            hasCriticalIssues: false,
            issues: [],
            verifiedSymbols: [],
            missingSymbols: [],
            hallucinatedSymbols: [],
            recommendations: [],
            reasoning: 'Acceptable',
          });
        }
        // Second reflection accepts
        if (textCallCount === 3) {
          return JSON.stringify({
            decision: 'accept',
            issues: [],
            improvements: [],
            reasoning: 'Much better',
            qualityScore: 85,
            criteriaScores: { clarity: 90, accuracy: 85, completeness: 80 },
          });
        }
        // Second verification passes
        return JSON.stringify({
          factualAccuracy: 90,
          hasCriticalIssues: false,
          issues: [],
          verifiedSymbols: [],
          missingSymbols: [],
          hallucinatedSymbols: [],
          recommendations: [],
          reasoning: 'Good',
        });
      });

      const result = await useCase.execute({
        provider: mockAIProvider,
        maxReflectionIterations: 2,
      });

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(2);
      expect(result.reflections).toHaveLength(2);
      expect(mockAIProvider.generateCommitMessage).toHaveBeenCalledTimes(2);
    });

    it('should stop at max iterations even with low quality', async () => {
      // Always reject with low quality
      mockAIProvider.generateText = vi.fn().mockImplementation(async () => {
        return JSON.stringify({
          decision: 'refine',
          issues: ['Still needs work'],
          improvements: ['Keep improving'],
          reasoning: 'Not good enough',
          qualityScore: 50,
          criteriaScores: { clarity: 50, accuracy: 50, completeness: 50 },
        });
      });

      mockAIProvider.generateCommitMessage = vi.fn().mockResolvedValue({
        message: createCommitMessage('feat', 'message', 'api'),
        confidence: 50,
        reasoning: 'Test',
      });

      const result = await useCase.execute({
        provider: mockAIProvider,
        maxReflectionIterations: 2,
      });

      // Should accept at max iterations as fallback
      expect(result.success).toBe(true);
      expect(result.iterations).toBe(2);
      expect(result.reflections.length).toBeLessThanOrEqual(2);
    });

    it('should call onProgress callback with correct steps', async () => {
      const progressSteps: string[] = [];
      const onProgress = vi.fn((step: string) => {
        progressSteps.push(step);
      });

      mockAIProvider.generateCommitMessage = vi.fn()
        .mockResolvedValueOnce({
          message: createCommitMessage('feat', 'initial', 'api'),
          confidence: 60,
          reasoning: 'Initial',
        })
        .mockResolvedValueOnce({
          message: createCommitMessage('feat', 'refined', 'api'),
          confidence: 85,
          reasoning: 'Refined',
        });

      let textCallCount = 0;
      mockAIProvider.generateText = vi.fn().mockImplementation(async () => {
        textCallCount++;
        if (textCallCount === 1) {
          return JSON.stringify({
            decision: 'refine',
            issues: ['Improve'],
            improvements: ['Better'],
            reasoning: 'Refine',
            qualityScore: 60,
            criteriaScores: { clarity: 60, accuracy: 60, completeness: 60 },
          });
        }
        if (textCallCount === 2) {
          return JSON.stringify({
            factualAccuracy: 65,
            hasCriticalIssues: false,
            issues: [],
            verifiedSymbols: [],
            missingSymbols: [],
            hallucinatedSymbols: [],
            recommendations: [],
            reasoning: 'Ok',
          });
        }
        if (textCallCount === 3) {
          return JSON.stringify({
            decision: 'accept',
            issues: [],
            improvements: [],
            reasoning: 'Good',
            qualityScore: 85,
            criteriaScores: { clarity: 85, accuracy: 85, completeness: 85 },
          });
        }
        return JSON.stringify({
          factualAccuracy: 90,
          hasCriticalIssues: false,
          issues: [],
          verifiedSymbols: [],
          missingSymbols: [],
          hallucinatedSymbols: [],
          recommendations: [],
          reasoning: 'Good',
        });
      });

      await useCase.execute({
        provider: mockAIProvider,
        maxReflectionIterations: 2,
        onProgress,
      });

      expect(progressSteps).toContain('generating');
      expect(progressSteps).toContain('reflecting-1');
      expect(progressSteps).toContain('refining-1');
    });
  });

  describe('Error Handling', () => {
    it('should return error when not a git repository', async () => {
      mockGitRepo.isRepository = vi.fn().mockResolvedValue(false);

      const result = await useCase.execute({
        provider: mockAIProvider,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a git repository');
      expect(result.iterations).toBe(0);
    });

    it('should return error when AI provider is not available', async () => {
      mockAIProvider.isAvailable = vi.fn().mockResolvedValue(false);

      const result = await useCase.execute({
        provider: mockAIProvider,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
      expect(result.iterations).toBe(0);
    });

    it('should handle reflection parsing errors gracefully', async () => {
      // Return invalid JSON for reflection
      let textCallCount = 0;
      mockAIProvider.generateText = vi.fn().mockImplementation(async () => {
        textCallCount++;
        if (textCallCount === 1) {
          return 'invalid json {broken';
        }
        // Verification returns valid JSON
        return JSON.stringify({
          factualAccuracy: 70,
          hasCriticalIssues: false,
          issues: [],
          verifiedSymbols: [],
          missingSymbols: [],
          hallucinatedSymbols: [],
          recommendations: [],
          reasoning: 'Ok',
        });
      });

      const result = await useCase.execute({
        provider: mockAIProvider,
      });

      // Should fallback to accepting when reflection parsing fails
      expect(result.success).toBe(true);
      expect(result.iterations).toBeGreaterThanOrEqual(1);
    });

    it('should handle exceptions during execution', async () => {
      mockGitRepo.getStagedChangesContext = vi.fn().mockRejectedValue(
        new Error('Git error')
      );

      const result = await useCase.execute({
        provider: mockAIProvider,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Git error');
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics correctly', async () => {
      // Mock generateCommitMessage with a delay to simulate real processing time
      mockAIProvider.generateCommitMessage = vi.fn().mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              message: createCommitMessage('feat', 'add new feature', 'api'),
              confidence: 85,
              reasoning: 'Test reasoning',
            });
          }, 10); // 10ms delay to simulate generation time
        })
      );

      // Mock generateText with delays to simulate reflection and verification time
      mockAIProvider.generateText = vi.fn()
        .mockImplementationOnce(
          () => new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                JSON.stringify({
                  decision: 'accept',
                  issues: [],
                  improvements: [],
                  reasoning: 'Good',
                  qualityScore: 85,
                  criteriaScores: { clarity: 85, accuracy: 85, completeness: 85 },
                })
              );
            }, 10); // 10ms delay for reflection
          })
        )
        .mockImplementationOnce(
          () => new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                JSON.stringify({
                  factualAccuracy: 90,
                  hasCriticalIssues: false,
                  issues: [],
                  verifiedSymbols: [],
                  missingSymbols: [],
                  hallucinatedSymbols: [],
                  recommendations: [],
                  reasoning: 'Good',
                })
              );
            }, 10); // 10ms delay for verification
          })
        );

      const result = await useCase.execute({
        provider: mockAIProvider,
      });

      expect(result.performance).toBeDefined();
      expect(result.performance.totalLatency).toBeGreaterThan(0);
      expect(result.performance.generationTime).toBeGreaterThan(0);
      expect(result.performance.reflectionTime).toBeGreaterThan(0);
      expect(result.performance.verificationTime).toBeGreaterThanOrEqual(0);
      expect(result.performance.refinementTime).toBeGreaterThanOrEqual(0);
    });
  });
});
