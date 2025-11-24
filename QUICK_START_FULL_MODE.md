# Quick Start : Mode Full (Qualité maximale en local)

> **Objectif** : Générer des commits de qualité proche de Claude Code avec Magistral en local

---

## 🚀 Utilisation rapide

### Pour ce commit actuel (recommandé)

```bash
pnpm start:full:debug
```

Cela active :
- ✅ **Chain-of-Thought reasoning** : Analyse architecturale profonde
- ✅ **Self-verification** : Validation automatique
- ✅ **Mode debug** : Voir ce que l'IA génère

**Attendez ~90-110 secondes** pour la génération.

---

## 📋 Ce que vous allez voir

### 1. Chain-of-Thought (60s)

```
🔍 [DEBUG] Chain-of-Thought RAW RESPONSE:
────────────────────────────────────────────────────────────────────────────────
{
  "architecturalContext": "Infrastructure layer - AI configuration and generation system",
  "changeIntention": "Migrate from Devstral to Magistral for better reasoning performance",
  "changeNature": "Migration + performance optimization + debug capabilities",
  "keySymbols": ["GenerateAICommitUseCase", "ai-defaults.ts", "MIGRATION_MAGISTRAL.md"],
  "suggestedType": "feat",
  "complexityJustification": "Multiple interacting components across 20 files"
}
────────────────────────────────────────────────────────────────────────────────
```

### 2. Génération principale (20s)

Utilise l'analyse Chain-of-Thought pour générer un message structuré.

### 3. Self-Verification (30s)

```
🔍 [DEBUG] Self-Verification RAW RESPONSE:
────────────────────────────────────────────────────────────────────────────────
{
  "isGoodQuality": false,
  "issues": ["Subject exceeds 100 chars", "Missing migration context"],
  "improvedSubject": "migrate to Magistral with performance optimizations and debug mode",
  "improvedBody": "**Migration**: Devstral → Magistral 24B...",
  "reasoning": "Original subject too technical, body missing WHY"
}
────────────────────────────────────────────────────────────────────────────────
```

### 4. Résultat final

Un message de commit :
- ✅ Sémantique (pas technique)
- ✅ Avec POURQUOI et IMPACT
- ✅ Respect des contraintes (100 chars)
- ✅ Body structuré par catégories
- ✅ Proche de la qualité Claude Code

---

## ⚙️ Configuration requise

### 1. Copier la config

```bash
cp .gortexrc.example .gortexrc
```

Le timeout de 120s est déjà configuré.

### 2. Vérifier Ollama

```bash
# Magistral doit être installé
ollama list | grep magistral

# Si absent
ollama pull magistral:24b

# Vérifier qu'Ollama tourne
ollama serve
```

### 3. Lancer en mode Full

```bash
# Avec debug (recommandé pour ce commit)
pnpm start:full:debug

# Sans debug (plus propre)
pnpm start:full
```

---

## 🎯 Résultat attendu pour ce commit

### Subject attendu (≤100 chars)
```
feat(ai): migrate to Magistral with performance optimizations and debug mode
```

### Body attendu (structuré)
```
This commit addresses timeout issues with local AI models by migrating from
Devstral to Magistral (Mistral AI's first reasoning model) and implementing
performance-first defaults.

**Migration to Magistral 24B**:
- Update default model from devstral:24b to magistral:24b
- Increase default timeout from 60s to 120s
- Lower temperature to 0.4 (optimized for reasoning)
- Add comprehensive migration guide

**Performance optimizations** (90% faster):
- Disable Chain-of-Thought by default (enable: GORTEX_ENABLE_CHAIN_OF_THOUGHT)
- Disable Self-Verification by default (enable: GORTEX_ENABLE_VERIFICATION)
- Add scripts: pnpm start:full for full-featured mode

**Debug capabilities**:
- Add GORTEX_DEBUG mode with detailed logging
- Log RAW AI responses, CLEANED JSON, and errors
- Add README_DEBUG.md and PERFORMANCE_MODES.md guides

**Files changed**: 20 files, +1218 lines (3 new docs, migration guide, debug guide)

This resolves timeout issues while maintaining quality through optional
advanced features for critical commits.
```

---

## 🐛 Troubleshooting

### Timeout encore après 120s

**Solution 1** : Augmenter timeout dans `.gortexrc`
```json
{
  "ai": {
    "ollama": {
      "timeout": 180000  // 180s (3 minutes)
    }
  }
}
```

**Solution 2** : Désactiver Semantic Summary
```bash
# Ne pas activer GORTEX_ENABLE_SEMANTIC_SUMMARY
# Cela économise 30-40s
```

### Magistral pas assez rapide

**Votre hardware** :
- <8GB RAM : Utiliser `phi:2.7b` à la place
- 8-16GB RAM : Magistral OK, mais désactiver Semantic Summary
- ≥16GB RAM : Magistral + toutes les features

**Alternative modèle** :
```json
{
  "ai": {
    "ollama": {
      "model": "phi:2.7b",  // Plus léger, plus rapide
      "timeout": 60000
    }
  }
}
```

### Qualité encore insuffisante

**Vérifier que les features sont activées** :
```bash
# Vérifier dans les logs debug
pnpm start:full:debug

# Vous devez voir :
# ✅ Chain-of-Thought analysing...
# ✅ Self-verification running...

# Si vous voyez "DISABLED", les features ne sont pas activées
```

---

## 💡 Workflow recommandé

### Développement quotidien
```bash
pnpm start  # Mode rapide (5-10s)
```

### Commits importants (ce commit)
```bash
pnpm start:full:debug  # Mode full avec debug
```

### Production / PRs
```bash
pnpm start:full  # Mode full sans debug
```

---

## 📈 Comparaison attendue

| Aspect | Mode Standard | Mode Full | Gain |
|--------|--------------|-----------|------|
| **Latence** | 5-10s | 90-110s | -10x plus lent |
| **Qualité** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | +67% qualité |
| **Subject** | Technique | Sémantique | ✅ |
| **Body** | Minimal | Structuré | ✅ |
| **Contraintes** | Partielles | Respectées | ✅ |
| **POURQUOI** | Absent | Présent | ✅ |
| **IMPACT** | Absent | Quantifié | ✅ |

---

## ✅ Checklist avant commit

- [ ] Ollama en cours d'exécution (`ollama serve`)
- [ ] Magistral installé (`ollama list | grep magistral`)
- [ ] Config copiée (`.gortexrc` existe)
- [ ] Timeout 120s configuré (vérifié dans `.gortexrc`)
- [ ] Lancer `pnpm start:full:debug`
- [ ] Attendre 90-110s patiemment
- [ ] Vérifier le message généré
- [ ] Accepter si qualité satisfaisante

---

**Prêt ? Lancez maintenant** :

```bash
pnpm start:full:debug
```

Et prenez un café pendant 2 minutes ☕

---

**Dernière mise à jour** : 2025-11-24
**Mainteneur** : @ArthurDEV44
