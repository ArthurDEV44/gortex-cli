# 🌿 Gestion Avancée des Branches

CommitFormat v1.1.0 inclut une gestion complète et flexible des branches Git !

## Fonctionnalités

### 📍 Étape 1 Améliorée

L'étape 1 du workflow vous permet maintenant de :

1. ✅ **Voir la branche actuelle** avec badge visuel
2. ✅ **Choisir parmi vos branches existantes**
3. ✅ **Créer une nouvelle branche** directement
4. ✅ **Confirmer votre choix** avant de continuer
5. ✅ **Changer d'avis** et revenir en arrière autant de fois que nécessaire

---

## Interface Détaillée

### 1️⃣ Affichage Initial

```bash
📍 Étape 1/5: Sélection de la branche
   Branche actuelle: main

? Que voulez-vous faire ? (Use arrow keys)
❯ main (actuelle)
  feature/new-api
  develop
  ➕ Créer une nouvelle branche
```

**Ce qui s'affiche :**
- 🔵 Branche actuelle avec badge `(actuelle)` en vert
- 📋 Liste de toutes vos branches locales
- ➕ Option pour créer une nouvelle branche

---

### 2️⃣ Sélection d'une Branche Existante

#### Choix de la branche actuelle

```bash
? Que voulez-vous faire ? main (actuelle)
   → Branche: main

? Continuer avec cette branche ? (Y/n) Yes

   ✅ Branche finale: main
```

**Résultat :** Reste sur la branche actuelle

#### Changement vers une autre branche

```bash
? Que voulez-vous faire ? feature/new-api
   ✓ Basculé sur la branche: feature/new-api

? Continuer avec cette branche ? (Y/n) Yes

   ✅ Branche finale: feature/new-api
```

**Résultat :** Bascule automatiquement vers `feature/new-api`

---

### 3️⃣ Création d'une Nouvelle Branche

#### Workflow de création

```bash
? Que voulez-vous faire ? ➕ Créer une nouvelle branche

? Nom de la nouvelle branche: feature/awesome-feature
   ✓ Branche "feature/awesome-feature" créée et active

? Continuer avec cette branche ? (Y/n) Yes

   ✅ Branche finale: feature/awesome-feature
```

**Résultat :** Nouvelle branche créée et activée

#### Validations Automatiques

Le CLI valide automatiquement votre nom de branche :

**❌ Nom vide**
```bash
? Nom de la nouvelle branche:
>> Le nom de la branche ne peut pas être vide
```

**❌ Espaces**
```bash
? Nom de la nouvelle branche: my awesome branch
>> Le nom de la branche ne peut pas contenir d'espaces
```

**❌ Branche existante**
```bash
? Nom de la nouvelle branche: main
>> La branche "main" existe déjà
```

**✅ Nom valide**
```bash
? Nom de la nouvelle branche: feature/new-api
   ✓ Branche "feature/new-api" créée et active
```

---

### 4️⃣ Changer d'Avis (Loop Interactif)

#### Scénario 1 : Créer puis changer de branche

```bash
# Création d'une branche
? Que voulez-vous faire ? ➕ Créer une nouvelle branche
? Nom de la nouvelle branche: feature/test
   ✓ Branche "feature/test" créée et active

# Changement d'avis
? Continuer avec cette branche ? No

   ↻ Retour à la sélection de branche...

   Branche actuelle: feature/test

# Retour au menu
? Que voulez-vous faire ?
❯ main
  feature/test (actuelle)
  ➕ Créer une nouvelle branche

# Choix d'une autre branche
? Que voulez-vous faire ? main
   ✓ Basculé sur la branche: main

? Continuer avec cette branche ? Yes
   ✅ Branche finale: main
```

#### Scénario 2 : Changer plusieurs fois

```bash
# Première sélection
? Que voulez-vous faire ? feature/api
   ✓ Basculé sur la branche: feature/api

? Continuer avec cette branche ? No
   ↻ Retour à la sélection de branche...

# Deuxième sélection
? Que voulez-vous faire ? develop
   ✓ Basculé sur la branche: develop

? Continuer avec cette branche ? No
   ↻ Retour à la sélection de branche...

# Troisième sélection (la bonne !)
? Que voulez-vous faire ? main
   ✓ Basculé sur la branche: main

? Continuer avec cette branche ? Yes
   ✅ Branche finale: main
```

**Vous pouvez changer autant de fois que vous voulez !**

---

## Cas d'Usage

### 🎯 Cas 1 : Feature rapide

```bash
gortex

# Étape 1
? Que voulez-vous faire ? ➕ Créer une nouvelle branche
? Nom de la nouvelle branche: feature/quick-fix
? Continuer avec cette branche ? Yes

# Étapes 2-5 : Fichiers, commit, push...
```

**Résultat :** Nouvelle branche créée, commit fait, code pushé !

---

### 🎯 Cas 2 : Tester différentes branches

```bash
gortex

# Test branche 1
? Que voulez-vous faire ? feature/a
? Continuer avec cette branche ? No

# Test branche 2
? Que voulez-vous faire ? feature/b
? Continuer avec cette branche ? No

# Choix final
? Que voulez-vous faire ? develop
? Continuer avec cette branche ? Yes
```

**Résultat :** Facilité de navigation entre branches avant de commiter

---

### 🎯 Cas 3 : Création puis annulation

```bash
gortex

# Création
? Que voulez-vous faire ? ➕ Créer une nouvelle branche
? Nom de la nouvelle branche: feature/test-branch
   ✓ Branche "feature/test-branch" créée

# Changement d'avis
? Continuer avec cette branche ? No
   ↻ Retour à la sélection...

# Retour à main
? Que voulez-vous faire ? main
   ✓ Basculé sur la branche: main
```

**Note :** La branche `feature/test-branch` existe toujours localement, mais vous n'êtes plus dessus.

---

## Conventions de Nommage

### Recommandations

**✅ Bonnes pratiques :**
```bash
feature/new-login
fix/bug-123
hotfix/critical-error
release/v1.2.0
docs/update-readme
```

**❌ À éviter :**
```bash
my branch          # Espaces
test               # Trop vague
FEATURE-NEW        # Tout en majuscules
feature\\new       # Caractères spéciaux
```

### Patterns Courants

| Type | Pattern | Exemple |
|------|---------|---------|
| Feature | `feature/description` | `feature/user-auth` |
| Bug Fix | `fix/description` | `fix/login-error` |
| Hotfix | `hotfix/description` | `hotfix/critical-bug` |
| Release | `release/version` | `release/v2.0.0` |
| Docs | `docs/description` | `docs/api-guide` |
| Refactor | `refactor/description` | `refactor/clean-code` |

---

## Intégration Git

### Équivalents Git

**Sélection branche existante :**
```bash
# CommitFormat
? Que voulez-vous faire ? feature/api

# Équivaut à
git checkout feature/api
```

**Création nouvelle branche :**
```bash
# CommitFormat
? Nom de la nouvelle branche: feature/new

# Équivaut à
git checkout -b feature/new
```

**Retour arrière :**
```bash
# CommitFormat
? Continuer avec cette branche ? No

# Permet de refaire
git checkout autre-branche
```

---

## Avantages

### 🚀 Avant (Git classique)

```bash
git branch                    # Voir les branches
git checkout -b feature/new   # Créer et basculer
git checkout main             # Oups, mauvaise branche
git checkout develop          # Re-mauvaise branche
git checkout feature/new      # Enfin la bonne !
```

**5 commandes** pour trouver la bonne branche

### ✅ Maintenant (CommitFormat)

```bash
gortex

# Interface interactive
# Essayer plusieurs branches
# Confirmer quand satisfait
```

**1 commande**, interface guidée, impossible de se tromper !

---

## Questions Fréquentes

### Q: Que se passe-t-il si j'annule après avoir créé une branche ?

**R:** La branche existe toujours localement, mais vous basculez vers celle que vous choisissez ensuite. Vous pouvez y revenir ou la supprimer manuellement avec `git branch -d nom-branche`.

### Q: Puis-je créer une branche depuis une autre branche que main ?

**R:** Oui ! La nouvelle branche est créée depuis la branche actuelle au moment de la création.

### Q: Combien de fois puis-je changer d'avis ?

**R:** Autant que vous voulez ! La boucle continue jusqu'à ce que vous confirmiez avec "Yes".

### Q: La branche est-elle automatiquement pushée vers le remote ?

**R:** Non, la branche est créée localement. Vous déciderez de pusher à l'étape 5 du workflow.

### Q: Puis-je utiliser des caractères spéciaux dans le nom ?

**R:** Les caractères usuels Git sont acceptés (`-`, `/`, `_`, `.`). Les espaces et caractères spéciaux sont interdits.

---

## Résumé

L'étape 1 de CommitFormat est maintenant un **gestionnaire de branches complet** :

✅ Visualisation claire
✅ Création facile
✅ Navigation flexible
✅ Validation automatique
✅ Retour arrière illimité

**Fini les erreurs de branche ! Workflow parfait à chaque fois.** 🎯

---

**Voir aussi :**
- [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) - Guide complet du workflow
- [README.md](./README.md) - Documentation principale
