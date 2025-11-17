# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [1.1.0] - 2024-11-17

### 🚀 Nouveau : Workflow Git complet !

#### Ajouté

**Workflow en 5 étapes :**
- **Sélection de branche** :
  - Choisissez ou changez de branche avant de commiter
  - **NOUVEAU** : Créez une nouvelle branche directement
  - **NOUVEAU** : Confirmez votre choix avec possibilité de revenir en arrière
  - Boucle interactive jusqu'à satisfaction
- **Sélection de fichiers** : Ajoutez tous les fichiers ou sélectionnez-les individuellement
- **Message de commit** : Interface simplifiée (breaking changes retirés du flow principal)
- **Confirmation** : Récapitulatif avant création du commit
- **Push automatique** : Option de push vers le remote après le commit

**Nouvelles fonctions Git :**
- `getCurrentBranch()` : Récupération de la branche actuelle
- `getAllBranches()` : Liste toutes les branches locales
- `checkoutBranch()` : Changement de branche
- `createAndCheckoutBranch()` : **NOUVEAU** - Création et bascule sur nouvelle branche
- `branchExists()` : **NOUVEAU** - Vérification de l'existence d'une branche
- `getModifiedFilesWithStatus()` : Fichiers avec leur statut (nouveau, modifié, supprimé)
- `stageFiles()` : Stage de fichiers spécifiques
- `hasRemote()` : Vérification de l'existence d'un remote
- `getDefaultRemote()` : Récupération du remote par défaut
- `pushToRemote()` : Push vers le remote avec gestion de l'upstream
- `hasUpstream()` : Vérification du tracking de branche

#### Modifié

- CLI simplifié : Questions sur les breaking changes retirées du flow principal
- Meilleure expérience utilisateur avec progression claire (Étape X/5)
- Messages plus clairs et émojis pour chaque étape
- Gestion d'erreurs améliorée pour le push

#### Avantages

**Avant :**
```bash
git checkout ma-branche
git add file1.ts file2.ts
git commit -m "feat: ma feature"
git push
```

**Maintenant :**
```bash
commitformat
# Tout se fait en une seule commande interactive ! 🎉
```

## [1.0.0] - 2024-11-17

### Ajouté

#### Fonctionnalités principales
- CLI interactif pour créer des commits conventionnels
- Support complet du format [Conventional Commits](https://www.conventionalcommits.org/)
- Prompts guidés avec validation en temps réel
- Commit automatique avec staging des fichiers

#### Git Hooks
- Installation automatique de hooks Git `commit-msg`
- Validation du format des commits
- Désinstallation facile des hooks
- Messages d'erreur clairs et instructifs

#### Statistiques
- Analyse de l'historique Git
- Calcul du taux de conformité aux conventions
- Répartition par type de commit avec émojis
- Barres de progression visuelles
- Support de l'analyse d'un nombre personnalisé de commits

#### Configuration
- Système de configuration flexible avec cosmiconfig
- Support de multiples formats : `.commitformatrc`, `.commitformatrc.json`, `.commitformatrc.js`, etc.
- Types de commits personnalisables
- Scopes prédéfinis ou libres
- Limites de longueur configurables
- Configuration par défaut complète avec émojis

#### Support Multi-Package Managers
- Support complet de npm, pnpm, yarn et bun
- Scripts intelligents de détection automatique
- Fichiers de configuration pour chaque gestionnaire
- Documentation détaillée pour chaque outil

#### Documentation
- README complet en français
- Guide de démarrage pas-à-pas
- Guide détaillé des package managers
- Exemples d'utilisation
- Fichier de configuration d'exemple

#### Interface utilisateur
- Couleurs avec chalk pour une meilleure lisibilité
- Émojis pour identifier rapidement les types de commits
- Messages clairs et en français
- Aide détaillée sur le format conventionnel

### Détails techniques

- **TypeScript** pour la sûreté des types
- **Commander** pour le parsing CLI
- **Inquirer** pour les prompts interactifs
- **simple-git** pour les opérations Git
- **cosmiconfig** pour la configuration flexible
- **tsup** pour le build rapide

### Notes de version

Cette première version stable inclut toutes les fonctionnalités essentielles pour :
- Créer des commits conventionnels facilement
- Valider automatiquement le format
- Analyser la qualité de l'historique
- S'adapter à tous les workflows de développement

---

## Versions futures

### [1.1.0] - Prévu

#### Prévu
- Tests unitaires avec Vitest
- CI/CD avec GitHub Actions
- Génération automatique de CHANGELOG
- Support des templates de commits
- Mode non-interactif pour CI/CD

### [1.2.0] - Idées

#### En réflexion
- Intégration JIRA/Linear pour les tickets
- Support multi-langues (anglais, espagnol)
- Plugin pour éditeurs (VSCode, etc.)
- API pour intégrations customs

---

## Comment contribuer

Les suggestions de fonctionnalités sont les bienvenues ! Ouvrez une issue pour discuter de ce que vous aimeriez voir dans les prochaines versions.

## Format du Changelog

- **Ajouté** : Nouvelles fonctionnalités
- **Modifié** : Changements dans les fonctionnalités existantes
- **Déprécié** : Fonctionnalités qui seront supprimées
- **Supprimé** : Fonctionnalités supprimées
- **Corrigé** : Corrections de bugs
- **Sécurité** : Vulnérabilités corrigées

[1.0.0]: https://github.com/username/commitformat/releases/tag/v1.0.0
