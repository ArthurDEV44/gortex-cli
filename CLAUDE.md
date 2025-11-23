# CLAUDE.md - AI Assistant Guide for GORTEX CLI

> **Last Updated**: 2025-11-23
> **Version**: 2.0.5
> **Architecture**: Clean Architecture with Dependency Injection

This document provides comprehensive guidance for AI assistants (like Claude) working with the GORTEX CLI codebase. It explains the architecture, conventions, workflows, and best practices to follow when analyzing, modifying, or extending this project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Codebase Structure](#codebase-structure)
4. [Development Workflow](#development-workflow)
5. [Testing Conventions](#testing-conventions)
6. [Git Workflow & Branch Strategy](#git-workflow--branch-strategy)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Key Patterns & Conventions](#key-patterns--conventions)
9. [AI Assistant Guidelines](#ai-assistant-guidelines)
10. [Common Tasks & Examples](#common-tasks--examples)
11. [Important Files & Locations](#important-files--locations)
12. [Configuration](#configuration)

---

## Project Overview

### What is GORTEX CLI?

GORTEX CLI is an **interactive command-line tool** for creating **conventional commits** with **AI assistance**. It guides developers through an 8-step workflow to ensure high-quality, standardized Git commits.

### Key Features

- **Interactive Workflow**: Branch selection → File staging → Message generation → Confirmation → Push
- **AI Integration**: Supports Ollama (local), Mistral AI, and OpenAI
- **Conventional Commits**: Real-time validation and enforcement
- **Diff Previews**: Visual inspection of staged changes
- **Type-Safe**: Built with TypeScript and strict typing
- **Well-Tested**: 918 tests across 67 files with 92% coverage

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **UI Framework** | React 19 + Ink 6 (React for CLIs) |
| **Language** | TypeScript 5.9 (strict mode) |
| **Git Integration** | simple-git 3.30 |
| **Testing** | Vitest 4 + ink-testing-library |
| **Build** | tsup 8 (esbuild wrapper) |
| **Linting** | Biome 2.3 |
| **CLI Framework** | Commander 14 |
| **Package Manager** | pnpm 8 (preferred) |

### Project Metrics

```
Total Files:     ~150 (including tests)
Source Files:    ~81 production files
Test Files:      67 files
Tests:           918 total
Coverage:        92% overall
  - Domain:      100%
  - Application: 95%
  - Infrastructure: 90%
  - Presentation: 85%
Bundle Size:     ~177.62 KB (ESM)
Build Time:      ~1.2s
Node Version:    >=18.0.0
```

---

## Architecture & Design Principles

### Clean Architecture

GORTEX CLI follows **Clean Architecture** as described by Robert C. Martin (Uncle Bob). The architecture is organized in concentric layers with strict dependency rules.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│              (React Components, CLI Commands)                │
│     CommitWorkflow, FileSelector, AIGenerator, etc.         │
└──────────────────────────┬──────────────────────────────────┘
                           │ uses hooks
┌──────────────────────────▼──────────────────────────────────┐
│              INFRASTRUCTURE LAYER (DI)                       │
│         DIContext, Hooks, CompositionRoot                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ resolves services
┌──────────────────────────▼──────────────────────────────────┐
│                  APPLICATION LAYER                           │
│                 (Use Cases, DTOs, Mappers)                   │
│   CreateCommit, GenerateAICommit, StageFiles, etc.         │
└──────────────────────────┬──────────────────────────────────┘
                           │ orchestrates
┌──────────────────────────▼──────────────────────────────────┐
│                     DOMAIN LAYER                             │
│          (Entities, Value Objects, Interfaces)               │
│    CommitMessage, CommitType, IGitRepository, etc.          │
│              ⚠️  ZERO EXTERNAL DEPENDENCIES                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ implemented by
┌──────────────────────────▼──────────────────────────────────┐
│          INFRASTRUCTURE LAYER (Implementations)              │
│      GitRepositoryImpl, AI Adapters, Factories              │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

#### 1. **Dependency Rule** (CRITICAL)

Dependencies **always** point inward toward the domain:
- ✅ Presentation → Application → Domain
- ✅ Infrastructure → Domain (implements interfaces)
- ❌ Domain → Infrastructure (NEVER)
- ❌ Domain → Application (NEVER)

**Example of CORRECT dependency:**
```typescript
// domain/repositories/IGitRepository.ts
export interface IGitRepository {
  createCommit(message: string): Promise<void>;
}

// infrastructure/repositories/GitRepositoryImpl.ts
import type { IGitRepository } from "../../domain/repositories/IGitRepository.js";
import simpleGit from "simple-git";

export class GitRepositoryImpl implements IGitRepository {
  async createCommit(message: string): Promise<void> {
    const git = simpleGit();
    await git.commit(message);
  }
}
```

**Example of INCORRECT dependency:**
```typescript
// ❌ WRONG - Domain importing infrastructure
// domain/entities/CommitMessage.ts
import simpleGit from "simple-git"; // ❌ External dependency in domain!

export class CommitMessage {
  async save() {
    const git = simpleGit(); // ❌ Direct coupling
    await git.commit(this.format());
  }
}
```

#### 2. **Dependency Inversion Principle**

- Domain defines **interfaces** (contracts)
- Infrastructure provides **implementations**
- Services are injected via **constructor injection**

#### 3. **Single Responsibility Principle**

- Each module has ONE reason to change
- Use cases are single-purpose
- Value objects validate one concept

#### 4. **Open/Closed Principle**

- Open for extension (add new providers via factory)
- Closed for modification (don't modify core domain logic)

#### 5. **Immutability**

- Value objects are immutable (frozen)
- Entities minimize mutation
- Use `readonly` extensively

---

## Codebase Structure

### Directory Overview

```
gortex-cli/
├── .github/
│   ├── workflows/              # CI/CD pipelines
│   │   ├── ci.yml             # Test, build, typecheck, lint
│   │   └── npm-publish.yml    # NPM publishing
│   └── CODEOWNERS             # Protected files & ownership
├── assets/images/             # Project branding
├── docs/                      # Documentation
│   ├── en/ARCHITECTURE.md     # Detailed architecture guide
│   ├── fr/                    # French translations
│   └── BRANCH_PROTECTION.md   # Branch strategy
├── scripts/                   # Development scripts
├── src/                       # Source code (see below)
├── .gortexrc.example          # Example configuration
├── biome.json                 # Linter/formatter config
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tsup.config.ts             # Build config
└── vitest.config.ts           # Test config
```

### Source Code Structure (`src/`)

```
src/
├── domain/                    # 🟢 Domain Layer - Pure business logic
│   ├── entities/
│   │   ├── CommitMessage.ts          # Core commit message entity
│   │   └── CommitMessage.test.ts
│   ├── repositories/
│   │   ├── IAIProvider.ts            # AI provider interface
│   │   ├── IGitRepository.ts         # Git operations interface
│   │   └── index.ts
│   ├── services/
│   │   ├── CommitMessageService.ts   # Business logic services
│   │   └── DiffAnalyzer.ts           # Diff analysis
│   ├── value-objects/
│   │   ├── CommitType.ts             # Validated commit type
│   │   ├── CommitSubject.ts          # Validated subject
│   │   ├── Scope.ts                  # Validated scope
│   │   └── *.test.ts
│   └── index.ts
│
├── application/               # 🔵 Application Layer - Use cases
│   ├── dto/
│   │   ├── AIGenerationDTO.ts        # AI DTOs
│   │   ├── CommitMessageDTO.ts       # Commit DTOs
│   │   └── GitStatusDTO.ts           # Git status DTOs
│   ├── mappers/
│   │   ├── CommitMessageMapper.ts    # DTO ↔ Entity mapping
│   │   └── GitDataMapper.ts
│   ├── use-cases/
│   │   ├── AnalyzeCommitHistoryUseCase.ts
│   │   ├── BranchOperationsUseCase.ts
│   │   ├── CreateCommitUseCase.ts
│   │   ├── GenerateAICommitUseCase.ts
│   │   ├── GetRepositoryStatusUseCase.ts
│   │   ├── PushOperationsUseCase.ts
│   │   ├── StageFilesUseCase.ts
│   │   └── __test__/
│   └── index.ts
│
├── infrastructure/            # 🟡 Infrastructure Layer - Implementations
│   ├── ai/
│   │   ├── MistralProviderAdapter.ts # Mistral adapter
│   │   ├── OllamaProviderAdapter.ts  # Ollama adapter
│   │   ├── OpenAIProviderAdapter.ts  # OpenAI adapter
│   │   └── __test__/
│   ├── di/
│   │   ├── CompositionRoot.ts        # DI entry point
│   │   ├── DIContainer.ts            # DI container
│   │   ├── DIContext.tsx             # React context
│   │   ├── ServiceRegistry.ts        # Service bindings
│   │   ├── hooks.ts                  # React hooks for DI
│   │   └── __test__/
│   ├── factories/
│   │   ├── AIProviderFactory.ts      # Create AI providers
│   │   └── RepositoryFactory.ts
│   ├── repositories/
│   │   └── GitRepositoryImpl.ts      # Git implementation
│   └── index.ts
│
├── components/                # 🟣 Presentation Layer - React/Ink UI
│   ├── AICommitGenerator.tsx
│   ├── BranchSelector.tsx
│   ├── CommitConfirmation.tsx
│   ├── CommitMessageBuilder.tsx
│   ├── CommitWorkflow.tsx            # Main workflow orchestrator
│   ├── FileSelector.tsx
│   ├── InteractiveWorkflow.tsx
│   ├── TabNavigation.tsx
│   └── __test__/
│
├── commands/                  # CLI commands
│   ├── ai-suggest.tsx
│   ├── commit.tsx                    # Main commit command
│   ├── hooks.tsx
│   ├── stats.tsx
│   └── *.test.tsx
│
├── ai/                        # AI integration
│   ├── providers/
│   │   ├── BaseAIProvider.ts         # Abstract base
│   │   ├── ollama.ts                 # Ollama implementation
│   │   ├── mistral.ts                # Mistral implementation
│   │   └── openai.ts                 # OpenAI implementation
│   ├── prompts/
│   │   └── commit-message.ts         # Prompt templates
│   └── analyzer.ts                   # Diff analysis
│
├── shared/                    # Shared utilities
│   ├── constants/
│   │   ├── ai-defaults.ts
│   │   ├── commit-types.ts           # Commit type definitions
│   │   ├── limits.ts                 # Size/length limits
│   │   └── timing.ts
│   ├── errors/
│   │   ├── AppError.ts               # Base error class
│   │   └── ErrorHandler.ts
│   └── index.ts
│
├── theme/                     # UI theming
│   └── colors.ts
│
├── ui/                        # Low-level UI components
│   └── primitives/
│
├── utils/                     # Utilities
│   ├── config.ts                     # Config loading (cosmiconfig)
│   └── validation.ts
│
├── __mocks__/                 # Test mocks
│   └── simple-git.ts
│
├── __tests__/                 # Integration tests
│   └── integration/
│
├── cli.ts                     # CLI setup (Commander)
├── index.ts                   # Entry point
└── types.ts                   # Global TypeScript types
```

### Layer Responsibilities

| Layer | Responsibility | Can Import From | External Dependencies |
|-------|----------------|-----------------|----------------------|
| **Domain** | Pure business logic, entities, value objects, interfaces | Nothing | ❌ ZERO |
| **Application** | Use cases, orchestration, DTOs, mappers | Domain only | ❌ None |
| **Infrastructure** | Implementations, adapters, factories, DI | Domain, Application | ✅ Yes (simple-git, etc.) |
| **Presentation** | UI components, CLI commands | Application (via DI hooks) | ✅ Yes (React, Ink) |

---

## Development Workflow

### Setup

```bash
# Clone repository
git clone https://github.com/ArthurDEV44/gortex-cli.git
cd gortex-cli

# Install dependencies (pnpm recommended)
pnpm install

# Verify setup
pnpm test       # Run tests
pnpm build      # Build project
pnpm typecheck  # Type check
pnpm lint       # Lint code
```

### Development Commands

```bash
pnpm dev              # Run CLI in development mode (tsx)
pnpm build            # Build ESM bundle with tsup
pnpm start            # Run built CLI
pnpm test             # Run all tests (Vitest)
pnpm test:watch       # Watch mode
pnpm test:ui          # Vitest UI
pnpm test:coverage    # Coverage report
pnpm typecheck        # TypeScript type checking
pnpm lint             # Lint with Biome
```

### Development Cycle

1. **Create Feature Branch** from `contributors` (see Git Workflow)
2. **Make Changes** following architecture principles
3. **Write Tests** co-located with source files
4. **Run Quality Checks**:
   ```bash
   pnpm test          # All tests must pass
   pnpm typecheck     # No type errors
   pnpm lint          # No lint errors
   pnpm build         # Build must succeed
   ```
5. **Commit** using conventional commits (use `gortex` CLI!)
6. **Push** and open PR to `contributors` branch

---

## Testing Conventions

### Test Structure

- **Unit Tests**: Co-located with source files in `__test__/` subdirectories
- **Integration Tests**: In `src/__tests__/integration/`
- **Test Naming**: `SourceFile.test.ts` (e.g., `CommitType.test.ts`)

### Coverage Targets

| Layer | Required Coverage |
|-------|------------------|
| Domain | 100% |
| Application | ≥95% |
| Infrastructure | ≥90% |
| Presentation | ≥85% |
| **Overall** | **≥80%** |

### Testing Patterns

#### 1. **Unit Tests** (Value Objects, Entities)

```typescript
// src/domain/value-objects/CommitType.test.ts
describe("CommitType", () => {
  it("should create valid commit type", () => {
    const type = CommitType.create("feat");
    expect(type.toString()).toBe("feat");
  });

  it("should throw error for invalid type", () => {
    expect(() => CommitType.create("invalid")).toThrow();
  });
});
```

#### 2. **Use Case Tests** (with Mocks)

```typescript
// src/application/use-cases/__test__/CreateCommitUseCase.test.ts
describe("CreateCommitUseCase", () => {
  let useCase: CreateCommitUseCase;
  let mockGitRepo: IGitRepository;

  beforeEach(() => {
    mockGitRepo = {
      createCommit: vi.fn().mockResolvedValue(undefined),
      isRepository: vi.fn().mockResolvedValue(true),
    };
    useCase = new CreateCommitUseCase(mockGitRepo);
  });

  it("should create commit successfully", async () => {
    const result = await useCase.execute({
      message: "feat: add feature",
    });

    expect(result.success).toBe(true);
    expect(mockGitRepo.createCommit).toHaveBeenCalledWith("feat: add feature");
  });
});
```

#### 3. **Integration Tests** (Full Workflow)

```typescript
// src/__tests__/integration/commit-workflow.test.tsx
describe("Commit Workflow Integration", () => {
  let root: CompositionRoot;

  beforeEach(() => {
    root = new CompositionRoot();
  });

  afterEach(() => {
    root.dispose();
  });

  it("should complete full commit workflow", async () => {
    // Test with real DI container
    const gitRepo = root.getContainer().resolve<IGitRepository>(
      ServiceIdentifiers.GitRepository
    );
    // ... test workflow
  });
});
```

### Test Utilities

- **Vitest**: Test framework with global APIs (`describe`, `it`, `expect`)
- **ink-testing-library**: Test React/Ink components
- **Mocks**: Use `vi.fn()`, `vi.mock()` for dependencies
- **Coverage**: `pnpm test:coverage` generates HTML report in `coverage/`

---

## Git Workflow & Branch Strategy

### Branch Structure

```
main (production, protected)
  ↑
  | Merges from dev (maintainer @ArthurDEV44 only)
  |
dev (development, protected)
  ↑
  | Merges from contributors (maintainer only)
  |
contributors (integration, PR target for contributors)
  ↑
  | Pull requests from contributors
  |
feature/*, fix/*, refactor/* (your work)
```

### Branch Purposes

| Branch | Purpose | Who Can Push | PR Target |
|--------|---------|--------------|-----------|
| `main` | Production-ready, published to npm | Maintainer only | N/A |
| `dev` | Active development | Maintainer only | N/A |
| `contributors` | Integration for external contributions | Maintainer only | ← **Target PRs here** |
| `feature/*`, `fix/*` | Your feature branches | You | `contributors` |

### Creating a Feature Branch

```bash
# Sync with upstream
git checkout contributors
git pull upstream contributors

# Create feature branch
git checkout -b feature/your-feature-name

# Work on feature...
# Commit, test, etc.

# Push to your fork
git push origin feature/your-feature-name

# Open PR to contributors branch (not main!)
```

### Commit Message Format

Follow **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Examples**:
```
feat(ai): add Claude AI provider support
fix(commit): handle empty scope correctly
docs(architecture): update Clean Architecture guide
refactor(domain): simplify CommitMessage entity
test(use-cases): add missing test coverage
```

**Breaking Changes**:
```
feat(api)!: change CommitMessage interface

BREAKING CHANGE: format() now returns object instead of string
```

### Protected Files

These files **cannot be modified** by contributors without maintainer approval:

- `.github/workflows/` - CI/CD workflows (security critical)
- `package.json` - Dependencies and package config
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test configuration
- `.github/CODEOWNERS` - Code ownership rules

**If you need to modify these**, open an issue first to discuss with the maintainer.

---

## CI/CD Pipeline

### Continuous Integration (`ci.yml`)

**Triggers**: Push/PR to `main`, `dev`, `contributors` branches

**Jobs**:

1. **Test** - Run full test suite
   - Node.js 20
   - pnpm 8
   - Caching enabled
   - `pnpm test`

2. **Build** - Build project
   - `pnpm build`
   - Upload build artifacts (7-day retention)

3. **TypeCheck** - Type checking
   - `pnpm typecheck`

4. **Lint** - Code quality
   - `pnpm lint` (Biome)

**All jobs must pass** for PR to be merged.

### NPM Publish (`npm-publish.yml`)

**Triggers**:
- GitHub release created
- Manual workflow dispatch

**Steps**:
1. Install dependencies
2. Build project
3. Publish to npm (requires `NPM_TOKEN` secret)

---

## Key Patterns & Conventions

### Design Patterns

#### 1. **Repository Pattern**

Abstracts data access behind interfaces.

```typescript
// Domain interface
export interface IGitRepository {
  createCommit(message: string): Promise<void>;
  stageFiles(files: string[]): Promise<void>;
  hasChanges(): Promise<boolean>;
}

// Infrastructure implementation
export class GitRepositoryImpl implements IGitRepository {
  private readonly git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async createCommit(message: string): Promise<void> {
    await this.git.commit(message);
  }
}
```

#### 2. **Adapter Pattern**

Wraps external libraries to match domain interfaces.

```typescript
// Domain interface
export interface IAIProvider {
  generateCommitMessage(context: AIContext): Promise<AIResult>;
}

// Adapter wrapping Ollama
export class OllamaProviderAdapter implements IAIProvider {
  private readonly provider: OllamaProvider;

  async generateCommitMessage(context: AIContext): Promise<AIResult> {
    const result = await this.provider.generate(context);
    return this.toExpectedFormat(result);
  }
}
```

#### 3. **Factory Pattern**

Centralized creation of complex objects.

```typescript
export class AIProviderFactory {
  static create(provider: AIProviderType, config: Config): IAIProvider {
    switch (provider) {
      case "ollama":
        return new OllamaProviderAdapter(config.ollama);
      case "mistral":
        return new MistralProviderAdapter(config.mistral);
      case "openai":
        return new OpenAIProviderAdapter(config.openai);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
```

#### 4. **Use Case Pattern**

Each business action is a separate use case class.

```typescript
export class CreateCommitUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  async execute(request: CreateCommitRequest): Promise<CreateCommitResult> {
    // 1. Validate
    const message = this.validateMessage(request.message);

    // 2. Execute business logic
    const formatted = message.format();

    // 3. Interact with repository
    await this.gitRepository.createCommit(formatted);

    // 4. Return DTO
    return { success: true, formattedMessage: formatted };
  }
}
```

#### 5. **Value Object Pattern**

Immutable, validated primitives.

```typescript
export class CommitType {
  private constructor(private readonly value: string) {
    Object.freeze(this); // Immutable
  }

  static create(type: string): CommitType {
    if (!VALID_TYPES.includes(type)) {
      throw new Error(`Invalid commit type: "${type}"`);
    }
    return new CommitType(type);
  }

  toString(): string {
    return this.value;
  }
}
```

#### 6. **Dependency Injection**

Services are injected via constructor.

```typescript
// Service registration
container.register(
  ServiceIdentifiers.CreateCommitUseCase,
  (c) => new CreateCommitUseCase(
    c.resolve(ServiceIdentifiers.GitRepository)
  ),
  "transient"
);

// React hook for DI
export function useCreateCommit() {
  const container = useDI();
  const useCase = container.resolve<CreateCommitUseCase>(
    ServiceIdentifiers.CreateCommitUseCase
  );

  const [loading, setLoading] = useState(false);

  const createCommit = async (message: string) => {
    setLoading(true);
    try {
      await useCase.execute({ message });
    } finally {
      setLoading(false);
    }
  };

  return { createCommit, loading };
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `CommitWorkflow.tsx` |
| **Use Cases** | PascalCase + `UseCase` | `CreateCommitUseCase.ts` |
| **Interfaces** | `I` prefix + PascalCase | `IGitRepository.ts` |
| **DTOs** | PascalCase + `DTO` | `CommitMessageDTO.ts` |
| **Value Objects** | PascalCase | `CommitType.ts` |
| **Services** | PascalCase + `Service` | `CommitMessageService.ts` |
| **Factories** | PascalCase + `Factory` | `AIProviderFactory.ts` |
| **Tests** | Source name + `.test.ts` | `CommitType.test.ts` |
| **Utils** | camelCase | `config.ts` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_SUBJECT_LENGTH` |

### File Organization

- **Barrel Exports**: Each directory has `index.ts` re-exporting public APIs
- **Co-located Tests**: Test files in `__test__/` subdirectories next to source
- **Single Responsibility**: Each file has one primary export
- **Grouping**: Related files grouped in directories (e.g., `value-objects/`)

---

## AI Assistant Guidelines

### When Analyzing Code

1. **Identify the Layer First**
   - Check imports to determine layer (domain, application, infrastructure, presentation)
   - Verify dependencies point inward

2. **Understand the Pattern**
   - Is it an Entity, Value Object, Use Case, or Repository?
   - What design pattern is being used?

3. **Check Tests**
   - Tests are the best documentation
   - Look for test files to understand behavior

4. **Follow Interfaces**
   - Domain defines interfaces (contracts)
   - Infrastructure implements them

### When Modifying Code

#### ✅ DO:

1. **Respect Clean Architecture**
   - Never import infrastructure in domain
   - Keep domain pure (zero dependencies)

2. **Use Dependency Injection**
   - Inject dependencies via constructor
   - Register new services in `ServiceRegistry`

3. **Write Tests**
   - Add tests for new code
   - Maintain coverage targets
   - Co-locate tests with source

4. **Follow Existing Patterns**
   - Use same patterns as existing code
   - Check similar files for reference

5. **Validate at Construction**
   - Use Value Objects for validation
   - Throw errors for invalid states

6. **Use Immutability**
   - `readonly` fields
   - `Object.freeze()` for value objects
   - Avoid mutation

7. **Type Everything**
   - No `any` types
   - Explicit return types
   - Use interfaces for contracts

#### ❌ DON'T:

1. **Never Mix Layers**
   - Domain importing infrastructure ❌
   - Application importing presentation ❌

2. **Don't Skip Tests**
   - All new code needs tests
   - Don't lower coverage

3. **Don't Use `any`**
   - Be explicit with types
   - Use `unknown` if necessary

4. **Don't Mutate Value Objects**
   - They must be immutable

5. **Don't Create Services Directly**
   - Use DI container
   - Don't `new CreateCommitUseCase()`

6. **Don't Bypass Validation**
   - Use Value Objects
   - Validate at boundaries

### When Adding Features

#### 1. **Adding a New Use Case**

```typescript
// 1. Define request/result DTOs in application/dto/
export interface NewFeatureRequest {
  input: string;
}

export interface NewFeatureResult {
  success: boolean;
  output?: string;
  error?: string;
}

// 2. Create use case in application/use-cases/
export class NewFeatureUseCase {
  constructor(
    private readonly gitRepository: IGitRepository
  ) {}

  async execute(request: NewFeatureRequest): Promise<NewFeatureResult> {
    // Implementation
  }
}

// 3. Register in ServiceRegistry
container.register(
  ServiceIdentifiers.NewFeatureUseCase,
  (c) => new NewFeatureUseCase(
    c.resolve(ServiceIdentifiers.GitRepository)
  ),
  "transient"
);

// 4. Create React hook in infrastructure/di/hooks.ts
export function useNewFeature() {
  const container = useDI();
  const useCase = container.resolve<NewFeatureUseCase>(
    ServiceIdentifiers.NewFeatureUseCase
  );
  // Hook implementation
}

// 5. Write tests
describe("NewFeatureUseCase", () => {
  // Tests...
});
```

#### 2. **Adding a New AI Provider**

```typescript
// 1. Create adapter in infrastructure/ai/
export class NewAIProviderAdapter implements IAIProvider {
  async generateCommitMessage(context: AIContext): Promise<AIResult> {
    // Implementation
  }
}

// 2. Update AIProviderFactory
static create(provider: AIProviderType, config: Config): IAIProvider {
  switch (provider) {
    // ...existing cases
    case "newprovider":
      return new NewAIProviderAdapter(config.newprovider);
  }
}

// 3. Add config type to types.ts
export type AIProviderType = "ollama" | "mistral" | "openai" | "newprovider";

// 4. Write tests
```

#### 3. **Adding a New Value Object**

```typescript
// domain/value-objects/NewValueObject.ts
export class NewValueObject {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(value: string): NewValueObject {
    // Validate
    if (!this.isValid(value)) {
      throw new Error(`Invalid value: ${value}`);
    }
    return new NewValueObject(value);
  }

  private static isValid(value: string): boolean {
    // Validation logic
  }

  toString(): string {
    return this.value;
  }
}

// Tests
describe("NewValueObject", () => {
  it("should create valid value", () => {
    const obj = NewValueObject.create("valid");
    expect(obj.toString()).toBe("valid");
  });

  it("should reject invalid value", () => {
    expect(() => NewValueObject.create("invalid")).toThrow();
  });
});
```

### When Debugging

1. **Check DI Container**
   - Is service registered? (`ServiceRegistry.ts`)
   - Correct lifecycle (singleton vs transient)?

2. **Verify Interfaces**
   - Does implementation match interface?
   - Are all methods implemented?

3. **Check Tests**
   - What do tests expect?
   - Are mocks configured correctly?

4. **Follow the Flow**
   - User action → Hook → Use Case → Repository → Implementation

5. **Enable Debug Output**
   - Add console.log in development
   - Check error messages

---

## Common Tasks & Examples

### Task: Read Repository Status

```typescript
// Use the hook in a component
import { useRepositoryStatus } from "../infrastructure/di/hooks.js";

export const StatusDisplay: React.FC = () => {
  const { status, loading, error, refresh } = useRepositoryStatus();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text color="red">{error}</Text>;

  return (
    <Box flexDirection="column">
      <Text>Branch: {status.currentBranch}</Text>
      <Text>Modified: {status.modifiedFiles.length} files</Text>
    </Box>
  );
};
```

### Task: Create a Commit

```typescript
// Use case execution
import { useCreateCommit } from "../infrastructure/di/hooks.js";

export const CommitButton: React.FC = () => {
  const { createCommit, loading } = useCreateCommit();

  const handleCommit = async () => {
    await createCommit("feat(ui): add new button");
  };

  return (
    <Box>
      <Text onPress={handleCommit}>
        {loading ? "Creating commit..." : "Commit"}
      </Text>
    </Box>
  );
};
```

### Task: Generate AI Commit Message

```typescript
import { useGenerateAICommit } from "../infrastructure/di/hooks.js";

export const AIGenerator: React.FC = () => {
  const { generate, loading, result, error } = useGenerateAICommit();

  const handleGenerate = async () => {
    await generate({
      // Context is gathered automatically from staged changes
    });
  };

  return (
    <Box flexDirection="column">
      <Text onPress={handleGenerate}>Generate AI Message</Text>
      {loading && <Spinner />}
      {result && <Text>{result.message}</Text>}
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
};
```

### Task: Access Git Repository Directly

```typescript
import { useGitRepository } from "../infrastructure/di/hooks.js";

export const CustomGitOperation: React.FC = () => {
  const gitRepo = useGitRepository();

  const doCustomOperation = async () => {
    const isRepo = await gitRepo.isRepository();
    if (isRepo) {
      const files = await gitRepo.getModifiedFiles();
      // Use files...
    }
  };

  // ...
};
```

---

## Important Files & Locations

### Critical Files (Must Understand)

| File | Purpose | Layer |
|------|---------|-------|
| `src/domain/entities/CommitMessage.ts` | Core commit message entity | Domain |
| `src/domain/repositories/IGitRepository.ts` | Git operations interface | Domain |
| `src/domain/repositories/IAIProvider.ts` | AI provider interface | Domain |
| `src/infrastructure/di/CompositionRoot.ts` | DI setup entry point | Infrastructure |
| `src/infrastructure/di/ServiceRegistry.ts` | Service registrations | Infrastructure |
| `src/infrastructure/repositories/GitRepositoryImpl.ts` | Git implementation | Infrastructure |
| `src/components/CommitWorkflow.tsx` | Main workflow UI | Presentation |

### Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript configuration (ES2022, ESNext) |
| `vitest.config.ts` | Test configuration (coverage, thresholds) |
| `tsup.config.ts` | Build configuration (ESM, shebang) |
| `biome.json` | Linter/formatter configuration |
| `package.json` | Dependencies, scripts, package metadata |
| `.gortexrc.example` | User configuration example |

### Entry Points

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry point (runs CLI) |
| `src/cli.ts` | CLI setup (Commander program) |
| `src/commands/commit.tsx` | Commit command entry |
| `src/commands/stats.tsx` | Stats command entry |
| `src/commands/hooks.tsx` | Hooks command entry |

### Key Constants

| File | Contains |
|------|----------|
| `src/shared/constants/commit-types.ts` | Commit types, emojis, icons |
| `src/shared/constants/limits.ts` | Size/length limits |
| `src/shared/constants/ai-defaults.ts` | AI configuration defaults |
| `src/shared/constants/timing.ts` | Timeouts, delays |

---

## Configuration

### User Configuration (`.gortexrc`)

GORTEX CLI uses **cosmiconfig** for configuration discovery:

1. `.gortexrc`
2. `.gortexrc.json`
3. `.gortexrc.js`
4. `gortex.config.js`
5. `package.json` (key: `gortex`)

#### Example Configuration

```json
{
  "types": [
    { "value": "feat", "label": "✨ feat - New feature" },
    { "value": "fix", "label": "🐛 fix - Bug fix" }
  ],
  "scopes": ["api", "ui", "auth", "database"],
  "allowCustomScopes": true,
  "maxSubjectLength": 100,
  "minSubjectLength": 3,
  "ai": {
    "enabled": true,
    "provider": "ollama",
    "ollama": {
      "model": "devstral:24b",
      "baseUrl": "http://localhost:11434",
      "timeout": 30000
    },
    "mistral": {
      "apiKey": "your-api-key",
      "model": "mistral-large-latest"
    },
    "openai": {
      "apiKey": "your-api-key",
      "model": "gpt-4"
    },
    "temperature": 0.3,
    "autoSuggest": false,
    "requireConfirmation": true
  },
  "git": {
    "autoStage": false,
    "allowEmptyCommits": false
  }
}
```

### Loading Configuration

```typescript
import { loadConfig } from "./utils/config.js";

const config = loadConfig();
```

---

## Best Practices Summary

### Architecture

- ✅ Respect layer boundaries (Presentation → Application → Domain)
- ✅ Domain has ZERO external dependencies
- ✅ Use interfaces for all repository contracts
- ✅ Inject dependencies via constructor
- ✅ Register services in `ServiceRegistry`

### Code Quality

- ✅ TypeScript strict mode (no `any`)
- ✅ Immutability (`readonly`, `Object.freeze()`)
- ✅ Value Objects for validation
- ✅ Single Responsibility Principle
- ✅ Comprehensive tests (92% coverage)

### Testing

- ✅ Co-locate tests with source
- ✅ Mock dependencies with Vitest
- ✅ Test use cases in isolation
- ✅ Integration tests for workflows
- ✅ Maintain coverage targets

### Git

- ✅ Conventional commits
- ✅ Target PRs to `contributors` branch
- ✅ Don't modify protected files
- ✅ All CI checks must pass

### Documentation

- ✅ Update CLAUDE.md when architecture changes
- ✅ Add JSDoc comments for complex logic
- ✅ Update ARCHITECTURE.md for major refactors

---

## Resources

### Internal Documentation

- [`README.md`](README.md) - Project overview, installation, usage
- [`CONTRIBUTING.md`](CONTRIBUTING.md) - Contribution guidelines
- [`docs/en/ARCHITECTURE.md`](docs/en/ARCHITECTURE.md) - Detailed architecture (French version also available)
- [`docs/BRANCH_PROTECTION.md`](docs/BRANCH_PROTECTION.md) - Branch strategy details

### External Resources

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection Principles](https://en.wikipedia.org/wiki/Dependency_injection)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Ink Documentation](https://github.com/vadimdemedes/ink)

---

## Quick Reference Card

### Architecture Layers (from outer to inner)

```
Presentation → Infrastructure (DI) → Application → Domain ← Infrastructure (Impl)
```

### Dependency Rule

**Always point inward**: Presentation → Application → Domain

### Common Patterns

- **Repository**: Abstract data access (IGitRepository)
- **Adapter**: Wrap external libs (OllamaProviderAdapter)
- **Factory**: Create objects (AIProviderFactory)
- **Use Case**: One business action per class
- **Value Object**: Immutable, validated primitives
- **DI**: Constructor injection

### File Locations

- **Entities**: `src/domain/entities/`
- **Value Objects**: `src/domain/value-objects/`
- **Interfaces**: `src/domain/repositories/`
- **Use Cases**: `src/application/use-cases/`
- **DTOs**: `src/application/dto/`
- **Implementations**: `src/infrastructure/repositories/`
- **Components**: `src/components/`
- **DI**: `src/infrastructure/di/`

### Essential Commands

```bash
pnpm dev        # Run CLI in dev mode
pnpm test       # Run tests
pnpm build      # Build project
pnpm typecheck  # Type check
pnpm lint       # Lint code
```

---

**Last Updated**: 2025-11-23
**Version**: 2.0.5
**Maintainer**: @ArthurDEV44

For questions or clarifications, open a [Discussion](https://github.com/ArthurDEV44/gortex-cli/discussions) or [Issue](https://github.com/ArthurDEV44/gortex-cli/issues).
