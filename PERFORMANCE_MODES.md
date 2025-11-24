# GORTEX CLI - Performance Modes & Configuration

> **Last Updated**: 2025-11-24
> **Version**: 2.0.5

Ce document explique les différents modes de performance de GORTEX CLI avec les modèles AI locaux (Ollama).

---

## 🚀 Modes de performance

### Mode Standard (par défaut) - Rapide

**Latence**: ~5-10s
**Qualité**: Bonne
**Utilisation**: Commits rapides, tests, développement itératif

```bash
pnpm start
# ou
gortex
```

**Features activées** :
- ✅ Génération AI de base
- ✅ Diff analysis
- ✅ Few-shot examples
- ✅ Project style analysis
- ❌ Semantic diff summary (désactivée)
- ❌ Chain-of-Thought reasoning (désactivée)
- ❌ Self-verification (désactivée)

**Pourquoi c'est le mode par défaut** :
- Rapide et fiable
- Pas de timeouts
- Qualité suffisante pour 90% des commits

---

### Mode Enhanced - Semantic Summary

**Latence**: ~15-20s
**Qualité**: Très bonne
**Utilisation**: Commits avec diffs complexes/volumineux

```bash
GORTEX_ENABLE_SEMANTIC_SUMMARY=true gortex
```

**Features activées en plus** :
- ✅ Semantic diff summarization (pour diffs > threshold)

**Quand l'utiliser** :
- Commits avec >50 fichiers modifiés
- Refactoring de modules entiers
- Migrations de code importantes

---

### Mode Advanced - Chain-of-Thought

**Latence**: ~70s
**Qualité**: Excellente
**Utilisation**: Commits complexes nécessitant un raisonnement approfondi

```bash
GORTEX_ENABLE_CHAIN_OF_THOUGHT=true gortex
```

**Features activées en plus** :
- ✅ Chain-of-Thought reasoning (analyse architecturale profonde)

**Quand l'utiliser** :
- Refactoring architectural majeur
- Introduction de nouveaux patterns
- Changements cross-cutting

**Attention** :
- Nécessite timeout élevé (60s+)
- Peut échouer sur hardware limité
- Magistral 24B recommandé

---

### Mode Premium - Self-Verification

**Latence**: ~40s
**Qualité**: Très bonne avec validation
**Utilisation**: Commits critiques nécessitant validation qualité

```bash
GORTEX_ENABLE_VERIFICATION=true gortex
```

**Features activées en plus** :
- ✅ Self-verification (l'IA valide et améliore sa propre sortie)

**Quand l'utiliser** :
- Commits pour production critique
- Historique Git public (open source)
- Standards de qualité stricts

**Bénéfices** :
- Détection automatique de sujets trop longs
- Amélioration de la sémantique
- Validation type/scope/body

---

### Mode Full (Chain-of-Thought + Verification) - Recommandé pour qualité

**Latence**: ~90-110s
**Qualité**: Excellente (proche de Claude Code)
**Utilisation**: Commits importants, PRs, production

```bash
# Via script npm (recommandé)
pnpm start:full

# Ou manuellement
GORTEX_ENABLE_CHAIN_OF_THOUGHT=true \
GORTEX_ENABLE_VERIFICATION=true \
gortex

# Avec debug (pour diagnostiquer)
pnpm start:full:debug
```

**Features activées** :
- ✅ Chain-of-Thought reasoning (analyse architecturale profonde)
- ✅ Self-verification (validation automatique)
- ✅ Diff analysis
- ✅ Few-shot examples
- ✅ Project style analysis

**Quand l'utiliser** :
- **Commits sur main/master** (production)
- **Pull requests importantes**
- **Refactoring architectural**
- **Documentation de features majeures**
- **Quand vous voulez qualité maximale**

**Avantages** :
- Messages sémantiques (pas techniques)
- Détection automatique de bugs (subject trop long, type incorrect)
- Body structuré avec POURQUOI et IMPACT
- Respect automatique des contraintes (100 chars)

**Configuration requise** :
- Timeout 120s (déjà configuré dans `.gortexrc.example`)
- Magistral 24B (optimisé pour raisonnement)
- RAM ≥16GB recommandée
- Patience (~2 minutes)

**Note** : C'est ce mode qui devrait être votre **défaut pour commits sérieux**

---

### Mode Ultimate - Full Features (avec Semantic Summary)

**Latence**: ~120-140s
**Qualité**: Maximum
**Utilisation**: Commits exceptionnels avec diffs énormes

```bash
GORTEX_ENABLE_SEMANTIC_SUMMARY=true \
GORTEX_ENABLE_CHAIN_OF_THOUGHT=true \
GORTEX_ENABLE_VERIFICATION=true \
gortex
```

**Toutes les features activées** ✅

**Quand l'utiliser** :
- Diffs >50 fichiers
- Migrations complètes de codebase
- Release candidates majeures

**Attention** :
- Très lent (~2-3 minutes)
- Semantic Summary utile uniquement pour diffs volumineux
- Recommandé uniquement pour commits exceptionnels

---

## 📊 Comparaison détaillée

| Mode | Latence | Semantic Summary | Chain-of-Thought | Self-Verification | Qualité | Timeouts | Recommandé |
|------|---------|------------------|------------------|-------------------|---------|----------|-----------|
| **Standard** | ~5-10s | ❌ | ❌ | ❌ | ⭐⭐⭐ | Aucun | Dev quotidien |
| **Full** (`pnpm start:full`) | ~90-110s | ❌ | ✅ | ✅ | ⭐⭐⭐⭐⭐ | Rares (120s timeout) | **PRs, production** ✅ |
| **Ultimate** | ~120-140s | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ | Possibles | Diffs énormes uniquement |

---

## 🔧 Configuration avancée

### Variables d'environnement

```bash
# Features
export GORTEX_ENABLE_SEMANTIC_SUMMARY=true
export GORTEX_ENABLE_CHAIN_OF_THOUGHT=true
export GORTEX_ENABLE_VERIFICATION=true

# Debug
export GORTEX_DEBUG=true
```

### Dans `.gortexrc`

```json
{
  "ai": {
    "ollama": {
      "model": "magistral:24b",
      "timeout": 60000
    }
  }
}
```

**Recommandations timeout par mode** :

| Mode | Timeout recommandé |
|------|-------------------|
| Standard | 30000 (30s) |
| + Semantic Summary | 45000 (45s) |
| + Chain-of-Thought | 90000 (90s) |
| + Verification | 60000 (60s) |
| Ultimate | 120000 (120s) |

---

## 🎯 Recommandations par cas d'usage

### Développement quotidien
```bash
# Mode standard
gortex
```
Rapide, fiable, qualité suffisante.

### Avant push sur main/master
```bash
# Mode avec vérification
GORTEX_ENABLE_VERIFICATION=true gortex
```
Validation qualité avant intégration.

### Refactoring architectural
```bash
# Mode avec Chain-of-Thought
GORTEX_ENABLE_CHAIN_OF_THOUGHT=true gortex
```
Raisonnement approfondi pour changements complexes.

### Release candidate
```bash
# Mode ultimate
GORTEX_ENABLE_SEMANTIC_SUMMARY=true \
GORTEX_ENABLE_CHAIN_OF_THOUGHT=true \
GORTEX_ENABLE_VERIFICATION=true \
gortex
```
Qualité maximale pour commits critiques.

---

## 🐛 Troubleshooting

### Timeouts fréquents

**Solution** : Réduire les features activées ou augmenter timeout

```json
{
  "ai": {
    "ollama": {
      "timeout": 120000  // 120s au lieu de 60s
    }
  }
}
```

### Hardware limité (8-16GB RAM)

**Solution** : Utiliser modèles plus légers

```bash
# Installer un modèle plus léger
ollama pull phi:2.7b

# Configurer dans .gortexrc
{
  "ai": {
    "ollama": {
      "model": "phi:2.7b",
      "timeout": 30000
    }
  }
}
```

### Qualité insuffisante en mode standard

**Solution** : Activer verification uniquement

```bash
GORTEX_ENABLE_VERIFICATION=true gortex
```

Meilleur compromis qualité/vitesse que Chain-of-Thought.

---

## 📈 Benchmarks (Magistral 24B sur M1 Max 32GB)

| Opération | Mode Standard | + Semantic | + CoT | + Verification | Ultimate |
|-----------|--------------|------------|-------|----------------|----------|
| Simple commit (1 fichier) | 6s | 7s | 62s | 38s | 95s |
| Medium commit (5 fichiers) | 8s | 12s | 70s | 42s | 108s |
| Large commit (20 fichiers) | 10s | 18s | 85s | 50s | 125s |

**Matériel testé** :
- CPU: Apple M1 Max
- RAM: 32GB
- Ollama: 0.3.x
- Modèle: Magistral 24B

---

## 💡 Tips & Best Practices

### 1. Commencer par le mode standard
Ne sautez pas directement en mode ultimate. Testez d'abord le standard.

### 2. Utiliser verification pour PRs importantes
```bash
# Alias dans .bashrc/.zshrc
alias gortex-pr="GORTEX_ENABLE_VERIFICATION=true gortex"
```

### 3. Désactiver features en CI/CD
En environnement automatisé, utilisez toujours le mode standard pour éviter timeouts.

### 4. Monitorer avec debug
```bash
GORTEX_DEBUG=true gortex 2>&1 | tee gortex.log
```

### 5. Adapter selon hardware
- **≤8GB RAM** : `phi:2.7b` en mode standard uniquement
- **16GB RAM** : `magistral:24b` en mode standard + verification
- **≥32GB RAM** : `magistral:24b` tous modes disponibles

---

## 🔗 Ressources

- [README_DEBUG.md](./README_DEBUG.md) - Guide du mode debug
- [MIGRATION_MAGISTRAL.md](./docs/MIGRATION_MAGISTRAL.md) - Migration Devstral → Magistral
- [ARCHITECTURE.md](./docs/en/ARCHITECTURE.md) - Architecture détaillée

---

**Dernière mise à jour** : 2025-11-24
**Mainteneur** : @ArthurDEV44
