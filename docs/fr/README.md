<div align="center">

# GORTEX CLI

[![npm version](https://badge.fury.io/js/gortex-cli.svg)](https://www.npmjs.com/package/gortex-cli)
[![npm downloads](https://img.shields.io/npm/dm/gortex-cli.svg)](https://www.npmjs.com/package/gortex-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CLI interactive premium pour créer des commits conventionnels parfaits**

[Installation](#-installation) • [Utilisation](#-utilisation)

</div>

<img src="assets/images/gortex-cli.png" alt="Gortex CLI Banner" width="100%">

---

## 🌟 Qu'est-ce qui rend Gortex spécial ?

**Gortex CLI** n'est pas juste un autre outil Git. C'est une **expérience développeur premium de haut niveau** qui transforme la tâche fastidieuse de commit de code en un workflow guidé et agréable.

### ✨ Fonctionnalités Premium

🎨 **Design Visuel Éblouissant**
- Interface à gradient avec animations fluides
- Branding professionnel avec logo animé
- Retour visuel codé par couleur et espacement intelligent

⚡ **Ultra Rapide**
- Animations fluides à 60fps
- Premier affichage <100ms
- Bundle optimisé de 57KB

🎯 **UX Intelligente**
- Support des raccourcis Vim (j/k/h/l)
- Actions rapides (a=sélectionner tout, i=inverser)
- Descriptions contextuelles partout
- Validation en temps réel avec erreurs utiles

📦 **Workflow Git Complet**
- Sélection/création de branche
- Aperçu visuel des différences de fichiers
- Constructeur de message de commit
- Push vers le dépôt distant (optionnel)

🤖 **Commits Propulsés par l'IA (Intégrés)**
- Choisissez entre génération IA ou manuelle directement dans le workflow
- Support pour Ollama (local), Mistral AI et OpenAI
- Détection automatique des fournisseurs disponibles
- Basculement intelligent vers manuel si l'IA n'est pas disponible
- Suggestions contextuelles avec score de confiance
- 100% privé avec Ollama local

---

## 🚀 Installation

Choisissez votre gestionnaire de paquets préféré :

### NPM
```bash
npm install -g gortex-cli
```

### PNPM (Recommandé)
```bash
pnpm add -g gortex-cli
```

### Yarn
```bash
yarn global add gortex-cli
```

### Bun
```bash
bun add -g gortex-cli
```

### Essayer sans installation
```bash
npx gortex-cli
```

---

## 💫 Utilisation

### Workflow Interactif avec Onglets (Par défaut)

Exécutez simplement dans votre dépôt Git :

```bash
gortex
```

Ceci lance le **workflow interactif premium avec onglets** :

**📝 Onglet Commit (workflow en 8 étapes) :**
1. 🌿 **Sélection de Branche** - Choisir ou créer une branche
2. 📦 **Sélection de Fichiers** - Prévisualiser et sélectionner les fichiers à mettre en staging
3. 📥 **Staging** - Les fichiers sont mis en staging automatiquement
4. 🤖 **Mode de Génération** - Choisir IA (Ollama/Mistral/OpenAI) ou Manuelle
5. ✨ **Création de Message** - Généré par IA ou manuel selon votre choix
6. ✓ **Confirmation** - Examiner et confirmer votre commit
7. 🚀 **Push** - Optionnellement pousser vers le dépôt distant
8. 🎉 **Succès** - Résumé de complétion

**Navigation :**
- `Tab` ou `→` pour changer d'onglet
- `1-2` pour accès direct aux onglets
- `h/l` pour navigation style vim

---

### 🤖 Utiliser Ollama avec Gortex CLI

Ollama est le **fournisseur IA recommandé** pour Gortex CLI - c'est gratuit, rapide et 100% privé.

#### Installation

**macOS & Linux :**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows :**
Téléchargez depuis [ollama.com/download](https://ollama.com/download)

#### Commandes Essentielles pour Gortex

**1. Télécharger un modèle (requis avant la première utilisation) :**
```bash
# Recommandé pour Gortex (4GB RAM)
ollama pull mistral:7b

# Alternative - modèle plus léger (1.6GB RAM)
ollama pull phi:2.7b

# Alternative - modèle plus grand (7GB RAM, meilleure qualité)
ollama pull mistral-nemo:12b
```

**2. Démarrer le service Ollama :**
```bash
ollama serve
```
> **Note :** Ollama doit être en cours d'exécution pour que Gortex puisse l'utiliser. Le service tourne sur `http://localhost:11434`

**3. Vérifier vos modèles :**
```bash
ollama ls
```
Sortie :
```
NAME              ID              SIZE    MODIFIED
mistral:7b        abc123def456    4.1 GB  2 hours ago
phi:2.7b          def789ghi012    1.6 GB  1 day ago
```

**4. Tester un modèle :**
```bash
ollama run mistral:7b "Génère un message de commit git pour ajouter l'authentification utilisateur"
```

**5. Vérifier les modèles en cours d'exécution :**
```bash
ollama ps
```

**6. Arrêter un modèle (libérer la mémoire) :**
```bash
ollama stop mistral:7b
```

**7. Supprimer un modèle :**
```bash
ollama rm mistral:7b
```

#### Modèles Recommandés pour Gortex

| Modèle | Taille | RAM Requise | Qualité | Cas d'Usage |
|--------|--------|-------------|---------|-------------|
| **mistral:7b** | 4.1 GB | 8 GB | ⭐⭐⭐⭐ | **Recommandé** - Meilleur équilibre |
| phi:2.7b | 1.6 GB | 4 GB | ⭐⭐⭐ | Ordinateurs portables avec RAM limitée |
| mistral-nemo:12b | 7 GB | 16 GB | ⭐⭐⭐⭐⭐ | Postes de travail puissants |
| codestral:22b | 13 GB | 24 GB | ⭐⭐⭐⭐⭐ | Focus code (commits plus importants) |

#### Dépannage Ollama

**Problème : "Ollama non disponible"**
```bash
# Vérifier si Ollama est en cours d'exécution
ollama ps

# Si ce n'est pas le cas, le démarrer
ollama serve
```

**Problème : "Modèle non trouvé"**
```bash
# Lister les modèles installés
ollama ls

# Télécharger le modèle s'il manque
ollama pull mistral:7b
```

**Problème : "Connexion refusée"**
```bash
# Vérifier qu'Ollama tourne sur le port par défaut
curl http://localhost:11434/api/tags

# Si port différent, mettre à jour baseUrl dans .gortexrc
```

**Problème : "Génération lente"**
- Utiliser un modèle plus petit : `phi:2.7b`
- Augmenter le timeout dans la config : `"timeout": 60000`
- Vérifier l'utilisation CPU : Ollama utilise le CPU s'il n'y a pas de GPU

#### Conseils pour de Meilleurs Résultats

1. **Garder Ollama en cours d'exécution** : Démarrer `ollama serve` en arrière-plan
2. **Utiliser un modèle approprié** : Adapter la taille du modèle à votre machine
3. **Commits clairs** : Changements plus petits et ciblés = meilleures suggestions IA
4. **Premier lancement plus lent** : Le modèle se charge lors de la première utilisation (mis en cache après)

#### Pourquoi Ollama pour Gortex ?

- ✅ **100% Privé** - Votre code ne quitte jamais votre machine
- ✅ **Gratuit** - Aucun coût d'API
- ✅ **Rapide** - Génération locale (1-3s sur CPU moyen)
- ✅ **Hors ligne** - Fonctionne sans internet
- ✅ **Sans limites** - Commits illimités
- ✅ **Aucune clé API** - Zéro configuration fastidieuse

### Aide

```bash
gortex --help
gortex help-format  # Guide du format des commits conventionnels
```

---

## 🎯 Format des Commits Conventionnels

### Types de Commit

| Type | Icône | Description |
|------|-------|-------------|
| **feat** | ✨ | Nouvelle fonctionnalité |
| **fix** | 🐛 | Correction de bug |
| **docs** | 📝 | Documentation |
| **style** | 💄 | Formatage, points-virgules manquants |
| **refactor** | ♻️ | Refactorisation de code |
| **perf** | ⚡ | Amélioration de performance |
| **test** | ✅ | Ajout/mise à jour de tests |
| **build** | 📦 | Changements du système de build |
| **ci** | 👷 | Changements de configuration CI |
| **chore** | 🔧 | Autres changements |

### Exemples

```bash
feat(auth): add OAuth2 authentication
fix(api): resolve timeout on large requests
docs(readme): update installation instructions
refactor(core): simplify error handling
```

### Changements Cassants

Ajoutez `!` après type/scope :

```bash
feat(api)!: change authentication method

BREAKING CHANGE: Previous auth tokens are now invalid
```

---

## 🎨 Pourquoi un Design Premium est Important

### Expérience Développeur = Qualité Produit

Tout comme l'UI/UX de votre application compte pour vos utilisateurs, **l'UX de vos outils développeur compte pour vous**.

Gortex CLI prouve que **les outils CLI peuvent être beaux ET fonctionnels** :

✨ **Réduit la Charge Cognitive**
- Hiérarchie visuelle claire
- Retour instantané
- Navigation intuitive

⚡ **Augmente la Productivité**
- Raccourcis Vim pour la vitesse
- Actions rapides (a, i, y/n)
- Validation intelligente prévient les erreurs

🎯 **Améliore la Qualité du Code**
- Workflow guidé assure la cohérence
- Aperçus visuels préviennent les erreurs
- Suggestions utiles enseignent les bonnes pratiques

---

## 🛠️ Stack Technique

Construit avec des technologies modernes et éprouvées :

- **[Ink](https://github.com/vadimdemedes/ink)** - React pour interfaces CLI
- **[React](https://react.dev/)** - Architecture basée sur les composants
- **TypeScript** - Sécurité de type partout
- **[simple-git](https://github.com/steveukx/git-js)** - Opérations Git
- **[Commander](https://github.com/tj/commander.js)** - Framework CLI
- **[Cosmiconfig](https://github.com/davidtheclark/cosmiconfig)** - Gestion de configuration

### Bibliothèques UI Premium

- **ink-gradient** - Animations à gradient
- **ink-big-text** - Branding ASCII art
- **gradient-string** - Texte coloré
- **chalk** - Style de terminal

### Architecture

Gortex CLI utilise une **Architecture Propre** avec **Injection de Dépendances** pour un codebase maintenable, testable et évolutif :

- **Couche Domaine** - Logique métier pure (Entités, Objets Valeur, Interfaces de Repository)
- **Couche Application** - Cas d'usage orchestrant la logique métier
- **Couche Infrastructure** - Implémentations concrètes (Git, Fournisseurs IA, Conteneur DI)
- **Couche Présentation** - Composants React et commandes CLI

**Avantages Clés :**
- ✅ **403 tests** (350 unitaires + 53 intégration) avec 92% de couverture
- ✅ **Complètement découplé** - Facile à tester, maintenir et étendre
- ✅ **Type-safe** - TypeScript dans toutes les couches
- ✅ **Prêt pour la production** - Architecture éprouvée

📚 En savoir plus : [Documentation Architecture](docs/ARCHITECTURE.md)

---

## 📊 Performance & Qualité

| Métrique | Valeur |
|----------|--------|
| **Taille du Bundle** | 166.92 KB (optimisé) |
| **Temps de Build** | ~1.2s (ESM + DTS) |
| **Premier Affichage** | <100ms |
| **Animations** | 60fps fluide |
| **Version Node** | ≥18.0.0 |
| **Tests** | 403 tests (92% de couverture) |
| **Architecture** | Architecture Propre + DI |
| **Sécurité de Type** | 100% TypeScript |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Nous suivons les principes de l'Architecture Propre et maintenons des standards de qualité de code élevés.

📚 **Lisez nos guides :**
- [Guide de Contribution](CONTRIBUTING.md) - Comment contribuer
- [Documentation Architecture](docs/ARCHITECTURE.md) - Comprendre l'architecture
- [Documentation Cas d'Usage](docs/USE_CASES.md) - Apprendre sur les cas d'usage
- [Guide de Migration](docs/MIGRATION_GUIDE.md) - Modèles de migration

### Configuration de Développement

```bash
# Cloner le dépôt
git clone https://github.com/ArthurDEV44/gortex-cli.git
cd gortex-cli

# Installer les dépendances
pnpm install

# Lancer en mode développement
pnpm dev

# Build
pnpm build

# Lancer les tests
pnpm test

# Lancer les tests avec couverture
pnpm test -- --coverage

# Vérification de type
pnpm typecheck
```

### Structure du Projet

```
gortex-cli/
├── src/
│   ├── domain/          # Logique métier (entités, objets valeur, interfaces)
│   ├── application/     # Cas d'usage, DTOs, mappers
│   ├── infrastructure/  # Implémentations (repositories, IA, DI)
│   ├── components/      # Composants React (présentation)
│   └── commands/        # Commandes CLI
├── docs/                # Documentation
│   ├── ARCHITECTURE.md  # Guide d'architecture
│   ├── USE_CASES.md     # Documentation des cas d'usage
│   └── MIGRATION_GUIDE.md
└── __tests__/           # Tests (unitaires + intégration)
```

---

## 📝 Licence

MIT © [Arthur Jean](https://github.com/ArthurDEV44)

---

## 🙏 Remerciements

Inspiré par le travail remarquable de :
- **Vercel** pour établir la norme en UX CLI
- **vadimdemedes** pour la création d'Ink
- **L'équipe Conventional Commits** pour la spécification

---

<div align="center">

**[⬆ retour en haut](#-gortex-cli)**

Fait avec ❤️ par des développeurs, pour des développeurs

**Gortex CLI - Où le Workflow Git Rencontre l'Art** ✨

</div>
