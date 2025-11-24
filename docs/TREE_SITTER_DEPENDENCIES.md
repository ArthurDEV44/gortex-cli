# Ajout des dépendances Tree-Sitter

## Instructions pour le mainteneur

Pour activer l'analyse AST avec Tree-Sitter, les dépendances suivantes doivent être ajoutées dans `package.json` :

```json
{
  "dependencies": {
    "tree-sitter": "^0.21.0",
    "tree-sitter-typescript": "^0.21.0",
    "tree-sitter-javascript": "^0.21.0"
  }
}
```

## Installation

Après ajout dans `package.json`, exécuter :

```bash
pnpm install
```

## Vérification

Le système détectera automatiquement Tree-Sitter et activera l'analyse AST. Aucune configuration supplémentaire n'est nécessaire.

## Fallback

Si les dépendances ne sont pas installées, le système fonctionnera normalement avec l'analyse ligne par ligne uniquement. Aucune erreur ne sera générée.

## Impact

- **Taille du bundle** : +~2-3 MB (dépendances natives)
- **Performance** : Analyse AST plus précise mais légèrement plus lente
- **Compatibilité** : Nécessite compilation native (fonctionne sur toutes les plateformes supportées par Node.js)

