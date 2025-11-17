# Support Multi-Package Managers

CommitFormat est conçu pour fonctionner avec tous les gestionnaires de paquets JavaScript modernes.

## Gestionnaires supportés

### 📦 npm (Node Package Manager)
Le gestionnaire par défaut de Node.js, largement utilisé et stable.

**Installation :** Inclus avec Node.js

**Utilisation :**
```bash
npm install -g gortex
npx gortex
```

### ⚡ pnpm (Performant npm)
Gestionnaire rapide et efficace qui économise l'espace disque grâce au content-addressable storage.

**Installation :**
```bash
npm install -g pnpm
```

**Utilisation :**
```bash
pnpm add -g gortex
pnpm dlx gortex
```

**Avantages :**
- Installation ultra-rapide
- Économie d'espace disque (store centralisé)
- Strictness par défaut (évite les dépendances fantômes)

### 🧶 Yarn (Classic et Berry)
Gestionnaire populaire créé par Facebook, disponible en deux versions.

**Installation :**
```bash
npm install -g yarn
```

**Utilisation :**
```bash
yarn global add gortex
yarn dlx gortex
```

**Avantages :**
- Workspaces puissants
- Plug'n'Play (Yarn 2+)
- Résolution déterministe

### 🥟 Bun
Runtime et package manager ultra-rapide écrit en Zig, compatible avec Node.js.

**Installation :**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Utilisation :**
```bash
bun add -g gortex
bunx gortex
```

**Avantages :**
- Vitesse exceptionnelle
- Runtime JavaScript intégré
- Compatible avec l'écosystème Node.js

## Fichiers de configuration

CommitFormat inclut des fichiers de configuration pour chaque package manager :

- `.npmrc` - Configuration npm/pnpm
- `pnpm-workspace.yaml` - Configuration des workspaces pnpm
- `.yarnrc.yml` - Configuration Yarn 2+
- `bunfig.toml` - Configuration Bun
- `package.json` - Champ `packageManager` pour Corepack

## Scripts intelligents

Le dossier `scripts/` contient des scripts Bash qui détectent automatiquement votre package manager :

### Comment ça marche ?

1. **Détection par fichiers de lock :**
   - `pnpm-lock.yaml` → pnpm
   - `bun.lockb` → bun
   - `yarn.lock` → yarn
   - `package-lock.json` → npm

2. **Détection par commandes disponibles :**
   Si aucun fichier de lock n'est trouvé, les scripts vérifient quelles commandes sont disponibles sur votre système.

### Utilisation

```bash
# Détecte automatiquement et installe
./scripts/install.sh

# Détecte automatiquement et lance en dev
./scripts/dev.sh

# Détecte automatiquement et build
./scripts/build.sh
```

## Comparaison des commandes

| Action | npm | pnpm | yarn | bun |
|--------|-----|------|------|-----|
| **Installer global** | `npm install -g` | `pnpm add -g` | `yarn global add` | `bun add -g` |
| **Installer local** | `npm install` | `pnpm install` | `yarn install` | `bun install` |
| **Ajouter dépendance** | `npm install pkg` | `pnpm add pkg` | `yarn add pkg` | `bun add pkg` |
| **Supprimer dépendance** | `npm uninstall pkg` | `pnpm remove pkg` | `yarn remove pkg` | `bun remove pkg` |
| **Exécuter script** | `npm run script` | `pnpm run script` | `yarn script` | `bun run script` |
| **Exécuter package** | `npx pkg` | `pnpm dlx pkg` | `yarn dlx pkg` | `bunx pkg` |

## Corepack

Node.js 16.9+ inclut Corepack, qui permet de gérer automatiquement les versions de package managers.

### Activation

```bash
corepack enable
```

### Utilisation avec CommitFormat

Le `package.json` inclut le champ `packageManager` :

```json
{
  "packageManager": "pnpm@8.15.0"
}
```

Corepack installera automatiquement la bonne version de pnpm quand vous lancez :

```bash
pnpm install
```

### Changer de package manager

Vous pouvez modifier le champ `packageManager` pour utiliser un autre gestionnaire :

```json
{
  "packageManager": "npm@10.2.0"
  // ou
  "packageManager": "yarn@4.0.0"
  // ou
  "packageManager": "bun@1.0.0"
}
```

## Recommandations par cas d'usage

### 🏢 Projets d'entreprise
**pnpm** - Économie d'espace, performance, workspaces puissants

### 🚀 Projets personnels / Prototypes rapides
**bun** - Vitesse maximale, tout-en-un (runtime + package manager)

### 👥 Projets open-source avec beaucoup de contributeurs
**npm** - Compatibilité maximale, pré-installé avec Node.js

### 🎨 Monorepos complexes
**pnpm** ou **yarn** - Excellents workspaces, gestion des dépendances stricte

## Performance

Benchmark d'installation (temps approximatifs) :

| Package Manager | Installation à froid | Installation avec cache |
|----------------|---------------------|------------------------|
| npm | ~30s | ~15s |
| pnpm | ~10s | ~3s |
| yarn (classic) | ~20s | ~8s |
| yarn (berry) | ~15s | ~5s |
| bun | ~5s | ~1s |

*Les temps varient selon le projet et la machine*

## Troubleshooting

### Conflit de fichiers de lock

Si vous avez plusieurs fichiers de lock, supprimez ceux que vous n'utilisez pas :

```bash
# Garder pnpm uniquement
rm package-lock.json yarn.lock bun.lockb

# Garder npm uniquement
rm pnpm-lock.yaml yarn.lock bun.lockb
```

### Script intelligent détecte le mauvais package manager

Supprimez les fichiers de lock non désirés ou installez le package manager souhaité.

### Problèmes de permissions (global install)

Sur Linux/macOS, vous pourriez avoir besoin de `sudo` :

```bash
sudo npm install -g gortex
```

Ou configurez npm pour installer dans votre home :

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## Contribution

Lors de vos contributions à CommitFormat :

1. **Ne commitez PAS tous les fichiers de lock** - Commitez seulement celui de votre package manager préféré
2. **Testez avec votre package manager** - Les scripts doivent fonctionner pour tous
3. **Documentez les incompatibilités** - Si vous trouvez un problème spécifique à un package manager

## Ressources

- [npm documentation](https://docs.npmjs.com/)
- [pnpm documentation](https://pnpm.io/)
- [Yarn documentation](https://yarnpkg.com/)
- [Bun documentation](https://bun.sh/docs)
- [Corepack documentation](https://nodejs.org/api/corepack.html)
