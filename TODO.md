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
- [x] **Semantic diff summarization**  
  ✅ Implémenté : Ajout des seuils `SEMANTIC_SUMMARY_THRESHOLD` (0.5) et `MAX_SEMANTIC_SUMMARY_TOKENS` (300) dans `limits.ts`. Implémentation de `summarizeDiffSemantics()` dans `GenerateAICommitUseCase` qui génère un résumé sémantique pour les diffs >50% de `MAX_DIFF_LENGTH`. Ajout de `<semantic_summary>` dans `generateUserPrompt()` et transmission via `AIGenerationContext` et `CommitContext` à tous les providers. Le résumé est généré avec température 0.6 pour plus de créativité et focus sur l'architecture plutôt que les détails techniques.

## Priorité 3 · Vérification & contexte (Semaine 3)

- [x] **Self-verification loop**  
  ✅ Implémenté : Ajout de l'interface `VerificationResult` et des fonctions `generateVerificationSystemPrompt()` / `generateVerificationUserPrompt()` dans `commit-message.ts`. Implémentation de la boucle de vérification dans `GenerateAICommitUseCase` qui évalue automatiquement la qualité du commit généré selon 5 critères (subject sémantique, body explicatif, symboles clés mentionnés, type cohérent, clarté). Si des améliorations sont proposées (`improvedSubject` ou `improvedBody`), elles sont appliquées automatiquement et la confiance est réduite de 10% (x0.9). Gestion d'erreur avec fallback gracieux si la vérification échoue.
- [x] **ProjectStyleAnalyzer**  
  ✅ Implémenté : Création de l'interface `IProjectStyleAnalyzer` et du type `ProjectStyle` dans `src/domain/services/ProjectStyleAnalyzer.ts`. Implémentation `ProjectStyleAnalyzerImpl` dans `src/infrastructure/services/` qui analyse l'historique Git (100 commits par défaut) pour extraire : types préférés (top 3), longueur moyenne des subjects, scopes communs, niveau de détail (detailed/concise), templates de subjects, conformité aux conventional commits. Enregistrement dans `ServiceRegistry` comme singleton. Intégration dans `GenerateAICommitUseCase` avec fallback gracieux si l'analyse échoue. Ajout de `<project_style>` dans `generateUserPrompt()` avec toutes les métriques. Transmission via `AIGenerationContext` et `CommitContext` à tous les providers (Ollama, Mistral, OpenAI).
- [x] **Support des guidelines projet**  
  ✅ Implémenté : Création de `src/utils/projectGuidelines.ts` avec `loadProjectCommitGuidelines()` qui cherche les fichiers dans l'ordre de priorité : `.claude/commands/commit.md`, `.gortex/commit-guidelines.md`, `COMMIT_GUIDELINES.md`, `.github/COMMIT_GUIDELINES.md`. Intégration dans `GenerateAICommitUseCase` avec chargement automatique depuis le répertoire de travail du projet Git. Ajout de `projectGuidelines` dans `AIGenerationContext` et `CommitContext`. Ajout de la section `<project_commit_guidelines>` dans `generateUserPrompt()` avec indication que ces règles priment sur les instructions génériques. Transmission via tous les adaptateurs et providers (Ollama, Mistral, OpenAI). Gestion d'erreur avec fallback gracieux si le chargement échoue.
