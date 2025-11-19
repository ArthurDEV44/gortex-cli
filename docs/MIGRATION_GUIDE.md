# Migration Guide: Clean Architecture with DI

Ce guide explique comment migrer les composants existants pour utiliser la nouvelle architecture clean avec injection de dépendances.

## Vue d'ensemble

L'architecture a été refactorisée pour suivre les principes de Clean Architecture:

```
Presentation (Components)
    ↓ uses
Application (Use Cases, DTOs)
    ↓ uses
Domain (Entities, Value Objects, Interfaces)
    ↑ implements
Infrastructure (Repositories, AI Providers, Factories, DI)
```

## Avant: Code Legacy

```typescript
// ❌ ANCIEN: Import et utilisation directe
import { stageFiles, createCommit } from '../utils/git.js';
import { OllamaProvider } from '../ai/providers/ollama.js';

export function MyComponent() {
  const handleStage = async (files: string[]) => {
    await stageFiles(files); // Couplage fort
  };

  const provider = new OllamaProvider(); // Instanciation directe
}
```

## Après: Architecture Clean

```typescript
// ✅ NOUVEAU: Utilisation des hooks DI
import { useStageFiles, useCreateCommit } from '../infrastructure/di/hooks.js';
import { DIProvider } from '../infrastructure/di';

export function MyComponent() {
  const stageFilesUseCase = useStageFiles();
  const createCommitUseCase = useCreateCommit();

  const handleStage = async (files: string[]) => {
    const result = await stageFilesUseCase.execute({ files });
    if (!result.success) {
      console.error(result.error);
    }
  };
}

// Dans le composant parent ou root
function App() {
  return (
    <DIProvider>
      <MyComponent />
    </DIProvider>
  );
}
```

## Hooks Disponibles

### 1. Hook use DI de base

```typescript
import { useDI, useCompositionRoot, useServices } from '../infrastructure/di';

// Accès complet au contexte DI
const { root, services } = useDI();

// Accès au composition root
const root = useCompositionRoot();

// Accès à tous les services
const services = useServices();
```

### 2. Hooks spécialisés par Use Case

```typescript
import {
  useStageFiles,
  useCreateCommit,
  useGenerateAICommit,
  useRepositoryStatus,
  useCommitHistory,
} from '../infrastructure/di/hooks';

// Stage des fichiers
const stageFiles = useStageFiles();
const result = await stageFiles.execute({ files: ['file.ts'] });

// Créer un commit
const createCommit = useCreateCommit();
const result = await createCommit.execute({
  message: {
    type: 'feat',
    subject: 'add feature',
  },
  push: true,
});

// Générer un commit avec IA
const generateAI = useGenerateAICommit();
const result = await generateAI.execute({
  provider: aiProvider,
  includeScope: true,
});

// Obtenir le status du repo
const repoStatus = useRepositoryStatus();
const status = await repoStatus.execute();

// Analyser l'historique
const history = useCommitHistory();
const stats = await history.execute({ maxCount: 100 });
```

## Migration des Composants

### Étape 1: Wrapper avec DIProvider

```typescript
// src/commands/commit.tsx
import { DIProvider, CompositionRoot } from '../infrastructure/di';

export async function commitCommand() {
  const root = new CompositionRoot();

  try {
    const { waitUntilExit } = render(
      <DIProvider root={root}>
        <InteractiveWorkflow config={config} />
      </DIProvider>
    );
    await waitUntilExit();
  } finally {
    root.dispose(); // Cleanup
  }
}
```

### Étape 2: Remplacer les imports utils

```typescript
// ❌ AVANT
import { stageFiles, createCommit, hasChanges } from '../utils/git.js';

const files = await getModifiedFiles();
await stageFiles(files);
await createCommit(message);

// ✅ APRÈS
import { useStageFiles, useCreateCommit, useRepositoryStatus } from '../infrastructure/di/hooks';

const stageFilesUseCase = useStageFiles();
const createCommitUseCase = useCreateCommit();
const statusUseCase = useRepositoryStatus();

const status = await statusUseCase.execute();
await stageFilesUseCase.execute({ files: status.modifiedFiles });
await createCommitUseCase.execute({ message: messageDTO });
```

### Étape 3: Utiliser les DTOs

```typescript
// ❌ AVANT: Types bruts
const message = `${type}(${scope}): ${subject}`;
await createCommit(message);

// ✅ APRÈS: DTOs typés
import { CommitMessageDTO } from '../application/dto';

const messageDTO: CommitMessageDTO = {
  type: 'feat',
  scope: 'auth',
  subject: 'add login',
  body: 'Detailed description',
};

const result = await createCommitUseCase.execute({
  message: messageDTO,
  push: true,
});

if (result.success) {
  console.log('Commit created:', result.formattedMessage);
}
```

## Configuration du DI

### Configuration de base

```typescript
import { CompositionRoot } from '../infrastructure/di';

const root = new CompositionRoot({
  workingDirectory: '/path/to/repo',
  aiProviderType: 'ollama',
});
```

### Configuration avancée

```typescript
import { CompositionRoot, ServiceRegistry, DIContainer } from '../infrastructure/di';
import { ServiceIdentifiers } from '../infrastructure/di/ServiceRegistry';

// Créer un container personnalisé
const container = new DIContainer();

// Register custom instances (utile pour les tests)
container.registerInstance(ServiceIdentifiers.GitRepository, mockRepository);

// Enregistrer les services
ServiceRegistry.registerServices(container, {
  aiProviderType: 'mistral',
  aiConfig: {
    provider: 'mistral',
    mistral: {
      apiKey: process.env.MISTRAL_API_KEY,
    },
  },
});

// Utiliser le container personnalisé
const root = new CompositionRoot();
// ... utiliser root.getContainer() pour accéder au container
```

## Tests

### Tests de composants React

```typescript
import { render } from '@testing-library/react';
import { DIProvider, CompositionRoot } from '../infrastructure/di';

test('should render with DI', () => {
  const root = new CompositionRoot();

  const { getByText } = render(
    <DIProvider root={root}>
      <MyComponent />
    </DIProvider>
  );

  expect(getByText('Expected Text')).toBeInTheDocument();
});
```

### Tests avec mocks

```typescript
import { DIContainer, ServiceIdentifiers } from '../infrastructure/di';

test('should use mocked repository', async () => {
  const container = new DIContainer();

  // Mock du repository
  const mockRepo = {
    isRepository: vi.fn().mockResolvedValue(true),
    hasChanges: vi.fn().mockResolvedValue(true),
  };

  container.registerInstance(ServiceIdentifiers.GitRepository, mockRepo);

  // Test avec le mock
  const repo = container.resolve(ServiceIdentifiers.GitRepository);
  expect(await repo.isRepository()).toBe(true);
});
```

## Bonnes Pratiques

1. **Toujours wrapper avec DIProvider**: Tout composant utilisant les hooks DI doit être enfant d'un DIProvider

2. **Utiliser les hooks, pas les imports directs**: Ne jamais importer directement les implémentations

3. **Gérer le lifecycle**: Appeler `root.dispose()` quand le root n'est plus nécessaire

4. **Utiliser les DTOs**: Toujours utiliser les DTOs de l'application layer pour passer les données

5. **Tester avec des mocks**: Utiliser le DI container pour injecter des mocks dans les tests

## Checklist de Migration

- [ ] Wrapper le composant root avec `DIProvider`
- [ ] Remplacer les imports de `utils/git.js` par les hooks
- [ ] Remplacer les imports de `ai/providers` par les hooks
- [ ] Utiliser les DTOs au lieu des types bruts
- [ ] Gérer les erreurs via `result.success` et `result.error`
- [ ] Ajouter des tests avec mocks
- [ ] Cleanup avec `root.dispose()`

## Support

Pour toute question sur la migration, consulter:
- `src/infrastructure/di/` - Code source du système DI
- `src/application/use-cases/` - Use cases disponibles
- `src/application/dto/` - DTOs disponibles
