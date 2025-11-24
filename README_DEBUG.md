# Mode Debug GORTEX CLI

Ce guide explique comment activer le mode debug pour diagnostiquer les problèmes de génération AI.

## Activation du mode debug

### Option 1 : Via npm scripts (recommandé)

```bash
# En développement (avec tsx)
pnpm dev:debug

# En production (après build)
pnpm start:debug
```

### Option 2 : Variable d'environnement

```bash
# Linux/macOS
GORTEX_DEBUG=true gortex

# Windows (PowerShell)
$env:GORTEX_DEBUG="true"; gortex

# Windows (CMD)
set GORTEX_DEBUG=true && gortex
```

### Option 3 : Export permanent (session)

```bash
# Linux/macOS
export GORTEX_DEBUG=true
gortex

# Windows (PowerShell)
$env:GORTEX_DEBUG="true"
gortex
```

## Ce que vous verrez en mode debug

### 1. Chain-of-Thought Reasoning

```
🔍 [DEBUG] Chain-of-Thought RAW RESPONSE:
────────────────────────────────────────────────────────────────────────────────
### Analysis

{
  "architecturalContext": "...",
  "changeIntention": "...",
  ...
}
────────────────────────────────────────────────────────────────────────────────

🔍 [DEBUG] Chain-of-Thought CLEANED JSON:
────────────────────────────────────────────────────────────────────────────────
{
  "architecturalContext": "...",
  "changeIntention": "...",
  ...
}
────────────────────────────────────────────────────────────────────────────────
```

### 2. Self-Verification

```
🔍 [DEBUG] Self-Verification RAW RESPONSE:
────────────────────────────────────────────────────────────────────────────────
{
  "isGoodQuality": true,
  "issues": [],
  "reasoning": "..."
}
────────────────────────────────────────────────────────────────────────────────

🔍 [DEBUG] Self-Verification CLEANED JSON:
────────────────────────────────────────────────────────────────────────────────
{
  "isGoodQuality": true,
  "issues": [],
  "reasoning": "..."
}
────────────────────────────────────────────────────────────────────────────────
```

### 3. Erreurs détaillées

Si une erreur se produit :

```
❌ [DEBUG] Chain-of-Thought ERROR:
────────────────────────────────────────────────────────────────────────────────
SyntaxError: Unexpected token '#', "### Analys"... is not valid JSON
    at JSON.parse (<anonymous>)
    at GenerateAICommitUseCase.execute (/src/application/use-cases/...)
────────────────────────────────────────────────────────────────────────────────
Chain-of-Thought reasoning failed: Unexpected token '#'... Continuing with standard generation.
```

## Cas d'usage

### Diagnostiquer les erreurs de parsing JSON

Si vous voyez `"JSON is not valid"`, le mode debug vous montrera :
1. **RAW RESPONSE** : Ce que Magistral retourne vraiment (avec ou sans Markdown)
2. **CLEANED JSON** : Le résultat après nettoyage (extraction du JSON)
3. **ERROR** : L'erreur exacte lors du parsing

**Exemple de problème détecté :**
```
RAW RESPONSE:
### Analysis of changes

{
  "architecturalContext": "...",
  ...
}
```

→ Le modèle ajoute `### Analysis of changes` avant le JSON, causant une erreur de parsing.

### Vérifier la qualité des réponses AI

Comparez les réponses brutes pour :
- Voir si le modèle respecte les contraintes (100 caractères pour subject)
- Vérifier si le format JSON est correct
- Analyser les raisonnements du modèle

### Tester différents modèles

Activez le debug et comparez les performances :

```bash
# Test avec Magistral
GORTEX_DEBUG=true gortex

# Test avec Devstral
# (modifier .gortexrc: "model": "devstral:24b")
GORTEX_DEBUG=true gortex
```

## Désactiver le mode debug

```bash
# Linux/macOS
unset GORTEX_DEBUG

# Windows (PowerShell)
Remove-Item Env:GORTEX_DEBUG

# Ou simplement ne pas utiliser les scripts :debug
pnpm dev      # au lieu de pnpm dev:debug
pnpm start    # au lieu de pnpm start:debug
```

## Partager les logs pour support

Si vous rencontrez un bug et voulez le reporter :

1. **Activer le mode debug**
   ```bash
   GORTEX_DEBUG=true gortex > gortex-debug.log 2>&1
   ```

2. **Reproduire le problème**

3. **Partager le log**
   - Anonymiser toute information sensible (clés API, noms de projets privés)
   - Créer une issue sur GitHub avec le fichier `gortex-debug.log`

## Informations exposées en mode debug

⚠️ **Attention** : Le mode debug expose :
- Les réponses complètes des modèles AI
- Les diffs de vos commits
- Les noms de fichiers et symboles de code
- Les prompts envoyés aux modèles

**Ne partagez JAMAIS les logs debug de projets confidentiels sans les anonymiser.**

## Performance

Le mode debug ajoute :
- ~5-10ms de latence (console.log)
- Logs dans stdout/stderr (peut ralentir les terminaux)

→ **Désactiver en production** pour de meilleures performances.

## Troubleshooting

### Les logs n'apparaissent pas

**Vérifiez que la variable est bien définie :**
```bash
# Linux/macOS
echo $GORTEX_DEBUG  # Devrait afficher "true"

# Windows (PowerShell)
echo $env:GORTEX_DEBUG  # Devrait afficher "true"
```

### Trop de logs, impossible de lire

**Redirigez vers un fichier :**
```bash
GORTEX_DEBUG=true gortex 2>&1 | tee gortex-debug.log
```

Ensuite, cherchez les sections importantes :
```bash
grep "DEBUG" gortex-debug.log
grep "ERROR" gortex-debug.log
```

### Les logs interfèrent avec l'UI Ink

C'est normal. L'UI Ink et les logs console peuvent se mélanger. Utilisez :
```bash
# Redirection complète vers fichier
GORTEX_DEBUG=true gortex > debug.log 2>&1
```

Puis consultez `debug.log` après l'exécution.

---

**Dernière mise à jour** : 2025-11-24
**Mainteneur** : @ArthurDEV44
