# TODO - GORTEX CLI Clean Architecture Refactoring

## 📊 État Actuel: 7/13 Phases Complétées (325+ tests)

### ✅ PHASES COMPLÉTÉES

#### Phase 1-2: Foundations & Test Infrastructure
- ✅ Structure de base Clean Architecture
- ✅ 130+ tests existants fonctionnels
- ✅ Configuration Vitest avec coverage
- ✅ Mocks pour simple-git

#### Phase 3: Domain Layer (60 tests, 100% coverage)
**Localisation:** `src/domain/`
- ✅ Entities: `CommitMessage` (src/domain/entities/CommitMessage.ts)
- ✅ Value Objects: `CommitType`, `CommitSubject`, `Scope` (src/domain/value-objects/)
- ✅ Services: `CommitMessageService` (src/domain/services/)
- ✅ Interfaces: `IGitRepository`, `IAIProvider` (src/domain/repositories/)
- ✅ Tests: 60 tests, 100% coverage

#### Phase 4: Application Layer (23 tests, 95% coverage)
**Localisation:** `src/application/`
- ✅ DTOs: `CommitMessageDTO`, `GitStatusDTO`, `AIGenerationDTO` (src/application/dto/)
- ✅ Mappers: `CommitMessageMapper`, `GitDataMapper` (src/application/mappers/)
- ✅ Use Cases (src/application/use-cases/):
  - CreateCommitUseCase
  - GenerateAICommitUseCase
  - GetRepositoryStatusUseCase
  - AnalyzeCommitHistoryUseCase
  - StageFilesUseCase
- ✅ Tests: 23 tests, 95% coverage

#### Phase 5: Infrastructure Layer (50 tests)
**Localisation:** `src/infrastructure/`
- ✅ Repositories: `GitRepositoryImpl` (src/infrastructure/repositories/)
- ✅ AI Adapters: `OllamaProviderAdapter`, `MistralProviderAdapter`, `OpenAIProviderAdapter` (src/infrastructure/ai/)
- ✅ Factories: `AIProviderFactory`, `RepositoryFactory` (src/infrastructure/factories/)
- ✅ Tests: 50 tests, factories 100% coverage

#### Phase 6: Dependency Injection (62 tests, 90% coverage)
**Localisation:** `src/infrastructure/di/`
- ✅ `DIContainer.ts` - Container avec register/resolve (97% coverage)
- ✅ `ServiceRegistry.ts` - Configuration bindings (77% coverage)
- ✅ `CompositionRoot.ts` - Bootstrap application (100% coverage)
- ✅ Tests: 62 tests

#### Phase 7: React DI Integration
**Localisation:** `src/infrastructure/di/`, `docs/`
- ✅ `DIContext.tsx` - React Context pour DI
- ✅ `hooks.ts` - Hooks spécialisés (useStageFiles, useCreateCommit, etc.)
- ✅ `commit-refactored.tsx` - Exemple de command refactoré
- ✅ `docs/MIGRATION_GUIDE.md` - Guide de migration complet

---

## 🚧 PHASES RESTANTES (6 phases)

### Phase 8: Migration Progressive des Composants ✅ 2/7 COMPLÉTÉS
**Objectif:** Migrer les composants existants pour utiliser DI et use cases

**Fichiers migrés:** ✅
1. ✅ `src/components/CommitTab.tsx` (MIGRÉ)
   - ✅ Remplacé `stageFiles` par `useStageFiles()`
   - ✅ Utilise pattern success/error
   - ✅ Hook appelé au niveau du composant

2. ✅ `src/components/FileSelector.tsx` (MIGRÉ)
   - ✅ Remplacé `getModifiedFilesWithStatus()` par `useRepositoryStatus()`
   - ✅ Conversion DTO vers format interne
   - ✅ Gestion d'erreurs ajoutée

**Fichiers restants à migrer:**
3. `src/components/CommitConfirmation.tsx` (EN ATTENTE)
   - Utiliser `useCreateCommit()` pour `createCommit()`
   - Note: Nécessite parsing du message string vers DTO ou nouvelle méthode

4. `src/components/PushPrompt.tsx`
   - Utiliser `useRepositoryStatus()` pour hasRemote, hasUpstream, etc.

5. `src/components/BranchSelector.tsx`
   - Utiliser `useRepositoryStatus()` pour getCurrentBranch, etc.

6. `src/components/AICommitGenerator.tsx`
   - Utiliser `useGenerateAICommit()` au lieu d'appels directs

7. `src/components/StatsTab.tsx`
   - Utiliser `useCommitHistory()` pour analyzeCommitStats

**Approche:**
- Wrapper chaque component parent avec `<DIProvider>`
- Remplacer imports utils par hooks DI
- Utiliser DTOs au lieu de types bruts
- Tester composant par composant

**Référence:** `docs/MIGRATION_GUIDE.md`

### Phase 9: Migration des Commands CLI
**Objectif:** Migrer toutes les commandes pour utiliser DI

**Fichiers à migrer:**
1. `src/commands/commit.tsx` → Remplacer par `commit-refactored.tsx`
2. `src/commands/ai-suggest.tsx` → Utiliser `useGenerateAICommit()`
3. `src/commands/stats.ts` → Utiliser `useCommitHistory()`

**Template de migration:**
```typescript
import { DIProvider, CompositionRoot } from '../infrastructure/di';

export async function myCommand() {
  const root = new CompositionRoot();
  try {
    const { waitUntilExit } = render(
      <DIProvider root={root}>
        <MyComponent />
      </DIProvider>
    );
    await waitUntilExit();
  } finally {
    root.dispose();
  }
}
```

### Phase 10: Cleanup du Code Legacy
**Objectif:** Supprimer/déprécier ancien code après migration

**Fichiers à nettoyer:**
1. `src/utils/git.ts` - Déprécier après migration complète
2. `src/ai/` (ancien système) - Garder les providers, supprimer duplications
3. Vérifier imports obsolètes dans tous les fichiers

**Commandes de vérification:**
```bash
# Trouver les imports de utils/git
grep -r "from.*utils/git" src/components/

# Trouver les imports directs des providers
grep -r "from.*ai/providers" src/components/
```

### Phase 11: Tests d'Intégration
**Objectif:** Ajouter tests bout-en-bout avec DI

**Tests à créer:**
1. `src/__tests__/integration/commit-workflow.test.tsx`
   - Test du workflow complet avec DI
   - Mocks des repositories et providers

2. `src/__tests__/integration/ai-generation.test.ts`
   - Test génération AI avec différents providers

3. `src/__tests__/integration/cli-commands.test.ts`
   - Test des commandes CLI avec DI

**Template de test:**
```typescript
import { DIContainer, ServiceIdentifiers } from '../infrastructure/di';

test('complete commit workflow', async () => {
  const container = new DIContainer();
  container.registerInstance(ServiceIdentifiers.GitRepository, mockRepo);
  // ... test
});
```

### Phase 12: Documentation & Polish
**Objectif:** Documentation complète et finalisation

**À créer:**
1. `docs/ARCHITECTURE.md` - Diagrammes de l'architecture
2. `docs/USE_CASES.md` - Documentation de chaque use case
3. `README.md` - Mettre à jour avec nouvelle architecture
4. `CONTRIBUTING.md` - Guide pour contribuer

**Diagrammes à créer:**
- Diagramme des couches (Domain → Application → Infrastructure)
- Flux de données avec DI
- Cycle de vie du CompositionRoot

### Phase 13: Performance & Optimizations
**Objectif:** Optimiser l'architecture et les performances

**Tâches:**
1. Analyser bundle size après refactoring
2. Lazy loading des use cases si nécessaire
3. Optimiser DI container pour production
4. Benchmarks de performance
5. Tree shaking verification

---

## 🎯 PRIORITÉS IMMÉDIATES

### 1. Migrer CommitTab.tsx (CRITIQUE)
**Fichier:** `src/components/CommitTab.tsx`
**Raison:** Component principal du workflow
**Étapes:**
1. Wrapper avec DIProvider dans InteractiveWorkflow
2. Remplacer `stageFiles()` par `useStageFiles()`
3. Tester le workflow complet

### 2. Migrer CommitConfirmation.tsx
**Fichier:** `src/components/CommitConfirmation.tsx`
**Raison:** Crée le commit, fonction critique
**Étapes:**
1. Utiliser `useCreateCommit()` hook
2. Passer CommitMessageDTO au lieu de string
3. Gérer result.success/error

### 3. Tests d'Intégration Basiques
**Créer:** `src/__tests__/integration/basic-workflow.test.ts`
**Raison:** Valider que DI fonctionne end-to-end
**Contenu:** Test du flow stage → commit avec mocks

---

## 📚 RÉFÉRENCES IMPORTANTES

### Documentation
- **Migration:** `docs/MIGRATION_GUIDE.md`
- **Architecture:** Voir diagrammes dans les commits de phases

### Code Clés
- **DI Setup:** `src/infrastructure/di/`
- **Use Cases:** `src/application/use-cases/`
- **Hooks React:** `src/infrastructure/di/hooks.ts`
- **Example:** `src/commands/commit-refactored.tsx`

### Tests
- **Run all:** `npm test`
- **DI tests:** `npm test -- src/infrastructure/di/`
- **Coverage:** `npm test -- --coverage`

### Commandes Utiles
```bash
# Trouver fichiers à migrer
grep -r "from.*utils/git" src/components/ src/commands/

# Vérifier imports legacy
grep -r "import.*ai/providers" src/

# Lancer tests spécifiques
npm test -- src/application/
npm test -- src/infrastructure/

# Coverage du DI
npm test -- src/infrastructure/di/ --coverage
```

---

## ✅ VALIDATION

Avant de considérer une phase complète:
1. [ ] Tous les tests passent
2. [ ] Coverage ≥ 80% pour nouveau code
3. [ ] Aucun import direct de utils/git ou ai/providers dans components
4. [ ] Documentation à jour
5. [ ] Exemple de migration créé si pertinent

---

## 🎓 NOTES POUR CLAUDE CLI

**Context important:**
- Architecture = Clean Architecture (Domain → Application → Infrastructure)
- DI = Dependency Injection via CompositionRoot
- Use Cases = Point d'entrée de la business logic
- DTOs = Data Transfer Objects entre couches
- Repositories = Abstractions pour accès données

**Pattern de migration:**
1. Identifier imports de `utils/git.js` ou `ai/providers`
2. Remplacer par hooks DI correspondants
3. Wrapper parent avec `<DIProvider>`
4. Utiliser DTOs au lieu de types primitifs
5. Gérer errors via `result.success`

**En cas de doute:**
- Consulter `docs/MIGRATION_GUIDE.md`
- Voir exemple dans `src/commands/commit-refactored.tsx`
- Regarder tests dans `src/infrastructure/di/*.test.ts`
