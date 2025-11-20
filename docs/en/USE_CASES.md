# Use Cases Documentation - GORTEX CLI

**Version:** 2.0 (Clean Architecture)
**Date:** 2025-11-19

---

## 📋 Table des Matières

- [Introduction](#-introduction)
- [Use Cases Overview](#-use-cases-overview)
- [Commit Operations](#-commit-operations)
- [File Operations](#-file-operations)
- [Repository Operations](#-repository-operations)
- [Branch Operations](#-branch-operations)
- [Remote Operations](#-remote-operations)
- [AI Operations](#-ai-operations)
- [Error Handling](#-error-handling)
- [Testing Use Cases](#-testing-use-cases)

---

## 🎯 Introduction

Les **Use Cases** représentent les points d'entrée de la logique métier de GORTEX CLI. Chaque use case est une classe dédiée à une action métier spécifique.

### Principes

1. **Single Responsibility** - Un use case = une action métier
2. **Dependency Injection** - Les dépendances sont injectées
3. **Interface-based** - Dépend des abstractions (IGitRepository, IAIProvider)
4. **Result-based** - Retourne toujours un objet Result
5. **Testable** - Facilement testable avec des mocks

### Pattern Commun

```typescript
export class MyUseCase {
  constructor(
    private readonly repository: IRepository,
    private readonly service?: IService
  ) {}

  async execute(request: MyRequest): Promise<MyResult> {
    try {
      // 1. Validate request
      this.validate(request);

      // 2. Execute business logic
      const result = await this.performAction(request);

      // 3. Return success result
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 4. Handle errors gracefully
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
```

---

## 📊 Use Cases Overview

### Liste Complète

| Use Case | Responsabilité | Dépendances | Localisation |
|----------|----------------|-------------|--------------|
| **CreateCommitUseCase** | Créer un commit Git | IGitRepository | src/application/use-cases/ |
| **GenerateAICommitUseCase** | Générer message avec AI | IGitRepository, IAIProvider | src/application/use-cases/ |
| **StageFilesUseCase** | Stager des fichiers | IGitRepository | src/application/use-cases/ |
| **GetRepositoryStatusUseCase** | Status du repository | IGitRepository | src/application/use-cases/ |
| **AnalyzeCommitHistoryUseCase** | Analyser l'historique | IGitRepository | src/application/use-cases/ |
| **BranchOperationsUseCase** | Opérations branches | IGitRepository | src/application/use-cases/ |
| **PushOperationsUseCase** | Push vers remote | IGitRepository | src/application/use-cases/ |

### Diagramme de Relations

```
┌────────────────────────────────────────────────────────┐
│                  React Components                       │
│  (CommitTab, FileSelector, AIGenerator, etc.)          │
└────────────────────────────────────────────────────────┘
                          │
                          ↓ via hooks
┌────────────────────────────────────────────────────────┐
│                    React Hooks                          │
│  useStageFiles, useCreateCommit, useGenerateAI, etc.   │
└────────────────────────────────────────────────────────┘
                          │
                          ↓ resolve & execute
┌────────────────────────────────────────────────────────┐
│                     Use Cases                           │
│  ┌─────────────────────────────────────────────────┐  │
│  │  CreateCommitUseCase                            │  │
│  │  GenerateAICommitUseCase                        │  │
│  │  StageFilesUseCase                              │  │
│  │  GetRepositoryStatusUseCase                     │  │
│  │  AnalyzeCommitHistoryUseCase                    │  │
│  │  BranchOperationsUseCase                        │  │
│  │  PushOperationsUseCase                          │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                          │
                          ↓ uses
┌────────────────────────────────────────────────────────┐
│               Domain Entities & Interfaces              │
│  CommitMessage, IGitRepository, IAIProvider            │
└────────────────────────────────────────────────────────┘
                          │
                          ↓ implemented by
┌────────────────────────────────────────────────────────┐
│                  Infrastructure                         │
│  GitRepositoryImpl, AI Adapters                        │
└────────────────────────────────────────────────────────┘
```

---

## 📝 Commit Operations

### CreateCommitUseCase

**Responsabilité:** Créer un commit Git avec un message conventionnel validé.

**Localisation:** `src/application/use-cases/CreateCommitUseCase.ts`

#### Interface

```typescript
interface CreateCommitRequest {
  message: CommitMessageDTO;
}

interface CreateCommitResult {
  success: boolean;
  formattedMessage?: string;
  error?: string;
}
```

#### Implémentation

```typescript
export class CreateCommitUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  async execute(request: CreateCommitRequest): Promise<CreateCommitResult> {
    try {
      // 1. Validate and build commit message entity
      const commitMessage = this.validateAndBuildMessage(request.message);

      // 2. Format according to conventional commits
      const formattedMessage = commitMessage.format();

      // 3. Create commit via repository
      await this.gitRepository.createCommit(formattedMessage);

      // 4. Return success
      return {
        success: true,
        formattedMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create commit: ${error.message}`,
      };
    }
  }

  private validateAndBuildMessage(dto: CommitMessageDTO): CommitMessage {
    // Validation logic
    const type = CommitType.create(dto.type);
    const subject = CommitSubject.create(dto.subject);
    const scope = dto.scope ? Scope.create(dto.scope) : undefined;

    return new CommitMessage(type, subject, scope, dto.body, dto.footer);
  }
}
```

#### Usage avec Hook

```typescript
// In a React component
const { createCommit, loading, error } = useCreateCommit();

const handleCommit = async () => {
  await createCommit({
    type: 'feat',
    subject: 'add user authentication',
    scope: 'auth',
  });
};
```

#### Exemple de Résultat

**Succès:**
```typescript
{
  success: true,
  formattedMessage: "feat(auth): add user authentication"
}
```

**Erreur:**
```typescript
{
  success: false,
  error: "Failed to create commit: Subject must be at least 3 characters"
}
```

#### Tests

```typescript
describe('CreateCommitUseCase', () => {
  it('should create commit with valid message', async () => {
    const mockRepo = {
      createCommit: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new CreateCommitUseCase(mockRepo);

    const result = await useCase.execute({
      message: {
        type: 'feat',
        subject: 'add new feature',
        scope: 'api',
      },
    });

    expect(result.success).toBe(true);
    expect(result.formattedMessage).toBe('feat(api): add new feature');
    expect(mockRepo.createCommit).toHaveBeenCalledWith('feat(api): add new feature');
  });

  it('should fail with invalid commit type', async () => {
    const useCase = new CreateCommitUseCase(mockRepo);

    const result = await useCase.execute({
      message: {
        type: 'invalid',
        subject: 'test',
      },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid commit type');
  });
});
```

---

## 📦 File Operations

### StageFilesUseCase

**Responsabilité:** Stager des fichiers spécifiques ou tous les fichiers modifiés.

**Localisation:** `src/application/use-cases/StageFilesUseCase.ts`

#### Interface

```typescript
interface StageFilesRequest {
  filePaths?: string[];
  stageAll?: boolean;
}

interface StageFilesResult {
  success: boolean;
  stagedFiles?: string[];
  error?: string;
}
```

#### Implémentation

```typescript
export class StageFilesUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  async execute(request: StageFilesRequest): Promise<StageFilesResult> {
    try {
      // Validate request
      if (!request.stageAll && (!request.filePaths || request.filePaths.length === 0)) {
        return {
          success: false,
          error: 'No files specified and stageAll is false',
        };
      }

      // Stage files or all
      if (request.stageAll) {
        await this.gitRepository.stageAll();
        const files = await this.gitRepository.getModifiedFiles();
        return {
          success: true,
          stagedFiles: files,
        };
      } else {
        await this.gitRepository.stageFiles(request.filePaths!);
        return {
          success: true,
          stagedFiles: request.filePaths,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to stage files: ${error.message}`,
      };
    }
  }
}
```

#### Usage

```typescript
const { stageFiles, loading } = useStageFiles();

// Stage specific files
await stageFiles(['src/file1.ts', 'src/file2.ts']);

// Stage all files
await stageFiles([], true);
```

#### Scénarios

1. **Stage fichiers spécifiques**
   - Input: `{ filePaths: ['file1.ts', 'file2.ts'] }`
   - Action: `git add file1.ts file2.ts`
   - Output: `{ success: true, stagedFiles: ['file1.ts', 'file2.ts'] }`

2. **Stage tous les fichiers**
   - Input: `{ stageAll: true }`
   - Action: `git add -A`
   - Output: `{ success: true, stagedFiles: [...all files] }`

3. **Erreur: Aucun fichier**
   - Input: `{ filePaths: [] }`
   - Output: `{ success: false, error: 'No files specified...' }`

---

## 📊 Repository Operations

### GetRepositoryStatusUseCase

**Responsabilité:** Obtenir le status complet du repository Git.

**Localisation:** `src/application/use-cases/GetRepositoryStatusUseCase.ts`

#### Interface

```typescript
interface GetRepositoryStatusRequest {
  // Empty - no parameters needed
}

interface GetRepositoryStatusResult {
  success: boolean;
  status?: GitStatusDTO;
  error?: string;
}

interface GitStatusDTO {
  branch: string;
  modifiedFiles: FileStatus[];
  hasChanges: boolean;
  hasRemote: boolean;
  remoteName?: string;
}
```

#### Implémentation

```typescript
export class GetRepositoryStatusUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  async execute(): Promise<GetRepositoryStatusResult> {
    try {
      // Check if valid git repository
      const isRepo = await this.gitRepository.isRepository();
      if (!isRepo) {
        return {
          success: false,
          error: 'Not a git repository',
        };
      }

      // Gather status information
      const branch = await this.gitRepository.getCurrentBranch();
      const modifiedFiles = await this.gitRepository.getModifiedFilesWithStatus();
      const hasChanges = await this.gitRepository.hasChanges();
      const hasRemote = await this.gitRepository.hasRemote();
      const remoteName = hasRemote
        ? await this.gitRepository.getDefaultRemote()
        : undefined;

      return {
        success: true,
        status: {
          branch,
          modifiedFiles,
          hasChanges,
          hasRemote,
          remoteName,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get repository status: ${error.message}`,
      };
    }
  }
}
```

#### Usage

```typescript
const { getStatus, loading } = useRepositoryStatus();

const status = await getStatus();
if (status.success) {
  console.log(`Branch: ${status.status.branch}`);
  console.log(`Modified files: ${status.status.modifiedFiles.length}`);
}
```

#### Exemple de Résultat

```typescript
{
  success: true,
  status: {
    branch: "main",
    modifiedFiles: [
      { path: "src/file1.ts", status: "modified" },
      { path: "src/file2.ts", status: "added" },
      { path: "README.md", status: "deleted" }
    ],
    hasChanges: true,
    hasRemote: true,
    remoteName: "origin"
  }
}
```

### AnalyzeCommitHistoryUseCase

**Responsabilité:** Analyser l'historique des commits et générer des statistiques.

**Localisation:** `src/application/use-cases/AnalyzeCommitHistoryUseCase.ts`

#### Interface

```typescript
interface AnalyzeCommitHistoryRequest {
  maxCount?: number; // Default: 100
}

interface AnalyzeCommitHistoryResult {
  success: boolean;
  commits?: CommitDTO[];
  stats?: RepositoryStatsDTO;
  error?: string;
}

interface RepositoryStatsDTO {
  total: number;
  conventional: number;
  nonConventional: number;
  byType: Record<string, number>;
  byAuthor: Record<string, number>;
}
```

#### Implémentation

```typescript
export class AnalyzeCommitHistoryUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  async execute(
    request: AnalyzeCommitHistoryRequest = {}
  ): Promise<AnalyzeCommitHistoryResult> {
    try {
      const maxCount = request.maxCount || 100;

      // Fetch commit history
      const commits = await this.gitRepository.getCommitHistory(maxCount);

      // Analyze commits
      const stats = this.analyzeCommits(commits);

      // Map to DTOs
      const commitDTOs = commits.map(GitDataMapper.toCommitDTO);

      return {
        success: true,
        commits: commitDTOs,
        stats,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze commit history: ${error.message}`,
      };
    }
  }

  private analyzeCommits(commits: any[]): RepositoryStatsDTO {
    const stats: RepositoryStatsDTO = {
      total: commits.length,
      conventional: 0,
      nonConventional: 0,
      byType: {},
      byAuthor: {},
    };

    for (const commit of commits) {
      // Check if conventional
      const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?:/;
      if (conventionalRegex.test(commit.message)) {
        stats.conventional++;

        // Extract type
        const match = commit.message.match(/^(\w+)/);
        if (match) {
          const type = match[1];
          stats.byType[type] = (stats.byType[type] || 0) + 1;
        }
      } else {
        stats.nonConventional++;
      }

      // Count by author
      stats.byAuthor[commit.author] = (stats.byAuthor[commit.author] || 0) + 1;
    }

    return stats;
  }
}
```

#### Usage

```typescript
const { analyzeHistory, loading } = useCommitHistory();

const result = await analyzeHistory(100);
if (result.success) {
  console.log(`Total commits: ${result.stats.total}`);
  console.log(`Conventional: ${result.stats.conventional}`);
  console.log(`Types:`, result.stats.byType);
}
```

---

## 🌿 Branch Operations

### BranchOperationsUseCase

**Responsabilité:** Gérer les opérations sur les branches Git.

**Localisation:** `src/application/use-cases/BranchOperationsUseCase.ts`

#### Méthodes

##### getCurrentBranch()

```typescript
async getCurrentBranch(): Promise<BranchResult> {
  try {
    const branch = await this.gitRepository.getCurrentBranch();
    return {
      success: true,
      branch,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

##### getAllBranches()

```typescript
async getAllBranches(): Promise<BranchesResult> {
  try {
    const branches = await this.gitRepository.getAllBranches();
    return {
      success: true,
      branches,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

##### checkoutBranch(name)

```typescript
async checkoutBranch(name: string): Promise<BranchResult> {
  try {
    const exists = await this.gitRepository.branchExists(name);
    if (!exists) {
      return {
        success: false,
        error: `Branch '${name}' does not exist`,
      };
    }

    await this.gitRepository.checkoutBranch(name);
    return {
      success: true,
      branch: name,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

##### createBranch(name)

```typescript
async createBranch(name: string): Promise<BranchResult> {
  try {
    const exists = await this.gitRepository.branchExists(name);
    if (exists) {
      return {
        success: false,
        error: `Branch '${name}' already exists`,
      };
    }

    await this.gitRepository.createAndCheckoutBranch(name);
    return {
      success: true,
      branch: name,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### Usage

```typescript
const { getCurrentBranch, getAllBranches, checkoutBranch, createBranch } =
  useBranchOperations();

// Get current branch
const current = await getCurrentBranch();
console.log(current.branch); // "main"

// List all branches
const all = await getAllBranches();
console.log(all.branches); // ["main", "develop", "feature/auth"]

// Checkout existing branch
await checkoutBranch('develop');

// Create and checkout new branch
await createBranch('feature/new-feature');
```

---

## 🚀 Remote Operations

### PushOperationsUseCase

**Responsabilité:** Gérer les opérations de push vers le remote.

**Localisation:** `src/application/use-cases/PushOperationsUseCase.ts`

#### Méthodes

##### checkRemote()

```typescript
async checkRemote(): Promise<RemoteCheckResult> {
  try {
    const hasRemote = await this.gitRepository.hasRemote();

    if (!hasRemote) {
      return {
        success: true,
        hasRemote: false,
      };
    }

    const remoteName = await this.gitRepository.getDefaultRemote();
    const remoteUrl = await this.gitRepository.getRemoteUrl(remoteName);

    return {
      success: true,
      hasRemote: true,
      remoteName,
      remoteUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

##### pushToRemote(options)

```typescript
async pushToRemote(options: PushOptions = {}): Promise<PushResult> {
  try {
    const hasRemote = await this.gitRepository.hasRemote();
    if (!hasRemote) {
      return {
        success: false,
        error: 'No remote configured',
      };
    }

    const remoteName = await this.gitRepository.getDefaultRemote();
    const branch = await this.gitRepository.getCurrentBranch();

    const hasUpstream = await this.gitRepository.hasUpstream();
    const setUpstream = options.setUpstream || !hasUpstream;

    await this.gitRepository.pushToRemote(remoteName, branch, setUpstream);

    return {
      success: true,
      remoteName,
      branch,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### Usage

```typescript
const { checkRemote, pushToRemote } = usePushOperations();

// Check remote configuration
const remote = await checkRemote();
if (remote.hasRemote) {
  console.log(`Remote: ${remote.remoteName} (${remote.remoteUrl})`);

  // Push to remote
  await pushToRemote({ setUpstream: true });
}
```

---

## 🤖 AI Operations

### GenerateAICommitUseCase

**Responsabilité:** Générer un message de commit en utilisant l'intelligence artificielle.

**Localisation:** `src/application/use-cases/GenerateAICommitUseCase.ts`

#### Interface

```typescript
interface GenerateAICommitRequest {
  diff?: string;
  context?: AIGenerationContext;
}

interface GenerateAICommitResult {
  success: boolean;
  message?: CommitMessageDTO;
  confidence?: number;
  error?: string;
}

interface AIGenerationContext {
  files: string[];
  branch: string;
  recentCommits: string[];
  diff?: string;
  availableTypes?: string[];
  availableScopes?: string[];
}
```

#### Implémentation

```typescript
export class GenerateAICommitUseCase {
  constructor(
    private readonly gitRepository: IGitRepository,
    private readonly aiProvider: IAIProvider
  ) {}

  async execute(request: GenerateAICommitRequest): Promise<GenerateAICommitResult> {
    try {
      // Check AI provider availability
      const isAvailable = await this.aiProvider.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'AI provider is not available',
        };
      }

      // Get context from git if not provided
      const context = request.context || await this.getContextFromGit();

      // Prepare generation context
      const generationContext: AIGenerationContext = {
        diff: request.diff || context.diff,
        files: context.files,
        branch: context.branch,
        recentCommits: context.recentCommits,
      };

      // Generate commit message via AI
      const result = await this.aiProvider.generateCommitMessage(generationContext);

      // Convert entity to DTO
      const messageDTO = CommitMessageMapper.toDTO(result.message);

      return {
        success: true,
        message: messageDTO,
        confidence: result.confidence,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate AI commit: ${error.message}`,
      };
    }
  }

  private async getContextFromGit(): Promise<any> {
    return await this.gitRepository.getStagedChangesContext();
  }
}
```

#### Usage

```typescript
const { generateAICommit, loading } = useGenerateAICommit();

const result = await generateAICommit({
  diff: stagedDiff,
  context: {
    files: ['src/auth.ts'],
    branch: 'feature/auth',
    recentCommits: ['feat: add login'],
  },
});

if (result.success) {
  console.log(result.message); // { type: 'feat', subject: 'add OAuth2 authentication', scope: 'auth' }
  console.log(`Confidence: ${result.confidence * 100}%`);
}
```

#### Exemple de Résultat

**Succès avec haute confiance:**
```typescript
{
  success: true,
  message: {
    type: "feat",
    subject: "implement user authentication with OAuth2",
    scope: "auth"
  },
  confidence: 0.92
}
```

**Erreur: Provider indisponible**
```typescript
{
  success: false,
  error: "AI provider is not available"
}
```

---

## ⚠️ Error Handling

### Stratégie d'Erreur

Tous les use cases suivent une stratégie d'erreur cohérente:

1. **Try-Catch obligatoire**
2. **Retour d'objet Result**
3. **Pas de throw en dehors**
4. **Messages d'erreur descriptifs**

### Types d'Erreurs

#### 1. Erreurs de Validation

```typescript
// Invalid commit type
{
  success: false,
  error: "Invalid commit type: 'invalid-type'. Must be one of: feat, fix, docs, ..."
}

// Subject too short
{
  success: false,
  error: "Subject must be at least 3 characters long"
}

// No files specified
{
  success: false,
  error: "No files specified and stageAll is false"
}
```

#### 2. Erreurs Git

```typescript
// Not a repository
{
  success: false,
  error: "Not a git repository"
}

// Branch does not exist
{
  success: false,
  error: "Branch 'feature/xyz' does not exist"
}

// No remote configured
{
  success: false,
  error: "No remote configured"
}
```

#### 3. Erreurs AI

```typescript
// Provider unavailable
{
  success: false,
  error: "AI provider is not available"
}

// Generation failed
{
  success: false,
  error: "Failed to generate AI commit: Connection timeout"
}
```

#### 4. Erreurs Réseau

```typescript
// Push failed
{
  success: false,
  error: "Failed to push: Network error - connection timeout"
}
```

### Gestion dans les Composants

```typescript
const { createCommit, loading, error } = useCreateCommit();

const handleCommit = async () => {
  const result = await createCommit(message);

  if (result.success) {
    // Show success message
    showSuccess(`Commit created: ${result.formattedMessage}`);
  } else {
    // Show error to user
    showError(result.error);
  }
};
```

---

## 🧪 Testing Use Cases

### Pattern de Test Standard

```typescript
describe('MyUseCase', () => {
  let useCase: MyUseCase;
  let mockRepository: MockType<IRepository>;

  beforeEach(() => {
    mockRepository = {
      method1: vi.fn(),
      method2: vi.fn(),
      // ... all interface methods
    };

    useCase = new MyUseCase(mockRepository);
  });

  describe('Happy Path', () => {
    it('should execute successfully with valid input', async () => {
      // Arrange
      mockRepository.method1.mockResolvedValue('result');

      // Act
      const result = await useCase.execute({ valid: 'input' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('result');
      expect(mockRepository.method1).toHaveBeenCalledWith('input');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockRepository.method1.mockRejectedValue(new Error('Git error'));

      // Act
      const result = await useCase.execute({ valid: 'input' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Git error');
    });
  });

  describe('Validation', () => {
    it('should validate input and return error', async () => {
      // Act
      const result = await useCase.execute({ invalid: 'input' });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
      expect(mockRepository.method1).not.toHaveBeenCalled();
    });
  });
});
```

### Exemples de Tests

#### Test CreateCommitUseCase

```typescript
describe('CreateCommitUseCase', () => {
  it('should create commit with full message', async () => {
    const mockRepo = {
      createCommit: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new CreateCommitUseCase(mockRepo);

    const result = await useCase.execute({
      message: {
        type: 'feat',
        subject: 'add user authentication',
        scope: 'auth',
        body: 'Implemented OAuth2 authentication with Google',
        footer: 'Closes #123',
      },
    });

    expect(result.success).toBe(true);
    expect(result.formattedMessage).toBe(
      'feat(auth): add user authentication\n\n' +
      'Implemented OAuth2 authentication with Google\n\n' +
      'Closes #123'
    );
  });
});
```

#### Test GenerateAICommitUseCase

```typescript
describe('GenerateAICommitUseCase', () => {
  it('should generate commit with AI', async () => {
    const mockCommitMessage = new CommitMessage(
      CommitType.create('feat'),
      CommitSubject.create('add authentication'),
      Scope.create('auth')
    );

    const mockAI = {
      isAvailable: vi.fn().mockResolvedValue(true),
      generateCommitMessage: vi.fn().mockResolvedValue({
        message: mockCommitMessage,
        confidence: 0.95,
      }),
    };

    const mockRepo = {
      getStagedChangesContext: vi.fn().mockResolvedValue({
        diff: '+auth code',
        files: ['auth.ts'],
        branch: 'main',
        recentCommits: [],
      }),
    };

    const useCase = new GenerateAICommitUseCase(mockRepo, mockAI);

    const result = await useCase.execute({});

    expect(result.success).toBe(true);
    expect(result.message.type).toBe('feat');
    expect(result.confidence).toBe(0.95);
  });
});
```

### Couverture de Tests

| Use Case | Tests | Coverage |
|----------|-------|----------|
| CreateCommitUseCase | 8 | 100% |
| GenerateAICommitUseCase | 6 | 95% |
| StageFilesUseCase | 5 | 100% |
| GetRepositoryStatusUseCase | 4 | 95% |
| AnalyzeCommitHistoryUseCase | 3 | 90% |
| BranchOperationsUseCase | 6 | 100% |
| PushOperationsUseCase | 4 | 95% |

**Total: 36 tests unitaires sur use cases**

---

## 📚 Ressources

### Documentation Connexe

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture globale
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Guide de migration
- [PHASE11_SUMMARY.md](./PHASE11_SUMMARY.md) - Tests d'intégration

### Liens Externes

- [Use Case Pattern](https://en.wikipedia.org/wiki/Use_case)
- [Clean Architecture Use Cases](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Result Pattern](https://enterprisecraftsmanship.com/posts/error-handling-exception-or-result/)

---

## 🔮 Évolution

### Use Cases Futurs

1. **Revert Operations**
   - RevertCommitUseCase
   - ResetToCommitUseCase

2. **Tag Operations**
   - CreateTagUseCase
   - ListTagsUseCase

3. **Stash Operations**
   - StashChangesUseCase
   - ApplyStashUseCase

4. **Merge Operations**
   - MergeBranchUseCase
   - RebaseUseCase

### Optimisations Prévues

1. **Caching**
   - Cache des résultats de status
   - Cache de l'historique

2. **Performance**
   - Lazy loading des commits
   - Pagination de l'historique

3. **AI Améliorations**
   - Context learning
   - User preferences
   - Multi-provider fallback

---

**Document créé:** 2025-11-19
**Version:** 2.0 - Clean Architecture
**Use Cases documentés:** 7
**Tests:** 36 tests unitaires
