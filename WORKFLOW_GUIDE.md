# 🚀 Guide du Workflow Git Complet

CommitFormat v1.1.0 introduit un **workflow Git complet en 5 étapes** qui remplace toutes vos commandes Git habituelles par une seule commande interactive !

## Avant vs Maintenant

### ❌ Avant (workflow traditionnel)

```bash
# 1. Changer de branche
git checkout feature/ma-branche

# 2. Voir les changements
git status

# 3. Ajouter les fichiers
git add src/file1.ts src/file2.ts
# ou
git add .

# 4. Créer le commit
git commit -m "feat(api): add new endpoint"

# 5. Push
git push origin feature/ma-branche
```

**5 commandes différentes**, beaucoup de frappe, risque d'erreurs...

### ✅ Maintenant (avec CommitFormat)

```bash
gortex
```

**Une seule commande !** Tout le reste se fait de manière interactive et guidée. 🎉

---

## Les 5 Étapes en Détail

### 📍 Étape 1/5 : Sélection de la branche

**Ce qui se passe :**
- Affiche votre branche actuelle
- Liste toutes vos branches locales
- Vous permet de changer de branche si besoin

**Interface :**
```
📍 Étape 1/5: Sélection de la branche
   Branche actuelle: main

? Que voulez-vous faire ? (Use arrow keys)
❯ main (actuelle)
  feature/new-feature
  bugfix/fix-login
  develop
  ➕ Créer une nouvelle branche

? Continuer avec cette branche ? (Y/n)
```

**Fonctionnalités :**
- ✅ Branche actuelle mise en évidence avec badge "(actuelle)"
- ✅ Liste de toutes vos branches locales
- ✅ **NOUVEAU** : Option pour créer une nouvelle branche
- ✅ **NOUVEAU** : Confirmation avant de continuer
- ✅ **NOUVEAU** : Possibilité de changer d'avis et revenir en arrière

**Créer une nouvelle branche :**

Si vous sélectionnez "➕ Créer une nouvelle branche" :

```
? Nom de la nouvelle branche: feature/awesome-feature
   ✓ Branche "feature/awesome-feature" créée et active

? Continuer avec cette branche ? (Y/n)
```

**Validations :**
- ❌ Nom vide interdit
- ❌ Espaces interdits
- ❌ Branche existante interdite

**Changer d'avis :**

Si vous répondez "Non" à "Continuer avec cette branche ?", vous revenez à la sélection :

```
? Continuer avec cette branche ? No

   ↻ Retour à la sélection de branche...

   Branche actuelle: feature/awesome-feature

? Que voulez-vous faire ?
❯ main
  feature/awesome-feature (actuelle)
  ➕ Créer une nouvelle branche
```

Vous pouvez **changer autant de fois que vous voulez** jusqu'à être satisfait !

---

### 📝 Étape 2/5 : Sélection des fichiers

**Ce qui se passe :**
- Liste tous vos fichiers modifiés
- Affiche le statut de chaque fichier (nouveau, modifié, supprimé)
- Vous laisse choisir quels fichiers inclure dans le commit

**Interface :**
```
📝 Étape 2/5: Sélection des fichiers
   3 fichier(s) modifié(s)

   [nouveau] src/api/users.ts
   [modifié] src/utils/helpers.ts
   [supprimé] old-file.ts

? Quels fichiers voulez-vous inclure dans le commit ?
  📦 Tous les fichiers
❯ 🎯 Sélectionner les fichiers
```

**Options :**

#### Option 1 : Tous les fichiers
Équivalent de `git add .` - ajoute tout d'un coup.

#### Option 2 : Sélection manuelle
Interface checkbox pour choisir fichier par fichier :

```
? Sélectionnez les fichiers à inclure:
 ◯ [nouveau] src/api/users.ts
 ◉ [modifié] src/utils/helpers.ts
 ◯ [supprimé] old-file.ts
```

**Fonctionnalités :**
- ✅ Codes couleur : 🟢 nouveau, 🟡 modifié, 🔴 supprimé
- ✅ Sélection multiple avec espace
- ✅ Validation : au moins un fichier requis

---

### 💬 Étape 3/5 : Message de commit

**Ce qui se passe :**
- Questions guidées pour créer un commit conventionnel
- **Interface simplifiée** (breaking changes retirés)
- Validation en temps réel

**Interface :**
```
💬 Étape 3/5: Message de commit

? Type de commit: (Use arrow keys)
❯ feat:     ✨ Nouvelle fonctionnalité
  fix:      🐛 Correction de bug
  docs:     📝 Documentation
  refactor: ♻️  Refactoring
  ...

? Scope (optionnel): api

? Description courte (3-100 caractères): add user authentication endpoint

? Description longue (optionnel, Entrée pour passer):
```

**Résultat généré :**
```
feat(api): add user authentication endpoint
```

**Fonctionnalités :**
- ✅ Types prédéfinis avec émojis
- ✅ Scope optionnel (personnalisable via config)
- ✅ Validation de longueur automatique
- ✅ Body optionnel
- ✅ **Plus simple** : pas de questions sur breaking changes

---

### 📋 Étape 4/5 : Confirmation

**Ce qui se passe :**
- Récapitulatif complet avant de créer le commit
- Dernière chance d'annuler

**Interface :**
```
📋 Étape 4/5: Confirmation

   Fichiers à commiter:
     - src/api/users.ts
     - src/utils/helpers.ts

   Message de commit:
     feat(api): add user authentication endpoint

? Créer ce commit ? (Y/n)
```

**Fonctionnalités :**
- ✅ Vue claire de ce qui sera commité
- ✅ Aperçu du message
- ✅ Possibilité d'annuler (n)

---

### 🚀 Étape 5/5 : Push vers le remote

**Ce qui se passe :**
- Demande si vous voulez push vers le remote
- Gère automatiquement l'upstream
- Messages d'erreur clairs si problème

**Interface :**
```
🚀 Étape 5/5: Push vers le remote

? Voulez-vous push vers le remote ? (Y/n)

   → Push vers origin/feature/ma-branche...
   → Upstream configuré: origin/feature/ma-branche

   ✅ Push réussi !
```

**Fonctionnalités :**
- ✅ Détection automatique du remote (origin)
- ✅ Configuration automatique de l'upstream (`-u`) si première fois
- ✅ Gestion des erreurs avec suggestions
- ✅ Option de ne pas push (commit local uniquement)

**Si pas de remote :**
```
   ⚠️  Aucun remote configuré, impossible de push
```

**Si erreur de push :**
```
   ❌ Erreur lors du push: [message d'erreur]
   💡 Vous pouvez push manuellement avec: git push
```

---

## Cas d'Usage

### Scénario 1 : Feature simple

```bash
# Vous êtes sur main, vous voulez créer une feature
gortex

# Étape 1: Rester sur main (ou changer vers feature/xyz)
# Étape 2: Tous les fichiers
# Étape 3: feat(core): add feature
# Étape 4: Confirmer
# Étape 5: Push
```

**Résultat :** Commit + push en ~30 secondes ! ⚡

### Scénario 2 : Fix partiel

```bash
# Vous avez modifié 5 fichiers mais ne voulez en commiter que 2
gortex

# Étape 1: Branche actuelle
# Étape 2: 🎯 Sélectionner les fichiers → Choisir 2 fichiers
# Étape 3: fix(auth): resolve login issue
# Étape 4: Confirmer
# Étape 5: Push
```

**Résultat :** Commit partiel propre sans `git add` manuel !

### Scénario 3 : Commit sans push

```bash
# Vous voulez commiter mais pas encore push
gortex

# Étape 1-4: Normalement
# Étape 5: Voulez-vous push ? → Non (n)
```

**Résultat :** Commit local, push plus tard !

### Scénario 4 : Changer de branche au vol

```bash
# Vous êtes sur main mais voulez commiter sur develop
gortex

# Étape 1: develop (change automatiquement)
# Étape 2-5: Normalement
```

**Résultat :** Changement de branche + commit + push en une commande !

---

## Configuration Avancée

### Personnaliser les types et scopes

Créez `.gortexrc` :

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
  "scopes": ["api", "ui", "auth", "database"],
  "allowCustomScopes": true,
  "maxSubjectLength": 100,
  "minSubjectLength": 3
}
```

### Script package.json

Ajoutez dans votre `package.json` :

```json
{
  "scripts": {
    "commit": "gortex",
    "c": "gortex"
  }
}
```

Utilisez ensuite :

```bash
npm run commit
# ou
pnpm c
```

---

## Avantages du Nouveau Workflow

### 🎯 Gain de temps
- **Avant :** 5-10 commandes Git
- **Maintenant :** 1 seule commande

### 🛡️ Moins d'erreurs
- ✅ Impossible d'oublier de stage des fichiers
- ✅ Impossible de faire un commit vide
- ✅ Toujours un message conventionnel
- ✅ Gestion automatique de l'upstream

### 🎨 Meilleure expérience
- Interface claire avec progression
- Émojis et couleurs
- Messages d'aide contextuels
- Annulation possible à chaque étape

### 📚 Historique propre
- Tous les commits suivent les conventions
- Génération facile de changelogs
- Meilleure compréhension du projet

---

## Questions Fréquentes

### Q: Puis-je utiliser les commandes Git normales en parallèle ?

**R:** Oui ! CommitFormat ne remplace pas Git, il l'améliore. Vous pouvez toujours utiliser `git commit`, `git push`, etc.

### Q: Que se passe-t-il si j'annule en cours de route ?

**R:** Rien n'est créé. Les fichiers restent modifiés, aucun commit n'est fait.

### Q: Puis-je skip l'étape de push ?

**R:** Oui ! À l'étape 5, répondez "n" (Non) pour faire juste le commit local.

### Q: Comment changer la branche par défaut ?

**R:** La branche par défaut est toujours votre branche actuelle. Utilisez `git checkout` avant si besoin, ou changez via CommitFormat étape 1.

### Q: Puis-je modifier un commit après ?

**R:** Oui, utilisez `git commit --amend` ou d'autres commandes Git standard.

### Q: Ça marche avec des repos multiples ?

**R:** Oui ! CommitFormat fonctionne dans n'importe quel repo Git.

---

## Comparaison avec d'autres outils

| Fonctionnalité | Git CLI | Commitizen | CommitFormat |
|----------------|---------|------------|--------------|
| Sélection branche | ❌ | ❌ | ✅ |
| Sélection fichiers | ❌ | ❌ | ✅ |
| Commit conventionnel | ❌ | ✅ | ✅ |
| Push automatique | ❌ | ❌ | ✅ |
| Workflow complet | ❌ | ❌ | ✅ |
| Config upstream auto | ❌ | ❌ | ✅ |
| Interface FR | ❌ | ❌ | ✅ |

---

## Prochaines Étapes

Vous avez maintenant compris le workflow complet ! 🎉

1. **Testez** dans un repo de test
2. **Configurez** vos types/scopes préférés
3. **Partagez** avec votre équipe
4. **Profitez** du gain de temps !

```bash
# C'est parti !
gortex
```

---

**Questions ou suggestions ?**
Ouvrez une issue sur GitHub : https://github.com/username/gortex/issues

**Bon workflow ! 🚀**
