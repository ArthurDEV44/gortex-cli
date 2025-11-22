# Contributing to GORTEX CLI

First off, thank you for considering contributing to GORTEX CLI! It's people like you that make GORTEX CLI such a great tool.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Branch Strategy](#-branch-strategy)
- [Code of Conduct](#-code-of-conduct)
- [Development Workflow](#-development-workflow)
- [Architecture Overview](#-architecture-overview)
- [Coding Standards](#-coding-standards)
- [Testing](#-testing)
- [Pull Request Process](#-pull-request-process)
- [Commit Messages](#-commit-messages)
- [Getting Help](#-getting-help)

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥18.0.0
- **pnpm** (recommended) or npm/yarn
- **Git**
- Basic understanding of TypeScript and React

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/gortex-cli.git
cd gortex-cli

# Add upstream remote
git remote add upstream https://github.com/ArthurDEV44/gortex-cli.git

# Install dependencies
pnpm install

# Verify setup
pnpm test
pnpm build

# Start development
pnpm dev
```

### Essential Commands

```bash
pnpm dev              # Run CLI in development mode
pnpm build            # Build ESM bundle
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm typecheck        # Type check with TypeScript
pnpm lint             # Lint with Biome
```

---

## 🌳 Branch Strategy

We use a protected branch strategy to maintain code quality and stability.

### Branch Structure

```
main (production)
  ↑
  | Merges from dev (maintainer only)
  |
dev (development)
  ↑
  | Merges from contributors (maintainer only)
  |
contributors (integration)
  ↑
  | Pull requests from contributors
  |
feature/* (your work)
```

### Branch Purposes

| Branch | Purpose | Access |
|--------|---------|--------|
| `main` | Production-ready code, published to npm | Maintainer only |
| `dev` | Active development by maintainer | Maintainer only |
| `contributors` | Integration branch for external contributions | **PR target for contributors** |
| `feature/*`, `fix/*`, `refactor/*` | Your feature branches | Contributors create from `contributors` |

### Important for Contributors

**⚠️ Always target your PRs to the `contributors` branch, NOT `main` or `dev`**

The maintainer will review, test, and merge approved contributions from `contributors` → `dev` → `main`.

---

## 📜 Code of Conduct

### Our Standards

**Examples of positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without permission

---

## 💻 Development Workflow

### 1. Create a Feature Branch

```bash
# Sync with upstream contributors branch
git checkout contributors
git pull upstream contributors

# Create feature branch from contributors
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Follow our [Architecture Guidelines](#-architecture-overview) and [Coding Standards](#-coding-standards).

### 3. Test Your Changes

```bash
pnpm test              # All tests must pass
pnpm typecheck         # TypeScript must compile
pnpm build             # Build must succeed
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat(scope): description"
git push origin feature/your-feature-name
```

### 5. Open a Pull Request

Go to GitHub and click "New Pull Request" from your fork.

**⚠️ IMPORTANT: Set the base branch to `contributors`, NOT `main` or `dev`**

---

## 🏗️ Architecture Overview

GORTEX CLI follows **Clean Architecture** with **Dependency Injection**. Before contributing, you **must** understand these core principles.

### Essential Reading

📚 **Read these before contributing:**

1. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete architecture overview, layer responsibilities, and patterns
2. **[USE_CASES.md](docs/USE_CASES.md)** - Detailed use case documentation and examples
3. **[MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)** - Migration patterns and best practices

### Core Principles (Quick Reference)

**1. Dependency Rule**
- Dependencies always point inward: Presentation → Application → Domain
- Infrastructure implements domain interfaces (Dependency Inversion)

**2. Layer Responsibilities**
```
┌─────────────────────────┐
│   Presentation Layer    │  React components + CLI commands
│   Uses: DI hooks        │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│   Application Layer     │  Use cases (business orchestration)
│   Uses: Repositories    │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│     Domain Layer        │  Pure business logic (NO dependencies)
│   Entities + Interfaces │
└─────────────────────────┘
           ↑
┌─────────────────────────┐
│  Infrastructure Layer   │  Implementations (Git, AI, DI)
│   Implements: Interfaces│
└─────────────────────────┘
```

**3. Key Rules**
- Domain layer has **zero external dependencies**
- Use **Dependency Injection** for all services
- Each feature has a dedicated **Use Case**
- Use **Value Objects** for validation

### Quick Example

✅ **Correct Pattern:**
```typescript
// Domain interface (src/domain/repositories/IGitRepository.ts)
export interface IGitRepository {
  createCommit(message: string): Promise<void>;
}

// Use case (src/application/use-cases/CreateCommitUseCase.ts)
export class CreateCommitUseCase {
  constructor(private readonly gitRepo: IGitRepository) {}

  async execute(message: string): Promise<Result> {
    return await this.gitRepo.createCommit(message);
  }
}

// React component (src/components/CommitTab.tsx)
export const CommitTab: React.FC = () => {
  const { createCommit } = useCreateCommit(); // DI hook
  // ...
};
```

❌ **Incorrect Pattern:**
```typescript
// Domain importing infrastructure - WRONG!
import simpleGit from 'simple-git';

export class CommitMessage {
  async save() {
    const git = simpleGit(); // Direct dependency
    await git.commit(this.format());
  }
}
```

**📖 For detailed architecture patterns, examples, and guidelines, see [ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## 📝 Coding Standards

### TypeScript

- **Always use explicit types**, avoid `any`
- Use **interfaces for contracts** (repository interfaces in domain layer)
- Prefer **immutability**: `readonly`, avoid mutating state

### React

- Use **functional components** with hooks
- Access use cases via **DI hooks** (e.g., `useCreateCommit()`)
- Separate **smart components** (business logic) from **presentational components** (UI only)

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CommitTab.tsx` |
| Use Cases | PascalCase | `CreateCommitUseCase.ts` |
| Interfaces | `I` prefix + PascalCase | `IGitRepository.ts` |
| Utils | camelCase | `formatDate.ts` |
| Tests | Source name + `.test.ts` | `CreateCommitUseCase.test.ts` |

### Code Organization

```
src/
├── domain/              # Pure business logic (NO external dependencies)
│   ├── entities/        # Business entities
│   ├── value-objects/   # Validated value objects
│   └── repositories/    # Repository interfaces
├── application/         # Use cases and orchestration
│   ├── use-cases/       # Business workflows
│   ├── dto/             # Data transfer objects
│   └── mappers/         # DTO ↔ Entity mappers
├── infrastructure/      # External dependencies
│   ├── repositories/    # Repository implementations
│   ├── ai/              # AI provider adapters
│   └── di/              # Dependency injection container
└── components/          # React UI components
```

---

## 🧪 Testing

### Requirements

**All new code must be tested.** We maintain **92% code coverage**.

### Coverage Targets by Layer

| Layer | Coverage Required |
|-------|-------------------|
| Domain | 100% |
| Application | ≥95% |
| Infrastructure | ≥90% |
| Presentation | ≥85% |

### Test Types

**1. Unit Tests** - Test individual components in isolation

```typescript
describe('CommitType', () => {
  it('should create valid commit type', () => {
    const type = CommitType.create('feat');
    expect(type.toString()).toBe('feat');
  });

  it('should reject invalid commit type', () => {
    expect(() => CommitType.create('invalid')).toThrow();
  });
});
```

**2. Use Case Tests** - Test with mocked dependencies

```typescript
describe('CreateCommitUseCase', () => {
  let useCase: CreateCommitUseCase;
  let mockRepository: IGitRepository;

  beforeEach(() => {
    mockRepository = { createCommit: vi.fn() };
    useCase = new CreateCommitUseCase(mockRepository);
  });

  it('should create commit successfully', async () => {
    const result = await useCase.execute({ message: 'feat: test' });
    expect(result.success).toBe(true);
  });
});
```

**3. Integration Tests** - Test complete workflows

```typescript
describe('Integration: Commit Workflow', () => {
  let root: CompositionRoot;

  beforeEach(() => { root = new CompositionRoot(); });
  afterEach(() => { root.dispose(); });

  it('should complete status → stage → commit workflow', async () => {
    // Test full workflow
  });
});
```

### Running Tests

```bash
pnpm test                      # Run all tests
pnpm test:watch                # Watch mode
pnpm test:coverage             # With coverage report
pnpm test src/path/to/file     # Specific file
```

---

## 🔄 Pull Request Process

### Before Submitting

Ensure your PR meets these requirements:

- [ ] Code follows Clean Architecture principles
- [ ] All tests pass (`pnpm test`)
- [ ] Coverage maintained or improved
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Commit messages follow Conventional Commits
- [ ] Documentation updated if needed
- [ ] No `console.log` or debugging code

### PR Title Format

Use Conventional Commits:

```
feat(scope): add new feature
fix(scope): resolve bug
docs: update guide
refactor(domain): simplify entity
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issue
Closes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Follows project architecture
- [ ] Self-reviewed
- [ ] Tests pass locally
```

### Review Process

1. **Automated Checks** - CI/CD runs tests and builds
2. **Code Review** - Maintainer reviews your code
3. **Feedback** - Address requested changes
4. **Merge** - Approved PRs are merged

---

## 💬 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(ai): add Mistral provider` |
| `fix` | Bug fix | `fix(commit): resolve validation` |
| `docs` | Documentation | `docs: update architecture` |
| `refactor` | Code refactoring | `refactor(domain): simplify entity` |
| `test` | Add/update tests | `test: add use case tests` |
| `chore` | Maintenance | `chore: update dependencies` |

### Common Scopes

`domain`, `application`, `infrastructure`, `components`, `commands`, `di`, `ai`, `git`, `tests`

### Examples

**Feature:**
```
feat(ai): add Claude AI provider support

- Implement ClaudeProviderAdapter
- Add configuration for Claude API
- Update AIProviderFactory

Closes #45
```

**Bug Fix:**
```
fix(commit): handle empty scope correctly

Previously threw validation error.
Now creates commit without scope as expected.

Fixes #67
```

**Breaking Change:**
```
feat(domain)!: change CommitMessage API

BREAKING CHANGE: format() now returns object instead of string

Migration:
- Before: const str = message.format();
- After: const { formatted } = message.format();
```

---

## 🤝 Getting Help

### Resources

- **Documentation:** [docs/](docs/) folder
- **Issues:** [GitHub Issues](https://github.com/ArthurDEV44/gortex-cli/issues)
- **Discussions:** [GitHub Discussions](https://github.com/ArthurDEV44/gortex-cli/discussions)

### Reporting Bugs

Open an issue with:
- GORTEX CLI version
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior

### Learning Resources

**Clean Architecture:**
- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Clean Architecture in TypeScript](https://www.youtube.com/watch?v=CnailTcJV_U)

**Dependency Injection:**
- [DI Principles](https://en.wikipedia.org/wiki/Dependency_injection)
- [DI in TypeScript](https://khalilstemmler.com/articles/software-design-architecture/coding-without-di-container/)

**Testing:**
- [Vitest Documentation](https://vitest.dev/)

**Project Docs:**
- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [USE_CASES.md](docs/USE_CASES.md)
- [MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)

---

## 🎯 Contribution Ideas

### Good First Issues

**Documentation:**
- Improve code comments
- Add examples to docs
- Translate documentation

**Features:**
- Add new AI provider support
- Implement custom commit templates
- Improve error messages

**Testing:**
- Increase test coverage
- Add integration tests

**Performance:**
- Optimize bundle size
- Improve startup time

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You

Your contributions make GORTEX CLI better for everyone!

**Happy Contributing! 🚀**

---

<div align="center">

Made with ❤️ by the GORTEX CLI community

**Questions?** Open a [Discussion](https://github.com/ArthurDEV44/gortex-cli/discussions)

</div>
