# 🎉 CommitFormat v1.1.0 - Workflow Git Complet !

## Nouvelle Fonctionnalité Majeure

CommitFormat ne se contente plus de créer des commits ! **Il gère maintenant TOUT votre workflow Git** en une seule commande interactive.

### ✨ Ce qui change

#### Avant (v1.0.0)
```bash
commitformat  # Juste le commit
```

Vous deviez toujours faire :
- `git checkout branch`
- `git add files`
- `git push`

#### Maintenant (v1.1.0)
```bash
commitformat  # TOUT le workflow !
```

**Workflow complet en 5 étapes :**

1. 📍 **Sélection de branche** → Changez de branche au besoin
2. 📝 **Sélection de fichiers** → Tous ou sélection manuelle
3. 💬 **Message de commit** → Interface simplifiée
4. 📋 **Confirmation** → Récapitulatif clair
5. 🚀 **Push automatique** → Avec gestion de l'upstream

## Démonstration

### Exemple complet

```bash
$ commitformat

🚀 CommitFormat - Workflow Git complet

📍 Étape 1/5: Sélection de la branche
   Branche actuelle: main

? Sélectionnez la branche: feature/new-api

   ✓ Basculé sur la branche: feature/new-api

📝 Étape 2/5: Sélection des fichiers
   3 fichier(s) modifié(s)

   [nouveau] src/api/users.ts
   [modifié] src/utils/auth.ts
   [modifié] README.md

? Quels fichiers voulez-vous inclure dans le commit ?
  📦 Tous les fichiers

   ✓ Tous les fichiers sélectionnés (3)

💬 Étape 3/5: Message de commit

? Type de commit: feat
? Scope (optionnel): api
? Description courte: add user authentication
? Description longue (optionnel):

📋 Étape 4/5: Confirmation

   Fichiers à commiter:
     - src/api/users.ts
     - src/utils/auth.ts
     - README.md

   Message de commit:
     feat(api): add user authentication

? Créer ce commit ? Yes

   ✅ Commit créé avec succès !

🚀 Étape 5/5: Push vers le remote

? Voulez-vous push vers le remote ? Yes

   → Push vers origin/feature/new-api...
   → Upstream configuré: origin/feature/new-api

   ✅ Push réussi !
```

**Fini !** Branche changée, fichiers ajoutés, commit créé, code pushé. **Tout en 30 secondes !** ⚡

## Nouveautés Détaillées

### 🎯 Sélection de Branche

- Liste toutes vos branches locales
- Branche actuelle sélectionnée par défaut
- Changement automatique si autre branche choisie
- Skip si une seule branche

### 📦 Sélection de Fichiers

**Option 1 : Tous les fichiers**
- Équivalent de `git add .`
- Rapide et simple

**Option 2 : Sélection manuelle**
- Interface checkbox interactive
- Fichiers avec leur statut :
  - 🟢 `[nouveau]`
  - 🟡 `[modifié]`
  - 🔴 `[supprimé]`
- Validation : au moins 1 fichier requis

### 💬 Interface Simplifiée

**Ce qui a été retiré :**
- ❌ Questions sur breaking changes
- ❌ Description du breaking change

**Pourquoi ?**
Les breaking changes sont rares dans le workflow quotidien. L'interface est maintenant **plus rapide et plus fluide**.

**Note :** Vous pouvez toujours ajouter `!` manuellement dans le type si besoin : `feat!: breaking change`

### 🚀 Push Automatique

**Fonctionnalités :**
- Détection automatique du remote (origin)
- Configuration automatique de l'upstream (`git push -u`) si première fois
- Gestion des erreurs avec messages clairs
- Option de ne pas push (commit local uniquement)

**Gestion intelligente :**
```bash
# Première fois sur une nouvelle branche
→ git push -u origin feature/ma-branche

# Push suivants
→ git push
```

## Améliorations Techniques

### Nouvelles Fonctions Git

Ajout de 9 nouvelles fonctions dans `src/utils/git.ts` :

```typescript
getCurrentBranch()              // Branche actuelle
getAllBranches()                // Toutes les branches locales
checkoutBranch(branch)          // Changer de branche
getModifiedFilesWithStatus()    // Fichiers avec statut
stageFiles(files)               // Stage de fichiers spécifiques
hasRemote()                     // Vérifier si remote existe
getDefaultRemote()              // Remote par défaut (origin)
pushToRemote(remote, branch)    // Push avec upstream
hasUpstream()                   // Vérifier tracking branche
```

### Améliorations UX

- ✨ Progression claire : "Étape X/5"
- 🎨 Émojis pour chaque étape
- 📊 Récapitulatif avant confirmation
- 🔔 Messages d'erreur utiles
- 🎯 Workflow guidé et intuitif

## Migration depuis v1.0.0

**Aucun changement breaking !** Tout fonctionne comme avant.

**Nouvelles fonctionnalités :**
- Si vous utilisez CommitFormat comme avant, vous bénéficiez automatiquement du nouveau workflow
- Toutes les commandes existantes fonctionnent toujours :
  - `commitformat` ou `commitformat commit`
  - `commitformat hooks install`
  - `commitformat stats`

## Cas d'Usage

### 1. Feature rapide

```bash
commitformat
# Sélection branche → Tous les fichiers → Message → Push
# Total: ~30 secondes
```

### 2. Commit partiel

```bash
commitformat
# Sélection branche → 🎯 Sélectionner fichiers → Message → Push
# Parfait pour commiter seulement certains changements
```

### 3. Commit sans push

```bash
commitformat
# Workflow normal
# Étape 5: "Voulez-vous push ?" → Non
# Commit local, push plus tard
```

### 4. Changement de branche au vol

```bash
commitformat
# Étape 1: Choisir autre branche
# Le reste se fait automatiquement
```

## Performance

- ⚡ **Gain de temps :** 5-10 commandes Git → 1 commande
- 🎯 **Moins d'erreurs :** Validation à chaque étape
- 🚀 **Productivité :** Workflow fluide et rapide

## Documentation

- 📖 `README.md` mis à jour avec le nouveau workflow
- 📚 `WORKFLOW_GUIDE.md` - Guide complet du workflow
- 📝 `CHANGELOG.md` - Détails de la v1.1.0

## Installation

### Nouvelle installation

```bash
# npm
npm install -g commitformat

# pnpm
pnpm add -g commitformat

# yarn
yarn global add commitformat

# bun
bun add -g commitformat
```

### Mise à jour depuis v1.0.0

```bash
# npm
npm update -g commitformat

# pnpm
pnpm update -g commitformat

# yarn
yarn global upgrade commitformat

# bun
bun update -g commitformat
```

### Utilisation sans installation

```bash
npx commitformat@latest
# ou
pnpm dlx commitformat@latest
```

## Remerciements

Merci à tous les utilisateurs de la v1.0.0 ! Vos retours ont permis de créer cette version encore meilleure. 🙏

## Prochaines Étapes (v1.2.0)

Idées pour les prochaines versions :

- [ ] Support des tags Git
- [ ] Intégration avec GitHub CLI (créer PR directement)
- [ ] Mode batch pour CI/CD
- [ ] Templates de commits personnalisés
- [ ] Support multi-langues

## Feedback

Des idées ? Des bugs ? Ouvrez une issue :
👉 https://github.com/username/commitformat/issues

---

**Bon workflow avec CommitFormat v1.1.0 ! 🚀**

Faites un commit avec la nouvelle version :
```bash
commitformat
```
