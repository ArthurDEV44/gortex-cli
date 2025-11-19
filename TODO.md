# TODO : Amélioration du Système de Génération de Commits par l'IA

Ce document détaille les étapes nécessaires pour améliorer la qualité et la précision du module de génération de messages de commit de Gortex CLI.

## ✅ Étape 1 : Enrichir la Qualité du Contexte Fourni à l'IA

*Objectif : Fournir des données plus riches et moins bruitées au modèle pour améliorer sa compréhension.*

-   [ ] **1.1 : Augmenter le contexte du `diff`**
    -   [ ] Localiser l'implémentation de `IGitRepository` (probablement dans `src/infrastructure/repositories/GitRepositoryImpl.ts`).
    -   [ ] Modifier la méthode qui exécute `git diff --staged` pour y ajouter le drapeau `-U3`. Cela inclura 3 lignes de contexte autour de chaque changement.
    -   [ ] Vérifier que les tests associés au parsing du diff sont toujours valides ou les mettre à jour.

-   [ ] **1.2 : Pré-filtrer le `diff` pour réduire le bruit**
    -   [ ] Dans le `GenerateAICommitUseCase` ou une méthode utilitaire, ajouter une logique pour exclure les fichiers non pertinents (`pnpm-lock.yaml`, `package-lock.json`, etc.) de la liste des fichiers envoyée à l'IA.
    -   [ ] *Optionnel :* Mettre en place un filtrage plus avancé pour ignorer les changements de formatage (si un outil comme `prettier` est utilisé de manière consistente).

## ✅ Étape 2 : Implémenter la Stratégie de Résumé pour les Diffs Volumineux

*Objectif : Gérer intelligemment les changements de grande taille sans perdre l'intention du développeur.*

-   [ ] **2.1 : Ajouter une méthode de résumé au `IAIProvider`**
    -   [ ] Définir une nouvelle méthode dans l'interface `IAIProvider` (dans `src/domain/repositories/IAIProvider.ts`), par exemple `summarizeChanges(diff: string): Promise<string>`.
    -   [ ] Implémenter cette méthode dans les `Adapters` existants (`OllamaProviderAdapter`, etc.). Le prompt pour cette méthode sera simple, du type : "Résume les changements de code suivants en 3 points clés maximum."

-   [ ] **2.2 : Adapter le `GenerateAICommitUseCase`**
    -   [ ] Définir un seuil de taille pour le `diff` (par exemple, `10 000` caractères) dans les constantes de l'application.
    -   [ ] Dans la méthode `execute`, ajouter une condition :
        -   **Si `diff.length > SEUIL`**:
            -   Appeler la nouvelle méthode `provider.summarizeChanges(diff)`.
            -   Remplacer le `diff` original par le résumé obtenu pour la suite du processus.
        -   **Sinon**:
            -   Conserver le comportement actuel.

-   [ ] **2.3 : Mettre à jour les tests**
    -   [ ] Créer un test spécifique pour le `GenerateAICommitUseCase` qui valide le déclenchement du workflow de résumé avec un `diff` volumineux.

## ✅ Étape 3 : Raffiner la Stratégie de Prompting

*Objectif : Moderniser les prompts pour tirer parti des capacités des modèles récents (structuration, "Chain of Thought").*

-   [ ] **3.1 : Adopter un format de prompt structuré (XML)**
    -   [ ] Modifier `generateUserPrompt` (dans `src/ai/prompts/commit-message.ts`) pour encapsuler les différentes parties du contexte dans des balises (ex: `<git_context>`, `<diff>`, `<recent_commits>`).
    -   [ ] Utiliser `<![CDATA[...]]>` pour le contenu du `diff` afin d'éviter toute confusion avec la structure XML.

-   [ ] **3.2 : Encourager une "Chaîne de Pensée" (Chain of Thought)**
    -   [ ] Modifier le prompt système (`generateSystemPrompt`) pour ajuster les instructions.
    -   [ ] Demander explicitement à l'IA de d'abord remplir le champ `reasoning` en analysant le but des changements, puis d'utiliser ce raisonnement pour choisir `type`, `scope` et `subject`.

-   [ ] **3.3 : Laisser l'IA déduire le `scope`**
    -   [ ] Supprimer l'appel à `detectScopeFromFiles` dans le `GenerateAICommitUseCase`.
    -   [ ] À la place, fournir la liste des scopes existants dans le projet (extraite de l'historique Git) comme simple suggestion dans le prompt.
    -   [ ] Mettre à jour les instructions du prompt système pour indiquer que le champ `scope` doit être déduit du contenu des changements, et que les suggestions sont là pour l'orienter.

## ✅ Étape 4 : Validation et Finalisation

*Objectif : S'assurer que les changements sont fonctionnels et représentent une réelle amélioration.*

-   [ ] **4.1 : Tests de régression**
    -   [ ] Exécuter l'ensemble de la suite de tests (`pnpm test`) pour s'assurer qu'aucun comportement existant n'a été cassé.

-   [ ] **4.2 : Tests de validation manuelle**
    -   [ ] Tester le nouveau système avec différents types de commits :
        -   Un petit bug fix sur une seule ligne.
        -   L'ajout d'une nouvelle fonctionnalité répartie sur 2-3 fichiers.
        -   Un refactoring complexe touchant de nombreux fichiers (pour valider la stratégie de résumé).
        -   Une simple modification de documentation.
    -   [ ] Comparer la qualité des messages générés "avant" et "après" les améliorations.

-   [ ] **43 : Nettoyage du code**
    -   [ ] Supprimer la fonction `detectScopeFromFiles` devenue obsolète (dans `src/ai/analyzer.ts`).
    -   [ ] Mettre à jour la documentation interne si nécessaire (ex: `docs/ARCHITECTURE.md`) pour refléter le nouveau workflow.
