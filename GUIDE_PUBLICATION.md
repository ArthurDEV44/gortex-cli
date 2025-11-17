# 📦 Guide de Publication npm - Première fois

Guide complet pour publier CommitFormat v1.1.0 sur npm.

---

## Étape 1 : Vérifier la disponibilité du nom

Le nom "gortex" pourrait être déjà pris sur npm.

### Action à faire :

Allez sur : https://www.npmjs.com/package/gortex

**Si la page affiche "404 - Not Found" :**
✅ Le nom est disponible ! Vous pouvez continuer.

**Si la page affiche un package existant :**
❌ Le nom est pris. Il faut choisir un autre nom.

### Options si le nom est pris :

**Option A : Package Scoped (Recommandé)**
```json
{
  "name": "@votre-username/gortex"
}
```
- Toujours disponible
- Gratuit
- Professionnel

**Option B : Nom Alternatif**
- `gortex-cli`
- `commit-format-tool`
- `git-gortex`
- `conventional-gortex`

---

## Étape 2 : Créer un compte npm

### Vous avez déjà un compte npm ?

**Oui** → Passez à l'étape 3

**Non** → Créez-en un :

### 2.1 Via le site web (Recommandé)

1. Allez sur : https://www.npmjs.com/signup
2. Remplissez le formulaire :
   - Username (sera public)
   - Email
   - Password
3. Vérifiez votre email
4. Activez 2FA (Two-Factor Authentication) - OBLIGATOIRE pour publier

### 2.2 Via le CLI

```bash
npm adduser
```

Suivez les instructions interactives.

---

## Étape 3 : Mettre à jour package.json

Ouvrez `/home/sauron/code/CommitFormat/package.json` et modifiez :

### 3.1 Nom du package (si besoin)

```json
{
  "name": "gortex",
  // OU si le nom est pris
  "name": "@votre-username/gortex"
}
```

### 3.2 Vos informations

```json
{
  "author": "Votre Nom <votre@email.com>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/VOTRE-USERNAME/gortex.git"
  },
  "bugs": {
    "url": "https://github.com/VOTRE-USERNAME/gortex/issues"
  },
  "homepage": "https://github.com/VOTRE-USERNAME/gortex#readme"
}
```

**Note :** Si vous n'avez pas encore de repo GitHub, mettez des valeurs temporaires. On créera le repo après.

---

## Étape 4 : Vérifier le package

### 4.1 Vérifier que le build est à jour

```bash
cd /home/sauron/code/CommitFormat
pnpm run build
```

Devrait afficher :
```
✅ Build success
```

### 4.2 Vérifier TypeScript

```bash
pnpm run typecheck
```

Pas d'erreurs = ✅

### 4.3 Prévisualiser le contenu du package

```bash
npm pack --dry-run
```

Vérifiez que vous voyez :
```
✓ .gortexrc.example
✓ CHANGELOG.md
✓ LICENSE
✓ README.md
✓ dist/index.js
✓ dist/index.d.ts
✓ package.json
```

**Important** : Vérifiez qu'il n'y a PAS :
- ❌ `src/` (code source)
- ❌ `node_modules/`
- ❌ Fichiers de lock

Si tout est bon ✅ → Continuez

---

## Étape 5 : Initialiser Git

### 5.1 Vérifier si Git est déjà initialisé

```bash
cd /home/sauron/code/CommitFormat
git status
```

**Si erreur "not a git repository" :**

```bash
git init
git add .
git commit -m "feat: initial release v1.1.0 - complete git workflow CLI"
```

**Si Git déjà initialisé :**

```bash
git add .
git commit -m "feat: initial release v1.1.0 - complete git workflow CLI"
```

---

## Étape 6 : Se connecter à npm

### 6.1 Vérifier si vous êtes déjà connecté

```bash
npm whoami
```

**Si ça affiche votre username** → Vous êtes connecté ✅

**Si erreur** → Vous devez vous connecter :

```bash
npm login
```

Entrez :
- Username
- Password
- Email
- Code 2FA (si activé)

### 6.2 Vérifier la connexion

```bash
npm whoami
```

Devrait afficher votre username.

---

## Étape 7 : PUBLICATION ! 🚀

### 7.1 Publication Standard

Si le nom est `gortex` (pas scoped) :

```bash
npm publish
```

### 7.2 Publication Scoped

Si le nom est `@username/gortex` :

```bash
npm publish --access public
```

**Important** : `--access public` est nécessaire pour les packages scoped gratuits.

### 7.3 Que va-t-il se passer ?

1. npm va packager votre projet
2. Uploader vers le registre npm
3. Rendre le package disponible mondialement
4. Vous recevrez un email de confirmation

**Temps estimé :** 10-30 secondes

### 7.4 Succès !

Vous verrez :
```
+ gortex@1.1.0
```

🎉 **Félicitations ! Votre package est publié !**

---

## Étape 8 : Vérification Post-Publication

### 8.1 Vérifier sur npm

Allez sur :
- https://www.npmjs.com/package/gortex
- OU https://www.npmjs.com/package/@username/gortex

Vous devriez voir :
- ✅ Votre package
- ✅ README affiché
- ✅ Version 1.1.0
- ✅ Fichiers listés

### 8.2 Tester l'installation

Dans un **nouveau terminal** (pas dans le dossier du projet) :

```bash
# Test avec npx
npx gortex@latest --help

# OU

# Test avec installation globale
npm install -g gortex
gortex --help
```

Devrait afficher l'aide de CommitFormat ✅

### 8.3 Tester dans un vrai repo

```bash
cd /tmp
mkdir test-gortex
cd test-gortex
git init
echo "test" > file.txt

# Utiliser gortex
npx gortex
```

Si ça fonctionne → **Tout est parfait !** 🎉

---

## Étape 9 : Créer un repo GitHub (Optionnel mais recommandé)

### 9.1 Créer le repo

1. Allez sur : https://github.com/new
2. Nom : `gortex`
3. Description : "CLI interactif pour un workflow Git complet"
4. Public
5. **Ne cochez RIEN** (pas de README, LICENSE, .gitignore)
6. Cliquez "Create repository"

### 9.2 Pusher votre code

```bash
cd /home/sauron/code/CommitFormat

# Ajouter le remote
git remote add origin https://github.com/VOTRE-USERNAME/gortex.git

# Pusher
git branch -M main
git push -u origin main
```

### 9.3 Créer un tag de version

```bash
git tag -a v1.1.0 -m "Release v1.1.0 - Complete Git workflow"
git push origin v1.1.0
```

### 9.4 Créer une Release GitHub

1. Allez sur votre repo GitHub
2. Cliquez "Releases" → "Create a new release"
3. Tag : `v1.1.0`
4. Title : `v1.1.0 - Complete Git Workflow`
5. Description : Copiez le contenu de `RELEASE_NOTES_v1.1.0.md`
6. Cliquez "Publish release"

---

## 🎉 C'est Terminé !

Votre package CommitFormat v1.1.0 est maintenant :
- ✅ Publié sur npm
- ✅ Accessible mondialement
- ✅ Installable avec npm/pnpm/yarn/bun
- ✅ Code source sur GitHub

### Prochaines Étapes

**Partager :**
- Twitter/X
- Reddit (r/javascript, r/node)
- Dev.to
- LinkedIn

**Monitorer :**
- Stats npm : https://www.npmjs.com/package/gortex
- Downloads : https://npm-stat.com/charts.html?package=gortex

**Maintenir :**
- Répondre aux issues GitHub
- Accepter les pull requests
- Publier les mises à jour

---

## ❓ Troubleshooting

### Erreur : "You do not have permission to publish"

**Solution :** Vous n'êtes pas connecté
```bash
npm login
npm whoami
```

### Erreur : "Package name already exists"

**Solution :** Le nom est pris
- Utilisez un package scoped : `@username/gortex`
- OU changez le nom dans package.json

### Erreur : "You must sign in with 2FA"

**Solution :** Activez 2FA sur npm
1. https://www.npmjs.com/settings/YOUR-USERNAME/tfa
2. Suivez les instructions

### Erreur : "This package has been marked as private"

**Solution :** Retirez `"private": true` du package.json

---

## 📝 Checklist Finale

Avant de publier, vérifiez :

- [ ] Nom du package disponible ou scoped
- [ ] package.json complet (author, repository, etc.)
- [ ] Build réussi (`pnpm run build`)
- [ ] TypeScript OK (`pnpm run typecheck`)
- [ ] Package preview OK (`npm pack --dry-run`)
- [ ] Git commit fait
- [ ] npm login OK (`npm whoami`)
- [ ] README à jour
- [ ] CHANGELOG à jour
- [ ] LICENSE présent

Si tout est coché → **Vous êtes prêt à publier !** 🚀

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez un problème, dites-moi et je vous aide immédiatement !

**Bon courage pour votre première publication ! 🎉**
