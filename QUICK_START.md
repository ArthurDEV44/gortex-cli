# Quick Start - CommitFormat

Guide rapide pour démarrer avec CommitFormat en 5 minutes.

## 🚀 Démarrage rapide (pour vous, le développeur)

### 1. Installation des dépendances

```bash
cd /home/sauron/code/CommitFormat
pnpm install
```

### 2. Build du projet

```bash
pnpm run build
```

### 3. Tester localement

```bash
# Créer un repo de test
mkdir /tmp/test-gortex
cd /tmp/test-gortex
git init
echo "test" > test.txt

# Utiliser CommitFormat
node /home/sauron/code/CommitFormat/dist/index.js
```

### 4. Installer globalement (optionnel)

```bash
cd /home/sauron/code/CommitFormat
pnpm link --global

# Maintenant utilisable partout
gortex --help
```

## 📝 Commandes principales

```bash
# Mode dev (avec hot reload)
pnpm run dev

# Build
pnpm run build

# Vérification TypeScript
pnpm run typecheck

# Lancer le CLI
pnpm start
# ou
node dist/index.js
```

## 🎯 Tester toutes les fonctionnalités

### Test 1 : Créer un commit

```bash
cd /tmp/test-gortex
echo "modification" >> test.txt
gortex
```

Suivez les prompts et créez un commit.

### Test 2 : Installer les hooks

```bash
gortex hooks install
```

Essayez de créer un commit invalide :

```bash
echo "test2" >> test.txt
git add .
git commit -m "invalid"  # ❌ Devrait être rejeté
git commit -m "feat: valid commit"  # ✅ Devrait passer
```

### Test 3 : Voir les stats

```bash
gortex stats
```

### Test 4 : Aide

```bash
gortex --help
gortex help-format
```

## 📦 Avant publication

Checklist :

1. ✅ Code compilé : `pnpm run typecheck`
2. ✅ Build réussi : `pnpm run build`
3. ✅ CLI testé : `node dist/index.js --help`
4. ✅ Hooks testés dans un vrai repo Git
5. ✅ Stats testées
6. 🔄 Nom du package disponible sur npm
7. 🔄 Compte npm créé
8. 🔄 package.json mis à jour (author, repository)

## 🚢 Publication sur npm

Voir le guide complet : [PUBLICATION.md](./PUBLICATION.md)

Résumé ultra-rapide :

```bash
# 1. Vérifier le package
npm pack --dry-run

# 2. Se connecter à npm
npm login

# 3. Publier
npm publish

# 4. Tester
npx gortex@latest --help
```

## 📚 Documentation

- **README.md** - Documentation utilisateur complète
- **GETTING_STARTED.md** - Guide pas à pas pour rendre production-ready
- **PACKAGE_MANAGERS.md** - Guide complet npm/pnpm/yarn/bun
- **PUBLICATION.md** - Guide détaillé de publication npm
- **CHANGELOG.md** - Historique des versions

## 🛠️ Structure du projet

```
CommitFormat/
├── src/                    # Code source TypeScript
│   ├── commands/          # Commandes CLI
│   ├── utils/             # Utilitaires
│   ├── cli.ts             # Configuration Commander
│   ├── index.ts           # Point d'entrée
│   └── types.ts           # Types
├── dist/                  # Code compilé (après build)
├── scripts/               # Scripts intelligents
├── package.json           # Configuration npm
├── tsconfig.json          # Configuration TypeScript
└── tsup.config.ts         # Configuration build

Fichiers importants :
├── .npmignore             # Fichiers exclus du package npm
├── .gortexrc.example # Exemple de config
├── LICENSE                # Licence MIT
├── CHANGELOG.md           # Historique
└── README.md              # Documentation
```

## 🎓 Prochaines étapes

1. **Tests** : Ajouter des tests unitaires avec Vitest
2. **CI/CD** : Configurer GitHub Actions
3. **Features** : Voir CHANGELOG.md pour les idées

## ❓ Problèmes courants

### Le CLI ne se lance pas

```bash
# Vérifier le build
ls -la dist/

# Rebuild
pnpm run build

# Vérifier le shebang
head -n 1 dist/index.js
# Devrait afficher : #!/usr/bin/env node
```

### TypeScript errors

```bash
pnpm run typecheck
# Corrigez les erreurs affichées
```

### Package manager issues

Utilisez le script intelligent :

```bash
./scripts/install.sh
./scripts/build.sh
./scripts/dev.sh
```

## 💡 Astuces

### Alias rapide (Bash/Zsh)

Ajoutez dans `~/.bashrc` ou `~/.zshrc` :

```bash
alias cf='gortex'
```

Puis :

```bash
source ~/.bashrc
cf --help
```

### Développement

Pour tester rapidement vos changements :

```bash
# Terminal 1 : Watch mode
pnpm run dev

# Terminal 2 : Tester
cd /tmp/test-repo
/home/sauron/code/CommitFormat/dist/index.js
```

### Debug

Activez les logs de debug :

```bash
DEBUG=* node dist/index.js
```

## 🎉 C'est prêt !

CommitFormat est maintenant production-ready !

Pour publier : Suivez [PUBLICATION.md](./PUBLICATION.md)

Pour développer : Modifiez `src/`, puis `pnpm run build`

Pour contribuer : Utilisez CommitFormat pour vos commits ! 😉

```bash
# Dans le repo CommitFormat lui-même
git add .
gortex
```

---

**Bon développement !** 🚀
