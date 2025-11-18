# Gortex CLI

CLI interactif pour créer des commits conventionnels avec validation, hooks Git et statistiques.

## Pourquoi Gortex CLI ?

**Problème réel :** Personne n'écrit de bons messages de commit. On se retrouve avec des "fix stuff", "wip", "test" qui rendent impossible la génération automatique de changelogs et la compréhension de l'historique du projet.

**Solution :** Gortex CLI vous guide à travers un processus interactif pour créer des commits qui suivent le format [Conventional Commits](https://www.conventionalcommits.org/).

### Avantages

- 📝 **Commits lisibles** : Messages clairs et structurés
- 📚 **Changelog automatique** : Génération facile de notes de version
- 🎯 **Onboarding simplifié** : Questions guidées pour les nouveaux contributeurs
- 📊 **Suivi de qualité** : Statistiques sur la conformité de vos commits
- 🔒 **Validation automatique** : Hooks Git pour garantir le format

## Installation

Gortex CLI supporte tous les gestionnaires de paquets modernes : **npm**, **pnpm**, **yarn** et **bun**.

### Installation globale

Choisissez votre gestionnaire de paquets préféré :

#### NPM
```bash
npm install -g gortex
```

#### PNPM
```bash
pnpm add -g gortex
```

#### Yarn
```bash
yarn global add gortex
```

#### Bun
```bash
bun add -g gortex
```

### Utilisation sans installation

Vous pouvez également utiliser Gortex CLI directement sans installation :

#### NPX (npm)
```bash
npx gortex
```

#### PNPM
```bash
pnpm dlx gortex
```

#### Yarn
```bash
yarn dlx gortex
```

#### Bunx (Bun)
```bash
bunx gortex
```

### Installation en tant que dépendance de développement

Pour l'ajouter à un projet spécifique :

```bash
# npm
npm install -D gortex

# pnpm
pnpm add -D gortex

# yarn
yarn add -D gortex

# bun
bun add -D gortex
```

Puis ajoutez un script dans votre `package.json` :
```json
{
  "scripts": {
    "commit": "gortex"
  }
}
```

## Utilisation

### Workflow Git complet en 5 étapes

Gortex CLI gère tout votre workflow Git de A à Z !

```bash
npx gortex
# ou simplement
gortex
```

Le CLI vous guidera à travers **5 étapes** :

#### 🚀 Étape 1 : Sélection de la branche
- Affiche la branche actuelle
- Permet de changer de branche si besoin
- Branche actuelle sélectionnée par défaut

#### 📝 Étape 2 : Sélection des fichiers
- Liste tous les fichiers modifiés avec leur statut
- **Option 1** : Ajouter tous les fichiers (`git add .`)
- **Option 2** : Sélectionner fichier par fichier (checkbox interactif)

#### 💬 Étape 3 : Message de commit
- **Type** (feat, fix, docs, etc.)
- **Scope** (optionnel - partie du code affectée)
- **Description** courte et claire
- **Corps** du message (optionnel)

#### 📋 Étape 4 : Confirmation
- Récapitulatif des fichiers à commiter
- Aperçu du message de commit
- Création du commit après confirmation

#### 🚀 Étape 5 : Push
- Option de push automatique vers le remote
- Configuration automatique de l'upstream si nécessaire
- Gestion des erreurs avec suggestions

**Exemple de résultat :**
```
feat(auth): add password reset functionality
```

**Workflow complet en une seule commande !**
Plus besoin de :
- `git checkout branch`
- `git add file1 file2...`
- `git commit -m "message"`
- `git push`

Tout se fait de manière interactive et guidée ! 🎯

### Installer les hooks Git

Pour valider automatiquement le format des commits :

```bash
gortex hooks install
```

Cela créera un hook `commit-msg` qui validera tous vos commits.

Pour désinstaller :
```bash
gortex hooks uninstall
```

### Analyser les statistiques du repo

Voyez combien de vos commits suivent les conventions :

```bash
gortex stats
```

Analyser les 200 derniers commits :
```bash
gortex stats -n 200
```

Exemple de sortie :
```
📊 Analyse des 100 derniers commits...

Résumé:
──────────────────────────────────────────────────
Total de commits analysés:      100
Commits conventionnels:          87
Commits non-conventionnels:      13

Taux de conformité:
87.0% ████████████████████████████░░░

Répartition par type:
──────────────────────────────────────────────────
  ✨ feat        42 (48.3%) ████████████░░░░░░░░
  🐛 fix         28 (32.2%) ██████████░░░░░░░░░░
  📝 docs        10 (11.5%) ████░░░░░░░░░░░░░░░░
  ♻️  refactor    7 (8.0%)  ███░░░░░░░░░░░░░░░░░
```

## Configuration personnalisée

Créez un fichier `.gortexrc` à la racine de votre projet :

```json
{
  "types": [
    {
      "value": "feat",
      "name": "feat:     ✨ Nouvelle fonctionnalité",
      "description": "Une nouvelle fonctionnalité"
    },
    {
      "value": "fix",
      "name": "fix:      🐛 Correction de bug",
      "description": "Une correction de bug"
    }
  ],
  "scopes": ["auth", "api", "ui", "database"],
  "allowCustomScopes": true,
  "maxSubjectLength": 100,
  "minSubjectLength": 3
}
```

Formats de configuration supportés :
- `.gortexrc`
- `.gortexrc.json`
- `.gortexrc.js`
- `gortex.config.js`
- Clé `gortex` dans `package.json`

## Format des commits

### Structure

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types disponibles

| Type | Emoji | Description |
|------|-------|-------------|
| `feat` | ✨ | Nouvelle fonctionnalité |
| `fix` | 🐛 | Correction de bug |
| `docs` | 📝 | Documentation |
| `style` | 💄 | Formatage, style |
| `refactor` | ♻️ | Refactorisation |
| `perf` | ⚡️ | Amélioration de performance |
| `test` | ✅ | Ajout/modification de tests |
| `build` | 📦 | Changements du build |
| `ci` | 👷 | Configuration CI |
| `chore` | 🔧 | Maintenance, dépendances |
| `revert` | ⏪ | Annulation d'un commit |

### Exemples

Commit simple :
```
feat(auth): add login functionality
```

Avec scope :
```
fix(api): resolve timeout on large requests
```

Breaking change :
```
feat(api)!: change authentication method

BREAKING CHANGE: JWT tokens are now required for all API calls
```

Avec corps :
```
refactor(core): simplify error handling

- Consolidate error types
- Add better error messages
- Improve logging
```

## Commandes

### Commit

```bash
gortex
# ou
gortex commit
# ou
gortex c
```

Crée un commit interactif au format conventionnel.

### Hooks

```bash
# Installer le hook
gortex hooks install
gortex hooks i

# Désinstaller le hook
gortex hooks uninstall
gortex hooks u
```

Gère les hooks Git pour valider automatiquement le format.

### Stats

```bash
# Analyser les 100 derniers commits (par défaut)
gortex stats

# Analyser un nombre spécifique de commits
gortex stats -n 200
gortex stats --number 200

# Alias
gortex s -n 50
```

Affiche les statistiques de conformité du repository.

### Aide

```bash
# Aide générale
gortex --help

# Aide sur le format
gortex help-format
```

## Intégration avec des outils existants

### Husky

Si vous utilisez déjà Husky, vous pouvez ajouter la validation selon votre package manager :

```bash
# npm
npx husky add .husky/commit-msg 'npx gortex hooks install'

# pnpm
pnpm exec husky add .husky/commit-msg 'pnpm dlx gortex hooks install'

# yarn
yarn husky add .husky/commit-msg 'yarn dlx gortex hooks install'

# bun
bunx husky add .husky/commit-msg 'bunx gortex hooks install'
```

### Commitlint

Gortex CLI est compatible avec commitlint. Vous pouvez utiliser les deux ensemble ou choisir l'un ou l'autre selon vos préférences.

## Développement

### Installation en local

Gortex CLI supporte tous les package managers. Utilisez celui que vous préférez !

```bash
git clone <repo-url>
cd Gortex CLI

# Choisissez votre package manager
npm install   # ou
pnpm install  # ou
yarn install  # ou
bun install
```

### Scripts de développement

Tous les scripts fonctionnent avec n'importe quel package manager :

```bash
# Mode développement
npm run dev      # ou pnpm run dev, yarn dev, bun run dev

# Build
npm run build    # ou pnpm run build, yarn build, bun run build

# Vérifier les types
npm run typecheck  # ou pnpm run typecheck, yarn typecheck, bun run typecheck
```

### Scripts intelligents (recommandé)

Le projet inclut des scripts Bash qui détectent automatiquement votre package manager :

```bash
# Installation automatique
./scripts/install.sh

# Développement
./scripts/dev.sh

# Build
./scripts/build.sh
```

Ces scripts détectent automatiquement si vous utilisez npm, pnpm, yarn ou bun en regardant :
1. Les fichiers de lock existants (pnpm-lock.yaml, bun.lockb, yarn.lock, package-lock.json)
2. Les commandes disponibles sur votre système

### Structure du projet

```
Gortex CLI/
├── src/
│   ├── commands/
│   │   ├── commit.ts      # Commande de commit interactif
│   │   ├── hooks.ts       # Gestion des hooks Git
│   │   └── stats.ts       # Analyse des statistiques
│   ├── utils/
│   │   ├── config.ts      # Chargement de la configuration
│   │   ├── git.ts         # Opérations Git
│   │   └── validate.ts    # Validation des commits
│   ├── cli.ts             # Configuration du CLI
│   ├── index.ts           # Point d'entrée
│   └── types.ts           # Définitions TypeScript
├── package.json
├── tsconfig.json
└── README.md
```

## Stack technique

- **TypeScript** : Type safety et meilleure DX
- **Commander** : Parsing des arguments CLI
- **Inquirer** : Prompts interactifs
- **Chalk** : Couleurs dans le terminal
- **simple-git** : Opérations Git
- **cosmiconfig** : Chargement de configuration
- **tsup** : Bundler rapide pour TypeScript

## Support Multi-Package Managers

Gortex CLI fonctionne avec **tous** les gestionnaires de paquets modernes :

- 📦 **npm** - Le standard, inclus avec Node.js
- ⚡ **pnpm** - Rapide et efficace, économise l'espace disque
- 🧶 **yarn** - Workspaces puissants, résolution déterministe
- 🥟 **bun** - Ultra-rapide, runtime tout-en-un

Pour plus de détails sur l'utilisation de chaque package manager, consultez [PACKAGE_MANAGERS.md](./PACKAGE_MANAGERS.md).

## Licence

MIT

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

Pensez à utiliser Gortex CLI pour vos commits dans ce projet ! 😉
