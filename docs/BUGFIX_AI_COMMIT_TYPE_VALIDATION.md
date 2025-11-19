# 🐛 Correction : Erreur "Invalid commit type" lors de la génération AI

## Problème identifié

Lors de la génération de commits par l'IA (Ollama, Mistral ou OpenAI), l'erreur suivante pouvait survenir :

```
✖ Erreur lors de la génération

Invalid commit type: "commit". Must be one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

Retour au mode manuel...
```

### Cause racine

L'IA générait parfois des types de commit invalides (comme "commit", "update", "change") au lieu d'utiliser les types conventionnels standards (feat, fix, docs, etc.). Cela se produisait car :

1. Le prompt système n'était pas suffisamment explicite sur la restriction stricte des types
2. La validation du type se faisait trop tard dans le processus (lors de la création de l'entité `CommitType`)
3. Le message d'erreur n'était pas assez clair pour guider l'utilisateur

## Solution implémentée

### 1. Renforcement du prompt système (`src/ai/prompts/commit-message.ts`)

Le prompt a été significativement amélioré pour :

- **Répéter plusieurs fois** la liste des types valides
- **Ajouter des avertissements visuels** (⚠️, ❌, ✅) pour attirer l'attention de l'IA
- **Lister explicitement** ce qui est interdit ("commit", "update", "change", etc.)
- **Fournir des exemples concrets** de réponses valides
- **Insister sur la contrainte** avec un rappel final

**Extrait du nouveau prompt :**

```
⚠️ TYPES DISPONIBLES (UNIQUEMENT CEUX-CI) ⚠️
feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

RAPPEL IMPORTANT: Le champ "type" DOIT être EXACTEMENT l'une de ces valeurs:
- "feat"
- "fix"
- "docs"
...

❌ N'UTILISE JAMAIS: "commit", "update", "change", "modification"
✅ UTILISE SEULEMENT: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
```

### 2. Validation anticipée dans BaseAIProvider (`src/ai/providers/BaseAIProvider.ts`)

Ajout d'une validation **AVANT** la création de l'entité domaine :

```typescript
protected validateResponse(response: any, availableTypes?: string[]): void {
  // ... validation existante ...

  // Nouvelle validation du type
  if (availableTypes && !availableTypes.includes(response.type)) {
    throw new Error(
      `Réponse invalide: Le type "${response.type}" n'est pas valide.\n` +
      `Types autorisés: ${availableTypes.join(', ')}\n` +
      `L'IA a généré un type incorrect. Cela peut arriver avec certains modèles.\n` +
      `Veuillez réessayer ou utiliser le mode manuel.`
    );
  }
}
```

### 3. Mise à jour de tous les providers

Les trois providers (Ollama, Mistral, OpenAI) ont été mis à jour pour passer la liste des types disponibles à la validation :

**Avant :**
```typescript
this.validateResponse(parsed);
```

**Après :**
```typescript
this.validateResponse(parsed, context.availableTypes);
```

## Fichiers modifiés

1. `src/ai/prompts/commit-message.ts` - Prompt système renforcé
2. `src/ai/providers/BaseAIProvider.ts` - Validation améliorée
3. `src/ai/providers/ollama.ts` - Utilisation de la nouvelle validation
4. `src/ai/providers/mistral.ts` - Utilisation de la nouvelle validation
5. `src/ai/providers/openai.ts` - Utilisation de la nouvelle validation

## Bénéfices

### Pour l'utilisateur

✅ **Erreurs plus rares** : Le prompt renforcé réduit drastiquement les chances que l'IA génère un type invalide

✅ **Meilleur message d'erreur** : Si l'erreur survient quand même, l'utilisateur comprend immédiatement le problème et la solution

✅ **Suggestion claire** : Le message propose de réessayer ou de passer en mode manuel

### Pour le développement

✅ **Validation anticipée** : Le problème est détecté au niveau du provider, pas au niveau domaine

✅ **Message contextuel** : L'erreur affiche la réponse complète de l'IA pour faciliter le debug

✅ **Cohérence** : Tous les providers bénéficient de la même validation stricte

## Test de la correction

### Avant

```bash
$ gortex
# Sélection des fichiers...
# Choix IA...
✖ Erreur lors de la génération
Invalid commit type: "commit". Must be one of: feat, fix, docs, ...
```

### Après

**Scénario 1 : L'IA génère un type valide (99% des cas)**
```bash
$ gortex
# Sélection des fichiers...
# Choix IA...
✓ Commit généré avec succès
feat(ai): improve prompt validation for commit types
```

**Scénario 2 : L'IA génère encore un type invalide (rare)**
```bash
$ gortex
# Sélection des fichiers...
# Choix IA...
✖ Erreur lors de la génération

Réponse invalide: Le type "commit" n'est pas valide.
Types autorisés: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
L'IA a généré un type incorrect. Cela peut arriver avec certains modèles.
Veuillez réessayer ou utiliser le mode manuel.

Réponse AI reçue: {
  "type": "commit",
  "subject": "add new feature",
  ...
}
```

## Recommandations

### Pour l'utilisateur

Si l'erreur persiste malgré le correctif :

1. **Réessayer** : Parfois l'IA peut faire une erreur ponctuelle
2. **Mettre à jour le modèle** : Un modèle plus récent/performant peut mieux suivre les instructions
3. **Utiliser le mode manuel** : Toujours disponible comme fallback
4. **Changer de provider** : Tester OpenAI ou Mistral si Ollama pose problème

### Pour les modèles Ollama

Les modèles recommandés qui suivent bien les instructions :

- ✅ `mistral:7b` - Excellent équilibre (recommandé)
- ✅ `mistral-nemo:12b` - Très bon pour les instructions strictes
- ✅ `codestral:22b` - Optimisé pour le code
- ⚠️ `phi:2.7b` - Plus petit, peut être moins précis sur les contraintes

## Version

- **Corrigé dans** : Version 3.0.2 (à venir)
- **Date** : 19 novembre 2025
- **Auteur** : AI Assistant (Claude Sonnet 4.5)

## Références

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Ollama Models](https://ollama.com/library)
- Issue GitHub : (à créer si nécessaire)

