# Architecture - GORTEX CLI

**Version:** 2.0 (Clean Architecture)
**Date:** 2025-11-19
**Statut:** Production Ready

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture Clean en Couches](#-architecture-clean-en-couches)
- [Dependency Injection (DI)](#-dependency-injection-di)
- [Flux de Données](#-flux-de-données)
- [Diagrammes](#-diagrammes)
- [Composants Principaux](#-composants-principaux)
- [Patterns Utilisés](#-patterns-utilisés)
- [Décisions Architecturales](#-décisions-architecturales)

---

## 🎯 Vue d'ensemble

GORTEX CLI utilise une **Clean Architecture** inspirée de Robert C. Martin (Uncle Bob) avec **Dependency Injection** pour créer une application CLI maintenable, testable et évolutive.

### Principes Fondamentaux

1. **Separation of Concerns** - Chaque couche a une responsabilité unique
2. **Dependency Rule** - Les dépendances pointent toujours vers l'intérieur
3. **Dependency Inversion** - Les abstractions ne dépendent pas des détails
4. **Single Responsibility** - Chaque module a une seule raison de changer
5. **Open/Closed** - Ouvert à l'extension, fermé à la modification

### Architecture en un coup d'œil

```
┌──────────────────────────────────────────────────────────┐
│                    Presentation Layer                     │
│                   (React Components)                      │
│   CommitTab, FileSelector, AICommitGenerator, etc.       │
└──────────────────────────────────────────────────────────┘
                           ↓ uses
┌──────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                      │
│                    (DI Container)                         │
│         DIContext, hooks, CompositionRoot                │
└──────────────────────────────────────────────────────────┘
                           ↓ resolves
┌──────────────────────────────────────────────────────────┐
│                  Application Layer                        │
│                    (Use Cases)                            │
│   CreateCommit, GenerateAICommit, StageFiles, etc.      │
└──────────────────────────────────────────────────────────┘
                           ↓ uses
┌──────────────────────────────────────────────────────────┐
│                    Domain Layer                           │
│              (Business Logic - Core)                      │
│    Entities, Value Objects, Repository Interfaces        │
└──────────────────────────────────────────────────────────┘
                           ↑ implements
┌──────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                      │
│                  (Implementations)                        │
│   GitRepositoryImpl, AI Adapters, Factories              │
└──────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Clean en Couches

### Couche 1: Domain (Cœur Métier)

**Localisation:** `src/domain/`

**Responsabilité:** Contient la logique métier pure, indépendante de toute technologie.

#### Entities
```typescript
// src/domain/entities/CommitMessage.ts
export class CommitMessage {
  constructor(
    private readonly type: CommitType,
    private readonly subject: CommitSubject,
    private readonly scope?: Scope,
    private readonly body?: string,
    private readonly footer?: string
  ) {}

  format(): string {
    // Pure business logic
  }
}
```

**Caractéristiques:**
- Pas de dépendances externes
- Business rules pures
- Immutables
- 100% testables

#### Value Objects
```typescript
// src/domain/value-objects/CommitType.ts
export class CommitType {
  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static create(value: string): CommitType {
    return new CommitType(value);
  }

  private validate(value: string): void {
    if (!VALID_TYPES.includes(value)) {
      throw new Error(`Invalid commit type: ${value}`);
    }
  }
}
```

**Avantages:**
- Encapsulation de la validation
- Impossible de créer un état invalide
- Type-safe

#### Repository Interfaces
```typescript
// src/domain/repositories/IGitRepository.ts
export interface IGitRepository {
  isRepository(): Promise<boolean>;
  hasChanges(): Promise<boolean>;
  getModifiedFiles(): Promise<string[]>;
  stageFiles(files: string[]): Promise<void>;
  createCommit(message: string): Promise<void>;
  getExistingScopes(): Promise<string[]>;
  // ... autres méthodes
}
```

**Principe:**
- Interface définie par le domain
- Implémentation fournie par l'infrastructure
- Dependency Inversion Principle

### Couche 2: Application (Use Cases)

**Localisation:** `src/application/`

**Responsabilité:** Orchestration de la logique métier, point d'entrée des fonctionnalités.

#### Use Cases
```typescript
// src/application/use-cases/CreateCommitUseCase.ts
export class CreateCommitUseCase {
  constructor(private readonly gitRepository: IGitRepository) {}

  async execute(request: CreateCommitRequest): Promise<CreateCommitResult> {
    // 1. Validate request
    const commitMessage = this.validateAndBuild(request.message);

    // 2. Execute business logic
    const formatted = commitMessage.format();

    // 3. Interact with repository
    await this.gitRepository.createCommit(formatted);

    // 4. Return result DTO
    return {
      success: true,
      formattedMessage: formatted,
    };
  }
}
```

**Caractéristiques:**
- Un use case = une action métier
- Pas de logique UI
- Retourne des DTOs
- Testable avec mocks

#### DTOs (Data Transfer Objects)
```typescript
// src/application/dto/CommitMessageDTO.ts
export interface CommitMessageDTO {
  type: string;
  subject: string;
  scope?: string;
  body?: string;
  footer?: string;
}
```

**Rôle:**
- Transfert de données entre couches
- Découplage des structures internes
- Validation au niveau application

#### Mappers
```typescript
// src/application/mappers/CommitMessageMapper.ts
export class CommitMessageMapper {
  static toEntity(dto: CommitMessageDTO): CommitMessage {
    return new CommitMessage(
      CommitType.create(dto.type),
      CommitSubject.create(dto.subject),
      dto.scope ? Scope.create(dto.scope) : undefined,
      dto.body,
      dto.footer
    );
  }

  static toDTO(entity: CommitMessage): CommitMessageDTO {
    return {
      type: entity.type,
      subject: entity.subject,
      scope: entity.scope?.toString(),
      body: entity.body,
      footer: entity.footer,
    };
  }
}
```

### Couche 3: Infrastructure (Implémentations)

**Localisation:** `src/infrastructure/`

**Responsabilité:** Implémentations concrètes, accès aux systèmes externes.

#### Repository Implementations
```typescript
// src/infrastructure/repositories/GitRepositoryImpl.ts
export class GitRepositoryImpl implements IGitRepository {
  private readonly git: SimpleGit;

  constructor(workingDir: string = process.cwd()) {
    this.git = simpleGit(workingDir);
  }

  async isRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async createCommit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  // ... autres implémentations
}
```

#### AI Adapters
```typescript
// src/infrastructure/ai/OllamaProviderAdapter.ts
export class OllamaProviderAdapter implements IAIProvider {
  private readonly provider: OllamaProvider;

  constructor(config?: OllamaConfig) {
    this.provider = new OllamaProvider(config);
  }

  async generateCommitMessage(
    context: AIGenerationContext
  ): Promise<AIGenerationResult> {
    // Adapter pattern - wraps concrete provider
    const result = await this.provider.generateCommitMessage(context);
    return this.toExpectedFormat(result);
  }
}
```

**Pattern Adapter:**
- Sépare l'implémentation concrète de l'interface domain
- Permet de changer de provider facilement
- Respecte le Dependency Inversion Principle

#### Factories
```typescript
// src/infrastructure/factories/AIProviderFactory.ts
export class AIProviderFactory {
  static create(
    provider: AIProviderType,
    config: Config
  ): IAIProvider {
    switch (provider) {
      case 'ollama':
        return new OllamaProviderAdapter(config.ollama);
      case 'mistral':
        return new MistralProviderAdapter(config.mistral);
      case 'openai':
        return new OpenAIProviderAdapter(config.openai);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}
```

### Couche 4: Presentation (React/CLI)

**Localisation:** `src/components/`, `src/commands/`

**Responsabilité:** Interface utilisateur, interaction avec l'utilisateur.

#### React Components
```typescript
// src/components/CommitTab.tsx
export const CommitTab: React.FC = () => {
  const { stageFiles, loading } = useStageFiles();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const handleStage = async () => {
    await stageFiles(selectedFiles);
  };

  return (
    <Box flexDirection="column">
      <FileSelector onSelect={setSelectedFiles} />
      <Button onPress={handleStage} disabled={loading}>
        Stage Files
      </Button>
    </Box>
  );
};
```

#### Commands
```typescript
// src/commands/commit.tsx
export async function commitCommand(): Promise<void> {
  const root = new CompositionRoot();

  try {
    // Validate repository
    const gitRepo = root.getContainer().resolve<IGitRepository>(
      ServiceIdentifiers.GitRepository
    );
    const isRepo = await gitRepo.isRepository();

    if (!isRepo) {
      console.error('Not a git repository');
      return;
    }

    // Render React app with DI
    const { waitUntilExit } = render(
      <DIProvider root={root}>
        <InteractiveWorkflow config={config} />
      </DIProvider>
    );

    await waitUntilExit();
  } finally {
    root.dispose();
  }
}
```

---

## 🔌 Dependency Injection (DI)

### Architecture DI

```
┌─────────────────────────────────────────────────────────┐
│                   CompositionRoot                        │
│  - Initialize()                                          │
│  - getContainer()                                        │
│  - dispose()                                             │
└─────────────────────────────────────────────────────────┘
                          │
                          ├─────────────────────┐
                          ↓                     ↓
┌──────────────────────────────┐  ┌──────────────────────┐
│       DIContainer            │  │   ServiceRegistry     │
│  - register()                │  │  - registerServices() │
│  - registerInstance()        │  │  - bindings config    │
│  - resolve()                 │  └──────────────────────┘
│  - isRegistered()            │
│  - clear()                   │
└──────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      DIContext                           │
│  React Context wrapping DIContainer                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    React Hooks                           │
│  useStageFiles(), useCreateCommit(), useGenerateAICommit │
└─────────────────────────────────────────────────────────┘
```

### DIContainer

**Localisation:** `src/infrastructure/di/DIContainer.ts`

```typescript
export class DIContainer {
  private registrations = new Map<ServiceIdentifier, ServiceRegistration>();

  register<T>(
    identifier: ServiceIdentifier,
    factory: ServiceFactory<T>,
    lifecycle: Lifecycle = 'transient'
  ): void {
    this.registrations.set(identifier, { factory, lifecycle, instance: null });
  }

  resolve<T>(identifier: ServiceIdentifier): T {
    const registration = this.registrations.get(identifier);

    if (!registration) {
      throw new Error(`Service not registered: ${identifier}`);
    }

    if (registration.lifecycle === 'singleton') {
      if (!registration.instance) {
        registration.instance = registration.factory(this);
      }
      return registration.instance as T;
    }

    return registration.factory(this) as T;
  }

  clear(): void {
    this.registrations.clear();
  }
}
```

**Lifecycle Management:**
- **Transient:** Nouvelle instance à chaque résolution
- **Singleton:** Instance unique partagée

### ServiceRegistry

**Localisation:** `src/infrastructure/di/ServiceRegistry.ts`

```typescript
export const ServiceIdentifiers = {
  GitRepository: 'GitRepository',
  AIProvider: 'AIProvider',
  CreateCommitUseCase: 'CreateCommitUseCase',
  GenerateAICommitUseCase: 'GenerateAICommitUseCase',
  StageFilesUseCase: 'StageFilesUseCase',
  // ... autres services
} as const;

export class ServiceRegistry {
  static registerServices(container: DIContainer, config: Config): void {
    // Repositories (Singleton)
    container.register(
      ServiceIdentifiers.GitRepository,
      () => new GitRepositoryImpl(),
      'singleton'
    );

    // AI Provider (Singleton)
    container.register(
      ServiceIdentifiers.AIProvider,
      () => AIProviderFactory.create(config.ai.provider, config),
      'singleton'
    );

    // Use Cases (Transient)
    container.register(
      ServiceIdentifiers.CreateCommitUseCase,
      (c) => new CreateCommitUseCase(
        c.resolve(ServiceIdentifiers.GitRepository)
      ),
      'transient'
    );

    // ... autres registrations
  }
}
```

### CompositionRoot

**Localisation:** `src/infrastructure/di/CompositionRoot.ts`

```typescript
export class CompositionRoot {
  private readonly container: DIContainer;

  constructor() {
    this.container = new DIContainer();
    this.initialize();
  }

  private initialize(): void {
    const config = loadConfig();
    ServiceRegistry.registerServices(this.container, config);
  }

  getContainer(): DIContainer {
    return this.container;
  }

  dispose(): void {
    this.container.clear();
  }
}
```

**Rôle:**
- Point d'entrée unique pour la configuration DI
- Lifecycle management
- Cleanup des ressources

### React Hooks pour DI

**Localisation:** `src/infrastructure/di/hooks.ts`

```typescript
export function useStageFiles() {
  const container = useDI();
  const useCase = container.resolve<StageFilesUseCase>(
    ServiceIdentifiers.StageFilesUseCase
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageFiles = async (files: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const result = await useCase.execute({ filePaths: files });

      if (!result.success) {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { stageFiles, loading, error };
}
```

**Hooks Disponibles:**
- `useStageFiles()` - Stage des fichiers
- `useCreateCommit()` - Créer un commit
- `useGenerateAICommit()` - Générer message AI
- `useRepositoryStatus()` - Status du repository
- `useCommitHistory()` - Historique des commits
- `useBranchOperations()` - Opérations de branches
- `usePushOperations()` - Opérations de push
- `useGitRepository()` - Accès direct au repository
- `useAIProvider()` - Accès au provider AI

---

## 🔄 Flux de Données

### Workflow de Commit Manuel

```
User Action (UI)
       │
       ↓
┌──────────────────────────────────┐
│   CommitTab Component            │
│   - User selects files           │
│   - User writes message          │
└──────────────────────────────────┘
       │
       ↓ useStageFiles(), useCreateCommit()
┌──────────────────────────────────┐
│   React Hooks (DI)               │
│   - Resolve use cases from DI    │
└──────────────────────────────────┘
       │
       ↓ execute()
┌──────────────────────────────────┐
│   Use Cases                      │
│   - StageFilesUseCase            │
│   - CreateCommitUseCase          │
└──────────────────────────────────┘
       │
       ↓ business logic
┌──────────────────────────────────┐
│   Domain Entities                │
│   - CommitMessage validation     │
│   - CommitType, Subject, Scope   │
└──────────────────────────────────┘
       │
       ↓ format()
┌──────────────────────────────────┐
│   Repository Interface           │
│   - IGitRepository.createCommit()│
└──────────────────────────────────┘
       │
       ↓ implementation
┌──────────────────────────────────┐
│   GitRepositoryImpl              │
│   - simpleGit.commit()           │
└──────────────────────────────────┘
       │
       ↓
    Git System
```

### Workflow de Génération AI

```
User Action (Choose AI Mode)
       │
       ↓
┌──────────────────────────────────┐
│   AICommitGenerator Component    │
│   - Get staged changes context   │
└──────────────────────────────────┘
       │
       ↓ useGenerateAICommit()
┌──────────────────────────────────┐
│   React Hook (DI)                │
│   - Resolve GenerateAICommitUC   │
└──────────────────────────────────┘
       │
       ↓ execute()
┌──────────────────────────────────┐
│   GenerateAICommitUseCase        │
│   - Get diff from repository     │
│   - Get existing scopes          │
│   - IF diff > threshold THEN     │
│   -   summarize diff with AI     │
│   - Call AI provider             │
└──────────────────────────────────┘
       │
       ├──→ IGitRepository.getStagedChangesContext()
       │        │
       │        ↓
       │    GitRepositoryImpl (get diff & recent commits)
       │
       ├──→ IGitRepository.getExistingScopes()
       │        │
       │        ↓
       │    GitRepositoryImpl (parse git log for scopes)
       │
       ├──→ (conditional) IAIProvider.summarizeChanges(diff)
       │        │
       │        ↓
       │    Provider-specific summary implementation
       │
       └──→ IAIProvider.generateCommitMessage(context)
                │
                ↓
         ┌────────────────────────────┐
         │   AI Provider Adapter      │
         │   (OllamaProviderAdapter)  │
         └────────────────────────────┘
                │
                ↓ wraps
         ┌────────────────────────────┐
         │   Concrete Provider        │
         │   (OllamaProvider)         │
         └────────────────────────────┘
                │
                ↓
            Ollama API
                │
                ↓
         CommitMessage Entity
                │
                ↓
         Return to Component
```

### Cycle de Vie du CompositionRoot

```
┌────────────────────────────────────────────────────────┐
│                   Command Start                         │
│               (commit, stats, hooks)                    │
└────────────────────────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────┐
│   1. Create CompositionRoot                            │
│      const root = new CompositionRoot()                │
└────────────────────────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────┐
│   2. Initialize DI Container                           │
│      - Create DIContainer                              │
│      - Load config                                     │
│      - Register services (ServiceRegistry)             │
└────────────────────────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────┐
│   3. Pre-flight Checks                                 │
│      const repo = root.getContainer().resolve(...)     │
│      const isRepo = await repo.isRepository()          │
└────────────────────────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────┐
│   4. Render React App with DIProvider                  │
│      render(<DIProvider root={root}>...</DIProvider>)  │
└────────────────────────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────┐
│   5. User Interaction                                  │
│      - Components use hooks                            │
│      - Hooks resolve from container                    │
│      - Use cases execute                               │
└────────────────────────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────┐
│   6. Cleanup (finally block)                           │
│      root.dispose()                                    │
│      - Container cleared                               │
│      - Resources freed                                 │
└────────────────────────────────────────────────────────┘
                          │
                          ↓
┌────────────────────────────────────────────────────────┐
│                   Command End                           │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Diagrammes

### Diagramme des Couches (Clean Architecture)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  PRESENTATION LAYER                    ┃
┃                                                        ┃
┃  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┃
┃  │  CommitTab  │  │ FileSelector│  │ AIGenerator  │  ┃
┃  └─────────────┘  └─────────────┘  └──────────────┘  ┃
┃         │                 │                │          ┃
┃         └─────────────────┴────────────────┘          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          │ uses hooks
┏━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃             INFRASTRUCTURE LAYER (DI)                  ┃
┃                         │                              ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │            DIContext + Hooks                     │  ┃
┃  │  useStageFiles, useCreateCommit, etc.           │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┃                         │ resolves                     ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │            CompositionRoot                       │  ┃
┃  │         (DI Container + Registry)                │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          │ creates instances
┏━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                APPLICATION LAYER                       ┃
┃                         │                              ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │               Use Cases                          │  ┃
┃  │  CreateCommit, StageFiles, GenerateAICommit     │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┃                         │ orchestrates                 ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │          DTOs + Mappers                          │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          │ uses
┏━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    DOMAIN LAYER (CORE)                 ┃
┃                         │                              ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │               Entities                           │  ┃
┃  │          CommitMessage (pure logic)              │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┃                         │                              ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │          Value Objects                           │  ┃
┃  │  CommitType, CommitSubject, Scope (validated)   │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┃                         │                              ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │       Repository Interfaces                      │  ┃
┃  │   IGitRepository, IAIProvider (abstractions)    │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          │ implemented by
┏━━━━━━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃          INFRASTRUCTURE LAYER (Implementations)        ┃
┃                         │                              ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │          GitRepositoryImpl                       │  ┃
┃  │         (simple-git wrapper)                     │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┃                         │                              ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │          AI Provider Adapters                    │  ┃
┃  │   OllamaAdapter, MistralAdapter, OpenAIAdapter  │  ┃
┃  └──────────────────────┬──────────────────────────┘  ┃
┃                         │                              ┃
┃  ┌──────────────────────▼──────────────────────────┐  ┃
┃  │              Factories                           │  ┃
┃  │     AIProviderFactory, RepositoryFactory        │  ┃
┃  └──────────────────────────────────────────────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Diagramme de Séquence: Création de Commit

```
User          Component      Hook            UseCase         Entity        Repository      Git
 │                │            │                │              │                │            │
 │  Select files  │            │                │              │                │            │
 ├───────────────>│            │                │              │                │            │
 │                │            │                │              │                │            │
 │  Click commit  │            │                │              │                │            │
 ├───────────────>│            │                │              │                │            │
 │                │            │                │              │                │            │
 │                │ useCreateCommit()           │              │                │            │
 │                ├───────────>│                │              │                │            │
 │                │            │                │              │                │            │
 │                │            │ resolve UseCase│              │                │            │
 │                │            ├───────────────>│              │                │            │
 │                │            │                │              │                │            │
 │                │ execute(dto)                │              │                │            │
 │                │            ├───────────────>│              │                │            │
 │                │            │                │              │                │            │
 │                │            │                │ validate & create entity     │            │
 │                │            │                ├─────────────>│                │            │
 │                │            │                │              │                │            │
 │                │            │                │              │ validate       │            │
 │                │            │                │              │ (throw if bad) │            │
 │                │            │                │              │                │            │
 │                │            │                │<─────────────┤                │            │
 │                │            │                │              │                │            │
 │                │            │                │ entity.format()               │            │
 │                │            │                ├─────────────>│                │            │
 │                │            │                │              │                │            │
 │                │            │                │<─────────────┤                │            │
 │                │            │                │ "feat(cli): add commit"      │            │
 │                │            │                │              │                │            │
 │                │            │                │ createCommit(message)        │            │
 │                │            │                ├──────────────────────────────>│            │
 │                │            │                │              │                │            │
 │                │            │                │              │                │ git commit │
 │                │            │                │              │                ├───────────>│
 │                │            │                │              │                │            │
 │                │            │                │              │                │<───────────┤
 │                │            │                │              │                │            │
 │                │            │                │<──────────────────────────────┤            │
 │                │            │                │              │                │            │
 │                │            │<───────────────┤              │                │            │
 │                │            │ result { success: true }      │                │            │
 │                │            │                │              │                │            │
 │                │<───────────┤                │              │                │            │
 │                │            │                │              │                │            │
 │<───────────────┤            │                │              │                │            │
 │  Show success  │            │                │              │                │            │
```

---

## 🧩 Composants Principaux

### 1. Entities et Value Objects

| Composant | Type | Responsabilité |
|-----------|------|----------------|
| `CommitMessage` | Entity | Représente un message de commit complet |
| `CommitType` | Value Object | Type validé (feat, fix, etc.) |
| `CommitSubject` | Value Object | Sujet validé (longueur, format) |
| `Scope` | Value Object | Scope optionnel validé |

### 2. Use Cases

| Use Case | Responsabilité | Dépendances |
|----------|----------------|-------------|
| `CreateCommitUseCase` | Créer un commit | IGitRepository |
| `GenerateAICommitUseCase` | Générer message AI | IGitRepository, IAIProvider |
| `StageFilesUseCase` | Stager des fichiers | IGitRepository |
| `GetRepositoryStatusUseCase` | Status du repo | IGitRepository |
| `AnalyzeCommitHistoryUseCase` | Analyser l'historique | IGitRepository |
| `BranchOperationsUseCase` | Opérations branches | IGitRepository |
| `PushOperationsUseCase` | Opérations push | IGitRepository |

### 3. Repositories

| Repository | Interface | Implémentation | Technologie |
|------------|-----------|----------------|-------------|
| Git | `IGitRepository` | `GitRepositoryImpl` | simple-git |
| AI | `IAIProvider` | Adapters (Ollama, Mistral, OpenAI) | Providers spécifiques |

### 4. Composants React

| Composant | Type | Utilise |
|-----------|------|---------|
| `CommitTab` | Container | `useStageFiles()` |
| `FileSelector` | Smart | `useRepositoryStatus()` |
| `CommitConfirmation` | Smart | `useStageFiles()`, `useCreateCommit()` |
| `AICommitGenerator` | Smart | `useGenerateAICommit()` |
| `StatsTab` | Smart | `useCommitHistory()` |
| `BranchSelector` | Smart | `useBranchOperations()` |
| `PushPrompt` | Smart | `usePushOperations()` |
| `ErrorMessage` | Presentational | - |
| `LoadingSpinner` | Presentational | - |

---

## 🎨 Patterns Utilisés

### 1. Clean Architecture

**Principe:** Séparation en couches avec dépendances dirigées vers l'intérieur.

**Bénéfices:**
- Code métier isolé des détails techniques
- Testabilité maximale
- Facilite les changements de technologie

### 2. Dependency Injection

**Principe:** Les dépendances sont injectées plutôt que créées.

**Bénéfices:**
- Découplage
- Testabilité (mocks faciles)
- Configuration centralisée

### 3. Repository Pattern

**Principe:** Abstraction de l'accès aux données.

**Bénéfices:**
- Découplage du système de stockage
- Tests sans vraie base Git
- Facilite le changement d'implémentation

### 4. Adapter Pattern

**Principe:** Adaptation d'interface entre domain et infrastructure.

**Bénéfices:**
- Isole les providers AI concrets
- Permet de changer de provider facilement
- Respecte DIP (Dependency Inversion)

### 5. Factory Pattern

**Principe:** Création d'objets via factory centralisée.

**Bénéfices:**
- Configuration centralisée
- Facilite l'ajout de nouveaux providers
- Encapsule la logique de création

### 6. Use Case Pattern

**Principe:** Chaque action métier est un use case.

**Bénéfices:**
- Orchestration claire
- Un point d'entrée par fonctionnalité
- Facilite les tests

### 7. DTO Pattern

**Principe:** Objets dédiés au transfert de données.

**Bénéfices:**
- Découplage des couches
- API claire et stable
- Facilite les migrations

---

## 🧭 Décisions Architecturales

### 1. Pourquoi Clean Architecture ?

**Problème initial:**
- Code mélangé (UI, logique métier, accès Git)
- Difficile à tester
- Couplage fort entre composants

**Solution:**
- Séparation stricte en couches
- Domain au centre, indépendant
- Infrastructure externalisée

**Résultat:**
- 403 tests (350 unitaires + 53 intégration)
- 100% du domain testable sans Git
- Facilite l'évolution

### 2. Pourquoi Dependency Injection ?

**Problème:**
- Composants créaient leurs dépendances
- Impossible de mocker pour tests
- Configuration dispersée

**Solution:**
- DIContainer custom léger
- Registration centralisée
- Hooks React pour injection

**Résultat:**
- Tests avec mocks faciles
- Configuration en un seul endroit
- Lifecycle management propre

### 3. Pourquoi Value Objects ?

**Problème:**
- Validation dispersée
- Possibilité d'états invalides
- Duplication de code

**Solution:**
- Value Objects immutables
- Validation à la construction
- Impossible de créer état invalide

**Résultat:**
- Validation centralisée
- Type-safety renforcée
- Code plus sûr

### 4. Pourquoi Adapter Pattern pour AI ?

**Problème:**
- Providers AI avec interfaces différentes
- Couplage fort avec implémentations
- Difficile de changer de provider

**Solution:**
- Adapters wrappant les providers
- Interface IAIProvider dans domain
- Factory pour création

**Résultat:**
- Changement de provider facile
- Tests avec mock provider
- Pas de duplication de code

### 5. Pourquoi React Hooks pour DI ?

**Problème:**
- Accès au DI container verbose
- Répétition de code dans composants
- Gestion d'état loading/error dupliquée

**Solution:**
- Hooks custom par use case
- Encapsulation loading/error
- API simple pour composants

**Résultat:**
- Composants plus simples
- Code réutilisable
- API intuitive

---

## 📈 Métriques Architecture

### Couverture par Couche

| Couche | Fichiers | Tests | Coverage |
|--------|----------|-------|----------|
| Domain | 12 | 60 | 100% |
| Application | 18 | 23 | 95% |
| Infrastructure | 25 | 112 | 90% |
| Presentation | 23 | 155 | 85% |
| Integration | 3 | 53 | - |
| **Total** | **81** | **403** | **92%** |

### Complexité Cyclomatique

| Composant | Complexité | Statut |
|-----------|------------|--------|
| Value Objects | 1-2 | ✅ Excellent |
| Entities | 2-4 | ✅ Excellent |
| Use Cases | 3-6 | ✅ Bon |
| Repositories | 4-8 | ✅ Bon |
| Components | 5-10 | ⚠️ Acceptable |

### Dépendances

```
Domain: 0 external dependencies
Application: Domain only
Infrastructure: Domain + Application + External libs
Presentation: Infrastructure + React + Ink
```

**Respect du Dependency Rule: ✅ 100%**

---

## 🚀 Performance

### Bundle Analysis

```
Total Bundle Size: 166.92 KB
├── Core (Domain + Application): 12 KB (7%)
├── Infrastructure: 35 KB (21%)
├── Presentation (React/Ink): 45 KB (27%)
└── External libs: 74.92 KB (45%)
```

### Build Times

```
ESM Build: ~38ms
DTS Build: ~1200ms
Total: ~1.2s
```

### Test Execution

```
Unit Tests (350): ~2-3s
Integration Tests (53): ~1-2s
Total Test Suite: ~4-5s
```

---

## 🔮 Évolution Future

### Extensions Prévues

1. **Nouveaux AI Providers**
   - Ajout via Factory
   - Adapter Pattern facilite l'intégration

2. **Nouveaux Use Cases**
   - Template existant
   - Registration dans ServiceRegistry

3. **Optimisations**
   - Lazy loading des use cases
   - Caching dans repositories
   - Bundle splitting

### Maintenabilité

**Forces:**
- Architecture claire et documentée
- Tests complets (403 tests)
- Patterns cohérents
- Couplage faible

**Points d'attention:**
- Nombre croissant de use cases
- Gestion du cache DI container
- Performance avec nombreux services

---

## 📚 Ressources

### Documentation Externe

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection Principles](https://en.wikipedia.org/wiki/Dependency_injection)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Value Objects](https://martinfowler.com/bliki/ValueObject.html)

### Documentation Interne

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Guide de migration
- [USE_CASES.md](./USE_CASES.md) - Documentation des use cases
- [PHASE*_SUMMARY.md](.) - Résumés des phases de refactoring

---

**Document créé:** 2025-11-19
**Version:** 2.0 - Clean Architecture
**Statut:** ✅ Production Ready
**Tests:** 403 tests (92% coverage)
