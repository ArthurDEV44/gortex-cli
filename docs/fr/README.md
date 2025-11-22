<div align="center">

# GORTEX CLI

[![npm version](https://badge.fury.io/js/gortex-cli.svg)](https://www.npmjs.com/package/gortex-cli)
[![npm downloads](https://img.shields.io/npm/dm/gortex-cli.svg)](https://www.npmjs.com/package/gortex-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CLI pour construire des commits conventionnels fiables, assistés et auditables.

[Installation](#installation) • [Utilisation](#utilisation) • [Architecture](#architecture)

</div>

<img src="../../assets/images/gortex-cli.png" alt="Gortex CLI Banner" width="100%">

## Objectif du projet

Gortex CLI vise à rendre la phase de commit aussi rigoureuse que la phase de développement.

- **Guidage** : un flux en plusieurs étapes qui force les vérifications utiles (branche, fichiers, message, push).  
- **Cohérence** : un constructeur conforme à Conventional Commits, avec validation immédiate.  
- **Aide contextuelle** : génération assistée par IA (locale ou distante) et aperçu visuel des changements sélectionnés.

Le résultat : des commits courts, précis et faciles à relire, sans quitter le terminal.

## Valeur ajoutée

- **Traçabilité** : chaque commit documente clairement le besoin et le périmètre.  
- **Standardisation** : les conventions sont appliquées au moment où le développeur agit, pas via un lint tardif.  
- **IA maîtrisée** : Gortex détecte Ollama, Mistral ou OpenAI et reste local si possible.  
- **Workflow Git complet** : sélection de branche, staging ciblé, génération du message, push optionnel.

## Fonctionnalités principales

- Workflow interactif en 8 étapes (branche ➜ fichiers ➜ staging ➜ génération ➜ message ➜ confirmation ➜ push ➜ récap)
- Prévisualisation des diffs et des fichiers mis en scène
- Génération de messages via Ollama, Mistral AI ou OpenAI, avec repli automatique vers l’édition manuelle
- Navigation clavier (Tab, flèches, raccourcis Vim j/k/h/l, actions rapides `a`, `i`)
- Validation en temps réel des commits conventionnels, y compris la gestion des breaking changes
- Configuration via `.gortexrc` (Cosmiconfig) pour personnaliser les fournisseurs IA, les règles et les préférences git

## Architecture

| Couche | Rôle | Technologies clés |
|--------|------|-------------------|
| Domaine | Entités, objets valeur, interfaces | TypeScript |
| Application | Cas d’usage et orchestration | Services, DTO, validation |
| Infrastructure | Git, fournisseurs IA, DI | simple-git, adaptateurs Ollama/OpenAI/Mistral |
| Présentation | Interface CLI | Ink, Commander, composants React |

Repères :

- 918 tests et 67 test Files pour une couverture de 91.63%
- Bundle ESM optimisé (~177.62 KB) avec build ~1203ms  
- Support Node ≥ 18 et distribution via npm/pnpm/yarn/bun  
- Architecture documentée dans `docs/fr/ARCHITECTURE.md`

## Installation

```bash
# npm
npm install -g gortex-cli

# pnpm (recommandé)
pnpm add -g gortex-cli

# yarn
yarn global add gortex-cli

# bun
bun add -g gortex-cli

# essai sans installation
npx gortex-cli
```

## Utilisation

Lancez la CLI depuis un dépôt Git :

```bash
gortex
```

Le workflow guide successivement :

1. Choix ou création de la branche.
2. Sélection des fichiers à commiter avec aperçu des diffs.
3. Staging automatique des éléments choisis.
4. Option de génération IA ou saisie manuelle du message.
5. Validation du message et gestion des breaking changes.
6. Confirmation, push optionnel et récapitulatif.

Commandes utiles :

```bash
gortex --help
gortex help-format
```

## Intégration IA

- **Ollama** (recommandé) :
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ollama pull devstral:24b
  ollama serve   # http://localhost:11434
  ```
- **Mistral / OpenAI** : utilisables dès qu’une clé API est présente dans l’environnement ou la configuration.
- Repli automatique :
  1. Ollama si disponible (local et privé)  
  2. Mistral / OpenAI selon les clés exposées  
  3. Mode manuel si aucun fournisseur n’est accessible

Conseils :

- Garder `ollama serve` actif pour éviter le chargement initial à chaque commit.
- Adapter la taille du modèle (`phi:2.7b` pour machines légères, `mistral-nemo:12b` pour postes puissants).
- Restreindre la portée des commits pour améliorer la pertinence des suggestions IA.

## Format des commits conventionnels

| Type | Usage |
|------|-------|
| `feat` | nouvelle fonctionnalité |
| `fix` | correction |
| `docs` | documentation |
| `style` | formatage sans impact fonctionnel |
| `refactor` | refonte interne |
| `perf` | performance |
| `test` | tests |
| `build` | build/package |
| `ci` | intégration continue |
| `chore` | maintenance |

Exemples :

```
feat(auth): add OAuth2 authentication
fix(api): resolve timeout on large requests
docs(readme): update installation instructions
refactor(core): simplify error handling
```

Breaking change :

```
feat(api)!: change authentication method

BREAKING CHANGE: Previous auth tokens are now invalid
```

## Contribution

1. Fork + branche dédiée.  
2. `pnpm install`, `pnpm dev`.  
3. `pnpm test`, `pnpm typecheck`, `pnpm lint` avant PR.
4. Utiliser Gortex pour formater vos commits.

Ressources complémentaires :

- `CONTRIBUTING.md`
- `docs/fr/ARCHITECTURE.md`
- `docs/USE_CASES.md`
- `docs/MIGRATION_GUIDE.md`

Structure du dépôt :

```
gortex-cli/
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── components/
│   └── commands/
├── docs/
└── __tests__/
```

## Licence

MIT © [Arthur Jean](https://github.com/ArthurDEV44)

<div align="center">

**[⬆ Retour en haut](#gortex-cli)**

</div>

