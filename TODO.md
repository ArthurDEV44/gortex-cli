# TODO – Plan d’implémentation post-audit

Ce plan traduit les recommandations de `GENERATE_AI_AUDIT.md` en travaux alignés sur l’architecture Clean de `gortex-cli`. Les tâches sont regroupées par priorité (deux premières semaines ciblées).

## Priorité 1 · Quick wins (Semaine 1)

- [x] **Chaîne de raisonnement (CoT)**  
  ✅ Implémenté : Ajout de `generateText()` dans `IAIProvider` et tous les adaptateurs. Création des prompts CoT (`generateReasoningSystemPrompt`, `generateReasoningUserPrompt`). Intégration dans `GenerateAICommitUseCase` avec dégradation gracieuse si le raisonnement échoue. Le raisonnement est maintenant inclus dans le contexte AI pour améliorer la qualité des commits générés.
- [x] **Réglages modèle par défaut**  
  ✅ Implémenté : Mise à jour de `temperature` à 0.5 et ajout de `topP` à 0.9 dans `ai-defaults.ts`, `BaseAIProvider`, et tous les providers (Ollama, Mistral, OpenAI). Les valeurs sont exposées dans `.gortexrc.example` et `.gortexrc.ai-example`. Support complet de `top_p` dans les requêtes API de tous les providers.
- [x] **Few-shot annotés**  
  ✅ Implémenté : Création de `src/ai/examples/commit-samples.ts` avec 10 exemples annotés de qualité (score 3-5/5). Implémentation de `selectRelevantExamples()` qui sélectionne les exemples pertinents basés sur le pattern de changement, la complexité et le nombre de fichiers. Intégration dans `GenerateAICommitUseCase` et mise à jour des prompts pour inclure les exemples few-shot avant les commits récents du projet.

## Priorité 2 · Analyse avancée (Semaine 2)

- [x] **ASTDiffAnalyzer**  
  ✅ Implémenté : Création de `src/domain/services/ASTDiffAnalyzer.ts` avec interface `IASTDiffAnalyzer` et types (`Refactoring`, `StructuralChange`, `SemanticImpact`). Implémentation `TreeSitterASTDiffAnalyzer` dans `src/infrastructure/services/ast/`. Intégration dans `DiffAnalyzer` avec méthode `setASTAnalyzer()` et fusion des analyses AST et ligne. Support gracieux si Tree-Sitter n'est pas disponible (fallback sur analyse ligne). **Note** : Nécessite d'ajouter les dépendances `tree-sitter`, `tree-sitter-typescript`, `tree-sitter-javascript` dans `package.json`.
- [x] **Infrastructure Tree-Sitter**  
  ✅ Implémenté : Création de `ASTAnalyzerFactory` dans `src/infrastructure/factories/`. Intégration dans `ServiceRegistry` avec identifiant `ServiceIdentifiers.ASTDiffAnalyzer` (singleton). Modification de `GenerateAICommitUseCase` pour accepter `IASTDiffAnalyzer` via DI et le configurer sur `DiffAnalyzer`. Documentation dans `docs/TREE_SITTER_SETUP.md`. **Note** : Les dépendances `tree-sitter`, `tree-sitter-typescript`, `tree-sitter-javascript` doivent être ajoutées dans `package.json` (fichier protégé, nécessite validation mainteneur). Le système fonctionne sans ces dépendances (fallback gracieux).
- [ ] **Semantic diff summarization**  
  Implémenter `summarizeDiffSemantics()` dans `GenerateAICommitUseCase`, ajouter le `<semantic_summary>` au prompt utilisateur et définir les seuils dans `shared/constants/limits.ts`.

## Priorité 3 · Vérification & contexte (Semaine 3)

- [ ] **Self-verification loop**  
  Après génération du commit, déclencher un prompt de vérification (format JSON) et réinjecter les améliorations dans le DTO avant retour UI.
- [ ] **ProjectStyleAnalyzer**  
  Créer `src/domain/services/ProjectStyleAnalyzer.ts`, exposer la dépendance git via `IGitRepository`, puis enrichir `GenerateAICommitUseCase` pour intégrer `<project_style>` dans les prompts.
- [ ] **Support des guidelines projet**  
  Ajouter `src/utils/projectGuidelines.ts`, charger `.claude/commands/commit.md` ou équivalents et inclure le contenu dans le prompt s’il existe.

## Priorité 4 · Qualité & instrumentation (Semaine 4)

- [ ] **Metrics & logging**  
  Implémenter `CommitQualityMetrics` dans `src/evaluation/CommitQualityMetrics.ts` et un logger `logCommitGeneration()` qui écrit dans `.gortex/quality-metrics.jsonl`.
- [ ] **Boucle de feedback utilisateur**  
  Ajouter dans la présentation (Ink) une étape de notation/retour après génération, remonter les données aux métriques puis persister.

## Suivi & risques

- [ ] Documenter les nouveaux workflows dans `docs/` (architecture + READMEs) dès qu’une phase est livrée.
- [ ] Mesurer la latence induite par CoT/self-verification et ajuster l’activation dynamique selon la confiance calculée.

