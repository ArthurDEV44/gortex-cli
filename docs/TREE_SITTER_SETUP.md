# Tree-Sitter Setup pour ASTDiffAnalyzer

L'ASTDiffAnalyzer nécessite les dépendances Tree-Sitter pour fonctionner. Ces dépendances sont optionnelles - le système fonctionnera sans elles mais utilisera uniquement l'analyse ligne par ligne.

## Installation

Pour activer l'analyse AST, installez les dépendances suivantes :

```bash
pnpm add tree-sitter tree-sitter-typescript tree-sitter-javascript
```

## Utilisation

L'ASTDiffAnalyzer est automatiquement utilisé si les dépendances sont disponibles. Il n'y a pas de configuration supplémentaire nécessaire.

## Support des langages

Actuellement supporté :
- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)

## Fallback

Si Tree-Sitter n'est pas disponible, le système utilise automatiquement l'analyse ligne par ligne existante. Aucune erreur ne sera générée.

## Architecture

- **Domaine** : `src/domain/services/ASTDiffAnalyzer.ts` - Interface et types
- **Infrastructure** : `src/infrastructure/services/ast/TreeSitterASTDiffAnalyzer.ts` - Implémentation Tree-Sitter
- **Factory** : `src/infrastructure/factories/ASTAnalyzerFactory.ts` - Factory pour créer l'analyseur AST
- **DI** : Intégré dans `ServiceRegistry` avec identifiant `ServiceIdentifiers.ASTDiffAnalyzer`
- **Intégration** : `DiffAnalyzer.setASTAnalyzer()` pour activer l'analyse AST, injecté automatiquement dans `GenerateAICommitUseCase`

