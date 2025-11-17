# Guide de démarrage - CommitFormat

Ce guide vous accompagne pour rendre CommitFormat production-ready.

## Prérequis

- Node.js >= 18.0.0
- Un gestionnaire de paquets : npm, pnpm, yarn ou bun
- Git installé

## Étape 1 : Installation des dépendances

Choisissez votre package manager préféré :

```bash
# Avec pnpm (recommandé)
pnpm install

# Avec npm
npm install

# Avec yarn
yarn install

# Avec bun
bun install

# Ou utilisez le script intelligent
./scripts/install.sh
```

## Étape 2 : Vérification TypeScript

Vérifiez que le code compile sans erreurs :

```bash
# Avec pnpm
pnpm run typecheck

# Avec npm
npm run typecheck

# Avec yarn
yarn typecheck

# Avec bun
bun run typecheck
```

Attendez-vous à voir : "No errors found"

## Étape 3 : Build du projet

Compilez le projet en JavaScript :

```bash
# Avec pnpm
pnpm run build

# Avec npm
npm run build

# Avec yarn
yarn build

# Avec bun
bun run build

# Ou utilisez le script intelligent
./scripts/build.sh
```

Cela créera un dossier `dist/` avec :
- `index.js` - Le CLI compilé
- `index.d.ts` - Les types TypeScript
- `*.map` - Source maps pour debugging

## Étape 4 : Test local du CLI

### Option A : Tester directement avec Node

```bash
node dist/index.js --help
```

### Option B : Créer un lien global (recommandé)

```bash
# Avec npm
npm link

# Avec pnpm
pnpm link --global

# Avec yarn
yarn link

# Avec bun
bun link
```

Ensuite testez :

```bash
gortex --help
gortex help-format
```

### Option C : Tester dans un repo Git de test

```bash
# Créez un repo de test
mkdir /tmp/test-gortex
cd /tmp/test-gortex
git init

# Créez un fichier de test
echo "test" > test.txt
git add test.txt

# Testez CommitFormat
/home/sauron/code/CommitFormat/dist/index.js

# Ou si vous avez fait npm link
gortex
```

## Étape 5 : Tests des fonctionnalités

### Test 1 : Créer un commit

```bash
cd /tmp/test-gortex
echo "modification" >> test.txt
gortex
```

Vérifiez que :
- ✅ Le prompt s'affiche
- ✅ Vous pouvez sélectionner un type
- ✅ Vous pouvez entrer une description
- ✅ Le commit est créé

### Test 2 : Installer les hooks

```bash
gortex hooks install
```

Vérifiez :
- ✅ Le hook est créé dans `.git/hooks/commit-msg`
- ✅ Le fichier est exécutable

### Test 3 : Tester le hook

Essayez de créer un commit invalide :

```bash
echo "test2" >> test.txt
git add .
git commit -m "invalid commit"
```

Attendez-vous à voir :
- ❌ Le commit est rejeté
- ✅ Un message d'erreur explicite s'affiche

Puis créez un commit valide :

```bash
git commit -m "feat: add test feature"
```

- ✅ Le commit est accepté

### Test 4 : Statistiques

```bash
gortex stats
```

Vérifiez :
- ✅ Les stats s'affichent
- ✅ Le pourcentage de conformité est correct
- ✅ Les barres de progression s'affichent

## Étape 6 : Préparation pour la production

### 6.1 Ajouter une licence

Choisissez une licence (MIT recommandé pour l'open-source).

### 6.2 Mettre à jour package.json

Ajoutez vos informations :

```json
{
  "author": "Votre Nom <email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/gortex.git"
  },
  "bugs": {
    "url": "https://github.com/username/gortex/issues"
  },
  "homepage": "https://github.com/username/gortex#readme"
}
```

### 6.3 Ajouter des tests (optionnel mais recommandé)

Installez un framework de tests :

```bash
pnpm add -D vitest @vitest/ui
```

### 6.4 Ajouter un CHANGELOG

Créez un fichier `CHANGELOG.md` pour suivre les versions.

### 6.5 Vérifier la sécurité

```bash
# Avec npm
npm audit

# Avec pnpm
pnpm audit

# Avec yarn
yarn audit

# Avec bun
bun audit
```

## Étape 7 : Publication sur npm

### 7.1 Créer un compte npm

Si vous n'en avez pas :
```bash
npm adduser
```

### 7.2 Vérifier le package

```bash
npm pack --dry-run
```

Cela montre ce qui sera publié.

### 7.3 Publier

```bash
npm publish
```

**Important** : Vérifiez que le nom "gortex" est disponible sur npm. Sinon, changez le nom dans `package.json`.

### 7.4 Tester l'installation depuis npm

```bash
# Dans un autre terminal
npx gortex@latest
```

## Étape 8 : Maintenance continue

### Mettre à jour la version

```bash
# Version patch (1.0.0 -> 1.0.1)
npm version patch

# Version minor (1.0.0 -> 1.1.0)
npm version minor

# Version major (1.0.0 -> 2.0.0)
npm version major
```

Puis republier :

```bash
npm publish
```

### Créer un tag Git

```bash
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

## Checklist production-ready

- [ ] Dépendances installées
- [ ] TypeScript compile sans erreurs
- [ ] Build réussi (dossier dist/ créé)
- [ ] CLI testé en local
- [ ] Commit interactif fonctionne
- [ ] Hooks Git fonctionnent
- [ ] Stats s'affichent correctement
- [ ] Licence ajoutée
- [ ] package.json complété (author, repository, etc.)
- [ ] CHANGELOG.md créé
- [ ] Aucune vulnérabilité de sécurité
- [ ] Tests ajoutés (optionnel)
- [ ] Documentation à jour
- [ ] Nom du package disponible sur npm
- [ ] Package publié sur npm
- [ ] Version tagguée sur Git

## Troubleshooting

### "Cannot find module"

Assurez-vous d'avoir build le projet :
```bash
pnpm run build
```

### "Permission denied"

Rendez le script exécutable :
```bash
chmod +x dist/index.js
```

### Le CLI ne se lance pas

Vérifiez le shebang dans dist/index.js :
```bash
head -n 1 dist/index.js
# Devrait afficher : #!/usr/bin/env node
```

### Les hooks Git ne fonctionnent pas

Vérifiez les permissions :
```bash
ls -la .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

## Ressources

- [npm publishing guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Support

Si vous rencontrez des problèmes :
1. Vérifiez cette documentation
2. Consultez les issues GitHub
3. Créez une nouvelle issue avec les détails de votre problème
