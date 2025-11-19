# Gortex CLI Analysis (GEMINI.md)

This document provides a comprehensive overview of the `gortex-cli` project, intended to be used as a detailed context for AI-assisted development.

## Project Overview

`gortex-cli` is a premium, interactive command-line interface designed to streamline the creation of [Conventional Commits](https://www.conventionalcommits.org/). It offers a rich, tab-based UI built with React (Ink) and provides a guided workflow for staging files, building commit messages, and pushing changes.

A key feature is its integrated AI for generating commit messages based on staged changes. It supports local AI via Ollama for privacy and speed, as well as cloud-based providers like Mistral and OpenAI.

The project is architected using a strict **Clean Architecture** with **Dependency Injection (DI)**, ensuring a high degree of separation of concerns, testability, and maintainability.

### Core Technologies

-   **Language:** TypeScript
-   **CLI Framework:** Commander.js
-   **UI:** [Ink](https://github.com/vadimdemedes/ink) (React for CLIs)
-   **State Management:** React Hooks
-   **Git Interaction:** `simple-git`
-   **Testing:** Vitest (with UI and coverage reports)
-   **Build Tool:** `tsup`
-   **Package Manager:** pnpm

### Architecture

The codebase is structured into four distinct layers as detailed in `docs/ARCHITECTURE.md`:

1.  **Domain Layer (`src/domain`):** Contains the core business logic, including entities (`CommitMessage`), value objects (`CommitType`, `CommitSubject`), and repository interfaces (`IGitRepository`, `IAIProvider`). This layer has zero external dependencies.
2.  **Application Layer (`src/application`):** Contains use cases (e.g., `CreateCommitUseCase`, `GenerateAICommitUseCase`) that orchestrate the domain logic. It acts as the bridge between the UI and the business rules.
3.  **Infrastructure Layer (`src/infrastructure`):** Provides concrete implementations for the domain's interfaces. This includes `GitRepositoryImpl` (which wraps `simple-git`), adapters for various AI providers, and the DI container itself.
4.  **Presentation Layer (`src/components`, `src/commands`):** The user-facing part of the application, composed of Ink/React components for the UI and command definitions that wire everything together.

## Building and Running

The project uses `pnpm` as its package manager. Key scripts are defined in `package.json`.

### Installation

```bash
# Install dependencies using pnpm
pnpm install
```

### Running in Development

To run the CLI with hot-reloading for development purposes:

```bash
# This will execute the main command (interactive commit workflow)
pnpm dev
```

### Building for Production

To build the project into an optimized executable for production:

```bash
# Builds the project using tsup
pnpm build
```

The output is placed in the `dist/` directory.

### Running Tests

The project uses Vitest for unit and integration testing.

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests and generate a coverage report
pnpm test:coverage
```

### Type Checking

To run the TypeScript compiler and check for type errors without emitting files:

```bash
pnpm typecheck
```

## Development Conventions

### Code Style

The codebase is written in TypeScript and follows modern JavaScript/TypeScript conventions (ESM, async/await). The use of a linter and Prettier is implied to maintain a consistent style, although not explicitly configured in the visible files.

### Architecture and Patterns

-   **Clean Architecture:** All new features should adhere to the established layered architecture. Logic must be placed in the appropriate layer (Domain, Application, Infrastructure, Presentation).
-   **Dependency Injection:** Services and use cases are managed by a custom DI container (`src/infrastructure/di`). Components should consume use cases via the provided React hooks (e.g., `useCreateCommit()`, `useStageFiles()`). Direct instantiation of services is discouraged.
-   **Repository Pattern:** Data access (e.g., Git operations) is abstracted via interfaces in the domain layer. This allows for easy mocking in tests and swapping implementations.
-   **Adapter Pattern:** Used for AI providers to ensure a consistent `IAIProvider` interface is used throughout the application, regardless of the underlying service (Ollama, OpenAI, etc.).

### Testing Practices

-   The project has extensive test coverage (~92%).
-   **Domain Layer:** Should be 100% covered by unit tests, with no mocks for its internal logic.
-   **Application Layer:** Use cases are tested by mocking the repository interfaces they depend on.
-   **Infrastructure Layer:** Implementations are tested against their interfaces.
-   **Presentation Layer:** React components are tested using `ink-testing-library`.

### Commits

As a tool for creating conventional commits, the project's own repository is expected to follow the same standard. All commits should be in the conventional commit format.
